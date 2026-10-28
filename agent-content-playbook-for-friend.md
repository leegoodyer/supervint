# How to Build an Agent That Creates Competitor-Optimised Content (and Gets It Ranking)

This is exactly what I did for Supervint (supervint.com) — a Vinted alert tool. It took the site from zero to ~62 published pages, a steady climb in Google Search Console clicks/impressions, and a real content pipeline that runs itself. Here's the full plan and how-to, so you can copy it for your company.

---

## Part 1 — What the agent actually is

It's not one magic prompt. It's a **personal AI agent (Hermes Agent) with persistent memory + scheduled jobs + skills**, running on a computer. The agent:

1. Has a **memory** of your company facts, brand rules, and what's been published.
2. Has **skills** — written playbooks that tell it exactly how to do a task (write an SEO article, pull analytics, post to social).
3. Runs **cron jobs** — scheduled tasks that fire on their own (e.g. "every Monday and Thursday, research competitors and propose new content").
4. Does real work with **tools** — it can search the web, read/write files, edit the website via API, pull Google Search Console data, and post to Facebook.

The key insight: **the agent isn't a one-off prompt. It's a loop that researches → proposes → writes → publishes → measures → improves.**

---

## Part 2 — The exact workflow I built for Supervint

### Step 1: Nail the product facts (one page, never contradict)
Before any content, write down the non-negotiable facts the agent must never get wrong:
- What the product does and DOESN'T do (Supervint is alert-only — never claims to log in or auto-buy).
- Brand voice and tone rules (UK voice, plain words, no AI-sounding clichés).
- What's off-limits (no fabricated stats, no made-up prices, no competitor bashing).

This goes in the agent's memory so every article is on-brand and honest.

### Step 2: Competitor research (the "look at competitors" part)
Every content cycle, the agent does this:
1. Searches the target keyword and reads the actual search results (the SERP).
2. Identifies the **gap**: what competitors AREN'T covering, or cover badly.
3. Classifies each keyword: is it a thin SERP (Reddit threads, generic answers = winnable) or a competitive SERP (established blogs = hard)?

**The winning rule I learned:** don't chase broad head terms ("vinted alerts"). Chase **specific product-intent queries competitors ignore** — "how to spot fake Ugg boots on Vinted", "is it safe to buy an iPhone on Vinted". These are easier to rank and actually convert.

### Step 3: Verify facts before writing (non-negotiable)
The agent NEVER invents specifics. For every factual claim:
- Search it, read the actual source (a brand's official page, a legit-check guide, a help centre).
- If a number or fact can't be verified, keep the sentence general.

This one rule is what stops the agent producing confident-sounding nonsense that gets your company in trouble.

### Step 4: Write to a fixed structure
Every article follows the same skeleton: H1 (the exact search phrase) → direct answer in the first sentence → H2 sections → FAQ block. Internal links to your other pages. ~1,000–1,400 words. One primary keyword per page.

### Step 5: Publish via API (no manual clicking)
The agent edits the website programmatically (for Supervint it's a Next.js site + git push; for a WordPress site it'd be the WP REST API). New page goes live in minutes. This is what makes it scale — no human copy-pasting.

### Step 6: Measure with Google Search Console
The agent pulls real data: impressions, clicks, position, per page and per query. It uses this to:
- Find pages ranking 4–11 ("striking distance") worth optimising.
- Find queries getting impressions but 0 clicks (title doesn't match intent → fix the title).
- Spot new keyword opportunities nobody's targeted.

### Step 7: Backlinks — YouTube + social (the part you asked about)
The honest truth: social media links are **nofollow** (they don't directly boost rankings), but they drive traffic and brand searches. The real backlink levers are:

1. **YouTube** — create short videos answering the exact questions your articles answer, link to the article in the description. YouTube is the second-biggest search engine, and its videos rank in Google too.
2. **Create a linkable asset** — something so useful other sites link to it naturally. For Supervint this was a "what actually sells on Vinted" data report (real sold-price data nobody else has). For you, find your equivalent: original data, a free tool, a genuinely useful calculator.
3. **Directories & profiles** — Product Hunt, AlternativeTo, G2, Capterra, Trustpilot. Do each ONCE with a real description (not 200 thin directories — that's spam).
4. **Social posting** — post your best articles to Facebook/LinkedIn/X/Instagram one-a-day, question-first, with the link. NOT every article, and never a bare link dump.
5. **Answer communities** — Reddit/Facebook groups where you genuinely help, drop the link only when it's the honest answer.

**What to avoid (gets you penalised):** paying for links, link farms, PBNs, comment spam, mass directory submissions, over-optimised anchor text. Google detects *patterns*, not just individual bad links.

### Step 8: Automate it with cron jobs
Once the workflow is proven, schedule it:
- **Content agent** (Mon/Thu): research competitors → propose new articles → wait for your approval → draft.
- **Pain-point agent** (Mon/Wed/Fri): scan Reddit/Facebook for recurring real problems → write an article on each.
- **Analytics agent** (daily): pull GSC data, report trends.
- **Social agent** (daily): post one shareable article to Facebook.

---

## Part 3 — Step-by-step setup for YOUR company

### What you need
1. **Hermes Agent** (the AI agent I'm using) — install on a computer. It's free/open to set up; the model (DeepSeek) costs pennies per run.
2. **A website** the agent can edit via API (WordPress REST API is the easiest if you're non-technical; a git-based site works too).
3. **Google Search Console** connected to your site (free) so the agent can read real performance data.
4. **Your company facts** written down (Step 1 above) so the agent stays on-brand.

### The 5-minute setup sequence
1. Install Hermes Agent.
2. Write your company "brain" — one text file with: what you sell, your voice, your non-negotiables, your top 20 target keywords.
3. Create ONE skill: "write an SEO article" — the fixed structure + fact-verification rule from Part 2.
4. Connect Google Search Console (so it can measure).
5. Create your first cron job: "every Monday and Thursday, research competitors for [your niche] and propose 2 new article ideas with reasoning. Do not write until I approve."

### Then iterate
- Week 1: the agent researches + proposes. You approve or redirect.
- Week 2: it writes + publishes the approved ones.
- Week 3: it pulls GSC data and tells you what's working.
- Week 4+: it's proposing based on real data, not guesses.

The first 2 weeks need your input (approving, correcting voice). After that it mostly runs itself, and you steer.

---

## Part 4 — How I promoted it (so you can copy the setup)

The honest version of "how Lee promoted me to do it":

1. **He wrote the product facts first** — one clear statement of what Supervint does and doesn't do, and the brand voice. This is the single most important input.
2. **He said "always look at what competitors do and find the gap"** — so competitor research became a standing instruction, not a one-off.
3. **He set the guardrails** — "never invent stats or prices", "verify against real sources", "show me before publishing". These kept the output trustworthy.
4. **He connected the measuring** — Google Search Console access, so the agent improves off real clicks/impressions, not vibes.
5. **He automated the cadence** — cron jobs so content is proposed, written and posted on a schedule, not on-demand.
6. **He pushed the backlink side** — YouTube + social + a linkable data asset + directories, with an explicit "no spam, no penalties" rule.

---

## The one-line summary

**Build the agent as a loop — research competitors → find the gap → verify facts → write to a fixed structure → publish via API → measure with GSC → post the good stuff to social → repeat on a schedule — with your product facts and guardrails in its memory so it never goes off-brand.**

That's the whole game. Copy this, swap "Supervint" for your company, and you'll be 90% of the way there on day one.
