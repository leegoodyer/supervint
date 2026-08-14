import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const runtime = 'nodejs';

const kv = Redis.fromEnv();

// POST /api/attribution — store install attribution for a clientId.
// Body: { clientId, utm_source?, utm_medium?, utm_campaign?, utm_content?,
//         utm_term?, fbclid?, gclid?, referrer?, browserLang?, ts? }
//
// Captures TWO independent signal families so every install gets a source:
//   1. Ad signals (UTM / fbclid / gclid) — where a tagged ad click came from.
//   2. Non-ad signals (referrer + browser language) — where a NON-ad install
//      came from (direct link, Chrome Web Store, organic, a platform post).
//      A derived `source` field (referrer hostname) is computed so the admin
//      panel can show "facebook.com" / "chromewebstore.google.com" / "direct".
//
// Called from THREE places, merged rather than first-write-wins:
//   1. The extension at install time (cookie read — may only carry UTM).
//   2. The /welcome page after install (referrer + browserLang + UTM).
//   3. (implicitly) later richer writes fill gaps left by earlier thin ones.
// Merge rule: never overwrite a non-empty field with an empty one; never
// clobber a genuinely-new write's fresh fields. This lets the extension's
// early thin write (UTM only) be enriched by the welcome page's referrer.
export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { body = {}; }

  const clientId = typeof body?.clientId === 'string' ? body.clientId.trim() : '';
  if (!clientId) {
    return NextResponse.json({ error: 'clientId required' }, { status: 400 });
  }

  const KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content',
                'utm_term', 'fbclid', 'gclid', 'referrer', 'browserLang'];

  const incoming = { ts: Number(body.ts) || Date.now() };
  for (const k of KEYS) {
    const v = body[k];
    if (typeof v === 'string' && v.trim()) incoming[k] = v.trim().slice(0, 1000);
  }

  // Derive a clean `source` label for the admin panel.
  // Priority: referrer hostname > fbclid → 'facebook' > gclid → 'google'
  //           > utm_source value. Absent all of those, "direct".
  incoming.source = deriveSource(incoming);

  // Nothing meaningful captured (only ts) — don't store noise.
  if (Object.keys(incoming).length <= 1) {
    return NextResponse.json({ ok: true, stored: false, reason: 'no attribution params' });
  }

  const key = `sv:attrib:${clientId}`;
  const existing = await kv.get(key);

  if (existing && typeof existing === 'object') {
    // MERGE: fill gaps in the existing record with fresh fields from this
    // write, but never overwrite an existing non-empty value.
    let changed = false;
    for (const [k, v] of Object.entries(incoming)) {
      if (v && (existing[k] === undefined || existing[k] === null || existing[k] === '')) {
        existing[k] = v;
        changed = true;
      }
    }
    // Re-derive source if it's still empty but referrer has since landed.
    if ((existing.source === undefined || existing.source === null || existing.source === '') && existing.referrer) {
      existing.source = deriveSource({ referrer: existing.referrer });
      changed = true;
    }
    if (changed) {
      await kv.set(key, existing);
      return NextResponse.json({ ok: true, stored: true, merged: true, attribution: existing });
    }
    return NextResponse.json({ ok: true, stored: false, reason: 'no new fields', attribution: existing });
  }

  await kv.set(key, incoming);
  return NextResponse.json({ ok: true, stored: true, merged: false, attribution: incoming });
}

// Derive a human-friendly source string from the captured signals.
function deriveSource({ referrer, fbclid, gclid, utm_source }) {
  if (referrer) {
    try {
      const host = new URL(referrer).hostname.replace(/^www\./, '');
      if (host) return host;
    } catch { /* malformed referrer — fall through */ }
  }
  if (fbclid) return 'facebook';
  if (gclid) return 'google';
  if (utm_source) return utm_source;
  return 'direct';
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
