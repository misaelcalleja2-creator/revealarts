// /api/create-checkout-session.js
// Creates a Stripe Checkout Session for a logged-in user and returns the URL
// to redirect them to. Runs on Vercel as a serverless function (server-side only).

const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Public Supabase values — same ones already in config.js, safe to expose.
// Used only to VERIFY the user's login token (not to write anything).
const SB_URL = 'https://zionhfdaksktpwcvjnde.supabase.co';
const SB_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inppb25oZmRha3NrdHB3Y3ZqbmRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzYyMjcsImV4cCI6MjA5MDg1MjIyN30.6nLi71KlbXvRsC5Z0g51XGxiXgOBu9TKxbs6T2mYm9A';

// The ONLY prices we accept, each mapped to the plan it grants.
// The webhook later reads the plan from this session's metadata, so we
// decide it here rather than trusting the browser.
const PRICE_TO_PLAN = {
  'price_1Tr2om2MGMrnqoN377op32bw': 'starter', // Starter  $8/mo
  'price_1Tr2pW2MGMrnqoN3rb8mr6rN': 'pro',     // Pro Monthly $10/mo
  'price_1Tr2q02MGMrnqoN3VmTvNYYH': 'pro',     // Pro Annual  $100/yr
};

// Only this plan gets the 7-day free trial (card required, $0 for 7 days,
// then Stripe automatically starts billing $10/mo).
const PRO_MONTHLY_PRICE_ID = 'price_1Tr2pW2MGMrnqoN3rb8mr6rN';

module.exports = async (req, res) => {
  // Only POST is allowed. (Visiting the URL in a browser is a GET → 405,
  // which is the "is it alive?" smoke test.)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { priceId, accessToken } = req.body || {};

    // 1. Make sure the price is one we recognize.
    const plan = PRICE_TO_PLAN[priceId];
    if (!plan) {
      return res.status(400).json({ error: 'Unknown price' });
    }

    // 2. Verify the user is really logged in, and find out who they are.
    //    The browser sends its Supabase access token; we ask Supabase to
    //    confirm it and hand back the real user id + email. This stops
    //    anyone from checking out as someone else.
    if (!accessToken) {
      return res.status(401).json({ error: 'Not signed in' });
    }
    const userRes = await fetch(SB_URL + '/auth/v1/user', {
      headers: {
        'apikey': SB_ANON_KEY,
        'Authorization': 'Bearer ' + accessToken,
      },
    });
    if (!userRes.ok) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    const user = await userRes.json();
    if (!user || !user.id) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // 3. Work out the site address so the after-checkout redirects land on
    //    the right place — automatically correct on both the Vercel preview
    //    URL and the real therealsumshady.com.
    const origin = req.headers.origin || ('https://' + req.headers.host);

    // 4. Find this person's existing Stripe customer, or make one.
    //
    //    Previously this passed `customer_email`, which makes Stripe create a
    //    BRAND NEW customer on every checkout — duplicate records, split
    //    billing history, and a broken billing portal. We look the customer up
    //    ourselves and pass a real customer id instead.
    //
    //    We search by email rather than trusting the profile column, because
    //    duplicates may already exist from before this fix.
    const existing = await stripe.customers.list({
      email: user.email,
      limit: 100,
    });
    const candidates = (existing.data || []).filter(function (c) {
      return !c.deleted;
    });

    // 5. Has this person EVER had a subscription — on any of their customer
    //    records, in any state (active, canceled, past due, expired trial)?
    //    If so, they are not trial-eligible. This is what stops someone from
    //    cancelling on day 6 and re-trialling forever.
    let hasSubscriptionHistory = false;
    for (const c of candidates) {
      const subs = await stripe.subscriptions.list({
        customer: c.id,
        status: 'all',
        limit: 1,
      });
      if (subs.data && subs.data.length > 0) {
        hasSubscriptionHistory = true;
        break;
      }
    }

    // Prefer a customer tagged with this Supabase user, otherwise the oldest.
    // If they have NO customer yet, we deliberately do not create one here —
    // we let Stripe create it when checkout actually completes. Creating it up
    // front would leave an orphan customer record behind every abandoned
    // checkout.
    let customerId = null;
    if (candidates.length > 0) {
      const tagged = candidates.find(function (c) {
        return c.metadata && c.metadata.supabase_user_id === user.id;
      });
      const oldest = candidates.slice().sort(function (a, b) {
        return a.created - b.created;
      })[0];
      customerId = (tagged || oldest).id;
    }

    // 6. Create the Checkout Session.
    //    Only Pro Monthly carries a 7-day free trial, and only for someone who
    //    has never subscribed before.
    const subscriptionData = {
      metadata: {
        supabase_user_id: user.id,
        plan: plan,
      },
    };
    if (priceId === PRO_MONTHLY_PRICE_ID && !hasSubscriptionHistory) {
      subscriptionData.trial_period_days = 7;
    }

    const sessionParams = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true, // lets founding members type the 2-free-months code
      success_url: origin + '/dashboard.html?checkout=success',
      cancel_url: origin + '/plans.html',
      // Stamp the user id + plan on the session AND the subscription, so the
      // webhook knows whose 'plan' to set (on signup) and later whose to clear
      // (on cancel).
      metadata: {
        supabase_user_id: user.id,
        plan: plan,
      },
      subscription_data: subscriptionData,
    };

    // Stripe accepts EITHER an existing customer id OR an email to create one
    // from — sending both is an API error. Returning users get their real
    // customer so we never duplicate; brand-new users get the email path.
    if (customerId) {
      sessionParams.customer = customerId;
    } else {
      sessionParams.customer_email = user.email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // 5. Hand the checkout URL back to the browser to redirect to.
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};
