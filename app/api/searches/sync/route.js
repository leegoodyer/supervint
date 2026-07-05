import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const runtime = 'nodejs';

const kv = Redis.fromEnv();
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Backup layer only — never the source of truth during normal operation.
// The extension's local chrome.storage.local stays authoritative; this is
// just what gets pulled back on a reinstall/new device via the account/email
// merge (or directly, via /api/searches/status, if local storage is ever
// cleared without a full uninstall).
const MAX_SEARCHES = 50;
const DEF_FIELDS = ['id', 'label', 'searchUrl', 'activeHoursStart', 'activeHoursEnd', 'urgentPriceThreshold', 'dailyCap'];

function sanitizeSearch(s) {
  const out = {};
  for (const field of DEF_FIELDS) out[field] = s?.[field] ?? null;
  return out;
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
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

  const searches = Array.isArray(body?.searches)
    ? body.searches.slice(0, MAX_SEARCHES).map(sanitizeSearch)
    : [];

  await kv.set(`sv:searches:${clientId}`, { searches, updatedAt: Date.now() });

  return NextResponse.json({ ok: true }, { headers: CORS });
}
