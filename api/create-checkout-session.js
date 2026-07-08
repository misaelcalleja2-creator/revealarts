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
  'price_1TINAg2MGMrnqoN3hCoYiirL': 'starter', // Starter  $8/mo
  'price_1TINAD2MGMrnqoN3PsM80Uaa': 'pro',     // Pro Monthly $10/mo
  'price_1TIN9l2MGMrnqoN3n5Q3ge4P': 'pro',     // Pro Annual  $100/yr
};

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

    // 4. Create the Checkout Session.
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
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
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan: plan,
        },
      },
    });

    // 5. Hand the checkout URL back to the browser to redirect to.
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};
