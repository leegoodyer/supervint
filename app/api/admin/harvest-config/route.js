import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { isAdminAuthed } from '@/lib/admin-auth';

export const runtime = 'nodejs';

const kv = Redis.fromEnv();

const CONFIG_KEY = 'sv:harvest:config';
const DEFAULTS = {
  harvestEnabled: true,
  harvestMaxOrders: 0,
  harvestIntervalMin: 24 * 60,
  harvestPageDelayMs: 12000,
  harvestConfigVersion: 1,
};

// Admin read + live-update of the remote harvest config (no deploy needed).
// GET  → current config
// POST → { harvestEnabled?, harvestMaxOrders?, harvestIntervalMin?,
//          harvestPageDelayMs?, forceReharvest?: true }
//   forceReharvest bumps harvestConfigVersion by 1 → every install re-harvests
//   on its next 3-min watchdog tick.
export async function GET() {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let cfg = { ...DEFAULTS };
  try {
    const stored = await kv.get(CONFIG_KEY);
    if (stored && typeof stored === 'object') cfg = { ...DEFAULTS, ...stored };
  } catch {}
  return NextResponse.json(cfg);
}

export async function POST(request) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let body;
  try { body = await request.json(); } catch { body = {}; }

  const cur = (await kv.get(CONFIG_KEY)) || { ...DEFAULTS };

  const next = { ...DEFAULTS, ...cur };
  if (typeof body.harvestEnabled === 'boolean') next.harvestEnabled = body.harvestEnabled;
  if (Number.isFinite(Number(body.harvestMaxOrders))) next.harvestMaxOrders = Math.max(0, Number(body.harvestMaxOrders));
  if (Number.isFinite(Number(body.harvestIntervalMin))) next.harvestIntervalMin = Math.max(1, Number(body.harvestIntervalMin));
  if (Number.isFinite(Number(body.harvestPageDelayMs))) next.harvestPageDelayMs = Math.max(0, Number(body.harvestPageDelayMs));
  if (body.forceReharvest === true) {
    next.harvestConfigVersion = (Number(next.harvestConfigVersion) || 0) + 1;
  }

  await kv.set(CONFIG_KEY, next);
  return NextResponse.json({ ok: true, config: next });
}
