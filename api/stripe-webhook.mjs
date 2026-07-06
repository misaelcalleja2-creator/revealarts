// /api/stripe-webhook.mjs
// Receives events from Stripe, verifies they're genuine, and updates the
// user's plan in Supabase. Uses the Web-style handler so we can read the RAW
// request body — Stripe's signature check requires the exact bytes, and a
// standard Vercel function would otherwise parse the body and break it.

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Public Supabase URL (same as config.js). The SERVICE key is secret and comes
// from the Vercel environment variable — it lets us write to profiles.
const SB_URL = 'https://zionhfdaksktpwcvjnde.supabase.co';
const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Update one profile row (matched by its id) with the given fields.
async function updateProfile(userId, fields) {
  const res = await fetch(SB_URL + '/rest/v1/profiles?id=eq.' + userId, {
    method: 'PATCH',
    headers: {
      'apikey': SB_SERVICE_KEY,
      'Authorization': 'Bearer ' + SB_SERVICE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(fields),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error('Supabase update failed: ' + res.status + ' ' + text);
  }
}

// The prices we recognize, mapped to the plan each one grants.
const PRICE_TO_PLAN = {
  'price_1TINAg2MGMrnqoN3hCoYiirL': 'starter', // Starter $8/mo
  'price_1TINAD2MGMrnqoN3PsM80Uaa': 'pro',     // Pro Monthly $10/mo
  'price_1TIN9l2MGMrnqoN3n5Q3ge4P': 'pro',     // Pro Annual $100/yr
};

// Update a profile matched by its Stripe customer id (used for portal changes,
// where we always know the customer but not necessarily the metadata).
async function updateProfileByCustomer(customerId, fields) {
  const res = await fetch(SB_URL + '/rest/v1/profiles?stripe_customer_id=eq.' + customerId, {
    method: 'PATCH',
    headers: {
      'apikey': SB_SERVICE_KEY,
      'Authorization': 'Bearer ' + SB_SERVICE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(fields),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error('Supabase update-by-customer failed: ' + res.status + ' ' + text);
  }
}

// A GET (e.g. visiting the URL in a browser) just confirms the endpoint is live.
export async function GET() {
  return new Response(
    JSON.stringify({ status: 'Stripe webhook endpoint is live' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

// Stripe sends events here as POST requests.
export async function POST(request) {
  const rawBody = await request.text();
  const sig = request.headers.get('stripe-signature');

  // 1. Verify the event really came from Stripe (and wasn't tampered with).
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });
  }

  // 2. Act on the events we care about.
  try {
    if (event.type === 'checkout.session.completed') {
      // Someone finished paying → grant their plan.
      const session = event.data.object;
      const userId = session.metadata?.supabase_user_id;
      const plan = session.metadata?.plan;
      const customerId = session.customer;

      if (userId && plan) {
        await updateProfile(userId, {
          plan: plan,                     // 'starter' or 'pro'
          is_paid: true,                  // keep old column in sync (dashboard still reads it)
          stripe_customer_id: customerId, // so we can match them on future events
        });
      }
    } else if (event.type === 'customer.subscription.updated') {
      // Plan switched in the portal (e.g. Starter -> Pro) -> re-derive the plan
      // from the subscription's CURRENT price and update the matching profile.
      const subscription = event.data.object;
      const customerId = subscription.customer;
      const status = subscription.status;
      const priceId = subscription.items?.data?.[0]?.price?.id;
      const plan = PRICE_TO_PLAN[priceId];

      if (customerId) {
        if ((status === 'active' || status === 'trialing') && plan) {
          await updateProfileByCustomer(customerId, { plan: plan, is_paid: true });
        } else if (status === 'canceled' || status === 'unpaid' || status === 'incomplete_expired') {
          await updateProfileByCustomer(customerId, { plan: 'none', is_paid: false });
        }
      }
    } else if (event.type === 'customer.subscription.deleted') {
      // Subscription ended/cancelled -> revoke their plan.
      const subscription = event.data.object;
      const customerId = subscription.customer;

      if (customerId) {
        await updateProfileByCustomer(customerId, { plan: 'none', is_paid: false });
      }
    }
    // Any other event type: we just acknowledge it below without doing anything.
  } catch (err) {
    console.error('Webhook processing error:', err.message);
    // Returning 500 tells Stripe to retry later.
    return new Response(JSON.stringify({ error: 'Processing error' }), { status: 500 });
  }

  // 3. Tell Stripe we received it.
  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
