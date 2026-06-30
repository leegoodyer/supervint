import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { getStripe } from '@/lib/stripe';
import { planForPriceId, normalizePlan } from '@/lib/plans';

export const runtime = 'nodejs';

const kv = Redis.fromEnv();

async function resolvePlanFromSession(cs) {
  const fromMeta = cs.metadata?.plan;
  if (fromMeta && normalizePlan(fromMeta) !== 'free') return normalizePlan(fromMeta);
  if (cs.subscription) {
    try {
      const sub = await getStripe().subscriptions.retrieve(
        typeof cs.subscription === 'string' ? cs.subscription : cs.subscription.id
      );
      const priceId = sub.items?.data?.[0]?.price?.id;
      const plan = planForPriceId(priceId);
      if (plan) return plan;
    } catch (e) {
      console.error('[stripe/webhook] subscription lookup failed:', e?.message);
    }
  }
  return null;
}

export async function POST(request) {
  const sig    = request.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[stripe/webhook] STRIPE_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  // Raw body required for signature verification — must not parse as JSON first
  const rawBody = await request.text();
  let event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    console.error('[stripe/webhook] signature verification failed:', err?.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const cs = event.data.object;
        const clientId = cs.client_reference_id || cs.metadata?.clientId;
        if (!clientId) {
          console.error('[stripe/webhook] completed session has no clientId');
          break;
        }
        const plan = await resolvePlanFromSession(cs);
        if (!plan) {
          console.error('[stripe/webhook] could not resolve plan for session', cs.id);
          break;
        }
        const customerId      = typeof cs.customer     === 'string' ? cs.customer     : cs.customer?.id;
        const subscriptionId  = typeof cs.subscription === 'string' ? cs.subscription : cs.subscription?.id;
        const checkoutEmail   = cs.customer_details?.email?.toLowerCase() ?? null;
        const existing        = await kv.get(`sv:sub:${clientId}`) ?? {};

        // Maintain the sv:email secondary index — delete old entry if email changed
        if (checkoutEmail) {
          const oldEmail = existing.email ?? null;
          if (oldEmail && oldEmail !== checkoutEmail) {
            await kv.del(`sv:email:${oldEmail}`);
          }
          await kv.set(`sv:email:${checkoutEmail}`, clientId);
        }

        await kv.set(`sv:sub:${clientId}`, {
          ...existing,
          plan,
          customerId,
          subscriptionId,
          ...(checkoutEmail ? { email: checkoutEmail } : {}),
          updatedAt: Date.now(),
        });
        if (customerId) {
          await kv.set(`sv:customer:${customerId}`, clientId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub        = event.data.object;
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
        if (!customerId) break;
        const clientId = await kv.get(`sv:customer:${customerId}`);
        if (!clientId) break;
        const priceId = sub.items?.data?.[0]?.price?.id;
        const plan    = planForPriceId(priceId);
        if (!plan) break;
        const existing = await kv.get(`sv:sub:${clientId}`) ?? {};
        await kv.set(`sv:sub:${clientId}`, {
          ...existing,
          plan,
          subscriptionId: sub.id,
          updatedAt: Date.now(),
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const sub        = event.data.object;
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
        if (!customerId) break;
        const clientId = await kv.get(`sv:customer:${customerId}`);
        if (!clientId) {
          console.error('[stripe/webhook] no clientId for customer', customerId);
          break;
        }
        const existing = await kv.get(`sv:sub:${clientId}`) ?? {};
        await kv.set(`sv:sub:${clientId}`, {
          ...existing,
          plan:           'free',
          subscriptionId: null,
          updatedAt:      Date.now(),
        });
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error(`[stripe/webhook] handler error for ${event.type}:`, err?.message);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
