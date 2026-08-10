import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const runtime = 'nodejs';

const kv = Redis.fromEnv();

// POST /api/attribution — store install attribution for a clientId.
// Body: { clientId, utm_source?, utm_medium?, utm_campaign?, utm_content?,
//         utm_term?, fbclid?, gclid?, ts? }
//
// Called from TWO places (first write wins — never clobbered):
//   1. The extension itself at install time, reading the sv_attribution
//      cookie set by the landing page (chrome.cookies).
//   2. The /welcome page after install, reading localStorage.
// Fallback for missing params is handled by callers; this endpoint just
// stores what it's given, keyed by clientId.
export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { body = {}; }

  const clientId = typeof body?.clientId === 'string' ? body.clientId.trim() : '';
  if (!clientId) {
    return NextResponse.json({ error: 'clientId required' }, { status: 400 });
  }

  const KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content',
                'utm_term', 'fbclid', 'gclid'];
  const attrib = { ts: Number(body.ts) || Date.now() };
  for (const k of KEYS) {
    const v = body[k];
    if (typeof v === 'string' && v.trim()) attrib[k] = v.trim().slice(0, 500);
  }

  const key = `sv:attrib:${clientId}`;

  // First attribution wins — do not overwrite an existing record.
  const existing = await kv.get(key);
  if (existing) {
    return NextResponse.json({ ok: true, stored: false, reason: 'already exists', attribution: existing });
  }

  // Only store if we actually captured something.
  if (Object.keys(attrib).length <= 1) {
    return NextResponse.json({ ok: true, stored: false, reason: 'no attribution params' });
  }

  await kv.set(key, attrib);
  return NextResponse.json({ ok: true, stored: true, attribution: attrib });
}

// GET /api/attribution?clientId=xxx — read back for admin/debug.
export async function GET(request) {
  const clientId = new URL(request.url).searchParams.get('clientId');
  if (!clientId) {
    return NextResponse.json({ error: 'clientId required' }, { status: 400 });
  }
  const attrib = await kv.get(`sv:attrib:${clientId}`);
  return NextResponse.json({ attribution: attrib || null });
}
