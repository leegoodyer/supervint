import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const runtime = 'nodejs';

const kv = Redis.fromEnv();

// GET /api/extension/uninstall?cid=<clientId>
// Opened by Chrome via chrome.runtime.setUninstallURL when the user removes
// the extension. Query param is the only way to carry data.
// Logs the uninstall, then REDIRECTS to the friendly goodbye page (which the
// user actually sees) — the beacon still registers as a successful hit.
export async function GET(request) {
  const url = new URL(request.url);
  const clientId = url.searchParams.get('cid') || '';
  const day = new Date().toISOString().slice(0, 10);

  if (clientId) {
    await kv.set(`sv:uninstall:${clientId}`, Date.now());
    await kv.incr(`sv:uninstall:day:${day}`);
    await kv.incr('sv:uninstalls');
  }

  return NextResponse.redirect(new URL(`/uninstall?cid=${encodeURIComponent(clientId)}`, url.origin), 302);
}
