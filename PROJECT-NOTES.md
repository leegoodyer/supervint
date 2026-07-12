# Supervint — Project Notes

## Product Facts (never contradict these in any copy/content)
- Supervint is a free Chrome extension that alerts users when a new
  Vinted listing matches a saved search.
- Alert-only: no auto-buy, no auto-checkout, no automated action on
  Vinted. Never state or imply Supervint logs into Vinted or accesses
  credentials.
- Free tier requires an email address to save a search (not optional).
- "Sniping" in Supervint's context means finding/spotting listings
  first, not auto-purchasing — consistent with alert-only positioning.

## Live Content
- Pillar 1: /guides/vinted-alerts-without-the-ban-risk
- Pillar 2 (hub): /guides/vinted-price-alert
- Spoke: /guides/vinted-alerts-nike-trainers
- Spoke: /guides/vinted-alerts-carhartt-workwear
- Spoke: /guides/vinted-alerts-vintage-denim
- All guides use GuideTemplate.js, output Article + FAQPage schema,
  link to exactly one pillar page + the pricing CTA.

## Technical Setup — CONFIRMED LIVE IN PRODUCTION
- Title/H1/meta/OG/Twitter tags optimized on homepage
- SoftwareApplication + FAQPage schema on homepage
- www → apex 301/308 redirect (next.config.mjs) — commit 0a1bd64,
  verified live in production 2026-07-09:
  https://www.supervint.com/ → 308 → https://supervint.com/
- Per-page <link rel="canonical"> tags via alternates.canonical —
  verified live on /, /privacy, /guides (same commit/verification)
- Dynamic sitemap.xml (app/sitemap.js), auto-picks up new guide pages,
  excludes /welcome and /admin
- CSS scoping bug fixed: guide body blocks used bare <section> tags
  colliding with homepage's global section padding rule — now uses
  .guide-section class instead
- Welcome/admin signup emails shipped via Resend
- Chrome Web Store review completed and approved — extension live.
- Brand styling added to /guides pages — commit 643f354, pushed and
  verified live:
  - /guides index: teal gradient hero band with lightning-bolt badge,
    each guide now rendered as a card (title + one-line teaser from
    meta_description) in a responsive 2-column grid (1-column on mobile)
  - Individual guide pages: small bolt badge added next to the H1,
    via new shared component components/BrandBolt.js
  - Verified: build passes, /privacy and other .prose pages unaffected
    (styles scoped to .guide* classes only), mobile layout confirmed

## Extension Fixes (this session)
Reported complete by Lee. The extension folder (Documents/Supervint) is
not a git repo, so there's no commit history/diff to independently verify
the specifics against — listed here as confirmed-done, not as verified
root-cause writeups:
- Power Seller plan cap fixed
- Usage counter fixed
- Google Sheets OAuth/ownership issue fixed
- Duplicate account creation fixed across all three signup paths
- Email verification fixed
- Search persistence fixed
- Free-tier email gate fixed

## Known Pending Items
- ADMIN_NOTIFICATION_EMAIL environment variable needs to be added to
  Vercel's environment variables for the admin signup notification to
  actually work post-deploy — confirm this is set
- No nav link to /guides from homepage yet — guides are effectively
  orphaned from main navigation (SEO + UX gap) — still pending

## SEO Content Pipeline (Hermes)
- Hermes runs a standing SEO content cron job, 2x/week
- Researches keywords via GSC data (once available) or competitor
  analysis, proposes a target + reasoning, waits for Lee's approval
- Writes drafts to content/guides/drafts/ — NEVER publishes directly
  to content/guides/ (live)
- Keeps self-improvement log at content/guides/_seo-agent-log.md
- Publish pipeline: Hermes drafts → Lee reviews → Claude Code moves
  approved draft to content/guides/, verifies schema/render, commits,
  pushes to main (Vercel auto-deploys)
- Cron job live — job ID f9a2ec3cae7d, runs Mon & Thu 9:00am UK time.
  Each run: reads _seo-agent-log.md + existing guides to avoid
  duplication, researches a new keyword angle, proposes to Lee with
  reasoning, waits for approval before writing. First proposal/draft:
  'vinted-adidas-trainers-alert' (Adidas trainers, extending the Nike
  guide template) — approved 2026-07-12.

## Access/Environment Notes
- supervint-web (website) and Supervint (extension) are SEPARATE
  folders with separate access grants — a Claude Code session scoped
  to one cannot read the other. Always confirm working directory
  matches the task before starting.
- GA4 property G-0DHBJ4FEQX is for the Chrome extension, not the
  website (confirmed by Lee)
- GSC service account (supervint-seo-agent@supervint.iam.gserviceaccount.com)
  connected and working for the website property (sc-domain:supervint.com)
