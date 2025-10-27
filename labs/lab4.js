/**
 * Lab 4: Constructing a Document Tree
 * book/html.md - HTML 파싱과 DOM 트리를 구현합니다
 * 
 * 이 모듈은 다음을 구현합니다:
 * - HTML 파싱 (태그, 속성, 텍스트)
 * - DOM 트리 구축 (Element, Text 노드)
 * - 암시적 태그 추가 (html, head, body)
 * - 자식-부모 관계 관리
 */

/**
 * 텍스트 노드
 * book/html.md: DOM 트리의 텍스트 노드
 */
class Text {
  constructor(text, parent) {
    this.text = text;
    this.children = [];
    this.parent = parent;
  }

  toString() {
    return `"${this.text}"`;
  }
}

/**
 * 엘리먼트 노드
 * book/html.md: DOM 트리의 요소 노드
 */
class Element {
  constructor(tag, attributes, parent) {
    this.tag = tag;
    this.attributes = attributes;
    this.children = [];
    this.parent = parent;
  }

  toString() {
    // 속성을 문자열로 변환
    const attrs = Object.entries(this.attributes)
      .map(([k, v]) => ` ${k}="${v}"`)
      .join('');
    return `<${this.tag}${attrs}>`;
  }
}

/**
 * DOM 트리를 출력합니다 (디버깅용)
 * book/html.md: 트리 구조 시각화
 * 
 * @param {Element|Text} node - 출력할 노드
 * @param {number} indent - 들여쓰기 레벨
 */
function print_tree(node, indent = 0) {
  console.log(' '.repeat(indent) + node.toString());
  for (const child of node.children) {
    print_tree(child, indent + 2);
  }
}

/**
 * HTML 파서
 * book/html.md: HTML을 파싱하여 DOM 트리 생성
 */
class HTMLParser {
  constructor(body) {
    this.body = body;
    this.unfinished = [];  // book/html.md: 아직 닫히지 않은 태그 스택
  }

  /**
   * HTML을 파싱합니다
   * book/html.md: 문자 단위로 순회하며 태그/텍스트 구분
   * 
   * @returns {Element} 루트 노드
   */
  parse() {
    let text = '';
    let in_tag = false;
    
    for (const c of this.body) {
      if (c === '<') {
        in_tag = true;
        // 텍스트가 있으면 추가
        if (text) {
          this.add_text(text);
        }
        text = '';
      } else if (c === '>') {
        in_tag = false;
        // 태그 추가
        this.add_tag(text);
        text = '';
      } else {
        text += c;
      }
    }
    
    // 마지막 텍스트 처리
    if (!in_tag && text) {
      this.add_text(text);
    }
    
    return this.finish();
  }

  /**
   * 태그 문자열에서 태그명과 속성을 추출합니다
   * book/html.md: 속성 파싱 (key="value" 형식)
   * 
   * @param {string} text - 태그 내용
   * @returns {object} {tag, attributes}
   */
  get_attributes(text) {
    const parts = text.split(/\s+/);
    const tag = parts[0].toLowerCase();
    const attributes = {};
    
    // book/html.md: 속성 파싱
    for (let i = 1; i < parts.length; i++) {
      const attrpair = parts[i];
      if (attrpair.includes('=')) {
        let [key, value] = attrpair.split('=', 2);
        // 따옴표 제거
        if (value.length > 2 && (value[0] === '"' || value[0] === "'")) {
          value = value.substring(1, value.length - 1);
        }
        attributes[key.toLowerCase()] = value;
      } else {
        // 값 없는 속성 (예: disabled, checked)
        attributes[attrpair.toLowerCase()] = '';
      }
    }
    
    return { tag, attributes };
  }

  /**
   * 텍스트 노드를 추가합니다
   * book/html.md: 공백만 있는 텍스트는 무시
   * 
   * @param {string} text - 텍스트 내용
   */
  add_text(text) {
    // book/html.md: 공백만 있는 텍스트 무시
    if (text.trim().length === 0) return;
    
    // book/html.md: 암시적 태그 추가
    this.implicit_tags(null);
    
    const parent = this.unfinished[this.unfinished.length - 1];
    const node = new Text(text, parent);
    parent.children.push(node);
  }

  /**
   * 자동 닫힘 태그 목록
   * book/html.md: 닫는 태그가 없는 요소들
   */
  static SELF_CLOSING_TAGS = [
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr'
  ];

  /**
   * head 태그에 들어가는 태그 목록
   * book/html.md: 암시적 태그 추가 규칙
   */
  static HEAD_TAGS = [
    'base', 'basefont', 'bgsound', 'noscript',
    'link', 'meta', 'title', 'style', 'script'
  ];

  /**
   * 태그를 추가합니다
   * book/html.md: 여는 태그, 닫는 태그, 자동 닫힘 태그 처리
   * 
   * @param {string} tag - 태그 문자열
   */
  add_tag(tag) {
    const { tag: tagName, attributes } = this.get_attributes(tag);
    
    // book/html.md: 주석 무시
    if (tagName.startsWith('!')) return;
    
    // book/html.md: 암시적 태그 추가
    this.implicit_tags(tagName);
    
    if (tagName.startsWith('/')) {
      // book/html.md: 닫는 태그
      if (this.unfinished.length === 1) return;
      
      const node = this.unfinished.pop();
      const parent = this.unfinished[this.unfinished.length - 1];
      parent.children.push(node);
      
    } else if (HTMLParser.SELF_CLOSING_TAGS.includes(tagName)) {
      // book/html.md: 자동 닫힘 태그
      const parent = this.unfinished[this.unfinished.length - 1];
      const node = new Element(tagName, attributes, parent);
      parent.children.push(node);
      
    } else {
      // book/html.md: 여는 태그
      const parent = this.unfinished.length > 0 
        ? this.unfinished[this.unfinished.length - 1] 
        : null;
      const node = new Element(tagName, attributes, parent);
      this.unfinished.push(node);
    }
  }

  /**
   * 암시적 태그를 추가합니다
   * book/html.md: HTML 표준에 따른 암시적 태그 규칙
   * 
   * @param {string|null} tag - 현재 처리할 태그
   */
  implicit_tags(tag) {
    while (true) {
      const open_tags = this.unfinished.map(node => node.tag);
      
      // book/html.md: 루트 html 태그 추가
      if (open_tags.length === 0 && tag !== 'html') {
        this.add_tag('html');
        
      // book/html.md: head 또는 body 태그 추가
      } else if (open_tags.length === 1 && open_tags[0] === 'html' &&
                 !['head', 'body', '/html'].includes(tag)) {
        if (HTMLParser.HEAD_TAGS.includes(tag)) {
          this.add_tag('head');
        } else {
          this.add_tag('body');
        }
        
      // book/html.md: head 태그 자동 닫기
      } else if (open_tags.length === 2 && 
                 open_tags[0] === 'html' && open_tags[1] === 'head' &&
                 tag !== '/head' && !HTMLParser.HEAD_TAGS.includes(tag)) {
        this.add_tag('/head');
        
      } else {
        break;
      }
    }
  }

  /**
   * 파싱을 완료하고 루트 노드를 반환합니다
   * book/html.md: 열린 태그들을 모두 닫고 루트 반환
   * 
   * @returns {Element} 루트 노드
   */
  finish() {
    // book/html.md: 암시적 태그 추가
    if (this.unfinished.length === 0) {
      this.implicit_tags(null);
    }
    
    // book/html.md: 모든 열린 태그 닫기
    while (this.unfinished.length > 1) {
      const node = this.unfinished.pop();
      const parent = this.unfinished[this.unfinished.length - 1];
      parent.children.push(node);
    }
    
    return this.unfinished.pop();
  }
}

/**
 * Layout 클래스 (lab3에서 확장)
 * book/html.md: 토큰 대신 DOM 트리를 사용
 */
class Layout {
  constructor(tree, width, p5Instance) {
    this.tree = tree;
    this.width = width;
    this.p5Instance = p5Instance;
    this.display_list = [];
    
    // 커서와 스타일 상태
    this.cursor_x = HSTEP;
    this.cursor_y = VSTEP;
    this.weight = 'normal';
    this.style = 'roman';
    this.size = 12;
    
    this.line = [];
    
    // book/html.md: DOM 트리를 재귀적으로 순회
    this.recurse(tree);
    this.flush();
  }

  /**
   * DOM 트리를 재귀적으로 순회합니다
   * book/html.md: 텍스트 노드는 단어로 분할, 엘리먼트는 태그 처리
   * 
   * @param {Element|Text} tree - 순회할 노드
   */
  recurse(tree) {
    if (tree instanceof Text) {
      // 텍스트 노드: 단어로 분할
      const words = tree.text.split(/\s+/).filter(w => w.length > 0);
      for (const word of words) {
        this.word(word);
      }
    } else {
      // 엘리먼트 노드: 여는 태그 처리
      this.open_tag(tree.tag);
      
      // 자식 노드 재귀 처리
      for (const child of tree.children) {
        this.recurse(child);
      }
      
      // 닫는 태그 처리
      this.close_tag(tree.tag);
    }
  }

  /**
   * 여는 태그를 처리합니다
   * book/html.md: 태그에 따른 스타일 변경
   * 
   * @param {string} tag - 태그명
   */
  open_tag(tag) {
    if (tag === 'i') {
      this.style = 'italic';
    } else if (tag === 'b') {
      this.weight = 'bold';
    } else if (tag === 'small') {
      this.size -= 2;
    } else if (tag === 'big') {
      this.size += 4;
    } else if (tag === 'br') {
      this.flush();
    }
  }

  /**
   * 닫는 태그를 처리합니다
   * book/html.md: 스타일 상태 복원
   * 
   * @param {string} tag - 태그명
   */
  close_tag(tag) {
    if (tag === 'i') {
      this.style = 'roman';
    } else if (tag === 'b') {
      this.weight = 'normal';
    } else if (tag === 'small') {
      this.size += 2;
    } else if (tag === 'big') {
      this.size -= 4;
    } else if (tag === 'p') {
      this.flush();
      this.cursor_y += VSTEP;
    }
  }

  /**
   * 단어를 현재 줄에 추가합니다
   */
  word(word) {
    const font = get_font(this.size, this.weight, this.style);
    
    if (this.p5Instance) {
      font.setP5Instance(this.p5Instance);
    }
    
    const w = font.measure(word);
    
    if (this.cursor_x + w > this.width - HSTEP) {
      this.flush();
    }
    
    this.line.push({
      x: this.cursor_x,
      word: word,
      font: font
    });
    
    this.cursor_x += w + font.measure(' ');
  }

  /**
   * 현재 줄을 flush합니다
   */
  flush() {
    if (this.line.length === 0) return;
    
    const metrics = this.line.map(item => item.font.metrics());
    const max_ascent = Math.max(...metrics.map(m => m.ascent));
    const baseline = this.cursor_y + 1.25 * max_ascent;
    
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
    
    const max_descent = Math.max(...metrics.map(m => m.descent));
    this.cursor_y = baseline + 1.25 * max_descent;
    
    this.cursor_x = HSTEP;
    this.line = [];
  }
}

/**
 * 브라우저 클래스
 * book/html.md: HTML 파싱을 통합
 */
class Browser {
  constructor(canvas, p5Instance) {
    this.canvas = canvas;
    this.p5Instance = p5Instance;
    this.scroll = 0;
    this.display_list = [];
    this.width = WIDTH;
    this.height = HEIGHT;
    this.nodes = null;
  }

  async load(url) {
    const body = await url.request();
    
    // book/html.md: HTML 파싱
    this.nodes = new HTMLParser(body).parse();
    
    // book/html.md: DOM 트리를 레이아웃
    const layout = new Layout(this.nodes, this.width, this.p5Instance);
    this.display_list = layout.display_list;
    
    this.draw();
  }

  draw() {
    this.canvas.delete("all");
    
    for (const item of this.display_list) {
      const { x, y, word, font } = item;
      
      if (y > this.scroll + this.height) continue;
      if (y + font.metrics('linespace') < this.scroll) continue;
      
      this.canvas.create_text(x, y - this.scroll, {
        text: word,
        font: font,
        anchor: 'nw'
      });
    }
  }

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
    Element,
    print_tree,
    HTMLParser,
    Layout,
    Browser
  };
}

