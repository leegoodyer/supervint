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
// Storage: one key per harvest entry (sv:harvest:entry:<ts>:<clientId>), read
// back via keys()+mget(). This is the SAME pattern the working sold-stats
// endpoint uses. The original list-based (lpush/lrange) approach silently
// failed the write→read round-trip, so the log always showed empty even
// though the harvest itself ran fine — this fixes that observability gap.

const PREFIX = 'sv:harvest:entry:';
const MAX = 50;

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
  await kv.set(`${PREFIX}${entry.ts}:${clientId}`, JSON.stringify(entry), { ex: 90 * 24 * 3600 });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const ok = await isAdminAuthed();
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const keys = await kv.keys(`${PREFIX}*`);
  // Newest first: sort keys descending by timestamp prefix.
  keys.sort((a, b) => {
    const ta = Number(a.split(':')[2]) || 0;
    const tb = Number(b.split(':')[2]) || 0;
    return tb - ta;
  });

  const limited = keys.slice(0, MAX);
  const raws = limited.length ? await kv.mget(...limited) : [];
  const entries = raws
    .map(r => {
      if (!r) return null;
      if (typeof r === 'string') { try { return JSON.parse(r); } catch { return null; } }
      return r;
    })
    .filter(Boolean);

  return NextResponse.json({ ok: true, entries });
}
