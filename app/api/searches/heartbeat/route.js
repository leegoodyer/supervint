import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const runtime = 'nodejs';

const kv = Redis.fromEnv();
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Heartbeat — the extension POSTs this on every poll cycle so the server
// knows it's alive (and what each search's last result was). The hourly
// monitor cron reads it: fresh = still working, stale = stopped/orange.
// GET /api/searches/heartbeat?clientId=... -> { at, searches }
// POST /api/searches/heartbeat {clientId, searches} -> { ok }

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET(request) {
  const url = new URL(request.url);
  const clientId = (url.searchParams.get('clientId') || '').trim();
  if (!clientId || clientId.length < 8 || clientId.length > 128) {
    return NextResponse.json({ error: 'Invalid clientId' }, { status: 400, headers: CORS });
  }
  const data = await kv.get(`sv:heartbeat:${clientId}`);
  return NextResponse.json(data ?? { at: null, searches: [] }, { headers: CORS });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS });
  }
  const clientId = typeof body?.clientId === 'string' ? body.clientId.trim() : '';
  if (!clientId || clientId.length < 8 || clientId.length > 128) {
    return NextResponse.json({ error: 'Invalid clientId' }, { status: 400, headers: CORS });
  }
  const raw = Array.isArray(body?.searches) ? body.searches.slice(0, 50) : [];
  const searches = raw.map(s => ({
    id:             String(s?.id ?? ''),
    enabled:        !!s?.enabled,
    lastPollTime:   s?.lastPollTime ?? null,
    lastPollResult: s?.lastPollResult ?? null,
  })).filter(s => s.id);
  await kv.set(`sv:heartbeat:${clientId}`, { at: Date.now(), searches });
  return NextResponse.json({ ok: true }, { headers: CORS });
}
