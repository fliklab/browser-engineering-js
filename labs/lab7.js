/**
 * Lab 7: Handling Buttons and Links
 * book/chrome.md - 클릭 이벤트, 탭, Chrome UI를 구현합니다
 * 
 * 이 모듈은 다음을 구현합니다:
 * - 클릭 이벤트 처리 및 링크 탐색
 * - 탭 관리 (멀티탭 브라우저)
 * - Chrome UI (주소창, 탭 바, 버튼)
 * - 뒤로가기 기능
 */

/**
 * Rect 클래스
 * book/chrome.md: 사각형 영역 표현 및 충돌 검사
 */
class Rect {
  constructor(left, top, right, bottom) {
    this.left = left;
    this.top = top;
    this.right = right;
    this.bottom = bottom;
  }

  /**
   * 점이 사각형 안에 있는지 확인
   * book/chrome.md: 클릭 이벤트 처리
   */
  contains_point(x, y) {
    return x >= this.left && x < this.right &&
           y >= this.top && y < this.bottom;
  }
}

/**
 * DrawRect 클래스 - Rect 사용
 * book/chrome.md: 사각형 그리기
 */
class DrawRect {
  constructor(rect, color) {
    this.rect = rect;
    this.color = color;
    this.top = rect.top;
    this.bottom = rect.bottom;
  }

  execute(scroll, canvas) {
    canvas.create_rectangle(
      this.rect.left, this.rect.top - scroll,
      this.rect.right, this.rect.bottom - scroll,
      {
        width: 0,
        fill: this.color
      }
    );
  }

  toString() {
    return `DrawRect(top=${this.rect.top} left=${this.rect.left} ` +
           `bottom=${this.rect.bottom} right=${this.rect.right} color=${this.color})`;
  }
}

/**
 * DrawText 클래스 - Rect 포함
 * book/chrome.md: 텍스트 바운딩 박스
 */
class DrawText {
  constructor(x1, y1, text, font, color = 'black') {
    this.rect = new Rect(
      x1, y1,
      x1 + font.measure(text), y1 + font.metrics('linespace')
    );
    this.text = text;
    this.font = font;
    this.color = color;
    this.top = this.rect.top;
    this.bottom = this.rect.bottom;
  }

  execute(scroll, canvas) {
    canvas.create_text(this.rect.left, this.rect.top - scroll, {
      text: this.text,
      font: this.font,
      anchor: 'nw',
      fill: this.color
    });
  }

  toString() {
    return `DrawText(text=${this.text})`;
  }
}

/**
 * DrawLine 클래스
 * book/chrome.md: 선 그리기 (Chrome UI 경계)
 */
class DrawLine {
  constructor(x1, y1, x2, y2, color, thickness) {
    this.rect = new Rect(x1, y1, x2, y2);
    this.color = color;
    this.thickness = thickness;
    this.top = Math.min(y1, y2);
    this.bottom = Math.max(y1, y2);
  }

  execute(scroll, canvas) {
    canvas.create_line(
      this.rect.left, this.rect.top - scroll,
      this.rect.right, this.rect.bottom - scroll,
      {
        fill: this.color,
        width: this.thickness
      }
    );
  }

  toString() {
    return `DrawLine(${this.rect.left}, ${this.rect.top}, ` +
           `${this.rect.right}, ${this.rect.bottom}, color=${this.color})`;
  }
}

/**
 * DrawOutline 클래스
 * book/chrome.md: 테두리 그리기
 */
class DrawOutline {
  constructor(rect, color, thickness) {
    this.rect = rect;
    this.color = color;
    this.thickness = thickness;
    this.top = rect.top;
    this.bottom = rect.bottom;
  }

  execute(scroll, canvas) {
    canvas.create_rectangle(
      this.rect.left, this.rect.top - scroll,
      this.rect.right, this.rect.bottom - scroll,
      {
        width: this.thickness,
        outline: this.color
      }
    );
  }

  toString() {
    return `DrawOutline(rect=${this.rect}, color=${this.color})`;
  }
}

/**
 * LineLayout 클래스
 * book/chrome.md: 텍스트 줄 레이아웃
 */
class LineLayout {
  constructor(node, parent, previous) {
    this.node = node;
    this.parent = parent;
    this.previous = previous;
    this.children = [];
    this.x = null;
    this.y = null;
    this.width = null;
    this.height = null;
  }

  layout() {
    this.width = this.parent.width;
    this.x = this.parent.x;
    
    if (this.previous) {
      this.y = this.previous.y + this.previous.height;
    } else {
      this.y = this.parent.y;
    }
    
    // 자식 단어들 레이아웃
    for (const word of this.children) {
      word.layout();
    }
    
    if (this.children.length === 0) {
      this.height = 0;
      return;
    }
    
    // book/chrome.md: 베이스라인 정렬
    const max_ascent = Math.max(...this.children.map(w => w.font.metrics('ascent')));
    const baseline = this.y + 1.25 * max_ascent;
    
    for (const word of this.children) {
      word.y = baseline - word.font.metrics('ascent');
    }
    
    const max_descent = Math.max(...this.children.map(w => w.font.metrics('descent')));
    this.height = 1.25 * (max_ascent + max_descent);
  }

  paint() {
    return [];
  }

  toString() {
    return `LineLayout(x=${this.x}, y=${this.y}, width=${this.width}, height=${this.height})`;
  }
}

/**
 * TextLayout 클래스
 * book/chrome.md: 개별 단어 레이아웃
 */
class TextLayout {
  constructor(node, word, parent, previous) {
    this.node = node;
    this.word = word;
    this.children = [];
    this.parent = parent;
    this.previous = previous;
    this.x = null;
    this.y = null;
    this.width = null;
    this.height = null;
    this.font = null;
  }

  layout() {
    const weight = this.node.style['font-weight'];
    let fontStyle = this.node.style['font-style'];
    if (fontStyle === 'normal') fontStyle = 'roman';
    const size = parseInt(parseFloat(this.node.style['font-size']) * 0.75);
    this.font = get_font(size, weight, fontStyle);
    
    this.width = this.font.measure(this.word);
    
    if (this.previous) {
      const space = this.previous.font.measure(' ');
      this.x = this.previous.x + space + this.previous.width;
    } else {
      this.x = this.parent.x;
    }
    
    this.height = this.font.metrics('linespace');
  }

  paint() {
    const color = this.node.style['color'];
    return [new DrawText(this.x, this.y, this.word, this.font, color)];
  }

  toString() {
    return `TextLayout(x=${this.x}, y=${this.y}, word=${this.word})`;
  }
}

/**
 * BlockLayout 클래스 - 향상된 레이아웃
 * book/chrome.md: 줄 기반 레이아웃으로 클릭 감지 향상
 */
class BlockLayout {
  constructor(node, parent, previous) {
    this.node = node;
    this.parent = parent;
    this.previous = previous;
    this.children = [];
    
    this.x = null;
    this.y = null;
    this.width = null;
    this.height = null;
  }

  layout() {
    this.width = this.parent.width;
    this.x = this.parent.x;
    
    if (this.previous) {
      this.y = this.previous.y + this.previous.height;
    } else {
      this.y = this.parent.y;
    }
    
    const mode = this.layout_mode();
    
    if (mode === 'block') {
      let previous = null;
      for (const child of this.node.children) {
        const next = new BlockLayout(child, this, previous);
        this.children.push(next);
        previous = next;
      }
    } else {
      // book/chrome.md: 줄 기반 레이아웃
      this.cursor_x = 0;
      this.new_line();
      this.recurse(this.node);
    }
    
    for (const child of this.children) {
      child.layout();
    }
    
    this.height = this.children.reduce((sum, child) => sum + child.height, 0);
  }

  layout_mode() {
    if (this.node instanceof Text) {
      return 'inline';
    }
    
    const hasBlockChild = this.node.children.some(child => 
      child instanceof Element && BLOCK_ELEMENTS.includes(child.tag)
    );
    
    if (hasBlockChild) {
      return 'block';
    }
    
    if (this.node.children.length > 0) {
      return 'inline';
    }
    
    return 'block';
  }

  recurse(tree) {
    if (tree instanceof Text) {
      const words = tree.text.split(/\s+/).filter(w => w.length > 0);
      for (const word of words) {
        this.word(tree, word);
      }
    } else {
      if (tree.tag === 'br') {
        this.new_line();
      }
      for (const child of tree.children) {
        this.recurse(child);
      }
    }
  }

  /**
   * 새로운 줄을 생성합니다
   * book/chrome.md: LineLayout 생성
   */
  new_line() {
    this.cursor_x = 0;
    const last_line = this.children.length > 0 
      ? this.children[this.children.length - 1] 
      : null;
    const new_line = new LineLayout(this.node, this, last_line);
    this.children.push(new_line);
  }

  /**
   * 단어를 현재 줄에 추가합니다
   * book/chrome.md: TextLayout 생성
   */
  word(node, word) {
    const weight = node.style['font-weight'];
    let fontStyle = node.style['font-style'];
    if (fontStyle === 'normal') fontStyle = 'roman';
    const size = parseInt(parseFloat(node.style['font-size']) * 0.75);
    const font = get_font(size, weight, fontStyle);
    
    const w = font.measure(word);
    
    if (this.cursor_x + w > this.width) {
      this.new_line();
    }
    
    const line = this.children[this.children.length - 1];
    const previous_word = line.children.length > 0
      ? line.children[line.children.length - 1]
      : null;
    const text = new TextLayout(node, word, line, previous_word);
    line.children.push(text);
    this.cursor_x += w + font.measure(' ');
  }

  /**
   * 자기 자신의 Rect를 반환
   * book/chrome.md: 클릭 영역 계산
   */
  self_rect() {
    return new Rect(this.x, this.y, this.x + this.width, this.y + this.height);
  }

  paint() {
    const cmds = [];
    
    const bgcolor = this.node.style?.['background-color'] || 'transparent';
    if (bgcolor !== 'transparent') {
      cmds.push(new DrawRect(this.self_rect(), bgcolor));
    }
    
    return cmds;
  }

  toString() {
    return `BlockLayout[${this.layout_mode()}](x=${this.x}, y=${this.y}, ` +
           `width=${this.width}, height=${this.height})`;
  }
}

/**
 * Tab 클래스
 * book/chrome.md: 개별 탭 관리
 */
class Tab {
  constructor(tab_height) {
    this.url = null;
    this.history = [];  // book/chrome.md: 방문 기록
    this.tab_height = tab_height;
    this.scroll = 0;
    this.document = null;
    this.display_list = [];
    this.nodes = null;
  }

  /**
   * URL을 로드합니다
   * book/chrome.md: 페이지 로드 및 히스토리 관리
   */
  async load(url) {
    this.scroll = 0;
    this.url = url;
    this.history.push(url);
    
    // HTML 파싱
    const body = await url.request();
    this.nodes = new HTMLParser(body).parse();
    
    // CSS 스타일 적용
    let rules = new CSSParser(DEFAULT_STYLE_SHEET).parse();
    
    const links = tree_to_list(this.nodes)
      .filter(node => 
        node instanceof Element &&
        node.tag === 'link' &&
        node.attributes.rel === 'stylesheet' &&
        node.attributes.href
      )
      .map(node => node.attributes.href);
    
    for (const link of links) {
      try {
        const styleBody = await url.resolve(link).request();
        rules = rules.concat(new CSSParser(styleBody).parse());
      } catch (e) {
        console.error(`Failed to load stylesheet: ${link}`, e);
      }
    }
    
    rules.sort((a, b) => cascade_priority(a) - cascade_priority(b));
    style(this.nodes, rules);
    
    // 레이아웃
    this.document = new DocumentLayout(this.nodes);
    this.document.layout();
    
    this.display_list = [];
    paint_tree(this.document, this.display_list);
  }

  /**
   * 탭을 그립니다
   * book/chrome.md: 탭 컨텐츠 렌더링
   */
  draw(canvas, offset) {
    for (const cmd of this.display_list) {
      if (cmd.top > this.scroll + this.tab_height) continue;
      if (cmd.bottom < this.scroll) continue;
      cmd.execute(this.scroll - offset, canvas);
    }
  }

  /**
   * 스크롤을 처리합니다
   */
  scrolldown() {
    const max_y = Math.max(
      this.document.height + 2 * VSTEP - this.tab_height, 0
    );
    this.scroll = Math.min(this.scroll + SCROLL_STEP, max_y);
  }

  scrollup() {
    this.scroll = Math.max(0, this.scroll - SCROLL_STEP);
  }

  /**
   * 클릭 이벤트를 처리합니다
   * book/chrome.md: 링크 클릭 감지
   */
  click(x, y) {
    y += this.scroll;
    
    // book/chrome.md: 클릭 위치에 있는 모든 레이아웃 객체 찾기
    const objs = tree_to_list(this.document)
      .filter(obj => 
        obj.x <= x && x < obj.x + obj.width &&
        obj.y <= y && y < obj.y + obj.height
      );
    
    if (objs.length === 0) return;
    
    // book/chrome.md: 가장 안쪽 객체부터 확인
    let elt = objs[objs.length - 1].node;
    
    while (elt) {
      if (elt instanceof Text) {
        // 텍스트 노드는 부모 확인
        elt = elt.parent;
      } else if (elt.tag === 'a' && elt.attributes.href) {
        // book/chrome.md: 링크를 찾았으면 탐색
        const url = this.url.resolve(elt.attributes.href);
        return this.load(url);
      } else {
        elt = elt.parent;
      }
    }
  }

  /**
   * 뒤로가기
   * book/chrome.md: 히스토리 관리
   */
  go_back() {
    if (this.history.length > 1) {
      this.history.pop();  // 현재 페이지 제거
      const back = this.history.pop();  // 이전 페이지
      this.load(back);  // load가 다시 히스토리에 추가
    }
  }

  toString() {
    return `Tab(history=${this.history})`;
  }
}

/**
 * Chrome 클래스
 * book/chrome.md: 브라우저 UI (탭 바, 주소창, 버튼)
 */
class Chrome {
  constructor(browser) {
    this.browser = browser;
    this.focus = null;  // 포커스된 UI 요소
    this.address_bar = '';  // 주소창 입력
    
    this.font = get_font(20, 'normal', 'roman');
    this.font_height = this.font.metrics('linespace');
    
    this.padding = 5;
    
    // book/chrome.md: 탭 바 영역
    this.tabbar_top = 0;
    this.tabbar_bottom = this.font_height + 2 * this.padding;
    
    // book/chrome.md: 새 탭 버튼
    const plus_width = this.font.measure('+') + 2 * this.padding;
    this.newtab_rect = new Rect(
      this.padding, this.padding,
      this.padding + plus_width,
      this.padding + this.font_height
    );
    
    // book/chrome.md: URL 바 영역
    this.urlbar_top = this.tabbar_bottom;
    this.urlbar_bottom = this.urlbar_top + this.font_height + 2 * this.padding;
    
    // book/chrome.md: 뒤로가기 버튼
    const back_width = this.font.measure('<') + 2 * this.padding;
    this.back_rect = new Rect(
      this.padding,
      this.urlbar_top + this.padding,
      this.padding + back_width,
      this.urlbar_bottom - this.padding
    );
    
    // book/chrome.md: 주소창
    this.address_rect = new Rect(
      this.back_rect.right + this.padding,
      this.urlbar_top + this.padding,
      WIDTH - this.padding,
      this.urlbar_bottom - this.padding
    );
    
    this.bottom = this.urlbar_bottom;
  }

  /**
   * 탭의 사각형 영역을 반환합니다
   * book/chrome.md: 탭 버튼 위치 계산
   */
  tab_rect(i) {
    const tabs_start = this.newtab_rect.right + this.padding;
    const tab_width = this.font.measure(`Tab ${i}`) + 2 * this.padding;
    return new Rect(
      tabs_start + tab_width * i, this.tabbar_top,
      tabs_start + tab_width * (i + 1), this.tabbar_bottom
    );
  }

  /**
   * Chrome UI를 그립니다
   * book/chrome.md: 탭 바, 주소창, 버튼 렌더링
   */
  paint() {
    const cmds = [];
    
    // book/chrome.md: 배경
    cmds.push(new DrawRect(
      new Rect(0, 0, WIDTH, this.bottom),
      'white'
    ));
    
    // book/chrome.md: 하단 경계선
    cmds.push(new DrawLine(
      0, this.bottom, WIDTH, this.bottom, 'black', 1
    ));
    
    // book/chrome.md: 새 탭 버튼
    cmds.push(new DrawOutline(this.newtab_rect, 'black', 1));
    cmds.push(new DrawText(
      this.newtab_rect.left + this.padding,
      this.newtab_rect.top,
      '+', this.font, 'black'
    ));
    
    // book/chrome.md: 탭들
    for (let i = 0; i < this.browser.tabs.length; i++) {
      const tab = this.browser.tabs[i];
      const bounds = this.tab_rect(i);
      
      // 탭 경계
      cmds.push(new DrawLine(
        bounds.left, 0, bounds.left, bounds.bottom, 'black', 1
      ));
      cmds.push(new DrawLine(
        bounds.right, 0, bounds.right, bounds.bottom, 'black', 1
      ));
      
      // 탭 이름
      cmds.push(new DrawText(
        bounds.left + this.padding, bounds.top + this.padding,
        `Tab ${i}`, this.font, 'black'
      ));
      
      // book/chrome.md: 활성 탭 표시
      if (tab === this.browser.active_tab) {
        cmds.push(new DrawLine(
          0, bounds.bottom, bounds.left, bounds.bottom, 'black', 1
        ));
        cmds.push(new DrawLine(
          bounds.right, bounds.bottom, WIDTH, bounds.bottom, 'black', 1
        ));
      }
    }
    
    // book/chrome.md: 뒤로가기 버튼
    cmds.push(new DrawOutline(this.back_rect, 'black', 1));
    cmds.push(new DrawText(
      this.back_rect.left + this.padding,
      this.back_rect.top,
      '<', this.font, 'black'
    ));
    
    // book/chrome.md: 주소창
    cmds.push(new DrawOutline(this.address_rect, 'black', 1));
    
    if (this.focus === 'address bar') {
      // book/chrome.md: 주소창 편집 모드
      cmds.push(new DrawText(
        this.address_rect.left + this.padding,
        this.address_rect.top,
        this.address_bar, this.font, 'black'
      ));
      
      // 커서 표시
      const w = this.font.measure(this.address_bar);
      cmds.push(new DrawLine(
        this.address_rect.left + this.padding + w,
        this.address_rect.top,
        this.address_rect.left + this.padding + w,
        this.address_rect.bottom,
        'red', 1
      ));
    } else {
      // book/chrome.md: 현재 URL 표시
      const url = this.browser.active_tab 
        ? this.browser.active_tab.url.toString()
        : '';
      cmds.push(new DrawText(
        this.address_rect.left + this.padding,
        this.address_rect.top,
        url, this.font, 'black'
      ));
    }
    
    return cmds;
  }

  /**
   * Chrome UI 클릭 처리
   * book/chrome.md: 버튼 및 탭 클릭
   */
  click(x, y) {
    this.focus = null;
    
    if (this.newtab_rect.contains_point(x, y)) {
      // book/chrome.md: 새 탭 생성
      this.browser.new_tab(new URL('https://browser.engineering/'));
    } else if (this.back_rect.contains_point(x, y)) {
      // book/chrome.md: 뒤로가기
      this.browser.active_tab.go_back();
    } else if (this.address_rect.contains_point(x, y)) {
      // book/chrome.md: 주소창 포커스
      this.focus = 'address bar';
      this.address_bar = '';
    } else {
      // book/chrome.md: 탭 클릭 확인
      for (let i = 0; i < this.browser.tabs.length; i++) {
        if (this.tab_rect(i).contains_point(x, y)) {
          this.browser.active_tab = this.browser.tabs[i];
          break;
        }
      }
    }
  }

  /**
   * 키 입력 처리
   * book/chrome.md: 주소창 입력
   */
  keypress(char) {
    if (this.focus === 'address bar') {
      this.address_bar += char;
    }
  }

  /**
   * 엔터 키 처리
   * book/chrome.md: 주소창에서 URL 로드
   */
  enter() {
    if (this.focus === 'address bar') {
      this.browser.active_tab.load(new URL(this.address_bar));
      this.focus = null;
    }
  }
}

/**
 * Browser 클래스
 * book/chrome.md: 멀티탭 브라우저
 */
class Browser {
  constructor(canvas, p5Instance) {
    this.canvas = canvas;
    this.p5Instance = p5Instance;
    this.tabs = [];
    this.active_tab = null;
    this.chrome = new Chrome(this);
    
    this.canvas.setBackground('white');
  }

  /**
   * 새 탭을 생성합니다
   * book/chrome.md: 탭 생성 및 활성화
   */
  async new_tab(url) {
    const new_tab = new Tab(HEIGHT - this.chrome.bottom);
    await new_tab.load(url);
    this.active_tab = new_tab;
    this.tabs.push(new_tab);
    this.draw();
  }

  /**
   * 화면을 그립니다
   * book/chrome.md: 활성 탭 + Chrome UI
   */
  draw() {
    this.canvas.delete("all");
    
    if (this.active_tab) {
      this.active_tab.draw(this.canvas, this.chrome.bottom);
    }
    
    for (const cmd of this.chrome.paint()) {
      cmd.execute(0, this.canvas);
    }
  }

  /**
   * 클릭 이벤트 처리
   * book/chrome.md: Chrome UI vs 탭 컨텐츠
   */
  handle_click(x, y) {
    if (y < this.chrome.bottom) {
      this.chrome.click(x, y);
    } else if (this.active_tab) {
      const tab_y = y - this.chrome.bottom;
      this.active_tab.click(x, tab_y);
    }
    this.draw();
  }

  /**
   * 키 입력 처리
   */
  handle_key(char) {
    this.chrome.keypress(char);
    this.draw();
  }

  /**
   * 엔터 키 처리
   */
  handle_enter() {
    this.chrome.enter();
    this.draw();
  }

  /**
   * 스크롤 처리
   */
  handle_down() {
    if (this.active_tab) {
      this.active_tab.scrolldown();
      this.draw();
    }
  }

  handle_up() {
    if (this.active_tab) {
      this.active_tab.scrollup();
      this.draw();
    }
  }

  handleWheel(delta) {
    if (delta > 0) {
      this.handle_down();
    } else {
      this.handle_up();
    }
  }
}

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Rect,
    DrawRect,
    DrawText,
    DrawLine,
    DrawOutline,
    LineLayout,
    TextLayout,
    BlockLayout,
    Tab,
    Chrome,
    Browser
  };
}

