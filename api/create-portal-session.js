// /api/create-portal-session.js
// Sends a logged-in, paying user to Stripe's hosted billing portal, where they
// can cancel, update their card, or switch plans (e.g. Starter -> Pro) safely.

const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Public Supabase values (same as config.js — safe to expose). Used to verify
// the login token. The SERVICE key (secret, from Vercel) reads their profile.
const SB_URL = 'https://zionhfdaksktpwcvjnde.supabase.co';
const SB_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inppb25oZmRha3NrdHB3Y3ZqbmRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzYyMjcsImV4cCI6MjA5MDg1MjIyN30.6nLi71KlbXvRsC5Z0g51XGxiXgOBu9TKxbs6T2mYm9A';
const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { accessToken } = req.body || {};
    if (!accessToken) return res.status(401).json({ error: 'Not signed in' });

    // 1. Verify the user and get their id.
    const userRes = await fetch(SB_URL + '/auth/v1/user', {
      headers: { 'apikey': SB_ANON_KEY, 'Authorization': 'Bearer ' + accessToken },
    });
    if (!userRes.ok) return res.status(401).json({ error: 'Invalid session' });
    const user = await userRes.json();
    if (!user || !user.id) return res.status(401).json({ error: 'Invalid session' });

    // 2. Look up their Stripe customer id (set by the webhook when they first paid).
    const profRes = await fetch(
      SB_URL + '/rest/v1/profiles?id=eq.' + user.id + '&select=stripe_customer_id',
      { headers: { 'apikey': SB_SERVICE_KEY, 'Authorization': 'Bearer ' + SB_SERVICE_KEY } }
    );
    const rows = await profRes.json();
    const customerId = Array.isArray(rows) && rows[0] ? rows[0].stripe_customer_id : null;

    // No customer id = they've never had a paid subscription = nothing to manage.
    if (!customerId) {
      return res.status(400).json({ error: 'No subscription to manage' });
    }

    // 3. Create the portal session and hand back its URL.
    const origin = req.headers.origin || ('https://' + req.headers.host);
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: origin + '/dashboard.html',
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Portal error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};
