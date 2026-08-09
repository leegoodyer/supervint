import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const runtime = 'nodejs';

const kv = Redis.fromEnv();

// POST /api/extension/install
// Reported by the extension itself on chrome.runtime.onInstalled (reason=install).
// This is the authoritative "real install" counter — independent of Google's
// delayed dashboard and the GA4 listing-page property (which counts viewers).
export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { body = {}; }

  const clientId = typeof body?.clientId === 'string' ? body.clientId.trim() : '';
  if (!clientId) {
    return NextResponse.json({ error: 'clientId required' }, { status: 400 });
  }

  const day = new Date().toISOString().slice(0, 10);
  const ts  = Number(body.ts) || Date.now();

  // Store: sv:install:clientId -> timestamp (dedupe: an install fires once per clientId)
  //        sv:install:day:YYYY-MM-DD -> count (daily install counter)
  //        sv:installs -> total count
  const key       = `sv:install:${clientId}`;
  const existing  = await kv.get(key);
  if (!existing) {
    await kv.set(key, ts);
    await kv.incr(`sv:install:day:${day}`);
    await kv.incr('sv:installs');
  }

  return NextResponse.json({ ok: true, firstInstall: !existing });
}

// GET /api/extension/install?days=28 — aggregate install counts for reporting.
export async function GET(request) {
  const days = Math.min(Math.max(parseInt(new URL(request.url).searchParams.get('days') || '28', 10), 1), 90);
  const out = { total: 0, byDay: {} };
  const total = await kv.get('sv:installs');
  out.total = Number(total || 0);

  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dayKey = `sv:install:day:${d.toISOString().slice(0, 10)}`;
    const c = await kv.get(dayKey);
    out.byDay[d.toISOString().slice(0, 10)] = Number(c || 0);
  }
  return NextResponse.json(out);
}
