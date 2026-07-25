const floorMap={floor84a:['images/floor84a.jpg','84A 타입 평면도'],floor84b:['images/floor84b.jpg','84B 타입 평면도'],floor84c:['images/floor84c.jpg','84C 타입 평면도'],floor84d:['images/floor84d.jpg','84D 타입 평면도'],floor84e:['images/floor84e.jpg','84E 타입 평면도'],floor117a:['images/floor117a.jpg','117A 타입 평면도'],floor117b:['images/floor117b.jpg','117B 타입 평면도'],floor125a:['images/floor125a.jpg','125A 타입 평면도']};

document.querySelectorAll('.tabs button').forEach(btn=>{btn.addEventListener('click',()=>{document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');const [src,alt]=floorMap[btn.dataset.floor];const img=document.getElementById('floorImage');img.src=src;img.alt=alt;});});

const viewer=document.getElementById('viewer');
const viewerInner=document.querySelector('.viewerInner');
const viewerImg=document.getElementById('viewerImg');
let zoomState={scale:1,x:0,y:0,startX:0,startY:0,startScale:1,startDist:0,startMidX:0,startMidY:0,lastTap:0,isDragging:false,pointerId:null,raf:null};
function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
function constrainPan(){
  if(!viewerInner||!viewerImg) return;
  const scaledW=viewerImg.offsetWidth*zoomState.scale;
  const scaledH=viewerImg.offsetHeight*zoomState.scale;
  const viewportW=viewerInner.clientWidth;
  const viewportH=viewerInner.clientHeight;
  const minVisible=Math.min(120, Math.max(60, Math.min(scaledW,scaledH)*0.22));
  const maxX=Math.max(0,(scaledW+viewportW)/2-minVisible);
  const maxY=Math.max(0,(scaledH+viewportH)/2-minVisible);
  zoomState.x=clamp(zoomState.x,-maxX,maxX);
  zoomState.y=clamp(zoomState.y,-maxY,maxY);
}
function renderZoom(){
  constrainPan();
  viewerImg.style.transform=`translate3d(${zoomState.x}px, ${zoomState.y}px, 0) scale(${zoomState.scale})`;
  if(zoomResetBtn) zoomResetBtn.textContent=`${Math.round(zoomState.scale*100)}%`;
}
function applyZoom(){
  if(zoomState.raf) cancelAnimationFrame(zoomState.raf);
  zoomState.raf=requestAnimationFrame(()=>{zoomState.raf=null;renderZoom();});
}
function resetZoom(){
  if(zoomState.raf) cancelAnimationFrame(zoomState.raf);
  zoomState={scale:1,x:0,y:0,startX:0,startY:0,startScale:1,startDist:0,startMidX:0,startMidY:0,lastTap:0,isDragging:false,pointerId:null,raf:null};
  renderZoom();viewerInner?.classList.remove('dragging');
}
function touchDistance(touches){const dx=touches[0].clientX-touches[1].clientX;const dy=touches[0].clientY-touches[1].clientY;return Math.hypot(dx,dy);}
function touchMid(touches){return {x:(touches[0].clientX+touches[1].clientX)/2,y:(touches[0].clientY+touches[1].clientY)/2};}
function openViewer(src,alt){resetZoom();viewerImg.src=src;viewerImg.alt=alt||'확대 이미지';viewer.classList.add('active');viewer.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';viewerImg.onload=()=>{resetZoom();};}
function closeViewer(){viewer.classList.remove('active');viewer.setAttribute('aria-hidden','true');viewerImg.src='';document.body.style.overflow='';resetZoom();}
document.querySelectorAll('[data-zoom]').forEach(img=>{img.style.cursor='zoom-in';img.addEventListener('click',()=>openViewer(img.currentSrc||img.src,img.alt));});
document.querySelectorAll('.imageBtn').forEach(btn=>{btn.addEventListener('click',()=>openViewer(btn.dataset.img,btn.dataset.title));});
document.getElementById('closeViewer').addEventListener('click',closeViewer);
const zoomInBtn=document.getElementById('zoomIn');
const zoomOutBtn=document.getElementById('zoomOut');
const zoomResetBtn=document.getElementById('zoomReset');
function setZoomScale(next,focusX,focusY){
  const old=zoomState.scale;
  const target=clamp(next,0.25,8);
  if(typeof focusX==='number'&&typeof focusY==='number'&&old>0){
    const rect=viewerInner.getBoundingClientRect();
    const cx=focusX-(rect.left+rect.width/2);
    const cy=focusY-(rect.top+rect.height/2);
    const ratio=target/old;
    zoomState.x=cx-(cx-zoomState.x)*ratio;
    zoomState.y=cy-(cy-zoomState.y)*ratio;
  }
  zoomState.scale=target;
  applyZoom();
}
if(zoomInBtn) zoomInBtn.addEventListener('click',e=>{e.stopPropagation();setZoomScale(zoomState.scale+0.25);});
if(zoomOutBtn) zoomOutBtn.addEventListener('click',e=>{e.stopPropagation();setZoomScale(zoomState.scale-0.25);});
if(zoomResetBtn) zoomResetBtn.addEventListener('click',e=>{e.stopPropagation();resetZoom();});
viewer.addEventListener('click',e=>{if(e.target===viewer)closeViewer();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeViewer();});
window.addEventListener('resize',applyZoom);

if(viewerInner){
  const activePointers=new Map();
  let pinchStartDistance=0;
  let pinchStartScale=1;
  let pinchStartX=0;
  let pinchStartY=0;
  let pinchCenterX=0;
  let pinchCenterY=0;

  function pointerDistance(){
    const pts=[...activePointers.values()];
    if(pts.length<2) return 0;
    return Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
  }
  function pointerCenter(){
    const pts=[...activePointers.values()];
    if(pts.length<2) return {x:0,y:0};
    return {x:(pts[0].x+pts[1].x)/2,y:(pts[0].y+pts[1].y)/2};
  }
  function finishPointer(e){
    activePointers.delete(e.pointerId);
    try{viewerInner.releasePointerCapture?.(e.pointerId);}catch(_){ }
    if(activePointers.size===1){
      const remaining=[...activePointers.entries()][0];
      zoomState.pointerId=remaining[0];
      zoomState.startX=remaining[1].x-zoomState.x;
      zoomState.startY=remaining[1].y-zoomState.y;
      zoomState.isDragging=true;
    }else if(activePointers.size===0){
      zoomState.isDragging=false;
      zoomState.pointerId=null;
      viewerInner.classList.remove('dragging');
      applyZoom();
    }
  }

  viewerInner.addEventListener('pointerdown',e=>{
    if(!viewer.classList.contains('active')) return;
    if(e.pointerType==='mouse'&&e.button!==0) return;
    activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    viewerInner.setPointerCapture?.(e.pointerId);

    if(activePointers.size===1){
      zoomState.pointerId=e.pointerId;
      zoomState.startX=e.clientX-zoomState.x;
      zoomState.startY=e.clientY-zoomState.y;
      zoomState.isDragging=true;
      if(zoomState.isDragging) viewerInner.classList.add('dragging');
    }else if(activePointers.size===2){
      pinchStartDistance=pointerDistance();
      pinchStartScale=zoomState.scale;
      pinchStartX=zoomState.x;
      pinchStartY=zoomState.y;
      const c=pointerCenter();
      pinchCenterX=c.x;
      pinchCenterY=c.y;
      zoomState.isDragging=false;
    }
    e.preventDefault();
  });

  viewerInner.addEventListener('pointermove',e=>{
    if(!activePointers.has(e.pointerId)) return;
    activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});

    if(activePointers.size===2){
      const distance=pointerDistance();
      const center=pointerCenter();
      const nextScale=clamp(pinchStartScale*(distance/Math.max(1,pinchStartDistance)),0.25,8);
      zoomState.scale=nextScale;
      const rect=viewerInner.getBoundingClientRect();
      const localStartX=pinchCenterX-(rect.left+rect.width/2);
      const localStartY=pinchCenterY-(rect.top+rect.height/2);
      const ratio=nextScale/pinchStartScale;
      zoomState.x=localStartX-(localStartX-pinchStartX)*ratio+(center.x-pinchCenterX);
      zoomState.y=localStartY-(localStartY-pinchStartY)*ratio+(center.y-pinchCenterY);
      applyZoom();
      e.preventDefault();
      return;
    }

    if(activePointers.size===1&&zoomState.pointerId===e.pointerId){
      zoomState.isDragging=true;
      viewerInner.classList.add('dragging');
      zoomState.x=e.clientX-zoomState.startX;
      zoomState.y=e.clientY-zoomState.startY;
      applyZoom();
      e.preventDefault();
    }
  });

  viewerInner.addEventListener('pointerup',finishPointer);
  viewerInner.addEventListener('pointercancel',finishPointer);
  viewerInner.addEventListener('lostpointercapture',e=>{if(activePointers.has(e.pointerId))finishPointer(e);});

  viewerInner.addEventListener('dblclick',e=>{
    if(e.pointerType==='touch') return;
    setZoomScale(zoomState.scale>1?1:2.5,e.clientX,e.clientY);
    e.preventDefault();
  });

  viewerInner.addEventListener('wheel',e=>{
    if(!viewer.classList.contains('active')) return;
    e.preventDefault();
    setZoomScale(zoomState.scale+(e.deltaY<0?0.15:-0.15),e.clientX,e.clientY);
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

const GOOGLE_SCRIPT_URL='https://script.google.com/macros/s/AKfycbxYqhkvH2eukcBeTNOMWkDoNFfEoEE6gi8nTnmnU_b4pAWcxVzXyREayWSswOREyTif/exec';

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
function showSuccess(source){
  const title=successModal?.querySelector('h3');
  const desc=successModal?.querySelector('p');
  if(source==='견본주택 주소 문자 요청'){
    if(title) title.textContent='주소 안내 요청이 접수되었습니다';
    if(desc) desc.textContent='입력하신 연락처로 견본주택 주소와 주차 위치를 안내해드리겠습니다.';
  }else if(source==='분양가표 전송 요청'){
    if(title) title.textContent='분양가표 문자를 전송했습니다';
    if(desc) desc.textContent='입력하신 휴대폰에서 문자 메시지를 확인해 주세요. 도착까지 잠시 걸릴 수 있습니다.';
  }else{
    if(title) title.textContent='신청이 정상 접수되었습니다';
    if(desc) desc.textContent='입력하신 연락처를 확인한 뒤 담당자가 안내드리겠습니다.';
  }
  successModal.classList.add('active');successModal.setAttribute('aria-hidden','false');
}
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
    const sourceMap={quickLeadForm:'상단 간편상담',leadForm:'상세 상담신청',donghoLeadForm:'우측 상단 동호수 상담',priceLeadForm:'분양가표 전송 요청',addressSmsForm:'견본주택 주소 문자 요청'};
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
      showSuccess(data.source);
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
bindLeadForm('addressSmsForm');

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
