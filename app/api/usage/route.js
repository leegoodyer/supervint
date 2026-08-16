import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const runtime = 'nodejs';

const kv = Redis.fromEnv();

// Allowed event names — anything else is rejected (prevents junk).
const ALLOWED_EVENTS = new Set([
  'panel_opened',        // popup/panel opened
  'search_created',      // new search saved
  'search_deleted',      // search removed
  'search_toggled',      // start/stop a search
  'search_my_items',     // used the "Search My Items" closet search
  'sold_search',         // used the "Sold" sold-price search
  'notif_clicked',       // clicked an alert notification
  'email_setup',         // connected an email for backups
  'sheets_connected',    // connected Google Sheets
  'alert_test',          // sent the demo/test alert
]);

// POST /api/usage — fire-and-forget feature-usage event from the extension.
// Body: { clientId, event, ts? }
// Storage:
//   sv:usage:client:<clientId>   -> hash: event -> count (per-user totals)
//   sv:usage:day:YYYY-MM-DD:<event> -> count (daily per-event)
//   sv:usage:event:<event>       -> count (all-time per-event)
export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { body = {}; }

  const clientId = typeof body?.clientId === 'string' ? body.clientId.trim() : '';
  const event    = typeof body?.event === 'string' ? body.event.trim() : '';
  if (!clientId || !ALLOWED_EVENTS.has(event)) {
    return NextResponse.json({ ok: false, error: 'clientId and a valid event are required' }, { status: 400 });
  }

  const day = new Date().toISOString().slice(0, 10);

  const pipe = kv.pipeline();
  pipe.hincrby(`sv:usage:client:${clientId}`, event, 1);
  pipe.incr(`sv:usage:day:${day}:${event}`);
  pipe.incr(`sv:usage:event:${event}`);
  await pipe.exec();

  return NextResponse.json({ ok: true });
}

// GET /api/usage?days=28 — aggregate usage for the admin panel.
// Returns per-event totals + per-clientId totals (so you can see WHO uses WHAT).
export async function GET(request) {
  const days = Math.min(Math.max(parseInt(new URL(request.url).searchParams.get('days') || '28', 10), 1), 90);

  // All-time per-event totals
  const events = {};
  for (const ev of ALLOWED_EVENTS) {
    const v = await kv.get(`sv:usage:event:${ev}`);
    if (Number(v || 0) > 0) events[ev] = Number(v);
  }

  // Per-clientId usage (scan sv:usage:client:*)
  const clientKeys = await kv.keys('sv:usage:client:*');
  const clients = {};
  if (clientKeys.length > 0) {
    // Each key is a HASH (event -> count). hgetall reads the full hash.
    for (const k of clientKeys) {
      const clientId = k.replace('sv:usage:client:', '');
      const hash = await kv.hgetall(k);
      clients[clientId] = hash || {};
    }
  }

  return NextResponse.json({ days, events, clients });
}
