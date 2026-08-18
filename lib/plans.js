// Single source of truth for Supervint plan limits and features.
// Price IDs come from env vars so test/live modes never require a redeploy.

export const PLANS = {
  free: {
    name:        'Free',
    searchLimit: 5,
    emailLimit:  0,
    sheets:      false,
  },
  trial: {
    name:        'Trial',
    searchLimit: 50,
    emailLimit:  50,
    sheets:      true,
    trialDays:   7,  // was 14 — Lee: "2 weeks is too long", 2026-08-17
  },
  reseller: {
    name:        'Reseller',
    searchLimit: 50,
    emailLimit:  50,
    sheets:      true,
  },
  powerseller: {
    name:        'Power Seller',
    searchLimit: 100,
    emailLimit:  100,
    sheets:      true,
  },
  empire: {
    name:        'Empire',
    searchLimit: 200,
    emailLimit:  200,
    sheets:      true,
  },
};

// Plans that require a Stripe subscription (not free or trial)
export const PAID_PLANS = ['reseller', 'powerseller', 'empire'];

// Shared so the trial clock starts identically wherever a trial record gets
// created (currently: account/email, at the moment an email is submitted —
// not at first boot, since nothing is usable before an email is on file).
export const TRIAL_MS = PLANS.trial.trialDays * 24 * 60 * 60 * 1000;

export function normalizePlan(plan) {
  const key = (plan || 'free').toLowerCase();
  return key in PLANS ? key : 'free';
}

export function planLimits(plan) {
  return PLANS[normalizePlan(plan)];
}

function priceEnvMap() {
  return {
    reseller:    process.env.STRIPE_RESELLER_PRICE_ID,
    powerseller: process.env.STRIPE_POWERSELLER_PRICE_ID,
    empire:      process.env.STRIPE_EMPIRE_PRICE_ID,
  };
}

export function planForPriceId(priceId) {
  if (!priceId) return null;
  const map = priceEnvMap();
  for (const key of Object.keys(map)) {
    if (map[key] && map[key] === priceId) return key;
  }
  return null;
}

export function priceIdForPlan(plan) {
  return priceEnvMap()[normalizePlan(plan)] ?? null;
}
