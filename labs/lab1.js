/**
 * Lab 1: Downloading Web Pages
 * book/http.md - URL 파싱과 HTTP 요청을 구현합니다
 * 
 * 이 모듈은 웹 페이지를 다운로드하는 기본 기능을 제공합니다.
 * - URL 스키마(http/https), 호스트, 포트, 경로 파싱
 * - HTTP 요청 생성 및 응답 처리
 */

/**
 * URL 클래스
 * book/http.md: URL을 파싱하고 HTTP 요청을 생성합니다
 * 
 * URL 형식: scheme://host:port/path
 * 예: https://example.com:443/index.html
 */
class URL {
  constructor(url) {
    try {
      // book/http.md: URL을 scheme과 나머지로 분리
      const schemeMatch = url.match(/^([a-z]+):\/\/(.+)$/);
      if (!schemeMatch) {
        throw new Error("Invalid URL format");
      }
      
      this.scheme = schemeMatch[1];
      let remaining = schemeMatch[2];
      
      // 지원하는 스키마 확인
      if (this.scheme !== 'http' && this.scheme !== 'https') {
        throw new Error("Unsupported scheme: " + this.scheme);
      }
      
      // book/http.md: 경로가 없으면 기본 경로 "/"를 추가
      if (remaining.indexOf('/') === -1) {
        remaining = remaining + '/';
      }
      
      // 호스트와 경로 분리
      const slashIndex = remaining.indexOf('/');
      const hostPart = remaining.substring(0, slashIndex);
      this.path = remaining.substring(slashIndex);
      
      // book/http.md: 기본 포트 설정 (http: 80, https: 443)
      if (this.scheme === 'http') {
        this.port = 80;
      } else if (this.scheme === 'https') {
        this.port = 443;
      }
      
      // 포트가 명시되어 있는지 확인
      if (hostPart.indexOf(':') !== -1) {
        const parts = hostPart.split(':');
        this.host = parts[0];
        this.port = parseInt(parts[1]);
      } else {
        this.host = hostPart;
      }
      
    } catch (e) {
      // book/http.md: 잘못된 URL은 기본 페이지로 폴백
      console.error("Malformed URL found, falling back to the WBE home page.");
      console.error("  URL was: " + url);
      console.error("  Error: " + e.message);
      
      // 재귀적으로 기본 URL 생성
      const defaultUrl = new URL("https://browser.engineering");
      this.scheme = defaultUrl.scheme;
      this.host = defaultUrl.host;
      this.port = defaultUrl.port;
      this.path = defaultUrl.path;
    }
  }

  /**
   * HTTP 요청을 수행하고 응답 본문을 반환합니다
   * book/http.md: HTTP/1.0 프로토콜을 사용한 요청
   * 
   * 웹 브라우저 환경에서는 fetch API를 사용합니다.
   * CORS 제한으로 인해 프록시 서버가 필요할 수 있습니다.
   * 
   * @returns {Promise<string>} 응답 본문
   */
  async request() {
    try {
      // book/http.md: HTTP 요청 메시지 구성
      // GET /path HTTP/1.0
      // Host: hostname
      const fullUrl = this.toString();
      
      console.log(`Requesting: ${fullUrl}`);
      
      // fetch API를 사용한 요청
      // book/http.md: 실제로는 소켓 통신이지만, 브라우저에서는 fetch 사용
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Host': this.host
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // book/http.md: 응답 본문 읽기
      const body = await response.text();
      return body;
      
    } catch (error) {
      console.error("Request failed:", error);
      // 에러 시 빈 문자열 반환
      return "";
    }
  }

  /**
   * URL을 문자열로 변환
   * book/http.md: 표준 포트는 생략
   */
  toString() {
    let portPart = '';
    
    // 기본 포트가 아닌 경우에만 포트 표시
    if (this.scheme === 'https' && this.port !== 443) {
      portPart = ':' + this.port;
    } else if (this.scheme === 'http' && this.port !== 80) {
      portPart = ':' + this.port;
    }
    
    return `${this.scheme}://${this.host}${portPart}${this.path}`;
  }

  /**
   * 상대 URL을 절대 URL로 변환
   * book/styles.md, book/chrome.md: 외부 스타일시트, 링크 처리
   * 
   * @param {string} url - 상대 또는 절대 URL
   * @returns {URL} 새로운 URL 객체
   */
  resolve(url) {
    // 이미 절대 URL인 경우
    if (url.indexOf('://') !== -1) {
      return new URL(url);
    }
    
    // 프로토콜 상대 URL (//example.com/path)
    if (url.startsWith('//')) {
      return new URL(this.scheme + ':' + url);
    }
    
    // 절대 경로 (/path)
    if (url.startsWith('/')) {
      return new URL(`${this.scheme}://${this.host}:${this.port}${url}`);
    }
    
    // 상대 경로 (path 또는 ../path)
    let dir = this.path.substring(0, this.path.lastIndexOf('/'));
    
    // ../ 처리
    while (url.startsWith('../')) {
      url = url.substring(3);
      const lastSlash = dir.lastIndexOf('/');
      if (lastSlash !== -1) {
        dir = dir.substring(0, lastSlash);
      }
    }
    
    const newPath = dir + '/' + url;
    return new URL(`${this.scheme}://${this.host}:${this.port}${newPath}`);
  }
}

/**
 * HTML 태그를 제거하고 텍스트만 표시합니다
 * book/http.md: 가장 간단한 렌더링 - 텍스트만 추출
 * 
 * @param {string} body - HTML 본문
 * @returns {string} 태그가 제거된 텍스트
 */
function show(body) {
  let result = '';
  let in_tag = false;
  
  // book/http.md: < > 사이는 태그로 간주하고 제외
  for (const c of body) {
    if (c === '<') {
      in_tag = true;
    } else if (c === '>') {
      in_tag = false;
    } else if (!in_tag) {
      result += c;
    }
  }
  
  return result;
}

/**
 * URL을 로드하고 내용을 출력합니다
 * book/http.md: 브라우저의 기본 동작
 * 
 * @param {URL} url - 로드할 URL
 * @returns {Promise<string>} 텍스트 내용
 */
async function load(url) {
  const body = await url.request();
  return show(body);
}

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { URL, show, load };
}

