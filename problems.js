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
function _gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){var t=b;b=a%b;a=t;}return a;}
function _lcm(a,b){return Math.abs(a*b)/_gcd(a,b);}
function _simplify(n,d){var g=_gcd(n,d);return[n/g,d/g];}
function _sup(n){var m={0:'\u2070',1:'\u00b9',2:'\u00b2',3:'\u00b3',4:'\u2074',5:'\u2075',6:'\u2076',7:'\u2077',8:'\u2078',9:'\u2079'};return String(n).split('').map(function(d){return m[parseInt(d)];}).join('');}

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
function genMulTables(tables,allFacts,mixOrient){
  const probs=[],seen=new Set();
  tables.forEach(t=>{
    for(let i=1;i<=12;i++){
      const eq1=t+' \u00d7 '+i;
      if(!seen.has(eq1)){seen.add(eq1);probs.push({eq:eq1,ans:t*i});}
      if(!allFacts){
        const eq2=i+' \u00d7 '+t;
        if(!seen.has(eq2)){seen.add(eq2);probs.push({eq:eq2,ans:t*i});}
      }
    }
  });
  const shuffled=probs.sort(()=>Math.random()-0.5);
  // Mix orientations: randomly flip some facts (e.g. 3×7 → 7×3), deduping collisions
  if(allFacts&&mixOrient){
    const result=[],used=new Set();
    shuffled.forEach(function(p){
      var parts=p.eq.split(' \u00d7 ');
      var flipped=parts[1]+' \u00d7 '+parts[0];
      var tryFlip=Math.random()<0.5;
      var preferred=tryFlip?flipped:p.eq;
      var fallback=tryFlip?p.eq:flipped;
      if(!used.has(preferred)){used.add(preferred);result.push({eq:preferred,ans:p.ans});}
      else if(!used.has(fallback)){used.add(fallback);result.push({eq:fallback,ans:p.ans});}
      // else: both orientations already used (only possible for perfect squares like 3×3 — skip)
    });
    return result;
  }
  return shuffled;
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

// ── FRACTION GENERATORS ───────────────────────────────────────────────────────
function genFracAddSub(denomType){
  var probs=[],seen=new Set(),att=0;
  while(probs.length<50&&att<3000){
    att++;
    var d1,d2,n1,n2;
    if(denomType==='same'){d1=rnd(2,12);d2=d1;}
    else{d1=rnd(2,12);d2=rnd(2,12);if(d2===d1)continue;}
    n1=rnd(1,d1-1);n2=rnd(1,d2-1);
    var op=Math.random()<0.5?'+':'\u2212';
    var lcd=_lcm(d1,d2);
    var a1=n1*(lcd/d1),a2=n2*(lcd/d2);
    if(op==='\u2212'&&a1<a2){var t=n1;n1=n2;n2=t;t=d1;d1=d2;d2=t;lcd=_lcm(d1,d2);a1=n1*(lcd/d1);a2=n2*(lcd/d2);}
    var rn=op==='+'?a1+a2:a1-a2;
    if(rn===0)continue;
    var s=_simplify(rn,lcd);
    var eq=n1+'/'+d1+' '+op+' '+n2+'/'+d2;
    if(!seen.has(eq)){seen.add(eq);probs.push({eq:eq,ans:s[0]/s[1],ansDisplay:s[1]===1?String(s[0]):s[0]+'/'+s[1]});}
  }
  return probs;
}
function genFracMultiply(){
  var probs=[],seen=new Set(),att=0;
  while(probs.length<50&&att<3000){
    att++;
    var n1=rnd(1,9),d1=rnd(2,10),n2=rnd(1,9),d2=rnd(2,10);
    if(n1===d1||n2===d2)continue;
    var rn=n1*n2,rd=d1*d2;
    var s=_simplify(rn,rd);
    var eq=n1+'/'+d1+' \u00d7 '+n2+'/'+d2;
    if(!seen.has(eq)){seen.add(eq);probs.push({eq:eq,ans:s[0]/s[1],ansDisplay:s[1]===1?String(s[0]):s[0]+'/'+s[1]});}
  }
  return probs;
}
function genFracDivide(){
  var probs=[],seen=new Set(),att=0;
  while(probs.length<50&&att<3000){
    att++;
    var n1=rnd(1,9),d1=rnd(2,10),n2=rnd(1,9),d2=rnd(2,10);
    if(n1===d1||n2===d2||n2===0)continue;
    var rn=n1*d2,rd=d1*n2;
    var s=_simplify(rn,rd);
    var eq=n1+'/'+d1+' \u00f7 '+n2+'/'+d2;
    if(!seen.has(eq)){seen.add(eq);probs.push({eq:eq,ans:s[0]/s[1],ansDisplay:s[1]===1?String(s[0]):s[0]+'/'+s[1]});}
  }
  return probs;
}

// ── PEMDAS GENERATOR ─────────────────────────────────────────────────────────
function genPemdas(lvl){
  var probs=[],seen=new Set(),att=0;
  while(probs.length<50&&att<5000){
    att++;var eq,ans,a,b,c;
    if(lvl===1){
      var f=rnd(0,7);
      if(f===0){a=rnd(1,20);b=rnd(2,9);c=rnd(2,9);ans=a+b*c;eq=a+' + '+b+' \u00d7 '+c;}
      else if(f===1){b=rnd(2,9);c=rnd(2,9);a=rnd(b*c+1,b*c+20);ans=a-b*c;eq=a+' \u2212 '+b+' \u00d7 '+c;}
      else if(f===2){a=rnd(2,9);b=rnd(2,9);c=rnd(1,20);ans=a*b+c;eq=a+' \u00d7 '+b+' + '+c;}
      else if(f===3){a=rnd(2,9);b=rnd(2,9);c=rnd(1,a*b-1);ans=a*b-c;eq=a+' \u00d7 '+b+' \u2212 '+c;}
      else if(f===4){c=rnd(2,9);b=c*rnd(1,9);a=rnd(1,20);ans=a+b/c;eq=a+' + '+b+' \u00f7 '+c;}
      else if(f===5){c=rnd(2,9);b=c*rnd(1,9);var q=b/c;a=rnd(q+1,q+20);ans=a-q;eq=a+' \u2212 '+b+' \u00f7 '+c;}
      else if(f===6){b=rnd(2,9);a=b*rnd(1,9);c=rnd(1,20);ans=a/b+c;eq=a+' \u00f7 '+b+' + '+c;}
      else{b=rnd(2,9);a=b*rnd(2,9);var q2=a/b;c=rnd(1,q2-1);ans=q2-c;eq=a+' \u00f7 '+b+' \u2212 '+c;}
    }else if(lvl===2){
      var f2=rnd(0,5);
      if(f2===0){a=rnd(1,9);b=rnd(1,9);c=rnd(2,9);ans=(a+b)*c;eq='('+a+' + '+b+') \u00d7 '+c;}
      else if(f2===1){a=rnd(3,15);b=rnd(1,a-1);c=rnd(2,9);ans=(a-b)*c;eq='('+a+' \u2212 '+b+') \u00d7 '+c;}
      else if(f2===2){a=rnd(2,9);b=rnd(1,9);c=rnd(1,9);ans=a*(b+c);eq=a+' \u00d7 ('+b+' + '+c+')';}
      else if(f2===3){c=rnd(2,9);var sm=c*rnd(2,9);a=rnd(1,sm-1);b=sm-a;ans=sm/c;eq='('+a+' + '+b+') \u00f7 '+c;}
      else if(f2===4){var bc=rnd(2,9);a=bc*rnd(2,9);b=rnd(1,bc-1);c=bc-b;ans=a/bc;eq=a+' \u00f7 ('+b+' + '+c+')';}
      else{a=rnd(2,9);b=rnd(3,12);c=rnd(1,b-1);ans=a*(b-c);eq=a+' \u00d7 ('+b+' \u2212 '+c+')';}
    }else{
      var f3=rnd(0,5);
      if(f3===0){a=rnd(2,6);b=rnd(1,20);ans=a*a+b;eq=a+'\u00b2 + '+b;}
      else if(f3===1){a=rnd(2,6);b=rnd(1,a*a-1);ans=a*a-b;eq=a+'\u00b2 \u2212 '+b;}
      else if(f3===2){a=rnd(2,5);b=rnd(2,5);c=rnd(1,10);ans=a*b*b+c;eq=a+' \u00d7 '+b+'\u00b2 + '+c;}
      else if(f3===3){a=rnd(1,4);b=rnd(1,5);ans=(a+b)*(a+b);eq='('+a+' + '+b+')\u00b2';}
      else if(f3===4){a=rnd(2,4);ans=a*a*a;eq=a+'\u00b3';}
      else{a=rnd(2,5);b=rnd(2,4);ans=a*a+b*b;eq=a+'\u00b2 + '+b+'\u00b2';}
    }
    if(ans<0||ans!==Math.floor(ans))continue;
    if(!seen.has(eq)){seen.add(eq);probs.push({eq:eq,ans:ans});}
  }
  return probs;
}

// ── EXPONENT / ROOT GENERATORS ───────────────────────────────────────────────
function genPowers(){
  var probs=[],seen=new Set();
  // Squares 1-20
  for(var i=1;i<=20;i++){var eq=i+'\u00b2';seen.add(eq);probs.push({eq:eq,ans:i*i});}
  // Cubes 1-10
  for(var j=1;j<=10;j++){var eq2=j+'\u00b3';if(!seen.has(eq2)){seen.add(eq2);probs.push({eq:eq2,ans:j*j*j});}}
  // Higher powers small bases
  var extras=[[2,4],[2,5],[2,6],[2,7],[2,8],[2,9],[2,10],[3,4],[3,5],[4,4],[5,4]];
  extras.forEach(function(p){var eq3=p[0]+_sup(p[1]);if(!seen.has(eq3)){seen.add(eq3);probs.push({eq:eq3,ans:Math.pow(p[0],p[1])});}});
  return probs.sort(function(){return Math.random()-0.5;});
}
function genSqRoots(){
  var probs=[];
  for(var n=1;n<=20;n++){probs.push({eq:'\u221a'+n*n,ans:n});}
  return probs.sort(function(){return Math.random()-0.5;});
}
function genCuRoots(){
  var probs=[];
  for(var n=1;n<=10;n++){probs.push({eq:'\u00b3\u221a'+n*n*n,ans:n});}
  return probs.sort(function(){return Math.random()-0.5;});
}

// ── PERCENT GENERATORS ────────────────────────────────────────────────────────
function genPercents(mode){
  var probs=[],seen=new Set(),att=0;
  while(probs.length<50&&att<3000){
    att++;
    var pct=rnd(5,95),whole=rnd(10,200);
    var part=pct*whole/100;
    if(part!==Math.floor(part))continue;
    var eq,ans;
    if(mode==='findpart'){eq='What is '+pct+'% of '+whole+'?';ans=part;}
    else if(mode==='findpct'){eq=part+' is what % of '+whole+'?';ans=pct;}
    else{eq=part+' is '+pct+'% of what?';ans=whole;}
    if(!seen.has(eq)){seen.add(eq);probs.push({eq:eq,ans:ans});}
  }
  return probs;
}

// ── PROPORTION GENERATOR ─────────────────────────────────────────────────────
function genProportions(){
  var probs=[],seen=new Set(),att=0;
  while(probs.length<50&&att<3000){
    att++;
    var a=rnd(1,10),b=rnd(2,10);
    if(a===b)continue;
    var g=_gcd(a,b);a=a/g;b=b/g;
    if(a===b)continue;
    var k=rnd(2,8),c=a*k,d=b*k;
    var form=rnd(0,3);var eq,ans;
    if(form===0){eq=a+'/'+b+' = x/'+d;ans=c;}
    else if(form===1){eq=a+'/'+b+' = '+c+'/x';ans=d;}
    else if(form===2){eq='x/'+b+' = '+c+'/'+d;ans=a;}
    else{eq=a+'/x = '+c+'/'+d;ans=b;}
    if(!seen.has(eq)){seen.add(eq);probs.push({eq:eq,ans:ans});}
  }
  return probs;
}

// ── GEOMETRY GENERATORS ──────────────────────────────────────────────────────
function genGeoArea(){
  var probs=[],seen=new Set(),att=0;
  while(probs.length<50&&att<3000){
    att++;var shape=rnd(0,3),eq,ans;
    if(shape===0){var l=rnd(2,20),w=rnd(2,20);ans=l*w;eq='Rectangle area: l = '+l+', w = '+w;}
    else if(shape===1){var b=rnd(2,20),h=rnd(2,20);if((b*h)%2!==0)continue;ans=b*h/2;eq='Triangle area: b = '+b+', h = '+h;}
    else if(shape===2){var b2=rnd(2,20),h2=rnd(2,20);ans=b2*h2;eq='Parallelogram area: b = '+b2+', h = '+h2;}
    else{var b1=rnd(2,15),b2t=rnd(2,15),ht=rnd(2,15);if(((b1+b2t)*ht)%2!==0)continue;ans=(b1+b2t)*ht/2;eq='Trapezoid area: b\u2081 = '+b1+', b\u2082 = '+b2t+', h = '+ht;}
    if(!seen.has(eq)){seen.add(eq);probs.push({eq:eq,ans:ans});}
  }
  return probs;
}
function genGeoPerimeter(){
  var probs=[],seen=new Set(),att=0;
  while(probs.length<50&&att<3000){
    att++;var shape=rnd(0,2),eq,ans;
    if(shape===0){var l=rnd(2,25),w=rnd(2,25);ans=2*(l+w);eq='Rectangle perimeter: l = '+l+', w = '+w;}
    else if(shape===1){var s=rnd(2,25);ans=4*s;eq='Square perimeter: s = '+s;}
    else{var a=rnd(2,15),b=rnd(2,15),c=rnd(2,15);if(a+b<=c||a+c<=b||b+c<=a)continue;ans=a+b+c;eq='Triangle perimeter: a = '+a+', b = '+b+', c = '+c;}
    if(!seen.has(eq)){seen.add(eq);probs.push({eq:eq,ans:ans});}
  }
  return probs;
}
function genGeoVolume(){
  var probs=[],seen=new Set(),att=0;
  while(probs.length<50&&att<3000){
    att++;var shape=rnd(0,2),eq,ans;
    if(shape===0){var l=rnd(2,12),w=rnd(2,12),h=rnd(2,12);ans=l*w*h;eq='Rectangular prism: l = '+l+', w = '+w+', h = '+h;}
    else if(shape===1){var s=rnd(2,8);ans=s*s*s;eq='Cube volume: s = '+s;}
    else{var b=rnd(2,12),h2=rnd(2,12),le=rnd(2,12);if((b*h2)%2!==0)continue;ans=b*h2/2*le;eq='Triangular prism: b = '+b+', h = '+h2+', l = '+le;}
    if(!seen.has(eq)){seen.add(eq);probs.push({eq:eq,ans:ans});}
  }
  return probs;
}
function genGeoPythag(){
  var probs=[],seen=new Set();
  var triples=[[3,4,5],[5,12,13],[6,8,10],[7,24,25],[8,15,17],[9,12,15],[9,40,41],[12,16,20],[15,20,25],[20,21,29]];
  triples.forEach(function(t){
    for(var k=1;k<=3;k++){
      var a=t[0]*k,b=t[1]*k,c=t[2]*k;
      var eq1='Right triangle: a = '+a+', b = '+b+', c = ?';if(!seen.has(eq1)){seen.add(eq1);probs.push({eq:eq1,ans:c});}
      var eq2='Right triangle: a = '+a+', c = '+c+', b = ?';if(!seen.has(eq2)){seen.add(eq2);probs.push({eq:eq2,ans:b});}
      var eq3='Right triangle: b = '+b+', c = '+c+', a = ?';if(!seen.has(eq3)){seen.add(eq3);probs.push({eq:eq3,ans:a});}
    }
  });
  return probs.sort(function(){return Math.random()-0.5;});
}

// ── OPERATIONS BANK ROUTER ───────────────────────────────────────────────────
function genOpsBank(){
  if(curOp==='multiplication')return mulMode==='tables'?genMulTables(mulTables,mulAllFacts,mulMixOrient):genMulMultiDigit(mulDigitLv);
  if(curOp==='division')return divMode==='families'?genDivFamilies(divTables):divMode==='decimals'?genDivDecimals():genDivLong();
  if(curOp==='fractions')return fracMode==='addsub'?genFracAddSub(fracDenom):fracMode==='multiply'?genFracMultiply():genFracDivide();
  if(curOp==='pemdas')return genPemdas(pemdasLvl);
  if(curOp==='exponents')return expMode==='powers'?genPowers():expMode==='sqroots'?genSqRoots():genCuRoots();
  if(curOp==='percents')return genPercents(pctMode);
  if(curOp==='proportions')return genProportions();
  if(curOp==='geometry')return geoMode==='area'?genGeoArea():geoMode==='perimeter'?genGeoPerimeter():geoMode==='volume'?genGeoVolume():genGeoPythag();
  return genBank(curOp,curLvl);
}

// ── RENDER / SELECT ──────────────────────────────────────────────────────────
function renderProblems(){
  allProbs=genOpsBank();
  // Auto-set problem count when "all facts" is on for multiplication tables
  if(curOp==='multiplication'&&mulMode==='tables'){
    var note=document.getElementById('mul-tables-note');
    if(mulAllFacts){
      numProbs=allProbs.length;
      document.querySelectorAll('.prob-count-btn').forEach(function(b){b.classList.toggle('active',parseInt(b.textContent)===numProbs);});
      var sct=document.getElementById('sc-total');if(sct)sct.textContent=numProbs;
      var rc=document.getElementById('random-count');if(rc)rc.textContent=numProbs;
      if(note)note.textContent=allProbs.length+' problems \u2014 12 per table, one orientation each.';
    }else{
      if(note)note.textContent='Students get both orientations (e.g. 2 \u00d7 7 and 7 \u00d7 2).';
    }
  }
  rand20();
}

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
function updSC(){
  var sc=document.getElementById('sc');
  var sct=document.getElementById('sc-total');
  if(sc)sc.textContent=selProbs.length;
  if(sct)sct.textContent=numProbs;
  // Keep selection tab count current
  var selTab=document.getElementById('custom-sub-sel');
  if(selTab)selTab.textContent='Your selection ('+selProbs.length+')';
  // Refresh selection view if open
  if(curCustomSubCat==='sel')renderSelectionList();
}

// ── YOUR SELECTION VIEW ───────────────────────────────────────────────────────
function _probBadge(p){
  if(p.isCustom)return{label:'custom',bg:'rgba(122,170,0,0.12)',color:'#5a8000'};
  if(p.isAlgebra)return{label:'algebra',bg:'rgba(159,93,229,0.1)',color:'#7c3aed'};
  var eq=p.eq||'';
  // Geometry (starts with shape name)
  if(/^(Rectangle|Triangle|Square|Parallelogram|Trapezoid|Cube|Rectangular|Triangular|Right triangle)/.test(eq))return{label:'geo',bg:'rgba(121,85,72,0.1)',color:'#5d4037'};
  // Percents
  if(eq.includes('%'))return{label:'%',bg:'rgba(255,193,7,0.12)',color:'#f57f17'};
  // Exponents and roots
  if(/[\u00b2\u00b3\u2070-\u2079\u221a]/.test(eq))return{label:'x\u00b2',bg:'rgba(156,39,176,0.1)',color:'#7b1fa2'};
  // PEMDAS (parentheses or 2+ different operator types without fractions)
  if(eq.includes('(')){return{label:'PEMDAS',bg:'rgba(255,87,34,0.1)',color:'#d84315'};}
  var ops=0;if(eq.includes('+'))ops++;if(eq.includes('\u2212'))ops++;if(eq.includes('\u00d7'))ops++;if(eq.includes('\u00f7'))ops++;
  if(ops>=2&&!eq.includes('/'))return{label:'PEMDAS',bg:'rgba(255,87,34,0.1)',color:'#d84315'};
  // Proportions (has = and x, not algebra)
  if(eq.includes('=')&&eq.includes('x'))return{label:'x:y',bg:'rgba(0,121,107,0.1)',color:'#00695c'};
  // Fractions
  if(eq.includes('/'))return{label:'frac',bg:'rgba(0,150,136,0.1)',color:'#00695c'};
  // Basic operations
  if(eq.includes('\u00d7'))return{label:'\u00d7',bg:'rgba(255,152,0,0.12)',color:'#c05700'};
  if(eq.includes('\u00f7'))return{label:'\u00f7',bg:'rgba(33,150,243,0.1)',color:'#1565c0'};
  if(eq.includes('+'))return{label:'+',bg:'rgba(67,160,71,0.1)',color:'#2e7d32'};
  if(eq.includes('\u2212'))return{label:'\u2212',bg:'rgba(229,57,53,0.1)',color:'#c62828'};
  return{label:'?',bg:'rgba(0,0,0,0.06)',color:'#888'};
}
function renderSelectionList(){
  var c=document.getElementById('custom-sel-view');
  if(!c)return;
  if(selProbs.length===0){
    c.innerHTML='<div style="font-size:12px;color:#bbb;padding:16px 0 4px;">No problems selected yet \u2014 browse Operations and Algebra above to pick some.</div>';
    return;
  }
  c.innerHTML='<div style="font-size:11px;color:#888;margin-bottom:10px;font-weight:700;letter-spacing:0.3px;text-transform:uppercase;">All selected ('+selProbs.length+')</div>'+
    selProbs.map(function(p,i){
      var b=_probBadge(p);
      var eqSafe=(p.eq||'').replace(/'/g,'\\u0027');
      return '<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid rgba(0,0,0,0.05);">'+
        '<span style="font-size:10px;background:'+b.bg+';color:'+b.color+';border-radius:4px;padding:2px 6px;font-weight:700;flex-shrink:0;white-space:nowrap;">'+b.label+'</span>'+
        '<span style="font-size:13px;font-weight:700;flex:1;color:#1a1a24;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+(p.eq||'')+'</span>'+
        '<span style="font-size:11px;color:#888;white-space:nowrap;margin-right:4px;">'+(p.isAlgebra?'x = ':'= ')+fmtFrac(p.ansDisplay||String(p.ans))+'</span>'+
        '<button onclick="removeFromSel(\''+eqSafe+'\')" title="Remove" style="background:rgba(229,57,53,0.08);border:none;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:12px;color:#e53935;flex-shrink:0;padding:0;line-height:1;">\u2715</button>'+
        '</div>';
    }).join('');
}
function removeFromSel(eq){
  selProbs=selProbs.filter(function(p){return p.eq!==eq;});
  var ci=customProbs.findIndex(function(p){return p.eq===eq;});
  if(ci>=0)customProbs.splice(ci,1);
  renderSelectionList();
  renderCustomList();
  updSC();
}
function _applySelViewMode(isSel){
  var sv=document.getElementById('custom-sel-view');
  var ss=document.getElementById('sel-status-row');
  var pp=document.getElementById('pp');
  if(sv)sv.style.display=isSel?'block':'none';
  if(ss)ss.style.display=isSel?'none':'';
  if(pp)pp.style.display=isSel?'none':'';
  if(isSel)renderSelectionList();
}

// ── OPERATION / LEVEL SWITCHING ──────────────────────────────────────────────
function _showOpSubSections(){
  var asl=document.getElementById('addsub-levels');
  var mc=document.getElementById('mul-config');
  var dc=document.getElementById('div-config');
  var fc=document.getElementById('frac-config');
  var pc=document.getElementById('pemdas-config');
  var ec=document.getElementById('exp-config');
  if(asl)asl.style.display=(curOp==='addition'||curOp==='subtraction')?'':'none';
  if(mc)mc.style.display=curOp==='multiplication'?'':'none';
  if(dc)dc.style.display=curOp==='division'?'':'none';
  if(fc)fc.style.display=curOp==='fractions'?'':'none';
  if(pc)pc.style.display=curOp==='pemdas'?'':'none';
  if(ec)ec.style.display=curOp==='exponents'?'':'none';
  var pcc=document.getElementById('pct-config');
  var prc=document.getElementById('prop-config');
  var gc=document.getElementById('geo-config');
  if(pcc)pcc.style.display=curOp==='percents'?'':'none';
  if(prc)prc.style.display=curOp==='proportions'?'':'none';
  if(gc)gc.style.display=curOp==='geometry'?'':'none';
}
function setOp(op,btn){
  curOp=op;
  document.querySelectorAll('#op-tabs .tab').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  _showOpSubSections();
  if(op==='multiplication')buildMulTableGrid();
  if(op==='division')buildDivTableGrid();
  if(op==='pemdas')buildPemdasLvTabs();
  // Show calculator option for skills that benefit from it
  var calcOps=['fractions','percents','proportions','geometry'];
  var cs=document.getElementById('calc-section');
  if(cs)cs.style.display=calcOps.indexOf(op)>=0?'block':'none';
  if(calcOps.indexOf(op)<0){calcEnabled=false;var ct=document.getElementById('calc-toggle');if(ct)ct.checked=false;}
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
  // Uncheck all-facts when switching to multi-digit
  if(mode==='multidigit'){
    mulAllFacts=false;
    var cb=document.getElementById('mul-all-facts');if(cb)cb.checked=false;
  }
  renderProblems();
}
function toggleMulAllFacts(on){
  mulAllFacts=on;
  var mixRow=document.getElementById('mul-mix-orient-row');
  if(mixRow)mixRow.style.display=on?'':'none';
  if(!on){
    mulMixOrient=false;
    var cb=document.getElementById('mul-mix-orient');if(cb)cb.checked=false;
  }
  renderProblems();
}
function toggleMulMixOrient(on){
  mulMixOrient=on;
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

// ── FRACTIONS UI ─────────────────────────────────────────────────────────────
function setFracMode(mode,btn){
  fracMode=mode;
  document.querySelectorAll('#frac-mode-tabs .tab').forEach(function(b){b.classList.remove('active');});
  if(btn)btn.classList.add('active');
  var du=document.getElementById('frac-denom-ui');
  if(du)du.style.display=mode==='addsub'?'':'none';
  renderProblems();
}
function setFracDenom(d,btn){
  fracDenom=d;
  document.querySelectorAll('#frac-denom-tabs .tab').forEach(function(b){b.classList.remove('active');});
  if(btn)btn.classList.add('active');
  renderProblems();
}

// ── PEMDAS UI ────────────────────────────────────────────────────────────────
function buildPemdasLvTabs(){
  var c=document.getElementById('pemdas-lv-tabs');
  if(!c)return;c.innerHTML='';
  [{n:1,l:'L1',s:'No parentheses'},{n:2,l:'L2',s:'With parentheses'},{n:3,l:'L3',s:'With exponents'}].forEach(function(lv){
    var b=document.createElement('button');
    b.className='tab'+(lv.n===pemdasLvl?' active':'');
    b.innerHTML=lv.l+'<br><span style="font-size:9px;opacity:0.6;">'+lv.s+'</span>';
    b.onclick=function(){pemdasLvl=lv.n;document.querySelectorAll('#pemdas-lv-tabs .tab').forEach(function(x){x.classList.remove('active');});b.classList.add('active');renderProblems();};
    c.appendChild(b);
  });
}

// ── EXPONENTS UI ─────────────────────────────────────────────────────────────
function setExpMode(mode,btn){
  expMode=mode;
  document.querySelectorAll('#exp-mode-tabs .tab').forEach(function(b){b.classList.remove('active');});
  if(btn)btn.classList.add('active');
  renderProblems();
}
function setPctMode(mode,btn){
  pctMode=mode;
  document.querySelectorAll('#pct-mode-tabs .tab').forEach(function(b){b.classList.remove('active');});
  if(btn)btn.classList.add('active');
  renderProblems();
}
function setGeoMode(mode,btn){
  geoMode=mode;
  document.querySelectorAll('#geo-mode-tabs .tab').forEach(function(b){b.classList.remove('active');});
  if(btn)btn.classList.add('active');
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
  document.getElementById('calc-section').style.display = (cat === 'alg' || cat === 'custom') ? 'block' : 'none';
  if (modeRow) modeRow.style.display = cat === 'custom' ? 'none' : '';
  var reBtn = document.getElementById('rerandomize-btn');
  if (reBtn) reBtn.style.display = 'none';
  var add10Btn = document.getElementById('add10-btn');
  if (add10Btn) add10Btn.style.display = cat === 'custom' ? '' : 'none';
  if (cat === 'ops') {
    calcEnabled = false;
    var ct = document.getElementById('calc-toggle'); if (ct) ct.checked = false;
    _applySelViewMode(false);
    _showOpSubSections();
    renderProblems();
  } else if (cat === 'alg') {
    buildAlgLvTabs();
    renderAlgProblems();
    _applySelViewMode(false);
  } else {
    calcEnabled = false;
    var ct2 = document.getElementById('calc-toggle'); if (ct2) ct2.checked = false;
    curMode = 'custom';
    curCustomSubCat = 'ops';
    _styleSubBtns('ops');
    _applySelViewMode(false);
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
  var sel = document.getElementById('custom-sub-sel');
  [ops, alg, sel].forEach(function(b, i) {
    if (!b) return;
    var isActive = (active === 'ops' && i === 0) || (active === 'alg' && i === 1) || (active === 'sel' && i === 2);
    b.style.borderColor = isActive ? 'rgba(184,224,48,0.6)' : 'rgba(0,0,0,0.09)';
    b.style.background = isActive ? 'rgba(184,224,48,0.12)' : 'var(--white)';
    b.style.color = isActive ? '#b8e030' : '#666';
  });
}

function setCustomSubCat(cat, btn) {
  curCustomSubCat = cat;
  _styleSubBtns(cat);
  if (cat === 'sel') {
    // Hide generated bank UI, show the selection list
    document.getElementById('ops-section').style.display = 'none';
    document.getElementById('alg-section').style.display = 'none';
    document.getElementById('calc-section').style.display = 'none';
    _applySelViewMode(true);
    return;
  }
  // Back to ops or alg — restore normal bank view
  _applySelViewMode(false);
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
  // Keep existing selections, show the combined pool
  renderProbList([].concat(customProbs, allProbs), selProbs.map(function(p){return p.eq;}));
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
  var eq = formatExponents(eqInput.value.trim());
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
    if (curCustomSubCat === 'sel') { renderSelectionList(); } else { renderProbList([].concat(customProbs,allProbs), selProbs.map(function(p){return p.eq;})); }
  } else {
    allProbs = [].concat(customProbs);
    selProbs = [].concat(customProbs);
    renderCustomList();
    renderProbList(allProbs, selProbs.map(function(p){return p.eq;}));
  }
  updSC();
}

function removeCustomProb(idx) {
  customProbs.splice(idx, 1);
  if (curCat === 'custom') {
    selProbs = [].concat(customProbs, selProbs.filter(function(p){return !p.isCustom;}));
    renderCustomList();
    if (curCustomSubCat === 'sel') { renderSelectionList(); } else { renderProbList([].concat(customProbs,allProbs), selProbs.map(function(p){return p.eq;})); }
  } else {
    allProbs = [].concat(customProbs);
    selProbs = [].concat(customProbs);
    renderCustomList();
    renderProbList(allProbs, selProbs.map(function(p){return p.eq;}));
  }
  updSC();
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
