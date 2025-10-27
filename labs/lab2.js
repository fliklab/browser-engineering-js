/**
 * Lab 2: Drawing to the Screen
 * book/graphics.md - 화면에 텍스트를 그리고 스크롤을 구현합니다
 * 
 * 이 모듈은 다음을 구현합니다:
 * - 렉싱(Lexing): HTML 태그 제거
 * - 레이아웃: 텍스트를 화면에 배치
 * - 브라우저 창: 캔버스 생성 및 스크롤
 */

// lab1.js에서 URL 가져오기 (실제 사용 시 import)
// import { URL } from './lab1.js';

// book/graphics.md: 브라우저 창 크기와 텍스트 간격 상수
const WIDTH = 800;
const HEIGHT = 600;
const HSTEP = 13;  // 가로 간격 (문자당 픽셀)
const VSTEP = 18;  // 세로 간격 (줄당 픽셀)

const SCROLL_STEP = 100;  // 스크롤 이동 크기

/**
 * HTML 태그를 제거하고 텍스트만 추출합니다
 * book/graphics.md: 렉싱 단계 - 마크업 제거
 * 
 * @param {string} body - HTML 문서
 * @returns {string} 태그가 제거된 순수 텍스트
 */
function lex(body) {
  let text = '';
  let in_tag = false;
  
  // book/graphics.md: 문자 단위로 순회하며 태그 내부 여부 추적
  for (const c of body) {
    if (c === '<') {
      in_tag = true;
    } else if (c === '>') {
      in_tag = false;
    } else if (!in_tag) {
      // 태그 밖의 문자만 결과에 추가
      text += c;
    }
  }
  
  return text;
}

/**
 * 텍스트를 화면에 배치하기 위한 디스플레이 리스트를 생성합니다
 * book/graphics.md: 레이아웃 단계 - 각 문자의 화면 좌표 계산
 * 
 * @param {string} text - 렌더링할 텍스트
 * @returns {Array} 디스플레이 리스트 [{x, y, c}, ...]
 */
function layout(text) {
  const display_list = [];
  let cursor_x = HSTEP;
  let cursor_y = VSTEP;
  
  // book/graphics.md: 문자 단위로 위치를 계산하고 줄바꿈 처리
  for (const c of text) {
    display_list.push({
      x: cursor_x,
      y: cursor_y,
      c: c
    });
    
    // 다음 문자 위치로 이동
    cursor_x += HSTEP;
    
    // book/graphics.md: 오른쪽 여백에 도달하면 다음 줄로
    if (cursor_x >= WIDTH - HSTEP) {
      cursor_y += VSTEP;
      cursor_x = HSTEP;
    }
  }
  
  return display_list;
}

/**
 * 브라우저 클래스
 * book/graphics.md: 창 관리, 렌더링, 사용자 입력 처리
 * 
 * p5.js와 함께 사용하기 위해 설계되었습니다.
 */
class Browser {
  /**
   * 브라우저 초기화
   * @param {P5Canvas} canvas - p5.js 기반 캔버스 객체
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.scroll = 0;  // book/graphics.md: 스크롤 오프셋
    this.display_list = [];
  }

  /**
   * URL을 로드하고 렌더링합니다
   * book/graphics.md: 로드 → 렉싱 → 레이아웃 → 그리기 파이프라인
   * 
   * @param {URL} url - 로드할 URL
   */
  async load(url) {
    // book/graphics.md: 1단계 - HTTP 요청으로 HTML 가져오기
    const body = await url.request();
    
    // book/graphics.md: 2단계 - 렉싱으로 텍스트 추출
    const text = lex(body);
    
    // book/graphics.md: 3단계 - 레이아웃으로 좌표 계산
    this.display_list = layout(text);
    
    // book/graphics.md: 4단계 - 화면에 그리기
    this.draw();
  }

  /**
   * 디스플레이 리스트를 화면에 렌더링합니다
   * book/graphics.md: 스크롤 오프셋을 적용하여 가시 영역만 그림
   */
  draw() {
    // 기존 내용 지우기
    this.canvas.delete("all");
    
    // book/graphics.md: 디스플레이 리스트 순회
    for (const item of this.display_list) {
      const { x, y, c } = item;
      
      // book/graphics.md: 스크롤 최적화 - 화면 밖 요소는 스킵
      if (y > this.scroll + HEIGHT) continue;
      if (y + VSTEP < this.scroll) continue;
      
      // book/graphics.md: 스크롤 오프셋을 빼서 화면 좌표로 변환
      this.canvas.create_text(x, y - this.scroll, {
        text: c,
        anchor: 'nw'
      });
    }
  }

  /**
   * 아래로 스크롤합니다
   * book/graphics.md: 사용자 입력 처리 - 키보드 이벤트
   */
  scrolldown() {
    this.scroll += SCROLL_STEP;
    this.draw();
  }

  /**
   * 위로 스크롤합니다
   * book/graphics.md: 추가 기능 - 위쪽 스크롤
   */
  scrollup() {
    this.scroll = Math.max(0, this.scroll - SCROLL_STEP);
    this.draw();
  }

  /**
   * 마우스 휠로 스크롤합니다
   * book/graphics.md: 마우스 휠 이벤트 처리
   * 
   * @param {number} delta - 스크롤 델타 (양수: 아래, 음수: 위)
   */
  handleWheel(delta) {
    if (delta > 0) {
      this.scrolldown();
    } else {
      this.scrollup();
    }
  }
}

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    WIDTH,
    HEIGHT,
    HSTEP,
    VSTEP,
    SCROLL_STEP,
    lex,
    layout,
    Browser
  };
}

