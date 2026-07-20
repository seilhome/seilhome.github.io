const floorMap={floor84a:['images/floor84a.jpg','84A 타입 평면도'],floor84b:['images/floor84b.jpg','84B 타입 평면도'],floor84c:['images/floor84c.jpg','84C 타입 평면도'],floor84d:['images/floor84d.jpg','84D 타입 평면도'],floor84e:['images/floor84e.jpg','84E 타입 평면도'],floor117a:['images/floor117a.jpg','117A 타입 평면도'],floor117b:['images/floor117b.jpg','117B 타입 평면도'],floor125a:['images/floor125a.jpg','125A 타입 평면도']};

document.querySelectorAll('.tabs button').forEach(btn=>{btn.addEventListener('click',()=>{document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');const [src,alt]=floorMap[btn.dataset.floor];const img=document.getElementById('floorImage');img.src=src;img.alt=alt;});});

const viewer=document.getElementById('viewer');
const viewerInner=document.querySelector('.viewerInner');
const viewerImg=document.getElementById('viewerImg');
let zoomState={scale:1,x:0,y:0,startX:0,startY:0,startScale:1,startDist:0,startMidX:0,startMidY:0,lastTap:0,isDragging:false,pointerId:null};
function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
function applyZoom(){viewerImg.style.transform=`translate3d(${zoomState.x}px, ${zoomState.y}px, 0) scale(${zoomState.scale})`;}
function resetZoom(){zoomState={scale:1,x:0,y:0,startX:0,startY:0,startScale:1,startDist:0,startMidX:0,startMidY:0,lastTap:0,isDragging:false,pointerId:null};applyZoom();viewerInner?.classList.remove('dragging');}
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
function setZoomScale(next,focusX,focusY){
  const old=zoomState.scale;
  const target=clamp(next,1,8);
  if(typeof focusX==='number'&&typeof focusY==='number'&&old>0){
    const rect=viewerInner.getBoundingClientRect();
    const cx=focusX-(rect.left+rect.width/2);
    const cy=focusY-(rect.top+rect.height/2);
    const ratio=target/old;
    zoomState.x=cx-(cx-zoomState.x)*ratio;
    zoomState.y=cy-(cy-zoomState.y)*ratio;
  }
  zoomState.scale=target;
  if(target===1){zoomState.x=0;zoomState.y=0;}
  applyZoom();
}
if(zoomInBtn) zoomInBtn.addEventListener('click',e=>{e.stopPropagation();setZoomScale(zoomState.scale+0.75);});
if(zoomOutBtn) zoomOutBtn.addEventListener('click',e=>{e.stopPropagation();setZoomScale(zoomState.scale-0.75);});
if(zoomResetBtn) zoomResetBtn.addEventListener('click',e=>{e.stopPropagation();resetZoom();});
viewer.addEventListener('click',e=>{if(e.target===viewer)closeViewer();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeViewer();});

if(viewerInner){
  // PC: 마우스로 이미지를 잡아 끌면 넉넉하게 이동
  viewerInner.addEventListener('pointerdown',e=>{
    if(!viewer.classList.contains('active')||e.pointerType==='touch'||e.button!==0) return;
    zoomState.isDragging=true; zoomState.pointerId=e.pointerId;
    zoomState.startX=e.clientX-zoomState.x; zoomState.startY=e.clientY-zoomState.y;
    viewerInner.setPointerCapture?.(e.pointerId); viewerInner.classList.add('dragging'); e.preventDefault();
  });
  viewerInner.addEventListener('pointermove',e=>{
    if(!zoomState.isDragging||zoomState.pointerId!==e.pointerId) return;
    const moveBoost=1.35;
    zoomState.x+=(e.clientX-(zoomState.startX+zoomState.x))*moveBoost;
    zoomState.y+=(e.clientY-(zoomState.startY+zoomState.y))*moveBoost;
    zoomState.startX=e.clientX-zoomState.x; zoomState.startY=e.clientY-zoomState.y;
    applyZoom(); e.preventDefault();
  });
  const endDrag=e=>{if(zoomState.pointerId===e.pointerId){zoomState.isDragging=false;zoomState.pointerId=null;viewerInner.classList.remove('dragging');}};
  viewerInner.addEventListener('pointerup',endDrag); viewerInner.addEventListener('pointercancel',endDrag);

  // 모바일: 한 손가락 이동, 두 손가락 확대/이동
  viewerInner.addEventListener('touchstart',e=>{
    if(!viewer.classList.contains('active')) return;
    if(e.touches.length===1){
      const now=Date.now();
      if(now-zoomState.lastTap<280){setZoomScale(zoomState.scale>1?1:2.5,e.touches[0].clientX,e.touches[0].clientY);e.preventDefault();}
      zoomState.lastTap=now; zoomState.startX=e.touches[0].clientX-zoomState.x; zoomState.startY=e.touches[0].clientY-zoomState.y;
    }else if(e.touches.length===2){
      zoomState.startDist=touchDistance(e.touches); zoomState.startScale=zoomState.scale;
      const mid=touchMid(e.touches); zoomState.startMidX=mid.x; zoomState.startMidY=mid.y; e.preventDefault();
    }
  },{passive:false});
  viewerInner.addEventListener('touchmove',e=>{
    if(!viewer.classList.contains('active')) return;
    if(e.touches.length===2){
      const dist=touchDistance(e.touches),mid=touchMid(e.touches);
      zoomState.scale=clamp(zoomState.startScale*(dist/zoomState.startDist),1,8);
      zoomState.x+=(mid.x-zoomState.startMidX)*1.15; zoomState.y+=(mid.y-zoomState.startMidY)*1.15;
      zoomState.startMidX=mid.x; zoomState.startMidY=mid.y;
      if(zoomState.scale===1){zoomState.x=0;zoomState.y=0;} applyZoom(); e.preventDefault();
    }else if(e.touches.length===1){
      zoomState.x=e.touches[0].clientX-zoomState.startX; zoomState.y=e.touches[0].clientY-zoomState.startY;
      applyZoom(); e.preventDefault();
    }
  },{passive:false});
  viewerInner.addEventListener('wheel',e=>{
    if(!viewer.classList.contains('active')) return; e.preventDefault();
    setZoomScale(zoomState.scale+(e.deltaY<0?0.35:-0.35),e.clientX,e.clientY);
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

function bindLeadForm(formId){
  const form=document.getElementById(formId);
  if(!form) return;
  form.addEventListener('submit',async(e)=>{
    e.preventDefault();
    const data=Object.fromEntries(new FormData(form).entries());
    data.visit=[data.visitDate||'',data.visitTime||''].filter(Boolean).join(' ');
    data.createdAt=new Date().toLocaleString('ko-KR');
    const sourceMap={quickLeadForm:'상단 간편상담',leadForm:'상세 상담신청',donghoLeadForm:'우측 상단 동호수 상담',priceLeadForm:'분양가표 전송 요청'};
    data.source=sourceMap[formId]||'홈페이지 상담신청';
    const submit=form.querySelector('button[type="submit"]');
    const btnText=submit.querySelector('.btnText');
    const originalText=btnText?btnText.textContent:'';
    submit.disabled=true;
    submit.classList.add('loading');
    if(btnText) btnText.textContent='접수 중입니다';
    try{
      await fetch(GOOGLE_SCRIPT_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
      form.reset();
      document.querySelectorAll('.leadModal.active').forEach(modal=>{modal.classList.remove('active');modal.setAttribute('aria-hidden','true');});
      document.body.classList.remove('popupOpen');
      showSuccess();
      trackEvent('lead_submit_success',{event_category:'lead',event_label:data.source,type:data.type||'',visit:data.visit||''});
    }catch(err){
      alert('접수 중 오류가 발생했습니다. 010-6383-5879로 연락 부탁드립니다.');
    }finally{
      submit.disabled=false;
      submit.classList.remove('loading');
      if(btnText) btnText.textContent=originalText;
    }
  });
}
bindLeadForm('leadForm');
bindLeadForm('quickLeadForm');
bindLeadForm('donghoLeadForm');
bindLeadForm('priceLeadForm');

// 상담신청 모달
document.querySelectorAll('[data-lead-modal]').forEach(trigger=>{
  trigger.addEventListener('click',()=>{
    const modal=document.getElementById(trigger.dataset.leadModal);
    if(!modal) return;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('popupOpen');
    setTimeout(()=>modal.querySelector('input[name="name"]')?.focus(),100);
    trackEvent('lead_modal_open',{event_category:'lead',event_label:trigger.dataset.leadModal});
  });
});
document.querySelectorAll('[data-lead-modal-close]').forEach(el=>{
  el.addEventListener('click',()=>{
    const modal=el.closest('.leadModal');
    if(!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden','true');
    document.body.classList.remove('popupOpen');
  });
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape') document.querySelectorAll('.leadModal.active').forEach(modal=>{modal.classList.remove('active');modal.setAttribute('aria-hidden','true');document.body.classList.remove('popupOpen');});
});


// 분양가 버튼: 팝업 대신 페이지 안의 문의 폼으로 이동
 document.querySelectorAll('.priceLink').forEach(link=>{
  link.addEventListener('click',()=>{
    setTimeout(()=>{
      const formBox=document.getElementById('priceForm');
      if(formBox){
        formBox.focus({preventScroll:true});
        formBox.querySelector('input[name="name"]')?.focus({preventScroll:true});
      }
    },450);
    trackEvent('price_inquiry_click',{event_category:'interest',event_label:'분양가표 인라인 문의'});
  });
});
