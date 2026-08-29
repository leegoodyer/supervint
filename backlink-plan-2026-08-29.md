# Supervint — Backlink & Indexing Acceleration Plan (2026-08-29)

## Why indexing is slow (diagnosis, confirmed)
- Domain ~6 weeks old, 49 clicks / 709 impressions over 90 days = cold start.
- Google crawls new domains on a tiny budget; new pages take days–weeks to index.
- NOT a bug: sitemap healthy (50 URLs, 0 errors), canonicals correct, no noindex,
  internal linking solid. Sitemap re-submitted 29 Aug.
- **The real bottleneck is authority: ~zero referring domains.** Backlinks are the
  lever that raises crawl rate and gets pages indexed faster.

## What does NOT work (so we don't waste time)
- No API can force-index regular pages (URL Inspection API is read-only; the
  Indexing API only covers job-posting/event pages).
- Manual "Request indexing" in GSC UI = ~10/day quota, fiddly, only a temporary
  nudge. Useful for the 10 highest-value pages, but not a strategy.

---

## PART 1 — Immediate: manual "Request indexing" (the 10 money pages)

Do these in GSC → URL inspection → paste URL → "Request indexing". One session,
10 URLs (the daily quota). Priority order:

1. /guides/how-to-sell-on-vinted      (1k–10k vol, flagship)
2. /guides/vinted-alternatives        (hub)
3. /guides/how-to-get-more-views-on-vinted  (100–1k)
4. /guides/vinted-buyer-protection    (100–1k)
5. /guides/vinted-vs-ebay             (comparison)
6. /guides/vinted-vs-depop            (comparison)
7. /guides/vinted-price-alert         (pillar — already indexed, but re-request after edits)
8. /guides/how-to-see-sold-prices-on-vinted
9. /guides/vinted-sniper
10. /guides/lego-on-vinted            (evergreen, zero competition)

*(I can drive this via your logged-in Chrome — but GSC's UI resisted automation
last run, redirecting deep-links. If you do it yourself it's ~10 min; or I can
retry driving it when Chrome is idle.)*

---

## PART 2 — The real fix: backlinks (product-focused, NOT local citations)

Supervint is software, so the Everwarm NAP/citation playbook does NOT apply.
Instead, target these — ordered by value:

### Tier 1 — High-authority product directories (do all, free)
1. **Chrome Web Store** (already the distribution channel) — make sure the
   listing page links to supervint.com and the description is keyword-rich.
2. **Product Hunt** — launch post. High DR, and a "Vinted alert tool" launch
   gets genuine reseller-audience traffic. Dofollow link.
3. **AlternativeTo** — list as an alternative to other Vinted tools. Dofollow.
4. **G2 / Capterra / Trustpilot** — software profile pages (some nofollow, but
   they feed brand-search results and AI answers).
5. **SaaSHub / ProductHunt alternatives / Slant** — product listing sites.

### Tier 2 — Niche "best Vinted tools" listicles (highest-converting links)
The competitor check found Vinotify, VintiePlus, Telvin, Lobstr all publishing
"best vinted alert services 2026" listicles — meaning editors are actively
covering this space. Target:
6. Reselling blogs / "side hustle" blogs — pitch inclusion in "best Vinted
   tools" / "Vinted seller tools" roundups.
7. Chrome-extension curation sites (extension "best of" lists).
8. Reddit r/Vinted + r/Flipping + r/reselling — organic mentions (NOT self-
   promo spam; answer questions where Supervint genuinely helps, drop the link
   only when it answers the exact question).

### Tier 3 — Content-driven links (long game, compounds with our 42 guides)
9. **Guest posts** on reselling/thrifting blogs — one genuinely useful article
   ("how to snipe Vinted deals", "Vinted sold-price data explained") with a
   contextual link back.
10. **Digital PR** — a data story from the sold-price DB ("what 378 real Vinted
    sales reveal about the brands that hold value") is the kind of thing
    reselling-news sites and newsletters pick up and link to.
11. **Tool roundups on competitor blogs** — monitor Vinotify/VintiePlus/Souk
    comparison pages and ask to be included; we already write the comparison
    content they need.

### Tier 4 — Foundation (do first, cheap)
12. Ensure /help + /guides pages all cross-link (done) and the homepage links to
    a "Tools" or "Guides" nav item (confirm).
13. Add JSON-LD Organization + sameAs to product profiles (Chrome Web Store,
    GitHub, Product Hunt, social) — helps Google consolidate the brand entity.

---

## PART 3 — Outreach templates (adapt Everwarm voice → Supervint)

### A. "Best Vinted tools" listicle pitch
Subject: Supervint — Vinted alert tool for your list
"Hi, I saw your roundup of [Vinted tools / reselling tools]. I run Supervint,
a free Chrome extension that alerts Vinted buyers the instant new listings
match their search — we're at ~4,000 alerts/day across the UK. If you update
the list, we'd love to be considered: https://supervint.com — happy to share
usage data or screenshots. Thanks, Lee."

### B. Guest post pitch (reselling blogs)
Subject: Guest post — Vinted sold-price data, what actually holds value
"Hi, I run Supervint, a Vinted alert tool. We've got a crowd-sourced database
of real sold prices — I'd love to write a genuinely useful piece for [site]
on what the data shows about which brands hold value on Vinted. No fluff,
original data, one link back to our tool. Interested?"

### C. Data-story PR pitch (newsletters / reselling news)
Subject: Data story — what Vinted sold prices reveal about reselling
"Quick data story for [publication]: we analysed [N] real Vinted sales and found
[the most interesting pattern — e.g. 'kids' clothes sell fastest per £', 'X
brand holds value best']. Happy to share the full dataset + charts with a
credit link."

---

## Rules (carry over from Everwarm)
- Quality > quantity: 10 real niche links + 20 solid directories > 200 spam links.
- Never buy links / join link farms.
- No keyword-anchor spam — brand name "Supervint" or naked URL as anchor.
- Track monthly: re-check "site:supervint.com" in Google + referring domains.

## Success measure
- Next 30 days: 25 unindexed pages → most indexed (backlinks raise crawl rate).
- Next 90 days: referring domains from ~0 → 15+, head-term impressions climb.
