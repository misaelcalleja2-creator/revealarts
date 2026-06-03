// ── PROBLEM BANK ──────────────────────────────────────────────────────────────
function rnd(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
function rneg(a,b){const v=rnd(a,b);return Math.random()<0.45?-v:v;}
function genBank(op,lv){
  const probs=[],seen=new Set();
  const ranges={1:[1,9],2:[10,99],3:[100,999],4:[1,9],5:[10,99],6:[100,999]};
  const[mn,mx]=ranges[lv];const neg=lv>=4;let att=0;
  while(probs.length<50&&att<3000){
    att++;let a,b,ans,eq;
    if(op==='addition'){a=neg?rneg(mn,mx):rnd(mn,mx);b=neg?rneg(mn,mx):rnd(mn,mx);ans=a+b;eq=`${a} + ${b}`;}
    else if(op==='subtraction'){a=neg?rneg(mn,mx):rnd(mn,mx);b=neg?rneg(mn,mx):rnd(mn,mx);ans=a-b;eq=`${a} − ${b}`;}
    else if(op==='multiplication'){const mm=lv===1||lv===4?9:lv===2||lv===5?12:15;a=neg?(Math.random()<0.45?-rnd(1,mm):rnd(1,mm)):rnd(1,mm);b=neg?(Math.random()<0.45?-rnd(1,mm):rnd(1,mm)):rnd(1,mm);ans=a*b;eq=`${a} × ${b}`;}
    else{const dm=lv===1||lv===4?8:lv===2||lv===5?11:14,qm=lv===1||lv===4?8:lv===2||lv===5?12:15;const dv=rnd(2,dm),qt=rnd(1,qm),dd=dv*qt;const nd=neg&&Math.random()<0.4,nq=neg&&Math.random()<0.4;a=nd?-dd:dd;b=nd?-dv:dv;ans=a/b;eq=`${a} ÷ ${b}`;}
    if(!seen.has(eq)){seen.add(eq);probs.push({eq,ans});}
  }
  return probs;
}
function renderProblems(){allProbs=genBank(curOp,curLvl);rand20();}
function renderProbList(pool,selEqs=[]){
  const c=document.getElementById('pp');c.innerHTML='';
  pool.forEach(p=>{
    const sel=selEqs.includes(p.eq);
    const row=document.createElement('div');row.className='prob-row'+(sel?' selected':'');
    row.innerHTML=`<div class="prob-chk">${sel?'✓':''}</div><div class="prob-eq">${p.eq&&p.eq.startsWith('FRAC:')?p.eq.replace(/FRAC:(.*?):(\d+)/,'$1 ÷ $2'):p.eq} ${p.isAlgebra?', x = ?':' = ?'}</div><div class="prob-ans">= ${p.ansDisplay||p.ans}</div>`;
    row.onclick=()=>toggleProb(p,row);c.appendChild(row);
  });
  updSC();
}
function toggleProb(p,row){
  if(curMode==='random')return;
  const idx=selProbs.findIndex(x=>x.eq===p.eq);
  if(idx>=0){selProbs.splice(idx,1);row.classList.remove('selected');row.querySelector('.prob-chk').textContent='';}
  else{selProbs.push(p);row.classList.add('selected');row.querySelector('.prob-chk').textContent='✓';}
  updSC();
}
function setNumProbs(n, btn) {
  numProbs = n;
  document.querySelectorAll('.prob-count-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.getElementById('sc-total') && (document.getElementById('sc-total').textContent = n);
  document.getElementById('random-count') && (document.getElementById('random-count').textContent = n);
  rand20();
}
function rand20(){
  const sh=[...allProbs].sort(()=>Math.random()-0.5);selProbs=sh.slice(0,numProbs);
  renderProbList(curMode==='random'?selProbs:allProbs,selProbs.map(p=>p.eq));
}
function updSC(){document.getElementById('sc').textContent=selProbs.length;document.getElementById('sc-total')&&(document.getElementById('sc-total').textContent=numProbs);}
function setOp(op,btn){curOp=op;document.querySelectorAll('#op-tabs .tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderProblems();}
function setMode(m,btn){curMode=m;document.querySelectorAll('.mode-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');if(m==='random')rand20();else renderProbList(allProbs,selProbs.map(p=>p.eq));}
function buildLvTabs(){
  const c=document.getElementById('lv-tabs');c.innerHTML='';
  [{n:1,l:'L1',s:'Single'},{n:2,l:'L2',s:'Double'},{n:3,l:'L3',s:'Triple'},{n:4,l:'L4',s:'Single+neg',neg:true},{n:5,l:'L5',s:'Double+neg',neg:true},{n:6,l:'L6',s:'Triple+neg',neg:true}].forEach(lv=>{
    const b=document.createElement('button');
    b.className='tab'+(lv.neg?' neg':'')+(lv.n===curLvl?' active':'');
    b.innerHTML=`${lv.l}<br><span style="font-size:9px;opacity:0.6;">${lv.s}</span>`;
    b.onclick=()=>{curLvl=lv.n;document.querySelectorAll('#lv-tabs .tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.getElementById('neg-note').style.display=lv.n>=4?'block':'none';renderProblems();};
    c.appendChild(b);
  });
}

// ── HINTS ─────────────────────────────────────────────────────────────────────
function setHints(n,btn){
  hintCount=n;document.querySelectorAll('.hc-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
  const c=document.getElementById('hint-inputs');c.innerHTML='';
  for(let i=0;i<n;i++){
    const inp=document.createElement('input');inp.type='text';inp.className='inp';
    inp.placeholder=`Hint ${i+1} — e.g. "First, subtract 4 from both sides"`;
    inp.style.marginBottom='6px';inp.oninput=e=>{hints[i]=e.target.value;};inp.value=hints[i]||'';;c.appendChild(inp);
  }
}

// ── TIMER / DIFF ──────────────────────────────────────────────────────────────
function toggleTimer(on){timerEnabled=on;document.getElementById('timer-settings').classList.toggle('active',on);}
function setTimer(m,btn){timerMins=m;document.querySelectorAll('.timer-preset').forEach(b=>b.classList.remove('active'));btn.classList.add('active');}
function toggleDiff(on){diffEnabled=on;document.getElementById('diff-note-box').classList.toggle('active',on);}

// ── CATEGORY SWITCHING ───────────────────────────────────────────────────────
function setCat(cat) {
  curCat = cat;
  const opsBtn = document.getElementById('cat-ops');
  const algBtn = document.getElementById('cat-alg');
  if (cat === 'ops') {
    opsBtn.style.borderColor = 'rgba(184,224,48,0.6)';
    opsBtn.style.background = 'rgba(184,224,48,0.12)';
    opsBtn.style.color = '#b8e030';
    algBtn.style.borderColor = 'rgba(0,0,0,0.09)';
    algBtn.style.background = '#fff';
    algBtn.style.color = '#555';
    document.getElementById('ops-section').style.display = 'block';
    document.getElementById('alg-section').style.display = 'none';
    document.getElementById('calc-section').style.display = 'none';
    calcEnabled = false; document.getElementById('calc-toggle').checked = false;
    renderProblems();
  } else {
    algBtn.style.borderColor = 'rgba(184,224,48,0.6)';
    algBtn.style.background = 'rgba(184,224,48,0.12)';
    algBtn.style.color = '#b8e030';
    opsBtn.style.borderColor = 'rgba(0,0,0,0.09)';
    opsBtn.style.background = '#fff';
    opsBtn.style.color = '#555';
    document.getElementById('ops-section').style.display = 'none';
    document.getElementById('alg-section').style.display = 'block';
    document.getElementById('calc-section').style.display = 'block';
    buildAlgLvTabs();
    renderAlgProblems();
  }
}

function setAlgType(t, btn) {
  curAlgType = t;
  document.querySelectorAll('#alg-type-tabs .tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  curAlgLv = 1;
  buildAlgLvTabs();
  renderAlgProblems();
}

function buildAlgLvTabs() {
  const c = document.getElementById('alg-lv-tabs'); c.innerHTML = '';
  const isTwo = curAlgType === 'two';
  [{n:1,l:isTwo?'L4':'L1',s:'Simple integers'},{n:2,l:isTwo?'L5':'L2',s:'Larger integers'},{n:3,l:isTwo?'L6':'L3',s:'Fractions'}].forEach(lv => {
    const b = document.createElement('button');
    b.className = 'tab' + (lv.n === curAlgLv ? ' active' : '');
    b.innerHTML = lv.l + '<br><span style="font-size:9px;opacity:0.6;">' + lv.s + '</span>';
    b.onclick = () => { curAlgLv = lv.n; document.querySelectorAll('#alg-lv-tabs .tab').forEach(x => x.classList.remove('active')); b.classList.add('active'); renderAlgProblems(); };
    c.appendChild(b);
  });
}

// ── ALGEBRA BANK ──────────────────────────────────────────────────────────────
function renderAlgProblems() {
  allProbs = genAlgBank(curAlgType, curAlgLv);
  rand20();
}

function genAlgBank(type, lv) {
  const probs = [], seen = new Set();
  let att = 0;
  const coefR = lv===1?[1,5]:lv===2?[2,9]:[2,12];
  const constR = lv===1?[1,10]:lv===2?[1,20]:[1,30];
  // L3/L6 allow negative answers ~40% of the time
  const allowNeg = lv===3;
  function maybeNeg(v){ return allowNeg&&Math.random()<0.4?-v:v; }
  while (probs.length < 50 && att < 3000) {
    att++;
    let eq, ans, ansDisplay;
    if (type === 'one') {
      const form = rnd(0,3);
      if (form===0) {
        // x + a = b  →  x can be negative on L3
        const a=rnd(constR[0],constR[1]), x=maybeNeg(rnd(1,12)), b=x+a;
        eq='x + '+a+' = '+b; ans=x; ansDisplay=String(x);
      } else if (form===1) {
        // x - a = b  →  x can be negative on L3
        const a=rnd(constR[0],constR[1]), x=maybeNeg(rnd(1,12)), b=x-a;
        eq='x − '+a+' = '+b; ans=x; ansDisplay=String(x);
      } else if (form===2) {
        // ax = b  →  x positive only (negative b would confuse)
        const a=rnd(coefR[0],coefR[1]), x=rnd(1,10), b=a*x;
        eq=a+'x = '+b; ans=x; ansDisplay=String(x);
      } else {
        // x/a = b  →  x positive only (fractions stay positive)
        const a=rnd(2,8), b=rnd(1,12), x=a*b;
        eq='FRAC:x:'+a+' = '+b; ans=x; ansDisplay=String(x);
      }
    } else {
      // two-step: ax + b = c  →  x can be negative on L6
      const a=rnd(coefR[0],coefR[1]), b=rnd(constR[0],constR[1]);
      const sign=Math.random()<0.5?1:-1;
      const x=maybeNeg(rnd(1,10));
      const c=a*x+sign*b;
      eq=sign>0?(a+'x + '+b+' = '+c):(a+'x − '+b+' = '+c);
      if (lv===3 && Math.random()<0.3) {
        const aa=rnd(2,6),bb=rnd(1,10),cc=rnd(bb+2,bb+aa*4);
        const num=cc-bb,den=aa;
        function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){const t=b;b=a%b;a=t;}return a;}
        const g=gcd(num,den),fn=num/g,fd=den/g;
        if(fd>1&&fd<=8&&fn>0&&!seen.has(aa+'x + '+bb+' = '+cc)){
          eq=aa+'x + '+bb+' = '+cc; ans=fn/fd; ansDisplay=fn+'/'+fd;
          if(!seen.has(eq)){seen.add(eq);probs.push({eq,ans,ansDisplay,isAlgebra:true});continue;}
        }
      }
      ans=x; ansDisplay=String(x);
    }
    if(!seen.has(eq)){seen.add(eq);probs.push({eq,ans,ansDisplay:ansDisplay||String(ans),isAlgebra:true});}
  }
  return probs;
}
