# CORS 프록시 서버 사용 가이드

## 📝 Intro

이 프록시 서버는 브라우저의 CORS(Cross-Origin Resource Sharing) 정책을 우회하여 외부 웹사이트를 로드할 수 있게 합니다.

## 🚀 Quick Start

### 1. 의존성 설치

```bash
cd web
npm install
```

설치되는 패키지:

- `express` - 웹 서버 프레임워크
- `cors` - CORS 미들웨어
- `node-fetch` - HTTP 요청 라이브러리

### 2. 프록시 서버 시작

```bash
npm start
```

또는 개발 모드 (자동 재시작):

```bash
npm run dev
```

서버가 시작되면 다음 메시지가 표시됩니다:

```
╔════════════════════════════════════════════════════════╗
║         CORS Proxy Server Running                      ║
║         http://localhost:3000                          ║
╚════════════════════════════════════════════════════════╝

Ready to proxy requests! 🚀
```

## 🔧 How it works

```
┌─────────┐         ┌──────────────┐         ┌─────────────┐
│ Browser │ ─────>  │ Proxy Server │ ─────>  │ External    │
│         │ (CORS)  │ (localhost:  │ (HTTP)  │ Website     │
│         │ <─────  │  3000)       │ <─────  │             │
└─────────┘         └──────────────┘         └─────────────┘
```

1. **브라우저** → 프록시 서버에 요청 전송
2. **프록시 서버** → 외부 사이트에 HTTP 요청
3. **외부 사이트** → 프록시 서버에 응답
4. **프록시 서버** → 브라우저에 응답 전달 (CORS 헤더 추가)

## ⚙️ 설정

### 프록시 비활성화

`request.js`에서 프록시를 비활성화할 수 있습니다:

```javascript
const PROXY_ENABLED = false; // 프록시 사용 안 함
```

### 프록시 URL 변경

다른 포트나 서버를 사용하려면:

```javascript
const PROXY_URL = "http://localhost:8080/proxy";
```

### 서버 포트 변경

`proxy-server.js`에서:

```javascript
const PORT = 3000; // 원하는 포트로 변경
```

## 🐛 문제 해결

### "프록시 서버에 연결할 수 없습니다"

**원인**: 프록시 서버가 실행되지 않음

**해결**:

```bash
cd web
npm start
```

### "Failed to fetch"

**원인**: 대상 사이트가 응답하지 않거나 차단됨

**해결**:

- 대상 URL이 올바른지 확인
- 대상 사이트가 접근 가능한지 확인
- 서버 로그에서 자세한 에러 확인

## 🔒 보안 고려사항

⚠️ **주의**: 이 프록시 서버는 **개발/테스트 목적**으로만 사용하세요.

- 프로덕션 환경에서는 사용하지 마세요
- 신뢰할 수 없는 URL에 주의하세요
- 공개 서버로 배포하지 마세요

## 📊 로그 확인

프록시 서버는 모든 요청을 로그에 기록합니다:

```
[PROXY] Fetching: https://browser.engineering
[PROXY] Success: https://browser.engineering (52341 bytes)
```

에러 발생 시:

```
[PROXY] Error fetching https://example.com: HTTP error! status: 404
```

## 🎓 참고 자료

- [Express 문서](https://expressjs.com/)
- [CORS 개념](https://developer.mozilla.org/ko/docs/Web/HTTP/CORS)
- [Web Browser Engineering 책](https://browser.engineering)

## 💡 추가 기능

### 커스텀 헤더 추가

`proxy-server.js`에서 요청 헤더를 커스터마이징할 수 있습니다:

```javascript
const response = await fetch(targetUrl, {
  headers: {
    "User-Agent": "Custom Browser",
    "Accept-Language": "ko-KR,ko;q=0.9",
  },
});
```
