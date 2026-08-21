import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const runtime = 'nodejs';

const kv = Redis.fromEnv();

// ─── Web Push subscription storage ───────────────────────────────────────────
// The extension registers a Web Push subscription (PushManager.subscribe with
// our VAPID public key) and POSTs it here keyed by clientId, so the admin
// broadcast endpoint can later send a notification to that user's computer.
// POST is open (same trust level as /api/sold / help-chat — extension clients
// identify by opaque clientId). One subscription per client is stored.

const KEY_PREFIX = 'sv:push:sub:';

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { body = {}; }

  const clientId = typeof body?.clientId === 'string' ? body.clientId.slice(0, 64) : '';
  const sub      = body?.subscription;

  if (!clientId || !sub || typeof sub !== 'object') {
    return NextResponse.json({ ok: false, error: 'clientId and subscription are required' }, { status: 400 });
  }

  // Basic shape validation — a valid PushSubscription has a string endpoint
  // plus keys.p256dh and keys.auth (base64 strings).
  if (typeof sub.endpoint !== 'string' || !sub.keys || typeof sub.keys.p256dh !== 'string' || typeof sub.keys.auth !== 'string') {
    return NextResponse.json({ ok: false, error: 'invalid subscription' }, { status: 400 });
  }

  const record = {
    endpoint: sub.endpoint,
    keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    ts: Date.now(),
  };

  await kv.set(`${KEY_PREFIX}${clientId}`, JSON.stringify(record));

  return NextResponse.json({ ok: true });
}
