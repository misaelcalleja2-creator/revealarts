// ── AUTH GATE ──────────────────────────────────────────────────────────────────

async function sbGet(path, token) {
  const r = await fetch(SB_URL + path, {
    headers: {
      'apikey': SB_KEY,
      'Authorization': 'Bearer ' + token
    }
  });
  return r.json();
}

async function sbPost(path, body, token) {
  const r = await fetch(SB_URL + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SB_KEY,
      'Authorization': 'Bearer ' + (token || SB_KEY)
    },
    body: JSON.stringify(body)
  });
  return r.json();
}

async function checkAuth() {
  const token = localStorage.getItem('sb_access_token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // Verify token is valid
  let user;
  try {
    const resp = await fetch(SB_URL + '/auth/v1/user', {
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + token }
    });
    if (!resp.ok) {
      // Token expired or invalid - clear and redirect to login
      localStorage.removeItem('sb_access_token');
      localStorage.removeItem('sb_refresh_token');
      window.location.href = 'login.html';
      return;
    }
    user = await resp.json();
    if (!user.id) {
      localStorage.removeItem('sb_access_token');
      localStorage.removeItem('sb_refresh_token');
      window.location.href = 'login.html';
      return;
    }
  } catch(e) {
    // Network error - let them through rather than loop
    showTrialBanner(7);
    return;
  }

  // Get or create profile
  let profile;
  try {
    const profileData = await fetch(SB_URL + '/rest/v1/profiles?id=eq.' + user.id + '&select=*', {
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + token }
    });
    const profiles = await profileData.json();
    profile = profiles[0];
  } catch(e) {}

  if (!profile) {
    // Create profile for new user
    await sbPost('/rest/v1/profiles', {
      id: user.id,
      email: user.email,
      trial_started_at: new Date().toISOString()
    }, token);
    showTrialBanner(7);
    return;
  }

  // Check if paid
  if (profile.is_paid) {
    showTrialBanner(null, true);
    return;
  }

  // Check trial
  const trialStart = new Date(profile.trial_started_at);
  const daysElapsed = Math.floor((Date.now() - trialStart) / (1000 * 60 * 60 * 24));
  const daysLeft = 7 - daysElapsed;

  if (daysLeft <= 0) {
    document.getElementById('paywall-overlay').classList.add('active');
  } else {
    const expiryDate = new Date(trialStart);
    expiryDate.setDate(expiryDate.getDate() + 7);
    showTrialBanner(daysLeft, false, expiryDate);
  }
}

function showTrialBanner(daysLeft, isPaid, expiryDate) {
  const pill = document.getElementById('trial-pill');
  const nav = document.getElementById('auth-nav');
  if (!nav) return;

  // Right side buttons
  nav.style.display = 'flex';
  nav.style.alignItems = 'center';
  nav.style.justifyContent = 'flex-end';
  nav.style.gap = '8px';
  nav.innerHTML = '';

  // Left side pill - countdown timer
  if (!pill) return;
  if (isPaid) {
    pill.innerHTML = '<span class="trial-pill"><strong>✅ Active</strong></span>';
    return;
  }

  // Countdown timer
  function updatePill() {
    if (!expiryDate) return;
    const msLeft = new Date(expiryDate) - Date.now();
    if (msLeft <= 0) {
      pill.innerHTML = '<span class="trial-pill expired"><strong>Trial ended</strong></span>';
      return;
    }
    const hoursLeft = Math.floor(msLeft / (1000*60*60));
    const daysLeft = Math.floor(hoursLeft / 24);
    const hRem = hoursLeft % 24;
    const mRem = Math.floor((msLeft % (1000*60*60)) / (1000*60));
    const sRem = Math.floor((msLeft % (1000*60)) / 1000);
    let txt;
    if (daysLeft >= 1) {
      txt = daysLeft + ' day' + (daysLeft !== 1 ? 's' : '') + ' ' + hRem + 'h left';
    } else if (hoursLeft >= 1) {
      txt = hoursLeft + 'h ' + mRem + 'm left';
    } else {
      txt = mRem + 'm ' + sRem + 's left';
    }
    const cls = daysLeft <= 1 ? 'trial-pill expired' : 'trial-pill';
    pill.innerHTML = '<span class="' + cls + '">⏱ <strong>' + txt + '</strong></span>';
  }
  updatePill();
  setInterval(updatePill, 1000);
}

function signOut() {
  localStorage.removeItem('sb_access_token');
  localStorage.removeItem('sb_refresh_token');
  window.location.href = 'login.html';
}
