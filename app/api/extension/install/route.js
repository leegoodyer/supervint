import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const runtime = 'nodejs';

const kv = Redis.fromEnv();

// POST /api/extension/install
// Reported by the extension itself on chrome.runtime.onInstalled (reason=install).
// This is the authoritative "real install" counter — independent of Google's
// delayed dashboard and the GA4 listing-page property (which counts viewers).
//
// Since 2026-08-11 — also stores rudimentary install metadata (country from
// Vercel's geo header) so the admin panel can show WHERE installs come from
// even when the attribution cookie is missing.
export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { body = {}; }

  const clientId = typeof body?.clientId === 'string' ? body.clientId.trim() : '';
  if (!clientId) {
    return NextResponse.json({ error: 'clientId required' }, { status: 400 });
  }

  const day = new Date().toISOString().slice(0, 10);
  const ts  = Number(body.ts) || Date.now();
  const country = (request.headers.get('x-vercel-ip-country') || '').slice(0, 2) || null;

  // Store: sv:install:clientId -> {ts, country, version} (dedupe: an install
  // fires once per clientId, but an UPDATE fires with reason=update — we
  // still refresh version/ts so the admin panel always sees the latest build
  // even for users who never started a search).
  //        sv:install:day:YYYY-MM-DD -> count (daily install counter)
  //        sv:installs -> total count
  const key       = `sv:install:${clientId}`;
  const existing  = await kv.get(key);
  const version   = typeof body?.version === 'string' ? body.version.slice(0, 20) : null;
  const updated   = { ts, country, ...(version ? { version } : {}) };
  if (!existing) {
    await kv.set(key, updated);
    await kv.incr(`sv:install:day:${day}`);
    await kv.incr('sv:installs');
  } else if (version && existing.version !== version) {
    // Reinstall / update under the same clientId — refresh version + ts so
    // idle users still report which build they're on.
    await kv.set(key, { ...existing, ...updated });
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
