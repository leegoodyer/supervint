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
- Pillar 1: /guides/vinted-ban-risk
- Pillar 2 (hub): /guides/vinted-price-alert
- Spoke: /guides/nike-on-vinted
- Spoke: /guides/carhartt-on-vinted
- Spoke: /guides/vintage-denim-on-vinted
- Spoke: /guides/adidas-on-vinted
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
- **Poll watchdog (2026-08-29 fix — "new users never poll")**: fresh installs
  create searches but the initial poll alarm was lost to an MV3 SW kill and
  the ONLY recovery path was the offscreen-doc keepalive, which never came
  alive for 12/22 users — searches sat at "starting up"/"idle" with
  version=None, lastSeen=never forever. Added `sv_poll_watchdog` (3-min
  periodic alarm, independent of offscreen) that runs
  restoreAlarmsForEnabledSearches + autoStartNeverPolledSearches (starts any
  search that has a URL, is enabled:false, never polled, and wasn't
  deliberately stopped; respects plan searchLimit via 10-min-cached
  /subscription/status fetch). Also broadened START_ALL_SEARCHES/Start All to
  target enabled-but-never-polled searches (`!s.lastPollTime`) — "Start All
  does nothing" was skipping those.
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

## Google Sheets "Check sheet for sold" button (2026-08-17 — FIXED, under test)
Feature (built earlier, forgotten in compaction): popup Google Sheets section
has **"Check sheet for sold"** — reads every vinted.co.uk item URL from the
connected sheet (Supervint Log!A2:E100000, oldest-first by timestamp — Lee:
"start at the beginning of my google sheet") and walks each URL through the
tab proxy (fetchItemPage → real Vinted tab context) at the same jittered
6–12s rate gate as polls (~5–10 req/min). Genuine sales are POSTed to the
sold DB; progress persisted every 10 items (resumes on re-click after SW
death). Sheet had **24,077 URLs** at test time (Lee's public copy had
22,945 — sheet grows).

**THREE bugs found + fixed this session (all committed, both builds):**
1. **MV3 dynamic import**: `BACKFILL_SOLD` handler did `await import('./sheets.js')`
   inside the SW → MV3 service workers DISALLOW `import()` of extension files
   → button always threw "import() is disallowed" (the popup showed that text
   as status). FIX: modules already statically imported at top; use the
   bindings directly. (Same class as the `chrome.tabs.executeScript` MV2 bug.)
2. **`.co.uk` regex**: `readSheetUrls()` filtered with `/www\.vinted\.\w+/` —
   `\w+` cannot match `co.uk` (dot in TLD) → EVERY sheet URL rejected →
   "No URLs found in the connected sheet (column E)" even when connected.
   FIX: `[\w.-]+` (same bug class as findVintedTabs hostname regex).
3. **Bare records**: walker POSTed `title:'', brand:''` — DB had itemId+price
   only, useless ("we can't have a database without the keywords and price
   and what the item was" — Lee). FIX: `classifyItemPage()` now also parses
   title/brand/size from the page's escaped JSON:
   - title: `\"value\":\"...\",\"style\":\"title\"` (fallback og:title meta)
   - brand: `\"navigational\",\"value\":\"Seiko\",\"uri\":\"vintedfr://items?brand_id=`
     (fallback `\"title\":\"Brand\",\"value\":\"...\"`)
   - size: `\"title\":\"Size\",\"value\":\"...\"`
   Verified against real page: "Seiko 5 GMT Silver Cloud Automatic Watch",
   brand Seiko, £275.00 GBP. Backfill AND live-tracker paths both pass
   title/brand/size through now.

**Verification (live, before reload):** clicked button → status
"Checking... (running)" then "Sold check running: 10/24077 links → sold 3 -
removed 0 - live 8 - failed 0" — 3 genuine sales reported to DB in ~2 min at
gated pace, zero rate-limits. Walk was interrupted by the extension reload
(needed for fix #3); resumes from link 10 on re-click. **UNDER TEST — Lee
re-clicks "Check sheet for sold" to resume the full ~40–50h walk.**
Admin helper routes added: `/api/admin/sold-stats` (total/emptyTitle/withPrice)
+ `/api/admin/sold-delete` (per-itemId purge) — both admin-authed, kept for
DB monitoring/cleanup. Sold DB count at test time: **383 genuine records**
(1 empty-title = the sheet-walk sale; probes created during debugging were
purged).

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

## Feature Update Email (2026-08-20)
- v1.2.15 published to Store; sent "What's new in Supervint" broadcast to
  all 17 users (via /api/admin/broadcast, from alerts@supervint.com).
- Covered: AI assistant (plain-English snipes), bulk link create, sold-price
  helper. Kept minimal (no emojis, teal header, Lee's style).
- NOTE: did NOT mention the popup "Update available" button (extension shows
  that banner automatically when behind latest-version). Revisit if users
  report not seeing the new features — they may need a manual update nudge.

## Known Pending Items
- **TIER GATE (Lee, 2026-08-17)**: tier limits LOCKED (see brain/PROJECT-NOTES
  tiers section) but **DO NOT deploy the tier limit changes until the newest
  extension version is deployed to the Chrome Store** — Lee's explicit gate.
  Target: Free 5 (no AI/email/sold/sheets) · Trial 7d all-bells 100 · Reseller
  10+10 · Power Seller 100+100 · **Empire 200+200 @ £24.99/mo (LOCKED)**.
  **Email alerts = search count per tier** (Lee). **NO unlimited anywhere**
  (Lee: "unlimited is going to hit problems if every user has unlimited").
  **Pacing implemented v2** (background.js pollIntervalMs + START_ALL spread,
  committed both builds): aggregate stays ~10 req/min at every tier — ≤50
  searches = 5 min each, 100 = ~10 min, 200 (Empire) = ~20 min (v1 was an
  over-cautious 30 min; Lee rejected it — "how have we gone from 5 minutes
  to 30 minutes"). 429-backoff (30-min cooldown) is the spike safety net.
  Research basis: Redrip (~10–30 req/min per endpoint) + fbm-sniper
  community bot (3-min cycles, 1.5s between targets, actively flips).
  **All THREE burst points spread (2026-08-17)**: cold start
  (restoreAlarmsForEnabledSearches), Start All (START_ALL_SEARCHES), and the
  **08:00 morning wake-up** (nextActiveWindowMs now adds random 0–15 min
  jitter — was exactly HH:00:00.000 for every search → all 50 fired same ms
  → 429 burst every morning; Lee spotted it).
  **GLOBAL RATE GATE (offscreen + tab proxy + direct fallback)**: every
  Vinted request serialized at jittered 6–12s gap (≤5–10 req/min). Sold
  capture 3→2 fetches/poll. Content-proxy warm 45s→5min.
  **THE BIG ONE — 2026-08-17 rate-limit incident + ROOT CAUSE**:
  - Sold-tracker's ungated item-page fetches (3/poll × 50 polls) ≈ 40+
    req/min flagged the household IP → wife's single search collaterally
    rate-limited (per-IP limits).
  - `chrome.tabs.query({url:'https://www.vinted.*/*'})` is an INVALID
    match pattern (wildcard TLD not allowed) — it THREW, was swallowed, and
    returned [] forever. The ENTIRE tab-proxy path (keep-alive tab, tab
    proxy, content injection) silently never worked. Polls stayed on the
    offscreen doc which DataDome flags (extension-context headers leak).
  - FIX: `findVintedTabs()` — query all tabs + hostname regex in JS
    (regex must allow multi-label TLDs: `[\w.]+` not `\w+` — `vinted.co.uk`
    has a dot; verified live via CDP).
  - Tab-proxy-FIRST reorder (real page context = strongest DataDome
    context per Scrapfly research); offscreen = fallback.
  - Escalating cooldown: 30m→1h→2h→4h with ±20% jitter (flat 30-min poked
    the flag forever); reloads respect in-progress cooldowns.
  - Auto keep-alive Vinted tab (fires on onInstalled AND onStartup AND 60s
    health check — was onStartup-only, so reloads never opened it).
  - VERIFIED LIVE via CDP: proxied fetch through real Vinted tab → HTTP 200
    + real data. Searches recovered to green same day.
  Existing 14-day trials keep their full window (stored absolute
  trialExpiresAt).
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

## v1.2.13 Ship + Remote Harvest Control (2026-08-18)
- **Shipped v1.2.13** (zip at `~/Documents/supervint-v1.2.13-store.zip`, key
  stripped, verified clean — no .md/.git/.claude leaks, version 1.2.13, all
  features present). Includes: sold classifier fix (sold vs removed vs live —
  the INVERTED bug), harvest crowd-source engine, version-check banner, AI
  assistant, rate-gate corrections. Server `LATEST_VERSION` = 1.2.13.
- **Sold classifier corrected (major bug)**: old logic labelled removed/holiday
  items "sold" and real sales "removed". New truth table (verified against 3
  known-state items): live = ld+json `availability:InStock`; **sold = no ld+json
  + `can_buy:false`**; removed = no ld+json + `can_buy:true`. `is_hidden` NOT a
  discriminator. Unit-tested in sold-tracker.js.
- **Harvest engine** (`harvestMySold`, sold-tracker.js): reads logged-in user's
  OWN sold history via `my_orders` API (`type=sold&status=completed&per_page=20`
  → itemId `tx-<transaction_id>`, skips "Bundle"). Auto-runs on install + weekly
  (`sv_sold_harvest` alarm). Dedupes on itemId.
- **Remote harvest control (NEW — the remote cap Lee asked for)**: endpoint
  `/api/extension/harvest-config` returns `{harvestEnabled, harvestMaxOrders}`.
  Default ships at `harvestMaxOrders:50` (cautious first run). Lee can bump to
  0 (unlimited) or kill it (`harvestEnabled:false`) on the server WITHOUT a
  Store re-publish. Extension fetches it before each run; on any failure falls
  back to local default 50 (conservative, never unlimited). Local storage
  `harvestMaxOrders` flag still works as manual override.
- **Version-check banner**: popup compares `chrome.runtime.getManifest().version`
  vs `GET /api/extension/latest-version`; if behind, shows "Update available"
  banner + button that opens chrome://extensions via `chrome.tabs.create`
  (`requestUpdateCheck` no-ops on dev/unpacked). **BUMP `LATEST_VERSION` in the
  route on EVERY Store publish** or the banner silently never fires.
- **Scraping button removed from popup** (Lee: "scraping sheets buttons gone,
  just Connect Google Sheets"). `renderSheetPanel` no longer shows "Check sheet
  for sold" — the connected state now only has Open sheet / Reauthorize.
  NOTE: the auto-start walker (`autoStartBackfillIfConnected`) + `BACKFILL_SOLD`
  handler + `runSheetBackfill`/`ensureBackfillWatchdog` still EXIST in
  background.js (Lee's own sheet walker). Not gated off in this build.
- **Privacy policy updated + live** (`/privacy`): added "Sold-Price Data"
  (Information We Collect) + "Aggregated Sold-Price Database" (How We Share).
  Sold DB stores itemId/title/price/currency/keyword/brand/size + `firstReportedBy`
  (clientId UUID, NOT a buyer name). No buyer usernames/messages/payment info.
- **CWS compliance note**: harvest is the one piece with policy surface — it's
  user's PRIVATE sold history (Vinted has NO public sold channel), so it's user
  data, not public info. Disclosed in privacy policy + store listing = defensible;
  "invisible + auto" is the risk. Lee chose disclosure-over-consent-button.
- **NEVER advertise sold-DB size/count publicly (Lee 2026-08-27).** Do NOT put
  "1,944 sold listings" / "largest sold-price database" / any crowd-sourced DB
  size number in site copy, marketing, or homepage. The DB is harvested from
  users' private order history — broadcasting its size invites Vinted ToS/data
  scrutiny. Advertise the *capability* ("see what items actually sold for"), never
  the *volume*. This applies to the homepage rewrite and all future copy.

## Queued for v1.2.14 (Lee 2026-08-18)
- **Per-search item-count display (admin panel).** Every poll already computes
  `trackedItemCount` (total matching) + `newItemsLastCount` (new this poll) but
  writes them to local storage only — never surfaced. Build: add these two to
  the heartbeat (or tiny telemetry POST) and show in admin panel as a LIVE
  snapshot per search — "10 new · 180 total" — no history, no time series. Goal:
  tell healthy (items flowing) from dead (zero new) at a glance (the exact
  question from diagnosing Archie's 39 "no_new" searches).

## Access/Environment Notes
- **Homepage visual TODO (Lee 2026-08-27):** current app "screenshots" are
  pixel-faithful HTML/CSS mockups (`.mock-*` classes in globals.css, scenes in
  `app/page.js`). Lee will supply REAL app screenshots later — when they land,
  replace the mockup divs with `<img>` tags. The three scenes needed: (1) sold
  prices dropdown, (2) alerts list with a notification coming in, (3) own
  wardrobe with lots of clothing. Match the real popup: teal #007782 header,
  white cards, #e5e7eb borders, ~380px width.
- supervint-web (website) and Supervint (extension) are SEPARATE
  to one cannot read the other. Always confirm working directory
  matches the task before starting.
- GA4 property G-0DHBJ4FEQX is for the Chrome extension, not the
  website (confirmed by Lee)
- GSC service account (supervint-seo-agent@supervint.iam.gserviceaccount.com)
  connected and working for the website property (sc-domain:supervint.com)
