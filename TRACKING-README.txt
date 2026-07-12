GA4 전환 추적 업데이트 (2026-07-12)

추가된 주요 이벤트
- phone_click: 전화상담 버튼 클릭
- kakao_click: 카카오톡 오픈채팅 클릭
- consult_click: 간편상담/방문상담 이동 버튼 클릭
- form_start: 상담폼 입력 시작
- form_submit_attempt: 상담폼 제출 시도
- generate_lead: 상담신청 전송 성공 (GA4 권장 이벤트)
- lead_submit_success: 상담신청 전송 성공 (상세 확인용)
- price_click: 분양가 메뉴 클릭
- news_click: 분양정보 클릭
- floorplan_select: 평면도 타입 선택
- image_zoom: 이미지 확대
- event_popup_view / event_popup_close: 특별혜택 팝업 조회/닫기

광고 추적
네이버 광고의 연결 URL에 아래처럼 UTM을 붙이면 GA4에서 유료검색으로 구분하기 쉽습니다.
https://gn-premier.com/?utm_source=naver&utm_medium=cpc&utm_campaign=gangneung_woomirin&utm_term={keyword}

참고
- 기존 홈페이지 디자인과 상담신청 기능은 유지했습니다.
- 상담신청 데이터에 UTM 및 네이버 추적 파라미터가 함께 저장됩니다.
- Microsoft Clarity는 프로젝트 ID가 없어 설치하지 않았습니다. ID 발급 후 추가할 수 있습니다.
- 배포 후 GA4 실시간/DebugView에서 이벤트가 나타나기까지 수 분 걸릴 수 있습니다.
