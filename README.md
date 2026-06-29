# 강릉 우미 린 더 프리미어 홈페이지

GitHub Pages 업로드용 파일입니다.

## 업로드 파일
- index.html
- css 폴더
- js 폴더
- images 폴더
- README.md

위 항목을 GitHub 저장소 최상단에 모두 업로드하세요.

## 구글 스프레드시트 연동
1. 구글 스프레드시트 새 파일 생성
2. Apps Script 생성
3. 배포 URL 발급
4. js/script.js 파일의 아래 부분 교체

```js
const GOOGLE_SCRIPT_URL='PASTE_GOOGLE_APPS_SCRIPT_URL_HERE';
```

발급받은 URL을 따옴표 안에 넣으면 상담신청이 스프레드시트에 저장됩니다.
