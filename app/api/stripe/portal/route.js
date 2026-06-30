import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { getStripe, appOrigin } from '@/lib/stripe';

export const runtime = 'nodejs';

const kv = Redis.fromEnv();
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS });
  }

  const clientId = typeof body?.clientId === 'string' ? body.clientId.trim() : '';
  if (!clientId || clientId.length < 8 || clientId.length > 128) {
    return NextResponse.json({ error: 'Invalid clientId' }, { status: 400, headers: CORS });
  }

  const record = await kv.get(`sv:sub:${clientId}`);
  if (!record?.customerId) {
    return NextResponse.json({ error: 'No subscription to manage yet' }, { status: 400, headers: CORS });
  }

  try {
    const portal = await getStripe().billingPortal.sessions.create({
      customer:   record.customerId,
      return_url: appOrigin(request),
    });
    return NextResponse.json({ url: portal.url }, { headers: CORS });
  } catch (err) {
    console.error('[stripe/portal] failed:', err?.message);
    return NextResponse.json({ error: 'Failed to open billing portal' }, { status: 500, headers: CORS });
  }
}
