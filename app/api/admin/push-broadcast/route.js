import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { isAdminAuthed } from '@/lib/admin-auth';
import webpush from 'web-push';

export const runtime = 'nodejs';

const kv = Redis.fromEnv();

// ─── Admin push broadcast ────────────────────────────────────────────────────
// POST /api/admin/push-broadcast — send a Web Push notification to every user
// who has registered a subscription (via /api/extension/push-subscribe).
// Body: { title, body, url? }
// Admin-only. Used for functional notices (e.g. "update available"), NOT spam.
// Chrome Web Store policy: notifications must not be ads/spam/phishing — keep
// this to rare, functional, product-related messages.

const KEY_PREFIX = 'sv:push:sub:';

export async function POST(request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PRIVATE_KEY || !VAPID_PUBLIC_KEY || !VAPID_SUBJECT) {
    return NextResponse.json({ error: 'Push not configured (missing VAPID env).' }, { status: 500 });
  }

  let body;
  try { body = await request.json(); } catch { body = {}; }

  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const msg   = typeof body?.body  === 'string' ? body.body.trim()  : '';
  const url   = typeof body?.url   === 'string' ? body.url.trim()   : 'https://supervint.com';

  if (!title || !msg) {
    return NextResponse.json({ error: 'title and body are required.' }, { status: 400 });
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const keys = await kv.keys(`${KEY_PREFIX}*`);
  const subs = keys.length ? await kv.mget(...keys) : [];

  let sent = 0;
  let failed = 0;
  const failures = [];

  for (const raw of subs) {
    if (!raw) continue;
    let sub;
    // Upstash mget may return the value already parsed (object) or as a JSON
    // string depending on how it was stored — handle both.
    if (typeof raw === 'string') {
      try { sub = JSON.parse(raw); } catch { continue; }
    } else if (raw && typeof raw === 'object') {
      sub = raw;
    } else {
      continue;
    }
    if (!sub || !sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) continue;

    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        JSON.stringify({ title, body: msg, url })
      );
      sent++;
    } catch (err) {
      failed++;
      const status = err?.statusCode || 0;
      // 404/410 = subscription expired/gone — delete it so it stops failing.
      // (Also removes the fake test subscription that lingers from dev.)
      if (status === 404 || status === 410) {
        // Find the key for this endpoint and delete it.
        const k = keys.find(kk => {
          const v = subs[keys.indexOf(kk)];
          try { const s = typeof v === 'string' ? JSON.parse(v) : v; return s && s.endpoint === sub.endpoint; } catch { return false; }
        });
        if (k) await kv.del(k);
      }
      failures.push({ endpoint: sub.endpoint.slice(0, 60), error: String(err?.statusCode || err?.message || err) });
    }
  }

  return NextResponse.json({ ok: sent > 0, sent, failed, failures: failures.slice(0, 20) });
}
