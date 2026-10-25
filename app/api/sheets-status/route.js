import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { isAdminAuthed } from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const kv = Redis.fromEnv();

// ─── Google Sheets usage telemetry (2026-10-25) ─────────────────────────────
// The extension's Sheets state (connected/not) has always lived ONLY on the
// user's device (chrome.storage.local/sync) — the server had zero visibility
// into whether paying Reseller/Power Seller customers actually use the Sheets
// perk. This endpoint receives a fire-and-forget ping when a user connects or
// disconnects Sheets, and stores the latest state per client so admin can see
// real adoption. POST is open (same trust model as /api/sold + /api/extension/
// harvest-log); GET is admin-only readback.
//
// Storage: sv:sheets:<clientId> = { connected, linkedEmail, ts }. One key per
// client, overwritten on each report — no key-scan, no unbounded growth. A zset
// index (sv:sheets:recent) tracks recency for the admin readback, mirroring the
// harvest-log pattern that avoids Upstash's "too many keys" key-scan limit.

const KEY_PREFIX = 'sv:sheets:';
const ZSET       = 'sv:sheets:recent';
const MAX        = 200;

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { body = {}; }

  const clientId    = typeof body?.clientId === 'string' ? body.clientId.slice(0, 64) : '';
  const connected   = !!body?.connected;
  const linkedEmail = typeof body?.linkedEmail === 'string' ? body.linkedEmail.slice(0, 120) : '';

  if (!clientId) return NextResponse.json({ ok: false, error: 'missing clientId' }, { status: 400 });

  const entry = { clientId, connected, linkedEmail, ts: Date.now() };
  await kv.set(`${KEY_PREFIX}${clientId}`, JSON.stringify(entry), { ex: 180 * 24 * 3600 });
  await kv.zadd(ZSET, { score: entry.ts, member: clientId });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const ok = await isAdminAuthed();
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Read the most-recently-reported clients (descending by last report), then
  // fetch each client's current state key. Bounded by MAX — no key-scan.
  let entries = [];
  try {
    const size  = await kv.zcard(ZSET);
    if (size > 0) {
      const start   = Math.max(0, size - MAX);
      const members = await kv.zrange(ZSET, start, size - 1);
      const newestFirst = members.reverse();
      const keys = newestFirst.map(id => `${KEY_PREFIX}${id}`);
      const raws = keys.length ? await kv.mget(...keys) : [];
      entries = raws
        .map(r => {
          if (!r) return null;
          if (typeof r === 'string') { try { return JSON.parse(r); } catch { return null; } }
          return r;
        })
        .filter(Boolean);
    }
  } catch (err) {
    return NextResponse.json({ ok: true, entries: [], error: String(err?.message || err).slice(0, 120) });
  }

  const connected = entries.filter(e => e.connected).length;
  return NextResponse.json({ ok: true, total: entries.length, connected, entries });
}
