'use client';

import { useEffect, useRef } from 'react';

// WelcomeAttribution — mounted on the /welcome page. When the extension opens
// /welcome?clientId=XXX after install, this captures attribution from TWO
// redundant sources so at least one always fires:
//
// 1. Landing-page cookie (sv_attribution) set by the marketing site — PRIMARY.
//    Carries UTM params, fbclid, gclid. First write wins server-side.
// 2. Document referrer + browser context — FALLBACK. If the install came
//    from the Chrome Web Store (referrer includes Chrome Web Store URL), a
//    direct link, or a platform we track, this captures the signal even when
//    the landing-page cookie never fired.
//
// Both are merged into the /api/attribution POST.

const ATTR_KEY = 'sv_attribution';

export default function WelcomeAttribution({ clientId }) {
  const fired = useRef(false);

  useEffect(() => {
    if (!clientId || fired.current) return;
    fired.current = true;

    // 1. Primary: landing-page cookie (UTM, fbclid, gclid).
    let attrib = null;
    try {
      const raw = localStorage.getItem(ATTR_KEY);
      if (raw) attrib = JSON.parse(raw);
    } catch { /* ignore */ }

    const body = {
      clientId,
      ts: attrib?.ts || Date.now(),
    };

    // UTM fields
    if (attrib && typeof attrib === 'object') {
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content',
       'utm_term', 'fbclid', 'gclid'].forEach((k) => {
        if (typeof attrib[k] === 'string' && attrib[k]) body[k] = attrib[k];
      });
    }

    // 2. Fallback: referrer + browser signals (always sent, merged server-side
    //    if the primary UTM fields are missing).
    try {
      if (document.referrer) body.referrer = document.referrer.slice(0, 1000);
      body.browserLang = (navigator.language || '').slice(0, 10) || null;
    } catch { /* never block */ }

    fetch('/api/attribution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => { /* fire-and-forget */ });

    // One-shot: clear the cookie so clean revisits aren't misattributed.
    try { localStorage.removeItem(ATTR_KEY); } catch { /* ignore */ }
  }, [clientId]);

  return null;
}
