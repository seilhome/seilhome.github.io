'use strict';

(() => {
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxYqhkvH2eukcBeTNOMWkDoNFfEoEE6gi8nTnmnU_b4pAWcxVzXyREayWSswOREyTif/exec';

  const AREA_LABELS = {
    '84A':'34평형', '84B':'34평형', '84C':'34평형', '84D':'34평형', '84E':'34평형',
    '117A':'45평형', '117B':'45평형',
    '125A':'48평형'
  };

  function clean(value) {
    return String(value ?? '').trim();
  }

  // 시트에는 금액을 '만원' 단위 숫자로 저장합니다.
  // 예: 52600 -> 5억 2,600만원 / 1540 -> 1,540만원
  function formatManwon(value) {
    const raw = clean(value).replace(/,/g, '');
    if (!raw) return '';
    const num = Number(raw);
    if (!Number.isFinite(num)) return clean(value);

    const eok = Math.floor(num / 10000);
    const man = Math.round(num % 10000);
    const parts = [];
    if (eok) parts.push(`${eok.toLocaleString('ko-KR')}억`);
    if (man) parts.push(`${man.toLocaleString('ko-KR')}만원`);
    return parts.join(' ') || '0만원';
  }

  function normalizeStatus(value) {
    const text = clean(value);
    if (!text) return '전매 가능';
    if (text === '전매가능') return '전매 가능';
    return text;
  }

  function mapItem(item) {
    const unitType = clean(item.type).toUpperCase();

    return {
      id: clean(item.id),
      building: clean(item.building),
      floor: clean(item.floor),
      unitType,
      areaLabel: AREA_LABELS[unitType] || '',
      direction: clean(item.direction),
      salePrice: formatManwon(item.price),
      expansion: formatManwon(item.extension),
      premium: formatManwon(item.premium) || '협의',
      status: normalizeStatus(item.status),
      note: clean(item.memo),
      updatedAt: clean(item.date)
    };
  }

  window.TRANSFER_LISTINGS = [];

  // transfer.js에서 이 Promise를 기다린 뒤 매물 카드를 그립니다.
  window.TRANSFER_LISTINGS_PROMISE = (async () => {
    const separator = GOOGLE_SCRIPT_URL.includes('?') ? '&' : '?';
    const url = `${GOOGLE_SCRIPT_URL}${separator}action=transferList&_=${Date.now()}`;

    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`전매 매물 조회 실패: ${response.status}`);
    }

    const data = await response.json();
    if (!data || data.status !== 'success' || !Array.isArray(data.items)) {
      throw new Error('전매 매물 응답 형식이 올바르지 않습니다.');
    }

    const listings = data.items.map(mapItem);
    window.TRANSFER_LISTINGS = listings;
    return listings;
  })().catch((error) => {
    console.error(error);
    window.TRANSFER_LISTINGS = [];
    return [];
  });
})();
