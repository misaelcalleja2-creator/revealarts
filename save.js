let originalEditImage = null; // stores the image from Supabase when edit mode loads — prevents accidental null saves

async function generate(){
  const vm=document.getElementById('vm');vm.style.display='none';
  if(!selImgUrl){vm.textContent='Please go back and choose an image first.';vm.style.display='block';return;}
  if(!croppedDataUrl&&editorReady)cropDone();
  const imgToUse=croppedDataUrl||selImgUrl;
  // auto-crop if needed
  if(!croppedDataUrl&&editorReady)cropDone();
  if(selProbs.length<numProbs){vm.textContent='Please select at least '+numProbs+' problems. You have '+selProbs.length+'.';vm.style.display='block';return;}
  const title=document.getElementById('act-title').value.trim()||'Reveal Art Activity';
  document.getElementById('lo').classList.add('active');
  const hintList=hints.slice(0,hintCount).filter(h=>h.trim());
  const preview20=selProbs.length>numProbs?[...selProbs].sort(()=>Math.random()-0.5).slice(0,numProbs):selProbs;
  const preview20WithDisplay=preview20.map(p=>({eq:p.eq,ans:p.ans,ansDisplay:p.ansDisplay||String(p.ans),isAlgebra:!!p.isAlgebra}));generatedHTML=buildHTML(title,preview20WithDisplay,croppedDataUrl,hintList,timerEnabled?timerMins:0,edAR,calcEnabled,numProbs,aiTutorEnabled,aiHelpLimit);
  document.getElementById('pi').srcdoc=generatedHTML;
  document.getElementById('pe').style.display='none';
  document.getElementById('pc').style.display='flex';
  buildDLButtons(title,croppedDataUrl,hintList);
  document.getElementById('lo').classList.remove('active');
  document.querySelector('.preview-panel').scrollIntoView({behavior:'smooth'});
}

function buildDLButtons(title,imgData,hintList){
  const c=document.getElementById('dl-btns');c.innerHTML='';
  // Also check URL param in case initEditMode is still loading
  if(!editingActivityId){const p=new URLSearchParams(window.location.search);const eid=p.get('edit');if(eid)editingActivityId=eid;}
  console.log('buildDLButtons: editingActivityId =', editingActivityId);

  // Edit mode — show Save Changes + Discard at top
  if(editingActivityId){
    const label=document.createElement('div');label.className='dl-edit-label';label.textContent='Editing saved activity';
    c.appendChild(label);

    const saveBtn=document.createElement('button');saveBtn.className='dl-btn-save';saveBtn.innerHTML='💾 Save Changes';
    saveBtn.onclick=()=>saveChanges();
    c.appendChild(saveBtn);

    const discardBtn=document.createElement('button');discardBtn.className='dl-btn-discard';discardBtn.innerHTML='✕ Discard Changes';
    discardBtn.onclick=()=>discardChanges();
    c.appendChild(discardBtn);

    const divider=document.createElement('div');divider.className='dl-divider';
    c.appendChild(divider);
  }

  if(!diffEnabled){
    const b=document.createElement('button');b.className='dl-btn';
    b.innerHTML= editingActivityId ? 'Save Changes' : 'Save & Go to Dashboard';
    if(editingActivityId){
      b.onclick=()=>saveChanges();
    } else {
      b.onclick=async()=>{
        b.disabled=true;b.innerHTML='Saving...';
        const p=selProbs.length>numProbs?[...selProbs].sort(()=>Math.random()-0.5).slice(0,numProbs):[...selProbs].sort(()=>Math.random()-0.5);
        const html=buildHTML(title,p,imgData,hintList,timerEnabled?timerMins:0,edAR,calcEnabled,numProbs,aiTutorEnabled,aiHelpLimit);
        const success=await saveActivity(html,title);
        if(success){window.location.href='dashboard.html';}
        else{b.disabled=false;b.innerHTML='Save & Go to Dashboard';}
      };
    }
    c.appendChild(b);
  }else{
    // Diff mode — preview switcher buttons + one save button
    const previewLabel=document.createElement('div');
    previewLabel.style.cssText='font-size:11px;color:#888;margin-bottom:8px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;';
    previewLabel.textContent='Preview version';
    c.appendChild(previewLabel);

    const switcher=document.createElement('div');
    switcher.style.cssText='display:flex;gap:6px;margin-bottom:12px;';
    ['A','B','C'].forEach((v,idx)=>{
      const pb=document.createElement('button');
      pb.className='dl-btn dl-btn-diff';
      pb.style.cssText='flex:1;padding:9px;font-size:13px;';
      pb.innerHTML=`Version ${v}`;
      if(idx===0)pb.style.background='rgba(122,170,0,0.15)';
      pb.onclick=()=>{
        document.getElementById('lo-txt').textContent=`Building Version ${v}...`;
        document.getElementById('lo').classList.add('active');
        const praw=selProbs.length>numProbs?[...selProbs].sort(()=>Math.random()-0.5).slice(0,numProbs):[...selProbs].sort(()=>Math.random()-0.5);
        const p=praw.map(q=>({eq:q.eq,ans:q.ans,ansDisplay:q.ansDisplay||String(q.ans),isAlgebra:!!q.isAlgebra}));
        document.getElementById('pi').srcdoc=buildHTML(`${title} — Version ${v}`,p,imgData,hintList,timerEnabled?timerMins:0,edAR,calcEnabled,numProbs,aiTutorEnabled,aiHelpLimit);
        switcher.querySelectorAll('button').forEach(b=>b.style.background='');
        pb.style.background='rgba(122,170,0,0.15)';
        document.getElementById('lo').classList.remove('active');
      };
      switcher.appendChild(pb);
    });
    c.appendChild(switcher);

    const saveBtn=document.createElement('button');saveBtn.className='dl-btn';
    saveBtn.innerHTML= editingActivityId ? 'Save Changes' : 'Save & Go to Dashboard';
    if(editingActivityId){
      saveBtn.onclick=()=>saveChanges();
    } else {
      saveBtn.onclick=async()=>{
        saveBtn.disabled=true;saveBtn.innerHTML='Saving...';
        const p=selProbs.length>numProbs?[...selProbs].sort(()=>Math.random()-0.5).slice(0,numProbs):[...selProbs].sort(()=>Math.random()-0.5);
        const html=buildHTML(title,p,imgData,hintList,timerEnabled?timerMins:0,edAR,calcEnabled,numProbs,aiTutorEnabled,aiHelpLimit);
        const success=await saveActivity(html,title);
        if(success){window.location.href='dashboard.html';}
        else{saveBtn.disabled=false;saveBtn.innerHTML='Save & Go to Dashboard';}
      };
    }
    c.appendChild(saveBtn);
  }
}

function toggleAiTutor(on) { aiTutorEnabled = false; }
function setAiLimit(n, btn) { aiHelpLimit = 0; }

function captureSettings() {
  return {
    title: document.getElementById('act-title').value.trim(),
    cat: curCat,
    op: curOp,
    lvl: curLvl,
    algType: curAlgType,
    algLv: curAlgLv,
    mode: curMode,
    selectedEqs: selProbs.map(p => p.eq),
    hintCount: hintCount,
    hints: [...hints],
    timerEnabled: timerEnabled,
    timerMins: timerMins,
    calcEnabled: calcEnabled,
    numProbs: numProbs,
    diffEnabled: diffEnabled,
    aiTutorEnabled: aiTutorEnabled,
    aiHelpLimit: aiHelpLimit,
    image: croppedDataUrl,
    imageAR: edAR
  };
}

async function saveActivity(html, title) {
  const token = localStorage.getItem('sb_access_token');
  if (!token) { showSaveToast('Sign in to save activities to your dashboard', 'warn'); return; }

  try {
    const ur = await fetch(SB_URL + '/auth/v1/user', {
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + token }
    });
    if (!ur.ok) return;
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
      } catch(e) { thumbnail = null; }
    }

    const settings = captureSettings();
    const subject = curCat === 'alg' ? 'Algebra' : 'Operations';

    // If editing existing activity — UPDATE instead of INSERT
    if (editingActivityId) {
      const safeSettings = Object.assign({}, settings);
      if (!safeSettings.image && originalEditImage) safeSettings.image = originalEditImage;
      const res = await fetch(SB_URL + '/rest/v1/activities?id=eq.' + editingActivityId, {
        method: 'PATCH',
        headers: {
          'apikey': SB_KEY,
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ title, html, subject, thumbnail, settings: safeSettings })
      });
      if (res.ok) { showSaveToast('✓ Changes saved!', 'ok'); return true; }
      return false;
    }

    // New activity — check limit first
    const pr = await fetch(SB_URL + '/rest/v1/profiles?id=eq.' + user.id + '&select=*', {
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + token }
    });
    const profiles = await pr.json();
    const profile = Array.isArray(profiles) ? profiles[0] : null;
    const isPaid = profile && profile.is_paid;
    const limit = 20;

    const cr = await fetch(SB_URL + '/rest/v1/activities?user_id=eq.' + user.id + '&select=id', {
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + token }
    });
    const existing = await cr.json();
    const count = Array.isArray(existing) ? existing.length : 0;

    if (count >= limit) {
      const limitMsg = isPaid
        ? 'You have reached your 20 activity limit. Delete some activities from your dashboard to save new ones.'
        : 'You have reached the 20 activity limit. Delete some to save new ones.';
      showSaveToast(limitMsg, 'warn');
      return;
    }

    const res = await fetch(SB_URL + '/rest/v1/activities', {
      method: 'POST',
      headers: {
        'apikey': SB_KEY,
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ user_id: user.id, title, html, subject, thumbnail, settings })
    });

    if (res.ok) { showSaveToast('✓ Activity saved to your dashboard!', 'ok'); return true; }
  } catch(e) {
    console.log('Save failed silently', e);
    showSaveToast('Failed to save. Please try again.', 'warn');
    return false;
  }
}

function showSaveToast(msg, type) {
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

function doDownload(html, title) {
  const blob = new Blob([html], {type: 'text/html'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.html';
  a.click();
  saveActivity(html, title); // save to cloud in background
}

async function saveChanges() {
  const title = document.getElementById('act-title').value.trim() || 'Untitled Activity';
  if (!croppedDataUrl) { alert('Please set an image first.'); return; }
  const hintList = hints.slice(0, hintCount).filter(h => h.trim());
  const selToUse = selProbs.length > numProbs ? [...selProbs].sort(() => Math.random() - 0.5).slice(0, numProbs) : [...selProbs];
  const html = buildHTML(title, selToUse, croppedDataUrl, hintList, timerEnabled ? timerMins : 0, edAR, calcEnabled, numProbs);
  const success = await saveActivity(html, title);
  if (success) window.location.href = 'dashboard.html';
}

function discardChanges() {
  if (confirm('Discard all changes and go back to dashboard?')) {
    window.location.href = 'dashboard.html';
  }
}
