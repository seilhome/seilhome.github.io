# 강릉 우미 린 더 프리미어 홈페이지

GitHub Pages 업로드 파일입니다.

## 업로드
아래 파일과 폴더를 GitHub 저장소 최상단에 업로드하세요.
- index.html
- css 폴더
- js 폴더
- images 폴더
- README.md

## 구글 스프레드시트 연동
1. Google 스프레드시트를 새로 만듭니다.
2. 확장 프로그램 > Apps Script를 엽니다.
3. 아래 코드를 붙여넣고 배포 > 새 배포 > 웹 앱으로 배포합니다.
4. 생성된 웹 앱 URL을 `js/script.js` 파일의 `GOOGLE_SCRIPT_URL` 값에 붙여넣습니다.

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    new Date(),
    data.name || '',
    data.phone || '',
    data.type || '',
    data.visit || '',
    data.memo || ''
  ]);
  return ContentService.createTextOutput(JSON.stringify({result:'success'}))
    .setMimeType(ContentService.MimeType.JSON);
}
```


## 수정 사항
- 하단 고정 버튼: 전화상담 / 상담신청 2개로 변경
- 오픈채팅 버튼 제거
- 상담신청은 구글 스프레드시트 연동 주소 입력 후 자동 저장
