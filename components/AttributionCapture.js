'use client';

import { useEffect } from 'react';

// AttributionCapture — runs on every page of supervint.com.
//
// When a visitor arrives via an ad/link carrying UTM params (or fbclid/gclid),
// we stash them in TWO places so the extension can pick them up at install time
// no matter which path the install takes:
//
//   1. localStorage['sv_attribution']  — read by the welcome page after install
//      (primary path: extension opens /welcome?clientId=... on install)
//   2. cookie 'sv_attribution'         — read DIRECTLY by the extension via
//      chrome.cookies at install time (fallback path: works even if the
//      welcome tab is closed instantly or localStorage was cleared)
//
// Both are keyed on the same JSON shape: { utm_source, utm_medium,
// utm_campaign, utm_content, utm_term, fbclid, gclid, ts }.
//
// The cookie lasts 90 days (Meta's attribution lookback window) and is
// SameSite=Lax so it survives the CWS redirect chain.

const ATTR_KEY = 'sv_attribution';
const COOKIE_MAX_AGE = 90 * 24 * 60 * 60; // 90 days

export default function AttributionCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const attrs = {};
      let found = false;

      const take = (name) => {
        const v = params.get(name);
        if (v) {
          attrs[name] = v.slice(0, 500);
          found = true;
        }
      };

      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
       'fbclid', 'gclid'].forEach(take);

      // No tracking params on this visit — do nothing (don't clobber an
      // earlier attribution with a later clean visit).
      if (!found) return;

      attrs.ts = Date.now();
      const json = JSON.stringify(attrs);

      // Primary store: localStorage (welcome page reads this)
      try { localStorage.setItem(ATTR_KEY, json); } catch { /* ignore */ }

      // Fallback store: cookie (extension reads this directly via chrome.cookies)
      try {
        document.cookie = `${ATTR_KEY}=${encodeURIComponent(json)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
      } catch { /* ignore */ }

      // Also surface it for debugging: window.__svAttribution
      if (typeof window !== 'undefined') window.__svAttribution = attrs;
    } catch { /* never break the page for attribution */ }
  }, []);

  return null;
}
