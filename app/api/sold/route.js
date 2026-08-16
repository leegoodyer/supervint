import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const runtime = 'nodejs';

const kv = Redis.fromEnv();

// ─── Supervint sold-price database ──────────────────────────────────────────
// POST /api/sold — record a sold event reported by ANY user's extension.
// Body: { itemId, title?, price, currency?, keyword, brand?, size?, ts? }
//
// The extension detects an item it was watching vanish from a search, fetches
// the item page, confirms it's genuinely SOLD (not removed), then reports the
// sale here. Events are aggregated into a single SHARED, crowd-sourced
// sold-price index — every user's searches feed one database.
//
// Storage shape (Upstash KV):
//   sv:sold:item:<itemId>      -> { itemId, title, price, currency, keyword,
//                                  brand, size, soldAt, firstReportedBy } (dedupe)
//   sv:sold:kw:<keyword>       -> hash: itemId -> soldAt (fast per-keyword scan)
//   sv:sold:recent             -> zset: soldAt -> itemId (recency ordering)
//
// No user identity is stored with events — just the item + price + keyword.
// `firstReportedBy` is a clientId only used for abuse tracing, never displayed.

const PRICE_MAX = 1_000_000;
const TITLE_MAX = 300;
const KEYWORD_MAX = 120;
const RECENT_TTL = 90 * 24 * 3600; // 90 days of recency index

// Tokens that carry no price signal — never indexed as match terms.
const STOPWORDS = new Set([
  'the','a','an','and','or','for','with','new','rare','vintage','original',
  'brand','genuine','authentic','boxed','with','free','uk','size','plus',
  'unisex','mens','womens','kids','boys','girls','used','like','from',
]);

// Normalize a title/query into significant search tokens. Numbers and
// identifiers (set numbers like "2-1B", "42115", "175/151") are kept intact
// — splitting them would break exact item matching.
export function tokenize(text) {
  const out = new Set();
  for (const raw of String(text || '').toLowerCase().split(/\s+/)) {
    let tok = raw.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');
    if (tok.length >= 3 && !STOPWORDS.has(tok)) out.add(tok);
  }
  return [...out];
}

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { body = {}; }

  const itemId = String(body?.itemId ?? '').trim();
  const price = Number(body?.price);
  const keyword = typeof body?.keyword === 'string' ? body.keyword.trim().slice(0, KEYWORD_MAX) : '';

  if (!itemId || !Number.isFinite(price) || price <= 0 || price > PRICE_MAX) {
    return NextResponse.json({ error: 'itemId and a valid price are required' }, { status: 400 });
  }

  const title    = typeof body?.title === 'string' ? body.title.trim().slice(0, TITLE_MAX) : '';
  const currency = typeof body?.currency === 'string' && body.currency ? body.currency.slice(0, 3) : 'GBP';
  const brand    = typeof body?.brand === 'string' ? body.brand.trim().slice(0, 60) : '';
  const size     = typeof body?.size === 'string' ? body.size.trim().slice(0, 30) : '';
  const soldAt   = Number(body?.ts) || Date.now();
  const reporter = typeof body?.clientId === 'string' ? body.clientId.slice(0, 64) : '';

  // Dedupe: the same item can only be recorded once (first report wins).
  const itemKey = `sv:sold:item:${itemId}`;
  const existing = await kv.get(itemKey);
  if (existing) {
    return NextResponse.json({ ok: true, stored: false, reason: 'already recorded', sold: existing });
  }

  const record = { itemId, title, price, currency, keyword, brand, size, soldAt, firstReportedBy: reporter };

  // Multi-write so the three indexes stay consistent.
  const pipe = kv.pipeline();
  pipe.set(itemKey, record, { ex: RECENT_TTL });
  pipe.hset(`sv:sold:kw:${keyword.toLowerCase()}`, { [itemId]: soldAt });
  pipe.zadd('sv:sold:recent', { score: soldAt, member: itemId });
  // Exact-match index: significant tokens from the TITLE. This is what makes
  // "lego 2-1B medical droid" return that exact item's sales instead of every
  // Lego listing (which would be a meaningless £1–£1000 average).
  for (const tok of tokenize(title)) {
    pipe.hset(`sv:sold:tok:${tok}`, { [itemId]: soldAt });
  }
  await pipe.exec();

  return NextResponse.json({ ok: true, stored: true, sold: record });
}

// GET /api/sold?keyword=ps5&days=30&clientId=xxx — query the SHARED sold-price index.
// Paid-only: free plans get 403 (the extension shows the upgrade prompt).
// Returns aggregates + recent individual sales for a keyword.
export async function GET(request) {
  const url = new URL(request.url);
  const keyword = (url.searchParams.get('keyword') || '').trim().toLowerCase().slice(0, KEYWORD_MAX);
  const days = Math.min(Number(url.searchParams.get('days')) || 90, 90);
  const clientId = (url.searchParams.get('clientId') || '').trim();

  // Plan gate: paid (reseller/power seller) or trial (reverse trial = full
  // features) can read; free cannot. Trial users have plan 'trial' in KV.
  if (clientId) {
    const sub = await kv.get(`sv:sub:${clientId}`);
    const plan = (sub?.plan || '').toLowerCase();
    if (plan === 'free' || plan === '') {
      return NextResponse.json({ error: 'Sold-price history requires a paid plan.' }, { status: 403 });
    }
  }
  const limit = Math.min(Number(url.searchParams.get('limit')) || 25, 100);

  if (!keyword) {
    return NextResponse.json({ error: 'keyword required' }, { status: 400 });
  }

  const since = Date.now() - days * 24 * 3600 * 1000;

  // EXACT-MATCH semantics: the query is tokenized, each token's sold-item
  // bucket is fetched, and the intersection is the set of items whose TITLES
  // contain every significant term. "lego 2-1B medical droid" thus matches
  // only that exact item — never the whole Lego category (whose £1–£1000
  // spread would make the average meaningless). Falls back to the broad
  // keyword bucket only when no token matches at all.
  const tokens = tokenize(keyword);
  let ids = [];
  if (tokens.length > 0) {
    const buckets = await Promise.all(tokens.map(t => kv.hgetall(`sv:sold:tok:${t}`)));
    // Start with the smallest bucket, intersect the rest.
    const sets = buckets.filter(Boolean).map(b => Object.keys(b));
    if (sets.length === tokens.length) {
      sets.sort((a, b) => a.length - b.length);
      ids = sets[0].filter(id => sets.every(s => s.includes(id)));
    }
  }
  // No exact token match → fall back to the search-keyword bucket (broad).
  if (ids.length === 0) {
    const kwHash = await kv.hgetall(`sv:sold:kw:${keyword}`);
    ids = kwHash ? Object.keys(kwHash) : [];
  }

  if (ids.length === 0) {
    return NextResponse.json({ keyword, days, sales: [], total: 0, avgPrice: null, minPrice: null, maxPrice: null, sampleSize: 0, matchMode: tokens.length ? 'exact' : 'keyword' });
  }

  // Fetch each item record (bounded).
  const batch = ids.slice(0, 200);
  const records = (await kv.mget(batch.map(id => `sv:sold:item:${id}`))).filter(Boolean);

  // Filter to the requested window + collect stats.
  const inWindow = records.filter(r => r.soldAt >= since);
  const prices = inWindow.map(r => Number(r.price)).filter(Number.isFinite);

  inWindow.sort((a, b) => b.soldAt - a.soldAt);

  const total = inWindow.length;
  const avg = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null;

  return NextResponse.json({
    keyword,
    days,
    total,
    matchMode: (tokens.length > 0 && ids.length > 0) ? 'exact' : 'keyword',
    avgPrice: avg ? Math.round(avg * 100) / 100 : null,
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
    sampleSize: prices.length,
    sales: inWindow.slice(0, limit).map(r => ({
      itemId: r.itemId, title: r.title, price: r.price, currency: r.currency,
      brand: r.brand, size: r.size, soldAt: r.soldAt,
    })),
  });
}

// DELETE /api/sold — nuke the whole sold DB (used after a classifier bug
// polluted it with live items). Admin-only.
import { isAdminAuthed } from '@/lib/admin-auth';
export async function DELETE() {
  const ok = await isAdminAuthed();
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const keys = await kv.keys('sv:sold:*');
  if (keys.length) await kv.del(...keys);
  return NextResponse.json({ ok: true, purged: keys.length });
}
