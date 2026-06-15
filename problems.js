// ── CUSTOM PROBLEMS ───────────────────────────────────────────────────────────
var customProbs = [];
var curCustomSubCat = 'ops';


// ── FRACTION HELPER ───────────────────────────────────────────────────────────
function fmtFrac(s){
  if(typeof s==='string'&&s.includes('/')&&!s.startsWith('FRAC:')){
    const p=s.split('/');
    if(p.length===2&&p[0].trim()&&p[1].trim())
      return '<span style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;margin:0 2px;line-height:1.1;font-size:0.88em;"><span style="border-bottom:1.5px solid currentColor;padding:0 3px;text-align:center;">'+p[0].trim()+'</span><span style="padding:0 3px;text-align:center;">'+p[1].trim()+'</span></span>';
  }
  return String(s===undefined||s===null?'':s);
}

// ── CORE HELPERS ─────────────────────────────────────────────────────────────
function rnd(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
function rneg(a,b){const v=rnd(a,b);return Math.random()<0.45?-v:v;}

// ── ADDITION / SUBTRACTION BANK ──────────────────────────────────────────────
function genBank(op,lv){
  const probs=[],seen=new Set();
  const ranges={1:[1,9],2:[10,99],3:[100,999],4:[1,9],5:[10,99],6:[100,999]};
  const[mn,mx]=ranges[lv];const neg=lv>=4;let att=0;
  while(probs.length<50&&att<3000){
    att++;let a,b,ans,eq;
    if(op==='addition'){
      a=neg?rneg(mn,mx):rnd(mn,mx);b=neg?rneg(mn,mx):rnd(mn,mx);
      ans=a+b;eq=`${a} + ${b}`;
    }else if(op==='subtraction'){
      a=neg?rneg(mn,mx):rnd(mn,mx);b=neg?rneg(mn,mx):rnd(mn,mx);
      if(!neg&&a<b){const t=a;a=b;b=t;}
      ans=a-b;eq=`${a} − ${b}`;
    }
    if(eq&&!seen.has(eq)){seen.add(eq);probs.push({eq,ans});}
  }
  return probs;
}

// ── MULTIPLICATION GENERATORS ────────────────────────────────────────────────
function genMulTables(tables){
  const probs=[],seen=new Set();
  tables.forEach(t=>{
    for(let i=1;i<=12;i++){
      const eq1=t+' \u00d7 '+i,eq2=i+' \u00d7 '+t;
      if(!seen.has(eq1)){seen.add(eq1);probs.push({eq:eq1,ans:t*i});}
      if(!seen.has(eq2)){seen.add(eq2);probs.push({eq:eq2,ans:t*i});}
    }
  });
  return probs.sort(()=>Math.random()-0.5);
}
function genMulMultiDigit(lv){
  const probs=[],seen=new Set();let att=0;
  while(probs.length<50&&att<3000){
    att++;let a,b;
    if(lv===1){a=rnd(11,99);b=rnd(2,9);}
    else if(lv===2){a=rnd(11,99);b=rnd(11,99);}
    else{a=rnd(100,999);b=rnd(11,99);}
    const eq=a+' \u00d7 '+b;
    if(!seen.has(eq)){seen.add(eq);probs.push({eq,ans:a*b});}
  }
  return probs;
}

// ── DIVISION GENERATORS ──────────────────────────────────────────────────────
function genDivFamilies(tables){
  const probs=[],seen=new Set();
  tables.forEach(d=>{
    for(let q=1;q<=12;q++){
      const dd=d*q,eq=dd+' \u00f7 '+d;
      if(!seen.has(eq)){seen.add(eq);probs.push({eq,ans:q});}
    }
  });
  return probs.sort(()=>Math.random()-0.5);
}
function genDivDecimals(){
  const probs=[],seen=new Set();let att=0;
  const divs=[2,4,5,8,10,20];
  while(probs.length<50&&att<3000){
    att++;
    const d=divs[rnd(0,divs.length-1)];
    const dd=rnd(d+1,d<=5?99:d<=10?199:499);
    if(dd%d===0)continue;
    const ans=dd/d,r2=Math.round(ans*100)/100;
    if(Math.abs(ans-r2)>0.0001)continue;
    const eq=dd+' \u00f7 '+d;
    if(!seen.has(eq)){seen.add(eq);probs.push({eq,ans:r2,ansDisplay:String(r2)});}
  }
  return probs;
}
function genDivLong(){
  const probs=[],seen=new Set();let att=0;
  while(probs.length<50&&att<3000){
    att++;const form=rnd(0,2);let dv,qt;
    if(form===0){dv=rnd(2,9);qt=rnd(10,99);}
    else if(form===1){dv=rnd(11,25);qt=rnd(5,50);}
    else{dv=rnd(3,9);qt=rnd(100,500);}
    const dd=dv*qt,eq=dd+' \u00f7 '+dv;
    if(!seen.has(eq)){seen.add(eq);probs.push({eq,ans:qt});}
  }
  return probs;
}

// ── OPERATIONS BANK ROUTER ───────────────────────────────────────────────────
function genOpsBank(){
  if(curOp==='multiplication')return mulMode==='tables'?genMulTables(mulTables):genMulMultiDigit(mulDigitLv);
  if(curOp==='division')return divMode==='families'?genDivFamilies(divTables):divMode==='decimals'?genDivDecimals():genDivLong();
  return genBank(curOp,curLvl);
}

// ── RENDER / SELECT ──────────────────────────────────────────────────────────
function renderProblems(){allProbs=genOpsBank();rand20();}

function renderProbList(pool,selEqs=[]){
  const c=document.getElementById('pp');c.innerHTML='';
  pool.forEach(p=>{
    const sel=selEqs.includes(p.eq);
    const row=document.createElement('div');row.className='prob-row'+(sel?' selected':'');
    const badge=p.isCustom?'<span style="font-size:9px;background:rgba(122,170,0,0.15);color:#5a8000;border-radius:3px;padding:1px 5px;margin-right:5px;font-weight:700;">custom</span>':'';
    row.innerHTML='<div class="prob-chk">'+(sel?'\u2713':'')+'</div><div class="prob-eq">'+badge+(p.eq&&p.eq.startsWith('FRAC:')?p.eq.replace(/FRAC:(.*?):(\d+)/,'$1 \u00f7 $2'):p.eq)+' '+(p.isAlgebra?', x = ?':' = ?')+'</div><div class="prob-ans">= '+fmtFrac(p.ansDisplay||String(p.ans))+'</div>';
    row.onclick=function(){toggleProb(p,row);};c.appendChild(row);
  });
  updSC();
}
function toggleProb(p,row){
  if(curMode==='random')return;
  const idx=selProbs.findIndex(x=>x.eq===p.eq);
  if(idx>=0){selProbs.splice(idx,1);row.classList.remove('selected');row.querySelector('.prob-chk').textContent='';}
  else{selProbs.push(p);row.classList.add('selected');row.querySelector('.prob-chk').textContent='\u2713';}
  updSC();
}
function setNumProbs(n,btn){
  numProbs=n;
  document.querySelectorAll('.prob-count-btn').forEach(function(b){b.classList.remove('active');});
  if(btn)btn.classList.add('active');
  document.getElementById('sc-total')&&(document.getElementById('sc-total').textContent=n);
  document.getElementById('random-count')&&(document.getElementById('random-count').textContent=n);
  rand20();
}
function rand20(){
  if(curCat==='custom'){
    var kept=selProbs.filter(function(p){return p.isCustom;});
    renderProbList([].concat(kept,allProbs),selProbs.map(function(p){return p.eq;}));
    updSC();
    return;
  }
  var kept=selProbs.filter(function(p){return p.isCustom;});
  var fill=Math.max(0,numProbs-kept.length);
  var sh=[].concat(allProbs).sort(function(){return Math.random()-0.5;});
  selProbs=[].concat(kept,sh.slice(0,fill));
  var pool=curMode==='random'?selProbs:[].concat(kept,allProbs);
  renderProbList(pool,selProbs.map(function(p){return p.eq;}));
}
function updSC(){document.getElementById('sc').textContent=selProbs.length;document.getElementById('sc-total')&&(document.getElementById('sc-total').textContent=numProbs);}

// ── OPERATION / LEVEL SWITCHING ──────────────────────────────────────────────
function _showOpSubSections(){
  var asl=document.getElementById('addsub-levels');
  var mc=document.getElementById('mul-config');
  var dc=document.getElementById('div-config');
  if(asl)asl.style.display=(curOp==='addition'||curOp==='subtraction')?'':'none';
  if(mc)mc.style.display=curOp==='multiplication'?'':'none';
  if(dc)dc.style.display=curOp==='division'?'':'none';
}
function setOp(op,btn){
  curOp=op;
  document.querySelectorAll('#op-tabs .tab').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  _showOpSubSections();
  if(op==='multiplication')buildMulTableGrid();
  if(op==='division')buildDivTableGrid();
  renderProblems();
}
function setMode(m,btn){
  curMode=m;
  document.querySelectorAll('.mode-btn').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  if(m==='random')rand20();
  else{
    var kept=selProbs.filter(function(p){return p.isCustom;});
    renderProbList([].concat(kept,allProbs),selProbs.map(function(p){return p.eq;}));
  }
}
function buildLvTabs(){
  var c=document.getElementById('lv-tabs');c.innerHTML='';
  [{n:1,l:'L1',s:'Single'},{n:2,l:'L2',s:'Double'},{n:3,l:'L3',s:'Triple'},{n:4,l:'L4',s:'Single+neg',neg:true},{n:5,l:'L5',s:'Double+neg',neg:true},{n:6,l:'L6',s:'Triple+neg',neg:true}].forEach(function(lv){
    var b=document.createElement('button');
    b.className='tab'+(lv.neg?' neg':'')+(lv.n===curLvl?' active':'');
    b.innerHTML=lv.l+'<br><span style="font-size:9px;opacity:0.6;">'+lv.s+'</span>';
    b.onclick=function(){curLvl=lv.n;document.querySelectorAll('#lv-tabs .tab').forEach(function(x){x.classList.remove('active');});b.classList.add('active');document.getElementById('neg-note').style.display=lv.n>=4?'block':'none';renderProblems();};
    c.appendChild(b);
  });
}

// ── MULTIPLICATION UI ────────────────────────────────────────────────────────
function buildMulTableGrid(){
  var grid=document.getElementById('mul-table-grid');
  if(!grid)return;grid.innerHTML='';
  for(var n=1;n<=12;n++){
    (function(n){
      var btn=document.createElement('button');
      btn.className='tab'+(mulTables.includes(n)?' active':'');
      btn.textContent=n;
      btn.style.cssText='padding:8px 4px;font-size:14px;font-weight:700;min-width:0;';
      btn.onclick=function(){
        var idx=mulTables.indexOf(n);
        if(idx>=0){if(mulTables.length<=1)return;mulTables.splice(idx,1);btn.classList.remove('active');}
        else{mulTables.push(n);btn.classList.add('active');}
        renderProblems();
      };
      grid.appendChild(btn);
    })(n);
  }
}
function buildMulDigitTabs(){
  var c=document.getElementById('mul-digit-tabs');
  if(!c)return;c.innerHTML='';
  [{n:1,s:'2-digit \u00d7 1-digit'},{n:2,s:'2-digit \u00d7 2-digit'},{n:3,s:'3-digit \u00d7 2-digit'}].forEach(function(lv){
    var b=document.createElement('button');
    b.className='tab'+(lv.n===mulDigitLv?' active':'');
    b.textContent=lv.s;b.style.fontSize='12px';
    b.onclick=function(){mulDigitLv=lv.n;document.querySelectorAll('#mul-digit-tabs .tab').forEach(function(x){x.classList.remove('active');});b.classList.add('active');renderProblems();};
    c.appendChild(b);
  });
}
function setMulMode(mode,btn){
  mulMode=mode;
  document.querySelectorAll('#mul-mode-tabs .tab').forEach(function(b){b.classList.remove('active');});
  if(btn)btn.classList.add('active');
  document.getElementById('mul-tables-ui').style.display=mode==='tables'?'':'none';
  document.getElementById('mul-digit-ui').style.display=mode==='multidigit'?'':'none';
  renderProblems();
}

// ── DIVISION UI ──────────────────────────────────────────────────────────────
function buildDivTableGrid(){
  var grid=document.getElementById('div-table-grid');
  if(!grid)return;grid.innerHTML='';
  for(var n=2;n<=12;n++){
    (function(n){
      var btn=document.createElement('button');
      btn.className='tab'+(divTables.includes(n)?' active':'');
      btn.textContent='\u00f7'+n;
      btn.style.cssText='padding:8px 4px;font-size:13px;font-weight:700;min-width:0;';
      btn.onclick=function(){
        var idx=divTables.indexOf(n);
        if(idx>=0){if(divTables.length<=1)return;divTables.splice(idx,1);btn.classList.remove('active');}
        else{divTables.push(n);btn.classList.add('active');}
        renderProblems();
      };
      grid.appendChild(btn);
    })(n);
  }
}
function setDivMode(mode,btn){
  divMode=mode;
  document.querySelectorAll('#div-mode-tabs .tab').forEach(function(b){b.classList.remove('active');});
  if(btn)btn.classList.add('active');
  document.getElementById('div-families-ui').style.display=mode==='families'?'':'none';
  document.getElementById('div-dec-ui').style.display=mode==='decimals'?'':'none';
  document.getElementById('div-long-ui').style.display=mode==='longdiv'?'':'none';
  renderProblems();
}

// ── HINTS ─────────────────────────────────────────────────────────────────────
function setHints(n,btn){
  hintCount=n;document.querySelectorAll('.hc-btn').forEach(function(b){b.classList.remove('active');});btn.classList.add('active');
  var c=document.getElementById('hint-inputs');c.innerHTML='';
  for(var i=0;i<n;i++){
    var inp=document.createElement('input');inp.type='text';inp.className='inp';
    inp.placeholder='Hint '+(i+1)+' \u2014 e.g. "First, subtract 4 from both sides"';
    inp.style.marginBottom='6px';inp.dataset.idx=i;
    inp.oninput=function(e){hints[parseInt(e.target.dataset.idx)]=e.target.value;};
    inp.value=hints[i]||'';c.appendChild(inp);
  }
}

// ── TIMER / DIFF ──────────────────────────────────────────────────────────────
function toggleTimer(on){timerEnabled=on;document.getElementById('timer-settings').classList.toggle('active',on);}
function setTimer(m,btn){timerMins=m;document.querySelectorAll('.timer-preset').forEach(function(b){b.classList.remove('active');});btn.classList.add('active');}
function toggleDiff(on){diffEnabled=on;document.getElementById('diff-note-box').classList.toggle('active',on);}

// ── CATEGORY SWITCHING ───────────────────────────────────────────────────────
function setCat(cat) {
  curCat = cat;
  var opsBtn = document.getElementById('cat-ops');
  var algBtn = document.getElementById('cat-alg');
  var cusBtn = document.getElementById('cat-custom');
  var modeRow = document.getElementById('mode-row');
  [opsBtn, algBtn, cusBtn].forEach(function(b) {
    if (!b) return;
    b.style.borderColor = 'rgba(0,0,0,0.09)';
    b.style.background = 'var(--white)';
    b.style.color = '#666';
  });
  var activeBtn = cat === 'ops' ? opsBtn : cat === 'alg' ? algBtn : cusBtn;
  if (activeBtn) {
    activeBtn.style.borderColor = 'rgba(184,224,48,0.6)';
    activeBtn.style.background = 'rgba(184,224,48,0.12)';
    activeBtn.style.color = '#b8e030';
  }
  document.getElementById('ops-section').style.display = cat === 'ops' ? 'block' : 'none';
  document.getElementById('alg-section').style.display = cat === 'alg' ? 'block' : 'none';
  document.getElementById('custom-section').style.display = cat === 'custom' ? 'block' : 'none';
  document.getElementById('calc-section').style.display = cat === 'alg' ? 'block' : 'none';
  if (modeRow) modeRow.style.display = cat === 'custom' ? 'none' : '';
  var reBtn = document.getElementById('rerandomize-btn');
  if (reBtn) reBtn.style.display = 'none';
  var add10Btn = document.getElementById('add10-btn');
  if (add10Btn) add10Btn.style.display = cat === 'custom' ? '' : 'none';
  if (cat === 'ops') {
    calcEnabled = false;
    var ct = document.getElementById('calc-toggle'); if (ct) ct.checked = false;
    _showOpSubSections();
    renderProblems();
  } else if (cat === 'alg') {
    buildAlgLvTabs();
    renderAlgProblems();
  } else {
    calcEnabled = false;
    var ct2 = document.getElementById('calc-toggle'); if (ct2) ct2.checked = false;
    curMode = 'manual';
    curCustomSubCat = 'ops';
    _styleSubBtns('ops');
    document.getElementById('ops-section').style.display = 'block';
    document.getElementById('alg-section').style.display = 'none';
    _showOpSubSections();
    allProbs = genOpsBank();
    selProbs = [].concat(customProbs);
    renderCustomList();
    renderProbList([].concat(customProbs,allProbs), selProbs.map(function(p){return p.eq;}));
  }
}

function _styleSubBtns(active) {
  var ops = document.getElementById('custom-sub-ops');
  var alg = document.getElementById('custom-sub-alg');
  [ops, alg].forEach(function(b, i) {
    if (!b) return;
    var isActive = (active === 'ops' && i === 0) || (active === 'alg' && i === 1);
    b.style.borderColor = isActive ? 'rgba(184,224,48,0.6)' : 'rgba(0,0,0,0.09)';
    b.style.background = isActive ? 'rgba(184,224,48,0.12)' : 'var(--white)';
    b.style.color = isActive ? '#b8e030' : '#666';
  });
}

function setCustomSubCat(cat, btn) {
  curCustomSubCat = cat;
  _styleSubBtns(cat);
  document.getElementById('ops-section').style.display = cat === 'ops' ? 'block' : 'none';
  document.getElementById('alg-section').style.display = cat === 'alg' ? 'block' : 'none';
  document.getElementById('calc-section').style.display = cat === 'alg' ? 'block' : 'none';
  if (cat === 'ops') {
    _showOpSubSections();
    allProbs = genOpsBank();
  } else {
    buildAlgLvTabs();
    allProbs = genAlgBank(curAlgType || 'one', curAlgLv || 1);
  }
  selProbs = selProbs.filter(function(p){return p.isCustom;});
  renderProbList([].concat(customProbs,allProbs), selProbs.map(function(p){return p.eq;}));
}

function setAlgType(t, btn) {
  curAlgType = t;
  document.querySelectorAll('#alg-type-tabs .tab').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  curAlgLv = 1;
  buildAlgLvTabs();
  renderAlgProblems();
}

function buildAlgLvTabs() {
  var c = document.getElementById('alg-lv-tabs'); c.innerHTML = '';
  var isTwo = curAlgType === 'two';
  [{n:1,l:isTwo?'L4':'L1',s:'Simple integers'},{n:2,l:isTwo?'L5':'L2',s:'Larger integers'},{n:3,l:isTwo?'L6':'L3',s:'Fractions'}].forEach(function(lv) {
    var b = document.createElement('button');
    b.className = 'tab' + (lv.n === curAlgLv ? ' active' : '');
    b.innerHTML = lv.l + '<br><span style="font-size:9px;opacity:0.6;">' + lv.s + '</span>';
    b.onclick = function() { curAlgLv = lv.n; document.querySelectorAll('#alg-lv-tabs .tab').forEach(function(x){x.classList.remove('active');}); b.classList.add('active'); renderAlgProblems(); };
    c.appendChild(b);
  });
}

// ── ALGEBRA BANK ──────────────────────────────────────────────────────────────
function renderAlgProblems() {
  allProbs = genAlgBank(curAlgType, curAlgLv);
  rand20();
}

function genAlgBank(type, lv) {
  var probs = [], seen = new Set();
  var att = 0;
  var coefR = lv===1?[1,5]:lv===2?[2,9]:[2,12];
  var constR = lv===1?[1,10]:lv===2?[1,20]:[1,30];
  var allowNeg = lv===3;
  function maybeNeg(v){ return allowNeg&&Math.random()<0.4?-v:v; }
  while (probs.length < 50 && att < 3000) {
    att++;
    var eq, ans, ansDisplay;
    if (type === 'one') {
      var form = rnd(0,3);
      if (form===0) {
        var a0=rnd(constR[0],constR[1]), x0=maybeNeg(rnd(1,12)), b0=x0+a0;
        eq='x + '+a0+' = '+b0; ans=x0; ansDisplay=String(x0);
      } else if (form===1) {
        var a1=rnd(constR[0],constR[1]), x1=maybeNeg(rnd(1,12)), b1=x1-a1;
        eq='x \u2212 '+a1+' = '+b1; ans=x1; ansDisplay=String(x1);
      } else if (form===2) {
        var a2=rnd(coefR[0],coefR[1]), x2=rnd(1,10), b2=a2*x2;
        eq=a2+'x = '+b2; ans=x2; ansDisplay=String(x2);
      } else {
        var a3=rnd(2,8), b3=rnd(1,12), x3=a3*b3;
        eq='FRAC:x:'+a3+' = '+b3; ans=x3; ansDisplay=String(x3);
      }
    } else {
      var a4=rnd(coefR[0],coefR[1]), b4=rnd(constR[0],constR[1]);
      var sign=Math.random()<0.5?1:-1;
      var x4=maybeNeg(rnd(1,10));
      var c4=a4*x4+sign*b4;
      eq=sign>0?(a4+'x + '+b4+' = '+c4):(a4+'x \u2212 '+b4+' = '+c4);
      if (lv===3 && Math.random()<0.3) {
        var aa=rnd(2,6),bb=rnd(1,10),cc=rnd(bb+2,bb+aa*4);
        var num=cc-bb,den=aa;
        function gcd(ga,gb){ga=Math.abs(ga);gb=Math.abs(gb);while(gb){var t=gb;gb=ga%gb;ga=t;}return ga;}
        var g=gcd(num,den),fn=num/g,fd=den/g;
        if(fd>1&&fd<=8&&fn>0&&!seen.has(aa+'x + '+bb+' = '+cc)){
          eq=aa+'x + '+bb+' = '+cc; ans=fn/fd; ansDisplay=fn+'/'+fd;
          if(!seen.has(eq)){seen.add(eq);probs.push({eq:eq,ans:ans,ansDisplay:ansDisplay,isAlgebra:true});continue;}
        }
      }
      ans=x4; ansDisplay=String(x4);
    }
    if(!seen.has(eq)){seen.add(eq);probs.push({eq:eq,ans:ans,ansDisplay:ansDisplay||String(ans),isAlgebra:true});}
  }
  return probs;
}

// ── CUSTOM PROBLEM FUNCTIONS ──────────────────────────────────────────────────
function addCustomProb() {
  var eqInput = document.getElementById('custom-eq-input');
  var ansInput = document.getElementById('custom-ans-input');
  var err = document.getElementById('custom-err');
  var eq = eqInput.value.trim();
  var ansRaw = ansInput.value.trim();
  err.style.display = 'none';
  if (!eq) { err.textContent = 'Please enter a problem.'; err.style.display = 'block'; return; }
  if (!ansRaw) { err.textContent = 'Please enter the answer.'; err.style.display = 'block'; return; }
  var ans, ansDisplay;
  if (ansRaw.includes('/')) {
    var parts = ansRaw.split('/');
    if (parts.length === 2 && !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1])) && parseFloat(parts[1]) !== 0) {
      ans = parseFloat(parts[0]) / parseFloat(parts[1]);
      ansDisplay = ansRaw;
    } else { err.textContent = 'Invalid fraction. Use e.g. 3/4'; err.style.display = 'block'; return; }
  } else {
    ans = parseFloat(ansRaw);
    if (isNaN(ans)) { err.textContent = 'Answer must be a number (e.g. 7, -3, or 1/2).'; err.style.display = 'block'; return; }
    ansDisplay = String(ans);
  }
  if (customProbs.find(function(p){return p.eq === eq;})) {
    err.textContent = 'That problem is already in your list.';
    err.style.display = 'block'; return;
  }
  var isAlg = /[a-zA-Z]/.test(eq);
  customProbs.push({ eq:eq, ans:ans, ansDisplay:ansDisplay, isAlgebra:isAlg, isCustom:true });
  eqInput.value = ''; ansInput.value = ''; eqInput.focus();
  if (curCat === 'custom') {
    selProbs = [].concat(customProbs, selProbs.filter(function(p){return !p.isCustom;}));
    renderCustomList();
    renderProbList([].concat(customProbs,allProbs), selProbs.map(function(p){return p.eq;}));
  } else {
    allProbs = [].concat(customProbs);
    selProbs = [].concat(customProbs);
    renderCustomList();
    renderProbList(allProbs, selProbs.map(function(p){return p.eq;}));
  }
}

function removeCustomProb(idx) {
  customProbs.splice(idx, 1);
  if (curCat === 'custom') {
    selProbs = [].concat(customProbs, selProbs.filter(function(p){return !p.isCustom;}));
    renderCustomList();
    renderProbList([].concat(customProbs,allProbs), selProbs.map(function(p){return p.eq;}));
  } else {
    allProbs = [].concat(customProbs);
    selProbs = [].concat(customProbs);
    renderCustomList();
    renderProbList(allProbs, selProbs.map(function(p){return p.eq;}));
  }
}

function renderCustomList() {
  var c = document.getElementById('custom-list');
  if (!c) return;
  if (customProbs.length === 0) {
    c.innerHTML = '<div style="font-size:12px;color:#bbb;padding:10px 0 4px;">No problems yet \u2014 add your first one above.</div>';
    return;
  }
  c.innerHTML = '<div style="font-size:11px;color:#888;margin-bottom:8px;font-weight:700;letter-spacing:0.3px;text-transform:uppercase;">Your problems (' + customProbs.length + ')</div>' +
    customProbs.map(function(p, i) {
      return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(0,0,0,0.05);">' +
      '<button onclick="removeCustomProb(' + i + ')" title="Remove" style="background:rgba(229,57,53,0.08);border:none;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:12px;color:#e53935;flex-shrink:0;padding:0;line-height:1;">\u2715</button>' +
      '<span style="font-size:13px;font-weight:700;flex:1;color:#1a1a24;">' + p.eq + '</span>' +
      '<span style="font-size:11px;color:#888;white-space:nowrap;">' + (p.isAlgebra ? 'x = ' : '= ') + fmtFrac(p.ansDisplay) + '</span>' +
      '</div>';
    }).join('');
}

// ── QUICK ADD FROM BANK ───────────────────────────────────────────────────────
function addFromBank(n) {
  var available = allProbs.filter(function(p){return !selProbs.find(function(s){return s.eq===p.eq;});});
  if (available.length === 0) { updSC(); return; }
  var toAdd = [].concat(available).sort(function(){return Math.random()-0.5;}).slice(0, n);
  selProbs = [].concat(selProbs, toAdd);
  var pool = curCat === 'custom' ? [].concat(customProbs,allProbs) : allProbs;
  renderProbList(pool, selProbs.map(function(p){return p.eq;}));
}
