function confirmDashboard() {
  if (confirm("Leave the creator? Your current activity won't be saved.")) {
    window.location.href = 'dashboard.html';
  }
}

// ── WIZARD NAVIGATION ────────────────────────────────────────────────────────
function goToStep(n) {
  // hide all panes
  document.querySelectorAll('.wiz-pane').forEach(p => p.style.display = 'none');
  document.getElementById('step-' + n).style.display = 'block';
  currentWizStep = n;

  // update progress indicators
  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById('wstep-' + i);
    el.classList.remove('wiz-active', 'wiz-done');
    if (i < n) el.classList.add('wiz-done');
    else if (i === n) el.classList.add('wiz-active');
  }
  for (let i = 1; i <= 2; i++) {
    const line = document.getElementById('wline-' + i);
    if (line) line.classList.toggle('done', i < n);
  }

  // layout: steps 1 and 2 are full-width; step 3 shows preview
  const formPanel = document.getElementById('form-panel');
  const previewPanel = document.getElementById('preview-panel');
  if (n === 3) {
    formPanel.classList.remove('full-width');
    previewPanel.style.display = 'flex';
    document.getElementById('page-layout').style.gridTemplateColumns = '1fr 1fr';
  } else {
    formPanel.classList.add('full-width');
    previewPanel.style.display = 'none';
    document.getElementById('page-layout').style.gridTemplateColumns = '1fr';
  }

  // scroll form panel to top
  formPanel.scrollTop = 0;
}

function wizNext(fromStep) {
  if (fromStep === 1) {
    if (!selImgUrl) {
      const hint = document.getElementById('step1-hint');
      hint.textContent = 'Please choose or upload an image first.';
      hint.style.display = 'block';
      setTimeout(() => { hint.style.display = 'none'; }, 3000);
      return;
    }
    // Auto-crop if not already done
    if (!croppedDataUrl && editorReady) cropDone();
    goToStep(2);
  } else if (fromStep === 2) {
    if (selProbs.length < numProbs) {
      const hint = document.getElementById('step2-hint');
      hint.textContent = `Please select at least ${numProbs} problems. You have ${selProbs.length}.`;
      hint.style.display = 'block';
      setTimeout(() => { hint.style.display = 'none'; }, 3000);
      return;
    }
    goToStep(3);
  }
}

// ── EDIT MODE ──────────────────────────────────────────────────────────────────
async function initEditMode() {
  const params = new URLSearchParams(window.location.search);
  const actId = params.get('edit');
  if (!actId) return;

  const token = localStorage.getItem('sb_access_token');
  if (!token) return;

  try {
    // Retry up to 3 times — handles brief Supabase read-after-write lag on first edit
    let activityData = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise(res => setTimeout(res, 700));
      const r = await fetch(SB_URL + '/rest/v1/activities?id=eq.' + actId + '&select=*', {
        headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + token }
      });
      if (!r.ok) break;
      const data = await r.json();
      if (Array.isArray(data) && data[0] && data[0].settings) {
        activityData = data[0];
        break;
      }
    }
    if (!activityData) {
      console.log('❌ Activity not found or settings not yet available');
      return;
    }

    const s = activityData.settings;
    console.log('✅ Settings found:', s);
    editingActivityId = actId;

    // Show edit mode UI
    document.getElementById('edit-mode-btns').style.display = 'flex';
    if (document.getElementById('nav-back-btn')) document.getElementById('nav-back-btn').textContent = '← Dashboard';

    // Show per-step discard buttons
    ['discard-s1', 'discard-s2', 'discard-s3'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'block';
    });

    // Restore title
    if (s.title) document.getElementById('act-title').value = s.title;

    // Restore image — hide search/upload UI and show editor
    if (s.image) {
      selImgUrl = s.image;          // fixes "please choose image" error on step advance
      originalEditImage = s.image;  // safety net: prevents accidental null-image save
      croppedDataUrl = s.image;
      edAR = s.imageAR || {w:1,h:1};
      const img = new Image();
      img.onload = () => {
        edImg = img;
        editorReady = true;
        // Hide the search and upload sections
        const searchRow = document.querySelector('.search-row');
        const photoGrid = document.getElementById('pg');
        const orRow = document.querySelector('.or-row');
        const uploadZone = document.querySelector('.upload-zone');
        if (searchRow) searchRow.style.display = 'none';
        if (photoGrid) photoGrid.style.display = 'none';
        if (orRow) orRow.style.display = 'none';
        if (uploadZone) uploadZone.style.display = 'none';
        // Show the editor with the image
        const imgEditor = document.getElementById('img-editor');
        if (imgEditor) imgEditor.classList.add('active');
        // Mirror loadEditorImage: reveal canvas, then size/draw after layout settles.
        // renderEditor reads epw.clientWidth, which is 0 on a cold (uncached) first load
        // unless we wait for layout — hence the double requestAnimationFrame + fillImage.
        const epwMsg = document.getElementById('epw-msg');
        const ec = document.getElementById('ec');
        if (epwMsg) epwMsg.style.display = 'none';
        if (ec) ec.style.display = 'block';
        requestAnimationFrame(() => requestAnimationFrame(() => fillImage()));
        // Add a "Change image" button if not already there
        if (!document.getElementById('change-img-edit-btn')) {
          const chBtn = document.createElement('button');
          chBtn.id = 'change-img-edit-btn';
          chBtn.className = 'change-img-btn';
          chBtn.textContent = 'Change image';
          chBtn.style.marginBottom = '10px';
          chBtn.onclick = () => {
            if (searchRow) searchRow.style.display = '';
            if (photoGrid) photoGrid.style.display = '';
            if (orRow) orRow.style.display = '';
            if (uploadZone) uploadZone.style.display = '';
            chBtn.remove();
          };
          imgEditor.parentNode.insertBefore(chBtn, imgEditor);
        }
      };
      img.src = s.image;
    }

    // Restore category
    if (s.cat) {
      const catBtn = document.getElementById(s.cat === 'alg' ? 'cat-alg' : 'cat-ops');
      if (catBtn) setCat(s.cat, catBtn);
    }

    // Restore ops settings
    if (s.cat === 'ops' && s.op) {
      curOp = s.op; curLvl = s.lvl || 1;
      // Click the right operation tab
      document.querySelectorAll('#op-tabs .tab').forEach(b => {
        const onclick = b.getAttribute('onclick') || '';
        if (onclick.includes("'" + s.op + "'") || onclick.includes('"' + s.op + '"')) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });
      // Rebuild level tabs and select right level
      buildLvTabs && buildLvTabs();
      setTimeout(() => {
        document.querySelectorAll('#lv-tabs .tab').forEach(b => {
          const onclick = b.getAttribute('onclick') || '';
          if (onclick.includes('curLvl=' + s.lvl) || (b.textContent.trim() === 'L' + s.lvl)) {
            b.classList.add('active');
          }
        });
        renderProblems();
      }, 50);
    }

    // Restore alg settings
    if (s.cat === 'alg' && s.algType) {
      curAlgType = s.algType; curAlgLv = s.algLv || 1;
      document.querySelectorAll('#alg-type-tabs .tab').forEach(b => {
        const onclick = b.getAttribute('onclick') || '';
        if (onclick.includes("'" + s.algType + "'") || onclick.includes('"' + s.algType + '"')) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });
      buildAlgLvTabs();
      setTimeout(() => {
        document.querySelectorAll('#alg-lv-tabs .tab').forEach(b => {
          if (b.textContent.trim() === 'L' + s.algLv) b.classList.add('active');
        });
        renderAlgProblems();
      }, 50);
    }

    // Restore mode
    if (s.mode) {
      curMode = s.mode;
      document.querySelectorAll('.mode-btn').forEach(b => {
        b.classList.toggle('active', b.textContent.toLowerCase().includes(s.mode));
      });
    }

    // Restore selected problems — use full saved objects so exact problems are restored
    if (s.selectedProbs && s.selectedProbs.length) {
      setTimeout(() => {
        selProbs = [...s.selectedProbs];
        allProbs = [...s.selectedProbs]; // use saved problems as the display pool
        renderProbList(allProbs, allProbs.map(p => p.eq));
      }, 150);
    } else if (s.mode === 'manual' && s.selectedEqs && s.selectedEqs.length) {
      // fallback for older activities saved before selectedProbs was added
      setTimeout(() => {
        selProbs = allProbs.filter(p => s.selectedEqs.includes(p.eq));
        renderProbList(allProbs, s.selectedEqs);
      }, 150);
    }

    // Restore hints
    if (s.hintCount) {
      hintCount = s.hintCount;
      hints = s.hints || hints;
      document.querySelectorAll('.hc-btn').forEach((b, i) => b.classList.toggle('active', i === s.hintCount));
      setHints(s.hintCount, document.querySelectorAll('.hc-btn')[s.hintCount]);
      // Fill hint inputs
      setTimeout(() => {
        for (let i = 0; i < s.hintCount; i++) {
          const inp = document.getElementById('hint-' + i);
          if (inp && s.hints[i]) inp.value = s.hints[i];
        }
      }, 100);
    }

    // Restore timer
    if (s.timerEnabled) {
      timerEnabled = true;
      timerMins = s.timerMins || 5;
      document.getElementById('timer-toggle').checked = true;
      toggleTimer(true);
      document.querySelectorAll('.timer-preset').forEach(b => {
        b.classList.toggle('active', parseInt(b.textContent) === timerMins);
      });
    }

    // Restore diff
    if (s.diffEnabled) {
      diffEnabled = true;
      document.getElementById('diff-toggle').checked = true;
      toggleDiff(true);
    }

    // Restore calculator
    if (s.calcEnabled) {
      calcEnabled = true;
      const ct = document.getElementById('calc-toggle');
      if (ct) ct.checked = true;
    }

    // Restore problem count
    if (s.numProbs) {
      numProbs = s.numProbs;
      document.querySelectorAll('.prob-count-btn').forEach(b => {
        b.classList.toggle('active', parseInt(b.textContent) === s.numProbs);
      });
      document.getElementById('sc-total') && (document.getElementById('sc-total').textContent = s.numProbs);
    }

  } catch(e) {
    console.log('Edit mode init failed', e);
  }
}

// ── INIT ────────────────────────────────────────────────────────────────────
buildLvTabs();
renderProblems();
checkAuth();
initEditMode();
document.addEventListener('DOMContentLoaded', function() {
  goToStep(1);
});

