/**
 * Lab 5: Laying Out Pages
 * book/layout.md - 레이아웃 트리와 블록/인라인 레이아웃을 구현합니다
 * 
 * 이 모듈은 다음을 구현합니다:
 * - 레이아웃 트리 (Layout Tree)
 * - 블록 레이아웃 (Block Layout)
 * - 인라인 레이아웃 (Inline Layout)
 * - 디스플레이 리스트 생성
 */

// book/layout.md: 블록 요소 목록
const BLOCK_ELEMENTS = [
  'html', 'body', 'article', 'section', 'nav', 'aside',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hgroup', 'header',
  'footer', 'address', 'p', 'hr', 'pre', 'blockquote',
  'ol', 'ul', 'menu', 'li', 'dl', 'dt', 'dd', 'figure',
  'figcaption', 'main', 'div', 'table', 'form', 'fieldset',
  'legend', 'details', 'summary'
];

/**
 * BlockLayout 클래스
 * book/layout.md: HTML 노드를 레이아웃하는 박스
 */
class BlockLayout {
  constructor(node, parent, previous) {
    // book/layout.md: 레이아웃 트리 구조
    this.node = node;           // 대응하는 HTML 노드
    this.parent = parent;       // 부모 레이아웃 노드
    this.previous = previous;   // 이전 형제 레이아웃 노드
    this.children = [];         // 자식 레이아웃 노드들
    
    // book/layout.md: 박스 기하 정보
    this.x = null;
    this.y = null;
    this.width = null;
    this.height = null;
    
    // 인라인 모드에서 사용하는 디스플레이 리스트
    this.display_list = [];
  }

  /**
   * 레이아웃을 실행합니다
   * book/layout.md: 위치와 크기를 계산하고 자식들을 레이아웃
   */
  layout() {
    // book/layout.md: 1단계 - 위치와 너비 계산
    this.x = this.parent.x;
    this.width = this.parent.width;
    
    if (this.previous) {
      // book/layout.md: 이전 형제 아래에 배치
      this.y = this.previous.y + this.previous.height;
    } else {
      // book/layout.md: 부모의 시작 위치
      this.y = this.parent.y;
    }
    
    // book/layout.md: 2단계 - 레이아웃 모드 결정
    const mode = this.layout_mode();
    
    if (mode === 'block') {
      // book/layout.md: 블록 모드 - 자식 레이아웃 노드 생성
      let previous = null;
      for (const child of this.node.children) {
        const next = new BlockLayout(child, this, previous);
        this.children.push(next);
        previous = next;
      }
    } else {
      // book/layout.md: 인라인 모드 - 텍스트 레이아웃
      this.cursor_x = 0;
      this.cursor_y = 0;
      this.weight = 'normal';
      this.style = 'roman';
      this.size = 12;
      
      this.line = [];
      this.recurse(this.node);
      this.flush();
    }
    
    // book/layout.md: 3단계 - 자식들 레이아웃
    for (const child of this.children) {
      child.layout();
    }
    
    // book/layout.md: 4단계 - 높이 계산
    if (mode === 'block') {
      // 블록 모드: 자식 높이의 합
      this.height = this.children.reduce((sum, child) => sum + child.height, 0);
    } else {
      // 인라인 모드: 누적된 줄 높이
      this.height = this.cursor_y;
    }
  }

  /**
   * 레이아웃 모드를 결정합니다
   * book/layout.md: 블록 vs 인라인 모드
   * 
   * @returns {string} 'block' 또는 'inline'
   */
  layout_mode() {
    // book/layout.md: 텍스트 노드는 인라인
    if (this.node instanceof Text) {
      return 'inline';
    }
    
    // book/layout.md: 자식 중 블록 요소가 있으면 블록 모드
    const hasBlockChild = this.node.children.some(child => 
      child instanceof Element && BLOCK_ELEMENTS.includes(child.tag)
    );
    
    if (hasBlockChild) {
      return 'block';
    }
    
    // book/layout.md: 자식이 있으면 인라인 (모두 인라인)
    if (this.node.children.length > 0) {
      return 'inline';
    }
    
    // book/layout.md: 자식이 없으면 블록
    return 'block';
  }

  /**
   * DOM 트리를 재귀적으로 순회합니다 (인라인 모드)
   * book/layout.md: 텍스트와 인라인 요소 처리
   */
  recurse(tree) {
    if (tree instanceof Text) {
      // 텍스트 노드: 단어로 분할
      const words = tree.text.split(/\s+/).filter(w => w.length > 0);
      for (const word of words) {
        this.word(word);
      }
    } else {
      // 엘리먼트 노드
      this.open_tag(tree.tag);
      for (const child of tree.children) {
        this.recurse(child);
      }
      this.close_tag(tree.tag);
    }
  }

  /**
   * 여는 태그를 처리합니다
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
   * book/layout.md: 단어 감싸기
   */
  word(word) {
    const font = get_font(this.size, this.weight, this.style);
    const w = font.measure(word);
    
    // book/layout.md: 줄 너비를 넘으면 flush
    if (this.cursor_x + w > this.width) {
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
   * book/layout.md: 베이스라인 정렬
   */
  flush() {
    if (this.line.length === 0) return;
    
    // book/layout.md: 메트릭 수집
    const metrics = this.line.map(item => item.font.metrics());
    const max_ascent = Math.max(...metrics.map(m => m.ascent));
    const baseline = this.cursor_y + 1.25 * max_ascent;
    
    // book/layout.md: 베이스라인에 맞춰 배치
    for (const item of this.line) {
      const x = this.x + item.x;  // 상대 좌표를 절대 좌표로
      const y = this.y + baseline - item.font.metrics('ascent');
      
      this.display_list.push({
        x: x,
        y: y,
        word: item.word,
        font: item.font
      });
    }
    
    // book/layout.md: 다음 줄 위치 계산
    const max_descent = Math.max(...metrics.map(m => m.descent));
    this.cursor_y = baseline + 1.25 * max_descent;
    
    this.cursor_x = 0;
    this.line = [];
  }

  /**
   * 그리기 명령을 생성합니다
   * book/layout.md: 디스플레이 리스트 생성
   * 
   * @returns {Array} 그리기 명령 배열
   */
  paint() {
    const cmds = [];
    
    // book/layout.md: <pre> 태그는 배경색 추가
    if (this.node instanceof Element && this.node.tag === 'pre') {
      cmds.push(new DrawRect(
        this.x, this.y,
        this.x + this.width, this.y + this.height,
        'gray'
      ));
    }
    
    // book/layout.md: 인라인 모드면 텍스트 그리기
    if (this.layout_mode() === 'inline') {
      for (const item of this.display_list) {
        cmds.push(new DrawText(
          item.x, item.y, item.word, item.font
        ));
      }
    }
    
    return cmds;
  }

  toString() {
    return `BlockLayout[${this.layout_mode()}](x=${this.x}, y=${this.y}, ` +
           `width=${this.width}, height=${this.height})`;
  }
}

/**
 * DocumentLayout 클래스
 * book/layout.md: 루트 레이아웃 노드
 */
class DocumentLayout {
  constructor(node) {
    this.node = node;
    this.parent = null;
    this.previous = null;
    this.children = [];
    
    // 문서 높이
    this.height = 0;
  }

  /**
   * 문서 레이아웃을 실행합니다
   * book/layout.md: 페이지 여백 설정 및 자식 레이아웃
   */
  layout() {
    // book/layout.md: 자식 블록 레이아웃 생성
    const child = new BlockLayout(this.node, this, null);
    this.children.push(child);
    
    // book/layout.md: 페이지 여백 설정
    this.width = WIDTH - 2 * HSTEP;
    this.x = HSTEP;
    this.y = VSTEP;
    
    // 자식 레이아웃 실행
    child.layout();
    
    // book/layout.md: 전체 문서 높이 기록
    this.height = child.height;
  }

  /**
   * 그리기 명령을 생성합니다
   */
  paint() {
    // 루트는 그리기 명령을 생성하지 않음
    return [];
  }

  toString() {
    return 'DocumentLayout()';
  }
}

/**
 * DrawText 클래스
 * book/layout.md: 텍스트 그리기 명령
 */
class DrawText {
  constructor(x1, y1, text, font) {
    this.top = y1;
    this.left = x1;
    this.text = text;
    this.font = font;
    
    // book/layout.md: 바운딩 박스
    this.bottom = y1 + font.metrics('linespace');
  }

  /**
   * 그리기 명령을 실행합니다
   * book/layout.md: 스크롤을 반영하여 렌더링
   */
  execute(scroll, canvas) {
    canvas.create_text(this.left, this.top - scroll, {
      text: this.text,
      font: this.font,
      anchor: 'nw'
    });
  }

  toString() {
    return `DrawText(top=${this.top} left=${this.left} ` +
           `bottom=${this.bottom} text=${this.text})`;
  }
}

/**
 * DrawRect 클래스
 * book/layout.md: 사각형 그리기 명령
 */
class DrawRect {
  constructor(x1, y1, x2, y2, color) {
    this.top = y1;
    this.left = x1;
    this.bottom = y2;
    this.right = x2;
    this.color = color;
  }

  /**
   * 그리기 명령을 실행합니다
   */
  execute(scroll, canvas) {
    canvas.create_rectangle(
      this.left, this.top - scroll,
      this.right, this.bottom - scroll,
      {
        width: 0,
        fill: this.color
      }
    );
  }

  toString() {
    return `DrawRect(top=${this.top} left=${this.left} ` +
           `bottom=${this.bottom} right=${this.right} color=${this.color})`;
  }
}

/**
 * 레이아웃 트리를 순회하며 그리기 명령을 수집합니다
 * book/layout.md: 전위 순회로 디스플레이 리스트 생성
 * 
 * @param {BlockLayout|DocumentLayout} layout_object - 레이아웃 객체
 * @param {Array} display_list - 그리기 명령 목록
 */
function paint_tree(layout_object, display_list) {
  // book/layout.md: 현재 노드의 그리기 명령 추가
  display_list.push(...layout_object.paint());
  
  // book/layout.md: 자식 노드 재귀 처리
  for (const child of layout_object.children) {
    paint_tree(child, display_list);
  }
}

/**
 * 브라우저 클래스
 * book/layout.md: 레이아웃 트리 통합
 */
class Browser {
  constructor(canvas, p5Instance) {
    this.canvas = canvas;
    this.p5Instance = p5Instance;
    this.scroll = 0;
    this.display_list = [];
    this.width = WIDTH;
    this.height = HEIGHT;
    this.document = null;
  }

  /**
   * URL을 로드합니다
   * book/layout.md: 파싱 → 레이아웃 → 페인트
   */
  async load(url) {
    // book/layout.md: 1단계 - HTML 파싱
    const body = await url.request();
    const nodes = new HTMLParser(body).parse();
    
    // book/layout.md: 2단계 - 레이아웃 트리 생성
    this.document = new DocumentLayout(nodes);
    this.document.layout();
    
    // book/layout.md: 3단계 - 디스플레이 리스트 생성
    this.display_list = [];
    paint_tree(this.document, this.display_list);
    
    this.draw();
  }

  /**
   * 화면에 그립니다
   * book/layout.md: 스크롤 오프셋 반영
   */
  draw() {
    this.canvas.delete("all");
    
    for (const cmd of this.display_list) {
      // book/layout.md: 가시 영역만 렌더링
      if (cmd.top > this.scroll + this.height) continue;
      if (cmd.bottom < this.scroll) continue;
      
      cmd.execute(this.scroll, this.canvas);
    }
  }

  /**
   * 스크롤을 처리합니다
   */
  scrolldown() {
    // book/layout.md: 문서 높이를 고려한 스크롤 한계
    const max_y = Math.max(this.document.height + 2 * VSTEP - this.height, 0);
    this.scroll = Math.min(this.scroll + SCROLL_STEP, max_y);
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
    BLOCK_ELEMENTS,
    BlockLayout,
    DocumentLayout,
    DrawText,
    DrawRect,
    paint_tree,
    Browser
  };
}

