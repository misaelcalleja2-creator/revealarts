// ── SPIRAL REVIEW UI ──────────────────────────────────────────────────────────
// Globals
let spiralActivities = [];      // all fetched activities with problems
let selectedActivityMap = {};    // { id: { activity, count } }
let spiralCustomProbs = [];     // teacher-typed custom problems
let spiralProbCount = 20;       // target problem count
let spiralTimerEnabled = false;
let spiralTimerMins = 5;
let spiralCalcEnabled = false;
let spiralDiffEnabled = false;
let spiralGeneratedHTML = '';
let currentSpiralStep = 1;

// ── WIZARD ───────────────────────────────────────────────────────────────────
function goToStep(n) {
  if (n > currentSpiralStep + 1) return;
  for (let i = 1; i <= 3; i++) {
    document.getElementById('step-' + i).style.display = i === n ? '' : 'none';
    const ws = document.getElementById('wstep-' + i);
    ws.className = 'wiz-step' + (i === n ? ' wiz-active' : (i < n ? ' wiz-done' : ''));
    if (i < 3) {
      const wl = document.getElementById('wline-' + i);
      wl.className = 'wiz-line' + (i < n ? ' done' : '');
    }
  }
  // layout: step 1 & 2 full width, step 3 shows preview
  const page = document.getElementById('page-layout');
  const form = document.getElementById('form-panel');
  const prev = document.getElementById('preview-panel');
  if (n === 3) {
    form.classList.remove('full-width');
    prev.style.display = '';
  } else {
    form.classList.add('full-width');
    prev.style.display = 'none';
  }
  currentSpiralStep = Math.max(currentSpiralStep, n);
  if (n === 2 && spiralActivities.length === 0) loadSpiralActivities();
}

function wizNext(fromStep) {
  const hint = document.getElementById('step' + fromStep + '-hint');
  if (hint) { hint.style.display = 'none'; hint.textContent = ''; }

  if (fromStep === 1) {
    if (!selImgUrl) {
      if (hint) { hint.textContent = 'Please choose an image first.'; hint.style.display = ''; }
      return;
    }
    if (!croppedDataUrl && editorReady) cropDone();
    goToStep(2);
  } else if (fromStep === 2) {
    const totalPool = getSpiralPoolSize();
    if (totalPool === 0) {
      if (hint) { hint.textContent = 'Select at least one activity or add custom problems.'; hint.style.display = ''; }
      return;
    }
    if (totalPool < spiralProbCount) {
      if (hint) { hint.textContent = 'Not enough problems. Add more activities or lower the count.'; hint.style.display = ''; }
      return;
    }
    goToStep(3);
  }
}

// ── LOAD ACTIVITIES FROM SUPABASE ────────────────────────────────────────────
async function loadSpiralActivities() {
  const token = localStorage.getItem('sb_access_token');
  if (!token) return;

  try {
    const ur = await fetch(SB_URL + '/auth/v1/user', {
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + token }
    });
    if (!ur.ok) return;
    const user = await ur.json();

    // Fetch all activities for this user
    const r = await fetch(SB_URL + '/rest/v1/activities?user_id=eq.' + user.id + '&select=id,title,thumbnail,subject,created_at,problems,settings&order=created_at.desc', {
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + token }
    });
    const acts = await r.json();

    document.getElementById('activities-loading').style.display = 'none';

    if (!Array.isArray(acts) || acts.length === 0) {
      document.getElementById('no-activities').style.display = '';
      return;
    }

    // Separate: activities with problems data vs without
    spiralActivities = acts;
    const withProblems = acts.filter(a => a.problems && Array.isArray(a.problems) && a.problems.length > 0);

    if (withProblems.length === 0) {
      document.getElementById('no-activities').style.display = '';
      document.getElementById('no-activities').querySelector('.empty-activities-text').innerHTML =
        'Your saved activities don\'t have problem data yet.<br>Re-save any existing activity to enable spiral review.<br><a href="creator.html" class="empty-activities-link">Create a new activity →</a>';
      return;
    }

    renderActivityGrid(acts);

  } catch (e) {
    console.log('Failed to load activities', e);
    document.getElementById('activities-loading').textContent = 'Failed to load activities. Please refresh.';
  }
}

function renderActivityGrid(acts) {
  const grid = document.getElementById('spiral-activity-grid');
  grid.style.display = 'grid';
  grid.innerHTML = '';

  acts.forEach(act => {
    const hasProbs = act.problems && Array.isArray(act.problems) && act.problems.length > 0;
    const card = document.createElement('div');
    card.className = 'spiral-act-card' + (hasProbs ? '' : ' no-problems');
    card.dataset.actId = act.id;

    const date = new Date(act.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const probCount = hasProbs ? act.problems.length : 0;

    const thumbHtml = act.thumbnail
      ? '<img class="spiral-act-thumb" src="' + act.thumbnail + '" alt="' + act.title + '">'
      : '<div class="spiral-act-thumb-ph">🎨</div>';

    card.innerHTML = thumbHtml +
      '<div class="spiral-act-check">' + (selectedActivityMap[act.id] ? '✓' : '') + '</div>' +
      '<div class="spiral-act-body">' +
        '<div class="spiral-act-title">' + act.title + '</div>' +
        '<div class="spiral-act-meta">' +
          (hasProbs
            ? '<span class="spiral-act-badge has-probs">' + probCount + ' problems</span>'
            : '<span class="spiral-act-badge no-probs">Re-save to enable</span>') +
          '<span>' + date + '</span>' +
        '</div>' +
      '</div>';

    if (hasProbs) {
      card.addEventListener('click', function () { toggleActivitySelection(act); });
    }

    grid.appendChild(card);
  });
}

// ── ACTIVITY SELECTION ───────────────────────────────────────────────────────
function toggleActivitySelection(act) {
  if (selectedActivityMap[act.id]) {
    delete selectedActivityMap[act.id];
  } else {
    selectedActivityMap[act.id] = {
      activity: act,
      count: act.problems.length  // default: all problems
    };
  }
  updateSelectionUI();
}

function updateSelectionUI() {
  const ids = Object.keys(selectedActivityMap);
  const area = document.getElementById('spiral-selection-area');
  area.style.display = ids.length > 0 ? '' : 'none';

  // Update card check marks
  document.querySelectorAll('.spiral-act-card').forEach(card => {
    const id = card.dataset.actId;
    const check = card.querySelector('.spiral-act-check');
    if (selectedActivityMap[id]) {
      card.classList.add('selected');
      check.textContent = '✓';
    } else {
      card.classList.remove('selected');
      check.textContent = '';
    }
  });

  // Render selected list
  const list = document.getElementById('spiral-selected-list');
  list.innerHTML = '';
  ids.forEach(id => {
    const entry = selectedActivityMap[id];
    const act = entry.activity;
    const maxCount = act.problems.length;

    const item = document.createElement('div');
    item.className = 'spiral-sel-item';
    item.innerHTML =
      '<div class="spiral-sel-name">' + act.title + '</div>' +
      '<div class="spiral-sel-count">' +
        '<span>Use</span>' +
        '<input type="number" min="1" max="' + maxCount + '" value="' + entry.count + '" onchange="updateActivityCount(\'' + id + '\', this.value, ' + maxCount + ')">' +
        '<span>of ' + maxCount + '</span>' +
      '</div>' +
      '<button class="spiral-sel-remove" onclick="removeActivity(\'' + id + '\')" title="Remove">×</button>';
    list.appendChild(item);
  });

  updateSpiralSummary();
}

function updateActivityCount(id, val, max) {
  const n = Math.max(1, Math.min(parseInt(val) || 1, max));
  if (selectedActivityMap[id]) {
    selectedActivityMap[id].count = n;
  }
  updateSpiralSummary();
}

function removeActivity(id) {
  delete selectedActivityMap[id];
  updateSelectionUI();
}

// ── CUSTOM PROBLEMS ──────────────────────────────────────────────────────────
function addCustomProblem() {
  const eqInput = document.getElementById('custom-eq-input');
  const ansInput = document.getElementById('custom-ans-input');
  const eq = eqInput.value.trim();
  const ans = ansInput.value.trim();

  if (!eq || !ans) return;

  spiralCustomProbs.push({
    eq: eq,
    ans: isNaN(parseFloat(ans)) ? ans : parseFloat(ans),
    ansDisplay: ans,
    isAlgebra: /[a-zA-Z]/.test(eq)
  });

  eqInput.value = '';
  ansInput.value = '';
  renderCustomProbs();
  updateSpiralSummary();
}

function removeCustomProb(index) {
  spiralCustomProbs.splice(index, 1);
  renderCustomProbs();
  updateSpiralSummary();
}

function renderCustomProbs() {
  const list = document.getElementById('custom-prob-list');
  list.innerHTML = '';
  spiralCustomProbs.forEach((p, i) => {
    const item = document.createElement('div');
    item.className = 'custom-prob-item';
    item.innerHTML =
      '<span class="eq">' + p.eq + '</span>' +
      '<span class="ans">' + p.ansDisplay + '</span>' +
      '<button class="del" onclick="removeCustomProb(' + i + ')">×</button>';
    list.appendChild(item);
  });
}

// Enter key adds custom problem
document.addEventListener('DOMContentLoaded', function() {
  var ansInp = document.getElementById('custom-ans-input');
  if (ansInp) {
    ansInp.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') addCustomProblem();
    });
  }
});

// ── SUMMARY & POOL ───────────────────────────────────────────────────────────
function getSpiralPoolSize() {
  let total = spiralCustomProbs.length;
  Object.values(selectedActivityMap).forEach(entry => {
    total += entry.count;
  });
  return total;
}

function updateSpiralSummary() {
  const pool = getSpiralPoolSize();
  document.getElementById('spiral-pool-count').textContent = pool;
  document.getElementById('spiral-use-count').textContent = spiralProbCount;

  const note = document.getElementById('spiral-mismatch-note');
  if (pool > spiralProbCount) {
    note.textContent = pool + ' problems available, ' + spiralProbCount + ' will be randomly selected.';
    note.style.display = '';
    note.style.color = 'var(--lime-dark)';
  } else if (pool < spiralProbCount && pool > 0) {
    note.textContent = 'Not enough problems (' + pool + '). Add more or lower the count.';
    note.style.display = '';
    note.style.color = 'var(--coral)';
  } else {
    note.style.display = 'none';
  }
}

function setSpiralProbCount(n, btn) {
  spiralProbCount = n;
  document.querySelectorAll('.prob-count-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  updateSpiralSummary();
}

// ── BUILD PROBLEM POOL ───────────────────────────────────────────────────────
function buildSpiralPool() {
  let pool = [];

  // Collect problems from selected activities
  Object.values(selectedActivityMap).forEach(entry => {
    const probs = entry.activity.problems;
    const count = Math.min(entry.count, probs.length);

    // Shuffle activity problems, take 'count' of them
    const shuffled = [...probs].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, count).map(p => ({
      eq: p.eq,
      ans: p.ans,
      ansDisplay: p.ansDisplay || String(p.ans),
      isAlgebra: !!p.isAlgebra
    }));
    pool = pool.concat(picked);
  });

  // Add custom problems
  spiralCustomProbs.forEach(p => {
    pool.push({
      eq: p.eq,
      ans: p.ans,
      ansDisplay: p.ansDisplay || String(p.ans),
      isAlgebra: !!p.isAlgebra
    });
  });

  // Shuffle entire pool (Fisher-Yates)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Trim to target count
  if (pool.length > spiralProbCount) {
    pool = pool.slice(0, spiralProbCount);
  }

  return pool;
}

// ── TIMER ────────────────────────────────────────────────────────────────────
function setSpiralTimer(mins, btn) {
  spiralTimerMins = mins;
  document.querySelectorAll('.timer-preset').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// ── GENERATE & PREVIEW ───────────────────────────────────────────────────────
function genTimerKey() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

function spiralGenerate() {
  const vm = document.getElementById('vm');
  vm.style.display = 'none';

  if (!selImgUrl) { vm.textContent = 'Please go back and choose an image first.'; vm.style.display = 'block'; return; }
  if (!croppedDataUrl && editorReady) cropDone();
  const imgToUse = croppedDataUrl || selImgUrl;

  const pool = buildSpiralPool();
  if (pool.length < spiralProbCount) {
    vm.textContent = 'Not enough problems. Go back and add more activities or lower the count.';
    vm.style.display = 'block';
    return;
  }

  const title = document.getElementById('act-title').value.trim() || 'Spiral Review';
  document.getElementById('lo').classList.add('active');

  // Build preview
  spiralGeneratedHTML = buildHTML(title, pool, imgToUse, [], spiralTimerEnabled ? spiralTimerMins : 0, edAR, spiralCalcEnabled, spiralProbCount, false, 0, 'preview');
  document.getElementById('pi').srcdoc = spiralGeneratedHTML;
  document.getElementById('pe').style.display = 'none';
  document.getElementById('pc').style.display = 'flex';
  buildSpiralDLButtons(title, imgToUse);
  document.getElementById('lo').classList.remove('active');
  document.querySelector('.preview-panel').scrollIntoView({ behavior: 'smooth' });
}

// ── DOWNLOAD BUTTONS ─────────────────────────────────────────────────────────
function buildSpiralDLButtons(title, imgData) {
  const c = document.getElementById('dl-btns');
  c.innerHTML = '';

  if (!spiralDiffEnabled) {
    const b = document.createElement('button');
    b.className = 'dl-btn';
    b.innerHTML = 'Save & Go to Dashboard';
    b.onclick = async () => {
      b.disabled = true; b.innerHTML = 'Saving...';
      const pool = buildSpiralPool();
      const tk = genTimerKey();
      const html = buildHTML(title, pool, imgData, [], spiralTimerEnabled ? spiralTimerMins : 0, edAR, spiralCalcEnabled, spiralProbCount, false, 0, tk);
      const success = await saveSpiralActivity(html, title, pool);
      if (success) { window.location.href = 'dashboard.html'; }
      else { b.disabled = false; b.innerHTML = 'Save & Go to Dashboard'; }
    };
    c.appendChild(b);
  } else {
    // Diff mode — 3 versions
    const previewLabel = document.createElement('div');
    previewLabel.style.cssText = 'font-size:11px;color:#888;margin-bottom:8px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;';
    previewLabel.textContent = 'Preview version';
    c.appendChild(previewLabel);

    const switcher = document.createElement('div');
    switcher.style.cssText = 'display:flex;gap:6px;margin-bottom:12px;';
    ['A', 'B', 'C'].forEach((v, idx) => {
      const pb = document.createElement('button');
      pb.className = 'dl-btn dl-btn-diff';
      pb.style.cssText = 'flex:1;padding:9px;font-size:13px;';
      pb.innerHTML = 'Version ' + v;
      if (idx === 0) pb.style.background = 'rgba(122,170,0,0.15)';
      pb.onclick = () => {
        const pool = buildSpiralPool();
        document.getElementById('pi').srcdoc = buildHTML(title + ' — Version ' + v, pool, imgData, [], spiralTimerEnabled ? spiralTimerMins : 0, edAR, spiralCalcEnabled, spiralProbCount, false, 0);
        switcher.querySelectorAll('button').forEach(b => b.style.background = '');
        pb.style.background = 'rgba(122,170,0,0.15)';
      };
      switcher.appendChild(pb);
    });
    c.appendChild(switcher);

    const saveBtn = document.createElement('button');
    saveBtn.className = 'dl-btn';
    saveBtn.innerHTML = 'Save All 3 Versions & Go to Dashboard';
    saveBtn.onclick = async () => {
      saveBtn.disabled = true;
      const vers = ['A', 'B', 'C'];
      let allOk = true;
      for (const v of vers) {
        saveBtn.innerHTML = 'Saving Version ' + v + '...';
        const pool = buildSpiralPool();
        const tk = genTimerKey();
        const vTitle = title + ' — Version ' + v;
        const html = buildHTML(vTitle, pool, imgData, [], spiralTimerEnabled ? spiralTimerMins : 0, edAR, spiralCalcEnabled, spiralProbCount, false, 0, tk);
        const ok = await saveSpiralActivity(html, vTitle, pool);
        if (!ok) { allOk = false; break; }
      }
      if (allOk) { window.location.href = 'dashboard.html'; }
      else { saveBtn.disabled = false; saveBtn.innerHTML = 'Save All 3 Versions & Go to Dashboard'; }
    };
    c.appendChild(saveBtn);
  }
}

// ── SAVE TO SUPABASE ─────────────────────────────────────────────────────────
async function saveSpiralActivity(html, title, problems) {
  const token = localStorage.getItem('sb_access_token');
  if (!token) { showSpiralToast('Sign in to save activities', 'warn'); return false; }

  try {
    const ur = await fetch(SB_URL + '/auth/v1/user', {
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + token }
    });
    if (!ur.ok) return false;
    const user = await ur.json();

    // Generate thumbnail
    let thumbnail = null;
    if (croppedDataUrl) {
      try {
        thumbnail = await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const maxW = 300;
            const scale = maxW / img.width;
            const c = document.createElement('canvas');
            c.width = maxW;
            c.height = Math.round(img.height * scale);
            c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
            resolve(c.toDataURL('image/jpeg', 0.7));
          };
          img.onerror = () => resolve(null);
          img.src = croppedDataUrl;
        });
      } catch (e) { thumbnail = null; }
    }

    const settings = {
      type: 'spiral',
      probCount: spiralProbCount,
      timerEnabled: spiralTimerEnabled,
      timerMins: spiralTimerMins,
      calcEnabled: spiralCalcEnabled,
      diffEnabled: spiralDiffEnabled,
      sourceActivities: Object.keys(selectedActivityMap),
      customProbs: spiralCustomProbs
    };

    // Check limit
    const cr = await fetch(SB_URL + '/rest/v1/activities?user_id=eq.' + user.id + '&select=id', {
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + token }
    });
    const existing = await cr.json();
    const count = Array.isArray(existing) ? existing.length : 0;
    if (count >= 20) {
      showSpiralToast('Activity limit reached. Delete some to save new ones.', 'warn');
      return false;
    }

    const res = await fetch(SB_URL + '/rest/v1/activities', {
      method: 'POST',
      headers: {
        'apikey': SB_KEY,
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        user_id: user.id,
        title: title,
        html: html,
        subject: 'Spiral Review',
        thumbnail: thumbnail,
        settings: settings,
        problems: problems
      })
    });

    if (res.ok) { showSpiralToast('✓ Spiral review saved!', 'ok'); return true; }
    return false;
  } catch (e) {
    console.log('Save failed', e);
    showSpiralToast('Failed to save. Please try again.', 'warn');
    return false;
  }
}

function showSpiralToast(msg, type) {
  let t = document.getElementById('save-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'save-toast';
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:10px 20px;border-radius:10px;font-family:Syne,sans-serif;font-weight:700;font-size:13px;z-index:9999;transition:opacity .3s;pointer-events:none;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.background = type === 'ok' ? '#b8e030' : '#ff5c3a';
  t.style.color = type === 'ok' ? '#0a0a0f' : '#fff';
  t.style.opacity = '1';
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => { t.style.opacity = '0'; }, 3500);
}

// ── NAV ──────────────────────────────────────────────────────────────────────
function confirmDashboard() {
  if (Object.keys(selectedActivityMap).length > 0 || spiralCustomProbs.length > 0) {
    if (!confirm('Leave without saving? Your selections will be lost.')) return;
  }
  window.location.href = 'dashboard.html';
}

// ── INIT ─────────────────────────────────────────────────────────────────────
(function init() {
  checkAuth();
  // Start on step 1 with full-width form
  const form = document.getElementById('form-panel');
  form.classList.add('full-width');
  document.getElementById('preview-panel').style.display = 'none';
})();
