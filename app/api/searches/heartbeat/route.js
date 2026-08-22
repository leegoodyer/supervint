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
    label:          String(s?.label ?? '').slice(0, 80),
    enabled:        !!s?.enabled,
    lastPollTime:   s?.lastPollTime ?? null,
    lastPollResult: s?.lastPollResult ?? null,
    trackedItemCount:  s?.trackedItemCount ?? null,
    newItemsLastCount: s?.newItemsLastCount ?? null,
  })).filter(s => s.id);
  // Store the offscreen session-warm diagnostics (if the extension sent any)
  // so the monitor can see WHY the session warm is/isn't holding.
  const record = {
    at: Date.now(),
    searches,
    version: typeof body?.version === 'string' ? body.version.slice(0, 30) : null,
    offscreenPingAgoMs: typeof body?.offscreenPingAgoMs === 'number' ? body.offscreenPingAgoMs : null,
    offscreenVersion: typeof body?.offscreenVersion === 'string' ? body.offscreenVersion.slice(0, 30) : null,
  };
  if (body?.offscreenDiag && typeof body.offscreenDiag === 'object') {
    record.offscreenDiag = {
      created: !!body.offscreenDiag.created,
      attempt: body.offscreenDiag.attempt ?? null,
      error:   body.offscreenDiag.error ?? null,
      ts:      body.offscreenDiag.ts ?? null,
    };
  }
  if (body?.warmSummary && typeof body.warmSummary === 'object') {
    record.warmSummary = {
      attempts:     Number(body.warmSummary.attempts ?? 0),
      ok:           Number(body.warmSummary.ok ?? 0),
      failed:       Number(body.warmSummary.failed ?? 0),
      lastStatus:   body.warmSummary.lastStatus ?? null,
      lastError:    body.warmSummary.lastError ?? null,
      lastWarmAgoMs: body.warmSummary.lastWarmAgoMs ?? null,
    };
  }
  if (Array.isArray(body?.warmLog)) {
    record.warmLog = body.warmLog.slice(-10).map(e => ({
      ts:      e?.ts ?? null,
      ok:      !!e?.ok,
      status:  e?.status ?? null,
      error:   e?.error ?? null,
      finalUrl: e?.finalUrl ?? null,
    }));
  }
  await kv.set(`sv:heartbeat:${clientId}`, record);
  return NextResponse.json({ ok: true }, { headers: CORS });
}
