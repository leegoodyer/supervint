import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const runtime = 'nodejs';

const kv = Redis.fromEnv();

// ─── Remote harvest config (the crowd-source engine's remote control) ──────
// GET /api/extension/harvest-config
//   → { harvestEnabled, harvestMaxOrders, harvestIntervalMin,
//       harvestPageDelayMs, harvestConfigVersion }
//
// Values are read from KV (sv:harvest:config) so Lee can raise/lower the cap,
// kill the harvest, change the cadence, OR FORCE A GLOBAL RE-HARVEST without a
// Store re-publish. On any KV read failure it falls back to the shipped
// defaults (conservative — never unlimited).
//
//   harvestMaxOrders = 0   → unlimited (full sold history)
//   harvestMaxOrders = N   → pull at most N items
//   harvestEnabled   false → harvest skipped entirely (global kill-switch)
//   harvestConfigVersion N → when this increases, every install treats the
//                            harvest as due immediately (ignores lastHarvestAt),
//                            then records the new version so it only fires once.
//
// ⚠️ BUMP harvestConfigVersion when Lee wants everyone to re-harvest NOW.

const DEFAULTS = {
  harvestEnabled: true,
  harvestMaxOrders: 0,
  harvestIntervalMin: 24 * 60, // 24h
  harvestPageDelayMs: 12000,   // 12s anti-flag pacing
  harvestConfigVersion: 1,
};

export async function GET() {
  let cfg = { ...DEFAULTS };
  try {
    const stored = await kv.get('sv:harvest:config');
    if (stored && typeof stored === 'object') cfg = { ...DEFAULTS, ...stored };
  } catch { /* KV unreachable — fall back to defaults */ }

  return NextResponse.json(cfg, { headers: { 'Cache-Control': 'no-store' } });
}
