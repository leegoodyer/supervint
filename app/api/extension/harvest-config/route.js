import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// ─── Remote harvest config (the crowd-source engine's remote control) ──────
// GET /api/extension/harvest-config
//   → { harvestEnabled: true|false, harvestMaxOrders: number }
//
// Lets the harvest cap be raised/lowered and the whole harvest killed from the
// server WITHOUT a Store re-publish. The extension fetches this before each
// weekly harvest run; on any fetch failure it falls back to its local default
// (50) — conservative, never unlimited.
//
//   harvestMaxOrders = 0   → unlimited (full sold history)
//   harvestMaxOrders = N   → pull at most N items
//   harvestEnabled   false → harvest skipped entirely (global kill-switch)
//
// ⚠️ BUMP harvestMaxOrders to 0 ONLY when Lee is ready for the full
// crowd-source ramp. Default ships at 50 (cautious first run on every account).

const HARVEST_ENABLED = true;
const HARVEST_MAX_ORDERS = 50;

export async function GET() {
  return NextResponse.json(
    { harvestEnabled: HARVEST_ENABLED, harvestMaxOrders: HARVEST_MAX_ORDERS },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
