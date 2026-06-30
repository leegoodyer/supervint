import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { getStripe, appOrigin } from '@/lib/stripe';
import { priceIdForPlan, planForPriceId, normalizePlan } from '@/lib/plans';

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

  const clientId  = typeof body?.clientId === 'string' ? body.clientId.trim() : '';
  const planKey   = typeof body?.planKey  === 'string' ? body.planKey.trim().toLowerCase() : '';
  const emailRaw  = typeof body?.email    === 'string' ? body.email.trim() : '';
  const email     = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw) ? emailRaw : null;

  if (!clientId || clientId.length < 8 || clientId.length > 128) {
    return NextResponse.json({ error: 'Invalid clientId' }, { status: 400, headers: CORS });
  }

  const priceId = priceIdForPlan(planKey);
  if (!priceId || !planForPriceId(priceId)) {
    return NextResponse.json({ error: 'Unknown plan' }, { status: 400, headers: CORS });
  }

  const origin = appOrigin(request);
  const record = await kv.get(`sv:sub:${clientId}`);
  const existingCustomerId = record?.customerId ?? null;

  try {
    const checkout = await getStripe().checkout.sessions.create({
      mode:       'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      ...(existingCustomerId          ? { customer: existingCustomerId } : {}),
      ...(!existingCustomerId && email ? { customer_email: email }       : {}),
      client_reference_id: clientId,
      metadata:            { clientId, plan: planKey },
      subscription_data:   { metadata: { clientId, plan: planKey } },
      allow_promotion_codes: true,
      success_url: `${origin}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/?checkout=cancelled`,
    });

    return NextResponse.json({ url: checkout.url }, { headers: CORS });
  } catch (err) {
    console.error('[stripe/checkout] failed:', err?.message);
    return NextResponse.json({ error: 'Failed to start checkout' }, { status: 500, headers: CORS });
  }
}
