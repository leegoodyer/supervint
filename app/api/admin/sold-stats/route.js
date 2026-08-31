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
export async function GET() {
  const ok = await isAdminAuthed();
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Distinct sold item count = cardinality of the recency zset.
  const total = await kv.zcard('sv:sold:recent');

  // Probe/junk scan: sample titles from the lexicographic titles zset.
  // zrange returns members as "lowercased-title||itemId". Bound it so we don't
  // page through the whole DB.
  const probes = [];
  try {
    const sample = await kv.zrange('sv:sold:titles', 0, 199);
    for (const member of sample) {
      const [title, itemId] = String(member).split('||');
      if (/^(probe|z|q|probe[0-9x]?)$/i.test(title || '')) {
        probes.push({ itemId, title, member });
      }
    }
  } catch { /* best effort — probe scan is informational only */ }

  return NextResponse.json({ ok: true, total, probeCount: probes.length, probes: probes.slice(0, 20) });
}
