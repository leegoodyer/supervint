import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { isAdminAuthed } from '@/lib/admin-auth';

export const runtime = 'nodejs';

const kv = Redis.fromEnv();

// ─── Sold-history harvest telemetry (2026-08-17) ─────────────────────────────
// The extension's weekly sold-harvest (my_orders → shared DB) reports its
// outcome here so we can observe the crowd-source engine end-to-end: which
// client ran it, how many orders it found vs harvested, and any error (e.g.
// logged-out/auth-blip). POST is open (the /api/sold family already trusts
// extension clients); GET is admin-only for reading the log.

const KEY = 'sv:harvest:log';
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
  await kv.lpush(KEY, JSON.stringify(entry));
  await kv.ltrim(KEY, 0, MAX - 1);

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const ok = await isAdminAuthed();
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const raw = await kv.lrange(KEY, 0, MAX - 1);
  const entries = raw.map(r => { try { return JSON.parse(r); } catch { return null; } }).filter(Boolean);
  return NextResponse.json({ ok: true, entries });
}
