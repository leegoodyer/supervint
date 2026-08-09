import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const runtime = 'nodejs';

const kv = Redis.fromEnv();

// GET /api/extension/uninstall?cid=<clientId>
// Opened by Chrome via chrome.runtime.setUninstallURL when the user removes
// the extension. Query param is the only way to carry data.
export async function GET(request) {
  const clientId = new URL(request.url).searchParams.get('cid') || '';
  const day = new Date().toISOString().slice(0, 10);

  if (clientId) {
    await kv.set(`sv:uninstall:${clientId}`, Date.now());
    await kv.incr(`sv:uninstall:day:${day}`);
    await kv.incr('sv:uninstalls');
  }

  // Return a tiny tracking pixel so the beacon registers as a successful hit.
  return new NextResponse(
    Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
    { headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'no-store' } }
  );
}
