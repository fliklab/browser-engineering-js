# Web Browser Engineering - JavaScript

[Web Browser Engineering](https://browser.engineering) 책의 Lab 1-7을 JavaScript로 구현한 웹 브라우저 엔진입니다.

## 구현된 기능

**Lab 1-3**: URL 파싱, HTTP 요청, 캔버스 렌더링, 텍스트 포맷팅  
**Lab 4-5**: HTML 파싱, DOM 트리, 레이아웃 엔진  
**Lab 6-7**: CSS 파서, 스타일 적용, 멀티탭, 링크 클릭

## 실행 방법

```bash
npm install
npm start
```

브라우저에서 `http://localhost:8000` 접속

## 기술 스택

- **p5.js** - 캔버스 렌더링
- **Vanilla JS** - 브라우저 로직
- **Node.js/Express** - 프록시 서버 (CORS 우회)

## 제한사항

- CORS로 인한 일부 사이트 로드 제한
- 이미지, 폼, JavaScript 실행 미지원

## 참고

- [Web Browser Engineering 책](https://browser.engineering)
- [p5.js 문서](https://p5js.org/reference/)
