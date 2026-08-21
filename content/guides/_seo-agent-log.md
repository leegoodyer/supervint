# Supervint SEO Agent — Running Log
# Each entry: keyword | date proposed | approved/rejected | notes | GSC performance (filled in later)

| # | Keyword / Angle | Date Proposed | Status | Notes | GSC (impressions/clicks/position) |
|---|---|---|---|---|---|
| 1 | Vinted Adidas trainers alert | 2026-07-12 | ✅ Published | content/guides/vinted-adidas-trainers-alert.json | — |
| 2 | Vinted price alert (pillar) | Pre-existing | ✅ Published | content/guides/vinted-price-alert.json | — |
| 3 | Vinted vintage denim alert | Pre-existing | ✅ Published | content/guides/vinted-alerts-vintage-denim.json | — |
| 4 | Vinted Nike trainers alert | Pre-existing | ✅ Published | content/guides/vinted-alerts-nike-trainers.json | — |
| 5 | Vinted Carhartt & workwear alert | Pre-existing | ✅ Published | content/guides/vinted-alerts-carhartt-workwear.json | — |
| 6 | Vinted alerts without ban risk | Pre-existing | ✅ Published | content/guides/vinted-alerts-without-the-ban-risk.json | — |
| 7 | Vinted Dr. Martens alert | 2026-07-16 | ✅ Published | content/guides/vinted-alerts-dr-martens.json | — |
| 8 | Vinted Patagonia alert | 2026-07-20 | ✅ Published | content/guides/vinted-alerts-patagonia.json | — |
| 9 | Vinted alerts for resellers | 2026-07-20 | ✅ Published | content/guides/vinted-alerts-for-resellers.json | — |
| 10 | Vinted Barbour alert | 2026-07-20 | ✅ Published | content/guides/vinted-alerts-barbour.json | — |
| 11 | Vinted Arc'teryx alert | 2026-07-20 | ✅ Published | content/guides/vinted-alerts-arcteryx.json | — |
| 12 | Vinted Designer Bags alert | 2026-08-06 | ✅ Published | content/guides/vinted-alerts-designer-bags.json | — |
| 13 | Vinted Retro Gaming alert | 2026-08-06 | ✅ Published | content/guides/vinted-alerts-retro-gaming.json | — |
| 14 | Vinted North Face alert | 2026-08-06 | ✅ Published | content/guides/vinted-alerts-north-face.json | — |
| 15 | Vinted Children's Clothing alert | 2026-08-06 | ✅ Published | content/guides/vinted-alerts-childrens-clothing.json | — |
| 16 | Vinted vs Depop alerts comparison | 2026-08-06 | ✅ Published | content/guides/vinted-vs-depop-alerts.json | — |
| 17 | Vinted Football Shirt alerts (primary) / Vinted Stone Island alerts (secondary) | 2026-08-06 | ✅ Published | content/guides/vinted-alerts-football-shirts.json + vinted-alerts-stone-island.json | — |
| 18 | Is Vinted safe to sell on | 2026-08-06 | ✅ Published | content/guides/is-vinted-safe-to-sell-on.json | — |
| 19 | Vinted Levi's denim alert | 2026-08-06 | ✅ Published | content/guides/vinted-alerts-levis-denim.json | — |
| 20 | How to contact Vinted support | 2026-08-11 | ✅ Published | content/guides/how-to-contact-vinted-support.json (from FB/Reddit pain point: "how do I contact Vinted") | — |
| 21 | Vinted delivery issues troubleshooting | 2026-08-11 | ✅ Published | content/guides/vinted-delivery-issues-troubleshooting.json (pain point: "delivered but not received") | — |
| 22 | Vinted scams & buyer protection | 2026-08-11 | ✅ Published | content/guides/vinted-scams-buyer-protection.json (pain point: scam reports) | — |
| 23 | PRIMARY: Does Vinted notify when price changes / SECONDARY: What is a Vinted sniper | 2026-08-14 | ✅ Published | content/guides/does-vinted-notify-price-changes.json | — |
| 24 | How to see sold prices on Vinted | 2026-08-17 | ✅ Published | content/guides/how-to-see-sold-prices-on-vinted.json | GSC: "how to see sold prices on vinted" pos 42 — product-feature match (sold DB) |
| 25 | vinted sniper (dedicated guide; secondary: vinted sniping / vinted snipe / how to snipe on vinted) | 2026-08-17 | ✅ Published | content/guides/vinted-sniper.json | GSC 90d: "vinted sniper" 11 imp / 1 cl / 14.3 |
| 26 | PRIMARY: Vinted school uniform alerts (secondary: vinted school uniform, school uniform bundles) | 2026-08-20 | ⏳ Proposed — awaiting approval | seasonal use-case; peak back-to-school week; no alert-tool competition | — |
| 27 | SECONDARY: Vinted notifications not working (why you miss new listings + fixes) | 2026-08-20 | ⏳ Proposed — awaiting approval | evergreen troubleshooting; Reddit/TikTok/FB pain; thin SERP; direct product fit | — |

## GSC snapshot (90 days to 2026-08-20, from scripts/gsc-report.py)
- Totals: 29 clicks / 535 impressions / CTR 5.42% / avg pos 9.5 / 54 active days
- Opportunity bucket (pos 11–30) has NO uncovered queries: "vinted sniper" 11 imp @ 14.3 (guide #25 now live 08-17 — monitor climb); rest are price-notify long-tails @ 9–12 already served by guide #23
- "vinted snipe" 2 imp @ 29.5 / "vinted sniping" 2 imp @ 35 — synonyms of #25; do NOT create separate pages (cannibalisation)
- Price-notify cluster healthy: "does vinted notify when price increases" 20 imp @ 9.4; drop variants 6 imp @ 10.2
- Nascent (not now): "how to see sold prices on vinted" 1 imp @ 42 (revisit when sold-price feature marketed); French "alerte/alertes vinted" 10 imp combined @ 30–52 (needs FR pages); "vinted chrome" 1 imp @ 38
- Top pages: /guides/vinted-price-alert 326 imp @ 13.7; / 176 imp @ 7.2; /guides/vinted-alerts-without-the-ban-risk 28 imp @ 16.7; adidas 18 imp @ 6.7
- Brand queries ("supervint" 20 imp @ 1.0) still the main click source — content not yet ranking for head terms; keep targeting long-tail/use-case
- Competitor blog audit 08-20: Vinotify (webhooks, tool comparisons), Souk (bots, reselling, Vinted Go), VintiePlus (78 posts: reseller/tax/Netherlands), Telvin-bot (Telegram alerts) — NONE cover school uniform or notification troubleshooting
