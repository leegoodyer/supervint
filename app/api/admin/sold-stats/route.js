import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { isAdminAuthed } from '@/lib/admin-auth';

const kv = Redis.fromEnv();

// Admin-only sold-DB audit. Counts distinct sold items WITHOUT a full key scan:
// `sv:sold:recent` is a zset (soldAt -> itemId) maintained on every sale, so
// ZCARD gives the total instantly. The old `kv.keys('sv:sold:item:*')` scan
// broke once the DB grew past Upstash's "too many keys" limit — do NOT go back
// to a key scan. Probe detection (test/junk records) samples a bounded slice of
// the titles zset instead.
//
// ?recent=N also returns a breakdown of the most-recent N sold records by
// firstReportedBy (clientId) — used to see which accounts are feeding the DB.
export async function GET(request) {
  const ok = await isAdminAuthed();
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Distinct sold item count = cardinality of the recency zset.
  const total = await kv.zcard('sv:sold:recent');

  // Probe/junk scan: sample titles from the lexicographic titles zset.
  const probes = [];
  try {
    const sample = await kv.zrange('sv:sold:titles', 0, 199);
    for (const member of sample) {
      const [title, itemId] = String(member).split('||');
      if (/^(probe|z|q|probe[0-9x]?)$/i.test(title || '')) {
        probes.push({ itemId, title });
      }
    }
  } catch { /* best effort */ }

  // Optional reporter breakdown of the most-recent N sold records.
  let topReporters = null;
  const { searchParams } = new URL(request.url);
  const recentN = parseInt(searchParams.get('recent') || '0', 10);
  if (recentN > 0) {
    try {
      // Most-recent members by soldAt (zset ascending) = tail of the range.
      const size = await kv.zcard('sv:sold:recent');
      const start = Math.max(0, size - Math.min(recentN, 500));
      const itemIds = await kv.zrange('sv:sold:recent', start, size - 1);
      const tally = {};
      // Fetch records in chunks (Upstash mget is fine for a few hundred).
      for (let i = 0; i < itemIds.length; i += 100) {
        const chunk = itemIds.slice(i, i + 100);
        const keys = chunk.map((id) => `sv:sold:item:${id}`);
        const recs = await kv.mget(...keys);
        for (const r of recs) {
          if (!r) continue;
          const who = String(r.firstReportedBy || '(none)');
          tally[who] = (tally[who] || 0) + 1;
        }
      }
      topReporters = Object.entries(tally)
        .map(([clientId, count]) => ({ clientId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
    } catch (e) {
      topReporters = { error: String(e?.message || e).slice(0, 120) };
    }
  }

  return NextResponse.json({ ok: true, total, probeCount: probes.length, probes: probes.slice(0, 20), ...(topReporters ? { topReporters } : {}) });
}
