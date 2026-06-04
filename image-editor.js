// ── SEARCH ────────────────────────────────────────────────────────────────────
async function searchPhotos(){
  const q=document.getElementById('si').value.trim();if(!q)return;
  const btn=document.getElementById('sb');btn.disabled=true;btn.textContent='Searching...';
  const grid=document.getElementById('pg');grid.innerHTML='<div class="photo-empty">Loading...</div>';
  try{
    const r=await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=9&orientation=squarish`,{headers:{Authorization:`Client-ID ${UK}`}});
    const d=await r.json();grid.innerHTML='';
    if(!d.results||!d.results.length){grid.innerHTML='<div class="photo-empty">No photos found.</div>';return;}
    d.results.forEach(p=>{
      const t=document.createElement('div');t.className='photo-thumb';
      t.innerHTML=`<img src="${p.urls.small}" loading="lazy"><div class="chk">✓</div>`;
      t.onclick=()=>loadEditorImage(p.urls.regular,t);
      grid.appendChild(t);
    });
  }catch(e){grid.innerHTML='<div class="photo-empty">Search failed. Try again.</div>';}
  finally{btn.disabled=false;btn.textContent='Search';}
}
document.getElementById('si').addEventListener('keydown',e=>{if(e.key==='Enter')searchPhotos();});
function handleUpload(ev){const f=ev.target.files[0];if(!f)return;const r=new FileReader();r.onload=e=>loadEditorImage(e.target.result,null);r.readAsDataURL(f);}

function loadEditorImage(url,thumb){
  document.querySelectorAll('.photo-thumb').forEach(t=>t.classList.remove('selected'));
  if(thumb)thumb.classList.add('selected');
  selImgUrl=url;croppedDataUrl=null;editorReady=false;
  document.getElementById('epw-msg').style.display='block';
  document.getElementById('ec').style.display='none';
  // show editor panel first
  document.getElementById('img-picker').style.display='none';
  document.getElementById('img-editor').classList.add('active');
  // reset aspect to square
  edAR={w:1,h:1};
  document.querySelectorAll('.aspect-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('asp-sq').classList.add('active');
  // load image
  const i=new Image();i.crossOrigin='anonymous';
  i.onload=()=>{edImg=i;editorReady=true;document.getElementById('epw-msg').style.display='none';document.getElementById('ec').style.display='block';requestAnimationFrame(()=>fillImage());};
  i.onerror=()=>{
    // retry without crossOrigin for data URLs
    const i2=new Image();
    i2.onload=()=>{edImg=i2;editorReady=true;document.getElementById('epw-msg').style.display='none';document.getElementById('ec').style.display='block';fillImage();};
    i2.onerror=()=>{document.getElementById('epw-msg').textContent='Failed to load image. Try uploading instead.';};
    i2.src=url;
  };
  i.src=url;
}

function clearImage(){
  selImgUrl=null;croppedDataUrl=null;edImg=null;editorReady=false;
  document.getElementById('img-picker').style.display='block';
  document.getElementById('img-editor').classList.remove('active');
  document.getElementById('img-editor').style.border='';
  document.getElementById('ec').style.display='none';
  document.getElementById('epw-msg').textContent='Loading image...';
  document.getElementById('epw-msg').style.display='block';
  document.querySelectorAll('.photo-thumb').forEach(t=>t.classList.remove('selected'));
}

// ── EDITOR ─────────────────────────────────────────────────────────────────────
function getCanvasSize(){
  const epw=document.getElementById('epw');
  const w=epw.clientWidth||300;
  const ratio=edAR.w/edAR.h;
  return{w,h:Math.round(w/ratio)};
}

function fillImage(){
  if(!edImg||!editorReady)return;
  const epwEl=document.getElementById('epw');
  const cw=epwEl.offsetWidth||epwEl.clientWidth||300;
  const ch=Math.round(cw/(edAR.w/edAR.h));
  const scaleW=cw/edImg.width,scaleH=ch/edImg.height;
  const scale=Math.max(scaleW,scaleH)*100;
  edZoom=Math.round(scale);edPanX=0;edPanY=0;
  setSlider(edZoom);renderEditor();
}

function fitImage(){
  if(!edImg||!editorReady)return;
  const epwEl=document.getElementById('epw');
  const cw=epwEl.offsetWidth||epwEl.clientWidth||300;
  const ch=Math.round(cw/(edAR.w/edAR.h));
  const scaleW=cw/edImg.width,scaleH=ch/edImg.height;
  const scale=Math.min(scaleW,scaleH)*100;
  edZoom=Math.round(scale);edPanX=0;edPanY=0;
  setSlider(edZoom);renderEditor();
}

function setSlider(z){
  const sl=document.getElementById('zoom-sl');
  sl.min=1;sl.max=Math.max(500,z*2);sl.value=z;
  document.getElementById('zoom-val').textContent=z+'%';
}

function onZoomSlider(v){edZoom=parseInt(v);document.getElementById('zoom-val').textContent=v+'%';renderEditor();}

function setAspect(w,h,btn){
  edAR={w,h};
  document.querySelectorAll('.aspect-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  if(edImg&&editorReady)fillImage();
}

function renderEditor(){
  if(!edImg||!editorReady)return;
  const ec=document.getElementById('ec');
  const{w,h}=getCanvasSize();
  ec.width=w;ec.height=h;
  const ctx=ec.getContext('2d');
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle='#1a1a1a';ctx.fillRect(0,0,w,h);
  // zoom is a percentage of canvas width per image width
  const scale=(edZoom/100)*(w/edImg.width);
  const dw=edImg.width*scale;
  const dh=edImg.height*scale;
  const dx=(w-dw)/2+edPanX;
  const dy=(h-dh)/2+edPanY;
  ctx.drawImage(edImg,dx,dy,dw,dh);
}

function cropDone(){
  if(!edImg||!editorReady)return;
  const ec=document.getElementById('ec');
  croppedDataUrl=ec.toDataURL('image/jpeg',0.92);
  document.getElementById('img-editor').style.border='1px solid rgba(122,170,0,0.4)';
}

// pan
const epwEl=document.getElementById('epw');
epwEl.addEventListener('mousedown',e=>{if(!editorReady)return;isDragging=true;dragSX=e.clientX;dragSY=e.clientY;dragPX=edPanX;dragPY=edPanY;e.preventDefault();});
window.addEventListener('mousemove',e=>{if(!isDragging)return;edPanX=dragPX+(e.clientX-dragSX);edPanY=dragPY+(e.clientY-dragSY);renderEditor();});
window.addEventListener('mouseup',()=>isDragging=false);
epwEl.addEventListener('touchstart',e=>{if(!editorReady)return;const t=e.touches[0];isDragging=true;dragSX=t.clientX;dragSY=t.clientY;dragPX=edPanX;dragPY=edPanY;},{passive:true});
window.addEventListener('touchmove',e=>{if(!isDragging)return;const t=e.touches[0];edPanX=dragPX+(t.clientX-dragSX);edPanY=dragPY+(t.clientY-dragSY);renderEditor();},{passive:true});
window.addEventListener('touchend',()=>isDragging=false);
