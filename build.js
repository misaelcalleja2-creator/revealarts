// ── BUILD ACTIVITY HTML ─────────────────────────────────────────────────────────
function buildHTML(title,problems,imageData,hintList,timerMinsVal,ar,showCalc,probCount,showAiTutor,aiLimit,timerKey){
  const N=probCount||problems.length||20;
  // Grid size: cap at 30 so tiles stay a reasonable visual size for any problem count
  const GN_GRID=Math.min(N,30);
  // Dynamically generate N evenly-distributed anchor points on a GN_GRID x GN_GRID grid
  function makeAnchors(n,gs){
    const cols=Math.ceil(Math.sqrt(n));
    const rows=Math.ceil(n/cols);
    const result=[];
    for(let r=0;r<rows&&result.length<n;r++){
      for(let c=0;c<cols&&result.length<n;c++){
        result.push([
          Math.min(gs-1,Math.round((r+0.5)/rows*gs)),
          Math.min(gs-1,Math.round((c+0.5)/cols*gs))
        ]);
      }
    }
    return result;
  }
  const anchors=makeAnchors(N,GN_GRID);
  // Shuffle so the image reveals in a random spatial pattern each time
  for(let i=anchors.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[anchors[i],anchors[j]]=[anchors[j],anchors[i]];}
  const TOTAL=N;
  const esc=imageData.replace(/\\/g,'\\\\').replace(/`/g,'\\`');
  const IW=500,IH=Math.round(500*(ar.h/ar.w));
  const hasTimer=timerMinsVal>0,hasHints=hintList.length>0,hasCalc=!!showCalc,hasAiTutor=!!showAiTutor;
  const aiHelpMax=aiLimit||0;
  const timerStart=String(Math.floor(timerMinsVal)).padStart(2,'0')+':00';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;700;800&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></sc${''}ript>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{background:#f7f6f2;min-height:100vh;font-family:'Nunito',sans-serif;color:#1a1a24;}
.act-header{padding:10px 16px 8px;display:flex;align-items:center;justify-content:space-between;gap:12px;background:#fff;border-bottom:1px solid rgba(0,0,0,0.09);}
.act-title{font-family:'Fredoka One',cursive;font-size:clamp(16px,2.5vw,26px);color:#0a0a0f;letter-spacing:0.3px;}
.top-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.timer-display{font-family:'Fredoka One',cursive;font-size:18px;color:#0a0a0f;letter-spacing:1px;min-width:80px;text-align:center;background:rgba(0,0,0,0.05);border-radius:8px;padding:3px 10px;}
.timer-display.overtime{color:#e53935;background:rgba(229,57,53,0.08);animation:tpulse 1s infinite;}
@keyframes tpulse{0%,100%{opacity:1}50%{opacity:0.6}}
.hint-bar{display:flex;gap:6px;flex-wrap:wrap;}
.hint-btn{background:rgba(255,214,10,0.1);border:1px solid rgba(255,214,10,0.35);color:#9a7200;border-radius:8px;padding:4px 12px;font-family:'Nunito',sans-serif;font-size:12px;font-weight:700;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:5px;}
.hint-btn:hover{background:rgba(255,214,10,0.18);}
.hint-btn.used{background:rgba(0,0,0,0.03);border-color:rgba(0,0,0,0.1);color:#bbb;}
.used-tag{font-size:9px;background:rgba(0,0,0,0.06);padding:1px 5px;border-radius:3px;color:#aaa;}
.hint-modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:100;align-items:center;justify-content:center;}
.hint-modal.active{display:flex;}
.hint-box{background:#fff;border:1px solid rgba(0,0,0,0.1);border-radius:16px;padding:28px;max-width:400px;text-align:center;margin:16px;box-shadow:0 12px 40px rgba(0,0,0,0.12);}
.hint-box h3{font-family:'Fredoka One',cursive;color:#0a0a0f;margin-bottom:10px;font-size:22px;}
.hint-box p{font-size:15px;color:#444;line-height:1.65;margin-bottom:20px;}
.hint-close{background:#0a0a0f;color:#b8e030;border:none;border-radius:8px;padding:9px 28px;font-family:'Nunito',sans-serif;font-weight:800;font-size:13px;cursor:pointer;}
.layout{display:grid;grid-template-columns:310px 6px 1fr;height:calc(100vh - 57px);overflow:hidden;}
.resize-handle{cursor:col-resize;display:flex;align-items:center;justify-content:center;background:transparent;z-index:10;touch-action:none;}
.resize-handle::after{content:'';width:4px;height:36px;background:rgba(0,0,0,0.12);border-radius:3px;transition:background .15s;}
.resize-handle:hover::after,.resize-handle:active::after{background:rgba(0,0,0,0.3);}
.prob-panel{background:#fff;border-right:1px solid rgba(0,0,0,0.09);overflow-y:auto;padding:10px 12px 60px;}
.prob-panel::-webkit-scrollbar{width:4px;}
.prob-panel::-webkit-scrollbar-track{background:#f0efeb;}
.prob-panel::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.15);border-radius:99px;}
.prob-col-hidden{display:none;}
.card{background:#f7f6f2;border:1.5px solid rgba(0,0,0,0.09);border-radius:10px;padding:8px 10px;display:flex;flex-wrap:wrap;align-items:center;gap:4px 7px;transition:all .2s;margin-bottom:5px;}
.card:hover{border-color:rgba(0,0,0,0.18);background:#fff;}
.card.correct{background:rgba(67,160,71,0.08);border-color:rgba(67,160,71,0.4);}
.card.wrong{animation:shake .35s ease;background:rgba(229,57,53,0.08);border-color:rgba(229,57,53,0.5);}
@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
.num{font-size:9px;font-weight:800;color:#ccc;min-width:16px;flex-shrink:0;}
.card.correct .num{color:#81c784;}
.eq{font-size:13px;font-weight:700;flex:1 1 calc(100% - 26px);white-space:normal;color:#1a1a24;line-height:1.4;}
.card.correct .eq{color:#2e7d32;}
.ans{width:46px;background:#fff;border:1.5px solid rgba(0,0,0,0.15);border-radius:6px;padding:4px;font-size:13px;font-weight:800;font-family:'Nunito',sans-serif;color:#1a1a24;text-align:center;outline:none;flex-shrink:0;-moz-appearance:textfield;appearance:textfield;}
.ans::-webkit-outer-spin-button,.ans::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
.ans:focus{border-color:#7aaa00;background:#fff;}
.card.correct .ans{background:rgba(67,160,71,0.1);border-color:#43a047;color:#2e7d32;}
.go{font-size:10px;font-family:'Nunito',sans-serif;font-weight:800;padding:5px 10px;border:1.5px solid rgba(0,0,0,0.12);border-radius:6px;background:transparent;color:#888;cursor:pointer;flex-shrink:0;transition:all .15s;}
.go:hover{background:#0a0a0f;color:#b8e030;border-color:#0a0a0f;}
.card.correct .go{display:none;}
.tick{display:none;color:#43a047;font-size:15px;font-weight:900;flex-shrink:0;}
.card.correct .tick{display:block;}
.frac{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;margin:0 2px;line-height:1.1;font-size:0.85em;}
.frac .fn{border-bottom:1px solid currentColor;padding:0 2px;text-align:center;}
.frac .fd{padding:0 2px;text-align:center;}
.ans-display{font-size:13px;font-weight:800;color:#2e7d32;}
.img-panel{display:flex;flex-direction:column;padding:8px 10px;gap:8px;background:#f7f6f2;overflow:hidden;}
.canvas-wrap{flex:1;display:flex;align-items:center;justify-content:center;min-height:0;overflow:hidden;}
.canvas-outer{position:relative;border-radius:14px;overflow:hidden;box-shadow:0 6px 28px rgba(0,0,0,0.14);width:100%;height:100%;}
#rc{display:block;width:100%;height:100%;object-fit:contain;}
.prog-row{display:flex;flex-direction:column;gap:4px;flex-shrink:0;}
.prog-top{display:flex;justify-content:space-between;align-items:center;}
.prog-text{font-size:11px;color:#888;font-weight:600;}
.prog-pct{font-size:14px;font-weight:800;color:#7aaa00;}
.prog-track{background:rgba(0,0,0,0.08);border-radius:99px;height:7px;overflow:hidden;}
.prog-fill{height:100%;background:linear-gradient(90deg,#b8e030,#7aaa00);border-radius:99px;width:0%;transition:width .5s ease;}
.btm-row{display:flex;justify-content:space-between;align-items:center;flex-shrink:0;}
.brand-strip{display:flex;align-items:center;gap:7px;}
.brand-circle{width:26px;height:26px;background:#0a0a0f;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.brand-text-inner{color:#b8e030;font-size:4.5px;font-weight:800;line-height:1.3;text-align:center;display:block;}
.brand-name{font-size:11px;color:#bbb;font-style:italic;font-family:'Nunito',sans-serif;}
.reset-btn{font-family:'Nunito',sans-serif;font-size:11px;padding:3px 10px;border:1px solid rgba(0,0,0,0.1);border-radius:5px;background:transparent;color:#aaa;cursor:pointer;transition:all .15s;}
.reset-btn:hover{color:#555;border-color:#555;}
.dl-btn{font-family:'Nunito',sans-serif;font-size:12px;padding:5px 14px;border:none;border-radius:8px;background:#b8e030;color:#0a0a0f;font-weight:800;cursor:pointer;transition:all .15s;display:none;}
.dl-btn:hover{background:#a0c420;}
.dl-btn.vis{display:inline-block;}
.saved-badge{font-size:10px;color:#7aaa00;display:none;align-items:center;gap:3px;font-weight:700;}
.saved-badge.vis{display:flex;}
.calc-fab{position:fixed;bottom:16px;left:16px;width:40px;height:40px;border-radius:10px;background:#0a0a0f;color:#b8e030;border:none;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.15);z-index:500;display:flex;align-items:center;justify-content:center;transition:transform .15s;}
.calc-fab:hover{transform:scale(1.08);}
.calc-modal{display:none;position:fixed;bottom:66px;left:16px;z-index:501;background:#fff;border:1px solid rgba(0,0,0,0.1);border-radius:18px;padding:14px;box-shadow:0 12px 40px rgba(0,0,0,0.15);width:224px;}
.calc-modal.open{display:block;}
.calc-screen{background:#0a0a0f;border-radius:10px;padding:10px 14px;text-align:right;margin-bottom:10px;min-height:52px;}
.calc-expr{font-size:11px;color:rgba(255,255,255,0.3);min-height:16px;word-break:break-all;font-family:'Nunito',sans-serif;}
.calc-val{font-size:26px;font-weight:800;color:#fff;font-family:'Nunito',sans-serif;word-break:break-all;line-height:1.1;}
.calc-btns{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;}
.cb{padding:11px 0;border-radius:9px;border:none;font-size:14px;font-weight:700;font-family:'Nunito',sans-serif;cursor:pointer;transition:opacity .1s,transform .1s;}
.cb:active{opacity:0.7;transform:scale(0.95);}
.cb.num{background:#f0efeb;color:#1a1a24;}
.cb.num:hover{background:#e5e4e0;}
.cb.op{background:rgba(122,170,0,0.1);color:#7aaa00;}
.cb.op:hover{background:rgba(122,170,0,0.2);}
.cb.eq{background:#0a0a0f;color:#b8e030;grid-column:span 2;}
.cb.clr{background:rgba(255,92,58,0.1);color:#ff5c3a;}
.cb.zero{grid-column:span 2;}
@media(max-width:700px){.layout{grid-template-columns:1fr!important;height:auto;overflow:visible;}body{overflow:auto;}.prob-panel{max-height:45vh;border-right:none;border-bottom:1px solid rgba(0,0,0,0.09);}.img-panel{min-height:50vw;}.resize-handle{display:none;}}
</style>
</head>
<body>
<div class="act-header">
  <div class="act-title">${title}</div>
  ${hasTimer||hasHints?`<div class="top-bar">${hasTimer?`<div class="timer-display" id="td">⏱ ${timerStart}</div>`:''}${hasHints?`<div class="hint-bar">${hintList.map((h,i)=>`<button class="hint-btn" id="hb${i}" onclick="openHint(${i})">💡 Hint ${i+1}</button>`).join('')}</div>`:''}</div>`:''}
</div>
${hasHints?`<div class="hint-modal" id="hm"><div class="hint-box"><h3 id="hm-title">💡 Hint</h3><p id="hmt"></p><button class="hint-close" onclick="closeHint()">Got it!</button></div></div>`:''}
<div class="layout" id="layout">
  <div class="prob-panel" id="lc">
  </div>
  <div class="resize-handle" id="rsh"></div>
  <div class="img-panel">
    <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;padding:0 2px;">
      <img src="https://therealsumshady.com/avatar.png" alt="" style="width:38px;height:38px;border-radius:50%;object-fit:cover;object-position:center top;border:2px solid rgba(0,0,0,0.08);flex-shrink:0;">
      <div style="font-family:'Fredoka One',cursive;font-size:13px;color:#888;line-height:1.2;">by The Real<br>Sum Shady</div>
    </div>
    <div class="canvas-wrap">
      <div class="canvas-outer"><canvas id="rc" width="${IW}" height="${IH}"></canvas></div>
    </div>
    <div class="prog-row">
      <div class="prog-top"><span class="prog-text" id="pt">0 of ${N} solved</span><span class="prog-pct" id="pp">0%</span></div>
      <div class="prog-track"><div class="prog-fill" id="pf"></div></div>
    </div>
    <div class="btm-row">
      <div class="brand-strip">
        <div class="brand-circle"><span class="brand-text-inner">THE<br>REAL<br>SUM<br>SHADY</span></div>
        <span class="brand-name">Reveal Arts</span>
      </div>
      <div class="saved-badge" id="sb2">✓ Saved</div>
      <button class="dl-btn" id="dl-btn" onclick="doDownload()">Download My Work</button>
    </div>
  </div>
  <div class="prob-col-hidden" id="rc2"></div>
</div>
<div id="dl-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.35);z-index:10000;align-items:center;justify-content:center;padding:20px;">
  <div style="background:#fff;border-radius:20px;padding:36px 40px;text-align:center;max-width:400px;width:90%;position:relative;animation:dlpop .4s cubic-bezier(.34,1.56,.64,1);">
    <button onclick="document.getElementById('dl-overlay').style.display='none'" style="position:absolute;top:14px;right:14px;background:none;border:none;font-size:24px;color:#888;cursor:pointer;line-height:1;">&times;</button>
    <h2 style="font-family:Fredoka One,cursive;font-size:22px;color:#0a0a0f;margin-bottom:6px;">Download My Work</h2>
    <p style="font-size:13px;color:#888;margin-bottom:14px;">Great job finishing this activity!</p>
    <div id="dl-stat-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;text-align:left;"></div>
    <div style="text-align:left;margin-bottom:14px;">
      <label style="display:block;font-size:11px;color:#888;margin-bottom:4px;font-weight:700;">Enter your name</label>
      <input id="dl-name" type="text" placeholder="First and Last Name" autocomplete="off" style="width:100%;padding:10px 14px;border:1.5px solid rgba(0,0,0,0.09);border-radius:10px;font-size:14px;font-family:Nunito,sans-serif;outline:none;">
    </div>
    <button id="dl-go" onclick="executeDownload()" disabled style="width:100%;padding:12px;border:none;border-radius:12px;background:#0a0a0f;color:#b8e030;font-family:Fredoka One,cursive;font-size:14px;cursor:pointer;opacity:0.4;">Download</button>
  </div>
</div>
<style>@keyframes dlpop{from{transform:scale(.75);opacity:0}to{transform:scale(1);opacity:1}}</style>
<script>
const PROBS=${JSON.stringify(problems.map(p=>({eq:p.eq,ans:p.ans,ansDisplay:p.ansDisplay||String(p.ans),isAlgebra:!!p.isAlgebra})))};
const ANCHORS=${JSON.stringify(anchors)},TOTAL=${N};
const HINTS=${JSON.stringify(hintList)};
const TIMER_MINS=${timerMinsVal};
const SAVE_KEY='ra3_${timerKey||"0"}';
const GN=${GN_GRID},IW=${IW},IH=${IH},TW=IW/GN,TH=IH/GN;
const hintUsed=new Array(HINTS.length).fill(false);

function buildAssign(){
  const a=Array.from({length:GN},()=>new Array(GN).fill(-1));
  const rem=new Set();for(let r=0;r<GN;r++)for(let c=0;c<GN;c++)rem.add(r*GN+c);
  const pp=Math.floor((GN*GN)/ANCHORS.length);
  for(let z=0;z<ANCHORS.length;z++){
    const[ar,ac]=ANCHORS[z];
    const s=[...rem].map(i=>{const r=Math.floor(i/GN),c=i%GN;return{i,r,c,d:Math.sqrt((r-ar)**2+(c-ac)**2)};}).sort((a,b)=>a.d-b.d);
    const take=z===ANCHORS.length-1?rem.size:pp;
    let n=0;for(const{i,r,c}of s){if(n>=take)break;a[r][c]=z;rem.delete(i);n++;}
  }return a;
}
const assign=buildAssign();
const rev=Array.from({length:GN},()=>new Array(GN).fill(false));
const solved=new Set();
const wrongAttempts=new Set();
const canvas=document.getElementById('rc');
const ctx=canvas.getContext('2d');
const img=new Image();
img.src=\`${esc}\`;
img.onload=()=>{loadProgress();drawAll();startTimer();window.addEventListener('resize',drawAll);document.addEventListener('visibilitychange',()=>{if(!document.hidden)drawAll();});document.addEventListener('mousedown',()=>setTimeout(drawAll,50),{passive:true});document.addEventListener('touchend',()=>setTimeout(drawAll,50),{passive:true});};
img.onerror=()=>{loadProgress();drawAll();startTimer();window.addEventListener('resize',drawAll);};

// TIMER
function startTimer(){
  if(TIMER_MINS<=0)return;
  const td=document.getElementById('td');
  const total=TIMER_MINS*60;
  let startTs;
  try{const s=localStorage.getItem(SAVE_KEY+'_ts');startTs=s?parseInt(s):Date.now();localStorage.setItem(SAVE_KEY+'_ts',startTs);}
  catch(e){startTs=Date.now();}
  function tick(){
    const elapsed=Math.floor((Date.now()-startTs)/1000);
    const rem=total-elapsed;
    if(rem>=0){const m=Math.floor(rem/60),s=rem%60;td.textContent='⏱ '+(m<10?'0'+m:m)+':'+(s<10?'0'+s:s);td.classList.remove('overtime');}
    else{const over=Math.abs(rem);const m=Math.floor(over/60),s=over%60;td.textContent='⚠ +'+(m<10?'0'+m:m)+':'+(s<10?'0'+s:s);td.classList.add('overtime');}
  }
  tick();setInterval(tick,1000);
}

// HINTS — reusable, grayed out after first use but still clickable
function openHint(i){
  document.getElementById('hmt').textContent=HINTS[i];
  document.getElementById('hm-title').textContent='💡 Hint '+(i+1);
  document.getElementById('hm').classList.add('active');
  if(!hintUsed[i]){
    hintUsed[i]=true;
    const btn=document.getElementById('hb'+i);
    if(btn){btn.classList.add('used');const tag=btn.querySelector('.used-tag');if(tag)tag.textContent='used';}
  }
}
function closeHint(){document.getElementById('hm').classList.remove('active');}
// add used-tag spans to hint buttons
document.querySelectorAll('.hint-btn').forEach(btn=>{const span=document.createElement('span');span.className='used-tag';span.style.display='none';btn.appendChild(span);});
// override: show used-tag when used
function openHint(i){
  document.getElementById('hmt').textContent=HINTS[i];
  document.getElementById('hm-title').textContent='💡 Hint '+(i+1);
  document.getElementById('hm').classList.add('active');
  if(!hintUsed[i]){
    hintUsed[i]=true;
    const btn=document.getElementById('hb'+i);
    if(btn){
      btn.classList.add('used');
      const tag=btn.querySelector('.used-tag');
      if(tag){tag.textContent='used';tag.style.display='inline';}
    }
  }
}

// SAVE/LOAD
function saveProgress(){
  try{localStorage.setItem(SAVE_KEY,JSON.stringify({solved:[...solved],rev:rev.map(r=>[...r])}));const b=document.getElementById('sb2');b.classList.add('vis');setTimeout(()=>b.classList.remove('vis'),2000);}catch(e){}
}
function loadProgress(){
  try{
    const raw=localStorage.getItem(SAVE_KEY);if(!raw)return;
    const d=JSON.parse(raw);
    if(d.solved)d.solved.forEach(i=>{solved.add(i);const card=document.getElementById('card-'+i);if(card){card.classList.add('correct');const inp=card.querySelector('input');if(inp){inp.value=PROBS[i].ansDisplay||String(PROBS[i].ans);}}});
    if(d.rev)d.rev.forEach((row,r)=>row.forEach((v,c)=>{rev[r][c]=v;}));
    updateProg();
  }catch(e){}
}

function drawCover(){
  for(let r=0;r<GN;r++)for(let c=0;c<GN;c++){
    if(!rev[r][c]){ctx.fillStyle='#232323';ctx.fillRect(c*TW,r*TH,TW,TH);ctx.strokeStyle='rgba(255,255,255,0.04)';ctx.lineWidth=0.5;ctx.strokeRect(c*TW,r*TH,TW,TH);}
  }
  // watermark — elegant text shadow, always readable
  ctx.save();
  ctx.font='700 '+Math.floor(IW*0.045)+'px Nunito,sans-serif';
  ctx.shadowColor='rgba(0,0,0,0.75)';
  ctx.shadowBlur=10;
  ctx.shadowOffsetX=1;
  ctx.shadowOffsetY=1;
  ctx.fillStyle='rgba(255,255,255,0.82)';
  ctx.textAlign='right';ctx.textBaseline='bottom';
  ctx.fillText('Reveal Arts',IW-10,IH-10);
  ctx.restore();
}
function drawAll(){ctx.clearRect(0,0,IW,IH);if(img.complete&&img.naturalWidth>0)ctx.drawImage(img,0,0,IW,IH);drawCover();}
function revealZone(z){
  const tiles=[];for(let r=0;r<GN;r++)for(let c=0;c<GN;c++)if(assign[r][c]===z&&!rev[r][c])tiles.push([r,c]);
  for(let i=tiles.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[tiles[i],tiles[j]]=[tiles[j],tiles[i]];}
  tiles.forEach(([r,c],i)=>setTimeout(()=>{rev[r][c]=true;drawAll();if(i===tiles.length-1)saveProgress();},i*35));
}
function coverZone(z){
  for(let r=0;r<GN;r++)for(let c=0;c<GN;c++){if(assign[r][c]===z)rev[r][c]=false;}
  drawAll();saveProgress();
}

function buildUI(){
  const lc=document.getElementById('lc'),rc=document.getElementById('rc2');
  while(lc.children.length>0)lc.removeChild(lc.lastChild);while(rc.children.length>0)rc.removeChild(rc.lastChild);
  PROBS.forEach((p,i)=>{
    const col=lc;const card=document.createElement('div');card.className='card';card.id='card-'+i;
    const xlbl=p.isAlgebra?'x =':'= ?';
    let eqHtml;
    if(p.eq&&p.eq.startsWith('FRAC:')){
      const parts=p.eq.split(':');const num=parts[1];const rest=parts[2];const denParts=rest.split(' = ');const den=denParts[0];const rhs=denParts[1];
      eqHtml='<span class="frac" style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;margin:0 2px;font-size:1em;"><span class="fn" style="border-bottom:1.5px solid currentColor;padding:0 4px;text-align:center;">'+num+'</span><span class="fd" style="padding:0 4px;text-align:center;">'+den+'</span></span><span style="margin:0 4px;">=</span><span>'+rhs+'</span>';
    }else{eqHtml=p.eq.replace(/(\\d+)\\/(\\d+)/g,'<span class="frac" style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;margin:0 2px;line-height:1.1;font-size:0.85em;"><span style="border-bottom:1.5px solid currentColor;padding:0 4px;text-align:center;">$1</span><span style="padding:0 4px;text-align:center;">$2</span></span>');}
    card.innerHTML='<span class="num">'+(i+1)+'</span><span class="eq">'+eqHtml+'</span><span style="font-size:10px;color:#aaa;white-space:nowrap;flex-shrink:0;padding-left:18px;">'+xlbl+'</span><input class="ans" type="text" id="inp-'+i+'" placeholder=""><button class="go" onclick="chk('+i+')">Go</button><span class="tick">✓</span>';
    const inp=card.querySelector('input');
    inp.addEventListener('keydown',e=>{
      if(e.key==='Enter'||e.key==='Tab'){
        e.preventDefault();
        chk(i);
      }
    });
    // also submit on blur if value entered
    inp.addEventListener('change',()=>{if(inp.value!=='')chk(i);});
    // erase: clearing a correct answer re-covers the image tiles
    inp.addEventListener('input',()=>{
      if(solved.has(i)&&inp.value===''){
        solved.delete(i);
        card.classList.remove('correct');
        coverZone(i);
        updateProg();
      }
    });
    col.appendChild(card);
  });
}

function parseAns(s){s=(s||'').trim();if(s.includes('/')){const p=s.split('/');if(p.length===2){const n=parseFloat(p[0]),d=parseFloat(p[1]);if(!isNaN(n)&&!isNaN(d)&&d!==0)return n/d;}}return parseFloat(s);}
function chk(i){
  const inp=document.getElementById('inp-'+i);
  const card=document.getElementById('card-'+i);
  if(solved.has(i))return;
  const val=parseAns(inp.value);
  if(isNaN(val))return;
  if(Math.abs(val-PROBS[i].ans)<0.001){
    solved.add(i);card.classList.add('correct');card.classList.remove('wrong');
    const ad=PROBS[i].ansDisplay||String(PROBS[i].ans);
    if(ad.includes('/')){inp.style.display='none';const parts=ad.split('/');const sp=document.createElement('span');sp.className='ans-display';sp.innerHTML='<span class="frac"><span class="fn">'+parts[0]+'</span><span class="fd">'+parts[1]+'</span></span>';inp.parentNode.insertBefore(sp,inp);}else{inp.value=ad;}
    revealZone(i);updateProg();
    // auto-focus next unsolved input
    for(let next=i+1;next<PROBS.length;next++){
      if(!solved.has(next)){const ni=document.getElementById('inp-'+next);if(ni){ni.focus();break;}}
    }
  }else{
    card.classList.remove('wrong');void card.offsetWidth;card.classList.add('wrong');
    wrongAttempts.add(i);
    inp.value='';setTimeout(()=>card.classList.remove('wrong'),900);
  }
}

function updateProg(){
  const n=solved.size,pct=Math.round(n/TOTAL*100);
  document.getElementById('pt').textContent=n+' of '+TOTAL+' solved';
  document.getElementById('pp').textContent=pct+'%';
  document.getElementById('pf').style.width=pct+'%';
  if(n===TOTAL&&!document.getElementById('fw-canvas'))launchFireworks();
  var dlb=document.getElementById('dl-btn');if(dlb)dlb.classList.toggle('vis',n===TOTAL);
}

function launchFireworks(){
  const cv=document.createElement('canvas');
  cv.id='fw-canvas';
  cv.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:9999;pointer-events:none;';
  cv.width=window.innerWidth;cv.height=window.innerHeight;
  document.body.appendChild(cv);
  const ctx=cv.getContext('2d');
  const COLORS=['#b8e030','#ff5c3a','#FFD600','#fff','#4fc3f7','#ff6eb4','#a8ff78','#ff9f43'];
  const particles=[];
  let running=true;


    function Particle(x,y,vx,vy,color,life){
    return{x,y,vx,vy,color,life,maxLife:life,size:Math.random()*3+1.5};
  }

  function burst(x,y){
    const count=25+Math.floor(Math.random()*20);
    const color=COLORS[Math.floor(Math.random()*COLORS.length)];
    const color2=COLORS[Math.floor(Math.random()*COLORS.length)];
    for(let i=0;i<count;i++){
      const angle=Math.random()*Math.PI*2;
      const speed=2+Math.random()*5;
      particles.push(Particle(
        x,y,
        Math.cos(angle)*speed,
        Math.sin(angle)*speed-(Math.random()*3),
        i%3===0?color2:color,
        50+Math.floor(Math.random()*40)
      ));
    }
  }

  // Launch bursts at random intervals
  let elapsed=0;
  const launchInterval=setInterval(()=>{
    const x=80+Math.random()*(window.innerWidth-160);
    const y=80+Math.random()*(window.innerHeight*0.7);
    burst(x,y);
  },500);

  // Initial burst from center
  burst(window.innerWidth/2,window.innerHeight*0.35);
  burst(window.innerWidth*0.25,window.innerHeight*0.4);
  burst(window.innerWidth*0.75,window.innerHeight*0.4);

  function animate(){
    if(!running)return;
    ctx.clearRect(0,0,cv.width,cv.height);
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];
      p.x+=p.vx;p.y+=p.vy;p.vy+=0.12;p.vx*=0.99;p.life--;
      const alpha=p.life/p.maxLife;
      ctx.globalAlpha=alpha;
      ctx.fillStyle=p.color;
      ctx.beginPath();ctx.arc(p.x,p.y,p.size*alpha,0,Math.PI*2);ctx.fill();
      if(p.life<=0)particles.splice(i,1);
    }
    ctx.globalAlpha=1;
    requestAnimationFrame(animate);
  }
  animate();

  // Stop after 15 seconds
  setTimeout(()=>{
    running=false;
    clearInterval(launchInterval);
    cv.style.transition='opacity 1s';
    cv.style.opacity='0';
    setTimeout(()=>{if(cv.parentNode)cv.parentNode.removeChild(cv);},1000);
  },15000);
}
function doDownload(){
  var td=document.getElementById('td');
  var timeLabel='';
  if(td&&TIMER_MINS>0){
    var txt=td.textContent;
    if(txt.indexOf('⚠')>-1){timeLabel='Overtime: +'+txt.replace(/[^0-9:]/g,'').trim();}
    else{timeLabel='Time remaining: '+txt.replace(/[^0-9:]/g,'').trim();}
  } else {
    var el=Math.floor((Date.now()-pageStart)/1000);
    var em=Math.floor(el/60),es=el%60;
    timeLabel=(em<10?'0'+em:em)+':'+(es<10?'0'+es:es);
  }
  var wrongCount=wrongAttempts.size;
  var now=new Date();
  var ts=now.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  var sg=document.getElementById('dl-stat-grid');
  sg.innerHTML='<div style="background:#f7f6f2;border-radius:10px;padding:10px 14px;"><div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Time</div><div style="font-family:Fredoka One,cursive;font-size:15px;">'+timeLabel+'</div></div>'
    +'<div style="background:#f7f6f2;border-radius:10px;padding:10px 14px;"><div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Wrong Attempts</div><div style="font-family:Fredoka One,cursive;font-size:15px;">'+wrongCount+'</div></div>'
    +'<div style="background:#f7f6f2;border-radius:10px;padding:10px 14px;"><div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Score</div><div style="font-family:Fredoka One,cursive;font-size:15px;">'+solved.size+'/'+TOTAL+'</div></div>'
    +'<div style="background:#f7f6f2;border-radius:10px;padding:10px 14px;"><div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Completed</div><div style="font-family:Fredoka One,cursive;font-size:15px;">'+ts+'</div></div>';
  document.getElementById('dl-name').value='';
  document.getElementById('dl-go').disabled=true;
  document.getElementById('dl-go').style.opacity='0.4';
  document.getElementById('dl-overlay').style.display='flex';
  document.getElementById('dl-name').oninput=function(){
    var ok=this.value.trim().length>=1;
    document.getElementById('dl-go').disabled=!ok;
    document.getElementById('dl-go').style.opacity=ok?'1':'0.4';
  };
}
function executeDownload(){
  var name=document.getElementById('dl-name').value.trim();if(!name)return;
  document.getElementById('dl-overlay').style.display='none';
  var td=document.getElementById('td');
  var timeLabel='';
  if(td&&TIMER_MINS>0){var txt=td.textContent;if(txt.indexOf('⚠')>-1)timeLabel='Overtime: +'+txt.replace(/[^0-9:]/g,'').trim();else timeLabel='Time remaining: '+txt.replace(/[^0-9:]/g,'').trim();}
  else{var el=Math.floor((Date.now()-pageStart)/1000);var em=Math.floor(el/60),es=el%60;timeLabel=(em<10?'0'+em:em)+':'+(es<10?'0'+es:es);}
  var wrongCount=wrongAttempts.size;
  var sc=solved.size+'/'+TOTAL+' correct'+(wrongCount>0?' ('+wrongCount+' wrong)':'');
  var now=new Date();
  var ts=now.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})+' '+now.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
  if(typeof html2canvas==='undefined'){alert('Download loading, please try again.');return;}
  html2canvas(document.body,{useCORS:true,allowTaint:true,scale:1.5,logging:false}).then(function(cap){
    var out=document.createElement('canvas');
    var bh=56;
    out.width=cap.width;out.height=cap.height+bh;
    var c2=out.getContext('2d');
    c2.drawImage(cap,0,0);
    c2.fillStyle='#0a0a0f';
    c2.fillRect(0,cap.height,out.width,bh);
    c2.fillStyle='#b8e030';
    c2.font='bold 18px Nunito,sans-serif';
    c2.textBaseline='middle';
    c2.textAlign='left';
    c2.fillText(name+' — '+sc,20,cap.height+16);
    c2.fillStyle='rgba(255,255,255,0.6)';
    c2.font='13px Nunito,sans-serif';
    c2.fillText(timeLabel+'  •  '+ts+'  •  Reveal Arts by The Real Sum Shady',20,cap.height+38);
    var a=document.createElement('a');
    var safe=name.replace(/[^a-zA-Z0-9]/g,'-');
    a.download=safe+'-reveal-arts.jpg';
    a.href=out.toDataURL('image/jpeg',0.92);
    a.click();
  });
}
function resetAll(){
  if(!confirm('Reset all progress?'))return;
  solved.clear();for(let r=0;r<GN;r++)for(let c=0;c<GN;c++)rev[r][c]=false;
  try{localStorage.removeItem(SAVE_KEY);localStorage.removeItem(SAVE_KEY+'_ts');}catch(e){}
  buildUI();updateProg();drawAll();
}
buildUI();drawAll();
const pageStart=Date.now();
// Resize handle for problem panel
(function(){
  var h=document.getElementById('rsh'),ly=document.getElementById('layout'),pn=document.getElementById('lc');
  if(!h||!ly||!pn)return;
  var dragging=false,startX=0,startW=0;
  function sd(x){dragging=true;startX=x;startW=pn.offsetWidth;document.body.style.cursor='col-resize';document.body.style.userSelect='none';}
  function dd(x){if(!dragging)return;var nw=Math.max(200,Math.min(600,startW+(x-startX)));ly.style.gridTemplateColumns=nw+'px 6px 1fr';drawAll();}
  function ed(){if(!dragging)return;dragging=false;document.body.style.cursor='';document.body.style.userSelect='';}
  h.addEventListener('mousedown',function(e){sd(e.clientX);e.preventDefault();});
  document.addEventListener('mousemove',function(e){dd(e.clientX);});
  document.addEventListener('mouseup',ed);
  h.addEventListener('touchstart',function(e){sd(e.touches[0].clientX);},{passive:true});
  document.addEventListener('touchmove',function(e){if(dragging){e.preventDefault();dd(e.touches[0].clientX);}},{passive:false});
  document.addEventListener('touchend',ed);
})();
window.addEventListener('message',function(e){
  if(e.data&&e.data.type==='GET_PROBS'){
    window.parent.postMessage({type:'PROBS_DATA',probs:PROBS,helpMax:0},'*');
  }
});
var _origReveal=revealZone;
revealZone=function(z){
  _origReveal(z);
  window.parent.postMessage({type:'SOLVED_UPDATE',solved:[...solved]},'*');
};
</sc${''}ript>
${hasCalc ? `
<button class="calc-fab" id="calc-fab" title="Calculator" style="cursor:grab;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="10" y2="18"/><line x1="14" y1="18" x2="16" y2="18"/></svg></button>
<div class="calc-modal" id="calc-modal">
  <div class="calc-screen">
    <div class="calc-expr" id="calc-expr"></div>
    <div class="calc-val" id="calc-val">0</div>
  </div>
  <div class="calc-btns">
    <button class="cb clr" onclick="cClr()">C</button>
    <button class="cb op" onclick="cOp('±')">±</button>
    <button class="cb op" onclick="cOp('%')">%</button>
    <button class="cb op" onclick="cOp('÷')">÷</button>
    <button class="cb num" onclick="cNum('7')">7</button>
    <button class="cb num" onclick="cNum('8')">8</button>
    <button class="cb num" onclick="cNum('9')">9</button>
    <button class="cb op" onclick="cOp('×')">×</button>
    <button class="cb num" onclick="cNum('4')">4</button>
    <button class="cb num" onclick="cNum('5')">5</button>
    <button class="cb num" onclick="cNum('6')">6</button>
    <button class="cb op" onclick="cOp('−')">−</button>
    <button class="cb num" onclick="cNum('1')">1</button>
    <button class="cb num" onclick="cNum('2')">2</button>
    <button class="cb num" onclick="cNum('3')">3</button>
    <button class="cb op" onclick="cOp('+')">+</button>
    <button class="cb num zero" onclick="cNum('0')">0</button>
    <button class="cb num" onclick="cNum('.')">.</button>
    <button class="cb eq" onclick="cEq()">=</button>
    <button class="cb op" onclick="cSqrt()" title="Square root">√</button>
    <button class="cb op" onclick="cSq()" title="Square">x²</button>
    <button class="cb op" onclick="cInv()" title="Inverse">1/x</button>
    <button class="cb clr" onclick="cBack()">⌫</button>
  </div>
</div>
<script>
// CALCULATOR
let cCurr='0',cPrev='',cOper=null,cFresh=false;
function toggleCalc(){document.getElementById('calc-modal').classList.toggle('open');}
function cRender(){document.getElementById('calc-val').textContent=cCurr;document.getElementById('calc-expr').textContent=cOper?cPrev+' '+cOper:'';}
function cClr(){cCurr='0';cPrev='';cOper=null;cFresh=false;cRender();}
function cBack(){if(cFresh)return;cCurr=cCurr.length>1?cCurr.slice(0,-1):'0';cRender();}
function cNum(n){
  if(cFresh){cCurr=n==='.'?'0.':n;cFresh=false;}
  else{if(n==='.'&&cCurr.includes('.'))return;cCurr=cCurr==='0'&&n!=='.'?n:cCurr+n;}
  cRender();
}
function cOp(op){
  if(op==='±'){cCurr=String(-parseFloat(cCurr)||0);cRender();return;}
  if(op==='%'){cCurr=String(parseFloat(cCurr)/100);cRender();return;}
  if(cOper&&!cFresh)cEq();
  cPrev=cCurr;cOper=op;cFresh=true;cRender();
}
function cSqrt(){const v=parseFloat(cCurr);cCurr=v>=0?String(Math.round(Math.sqrt(v)*1e10)/1e10):'Error';cOper=null;cPrev='';cFresh=true;cRender();}
function cSq(){cCurr=String(Math.round(parseFloat(cCurr)**2*1e10)/1e10);cFresh=true;cRender();}
function cInv(){const v=parseFloat(cCurr);cCurr=v!==0?String(Math.round((1/v)*1e10)/1e10):'Error';cFresh=true;cRender();}
function cEq(){
  if(!cOper||!cPrev)return;
  const a=parseFloat(cPrev),b=parseFloat(cCurr);
  let r;
  if(cOper==='÷')r=b!==0?a/b:'Error';
  else if(cOper==='×')r=a*b;
  else if(cOper==='−')r=a-b;
  else r=a+b;
  cCurr=typeof r==='number'?String(Math.round(r*1e10)/1e10):r;
  cOper=null;cPrev='';cFresh=true;cRender();
}
// Close calc when clicking outside
document.addEventListener('click',e=>{
  const modal=document.getElementById('calc-modal');
  const fab=document.getElementById('calc-fab');
  if(modal&&fab&&!modal.contains(e.target)&&!fab.contains(e.target)){modal.classList.remove('open');}
});
// Draggable calculator — drag to move, tap to open
(function(){
  const fab=document.getElementById('calc-fab');
  if(!fab)return;
  let dragging=false,moved=false,startX=0,startY=0,origLeft=0,origTop=0;
  function getPos(){const r=fab.getBoundingClientRect();return{left:r.left,top:r.top};}
  function startDrag(cx,cy){
    dragging=true;moved=false;
    const p=getPos();origLeft=p.left;origTop=p.top;startX=cx;startY=cy;
    fab.style.bottom='auto';fab.style.right='auto';
    fab.style.left=origLeft+'px';fab.style.top=origTop+'px';
  }
  function doDrag(cx,cy){
    if(!dragging)return;
    const dx=cx-startX,dy=cy-startY;
    if(Math.abs(dx)>4||Math.abs(dy)>4)moved=true;
    const nl=Math.max(0,Math.min(window.innerWidth-fab.offsetWidth,origLeft+dx));
    const nt=Math.max(0,Math.min(window.innerHeight-fab.offsetHeight,origTop+dy));
    fab.style.left=nl+'px';fab.style.top=nt+'px';
    const modal=document.getElementById('calc-modal');
    if(modal&&modal.classList.contains('open')){
      modal.style.left=nl+'px';modal.style.bottom='auto';modal.style.right='auto';
      modal.style.top=Math.max(0,nt-modal.offsetHeight-8)+'px';
    }
  }
  function endDrag(){if(!dragging)return;dragging=false;if(!moved)toggleCalc();}
  fab.addEventListener('mousedown',e=>{startDrag(e.clientX,e.clientY);e.preventDefault();});
  document.addEventListener('mousemove',e=>{doDrag(e.clientX,e.clientY);});
  document.addEventListener('mouseup',()=>endDrag());
  fab.addEventListener('touchstart',e=>{const t=e.touches[0];startDrag(t.clientX,t.clientY);},{passive:true});
  document.addEventListener('touchmove',e=>{if(!dragging)return;e.preventDefault();const t=e.touches[0];doDrag(t.clientX,t.clientY);},{passive:false});
  document.addEventListener('touchend',()=>endDrag());
  fab.onclick=null;
})();
<\/script>
` : ''}
</body>
</html>`;
}
