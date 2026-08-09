import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const runtime = 'nodejs';

const kv = Redis.fromEnv();

// POST /api/capi — relay extension events to Meta Conversions API.
// The extension (or this server, for Stripe-verified purchases) sends a
// lightweight event payload; this route enriches it (IP, UA, hashed email)
// and forwards to Meta with event_id dedup. Keeps the Meta token server-side.
//
// Body: {
//   eventName: 'Install' | 'Signup' | 'Purchase' | 'search_created' | ...,
//   clientId: string,          // extension clientId (external_id)
//   email?: string,            // plain — hashed here
//   value?: number, currency?: string,  // for Purchase
//   contentName?: string,      // e.g. 'reseller'
//   fbp?: string, fbc?: string, // Meta cookies from landing page (raw, unhashed)
//   url?: string,              // page URL if available
// }
export async function POST(request) {
  const PIXEL_ID = process.env.META_PIXEL_ID;
  const TOKEN    = process.env.META_CAPI_TOKEN;
  if (!PIXEL_ID || !TOKEN) {
    return NextResponse.json({ error: 'Meta CAPI not configured' }, { status: 500 });
  }

  let body;
  try { body = await request.json(); } catch { body = {}; }

  const eventName = String(body.eventName || '');
  const clientId  = String(body.clientId || '');
  if (!eventName || !clientId) {
    return NextResponse.json({ error: 'eventName + clientId required' }, { status: 400 });
  }

  // Event name mapping to Meta-standard names where sensible.
  const nameMap = {
    'Install':  'CustomEvent',   // no standard web 'install' event; use custom below
    'Signup':   'CompleteRegistration',
    'Trial':    'StartTrial',
    'Purchase': 'Purchase',
    'search_created': 'CustomEvent',
    'upgrade_clicked': 'CustomEvent',
    'trial_start': 'StartTrial',
  };
  const metaEventName = nameMap[eventName] || 'CustomEvent';

  // Hash email: SHA-256, lowercase + trim (Meta requirement).
  let em = null;
  if (typeof body.email === 'string' && body.email.trim()) {
    const crypto = await import('node:crypto');
    em = crypto.createHash('sha256').update(body.email.trim().toLowerCase()).digest('hex');
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
          || request.headers.get('x-real-ip')
          || '';

  const event_id = `sv_${clientId.slice(0, 12)}_${eventName.toLowerCase()}_${Date.now()}`;

  const payload = {
    data: [{
      event_name: metaEventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id,
      action_source: 'website',
      user_data: {
        external_id: clientId,
        ...(em ? { em } : {}),
        ...(body.fbp ? { fbp: String(body.fbp) } : {}),
        ...(body.fbc ? { fbc: String(body.fbc) } : {}),
        ...(ip ? { client_ip_address: ip } : {}),
        client_user_agent: request.headers.get('user-agent') || '',
      },
      custom_data: {
        content_name: body.contentName || eventName,
        ...(body.value != null ? { value: Number(body.value), currency: body.currency || 'GBP' } : {}),
      },
      // Keep the raw event name so we can query by it in Meta
      event_name_raw: eventName,
    }],
  };

  // Send to Meta (fire and forget — never fail the extension call on Meta issues)
  const metaResp = await fetch(`https://graph.facebook.com/v25.0/${PIXEL_ID}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, access_token: TOKEN }),
  }).catch(() => null);

  let metaOk = false;
  let metaBody = null;
  if (metaResp) {
    try { metaBody = await metaResp.json(); metaOk = metaResp.ok; } catch { metaBody = null; }
  }

  // Log locally for our own reporting regardless of Meta's response.
  try {
    await kv.lpush(`sv:capi:${eventName.toLowerCase()}`, JSON.stringify({ clientId, ts: Date.now(), event_id, ok: metaOk }));
    await kv.ltrim(`sv:capi:${eventName.toLowerCase()}`, 0, 999);
  } catch { /* kv best effort */ }

  return NextResponse.json({ ok: metaOk, meta: metaBody || null, event_id });
}
