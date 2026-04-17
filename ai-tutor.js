// ── REVEAL ARTS AI TUTOR ──────────────────────────────────────────────────────
// This file is loaded by generated activity HTML.
// It expects PROBS, solved, and AI_HELP_MAX to be defined globally.

(function() {

var aiHelpUsed = 0;
var aiPanelOpen = false;
var aiGreeted = false;
var currentProbIdx = null;

// ── INJECT STYLES ──────────────────────────────────────────────────────────────
var style = document.createElement('style');
style.textContent = `
.ai-fab-wrap{position:fixed;bottom:20px;left:20px;z-index:9999;}
.ai-fab{width:52px;height:52px;border-radius:50%;background:#9b5de5;color:#fff;border:3px solid rgba(255,255,255,0.2);font-size:22px;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;transition:transform .15s;-webkit-tap-highlight-color:transparent;}
.ai-fab:hover{transform:scale(1.08);}
.ai-fab.pulse{animation:aipulse 2s infinite;}
@keyframes aipulse{0%,100%{box-shadow:0 4px 20px rgba(155,93,229,0.4)}50%{box-shadow:0 4px 30px rgba(155,93,229,0.8)}}
.ai-panel{display:none;position:fixed;bottom:82px;left:20px;z-index:9998;background:#1a1a2e;border:1px solid rgba(155,93,229,0.35);border-radius:18px;box-shadow:0 12px 40px rgba(0,0,0,0.7);width:340px;height:480px;flex-direction:column;}
.ai-panel.open{display:flex;}
.ai-panel-header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 10px;border-bottom:1px solid rgba(255,255,255,0.07);flex-shrink:0;}
.ai-panel-title{font-family:'Fredoka One',cursive;font-size:16px;color:#9b5de5;display:flex;align-items:center;gap:7px;}
.ai-limit-badge{font-size:10px;background:rgba(155,93,229,0.15);border:1px solid rgba(155,93,229,0.3);color:rgba(155,93,229,0.8);border-radius:100px;padding:2px 8px;font-family:'Nunito',sans-serif;font-weight:700;}
.ai-close-btn{background:transparent;border:none;color:rgba(255,255,255,0.3);font-size:18px;cursor:pointer;padding:2px 6px;line-height:1;}
.ai-messages{flex:1;overflow-y:scroll;padding:12px 14px;display:flex;flex-direction:column;gap:10px;min-height:0;}
.ai-messages::-webkit-scrollbar{width:3px;}
.ai-messages::-webkit-scrollbar-thumb{background:rgba(155,93,229,0.3);border-radius:99px;}
.ai-input-row{display:flex;gap:6px;padding:10px 12px;border-top:1px solid rgba(255,255,255,0.07);flex-shrink:0;}
.ai-input{flex:1;background:rgba(255,255,255,0.07);border:1px solid rgba(155,93,229,0.25);border-radius:10px;padding:8px 12px;font-size:13px;font-family:'Nunito',sans-serif;color:#fff;outline:none;}
.ai-input:focus{border-color:rgba(155,93,229,0.6);}
.ai-input::placeholder{color:rgba(255,255,255,0.25);}
.ai-send-btn{background:#9b5de5;border:none;border-radius:10px;color:#fff;font-size:16px;cursor:pointer;padding:0 12px;flex-shrink:0;}
.ai-msg{display:flex;flex-direction:column;gap:3px;}
.ai-msg.bot .ai-bubble{background:rgba(155,93,229,0.12);border:1px solid rgba(155,93,229,0.2);border-radius:4px 14px 14px 14px;padding:10px 13px;font-size:13px;color:rgba(255,255,255,0.85);line-height:1.55;}
.ai-msg.user .ai-bubble{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);border-radius:14px 14px 4px 14px;padding:10px 13px;font-size:13px;color:rgba(255,255,255,0.7);align-self:flex-end;max-width:90%;}
.ai-msg.bot{align-items:flex-start;}
.ai-msg.user{align-items:flex-end;}
.ai-label{font-size:9px;font-weight:800;letter-spacing:0.8px;text-transform:uppercase;color:rgba(155,93,229,0.5);margin-bottom:1px;}
.ai-label.user-lbl{color:rgba(255,255,255,0.25);text-align:right;}
.prob-picker{display:flex;flex-wrap:wrap;gap:5px;padding:4px 0 2px;}
.prob-pick-btn{background:rgba(155,93,229,0.1);border:1px solid rgba(155,93,229,0.25);color:rgba(255,255,255,0.7);border-radius:7px;padding:5px 10px;font-size:11px;font-weight:700;font-family:'Nunito',sans-serif;cursor:pointer;transition:all .15s;}
.prob-pick-btn:hover{background:rgba(155,93,229,0.25);color:#fff;}
.ai-typing{display:flex;gap:4px;align-items:center;padding:8px 4px;}
.ai-typing span{width:7px;height:7px;background:rgba(155,93,229,0.6);border-radius:50%;animation:aidot .9s infinite;}
.ai-typing span:nth-child(2){animation-delay:.2s;}
.ai-typing span:nth-child(3){animation-delay:.4s;}
@keyframes aidot{0%,80%,100%{transform:scale(1);opacity:0.5}40%{transform:scale(1.3);opacity:1}}
.step-block{font-family:'Courier New',monospace;margin-top:8px;font-size:13px;line-height:1.9;background:rgba(0,0,0,0.25);border-radius:8px;padding:10px 12px;}
.step-orig{color:#fff;font-weight:700;white-space:pre;}
.step-ops-row{color:#c8f135;font-weight:700;white-space:pre;}
.step-hline{border:none;border-top:1.5px solid rgba(255,255,255,0.35);margin:3px 0 4px;}
.step-simp-row{display:flex;align-items:center;gap:4px;flex-wrap:wrap;}
.frac-term{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;margin:0 1px;}
.frac-num{border-bottom:1.5px solid #fff;padding:0 4px;color:#fff;font-weight:700;text-align:center;line-height:1.4;}
.frac-den{padding:0 4px;color:#c8f135;font-weight:700;text-align:center;line-height:1.4;}
.step-answer{color:#c8f135;font-weight:800;font-size:14px;margin-top:4px;display:block;}
.step-explain{font-size:10px;color:rgba(255,255,255,0.35);font-style:italic;margin-top:2px;font-family:'Nunito',sans-serif;display:block;}
`;
document.head.appendChild(style);

// ── INJECT HTML ────────────────────────────────────────────────────────────────
var wrap = document.createElement('div');
wrap.innerHTML = `
<div class="ai-fab-wrap">
  <button class="ai-fab pulse" id="ai-fab" title="AI Tutor">🤖</button>
</div>
<div class="ai-panel" id="ai-panel">
  <div class="ai-panel-header">
    <div class="ai-panel-title">🤖 AI Tutor<span class="ai-limit-badge" id="ai-limit-badge"></span></div>
    <button class="ai-close-btn" id="ai-close">✕</button>
  </div>
  <div class="ai-messages" id="ai-messages"></div>
  <div class="ai-input-row">
    <input class="ai-input" id="ai-input" type="text" placeholder="Ask a follow-up question..." autocomplete="off" />
    <button class="ai-send-btn" id="ai-send">➤</button>
  </div>
</div>`;
document.body.appendChild(wrap);

// ── WIRE UP EVENTS ─────────────────────────────────────────────────────────────
document.getElementById('ai-fab').addEventListener('click', toggleAiPanel);
document.getElementById('ai-close').addEventListener('click', toggleAiPanel);
document.getElementById('ai-send').addEventListener('click', handleUserMessage);
document.getElementById('ai-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') handleUserMessage();
});

// ── HELPERS ────────────────────────────────────────────────────────────────────
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function fmtEq(eq) {
  if (eq && eq.startsWith('FRAC:')) {
    var p = eq.split(':');
    return p[1] + '/' + p[2].split(' = ')[0] + ' = ' + p[2].split(' = ')[1];
  }
  return eq;
}

function getProbs()  { return window.PROBS  || []; }
function getSolved() { return window.solved || new Set(); }
function getLimit()  { return (window.AI_HELP_MAX !== undefined) ? window.AI_HELP_MAX : 0; }

// ── PANEL TOGGLE ───────────────────────────────────────────────────────────────
function toggleAiPanel() {
  aiPanelOpen = !aiPanelOpen;
  document.getElementById('ai-panel').classList.toggle('open', aiPanelOpen);
  document.getElementById('ai-fab').classList.remove('pulse');
  if (aiPanelOpen && !aiGreeted) { aiGreeted = true; aiGreet(); }
  if (aiPanelOpen) {
    setTimeout(function() {
      var m = document.getElementById('ai-messages');
      m.scrollTop = m.scrollHeight;
      var inp = document.getElementById('ai-input');
      if (inp) inp.focus();
    }, 150);
  }
}

// ── BADGE ──────────────────────────────────────────────────────────────────────
function updateBadge() {
  var badge = document.getElementById('ai-limit-badge');
  var max = getLimit();
  if (max === 0) { badge.textContent = 'Unlimited helps'; return; }
  var left = max - aiHelpUsed;
  badge.textContent = left + ' help' + (left !== 1 ? 's' : '') + ' left';
  badge.style.borderColor = left <= 1 ? 'rgba(255,92,58,0.4)' : 'rgba(155,93,229,0.3)';
  badge.style.color = left <= 1 ? 'rgba(255,92,58,0.8)' : 'rgba(155,93,229,0.8)';
}

// ── MESSAGES ───────────────────────────────────────────────────────────────────
function addMsg(role, html) {
  var msgs = document.getElementById('ai-messages');
  var wrap = document.createElement('div'); wrap.className = 'ai-msg ' + role;
  var lbl = document.createElement('div');
  lbl.className = 'ai-label' + (role === 'user' ? ' user-lbl' : '');
  lbl.textContent = role === 'bot' ? 'AI Tutor' : 'You';
  var bubble = document.createElement('div'); bubble.className = 'ai-bubble';
  bubble.innerHTML = html;
  wrap.appendChild(lbl); wrap.appendChild(bubble);
  msgs.appendChild(wrap); msgs.scrollTop = msgs.scrollHeight;
}

function addTyping() {
  var msgs = document.getElementById('ai-messages');
  var wrap = document.createElement('div'); wrap.className = 'ai-msg bot'; wrap.id = 'ai-typing-wrap';
  var bubble = document.createElement('div'); bubble.className = 'ai-bubble';
  bubble.innerHTML = '<div class="ai-typing"><span></span><span></span><span></span></div>';
  wrap.appendChild(bubble); msgs.appendChild(wrap); msgs.scrollTop = msgs.scrollHeight;
}

function removeTyping() { var t = document.getElementById('ai-typing-wrap'); if (t) t.remove(); }

// ── GREET ──────────────────────────────────────────────────────────────────────
function aiGreet() {
  updateBadge();
  var probs = getProbs(); var solved = getSolved();
  var unsolved = probs.map(function(p,i){return{p:p,i:i};}).filter(function(x){return !solved.has(x.i);});
  if (unsolved.length === 0) { addMsg('bot', 'You solved all the problems! Amazing work! 🎉'); return; }

  var msgs = document.getElementById('ai-messages');
  var wrap = document.createElement('div'); wrap.className = 'ai-msg bot';
  var lbl = document.createElement('div'); lbl.className = 'ai-label'; lbl.textContent = 'AI Tutor';
  var bubble = document.createElement('div'); bubble.className = 'ai-bubble';
  bubble.innerHTML = 'Hey! I am your AI Tutor. Which problem do you want help with?';
  var picker = document.createElement('div'); picker.className = 'prob-picker'; picker.style.marginTop = '8px';
  unsolved.forEach(function(x) {
    var btn = document.createElement('button'); btn.className = 'prob-pick-btn';
    btn.textContent = (x.i+1) + '. ' + fmtEq(x.p.eq);
    btn.addEventListener('click', function(){ requestHelp(x.i); });
    picker.appendChild(btn);
  });
  bubble.appendChild(picker); wrap.appendChild(lbl); wrap.appendChild(bubble);
  msgs.appendChild(wrap); msgs.scrollTop = msgs.scrollHeight;
}

function offerMore(excludeIdx) {
  var probs = getProbs(); var solved = getSolved(); var max = getLimit();
  var unsolved = probs.map(function(p,i){return{p:p,i:i};}).filter(function(x){return !solved.has(x.i)&&x.i!==excludeIdx;});
  if (unsolved.length === 0 || !(max === 0 || (max - aiHelpUsed) > 0)) return;

  var msgs = document.getElementById('ai-messages');
  var wrap = document.createElement('div'); wrap.className = 'ai-msg bot';
  var lbl = document.createElement('div'); lbl.className = 'ai-label'; lbl.textContent = 'AI Tutor';
  var bubble = document.createElement('div'); bubble.className = 'ai-bubble';
  bubble.innerHTML = 'Need help with another one? Or type a question!';
  var picker = document.createElement('div'); picker.className = 'prob-picker'; picker.style.marginTop = '8px';
  unsolved.forEach(function(x) {
    var btn = document.createElement('button'); btn.className = 'prob-pick-btn';
    btn.textContent = (x.i+1) + '. ' + fmtEq(x.p.eq);
    btn.addEventListener('click', function(){ requestHelp(x.i); });
    picker.appendChild(btn);
  });
  bubble.appendChild(picker); wrap.appendChild(lbl); wrap.appendChild(bubble);
  msgs.appendChild(wrap); msgs.scrollTop = msgs.scrollHeight;
}

// ── REQUEST HELP ───────────────────────────────────────────────────────────────
async function requestHelp(idx) {
  var max = getLimit(); var solved = getSolved(); var probs = getProbs();
  if (max > 0 && aiHelpUsed >= max) { addMsg('bot', 'No more helps available. Give it your best shot!'); return; }
  if (solved.has(idx)) { addMsg('bot', 'You already solved that one! Pick a different problem.'); return; }
  currentProbIdx = idx; aiHelpUsed++; updateBadge();
  var prob = probs[idx]; var eq = fmtEq(prob.eq);
  addMsg('user', 'Help me with #' + (idx+1) + ': ' + eq);
  addTyping();
  try {
    var steps = await getAiSteps(prob.eq, prob.ans, prob.ansDisplay);
    removeTyping();
    if (steps && steps.orig) { renderSteps(idx, steps); }
    else { addMsg('bot', 'Sorry, had trouble with that one. Try again!'); }
  } catch(e) { removeTyping(); addMsg('bot', 'Connection issue — try again!'); }
  setTimeout(function(){ offerMore(idx); }, 600);
}

// ── FOLLOW-UP CHAT ─────────────────────────────────────────────────────────────
async function handleUserMessage() {
  var inp = document.getElementById('ai-input');
  var text = inp.value.trim(); if (!text) return;
  inp.value = ''; addMsg('user', text);
  var nm = text.match(/^(\d+)$/);
  if (nm) { var idx = parseInt(nm[1])-1; if (idx >= 0 && idx < getProbs().length) { requestHelp(idx); return; } }
  addTyping();
  try {
    var probs = getProbs();
    var ctx = currentProbIdx !== null
      ? 'Student is on problem ' + (currentProbIdx+1) + ': ' + fmtEq(probs[currentProbIdx].eq)
      : 'Student is doing algebra.';
    var resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({model:'claude-sonnet-4-20250514', max_tokens:300, messages:[{role:'user',content:'You are a friendly middle school math tutor. Keep answers to 2-3 sentences. '+ctx+' Student question: '+text}]})
    });
    removeTyping();
    if (!resp.ok) { addMsg('bot', 'Connection issue — try again!'); return; }
    var data = await resp.json();
    addMsg('bot', (data.content||[]).map(function(c){return c.text||'';}).join(''));
  } catch(e) { removeTyping(); addMsg('bot', 'Connection issue — try again!'); }
}

// ── RENDER STEPS ───────────────────────────────────────────────────────────────
function renderSteps(idx, steps) {
  var html = '<strong style="font-size:11px;color:rgba(255,255,255,0.4);">Problem ' + (idx+1) + '</strong>';
  html += '<div class="step-block">';
  html += '<div class="step-orig">' + esc(steps.orig||'') + '</div>';
  if (steps.opsRow) html += '<div class="step-ops-row">' + esc(steps.opsRow) + '</div>';
  html += '<hr class="step-hline">';
  if (steps.simplified) html += '<div class="step-simp-row">' + buildFracRow(steps.simplified) + '</div>';
  if (steps.answer) html += '<div class="step-answer">' + esc(steps.answer) + '</div>';
  if (steps.explain) html += '<div class="step-explain">' + esc(steps.explain) + '</div>';
  html += '</div>';
  addMsg('bot', html);
}

function buildFracRow(row) {
  var parts = row.split('=');
  if (parts.length < 2) return esc(row);
  return renderFracTerm(parts[0].trim()) + ' <span style="color:#fff;font-weight:700;padding:0 6px;">=</span> ' + renderFracTerm(parts.slice(1).join('=').trim());
}

function renderFracTerm(term) {
  term = term.trim();
  var m = term.match(/^(.+)\/([0-9]+)$/);
  if (m) return '<span class="frac-term"><span class="frac-num">'+esc(m[1])+'</span><span class="frac-den">'+esc(m[2])+'</span></span>';
  return '<span style="color:#fff;font-weight:700;">'+esc(term)+'</span>';
}

// ── GET AI STEPS ───────────────────────────────────────────────────────────────
async function getAiSteps(eq, ans, ansDisplay) {
  var cleanEq = eq.startsWith('FRAC:') ? fmtEq(eq) : eq;
  var finalAns = ansDisplay || String(ans);
  var prompt = 'You are a middle school math tutor. Solve: ' + cleanEq + '. Answer: x=' + finalAns + '. Return ONLY this JSON (no markdown): {"orig":"equation as written","opsRow":"operation row with spaces aligning ops under terms","simplified":"e.g. 2x/2 = 6/2 only if division needed else empty string","answer":"x = ' + finalAns + '","explain":"one short sentence"}. For x+4=8: put -4 under both sides in opsRow. For 5x=15: opsRow empty, put 5x/5 = 15/5 in simplified. For x/7=3: put x7 in opsRow. For 2x+4=10: subtract in opsRow, divide in simplified. Return ONLY the JSON.';
  var resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({model:'claude-sonnet-4-20250514', max_tokens:400, messages:[{role:'user',content:prompt}]})
  });
  if (!resp.ok) return null;
  var data = await resp.json();
  var text = (data.content||[]).map(function(c){return c.text||'';}).join('');
  try { return JSON.parse(text.replace(/```json|```/g,'').trim()); } catch(e) { return null; }
}

})();
