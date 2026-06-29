const floorMap={floor84a:['images/floor84a.jpg','84A 타입 평면도'],floor84b:['images/floor84b.jpg','84B 타입 평면도'],floor84c:['images/floor84c.jpg','84C 타입 평면도'],floor84d:['images/floor84d.jpg','84D 타입 평면도'],floor84e:['images/floor84e.jpg','84E 타입 평면도'],floor117a:['images/floor117a.jpg','117A 타입 평면도'],floor117b:['images/floor117b.jpg','117B 타입 평면도'],floor125a:['images/floor125a.jpg','125A 타입 평면도']};

document.querySelectorAll('.tabs button').forEach(btn=>{btn.addEventListener('click',()=>{document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');const [src,alt]=floorMap[btn.dataset.floor];const img=document.getElementById('floorImage');img.src=src;img.alt=alt;});});

const viewer=document.getElementById('viewer');
const viewerInner=document.querySelector('.viewerInner');
const viewerImg=document.getElementById('viewerImg');
let zoomState={scale:1,x:0,y:0,startX:0,startY:0,startScale:1,startDist:0,startMidX:0,startMidY:0,lastTap:0};
function applyZoom(){viewerImg.style.transform=`translate(${zoomState.x}px, ${zoomState.y}px) scale(${zoomState.scale})`;}
function resetZoom(){zoomState={scale:1,x:0,y:0,startX:0,startY:0,startScale:1,startDist:0,startMidX:0,startMidY:0,lastTap:0};applyZoom();if(viewerInner){viewerInner.scrollLeft=0;viewerInner.scrollTop=0;}}
function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
function touchDistance(touches){const dx=touches[0].clientX-touches[1].clientX;const dy=touches[0].clientY-touches[1].clientY;return Math.hypot(dx,dy);}
function touchMid(touches){return {x:(touches[0].clientX+touches[1].clientX)/2,y:(touches[0].clientY+touches[1].clientY)/2};}
function openViewer(src,alt){resetZoom();viewerImg.src=src;viewerImg.alt=alt||'확대 이미지';viewer.classList.add('active');viewer.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}
function closeViewer(){viewer.classList.remove('active');viewer.setAttribute('aria-hidden','true');viewerImg.src='';document.body.style.overflow='';resetZoom();}
document.querySelectorAll('[data-zoom]').forEach(img=>{img.style.cursor='zoom-in';img.addEventListener('click',()=>openViewer(img.currentSrc||img.src,img.alt));});
document.querySelectorAll('.imageBtn').forEach(btn=>{btn.addEventListener('click',()=>openViewer(btn.dataset.img,btn.dataset.title));});
document.getElementById('closeViewer').addEventListener('click',closeViewer);
const zoomInBtn=document.getElementById('zoomIn');
const zoomOutBtn=document.getElementById('zoomOut');
const zoomResetBtn=document.getElementById('zoomReset');
function setZoomScale(next){
  zoomState.scale=clamp(next,1,5);
  if(zoomState.scale===1){zoomState.x=0;zoomState.y=0;}
  applyZoom();
}
if(zoomInBtn) zoomInBtn.addEventListener('click',e=>{e.stopPropagation();setZoomScale(zoomState.scale+0.6);});
if(zoomOutBtn) zoomOutBtn.addEventListener('click',e=>{e.stopPropagation();setZoomScale(zoomState.scale-0.6);});
if(zoomResetBtn) zoomResetBtn.addEventListener('click',e=>{e.stopPropagation();resetZoom();});
viewer.addEventListener('click',e=>{if(e.target===viewer)closeViewer();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeViewer();});

if(viewerInner){
  viewerInner.addEventListener('touchstart',e=>{
    if(!viewer.classList.contains('active')) return;
    if(e.touches.length===1){
      const now=Date.now();
      if(now-zoomState.lastTap<280){
        zoomState.scale=zoomState.scale>1?1:2.2; zoomState.x=0; zoomState.y=0; applyZoom(); e.preventDefault();
      }
      zoomState.lastTap=now;
      zoomState.startX=e.touches[0].clientX-zoomState.x;
      zoomState.startY=e.touches[0].clientY-zoomState.y;
    }
    if(e.touches.length===2){
      zoomState.startDist=touchDistance(e.touches);
      zoomState.startScale=zoomState.scale;
      const mid=touchMid(e.touches);
      zoomState.startMidX=mid.x;
      zoomState.startMidY=mid.y;
      e.preventDefault();
    }
  },{passive:false});
  viewerInner.addEventListener('touchmove',e=>{
    if(!viewer.classList.contains('active')) return;
    if(e.touches.length===2){
      const dist=touchDistance(e.touches);
      const mid=touchMid(e.touches);
      const nextScale=clamp(zoomState.startScale*(dist/zoomState.startDist),1,5);
      zoomState.x += (mid.x-zoomState.startMidX)*0.35;
      zoomState.y += (mid.y-zoomState.startMidY)*0.35;
      zoomState.startMidX=mid.x; zoomState.startMidY=mid.y;
      zoomState.scale=nextScale;
      if(zoomState.scale===1){zoomState.x=0;zoomState.y=0;}
      applyZoom();
      e.preventDefault();
    }else if(e.touches.length===1 && zoomState.scale>1){
      zoomState.x=e.touches[0].clientX-zoomState.startX;
      zoomState.y=e.touches[0].clientY-zoomState.startY;
      applyZoom();
      e.preventDefault();
    }
  },{passive:false});
  viewerInner.addEventListener('wheel',e=>{
    if(!viewer.classList.contains('active')) return;
    e.preventDefault();
    const delta=e.deltaY<0?0.18:-0.18;
    zoomState.scale=clamp(zoomState.scale+delta,1,5);
    if(zoomState.scale===1){zoomState.x=0;zoomState.y=0;}
    applyZoom();
  },{passive:false});
}


function trackEvent(eventName, params){
  if (typeof gtag === 'function') {
    gtag('event', eventName, params || {});
  }
}
document.querySelectorAll('a[href^="tel:"]').forEach(link=>{
  link.addEventListener('click',()=>trackEvent('phone_click',{event_category:'lead',event_label:'전화상담'}));
});
document.querySelectorAll('a[href="#reservation"], .apply').forEach(link=>{
  link.addEventListener('click',()=>trackEvent('reservation_click',{event_category:'lead',event_label:'상담신청 버튼'}));
});

const GOOGLE_SCRIPT_URL='https://script.google.com/macros/s/AKfycbwrbnYlh5Iij8kS6uiy2dI9M-wvS5caQ-8hmdZgwP8FJ9J5coTN9EQpLBEQI-pzzPiM/exec';

const dateInput=document.querySelector('input[name="visitDate"]');
if(dateInput){
  const today=new Date();
  const yyyy=today.getFullYear();
  const mm=String(today.getMonth()+1).padStart(2,'0');
  const dd=String(today.getDate()).padStart(2,'0');
  dateInput.min=`${yyyy}-${mm}-${dd}`;
}

const successModal=document.getElementById('successModal');
const successClose=document.getElementById('successClose');
function showSuccess(){successModal.classList.add('active');successModal.setAttribute('aria-hidden','false');}
function hideSuccess(){successModal.classList.remove('active');successModal.setAttribute('aria-hidden','true');}
if(successClose) successClose.addEventListener('click',hideSuccess);
if(successModal) successModal.addEventListener('click',e=>{if(e.target===successModal)hideSuccess();});

document.getElementById('leadForm').addEventListener('submit',async(e)=>{
  e.preventDefault();
  const form=e.currentTarget;
  const data=Object.fromEntries(new FormData(form).entries());
  data.visit=[data.visitDate||'',data.visitTime||''].filter(Boolean).join(' ');
  data.createdAt=new Date().toLocaleString('ko-KR');
  const submit=form.querySelector('button[type="submit"]');
  const btnText=submit.querySelector('.btnText');
  submit.disabled=true;
  submit.classList.add('loading');
  if(btnText) btnText.textContent='접수 중입니다';
  try{
    await fetch(GOOGLE_SCRIPT_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    form.reset();
    showSuccess();
    trackEvent('lead_submit_success',{event_category:'lead',event_label:'상담신청 완료',type:data.type||'',visit:data.visit||''});
  }catch(err){
    alert('접수 중 오류가 발생했습니다. 대표번호 033-760-5990으로 연락 부탁드립니다.');
  }finally{
    submit.disabled=false;
    submit.classList.remove('loading');
    if(btnText) btnText.textContent='상담 신청하기';
  }
});
