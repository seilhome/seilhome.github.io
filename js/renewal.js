'use strict';

(() => {
  // The existing Apps Script endpoint and payload labels are preserved.
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxYqhkvH2eukcBeTNOMWkDoNFfEoEE6gi8nTnmnU_b4pAWcxVzXyREayWSswOREyTif/exec';
  const TRACKING_STORAGE_KEY = 'seilhome_tracking_v1';
  const TYPE_OPTIONS = {'34평형':['84A','84B','84C','84D','84E'],'45평형':['117A','117B'],'48평형':['125A']};
  const REQUESTS = {
    price:{title:'분양가표를 문자로 받아보세요.',description:'이름과 연락처를 남겨주시면 분양가표 확인 링크를 안내합니다.',button:'분양가표 문자로 받기',source:'분양가표 전송 요청',consultType:'분양가표 전송 요청',message:'홈페이지 분양가표 전송 요청',note:'문자를 받을 휴대폰 번호를 확인해 주세요.',success:'입력하신 번호로 분양가표 확인 링크를 안내합니다. 문자 도착까지 잠시 걸릴 수 있습니다.'},
    visit:{title:'편한 시간에 직접 만나보세요.',description:'방문 희망일을 남기셔도, 아직 정하지 않으셔도 괜찮습니다. 담당자가 일정 확인 후 연락드립니다.',button:'방문상담 예약 신청하기',source:'상세 상담신청',consultType:'모델하우스 방문상담',message:'홈페이지 모델하우스 방문상담 예약',note:'방문예약은 담당자와 일정 확인 후 확정됩니다.',success:'담당자가 연락드려 방문 일정과 관람 가능한 유니트를 확인해드립니다. 방문예약은 일정 확인 후 확정됩니다.'},
    unit:{title:'관심 평형의 동·호수를 확인하세요.',description:'현재 계약 가능한 동·호수와 분양조건을 담당자가 확인해 안내합니다.',button:'분양가·동호수 상담 신청하기',source:'우측 상단 동호수 상담',consultType:'계약 가능 동·호수 문의',message:'홈페이지 계약 가능 동·호수 문의',note:'계약 가능 여부와 조건은 상담 시 확인해드립니다.',success:'관심 평형의 계약 가능한 동·호수와 분양조건을 확인해 연락드리겠습니다.'},
    address:{title:'견본주택 주소를 문자로 받으세요.',description:'방문에 필요한 견본주택 주소와 주차 위치를 안내해드립니다.',button:'견본주택 주소 문자로 받기',source:'견본주택 주소 문자 요청',consultType:'견본주택 주소 문자 요청',message:'견본주택 주소와 주차 위치 문자 안내 요청',note:'문자를 받을 휴대폰 번호를 확인해 주세요.',success:'입력하신 연락처로 견본주택 주소와 주차 위치를 안내해드립니다.'}
  };

  const track = (name, params={}) => {
    if (typeof window.gtag === 'function') window.gtag('event',name,params);
  };
  function getTrackingInfo(){
    let saved={};
    try{saved=JSON.parse(sessionStorage.getItem(TRACKING_STORAGE_KEY)||'{}')||{};}catch(_){/* Storage may be unavailable. */}
    const params=new URLSearchParams(location.search);
    const result={};
    for(const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term']) result[key]=saved[key]||params.get(key)||'';
    result.landingUrl=saved.landingUrl||location.href;
    result.referrer=saved.referrer||document.referrer||'';
    try{sessionStorage.setItem(TRACKING_STORAGE_KEY,JSON.stringify(result));}catch(_){/* Submission still works without storage. */}
    return result;
  }
  const initialTracking=getTrackingInfo();
  if(typeof window.clarity==='function'){
    for(const key of ['utm_source','utm_medium','utm_campaign']) if(initialTracking[key]) window.clarity('set',key,initialTracking[key]);
  }

  const leadDialog=document.getElementById('leadDialog');
  const imageDialog=document.getElementById('imageDialog');
  const dialogForm=document.getElementById('priceLeadForm');
  let lastTrigger=null;
  let imageTrigger=null;
  function updateScrollLock(){document.body.classList.toggle('modal-open',!!document.querySelector('dialog[open]'));}
  function updatePreferenceSummary(form){
    const summary=form.querySelector('.optional-fields summary');
    const size=form.querySelector('[data-size-select]')?.value;
    const type=form.querySelector('[data-type-select]')?.value;
    if(summary)summary.textContent=size?`관심 평형: ${size}${type?' · '+type:''} (변경·일정 선택)`:'관심 평형·방문 희망일 추가하기 (선택)';
  }
  function updateTypeOptions(form,preferred=''){
    const size=form.querySelector('[data-size-select]');
    const select=form.querySelector('[data-type-select]');
    if(!size||!select) return;
    const previous=preferred||select.value;
    const options=TYPE_OPTIONS[size.value]||[];
    select.replaceChildren(new Option(options.length?'타입 선택 (선택사항)':'평형 선택 후 확인',''));
    for(const type of options) select.add(new Option(type,type));
    if(options.includes(previous)) select.value=previous;
    updatePreferenceSummary(form);
  }
  for(const form of document.querySelectorAll('[data-lead-form]')){
    form.querySelector('[data-size-select]')?.addEventListener('change',()=>updateTypeOptions(form));
    form.querySelector('[data-type-select]')?.addEventListener('change',()=>updatePreferenceSummary(form));
    updateTypeOptions(form);
    form.addEventListener('input',()=>{
      form.querySelector('[name="phone"]').setCustomValidity('');
      const error=form.querySelector('.form-error');
      error.hidden=true;
    });
    const date=form.querySelector('[name="visitDate"]');
    const today=new Date();
    if(date) date.min=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
  }

  function setRequestKind(kind){
    const config=REQUESTS[kind]||REQUESTS.price;
    dialogForm.dataset.kind=REQUESTS[kind]?kind:'price';
    document.getElementById('dialogTitle').textContent=config.title;
    document.getElementById('dialogDescription').textContent=config.description;
    dialogForm.querySelector('.btnText').textContent=config.button;
    document.getElementById('dialogFormNote').textContent=config.note;
    document.getElementById('dialogPreferences').hidden=kind==='address';
    for(const button of document.querySelectorAll('[data-dialog-kind]')) button.setAttribute('aria-pressed',String(button.dataset.dialogKind===kind));
    dialogForm.querySelector('[name="phone"]').setCustomValidity('');
    dialogForm.querySelector('.form-error').hidden=true;
  }
  function openInquiry(trigger){
    if(dialogForm.dataset.submitting==='true'){
      if(!leadDialog.open)leadDialog.showModal();
      updateScrollLock();
      return;
    }
    lastTrigger=trigger;
    document.getElementById('dialogFormContent').hidden=false;
    document.getElementById('successContent').hidden=true;
    leadDialog.setAttribute('aria-labelledby','dialogTitle');
    leadDialog.setAttribute('aria-describedby','dialogDescription');
    setRequestKind(trigger.dataset.inquiry||'price');
    dialogForm.elements.entryPoint.value=trigger.dataset.position||'page';
    if(trigger.dataset.size){
      dialogForm.querySelector('[data-size-select]').value=trigger.dataset.size;
      updateTypeOptions(dialogForm,trigger.dataset.type||'');
    }
    document.getElementById('dialogPreferences').open=false;
    if(!leadDialog.open) leadDialog.showModal();
    updateScrollLock();
    const heading=document.getElementById('dialogTitle');
    heading.tabIndex=-1;
    heading.focus({preventScroll:true});
    track('cta_click',{request_kind:dialogForm.dataset.kind,cta_position:trigger.dataset.position||'page',unit_type:trigger.dataset.type||''});
    track('lead_modal_open',{request_kind:dialogForm.dataset.kind});
  }
  for(const trigger of document.querySelectorAll('[data-inquiry]')) trigger.addEventListener('click',()=>openInquiry(trigger));
  for(const trigger of document.querySelectorAll('[data-dialog-kind]')) trigger.addEventListener('click',()=>{
    if(dialogForm.dataset.submitting==='true') return;
    setRequestKind(trigger.dataset.dialogKind);
    track('inquiry_kind_change',{request_kind:trigger.dataset.dialogKind});
  });
  for(const dialog of document.querySelectorAll('dialog')){
    dialog.addEventListener('click',event=>{if(event.target===dialog) dialog.close();});
    dialog.querySelectorAll('[data-dialog-close]').forEach(button=>button.addEventListener('click',()=>dialog.close()));
    dialog.addEventListener('close',()=>{
      updateScrollLock();
      const trigger=dialog===leadDialog?lastTrigger:imageTrigger;
      trigger?.focus({preventScroll:true});
    });
  }

  function showComplete(form,kind,consultType){
    const config=REQUESTS[kind];
    const wasClosed=form===dialogForm&&!leadDialog.open;
    document.getElementById('dialogFormContent').hidden=true;
    document.getElementById('successContent').hidden=false;
    document.getElementById('successTitle').textContent='요청을 전송했어요.';
    document.getElementById('successDescription').textContent=kind==='visit'&&consultType!=='모델하우스 방문상담'?'담당자가 요청하신 상담내용을 확인하고 입력하신 연락처로 연락드리겠습니다.':config.success;
    leadDialog.setAttribute('aria-labelledby','successTitle');
    leadDialog.setAttribute('aria-describedby','successDescription');
    if(wasClosed) return;
    if(!leadDialog.open){lastTrigger=form.querySelector('[type="submit"]');leadDialog.showModal();}
    updateScrollLock();
    document.getElementById('successTitle').focus({preventScroll:true});
  }
  function serializeLead(form,kind){
    const config=REQUESTS[kind];
    const fields=Object.fromEntries(new FormData(form).entries());
    const message=[config.message];
    const data={name:(fields.name||'').trim(),phone:(fields.phone||'').replace(/\D/g,''),consultType:fields.consultType||config.consultType,source:config.source,entryPoint:fields.entryPoint||'page',privacyConsent:fields.privacyConsent||'',createdAt:new Date().toLocaleString('ko-KR'),...getTrackingInfo()};
    if(kind!=='address'){
      data.interestSize=fields.interestSize||'';
      data.interestType=fields.interestType||'';
      data.type=data.interestType||data.interestSize;
      data.visitDate=fields.visitDate||'';
      data.visitTime=fields.visitTime||'';
      data.visit=[data.visitDate,data.visitTime].filter(Boolean).join(' ');
      if(data.interestSize) message.push('희망평형: '+data.interestSize);
      if(data.interestType) message.push('희망타입: '+data.interestType);
      if(fields.note?.trim()) message.push(fields.note.trim());
    }
    data.message=message.join(' | ');
    return data;
  }
  for(const form of document.querySelectorAll('[data-lead-form]')){
    form.addEventListener('focusin',()=>track('lead_form_start',{form_id:form.id}),{once:true});
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      if(form.dataset.submitting==='true') return;
      const kind=form.dataset.kind||'visit';
      const phone=form.querySelector('[name="phone"]');
      const name=form.querySelector('[name="name"]');
      const digits=phone.value.replace(/\D/g,'');
      name.setCustomValidity(name.value.trim()?'':'성함을 입력해 주세요.');
      name.addEventListener('input',()=>name.setCustomValidity(''),{once:true});
      const mobile=kind==='price'||kind==='address';
      const validPhone=(mobile?/^01[016789]\d{7,8}$/:/^0\d{8,10}$/).test(digits);
      phone.setCustomValidity(validPhone?'':mobile?'문자를 받을 휴대폰 번호를 확인해 주세요.':'연락 가능한 전화번호를 확인해 주세요.');
      if(!form.reportValidity()) return;
      const payload=serializeLead(form,kind);
      const button=form.querySelector('button[type="submit"]');
      const label=button.querySelector('.btnText');
      const originalLabel=label.textContent;
      const error=form.querySelector('.form-error');
      const preferences=form.querySelectorAll('input,select,textarea,button');
      const disabledBefore=[...preferences].map(el=>el.disabled);
      preferences.forEach(el=>el.disabled=true);
      form.dataset.submitting='true';button.classList.add('loading');label.textContent='요청을 전송하고 있어요';error.hidden=true;
      document.querySelectorAll('[data-dialog-kind]').forEach(el=>el.disabled=true);
      track('lead_submit_attempt',{form_id:form.id,request_kind:kind,cta_position:payload.entryPoint});
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),20000);
      try{
        // Existing GAS is a no-cors integration: an opaque response cannot confirm
        // spreadsheet storage or SMS delivery. UI/events describe transmission only.
        const response=await fetch(GOOGLE_SCRIPT_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
        if(response.type!=='opaque'&&!response.ok) throw new Error('Request failed');
        form.reset();updateTypeOptions(form);
        showComplete(form,kind,payload.consultType);
        track('lead_request_sent',{form_id:form.id,request_kind:kind,cta_position:payload.entryPoint,unit_type:payload.type||''});
        if(typeof window.clarity==='function') window.clarity('event',kind==='price'?'price_request':kind==='address'?'address_request':'consult_request');
      }catch(_){
        error.replaceChildren(document.createTextNode('전송을 완료하지 못했습니다. 다시 시도하거나 '));
        const link=document.createElement('a');link.href='tel:033-900-0342';link.textContent='033-900-0342';error.append(link,document.createTextNode('로 전화해 주세요.'));
        error.hidden=false;
        track('lead_submit_error',{form_id:form.id,request_kind:kind});
      }finally{
        clearTimeout(timeout);
        preferences.forEach((el,i)=>el.disabled=disabledBefore[i]);
        form.dataset.submitting='false';button.classList.remove('loading');label.textContent=originalLabel;
        document.querySelectorAll('[data-dialog-kind]').forEach(el=>el.disabled=false);
      }
    });
  }
  for(const link of document.querySelectorAll('a[href^="tel:"]')) link.addEventListener('click',()=>track('phone_click',{cta_position:link.dataset.position||'page'}));

  const gallery={
    '84c':{name:'34평형 C타입',size:'34평형',type:'84C',eyebrow:'34 PYEONG · TYPE 84C',title:'거실과 주방이 이어지는\n우리 가족의 일상',description:'공간의 연결감과 수납 구성을 사진으로 살펴보세요. 마음에 드는 공간은 상담할 때 함께 비교해드립니다.',features:['거실·주방의 실제 공간감','안방과 드레스룸 구성','현관 팬트리 수납공간'],photos:[['living','거실'],['kitchen','주방'],['bedroom','안방'],['dressing','드레스룸'],['pantry','팬트리']]},
    '125':{name:'48평형',size:'48평형',type:'125A',eyebrow:'48 PYEONG · 125m²',title:'거실부터 알파룸까지,\n여유를 더한 생활공간',description:'가족이 모이는 거실과 주방, 각자의 시간을 위한 방까지. 실제 촬영 사진으로 공간의 쓰임을 확인해 보세요.',features:['거실과 주방의 넉넉한 공간감','안방과 욕실의 공간 구성','다양하게 활용할 수 있는 알파룸'],photos:[['living','거실'],['kitchen','주방'],['bedroom','안방'],['alpha','알파룸'],['bath','안방 욕실']]}
  };
  let currentGallery='84c';
  function choosePhoto(index){
    const data=gallery[currentGallery];
    const [slug,label]=data.photos[index];
    const image=document.getElementById('galleryImage');
    image.src=`images/interiors/${currentGallery}-${slug}.webp`;
    image.alt=`${data.name} ${label} 실제 촬영 사진`;
    document.getElementById('galleryCaption').textContent=`${data.name} · ${label}`;
    document.getElementById('galleryCounter').textContent=`${String(index+1).padStart(2,'0')} / 05`;
    document.querySelectorAll('[data-photo]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.photo)===index)));
    track('interior_photo_view',{unit_type:data.type,room:label});
  }
  function chooseGallery(key){
    currentGallery=key;
    const data=gallery[key];
    document.querySelectorAll('[data-gallery]').forEach(button=>{const selected=button.dataset.gallery===key;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;});
    document.getElementById('gallery-panel').setAttribute('aria-labelledby','gallery-tab-'+key);
    document.getElementById('galleryEyebrow').textContent=data.eyebrow;
    const title=document.getElementById('galleryTitle');title.replaceChildren();data.title.split('\n').forEach((text,index)=>{if(index)title.append(document.createElement('br'));title.append(document.createTextNode(text));});
    document.getElementById('galleryDescription').textContent=data.description;
    document.getElementById('galleryFeatures').replaceChildren(...data.features.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
    const thumbs=document.getElementById('galleryThumbs');thumbs.replaceChildren();
    data.photos.forEach(([slug,label],index)=>{
      const button=document.createElement('button');button.type='button';button.className='gallery-thumb';button.dataset.photo=index;button.setAttribute('aria-label',`${data.name} ${label} 사진`);
      const img=document.createElement('img');img.src=`images/interiors/${key}-${slug}-thumb.webp`;img.alt='';img.loading='lazy';img.decoding='async';
      const span=document.createElement('span');span.textContent=label;button.append(img,span);thumbs.append(button);
    });
    for(const id of ['galleryInquiry','galleryVisit']){const button=document.getElementById(id);button.dataset.size=data.size;button.dataset.type=data.type;}
    choosePhoto(0);
  }
  document.getElementById('galleryThumbs').addEventListener('click',event=>{const button=event.target.closest('[data-photo]');if(button)choosePhoto(Number(button.dataset.photo));});
  document.querySelectorAll('[data-gallery]').forEach(button=>button.addEventListener('click',()=>chooseGallery(button.dataset.gallery)));

  function choosePlan(type){
    const size=type.startsWith('84')?'34평형':type.startsWith('117')?'45평형':'48평형';
    const area=type.replace(/[A-Z]/g,'');
    const image=document.getElementById('floorImage');image.src=`images/floor${type.toLowerCase()}.jpg`;image.alt=type+' 타입 평면도';
    document.querySelectorAll('[data-floor]').forEach(button=>{const selected=button.dataset.floor===type;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;});
    document.getElementById('floor-panel').setAttribute('aria-labelledby','floor-tab-'+type.toLowerCase());
    const title=document.getElementById('planTitle');title.replaceChildren(document.createTextNode(size+' '));const small=document.createElement('small');small.textContent='· '+type;title.append(small);
    document.getElementById('planArea').textContent=area+'m²';document.getElementById('planType').textContent=type;
    document.getElementById('planDescription').textContent=size==='34평형'?'84A부터 84E까지, 같은 평형 안에서도 공간 배치가 달라집니다. 가족의 생활방식에 맞춰 비교해 보세요.':size==='45평형'?'117A와 117B의 공간 배치를 평면도로 비교해 보세요. 48평형과 고민 중이라면 차이를 함께 안내해드립니다.':'거실·주방과 각 방의 배치를 평면도로 확인해 보세요. 실내 사진과 함께 비교하시면 공간을 이해하기 쉽습니다.';
    for(const id of ['planInquiry','planPrice']){const button=document.getElementById(id);button.dataset.size=size;button.dataset.type=type;}
    track('floor_plan_select',{unit_type:type});
  }
  document.querySelectorAll('[data-floor]').forEach(button=>button.addEventListener('click',()=>choosePlan(button.dataset.floor)));
  for(const tablist of document.querySelectorAll('[role="tablist"]')) tablist.addEventListener('keydown',event=>{
    const tabs=[...tablist.querySelectorAll('[role="tab"]')];
    const current=tabs.indexOf(document.activeElement);if(current<0)return;
    let next=current;
    if(event.key==='ArrowRight') next=(current+1)%tabs.length;
    else if(event.key==='ArrowLeft') next=(current-1+tabs.length)%tabs.length;
    else if(event.key==='Home')next=0;
    else if(event.key==='End')next=tabs.length-1;
    else return;
    event.preventDefault();tabs[next].click();tabs[next].focus();
  });

  const largeImage=document.getElementById('largeImage');
  let imageZoom=1;
  function renderImageZoom(){
    const stage=document.querySelector('.image-stage');
    if(!stage||!largeImage.naturalWidth)return;
    const baseWidth=Math.min(stage.clientWidth,Math.max(180,window.innerHeight-210)*largeImage.naturalWidth/largeImage.naturalHeight);
    largeImage.style.width=`${baseWidth*imageZoom}px`;
    document.getElementById('imageZoomReset').textContent=Math.round(imageZoom*100)+'%';
  }
  function openImage(trigger,src,title){
    imageTrigger=trigger;imageZoom=1;largeImage.style.width='';
    largeImage.alt=title;document.getElementById('imageCaption').textContent=title;
    largeImage.onload=renderImageZoom;largeImage.src=src;
    imageDialog.showModal();updateScrollLock();requestAnimationFrame(renderImageZoom);
    track('image_expand',{image_name:title});
  }
  for(const button of document.querySelectorAll('[data-image-open]'))button.addEventListener('click',()=>{const image=button.querySelector('img');openImage(button,image.currentSrc||image.src,image.alt);});
  for(const button of document.querySelectorAll('[data-image-src]'))button.addEventListener('click',()=>openImage(button,button.dataset.imageSrc,button.dataset.imageTitle));
  document.getElementById('imageZoomIn').addEventListener('click',()=>{imageZoom=Math.min(4,imageZoom+.5);renderImageZoom();});
  document.getElementById('imageZoomOut').addEventListener('click',()=>{imageZoom=Math.max(1,imageZoom-.5);renderImageZoom();});
  document.getElementById('imageZoomReset').addEventListener('click',()=>{imageZoom=1;renderImageZoom();});
  window.addEventListener('resize',()=>{if(imageDialog.open)renderImageZoom();});
  for(const details of document.querySelectorAll('.video-details')) details.addEventListener('toggle',()=>{
    const video=details.querySelector('video');
    if(details.open){video.preload='metadata';track('view_video_section');}else video.pause();
  });
  for(const details of document.querySelectorAll('.faq-list details'))details.addEventListener('toggle',()=>{if(details.open)track('faq_open',{question:details.querySelector('summary').textContent});});
  // Preserve links used by older ads, messages and bookmarks.
  function openLegacyAnchor(){
    const selector=location.hash==='#price'?'[data-inquiry="price"]':location.hash==='#dongho'?'[data-inquiry="unit"]':location.hash==='#siteplan'?'[data-image-src="images/siteplan.jpg"]':null;
    if(selector)document.querySelector(selector)?.click();
  }
  openLegacyAnchor();
  window.addEventListener('hashchange',openLegacyAnchor);
})();
