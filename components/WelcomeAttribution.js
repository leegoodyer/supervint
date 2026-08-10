'use client';

import { useEffect, useRef } from 'react';

// WelcomeAttribution — mounted on the /welcome page. When the extension opens
// /welcome?clientId=XXX after install, this reads the landing-page attribution
// from localStorage and reports it to /api/attribution.
//
// This is the PRIMARY reporting path; the extension's own cookie read is the
// fallback (see background.js). First write wins server-side, so whichever
// fires first records the source.

const ATTR_KEY = 'sv_attribution';

export default function WelcomeAttribution({ clientId }) {
  const fired = useRef(false);

  useEffect(() => {
    if (!clientId || fired.current) return;
    fired.current = true;

    let attrib = null;
    try {
      const raw = localStorage.getItem(ATTR_KEY);
      if (raw) attrib = JSON.parse(raw);
    } catch { /* ignore */ }

    if (!attrib || typeof attrib !== 'object') return; // no landing attribution

    const body = {
      clientId,
      ts: attrib.ts || Date.now(),
    };
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content',
     'utm_term', 'fbclid', 'gclid'].forEach((k) => {
      if (typeof attrib[k] === 'string' && attrib[k]) body[k] = attrib[k];
    });

    fetch('/api/attribution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => { /* fire-and-forget */ });

    // One-shot: don't re-report on re-renders, and clear the stored value so
    // a later clean visit can't be misattributed.
    try { localStorage.removeItem(ATTR_KEY); } catch { /* ignore */ }
  }, [clientId]);

  return null;
}
