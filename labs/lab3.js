/**
 * Lab 3: Formatting Text
 * book/text.md - 텍스트 포맷팅, 폰트, 단어 단위 레이아웃을 구현합니다
 * 
 * 이 모듈은 다음을 구현합니다:
 * - 토큰 기반 파싱 (Text, Tag)
 * - 폰트 관리 (크기, 굵기, 스타일)
 * - 단어 감싸기 (Word wrapping)
 * - 베이스라인 정렬 (Baseline alignment)
 */

// import { WIDTH, HEIGHT, HSTEP, VSTEP, SCROLL_STEP } from './lab2.js';

/**
 * 텍스트 토큰
 * book/text.md: HTML의 텍스트 부분을 나타냅니다
 */
class Text {
  constructor(text) {
    this.text = text;
  }

  toString() {
    return `Text('${this.text}')`;
  }
}

/**
 * 태그 토큰
 * book/text.md: HTML 태그를 나타냅니다
 */
class Tag {
  constructor(tag) {
    this.tag = tag;
  }

  toString() {
    return `Tag('${this.tag}')`;
  }
}

/**
 * HTML을 토큰 리스트로 변환합니다
 * book/text.md: 렉싱 - 텍스트와 태그를 구분
 * 
 * @param {string} body - HTML 문서
 * @returns {Array<Text|Tag>} 토큰 배열
 */
function lex(body) {
  const out = [];
  let buffer = '';
  let in_tag = false;
  
  // book/text.md: 문자 단위로 순회하며 태그와 텍스트 분리
  for (const c of body) {
    if (c === '<') {
      in_tag = true;
      // 버퍼에 텍스트가 있으면 Text 토큰 생성
      if (buffer) {
        out.push(new Text(buffer));
      }
      buffer = '';
    } else if (c === '>') {
      in_tag = false;
      // 태그 내용으로 Tag 토큰 생성
      out.push(new Tag(buffer));
      buffer = '';
    } else {
      buffer += c;
    }
  }
  
  // 마지막 버퍼 처리
  if (!in_tag && buffer) {
    out.push(new Text(buffer));
  }
  
  return out;
}

/**
 * 폰트 캐시 - 동일한 폰트를 재사용
 * book/text.md: 성능 최적화
 */
const FONTS = {};

/**
 * 폰트를 가져오거나 생성합니다
 * book/text.md: 폰트 캐싱으로 중복 생성 방지
 * 
 * @param {number} size - 폰트 크기
 * @param {string} weight - 굵기 (normal, bold)
 * @param {string} slant - 스타일 (roman, italic)
 * @returns {Font} 폰트 객체
 */
function get_font(size, weight, slant) {
  const key = `${size}-${weight}-${slant}`;
  if (!FONTS[key]) {
    // p5canvas.js의 Font 클래스 사용
    FONTS[key] = new Font(size, weight, slant);
  }
  return FONTS[key];
}

/**
 * Layout 클래스
 * book/text.md: 토큰을 단어 단위로 레이아웃하고 베이스라인 정렬
 */
class Layout {
  constructor(tokens, width, p5Instance) {
    this.tokens = tokens;
    this.width = width;
    this.display_list = [];
    
    // p5 인스턴스를 폰트에 설정
    this.p5Instance = p5Instance;
    
    // book/text.md: 현재 커서 위치
    this.cursor_x = HSTEP;
    this.cursor_y = VSTEP;
    
    // book/text.md: 현재 텍스트 스타일 상태
    this.weight = 'normal';
    this.style = 'roman';
    this.size = 12;
    
    // book/text.md: 현재 줄의 단어들
    this.line = [];
    
    // 토큰 처리
    for (const tok of tokens) {
      this.token(tok);
    }
    // 마지막 줄 flush
    this.flush();
  }

  /**
   * 토큰을 처리합니다
   * book/text.md: 텍스트는 단어로 분할, 태그는 스타일 변경
   * 
   * @param {Text|Tag} tok - 처리할 토큰
   */
  token(tok) {
    if (tok instanceof Text) {
      // book/text.md: 텍스트를 공백으로 분할하여 단어 단위 처리
      const words = tok.text.split(/\s+/).filter(w => w.length > 0);
      for (const word of words) {
        this.word(word);
      }
    } else if (tok instanceof Tag) {
      // book/text.md: 태그에 따른 스타일 변경
      const tag = tok.tag;
      
      if (tag === 'i') {
        this.style = 'italic';
      } else if (tag === '/i') {
        this.style = 'roman';
      } else if (tag === 'b') {
        this.weight = 'bold';
      } else if (tag === '/b') {
        this.weight = 'normal';
      } else if (tag === 'small') {
        this.size -= 2;
      } else if (tag === '/small') {
        this.size += 2;
      } else if (tag === 'big') {
        this.size += 4;
      } else if (tag === '/big') {
        this.size -= 4;
      } else if (tag === 'br') {
        // book/text.md: 줄바꿈 태그
        this.flush();
      } else if (tag === '/p') {
        // book/text.md: 문단 끝 - 줄바꿈 + 여백
        this.flush();
        this.cursor_y += VSTEP;
      }
    }
  }

  /**
   * 단어를 현재 줄에 추가합니다
   * book/text.md: 단어 감싸기 (word wrapping)
   * 
   * @param {string} word - 추가할 단어
   */
  word(word) {
    const font = get_font(this.size, this.weight, this.style);
    
    // p5 인스턴스 설정
    if (this.p5Instance) {
      font.setP5Instance(this.p5Instance);
    }
    
    // book/text.md: 단어 너비 측정
    const w = font.measure(word);
    
    // book/text.md: 줄 너비를 넘으면 flush하고 다음 줄로
    if (this.cursor_x + w > this.width - HSTEP) {
      this.flush();
    }
    
    // 현재 줄에 단어 추가
    this.line.push({
      x: this.cursor_x,
      word: word,
      font: font
    });
    
    // book/text.md: 커서를 단어 너비 + 공백만큼 이동
    this.cursor_x += w + font.measure(' ');
  }

  /**
   * 현재 줄을 디스플레이 리스트에 추가합니다
   * book/text.md: 베이스라인 정렬 (baseline alignment)
   */
  flush() {
    if (this.line.length === 0) return;
    
    // book/text.md: 모든 폰트의 메트릭 수집
    const metrics = this.line.map(item => item.font.metrics());
    
    // book/text.md: 최대 ascent를 찾아 베이스라인 계산
    const max_ascent = Math.max(...metrics.map(m => m.ascent));
    const baseline = this.cursor_y + 1.25 * max_ascent;
    
    // book/text.md: 각 단어를 베이스라인에 맞춰 배치
    for (const item of this.line) {
      const x = item.x;
      const y = baseline - item.font.metrics('ascent');
      
      this.display_list.push({
        x: x,
        y: y,
        word: item.word,
        font: item.font
      });
    }
    
    // book/text.md: 최대 descent를 찾아 다음 줄 위치 계산
    const max_descent = Math.max(...metrics.map(m => m.descent));
    this.cursor_y = baseline + 1.25 * max_descent;
    
    // 줄 초기화
    this.cursor_x = HSTEP;
    this.line = [];
  }
}

/**
 * 브라우저 클래스 (lab2에서 확장)
 * book/text.md: 토큰 기반 레이아웃 사용
 */
class Browser {
  constructor(canvas, p5Instance) {
    this.canvas = canvas;
    this.p5Instance = p5Instance;
    this.scroll = 0;
    this.display_list = [];
    this.width = WIDTH;
    this.height = HEIGHT;
  }

  /**
   * URL을 로드하고 렌더링합니다
   * book/text.md: 토큰 → 레이아웃 → 그리기
   */
  async load(url) {
    const body = await url.request();
    
    // book/text.md: HTML을 토큰으로 변환
    const tokens = lex(body);
    
    // book/text.md: 토큰을 레이아웃하여 디스플레이 리스트 생성
    const layout = new Layout(tokens, this.width, this.p5Instance);
    this.display_list = layout.display_list;
    
    this.draw();
  }

  /**
   * 디스플레이 리스트를 화면에 그립니다
   * book/text.md: 폰트 정보를 포함한 렌더링
   */
  draw() {
    this.canvas.delete("all");
    
    for (const item of this.display_list) {
      const { x, y, word, font } = item;
      
      // book/text.md: 스크롤 최적화 - 가시 영역만 렌더링
      if (y > this.scroll + this.height) continue;
      if (y + font.metrics('linespace') < this.scroll) continue;
      
      // 텍스트 그리기
      this.canvas.create_text(x, y - this.scroll, {
        text: word,
        font: font,
        anchor: 'nw'
      });
    }
  }

  /**
   * 스크롤 처리
   */
  scrolldown() {
    this.scroll += SCROLL_STEP;
    this.draw();
  }

  scrollup() {
    this.scroll = Math.max(0, this.scroll - SCROLL_STEP);
    this.draw();
  }

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
    Text,
    Tag,
    lex,
    get_font,
    FONTS,
    Layout,
    Browser
  };
}

