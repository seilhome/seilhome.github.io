const GOOGLE_SCRIPT_URL = ''; // 구글 Apps Script 배포 URL을 여기에 붙여넣으세요.

const floorButtons = document.querySelectorAll('.floor-tabs button');
const panels = document.querySelectorAll('.floor-panel');
floorButtons.forEach(btn=>btn.addEventListener('click',()=>{
  floorButtons.forEach(b=>b.classList.remove('active'));
  panels.forEach(p=>p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(btn.dataset.target).classList.add('active');
}));

const modal = document.getElementById('imageModal');
const modalImg = document.getElementById('modalImg');
const modalTitle = document.getElementById('modalTitle');
document.querySelectorAll('[data-full]').forEach(el=>{
  el.addEventListener('click',()=>{
    modalImg.src = el.getAttribute('data-full');
    modalTitle.textContent = el.getAttribute('data-title') || '확대보기';
    modal.classList.add('open');
    document.body.style.overflow='hidden';
  });
});
document.getElementById('modalClose').addEventListener('click',()=>{
  modal.classList.remove('open');
  modalImg.src='';
  document.body.style.overflow='';
});

const form = document.getElementById('leadForm');
form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  data.createdAt = new Date().toLocaleString('ko-KR');
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true;
  submit.textContent = '접수 중...';
  try{
    if(GOOGLE_SCRIPT_URL){
      await fetch(GOOGLE_SCRIPT_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
      alert('상담 신청이 접수되었습니다. 빠르게 연락드리겠습니다.');
      form.reset();
    }else{
      alert('구글 스프레드시트 연동 주소가 아직 입력되지 않았습니다. 연동 후 상담신청이 저장됩니다.');
    }
  }catch(err){
    alert('접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
  }finally{
    submit.disabled=false;
    submit.textContent='상담 신청하기';
  }
});
