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
- Spoke: /guides/vinted-adidas-trainers-alert
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

## Extension Architecture (v1.2.12 + 2026-08-16 fixes)
Builds: `~/Documents/Supervint` (main, upload source — Lee's real Chrome loads
this) and `~/Documents/Supervint-CS-test` (debug build). **Always patch BOTH.**
The extension folder is NOT a git repo; each build has its own git repo
(commits per fix). Store zip = v1.2.12 WITHOUT the sold-tracker (not shipped
to Store yet).

## AI Assistant chat (major, 2026-08-16 — LIVE on supervint.com/api/help-chat)
DeepSeek-backed chat in the popup ("AI Assistant", renamed from "Help"; no ⚡
bolt, no clipart). Server-side so the key never touches the extension; per-plan
daily caps 15/50/200 (sv:helpchat:<cid>:<date>). Key protocols:
- **===SEARCH=== block** at end of reply → popup creates + starts the search.
  Vinted-exact URL format: `search_text` URL-encoded with `+`, `status_ids[]=`,
  `color_ids[]=` (bracket array syntax — verified live from Vinted's own DOM:
  status 6=new-with-tags 1=new-no-tags 2=very-good 3=good 4=satisfactory; 28
  colours incl. Black 1, White 12, Navy 27...). NEVER guess catalog/brand IDs;
  size stays in search_text. **MULTI-ADD**: one block per search, but popup
  also parses merged blocks (multiple JSON objects in one ===SEARCH===...
  ===END===) as resilience.
- **===DELETE=== block** `{match, filter}` → popup deletes searches whose
  label/URL contains the filter (case-insensitive), stops alarms, syncs
  server. Bulk-added searches carry `(≤£N)` in labels — filter "(≤£" catches
  them all. AI is instructed to NEVER say "I can't delete" (old refusals in
  history are wrong — it can now).
- **Sold-price answers use REAL DB records**: when the message smells like
  sold/worth/bargain, route.js looks up `sv:sold:kw:<kw>` (HASH — hgetall,
  NOT zrange) then falls back to title-prefix byLex; injects "REAL SOLD
  RECORDS" block as source of truth. Keyword = LAST non-stop word + singular
  candidates (jackets→jacket). Watch out: kw hash is a hash, titles index is
  a zset — the two need different reads.
- **Quick-prompt chips** above the input: "Set up search with AI", "Sold
  prices", "Is it a bargain?", "How to use Supervint", "Set up first link
  manually", "Why no alerts?" — one-tap canned questions.
- **Post-creation follow-up widget** (after AI creates search(es)): clickable
  chips "Email alert: under 10%/20%/30%/50% below the price cap" (per-search
  threshold = cap×(100−pct)%, works for mixed-cap bulk) + strictness
  Balanced/Strict/Lenient. If the user already said "email" in the chat
  message, email auto-enables at 10% and only strictness is asked.
- **History**: persisted `sv_help_chat_history` (last 20); sanitized on load
  (strips ===SEARCH===/===DELETE=== blocks so raw JSON never re-renders).
- **Starts are fire-and-forget** in multi-add (no per-message await — 55
  sequential awaits let the popup close mid-loop and leave searches never
  started/enabled).

## Popup UI (2026-08-16 cleanup — Lee's design rules: no emoji/clipart icons
anywhere, clean SVG line icons, brand teal #007782, works for ALL users)
- Compact bar: brand + count + 🔔-SVG + "Full screen" (no "+ Add" — the big
  "Add search" button does that; consistent translucent button style).
- 4 buttons row: Add search (+), My Items (t-shirt), Sold (price-tag), AI
  Assistant (sparkle) — all SVG line icons, teal, text-only labels.
- Bulk-add box full width; forgiving parser (strips bullets/numbers/labels/
  &amp;/trailing punctuation, skips invalid lines instead of rejecting batch).
- Sold prices on a card → opens FULL sold-search view with that search's
  search_text pre-filled + auto-runs (was a fiddly inline panel — removed
  openSoldPanels/renderSoldPanel dead code).
- Sold/My Items results scroll internally (flex column, overflow-y:auto) —
  list grows without stretching the window.
- Account section = collapsible toggle like Google Sheets/Email (person icon,
  plan name as plain teal text right-aligned with ✓ Connected; caret hugs it).
- Integrations rows: status badges right-aligned into one column (✓ Connected
  teal / ⚠ Paused orange / "Connect" grey underlined text when not set up —
  span role=button, NEVER a <button> nested in the row <button> = invalid
  HTML → outline + mislayout). Email "Connect" shows only when no alert email
  saved; account email does NOT count as configured.
- Compact popup = fixed-height flex column (600px): searches scroll, buttons
  + integrations + account ALWAYS visible, one scrollbar (was two + buried
  settings).
- **Fire-and-forget START_SEARCH** in bulk-add + AI multi-add (see above).

- **Poll reliability**: `chrome.alarms.onAlarm` runs the poll DIRECTLY — no
  setTimeout. MV3 suspends the service worker in the setTimeout gap, which
  silently lost polls forever (the "0 polls ever ran" bug). Stagger comes
  from scheduleNextPoll's built-in 36–311s jitter.
- **Startup IIFE** (every cold start, not just onInstalled):
  migrateFromV1 → ensureClientId → scheduleMidnightReset → normalizeHours →
  restoreAlarmsForEnabledSearches → ensureOffscreenDocument. Cold start = 16
  alarms (15 polls + midnight reset).
- **timeToMinutes defensive**: accepts '08:00' strings OR numbers (8 → 8*60)
  OR null. Root cause of the 2026-08-16 "couldn't find new listings" crash:
  server search restore wrote numeric hours → `8.split(':')` TypeError at
  background.js:490 → EVERY poll crashed instantly → zero checks ran. One-time
  startup normalization rewrites numeric/bad activeHours* to 'HH:MM'.
- **Start All = atomic START_ALL_SEARCHES** (one storage read, all alarms,
  one response). 15 sequential sendMessage round-trips was the "only starts
  one at a time" bug. **Preserves knownItemIds/needsBaseline** — wiping them
  on restart made a stopped-for-hours search alert on EVERYTHING listed in
  the gap (alert flood). Baseline is only re-forced when the search URL
  changes (checked in runPollCycle via knownItemsForUrl).
- **Email is a nudge, not a gate**: START_SEARCH never blocks on missing
  email (responds emailOptional:true instead); plan:null (unknown) is NEVER
  coerced to 'free'.
- **New searches auto-start**: saving a search (or editing its URL) sends
  START_SEARCH immediately — no "press Start" second step. This was the
  activation killer: 9 of 15 installed users created searches but never
  started them.
- **Sold panel persistence**: openSoldPanels/openSoldPanelsLoaded/
  openSoldPanelsFetching Sets + openSoldPanelsHtml cache (Map of rendered
  HTML). The popup's 2s setInterval re-renders the list and wipes panel DOM;
  restore cached HTML instantly, only fetch on first open. (Original bug:
  "panel opens and closes over and over" = re-fetch flicker every 2s.)
- **Scroll preservation**: renderList saves scrollTop before rebuild and
  restores after — the 2s refresh was jumping the popup back to the top.
- **Vinted tab on reload**: refreshVintedSession() (fires on poll 401s,
  opens hidden Vinted tab active:false) remembers last refresh so it doesn't
  re-fire on every extension reload.

## Sold-Price DB (shared, crowd-sourced)
API: `/api/sold` — POST record / GET query / DELETE admin purge. Storage
(Upstash KV): `sv:sold:item:<id>` (record, 90d TTL), `sv:sold:kw:<kw>` (hash),
`sv:sold:tok:<token>` (title token index), `sv:sold:titles` (lex zset for
prefix search, member = "lowercased-title||itemId"), `sv:sold:recent` (zset).

- **378 genuine sales** in DB (backfill run 2, 2026-08-16). Purge removed
  2,757 polluted records from a classifier bug. Classifier rules: JSON-LD
  `availability:InStock` = LIVE; `can_buy:false`/removed markers = removed;
  neither = sold. `can_buy` ABSENCE is NOT proof of sold.
- **Average rules (Lee, 2026-08-16)**: average ONLY when matchMode=exact —
  query has 2+ significant tokens that intersect to a specific item. Single
  word (barbour/lego/nike) = category = NO avg (Lego £1–£1000 is meaningless).
  Prefix search (q=) = no avg. Exact with 1 sale shows avg for now (Lee:
  "leave it as one so it has something" — revisit when repeat sales
  accumulate; the ">1 sales" rule is the long-term intent).
- **Live prefix search**: `q=` param → ZRANGEBYLEX over sv:sold:titles.
  Upstash option is **byLex (camelCase)** — `{by:'lex'}` silently fails and
  the fallback must also use the camelCase shape. Popup fires it on every
  input event, debounced 250ms.
- Sold capture: extension detects an item vanished since last poll → fetches
  item page → confirms genuinely SOLD → POSTs. Every user's searches feed the
  one shared index.

## Admin Panel (supervint.com/admin)
- Users table: clientId, Plan, Email, Trial expires, Stripe customer, Admin
  grant, Created, Last seen, Searches, Version, Status (● Active / ◐ Stale /
  ○ Idle). Status + plan filters, Recently deleted (35 accounts, collapsible).
- Selected-user detail panel: plan, subscription, version, searches list with
  live poll results, Feature usage chips
  (panel_opened, sold_search, search_created, search_toggled). **Clean text
  rows — NO emoji icons, NO pastel chip colours** (Lee's design rule:
  "weird colours with weird logos from clipart" rejected 2026-08-16).
- **Search status wording + colour (2026-08-16)**: admin COMPUTES hibernation
  from active hours vs current time (insideActiveHours — null hours = always
  active, overnight windows handled) → amber "● hibernating (resumes 08:00)"
  instead of green even when the last poll was hours ago. Never-polled
  searches = grey "○ starting up" (needsBaseline) / "waiting for first poll"
  (enabled, no result yet) — NOT "stopped". Green only when genuinely running.
  Heartbeat now sends activeHoursStart/activeHoursEnd/needsBaseline per search
  (was id/label/enabled/lastPollTime/lastPollResult only — without them the
  admin couldn't tell hibernating from stopped).
- Usage telemetry: extension trackUsage() → POST /api/usage →
  sv:usage:client:<cid> hash. **Read hashes with hgetall — mget on hash keys
  returns null** (hit twice; the repeated footgun). Only Lee's dev build
  sends events today (Store build has no tracking yet) — the panel works for
  ALL users once the tracking ships in the next Store release.
- Version capture: heartbeat sends version each poll; install/update beacon
  now includes version (sv:install:clientId) so idle users show it too.
  Users with blank version = installed but never started a search (never
  polled = no heartbeat).
- Deploy verification gotcha: Vercel immutable chunk URLs return the SPA
  HTML for any path (catch-all rewrite) — grepping chunks is useless; grep
  the /admin HTML itself or use a real browser. Minified bundles won't
  contain literal 'usageTotal' (inlined as Object.values(...).reduce(...)).

## Nudge Campaign (2026-08-16)
- 9 of 15 installed users were inactive (created searches, never started).
- Sent personalised "don't forget to press Start" emails to 8 (Resend via
  /api/admin/nudge-inactive, from alerts@supervint.com, idempotent via
  sv:nudged:<clientId>) with 3-step start guide + tips (exact searches,
  price caps, sold prices, email alerts).
- Activation tracker cron 5d710b601600, 9am daily: silent unless a nudged
  user starts monitoring → 🎉 report.

## Known Pending Items
- **TIER GATE (Lee, 2026-08-17)**: tier limits LOCKED (see brain/PROJECT-NOTES
  tiers section) but **DO NOT deploy the tier limit changes until the newest
  extension version is deployed to the Chrome Store** — Lee's explicit gate.
  Target: Free 5 searches no AI/email/sold/sheets · Trial 7 days everything
  (unlimited/unlimited) · Reseller 10 searches + 10 emails · Power Seller
  unlimited searches + unlimited emails. **Email alerts = search count per
  tier** (Lee). Existing 14-day trials keep their full window (stored
  absolute trialExpiresAt).
- **Store release (Lee's call)**: current Store zip is v1.2.12 WITHOUT sold-tracker/
  usage-tracking/AI Assistant. Next release zip should include ALL of today's
  batch (seen-set detection, AI chat + search create/delete, usage tracking,
  popup UI, sold view, wardrobe type-ahead). After the Store push, **advertise on the website that
  Supervint has an AI brain that creates snipes AND finds sold prices** —
  i.e. market the AI search-creation capability (plain-language → Vinted
  search link → monitoring) PLUS real sold-price intelligence ("how much did
  X actually sell for?" answered from the crowd-sourced sold DB) as headline
  features (Lee's ask: "advertise that we have an ai brain to create snipes",
  "and find sold prices etc").
- **Deal searches (Lee's flips)**: ~35 bargain-tier URLs live as searches with
  `(≤£N)` labels (mistake-tier caps: lego £4-5, carhartt £5, barbour £6,
  moncler £15...). File: `~/Documents/supervint-web/deal-urls-paste.txt`
  (55 URLs, rock-bottom caps — "a couple hits a week = real bargain").
  Lee can bulk-add via popup box or AI chat; delete via AI ("remove the bulk
  upload" → filter "(≤£"). AI ALSO creates searches from plain language.
- **Email-merge hypothesis** — idle users' heartbeats under a different
  clientId (merge mismatch) — still open (interrupted previously).
- Heartbeat monitor cron (03cf6024c76b) fixed 2026-08-16: now watches Lee's
  LIVE clientId 19a5e8b0-1539-445d-a97b-855ec3c8dde9 (was stale dev
  f2b661db) + stale threshold 45m (was 6h — reported "ALL GREEN" on 4h-old
  heartbeat).
- ADMIN_NOTIFICATION_EMAIL environment variable needs to be added to
  Vercel's environment variables for the admin signup notification to
  actually work post-deploy — confirm this is set
- No nav link to /guides from homepage yet — guides are effectively
  orphaned from main navigation (SEO + UX gap) — still pending
- Supervint admin password reused many times (svadmin7/8/9/E/F cookie jars,
  transited chat) — rotation strongly advised
- Trial-extension offer ("7 more days free" on uninstall page) has no server
  hook yet

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
- First Hermes-proposed guide published: Adidas trainers alert (commit
  1fddb47, 2026-07-12) — proposed, drafted, reviewed, and approved via
  the standing pipeline end to end. Note: slug naming
  (vinted-adidas-trainers-alert) doesn't match the vinted-alerts-
  [category] pattern used by other spokes — kept as-is since it's
  already live/indexed, not worth a redirect for a cosmetic fix. Future
  Hermes drafts should aim for the vinted-alerts-[category] pattern for
  consistency going forward.

## Access/Environment Notes
- supervint-web (website) and Supervint (extension) are SEPARATE
  folders with separate access grants — a Claude Code session scoped
  to one cannot read the other. Always confirm working directory
  matches the task before starting.
- GA4 property G-0DHBJ4FEQX is for the Chrome extension, not the
  website (confirmed by Lee)
- GSC service account (supervint-seo-agent@supervint.iam.gserviceaccount.com)
  connected and working for the website property (sc-domain:supervint.com)
