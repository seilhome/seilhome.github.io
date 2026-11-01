'use strict';
(() => {
  const GOOGLE_SCRIPT_URL='https://script.google.com/macros/s/AKfycbxYqhkvH2eukcBeTNOMWkDoNFfEoEE6gi8nTnmnU_b4pAWcxVzXyREayWSswOREyTif/exec';
  const TRACKING_STORAGE_KEY='seilhome_tracking_v1';
  const track=(name,params={})=>{if(typeof window.gtag==='function') window.gtag('event',name,params);};
  function tracking(){
    let saved={};try{saved=JSON.parse(sessionStorage.getItem(TRACKING_STORAGE_KEY)||'{}')||{};}catch(_){ }
    const params=new URLSearchParams(location.search),r={};
    for(const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term']) r[key]=saved[key]||params.get(key)||'';
    r.landingUrl=saved.landingUrl||location.href;r.referrer=saved.referrer||document.referrer||'';
    try{sessionStorage.setItem(TRACKING_STORAGE_KEY,JSON.stringify(r));}catch(_){ }
    return r;
  }
  function clean(v){return String(v||'').trim();}
  function add(parts,label,value){if(clean(value)) parts.push(`${label}: ${clean(value)}`);}

  const listings=Array.isArray(window.TRANSFER_LISTINGS)?window.TRANSFER_LISTINGS:[];
  const grid=document.getElementById('transfer-listing-grid');
  const empty=document.getElementById('transfer-listing-empty');
  const buildingFilter=document.getElementById('listing-building');
  const typeFilter=document.getElementById('listing-type');
  const resetFilter=document.getElementById('listing-reset');
  function esc(v){return String(v||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function listingSummary(item){return [item.building,item.floor,item.unitType,item.premium&&`P ${item.premium}`].filter(Boolean).join(' · ');}
  function selectListing(item){
    const form=document.querySelector('[data-transfer-form="buy"]'); if(!form) return;
    form.querySelector('[name="listingId"]').value=item.id||'';
    const box=form.querySelector('[data-selected-listing]'),txt=form.querySelector('[data-selected-listing-text]');
    if(box&&txt){txt.textContent=listingSummary(item);box.hidden=false;}
    const note=form.querySelector('[name="note"]'); if(note&&!note.value) note.value=`관심 매물: ${listingSummary(item)}`;
    form.scrollIntoView({behavior:'smooth',block:'start'}); track('transfer_listing_inquiry_click',{listing_id:item.id||'',building:item.building||'',unit_type:item.unitType||''});
  }
  function renderListings(){
    if(!grid||!empty) return;
    const b=buildingFilter?.value||'',t=typeFilter?.value||'';
    const filtered=listings.filter(x=>(!b||x.building===b)&&(!t||x.unitType===t)&&x.status!=='거래완료');
    grid.innerHTML=''; empty.hidden=filtered.length!==0;
    for(const item of filtered){
      const el=document.createElement('article'); el.className='listing-card';
      el.innerHTML=`<div class="listing-card-top"><span class="listing-status">${esc(item.status||'전매 가능')}</span><span class="listing-id">${esc(item.id||'')}</span></div><h3>${esc(item.building)} · ${esc(item.floor)}</h3><div class="listing-type">${esc(item.unitType)}${item.areaLabel?` · ${esc(item.areaLabel)}`:''}</div><dl class="listing-info">${item.direction?`<div><dt>방향</dt><dd>${esc(item.direction)}</dd></div>`:''}${item.salePrice?`<div><dt>분양가</dt><dd>${esc(item.salePrice)}</dd></div>`:''}${item.expansion?`<div><dt>발코니 확장비</dt><dd>${esc(item.expansion)}</dd></div>`:''}${item.note?`<div><dt>조건</dt><dd>${esc(item.note)}</dd></div>`:''}</dl><div class="listing-premium"><small>희망 프리미엄</small><strong>${esc(item.premium||'협의')}</strong></div><button class="btn btn-primary" type="button">이 매물 매수 문의</button>`;
      el.querySelector('button').addEventListener('click',()=>selectListing(item)); grid.appendChild(el);
    }
  }
  buildingFilter?.addEventListener('change',renderListings); typeFilter?.addEventListener('change',renderListings);
  resetFilter?.addEventListener('click',()=>{if(buildingFilter) buildingFilter.value='';if(typeFilter) typeFilter.value='';renderListings();});
  document.querySelector('[data-clear-listing]')?.addEventListener('click',()=>{const form=document.querySelector('[data-transfer-form="buy"]');if(!form)return;form.querySelector('[name="listingId"]').value='';form.querySelector('[data-selected-listing]').hidden=true;});
  renderListings();

  for(const form of document.querySelectorAll('[data-transfer-form]')){
    form.addEventListener('focusin',()=>track('transfer_form_start',{form_type:form.dataset.transferForm}),{once:true});
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      if(form.dataset.submitting==='true') return;
      const fields=Object.fromEntries(new FormData(form).entries());
      const phone=clean(fields.phone).replace(/\D/g,'');
      const phoneEl=form.querySelector('[name="phone"]');
      phoneEl.setCustomValidity(/^0\d{8,10}$/.test(phone)?'':'연락 가능한 전화번호를 확인해 주세요.');
      if(!form.reportValidity()) return;
      const isSell=form.dataset.transferForm==='sell';
      const parts=[];
      if(isSell){
        add(parts,'동',fields.building);add(parts,'층',fields.floor);add(parts,'호수(비공개 확인용)',fields.unitNo);add(parts,'타입',fields.unitType);add(parts,'희망 프리미엄',fields.premium);add(parts,'추가내용',fields.note);
      }else{
        add(parts,'선택 매물 ID',fields.listingId);add(parts,'희망 타입',fields.unitType);add(parts,'희망 층',fields.floorPreference);add(parts,'프리미엄 예산',fields.premiumBudget);add(parts,'추가조건',fields.note);
      }
      const payload={
        name:clean(fields.name),phone,type:clean(fields.unitType),
        consultType:isSell?'분양권 전매 매도 의뢰':'분양권 전매 매수 문의',
        visitDate:'',visitTime:'',visit:'',
        message:`홈페이지 ${isSell?'전매 매도 의뢰':'전매 매수 문의'} | ${parts.join(' | ')}`,
        source:isSell?'분양권 전매 매도 의뢰':'분양권 전매 매수 문의',
        entryPoint:'transfer-page',privacyConsent:fields.privacyConsent||'',createdAt:new Date().toLocaleString('ko-KR'),...tracking()
      };
      const button=form.querySelector('button[type="submit"]');
      const status=form.querySelector('.transfer-form-status');
      const original=button.textContent;
      form.dataset.submitting='true';button.disabled=true;button.textContent='접수 중입니다';status.textContent='';status.className='transfer-form-status';
      track('transfer_submit_attempt',{form_type:isSell?'sell':'buy'});
      try{
        const res=await fetch(GOOGLE_SCRIPT_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        if(res.type!=='opaque'&&!res.ok) throw new Error('request');
        form.reset();status.textContent=isSell?'매도 의뢰가 접수되었습니다. 확인 후 연락드리겠습니다.':'매수 문의가 접수되었습니다. 조건에 맞는 매물을 확인 후 연락드리겠습니다.';status.classList.add('success');
        track('transfer_request_sent',{form_type:isSell?'sell':'buy'});if(typeof window.clarity==='function') window.clarity('event',isSell?'transfer_sell_request':'transfer_buy_request');
      }catch(_){status.textContent='전송을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.';status.classList.add('error');track('transfer_submit_error',{form_type:isSell?'sell':'buy'});}
      finally{form.dataset.submitting='false';button.disabled=false;button.textContent=original;}
    });
  }
})();
