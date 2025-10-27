/**
 * Lab 6: Applying Author Styles
 * book/styles.md - CSS 파싱과 스타일 적용을 구현합니다
 * 
 * 이 모듈은 다음을 구현합니다:
 * - CSS 파서 (선택자, 속성, 값)
 * - 선택자 매칭 (태그 선택자, 자손 선택자)
 * - 스타일 상속 및 캐스케이드
 * - 외부 스타일시트 로딩
 */

/**
 * CSS 파서
 * book/styles.md: CSS 문법을 파싱합니다
 */
class CSSParser {
  constructor(s) {
    this.s = s;
    this.i = 0;
  }

  /**
   * 공백을 건너뜁니다
   * book/styles.md: CSS는 공백에 무관
   */
  whitespace() {
    while (this.i < this.s.length && /\s/.test(this.s[this.i])) {
      this.i++;
    }
  }

  /**
   * 특정 문자를 확인합니다
   * book/styles.md: 구문 검증
   */
  literal(literal) {
    if (!(this.i < this.s.length && this.s[this.i] === literal)) {
      throw new Error(`Parsing error: expected '${literal}' at position ${this.i}`);
    }
    this.i++;
  }

  /**
   * 단어를 읽습니다 (알파벳, 숫자, 특수문자)
   * book/styles.md: 식별자, 값 파싱
   */
  word() {
    const start = this.i;
    while (this.i < this.s.length) {
      const c = this.s[this.i];
      if (/[a-zA-Z0-9#\-.%]/.test(c)) {
        this.i++;
      } else {
        break;
      }
    }
    
    if (!(this.i > start)) {
      throw new Error('Parsing error: expected word');
    }
    
    return this.s.substring(start, this.i);
  }

  /**
   * 속성-값 쌍을 파싱합니다
   * book/styles.md: property: value;
   */
  pair() {
    const prop = this.word();
    this.whitespace();
    this.literal(':');
    this.whitespace();
    const val = this.word();
    return [prop.toLowerCase(), val];
  }

  /**
   * 에러를 무시하고 특정 문자까지 진행합니다
   * book/styles.md: 에러 복구
   */
  ignore_until(chars) {
    while (this.i < this.s.length) {
      if (chars.includes(this.s[this.i])) {
        return this.s[this.i];
      }
      this.i++;
    }
    return null;
  }

  /**
   * 선언 블록을 파싱합니다
   * book/styles.md: { property: value; ... }
   */
  body() {
    const pairs = {};
    
    while (this.i < this.s.length && this.s[this.i] !== '}') {
      try {
        const [prop, val] = this.pair();
        pairs[prop] = val;
        this.whitespace();
        this.literal(';');
        this.whitespace();
      } catch (e) {
        // book/styles.md: 에러 복구 - 다음 ; 또는 }까지 건너뜀
        const why = this.ignore_until([';', '}']);
        if (why === ';') {
          this.literal(';');
          this.whitespace();
        } else {
          break;
        }
      }
    }
    
    return pairs;
  }

  /**
   * 선택자를 파싱합니다
   * book/styles.md: 태그 선택자와 자손 선택자
   */
  selector() {
    // 첫 번째 태그 선택자
    let out = new TagSelector(this.word().toLowerCase());
    this.whitespace();
    
    // 자손 선택자 (공백으로 구분)
    while (this.i < this.s.length && this.s[this.i] !== '{') {
      const tag = this.word();
      const descendant = new TagSelector(tag.toLowerCase());
      out = new DescendantSelector(out, descendant);
      this.whitespace();
    }
    
    return out;
  }

  /**
   * CSS 규칙을 파싱합니다
   * book/styles.md: selector { declarations }
   */
  parse() {
    const rules = [];
    
    while (this.i < this.s.length) {
      try {
        this.whitespace();
        const selector = this.selector();
        this.literal('{');
        this.whitespace();
        const body = this.body();
        this.literal('}');
        rules.push([selector, body]);
      } catch (e) {
        // book/styles.md: 에러 복구
        const why = this.ignore_until(['}']);
        if (why === '}') {
          this.literal('}');
          this.whitespace();
        } else {
          break;
        }
      }
    }
    
    return rules;
  }
}

/**
 * 태그 선택자
 * book/styles.md: 특정 태그명과 매칭
 */
class TagSelector {
  constructor(tag) {
    this.tag = tag;
    this.priority = 1;  // book/styles.md: 선택자 우선순위
  }

  /**
   * 노드가 선택자와 매칭되는지 확인합니다
   */
  matches(node) {
    return node instanceof Element && this.tag === node.tag;
  }

  toString() {
    return `TagSelector(tag=${this.tag}, priority=${this.priority})`;
  }
}

/**
 * 자손 선택자
 * book/styles.md: 조상 descendant 패턴
 */
class DescendantSelector {
  constructor(ancestor, descendant) {
    this.ancestor = ancestor;
    this.descendant = descendant;
    this.priority = ancestor.priority + descendant.priority;
  }

  /**
   * 노드가 선택자와 매칭되는지 확인합니다
   * book/styles.md: descendant가 매칭되고, 조상 중 ancestor가 있어야 함
   */
  matches(node) {
    if (!this.descendant.matches(node)) {
      return false;
    }
    
    // 조상 노드 탐색
    let current = node.parent;
    while (current) {
      if (this.ancestor.matches(current)) {
        return true;
      }
      current = current.parent;
    }
    
    return false;
  }

  toString() {
    return `DescendantSelector(ancestor=${this.ancestor}, ` +
           `descendant=${this.descendant}, priority=${this.priority})`;
  }
}

/**
 * 상속 가능한 CSS 속성들
 * book/styles.md: 부모에서 자식으로 상속되는 속성
 */
const INHERITED_PROPERTIES = {
  'font-size': '16px',
  'font-style': 'normal',
  'font-weight': 'normal',
  'color': 'black'
};

/**
 * DOM 트리에 스타일을 적용합니다
 * book/styles.md: 상속 → CSS 규칙 → 인라인 스타일
 * 
 * @param {Element|Text} node - 스타일을 적용할 노드
 * @param {Array} rules - CSS 규칙 배열
 */
function style(node, rules) {
  node.style = {};
  
  // book/styles.md: 1단계 - 상속
  for (const [property, default_value] of Object.entries(INHERITED_PROPERTIES)) {
    if (node.parent) {
      node.style[property] = node.parent.style[property];
    } else {
      node.style[property] = default_value;
    }
  }
  
  // book/styles.md: 2단계 - CSS 규칙 적용
  for (const [selector, body] of rules) {
    if (!selector.matches(node)) continue;
    
    for (const [property, value] of Object.entries(body)) {
      node.style[property] = value;
    }
  }
  
  // book/styles.md: 3단계 - 인라인 스타일 (style 속성)
  if (node instanceof Element && node.attributes.style) {
    const pairs = new CSSParser(node.attributes.style).body();
    for (const [property, value] of Object.entries(pairs)) {
      node.style[property] = value;
    }
  }
  
  // book/styles.md: 퍼센트 font-size 처리
  if (node.style['font-size'].endsWith('%')) {
    const parent_font_size = node.parent 
      ? node.parent.style['font-size']
      : INHERITED_PROPERTIES['font-size'];
    
    const node_pct = parseFloat(node.style['font-size']) / 100;
    const parent_px = parseFloat(parent_font_size);
    node.style['font-size'] = (node_pct * parent_px) + 'px';
  }
  
  // 자식 노드에도 재귀적으로 적용
  for (const child of node.children) {
    style(child, rules);
  }
}

/**
 * 캐스케이드 우선순위로 정렬
 * book/styles.md: 우선순위가 높은 규칙이 나중에 적용
 */
function cascade_priority(rule) {
  const [selector, body] = rule;
  return selector.priority;
}

/**
 * DOM 트리를 평탄화합니다
 * book/styles.md: 트리를 순회하여 모든 노드를 리스트로
 */
function tree_to_list(tree, list = []) {
  list.push(tree);
  for (const child of tree.children) {
    tree_to_list(child, list);
  }
  return list;
}

/**
 * BlockLayout 확장 - CSS 스타일 적용
 * book/styles.md: 스타일 기반 레이아웃
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
    
    this.display_list = [];
  }

  layout() {
    this.x = this.parent.x;
    this.width = this.parent.width;
    
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
      this.cursor_x = 0;
      this.cursor_y = 0;
      this.line = [];
      this.recurse(this.node);
      this.flush();
    }
    
    for (const child of this.children) {
      child.layout();
    }
    
    if (mode === 'block') {
      this.height = this.children.reduce((sum, child) => sum + child.height, 0);
    } else {
      this.height = this.cursor_y;
    }
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
        this.flush();
      }
      for (const child of tree.children) {
        this.recurse(child);
      }
    }
  }

  /**
   * 단어를 추가합니다 - CSS 스타일 사용
   * book/styles.md: 노드의 style 속성 참조
   */
  word(node, word) {
    // book/styles.md: CSS 스타일에서 폰트 정보 가져오기
    const weight = node.style['font-weight'];
    let fontStyle = node.style['font-style'];
    if (fontStyle === 'normal') fontStyle = 'roman';
    
    // book/styles.md: px를 pt로 변환 (* 0.75)
    const size = parseInt(parseFloat(node.style['font-size']) * 0.75);
    const font = get_font(size, weight, fontStyle);
    
    const w = font.measure(word);
    
    if (this.cursor_x + w > this.width) {
      this.flush();
    }
    
    // book/styles.md: 색상 정보 포함
    const color = node.style['color'];
    this.line.push({
      x: this.cursor_x,
      word: word,
      font: font,
      color: color
    });
    
    this.cursor_x += w + font.measure(' ');
  }

  flush() {
    if (this.line.length === 0) return;
    
    const metrics = this.line.map(item => item.font.metrics());
    const max_ascent = Math.max(...metrics.map(m => m.ascent));
    const baseline = this.cursor_y + 1.25 * max_ascent;
    
    for (const item of this.line) {
      const x = this.x + item.x;
      const y = this.y + baseline - item.font.metrics('ascent');
      
      this.display_list.push({
        x: x,
        y: y,
        word: item.word,
        font: item.font,
        color: item.color
      });
    }
    
    const max_descent = Math.max(...metrics.map(m => m.descent));
    this.cursor_y = baseline + 1.25 * max_descent;
    
    this.cursor_x = 0;
    this.line = [];
  }

  /**
   * 그리기 명령 생성 - CSS 배경색 지원
   * book/styles.md: background-color 속성
   */
  paint() {
    const cmds = [];
    
    // book/styles.md: 배경색 적용
    const bgcolor = this.node.style?.['background-color'] || 'transparent';
    if (bgcolor !== 'transparent') {
      cmds.push(new DrawRect(
        this.x, this.y,
        this.x + this.width, this.y + this.height,
        bgcolor
      ));
    }
    
    if (this.layout_mode() === 'inline') {
      for (const item of this.display_list) {
        cmds.push(new DrawText(
          item.x, item.y, item.word, item.font, item.color
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
 * DrawText 확장 - 색상 지원
 * book/styles.md: 텍스트 색상 렌더링
 */
class DrawText {
  constructor(x1, y1, text, font, color = 'black') {
    this.top = y1;
    this.left = x1;
    this.text = text;
    this.font = font;
    this.color = color;
    this.bottom = y1 + font.metrics('linespace');
  }

  execute(scroll, canvas) {
    canvas.create_text(this.left, this.top - scroll, {
      text: this.text,
      font: this.font,
      anchor: 'nw',
      fill: this.color
    });
  }

  toString() {
    return `DrawText(text=${this.text}, color=${this.color})`;
  }
}

/**
 * 기본 스타일시트
 * book/styles.md: 브라우저 기본 스타일
 */
const DEFAULT_STYLE_SHEET = `
pre {
  font-family: monospace;
  background-color: gray;
}
`;

/**
 * 브라우저 클래스
 * book/styles.md: CSS 로딩 및 적용 통합
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
    this.nodes = null;
    
    // 배경색 설정
    this.canvas.setBackground('white');
  }

  async load(url) {
    // book/styles.md: HTML 파싱
    const body = await url.request();
    this.nodes = new HTMLParser(body).parse();
    
    // book/styles.md: CSS 규칙 수집
    let rules = new CSSParser(DEFAULT_STYLE_SHEET).parse();
    
    // book/styles.md: 외부 스타일시트 로딩
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
        const style_url = url.resolve(link);
        const styleBody = await style_url.request();
        rules = rules.concat(new CSSParser(styleBody).parse());
      } catch (e) {
        console.error(`Failed to load stylesheet: ${link}`, e);
      }
    }
    
    // book/styles.md: 우선순위로 정렬 후 스타일 적용
    rules.sort((a, b) => cascade_priority(a) - cascade_priority(b));
    style(this.nodes, rules);
    
    // 레이아웃 및 페인트
    this.document = new DocumentLayout(this.nodes);
    this.document.layout();
    
    this.display_list = [];
    paint_tree(this.document, this.display_list);
    
    this.draw();
  }

  draw() {
    this.canvas.delete("all");
    
    for (const cmd of this.display_list) {
      if (cmd.top > this.scroll + this.height) continue;
      if (cmd.bottom < this.scroll) continue;
      
      cmd.execute(this.scroll, this.canvas);
    }
  }

  scrolldown() {
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
    CSSParser,
    TagSelector,
    DescendantSelector,
    INHERITED_PROPERTIES,
    style,
    cascade_priority,
    tree_to_list,
    DEFAULT_STYLE_SHEET,
    BlockLayout,
    DrawText,
    Browser
  };
}

