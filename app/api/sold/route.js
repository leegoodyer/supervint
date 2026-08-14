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
  await pipe.exec();

  return NextResponse.json({ ok: true, stored: true, sold: record });
}

// GET /api/sold?keyword=ps5&days=30 — query the SHARED sold-price index.
// Returns aggregates + recent individual sales for a keyword.
export async function GET(request) {
  const url = new URL(request.url);
  const keyword = (url.searchParams.get('keyword') || '').trim().toLowerCase().slice(0, KEYWORD_MAX);
  const days = Math.min(Number(url.searchParams.get('days')) || 90, 90);
  const limit = Math.min(Number(url.searchParams.get('limit')) || 25, 100);

  if (!keyword) {
    return NextResponse.json({ error: 'keyword required' }, { status: 400 });
  }

  const since = Date.now() - days * 24 * 3600 * 1000;

  // All item IDs ever seen for this keyword.
  const kwHash = await kv.hgetall(`sv:sold:kw:${keyword}`);
  const ids = kwHash ? Object.keys(kwHash) : [];

  if (ids.length === 0) {
    return NextResponse.json({ keyword, days, sales: [], total: 0, avgPrice: null, minPrice: null, maxPrice: null, sampleSize: 0 });
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
