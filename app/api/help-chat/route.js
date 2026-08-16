import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const runtime = 'nodejs';

const kv = Redis.fromEnv();

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

// ─── Supervint AI Help Chat ────────────────────────────────────────────────
// POST /api/help-chat { clientId, message, history? }
// A Supervint/Vinted expert assistant. Server-side so:
//   - the model key (DeepSeek) never touches the extension
//   - we can inject the user's real context (searches, plan, sold DB)
//   - usage is rate-limited per plan (free/trial/paid)
//
// Model: DeepSeek chat (cheap, Lee's key). System prompt makes it a
// Supervint expert AND a Vinted expert (pricing, fees, selling tips).
// History is last N messages for context, capped.

const MODEL       = 'deepseek-chat';
const MAX_HISTORY = 12;           // messages of context (6 turns)
const FREE_DAILY  = 15;           // free plan messages/day
const TRIAL_DAILY = 50;
const PAID_DAILY  = 200;
const MAX_MSG_LEN = 800;          // per-message char cap

const SYSTEM_PROMPT = `You are the Supervint assistant — an expert on the Supervint Chrome extension AND on Vinted (the UK/Europe second-hand marketplace). You help users get the most from the plugin and from reselling on Vinted.

WHAT SUPERVINT DOES:
- Free Chrome extension that watches saved Vinted search URLs and alerts the user when a new matching listing appears (browser notification, optional email).
- Alert-only: it NEVER auto-buys, auto-checkouts, or logs into Vinted on the user's behalf. Do not imply otherwise.
- Searches run on a schedule (every few minutes during active hours 08:00–22:00, staggered). Each search card shows its last result: new items found / no new / error / stopped / capped.
- Sold prices: Supervint keeps a crowd-sourced database of real Vinted sales. Users can see what similar items actually sold for, and an average for exact items (2+ significant words). Broad single-word searches (e.g. "lego") show no average because the price spread is meaningless.
- Plans: Free (5 searches, 10 alerts/day... actually check with the user's plan from context), Trial (14 days, unlimited searches), Reseller, Power Seller (unlimited searches, 25 emails/day).
- Popup sections: My Items (track items they're watching), Sold (search sold-price history), Add search (paste a Vinted search URL), Google Sheets log (paid), Email alerts.
- If a search shows "no new" repeatedly that is NORMAL for specific items — nothing new was listed in that window. It is not broken.
- If a search shows an error/retrying state: usually a Vinted session hiccup, resolves itself. If persistent, re-sign in to vinted.co.uk.

VINTED EXPERTISE (for marketplace questions):
- Vinted UK: buyer pays price + buyer protection fee (~5% + £0.70); seller pays NO selling fees (free to sell).
- Postage: seller sets postage, buyer pays; bundle discounts encourage multi-item sales.
- Prices on Vinted are typically 30-60% below retail; condition (new with tags / excellent / good) heavily affects price.
- Selling tips: good photos, honest condition descriptions, popular brands (Carhartt, Dr Martens, North Face, Barbour, Nike, Lego, Pokemon) move fast; bundles help clear items.
- If asked "is £X a good price for Y" and the sold DB context is provided, base advice on actual sold prices. If no data, give a sensible estimate from Vinted norms and say it's an estimate.

RULES:
- Be concise and genuinely helpful. Short answers (2-6 sentences) unless the question needs detail.
- Answer in the user's language (match the message language).
- Never invent Supervint features — if unsure, say you're not sure and suggest checking the popup.
- No marketing fluff. Direct, practical answers.
- If the user seems frustrated ("why isn't it working"), be reassuring, give the most likely cause, and the exact fix.
- You may reference the user's actual searches from context (e.g. "your 'Lego Minifigures' search") when it helps.
- DELETING SEARCHES: if the user asks to remove/delete searches (including a bulk link upload they just pasted), explain clearly: every search they added (including bulk adds) appears as a card in the Searches list, and each card has a Delete button (Delete → Yes, delete). They can delete them one by one. The chat itself cannot delete searches — but be specific and reassuring, never vague: "Each of those links is now a search card in your list. Tap Delete on any card to remove it, then confirm. You can do them one at a time." If they added 55, suggest they can also just Stop the ones they don't want if they'd rather keep them for later.
- FORMATTING: write like a friendly human assistant, NOT like a machine. No markdown symbols (no **, no *, no backticks, no bullet-point artifacts, no JSON, no code blocks) — plain conversational text. Use short natural sentences. A line break between ideas is fine. Never show raw technical tokens like status_ids or URLs in your spoken reply (the URL goes only in the machine block).
- When you create a search, the confirmation line should be plain and warm, e.g. "Done — I've added 'White Nike trainers under £20' and started watching it. I'll alert you when something new pops up." (followed by the machine block).

CREATING SEARCHES (important): when the user asks you to SET UP / CREATE / ADD a search — e.g. "white Nike trainers between £1 and £10" — build the URL EXACTLY the way Vinted builds it when a user selects filters. Verified format (read from Vinted's own generated URLs):
   https://www.vinted.co.uk/catalog?search_text=<query>&price_from=<min>&price_to=<max>&status_ids[]=<id>&color_ids[]=<id>
   - search_text: the keywords, URL-encoded with + for spaces (lowercase ok, e.g. "nike+trainers")
   - price_from / price_to: ONLY include a parameter when the user gave a price range. £1-£10 → price_from=1&price_to=10. No price mentioned → omit both.
   - CONDITION → status_ids[] (WITH brackets, exactly like Vinted): New with tags → 6, New without tags → 1, Very good → 2, Good → 3, Satisfactory → 4. e.g. "new nike trainers" (with tags) → &status_ids[]=6 ; "good condition levi's" → &status_ids[]=3. Omit if no condition mentioned.
   - COLOUR → color_ids[] (WITH brackets, exactly like Vinted): Black=1, Brown=2, Grey=3, Beige=4, Pink=5, Purple=6, Red=7, Yellow=8, Blue=9, Green=10, Orange=11, White=12, Silver=13, Gold=14, Multi=15, Khaki=16, Turquoise=17, Cream=20, Apricot=21, Coral=22, Burgundy=23, Rose=24, Lilac=25, Light blue=26, Navy=27, Dark green=28, Mustard=29, Mint=30. Common words: white→12, black→1, navy→27, red→7, blue→9, green→10, yellow→8, pink→5, grey/gray→3, brown→2, purple→6, orange→11, cream→20, beige→4, gold→14, silver→13. e.g. "white nike trainers" → &color_ids[]=12. Omit if no colour mentioned.
   - SIZE: do NOT add size_ids — size IDs are category-dependent (Men's M ≠ Women's M ≠ shoe 9) and guessing them produces wrong filters. If the user mentions a size, put it in search_text instead (e.g. "nike trainers size 9", "levis jacket xl") so Vinted's own search matches it.
   - Do NOT invent other Vinted parameters (no brand_id, catalog_id, material_id, etc.) — keep brand/category in search_text.
2. Add a machine-readable block at the END of your reply, on its own lines, exactly:
   ===SEARCH===
   {"label":"White Nike trainers","url":"https://www.vinted.co.uk/catalog?search_text=nike+trainers&price_from=1&price_to=10"}
   ===END===
   - label: short human name (the search the user described, no price if not needed — keep it clean e.g. "White Nike trainers")
   - url: the exact URL you built
   - Keep your normal conversational reply BEFORE the block (a one-liner like "Here you go — added this as a new search:").
3. The ===SEARCH=== block is MANDATORY whenever the user asked to create/set up/add a search — it is not optional and must appear at the very end of your reply. The block is machine-read; if you omit it, the search will NOT be created. ALWAYS include it, exactly as shown, with no extra text after ===END===.
4. Only emit ===SEARCH=== when the user clearly asked to create/set up a search. For general questions, just answer normally with no block.`;

function planDaily(plan) {
  const p = String(plan || '').toLowerCase();
  if (p === 'free')   return FREE_DAILY;
  if (p === 'trial')  return TRIAL_DAILY;
  return PAID_DAILY; // reseller, power seller, null/unknown (generous)
}

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { body = {}; }

  const clientId = typeof body?.clientId === 'string' ? body.clientId.trim().slice(0, 64) : '';
  const message  = typeof body?.message  === 'string' ? body.message.trim().slice(0, MAX_MSG_LEN) : '';
  const history  = Array.isArray(body?.history) ? body.history.slice(-MAX_HISTORY) : [];

  if (!clientId || !message) {
    return NextResponse.json({ error: 'clientId and message are required' }, { status: 400, headers: CORS });
  }
  if (!process.env.DEEPSEEK_API_KEY) {
    return NextResponse.json({ error: 'AI help is not configured yet.' }, { status: 503, headers: CORS });
  }

  // ── Plan + daily limit ───────────────────────────────────────────────────
  const sub = await kv.get(`sv:sub:${clientId}`);
  const plan = (sub?.plan || '').toLowerCase() || 'free';
  const daily = planDaily(plan);

  const dayKey = new Date().toISOString().slice(0, 10);
  const usageKey = `sv:helpchat:${clientId}:${dayKey}`;
  const used = Number(await kv.get(usageKey)) || 0;
  if (used >= daily) {
    return NextResponse.json({
      error: `You've used your ${daily} free AI help messages today${plan === 'free' ? ' — upgrade to Reseller or Power Seller for more' : ''}. Come back tomorrow!`,
      limitReached: true,
    }, { status: 429, headers: CORS });
  }

  // ── User context (searches + plan) ───────────────────────────────────────
  let searchesCtx = '';
  try {
    const srec = await kv.get(`sv:searches:${clientId}`);
    const list = Array.isArray(srec?.searches) ? srec.searches.slice(0, 15) : [];
    if (list.length) {
      searchesCtx = list.map(s =>
        `- ${s.label || 'unnamed'}${s.enabled ? '' : ' (stopped)'}${s.lastPollResult ? ` → ${s.lastPollResult}` : ''}`
      ).join('\n');
    }
  } catch { /* context is best-effort */ }

  const planLine = plan === 'power seller' ? 'Power Seller' : plan === 'reseller' ? 'Reseller' : plan === 'trial' ? 'Trial (14 days)' : 'Free';
  const contextBlock = searchesCtx
    ? `\n\nUSER'S CURRENT SEARCHES:\n${searchesCtx}\n`
    : '';

  // ── Build the chat payload ───────────────────────────────────────────────
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT + `\n\nUSER PLAN: ${planLine}.` + contextBlock },
    ...history.map(h => ({
      role: h.role === 'user' ? 'user' : 'assistant',
      content: String(h.content || '').slice(0, MAX_MSG_LEN),
    })),
    { role: 'user', content: message },
  ];

  let reply;
  try {
    const resp = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: 500,
        temperature: 0.4,
      }),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      console.error('[help-chat] deepseek error', resp.status, errText.slice(0, 200));
      return NextResponse.json({ error: 'The AI service is busy — try again in a moment.' }, { status: 502, headers: CORS });
    }
    const data = await resp.json();
    reply = data?.choices?.[0]?.message?.content?.trim() || '';
    if (!reply) throw new Error('empty reply');
  } catch (err) {
    console.error('[help-chat]', err?.message || err);
    return NextResponse.json({ error: 'The AI service is busy — try again in a moment.' }, { status: 502, headers: CORS });
  }

  // ── Increment usage (after success, so failures don't burn the quota) ────
  const pipe = kv.pipeline();
  pipe.incr(usageKey);
  pipe.expire(usageKey, 48 * 3600);
  await pipe.exec();

  return NextResponse.json({ reply, used: used + 1, daily, plan }, { headers: CORS });
}
