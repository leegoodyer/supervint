import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { isAdminAuthed } from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const kv = Redis.fromEnv();

// ─── Sold-history harvest telemetry (2026-08-17) ─────────────────────────────
// The extension's weekly sold-harvest (my_orders → shared DB) reports its
// outcome here so we can observe the crowd-source engine end-to-end: which
// client ran it, how many orders it found vs harvested, and any error (e.g.
// logged-out/auth-blip). POST is open (the /api/sold family already trusts
// extension clients); GET is admin-only for reading the log.
//
// STORAGE (FIXED 2026-10-21): the original read used kv.keys('sv:harvest:entry:*')
// + mget — the SAME key-scan pattern that broke sold-stats once the sold DB grew
// past Upstash's "too many keys" limit, which is why this GET returned HTTP 500
// for weeks while the harvest itself worked fine. Switched to a zset index
// (sv:harvest:recent, score = ts) exactly like the working sold-stats endpoint.
// Each entry is still stored as a value at sv:harvest:entry:<ts>:<clientId> so
// mget can read the bodies; the zset only holds the ordered key list.

const PREFIX = 'sv:harvest:entry:';
const ZSET   = 'sv:harvest:recent';
const MAX    = 50;

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { body = {}; }

  const clientId = typeof body?.clientId === 'string' ? body.clientId.slice(0, 64) : 'unknown';
  const found     = Number(body?.found) || 0;
  const harvested = Number(body?.harvested) || 0;
  const skipped   = Number(body?.skipped) || 0;
  const error     = typeof body?.error === 'string' ? body.error.slice(0, 200) : '';

  const entry = { clientId, found, harvested, skipped, error, ts: Date.now() };
  // Timestamp-sortable key; clientId suffix prevents a collision if two
  // clients report in the same millisecond.
  const key = `${PREFIX}${entry.ts}:${clientId}`;
  await kv.set(key, JSON.stringify(entry), { ex: 90 * 24 * 3600 });
  // Index the key in the recency zset so GET never has to key-scan.
  await kv.zadd(ZSET, { score: entry.ts, member: key });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const ok = await isAdminAuthed();
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Newest-first: read the tail of the ascending zset (highest score = newest),
  // then reverse. Bounded to MAX, so no unbounded key scan.
  let entries = [];
  try {
    const size  = await kv.zcard(ZSET);
    if (size > 0) {
      const start   = Math.max(0, size - MAX);
      const members = await kv.zrange(ZSET, start, size - 1); // ascending
      const newestFirst = members.reverse();
      const raws = newestFirst.length ? await kv.mget(...newestFirst) : [];
      entries = raws
        .map(r => {
          if (!r) return null;
          if (typeof r === 'string') { try { return JSON.parse(r); } catch { return null; } }
          return r;
        })
        .filter(Boolean);
    }
  } catch (err) {
    // Never 500 the whole read on a transient index hiccup — return what we have.
    return NextResponse.json({ ok: true, entries: [], error: String(err?.message || err).slice(0, 120) });
  }

  return NextResponse.json({ ok: true, entries });
}
