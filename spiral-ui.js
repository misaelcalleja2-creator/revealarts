// ── SPIRAL REVIEW UI ──────────────────────────────────────────────────────────
// Globals
let spiralActivities = [];
let selectedActivityMap = {};    // { id: { activity, count } }
let spiralCustomProbs = [];
let spiralProbCount = 20;
let spiralTimerEnabled = false;
let spiralTimerMins = 5;
let spiralCalcEnabled = false;
let spiralDiffEnabled = false;
let spiralGeneratedHTML = '';
let currentSpiralStep = 1;

// Edit mode
let editingSpiralId = null;
let originalEditImage = null;
let editSourceActivityIds = [];

// Problem preview / hand-pick
let spiralPreviewProbs = null; // null = not previewed; array = previewed/hand-picked

// ── WIZARD ───────────────────────────────────────────────────────────────────
function goToStep(n) {
  if (n > currentSpiralStep + 1) return;
  for (var i = 1; i <= 3; i++) {
    document.getElementById('step-' + i).style.display = i === n ? '' : 'none';
    var ws = document.getElementById('wstep-' + i);
    ws.className = 'wiz-step' + (i === n ? ' wiz-active' : (i < n ? ' wiz-done' : ''));
    if (i < 3) {
      document.getElementById('wline-' + i).className = 'wiz-line' + (i < n ? ' done' : '');
    }
  }
  var form = document.getElementById('form-panel');
  var prev = document.getElementById('preview-panel');
  if (n === 3) {
    form.classList.remove('full-width');
    prev.style.display = '';
    restoreStep3UI();
  } else {
    form.classList.add('full-width');
    prev.style.display = 'none';
  }
  currentSpiralStep = Math.max(currentSpiralStep, n);
  if (n === 2 && spiralActivities.length === 0) loadSpiralActivities();
}

function wizNext(fromStep) {
  var hint = document.getElementById('step' + fromStep + '-hint');
  if (hint) { hint.style.display = 'none'; hint.textContent = ''; }

  if (fromStep === 1) {
    if (!selImgUrl) {
      if (hint) { hint.textContent = 'Please choose an image first.'; hint.style.display = ''; }
      return;
    }
    if (!croppedDataUrl && editorReady) cropDone();
    goToStep(2);
  } else if (fromStep === 2) {
    var pool = getEffectivePoolSize();
    if (pool === 0) {
      if (hint) { hint.textContent = 'Select at least one activity or add custom problems.'; hint.style.display = ''; }
      return;
    }
    if (pool < spiralProbCount) {
      if (hint) { hint.textContent = 'Not enough problems (' + pool + '). Add more or lower the count.'; hint.style.display = ''; }
      return;
    }
    goToStep(3);
  }
}

// ── LOAD ACTIVITIES FROM SUPABASE ────────────────────────────────────────────
async function loadSpiralActivities() {
  var token = localStorage.getItem('sb_access_token');
  if (!token) return;

  try {
    var ur = await fetch(SB_URL + '/auth/v1/user', {
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + token }
    });
    if (!ur.ok) return;
    var user = await ur.json();

    var r = await fetch(SB_URL + '/rest/v1/activities?user_id=eq.' + user.id + '&select=id,title,thumbnail,subject,created_at,problems,settings&order=created_at.desc', {
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + token }
    });
    var acts = await r.json();

    document.getElementById('activities-loading').style.display = 'none';

    if (!Array.isArray(acts) || acts.length === 0) {
      document.getElementById('no-activities').style.display = '';
      return;
    }

    spiralActivities = acts;
    var withProblems = acts.filter(function(a) { return a.problems && Array.isArray(a.problems) && a.problems.length > 0; });

    if (withProblems.length === 0) {
      document.getElementById('no-activities').style.display = '';
      return;
    }

    renderActivityGrid(acts);

    // If editing, pre-select source activities
    if (editSourceActivityIds.length > 0) {
      editSourceActivityIds.forEach(function(id) {
        var act = acts.find(function(a) { return a.id === id; });
        if (act && act.problems && act.problems.length > 0) {
          selectedActivityMap[id] = { activity: act, count: act.problems.length };
        }
      });
      updateSelectionUI();
    }

  } catch (e) {
    console.log('Failed to load activities', e);
    document.getElementById('activities-loading').textContent = 'Failed to load. Please refresh.';
  }
}

function renderActivityGrid(acts) {
  var grid = document.getElementById('spiral-activity-grid');
  grid.style.display = 'grid';
  grid.innerHTML = '';

  // Don't show the activity we're currently editing
  var filtered = editingSpiralId ? acts.filter(function(a) { return a.id !== editingSpiralId; }) : acts;

  filtered.forEach(function(act) {
    var hasProbs = act.problems && Array.isArray(act.problems) && act.problems.length > 0;
    var card = document.createElement('div');
    card.className = 'spiral-act-card' + (hasProbs ? '' : ' no-problems') + (selectedActivityMap[act.id] ? ' selected' : '');
    card.dataset.actId = act.id;

    var date = new Date(act.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    var probCount = hasProbs ? act.problems.length : 0;

    var thumbHtml = act.thumbnail
      ? '<img class="spiral-act-thumb" src="' + act.thumbnail + '" alt="' + (act.title||'') + '">'
      : '<div class="spiral-act-thumb-ph">🎨</div>';

    card.innerHTML = thumbHtml +
      '<div class="spiral-act-check">' + (selectedActivityMap[act.id] ? '✓' : '') + '</div>' +
      '<div class="spiral-act-body">' +
        '<div class="spiral-act-title">' + (act.title||'Untitled') + '</div>' +
        '<div class="spiral-act-meta">' +
          (hasProbs
            ? '<span class="spiral-act-badge has-probs">' + probCount + ' problems</span>'
            : '<span class="spiral-act-badge no-probs">Re-save to enable</span>') +
          '<span>' + date + '</span>' +
        '</div>' +
      '</div>';

    if (hasProbs) {
      card.addEventListener('click', function() { toggleActivitySelection(act); });
    }

    grid.appendChild(card);
  });
}

// ── ACTIVITY SELECTION ───────────────────────────────────────────────────────
function toggleActivitySelection(act) {
  if (selectedActivityMap[act.id]) {
    delete selectedActivityMap[act.id];
  } else {
    selectedActivityMap[act.id] = { activity: act, count: act.problems.length };
  }
  spiralPreviewProbs = null; // reset preview when selection changes
  updateSelectionUI();
}

function updateSelectionUI() {
  var ids = Object.keys(selectedActivityMap);
  document.getElementById('spiral-selection-area').style.display = ids.length > 0 || spiralCustomProbs.length > 0 ? '' : 'none';

  document.querySelectorAll('.spiral-act-card').forEach(function(card) {
    var id = card.dataset.actId;
    var check = card.querySelector('.spiral-act-check');
    if (selectedActivityMap[id]) {
      card.classList.add('selected');
      check.textContent = '✓';
    } else {
      card.classList.remove('selected');
      check.textContent = '';
    }
  });

  var list = document.getElementById('spiral-selected-list');
  list.innerHTML = '';
  ids.forEach(function(id) {
    var entry = selectedActivityMap[id];
    var act = entry.activity;
    var maxCount = act.problems.length;
    var item = document.createElement('div');
    item.className = 'spiral-sel-item';
    item.innerHTML =
      '<div class="spiral-sel-name">' + (act.title||'Untitled') + '</div>' +
      '<div class="spiral-sel-count">' +
        '<span>Use</span>' +
        '<input type="number" min="1" max="' + maxCount + '" value="' + entry.count + '" onchange="updateActivityCount(\'' + id + '\', this.value, ' + maxCount + ')">' +
        '<span>of ' + maxCount + '</span>' +
      '</div>' +
      '<button class="spiral-sel-remove" onclick="removeActivity(\'' + id + '\')" title="Remove">×</button>';
    list.appendChild(item);
  });

  closeSpiralPreview();
  updateSpiralSummary();
}

function updateActivityCount(id, val, max) {
  var n = Math.max(1, Math.min(parseInt(val) || 1, max));
  if (selectedActivityMap[id]) selectedActivityMap[id].count = n;
  spiralPreviewProbs = null;
  updateSpiralSummary();
}

function removeActivity(id) {
  delete selectedActivityMap[id];
  spiralPreviewProbs = null;
  updateSelectionUI();
}

// ── CUSTOM PROBLEMS ──────────────────────────────────────────────────────────
function addCustomProblem() {
  var eqInput = document.getElementById('custom-eq-input');
  var ansInput = document.getElementById('custom-ans-input');
  var rawEq = eqInput.value.trim();
  var ans = ansInput.value.trim();
  if (!rawEq || !ans) return;

  var eq = formatExponents(rawEq);
  var parsedAns = isNaN(parseFloat(ans)) ? ans : parseFloat(ans);
  var isAlg = /[a-zA-Z]/.test(eq);

  var prob = {
    eq: eq,
    ans: parsedAns,
    ansDisplay: ans,
    isAlgebra: isAlg
  };

  spiralCustomProbs.push(prob);
  eqInput.value = '';
  ansInput.value = '';

  // If preview is active, add custom prob directly — it's guaranteed
  if (spiralPreviewProbs !== null) {
    spiralPreviewProbs.push({ eq: eq, ans: parsedAns, ansDisplay: ans, isAlgebra: isAlg });
    renderPreviewList();
  }

  renderCustomProbs();
  updateSpiralSummary();
  document.getElementById('spiral-selection-area').style.display = '';
}

function removeCustomProb(index) {
  spiralCustomProbs.splice(index, 1);
  spiralPreviewProbs = null;
  renderCustomProbs();
  updateSpiralSummary();
}

function renderCustomProbs() {
  var list = document.getElementById('custom-prob-list');
  list.innerHTML = '';
  spiralCustomProbs.forEach(function(p, i) {
    var item = document.createElement('div');
    item.className = 'custom-prob-item';
    item.innerHTML =
      '<span class="eq">' + p.eq + '</span>' +
      '<span class="ans">' + p.ansDisplay + '</span>' +
      '<button class="del" onclick="removeCustomProb(' + i + ')">×</button>';
    list.appendChild(item);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  var ansInp = document.getElementById('custom-ans-input');
  if (ansInp) ansInp.addEventListener('keydown', function(e) { if (e.key === 'Enter') addCustomProblem(); });
  var eqInp = document.getElementById('custom-eq-input');
  if (eqInp) eqInp.addEventListener('keydown', function(e) { if (e.key === 'Enter') document.getElementById('custom-ans-input').focus(); });
});

// ── SUMMARY & POOL ───────────────────────────────────────────────────────────
function getRawPoolSize() {
  var total = spiralCustomProbs.length;
  Object.values(selectedActivityMap).forEach(function(e) { total += e.count; });
  return total;
}

function getEffectivePoolSize() {
  if (spiralPreviewProbs !== null) return spiralPreviewProbs.length;
  return getRawPoolSize();
}

function updateSpiralSummary() {
  var pool = spiralPreviewProbs !== null ? spiralPreviewProbs.length : getRawPoolSize();
  document.getElementById('spiral-pool-count').textContent = pool;
  document.getElementById('spiral-use-count').textContent = spiralProbCount;

  var note = document.getElementById('spiral-mismatch-note');
  if (spiralPreviewProbs !== null && spiralPreviewProbs.length < spiralProbCount) {
    var need = spiralProbCount - spiralPreviewProbs.length;
    note.textContent = 'You removed problems. Need ' + need + ' more — add custom problems or re-randomize.';
    note.style.display = '';
    note.style.color = 'var(--coral)';
  } else if (pool > spiralProbCount) {
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
  document.querySelectorAll('.prob-count-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  spiralPreviewProbs = null;
  closeSpiralPreview();
  updateSpiralSummary();
}

// ── PROBLEM PREVIEW / HAND-PICK ──────────────────────────────────────────────
function buildSpiralPool() {
  // 1. Always include ALL custom problems (guaranteed)
  var customPool = spiralCustomProbs.map(function(p) {
    return { eq: p.eq, ans: p.ans, ansDisplay: p.ansDisplay || String(p.ans), isAlgebra: !!p.isAlgebra };
  });

  // 2. Build activity problem pool
  var activityPool = [];
  Object.values(selectedActivityMap).forEach(function(entry) {
    var probs = entry.activity.problems;
    var count = Math.min(entry.count, probs.length);
    var shuffled = probs.slice().sort(function() { return Math.random() - 0.5; });
    shuffled.slice(0, count).forEach(function(p) {
      activityPool.push({ eq: p.eq, ans: p.ans, ansDisplay: p.ansDisplay || String(p.ans), isAlgebra: !!p.isAlgebra });
    });
  });

  // Shuffle activity pool
  for (var i = activityPool.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = activityPool[i]; activityPool[i] = activityPool[j]; activityPool[j] = tmp;
  }

  // 3. Fill remaining slots from activity pool (custom problems take priority)
  var remaining = Math.max(0, spiralProbCount - customPool.length);
  var pool = customPool.concat(activityPool.slice(0, remaining));

  // 4. Final shuffle so custom probs aren't clustered at the start
  for (var i = pool.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
  }

  return pool;
}

function previewSpiralProblems() {
  var rawPool = getRawPoolSize();
  if (rawPool === 0) return;

  spiralPreviewProbs = buildSpiralPool();
  renderPreviewList();
  document.getElementById('spiral-preview-section').style.display = '';
  document.getElementById('spiral-preview-btn').style.display = 'none';
  updateSpiralSummary();
}

function reshuffleSpiralPreview() {
  spiralPreviewProbs = buildSpiralPool();
  renderPreviewList();
  updateSpiralSummary();
}

function closeSpiralPreview() {
  document.getElementById('spiral-preview-section').style.display = 'none';
  document.getElementById('spiral-preview-btn').style.display = '';
}

function removePreviewProb(index) {
  if (!spiralPreviewProbs) return;
  spiralPreviewProbs.splice(index, 1);
  renderPreviewList();
  updateSpiralSummary();
}

function renderPreviewList() {
  var list = document.getElementById('spiral-preview-list');
  list.innerHTML = '';
  if (!spiralPreviewProbs) return;

  spiralPreviewProbs.forEach(function(p, i) {
    var row = document.createElement('div');
    row.className = 'spiral-prob-row';
    row.innerHTML =
      '<span class="num">' + (i + 1) + '</span>' +
      '<span class="eq">' + p.eq + '</span>' +
      '<span class="ans">' + (p.ansDisplay || p.ans) + '</span>' +
      '<button class="remove-prob" onclick="removePreviewProb(' + i + ')" title="Remove">×</button>';
    list.appendChild(row);
  });

  var status = document.getElementById('spiral-preview-status');
  if (spiralPreviewProbs.length < spiralProbCount) {
    var need = spiralProbCount - spiralPreviewProbs.length;
    status.innerHTML = '<span style="color:var(--coral);">' + spiralPreviewProbs.length + '/' + spiralProbCount + ' — need ' + need + ' more</span>';
  } else {
    status.innerHTML = '<span style="color:var(--lime-dark);">' + spiralPreviewProbs.length + '/' + spiralProbCount + ' problems ready</span>';
  }
}

// ── TIMER ────────────────────────────────────────────────────────────────────
function setSpiralTimer(mins, btn) {
  spiralTimerMins = mins;
  document.querySelectorAll('.timer-preset').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
}

// ── RESTORE STEP 3 UI (for edit mode) ────────────────────────────────────────
function restoreStep3UI() {
  if (!editingSpiralId) return;

  var timerTog = document.getElementById('timer-toggle');
  if (timerTog) { timerTog.checked = spiralTimerEnabled; document.getElementById('timer-settings').classList.toggle('active', spiralTimerEnabled); }

  document.querySelectorAll('.timer-preset').forEach(function(b) {
    b.classList.toggle('active', parseInt(b.textContent) === spiralTimerMins);
  });

  var calcTog = document.getElementById('calc-toggle');
  if (calcTog) calcTog.checked = spiralCalcEnabled;

  var diffTog = document.getElementById('diff-toggle');
  if (diffTog) diffTog.checked = spiralDiffEnabled;
}

// ── GENERATE & PREVIEW ───────────────────────────────────────────────────────
function genTimerKey() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

function spiralGenerate() {
  var vm = document.getElementById('vm');
  vm.style.display = 'none';

  if (!selImgUrl) { vm.textContent = 'Please go back and choose an image first.'; vm.style.display = 'block'; return; }
  if (!croppedDataUrl && editorReady) cropDone();
  var imgToUse = croppedDataUrl || selImgUrl;

  // Use hand-picked if available, else build fresh
  var pool = (spiralPreviewProbs !== null && spiralPreviewProbs.length >= spiralProbCount)
    ? spiralPreviewProbs.slice()
    : buildSpiralPool();

  if (pool.length < spiralProbCount) {
    vm.textContent = 'Not enough problems (' + pool.length + '). Go back and add more.';
    vm.style.display = 'block';
    return;
  }

  var title = document.getElementById('act-title').value.trim() || 'Spiral Review';
  document.getElementById('lo').classList.add('active');

  spiralGeneratedHTML = buildHTML(title, pool, imgToUse, [], spiralTimerEnabled ? spiralTimerMins : 0, edAR, spiralCalcEnabled, spiralProbCount, false, 0, 'preview');
  document.getElementById('pi').srcdoc = spiralGeneratedHTML;
  document.getElementById('pe').style.display = 'none';
  document.getElementById('pc').style.display = 'flex';
  buildSpiralDLButtons(title, imgToUse);
  document.getElementById('lo').classList.remove('active');
  document.querySelector('.preview-panel').scrollIntoView({ behavior: 'smooth' });
}

// ── DOWNLOAD / SAVE BUTTONS ──────────────────────────────────────────────────
function buildSpiralDLButtons(title, imgData) {
  var c = document.getElementById('dl-btns');
  c.innerHTML = '';

  // Edit mode — show Save Changes + Discard
  if (editingSpiralId) {
    var label = document.createElement('div');
    label.className = 'dl-edit-label';
    label.textContent = 'Editing saved spiral review';
    c.appendChild(label);

    var saveBtn = document.createElement('button');
    saveBtn.className = 'dl-btn-save';
    saveBtn.innerHTML = 'Save Changes';
    saveBtn.onclick = async function() {
      saveBtn.disabled = true; saveBtn.innerHTML = 'Saving...';
      var pool = (spiralPreviewProbs !== null && spiralPreviewProbs.length >= spiralProbCount)
        ? spiralPreviewProbs.slice() : buildSpiralPool();
      var tk = genTimerKey();
      var html = buildHTML(title, pool, imgData, [], spiralTimerEnabled ? spiralTimerMins : 0, edAR, spiralCalcEnabled, spiralProbCount, false, 0, tk);
      var ok = await saveSpiralActivity(html, title, pool);
      if (ok) window.location.href = 'dashboard.html';
      else { saveBtn.disabled = false; saveBtn.innerHTML = 'Save Changes'; }
    };
    c.appendChild(saveBtn);

    var discardBtn = document.createElement('button');
    discardBtn.className = 'dl-btn-discard';
    discardBtn.innerHTML = 'Discard Changes';
    discardBtn.onclick = function() { if (confirm('Discard changes?')) window.location.href = 'dashboard.html'; };
    c.appendChild(discardBtn);

    var divider = document.createElement('div');
    divider.className = 'dl-divider';
    c.appendChild(divider);
    return;
  }

  if (!spiralDiffEnabled) {
    var b = document.createElement('button');
    b.className = 'dl-btn';
    b.innerHTML = 'Save & Go to Dashboard';
    b.onclick = async function() {
      b.disabled = true; b.innerHTML = 'Saving...';
      var pool = (spiralPreviewProbs !== null && spiralPreviewProbs.length >= spiralProbCount)
        ? spiralPreviewProbs.slice() : buildSpiralPool();
      var tk = genTimerKey();
      var html = buildHTML(title, pool, imgData, [], spiralTimerEnabled ? spiralTimerMins : 0, edAR, spiralCalcEnabled, spiralProbCount, false, 0, tk);
      var ok = await saveSpiralActivity(html, title, pool);
      if (ok) window.location.href = 'dashboard.html';
      else { b.disabled = false; b.innerHTML = 'Save & Go to Dashboard'; }
    };
    c.appendChild(b);
  } else {
    var previewLabel = document.createElement('div');
    previewLabel.style.cssText = 'font-size:11px;color:#888;margin-bottom:8px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;';
    previewLabel.textContent = 'Preview version';
    c.appendChild(previewLabel);

    var switcher = document.createElement('div');
    switcher.style.cssText = 'display:flex;gap:6px;margin-bottom:12px;';
    ['A', 'B', 'C'].forEach(function(v, idx) {
      var pb = document.createElement('button');
      pb.className = 'dl-btn dl-btn-diff';
      pb.style.cssText = 'flex:1;padding:9px;font-size:13px;';
      pb.innerHTML = 'Version ' + v;
      if (idx === 0) pb.style.background = 'rgba(122,170,0,0.15)';
      pb.onclick = function() {
        var pool = buildSpiralPool();
        document.getElementById('pi').srcdoc = buildHTML(title + ' \u2014 Version ' + v, pool, imgData, [], spiralTimerEnabled ? spiralTimerMins : 0, edAR, spiralCalcEnabled, spiralProbCount, false, 0);
        switcher.querySelectorAll('button').forEach(function(b) { b.style.background = ''; });
        pb.style.background = 'rgba(122,170,0,0.15)';
      };
      switcher.appendChild(pb);
    });
    c.appendChild(switcher);

    var saveAllBtn = document.createElement('button');
    saveAllBtn.className = 'dl-btn';
    saveAllBtn.innerHTML = 'Save All 3 Versions & Go to Dashboard';
    saveAllBtn.onclick = async function() {
      saveAllBtn.disabled = true;
      var allOk = true;
      for (var vi = 0; vi < 3; vi++) {
        var v = ['A', 'B', 'C'][vi];
        saveAllBtn.innerHTML = 'Saving Version ' + v + '...';
        var pool = buildSpiralPool();
        var tk = genTimerKey();
        var vTitle = title + ' \u2014 Version ' + v;
        var html = buildHTML(vTitle, pool, imgData, [], spiralTimerEnabled ? spiralTimerMins : 0, edAR, spiralCalcEnabled, spiralProbCount, false, 0, tk);
        var ok = await saveSpiralActivity(html, vTitle, pool);
        if (!ok) { allOk = false; break; }
      }
      if (allOk) window.location.href = 'dashboard.html';
      else { saveAllBtn.disabled = false; saveAllBtn.innerHTML = 'Save All 3 Versions & Go to Dashboard'; }
    };
    c.appendChild(saveAllBtn);
  }
}

// ── SAVE TO SUPABASE ─────────────────────────────────────────────────────────
async function saveSpiralActivity(html, title, problems) {
  var token = localStorage.getItem('sb_access_token');
  if (!token) { showSpiralToast('Sign in to save activities', 'warn'); return false; }

  try {
    var ur = await fetch(SB_URL + '/auth/v1/user', {
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + token }
    });
    if (!ur.ok) return false;
    var user = await ur.json();

    // Thumbnail
    var thumbnail = null;
    if (croppedDataUrl) {
      try {
        thumbnail = await new Promise(function(resolve) {
          var img = new Image();
          img.onload = function() {
            var maxW = 300, scale = maxW / img.width;
            var cv = document.createElement('canvas');
            cv.width = maxW; cv.height = Math.round(img.height * scale);
            cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
            resolve(cv.toDataURL('image/jpeg', 0.7));
          };
          img.onerror = function() { resolve(null); };
          img.src = croppedDataUrl;
        });
      } catch (e) { thumbnail = null; }
    }

    var settings = {
      type: 'spiral',
      probCount: spiralProbCount,
      timerEnabled: spiralTimerEnabled,
      timerMins: spiralTimerMins,
      calcEnabled: spiralCalcEnabled,
      diffEnabled: spiralDiffEnabled,
      sourceActivities: Object.keys(selectedActivityMap),
      customProbs: spiralCustomProbs,
      image: croppedDataUrl || null,
      imageAR: edAR
    };

    // EDIT MODE — PATCH
    if (editingSpiralId) {
      var safeSettings = Object.assign({}, settings);
      if (!safeSettings.image && originalEditImage) safeSettings.image = originalEditImage;

      var res = await fetch(SB_URL + '/rest/v1/activities?id=eq.' + editingSpiralId, {
        method: 'PATCH',
        headers: {
          'apikey': SB_KEY, 'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json', 'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ title: title, html: html, subject: 'Spiral Review', thumbnail: thumbnail, settings: safeSettings, problems: problems })
      });
      if (res.ok) { showSpiralToast('✓ Changes saved!', 'ok'); return true; }
      return false;
    }

    // NEW — check limit then POST
    var cr = await fetch(SB_URL + '/rest/v1/activities?user_id=eq.' + user.id + '&select=id', {
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + token }
    });
    var existing = await cr.json();
    if (Array.isArray(existing) && existing.length >= 20) {
      showSpiralToast('Activity limit reached. Delete some to save new ones.', 'warn');
      return false;
    }

    var res2 = await fetch(SB_URL + '/rest/v1/activities', {
      method: 'POST',
      headers: {
        'apikey': SB_KEY, 'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json', 'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ user_id: user.id, title: title, html: html, subject: 'Spiral Review', thumbnail: thumbnail, settings: settings, problems: problems })
    });
    if (res2.ok) { showSpiralToast('✓ Spiral review saved!', 'ok'); return true; }
    return false;
  } catch (e) {
    console.log('Save failed', e);
    showSpiralToast('Failed to save. Please try again.', 'warn');
    return false;
  }
}

function showSpiralToast(msg, type) {
  var t = document.getElementById('save-toast');
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
  t._timeout = setTimeout(function() { t.style.opacity = '0'; }, 3500);
}

// ── EDIT MODE ────────────────────────────────────────────────────────────────
async function initEditMode(id) {
  var token = localStorage.getItem('sb_access_token');
  if (!token) return;

  try {
    var r = await fetch(SB_URL + '/rest/v1/activities?id=eq.' + id + '&select=*', {
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + token }
    });
    var data = await r.json();
    if (!Array.isArray(data) || !data[0]) return;

    var act = data[0];
    var s = act.settings || {};

    // Title
    document.getElementById('act-title').value = act.title || '';

    // Image
    if (s.image) {
      originalEditImage = s.image;
      loadEditorImage(s.image, null);
    }
    if (s.imageAR) { edAR = s.imageAR; }

    // Settings
    spiralTimerEnabled = !!s.timerEnabled;
    spiralTimerMins = s.timerMins || 5;
    spiralCalcEnabled = !!s.calcEnabled;
    spiralDiffEnabled = !!s.diffEnabled;
    spiralProbCount = s.probCount || 20;

    // Update prob count buttons
    document.querySelectorAll('.prob-count-btn').forEach(function(b) {
      b.classList.toggle('active', parseInt(b.textContent) === spiralProbCount);
    });

    // Custom problems
    if (s.customProbs && Array.isArray(s.customProbs)) {
      spiralCustomProbs = s.customProbs;
      renderCustomProbs();
    }

    // Source activities — store IDs, will be selected after activities load
    editSourceActivityIds = s.sourceActivities || [];

  } catch (e) {
    console.log('Edit mode init failed', e);
  }
}

// ── NAV ──────────────────────────────────────────────────────────────────────
function confirmDashboard() {
  if (Object.keys(selectedActivityMap).length > 0 || spiralCustomProbs.length > 0) {
    if (!confirm('Leave without saving? Your current activity won\'t be saved.')) return;
  }
  window.location.href = 'dashboard.html';
}

// ── INIT ─────────────────────────────────────────────────────────────────────
(function init() {
  checkAuth();

  var form = document.getElementById('form-panel');
  form.classList.add('full-width');
  document.getElementById('preview-panel').style.display = 'none';

  // Check for edit mode
  var params = new URLSearchParams(window.location.search);
  var editId = params.get('edit');
  if (editId) {
    editingSpiralId = editId;
    initEditMode(editId);
  }
})();
