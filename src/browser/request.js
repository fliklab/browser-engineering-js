/**
 * request.js - CORS 프록시를 통한 HTTP 요청 모듈
 *
 * 이 모듈은 브라우저의 CORS 정책을 우회하기 위해
 * 로컬 프록시 서버를 통해 외부 사이트를 요청합니다.
 */

// 프록시 서버 설정
const PROXY_ENABLED = true; // 프록시 사용 여부

// 환경에 따라 프록시 URL 결정
// - 로컬 개발: http://localhost:3000/proxy (Express 서버)
// - Vercel 배포: /api/proxy (Serverless Function)
const PROXY_URL =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:3000/proxy"
    : "/api/proxy";

/**
 * URL을 통해 HTTP 요청을 수행합니다
 *
 * @param {string} url - 요청할 URL
 * @returns {Promise<string>} 응답 본문
 */
async function fetchWithProxy(url) {
  // 로컬 파일은 프록시를 거치지 않음
  const isLocalFile =
    url.startsWith("http://localhost") ||
    url.startsWith("http://127.0.0.1") ||
    url.startsWith(window.location.origin);

  if (isLocalFile || !PROXY_ENABLED) {
    console.log(`[REQUEST] Direct fetch: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.text();
  }

  // 프록시를 통한 요청
  const proxyUrl = `${PROXY_URL}?url=${encodeURIComponent(url)}`;
  console.log(`[REQUEST] Proxy fetch: ${url}`);

  const response = await fetch(proxyUrl);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.text();
}

/**
 * 프록시 서버 상태를 확인합니다
 *
 * @returns {Promise<boolean>} 프록시 서버 사용 가능 여부
 */
async function checkProxyStatus() {
  try {
    const response = await fetch(PROXY_URL);
    return response.status === 400; // 400은 정상 (URL 파라미터 없음)
  } catch (error) {
    return false;
  }
}

/**
 * 프록시 설정 정보를 반환합니다
 *
 * @returns {object} 프록시 설정
 */
function getProxyConfig() {
  return {
    enabled: PROXY_ENABLED,
    url: PROXY_URL,
    status: "checking...",
  };
}

// 전역으로 내보내기
if (typeof window !== "undefined") {
  window.fetchWithProxy = fetchWithProxy;
  window.checkProxyStatus = checkProxyStatus;
  window.getProxyConfig = getProxyConfig;
}
