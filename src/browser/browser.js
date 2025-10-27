/**
 * Web Browser Engineering - 통합 JavaScript 구현
 * Lab 1-7의 모든 기능을 포함한 단일 파일
 * 
 * book/index.md: Chapters 1-7 참조
 * - http.md: URL 파싱, HTTP 요청
 * - graphics.md: 화면 그리기
 * - text.md: 텍스트 포맷팅
 * - html.md: HTML 파싱
 * - layout.md: 레이아웃 트리
 * - styles.md: CSS 파싱
 * - chrome.md: 링크, 탭, Chrome UI
 */

// ============================================================================
// 상수 정의
// ============================================================================

const WIDTH = 800;
const HEIGHT = 600;
const HSTEP = 13;
const VSTEP = 18;
const SCROLL_STEP = 100;

// book/layout.md: 블록 요소 목록
const BLOCK_ELEMENTS = [
  "html", "body", "article", "section", "nav", "aside",
  "h1", "h2", "h3", "h4", "h5", "h6", "hgroup", "header",
  "footer", "address", "p", "hr", "pre", "blockquote",
  "ol", "ul", "menu", "li", "dl", "dt", "dd", "figure",
  "figcaption", "main", "div", "table", "form", "fieldset",
  "legend", "details", "summary"
];

// book/styles.md: 상속 가능한 CSS 속성
const INHERITED_PROPERTIES = {
  "font-size": "16px",
  "font-style": "normal",
  "font-weight": "normal",
  "color": "black"
};

// book/styles.md: 기본 스타일시트
const DEFAULT_STYLE_SHEET = `
pre {
  font-family: monospace;
  background-color: gray;
}
`;

// ============================================================================
// Lab 1: URL 클래스
// ============================================================================

/**
 * URL 클래스
 * book/http.md: URL 파싱 및 HTTP 요청
 */
class URL {
  constructor(url) {
    try {
      const schemeMatch = url.match(/^([a-z]+):\/\/(.+)$/);
      if (!schemeMatch) {
        throw new Error("Invalid URL format");
      }
      
      this.scheme = schemeMatch[1];
      let remaining = schemeMatch[2];
      
      if (this.scheme !== "http" && this.scheme !== "https") {
        throw new Error("Unsupported scheme: " + this.scheme);
      }
      
      if (remaining.indexOf("/") === -1) {
        remaining = remaining + "/";
      }
      
      const slashIndex = remaining.indexOf("/");
      const hostPart = remaining.substring(0, slashIndex);
      this.path = remaining.substring(slashIndex);
      
      if (this.scheme === "http") {
        this.port = 80;
      } else if (this.scheme === "https") {
        this.port = 443;
      }
      
      if (hostPart.indexOf(":") !== -1) {
        const parts = hostPart.split(":");
        this.host = parts[0];
        this.port = parseInt(parts[1]);
      } else {
        this.host = hostPart;
      }
      
    } catch (e) {
      console.error("Malformed URL found, falling back to the WBE home page.");
      console.error("  URL was: " + url);
      console.error("  Error: " + e.message);
      
      const defaultUrl = new URL("https://browser.engineering");
      this.scheme = defaultUrl.scheme;
      this.host = defaultUrl.host;
      this.port = defaultUrl.port;
      this.path = defaultUrl.path;
    }
  }

  async request() {
    try {
      const fullUrl = this.toString();
      console.log(`Requesting: ${fullUrl}`);
      if (window.logger) window.logger.fetch('Request started', fullUrl);
      
      // request.js의 fetchWithProxy 사용
      const body = await window.fetchWithProxy(fullUrl);
      
      if (window.logger) window.logger.fetch('Request completed', `${body.length} bytes`);
      return body;
      
    } catch (error) {
      console.error("Request failed:", error);
      if (window.logger) window.logger.error('Request failed', error.message);
      return "";
    }
  }

  toString() {
    let portPart = "";
    
    if (this.scheme === "https" && this.port !== 443) {
      portPart = ":" + this.port;
    } else if (this.scheme === "http" && this.port !== 80) {
      portPart = ":" + this.port;
    }
    
    return `${this.scheme}://${this.host}${portPart}${this.path}`;
  }

  resolve(url) {
    if (url.indexOf("://") !== -1) {
      return new URL(url);
    }
    
    if (url.startsWith("//")) {
      return new URL(this.scheme + ":" + url);
    }
    
    if (url.startsWith("/")) {
      return new URL(`${this.scheme}://${this.host}:${this.port}${url}`);
    }
    
    let dir = this.path.substring(0, this.path.lastIndexOf("/"));
    
    while (url.startsWith("../")) {
      url = url.substring(3);
      const lastSlash = dir.lastIndexOf("/");
      if (lastSlash !== -1) {
        dir = dir.substring(0, lastSlash);
      }
    }
    
    const newPath = dir + "/" + url;
    return new URL(`${this.scheme}://${this.host}:${this.port}${newPath}`);
  }
}

// ============================================================================
// Lab 3: 폰트 관리
// ============================================================================

const FONTS = {};

class Font {
  constructor(size = 12, weight = "normal", slant = "roman") {
    this.size = size;
    this.weight = weight;
    this.slant = slant;
    this.p = null;
  }

  measure(text) {
    if (!this.p) return text.length * this.size * 0.6;
    
    this.p.push();
    this.p.textSize(this.size);
    this.p.textStyle(
      this.weight === "bold"
        ? this.p.BOLD
        : this.slant === "italic"
        ? this.p.ITALIC
        : this.p.NORMAL
    );
    const width = this.p.textWidth(text);
    this.p.pop();
    
    return width;
  }

  metrics(key) {
    const ascent = this.size * 0.8;
    const descent = this.size * 0.2;
    const linespace = this.size * 1.25;
    
    const metricsObj = {
      ascent: ascent,
      descent: descent,
      linespace: linespace
    };
    
    return key ? metricsObj[key] : metricsObj;
  }

  setP5Instance(p) {
    this.p = p;
  }
}

function get_font(size, weight, slant) {
  const key = `${size}-${weight}-${slant}`;
  if (!FONTS[key]) {
    FONTS[key] = new Font(size, weight, slant);
  }
  return FONTS[key];
}

// ============================================================================
// Lab 4: DOM 노드
// ============================================================================

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

class Element {
  constructor(tag, attributes, parent) {
    this.tag = tag;
    this.attributes = attributes;
    this.children = [];
    this.parent = parent;
  }

  toString() {
    const attrs = Object.entries(this.attributes)
      .map(([k, v]) => ` ${k}="${v}"`)
      .join("");
    return `<${this.tag}${attrs}>`;
  }
}

class HTMLParser {
  constructor(body) {
    this.body = body;
    this.unfinished = [];
  }

  static SELF_CLOSING_TAGS = [
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr"
  ];

  static HEAD_TAGS = [
    "base", "basefont", "bgsound", "noscript",
    "link", "meta", "title", "style", "script"
  ];

  parse() {
    let text = "";
    let in_tag = false;
    
    for (const c of this.body) {
      if (c === "<") {
        in_tag = true;
        if (text) {
          this.add_text(text);
        }
        text = "";
      } else if (c === ">") {
        in_tag = false;
        this.add_tag(text);
        text = "";
      } else {
        text += c;
      }
    }
    
    if (!in_tag && text) {
      this.add_text(text);
    }
    
    return this.finish();
  }

  get_attributes(text) {
    const parts = text.split(/\s+/);
    const tag = parts[0].toLowerCase();
    const attributes = {};
    
    for (let i = 1; i < parts.length; i++) {
      const attrpair = parts[i];
      if (attrpair.includes("=")) {
        let [key, value] = attrpair.split("=", 2);
        if (value.length > 2 && (value[0] === '"' || value[0] === "'")) {
          value = value.substring(1, value.length - 1);
        }
        attributes[key.toLowerCase()] = value;
      } else {
        attributes[attrpair.toLowerCase()] = "";
      }
    }
    
    return { tag, attributes };
  }

  add_text(text) {
    if (text.trim().length === 0) return;
    
    this.implicit_tags(null);
    
    const parent = this.unfinished[this.unfinished.length - 1];
    const node = new Text(text, parent);
    parent.children.push(node);
  }

  add_tag(tag) {
    const { tag: tagName, attributes } = this.get_attributes(tag);
    
    if (tagName.startsWith("!")) return;
    
    this.implicit_tags(tagName);
    
    if (tagName.startsWith("/")) {
      if (this.unfinished.length === 1) return;
      
      const node = this.unfinished.pop();
      const parent = this.unfinished[this.unfinished.length - 1];
      parent.children.push(node);
      
    } else if (HTMLParser.SELF_CLOSING_TAGS.includes(tagName)) {
      const parent = this.unfinished[this.unfinished.length - 1];
      const node = new Element(tagName, attributes, parent);
      parent.children.push(node);
      
    } else {
      const parent = this.unfinished.length > 0 
        ? this.unfinished[this.unfinished.length - 1] 
        : null;
      const node = new Element(tagName, attributes, parent);
      this.unfinished.push(node);
    }
  }

  implicit_tags(tag) {
    while (true) {
      const open_tags = this.unfinished.map(node => node.tag);
      
      if (open_tags.length === 0 && tag !== "html") {
        this.add_tag("html");
        
      } else if (open_tags.length === 1 && open_tags[0] === "html" &&
                 !["head", "body", "/html"].includes(tag)) {
        if (HTMLParser.HEAD_TAGS.includes(tag)) {
          this.add_tag("head");
        } else {
          this.add_tag("body");
        }
        
      } else if (open_tags.length === 2 && 
                 open_tags[0] === "html" && open_tags[1] === "head" &&
                 tag !== "/head" && !HTMLParser.HEAD_TAGS.includes(tag)) {
        this.add_tag("/head");
        
      } else {
        break;
      }
    }
  }

  finish() {
    if (this.unfinished.length === 0) {
      this.implicit_tags(null);
    }
    
    while (this.unfinished.length > 1) {
      const node = this.unfinished.pop();
      const parent = this.unfinished[this.unfinished.length - 1];
      parent.children.push(node);
    }
    
    return this.unfinished.pop();
  }
}

// ============================================================================
// Lab 6: CSS 파서
// ============================================================================

class CSSParser {
  constructor(s) {
    this.s = s;
    this.i = 0;
  }

  whitespace() {
    while (this.i < this.s.length && /\s/.test(this.s[this.i])) {
      this.i++;
    }
  }

  literal(literal) {
    if (!(this.i < this.s.length && this.s[this.i] === literal)) {
      throw new Error(`Parsing error: expected '${literal}' at position ${this.i}`);
    }
    this.i++;
  }

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
      throw new Error("Parsing error: expected word");
    }
    
    return this.s.substring(start, this.i);
  }

  pair() {
    const prop = this.word();
    this.whitespace();
    this.literal(":");
    this.whitespace();
    const val = this.word();
    return [prop.toLowerCase(), val];
  }

  ignore_until(chars) {
    while (this.i < this.s.length) {
      if (chars.includes(this.s[this.i])) {
        return this.s[this.i];
      }
      this.i++;
    }
    return null;
  }

  body() {
    const pairs = {};
    
    while (this.i < this.s.length && this.s[this.i] !== "}") {
      try {
        const [prop, val] = this.pair();
        pairs[prop] = val;
        this.whitespace();
        this.literal(";");
        this.whitespace();
      } catch (e) {
        const why = this.ignore_until([";", "}"]);
        if (why === ";") {
          this.literal(";");
          this.whitespace();
        } else {
          break;
        }
      }
    }
    
    return pairs;
  }

  selector() {
    let out = new TagSelector(this.word().toLowerCase());
    this.whitespace();
    
    while (this.i < this.s.length && this.s[this.i] !== "{") {
      const tag = this.word();
      const descendant = new TagSelector(tag.toLowerCase());
      out = new DescendantSelector(out, descendant);
      this.whitespace();
    }
    
    return out;
  }

  parse() {
    const rules = [];
    
    while (this.i < this.s.length) {
      try {
        this.whitespace();
        const selector = this.selector();
        this.literal("{");
        this.whitespace();
        const body = this.body();
        this.literal("}");
        rules.push([selector, body]);
      } catch (e) {
        const why = this.ignore_until(["}"]);
        if (why === "}") {
          this.literal("}");
          this.whitespace();
        } else {
          break;
        }
      }
    }
    
    return rules;
  }
}

class TagSelector {
  constructor(tag) {
    this.tag = tag;
    this.priority = 1;
  }

  matches(node) {
    return node instanceof Element && this.tag === node.tag;
  }
}

class DescendantSelector {
  constructor(ancestor, descendant) {
    this.ancestor = ancestor;
    this.descendant = descendant;
    this.priority = ancestor.priority + descendant.priority;
  }

  matches(node) {
    if (!this.descendant.matches(node)) {
      return false;
    }
    
    let current = node.parent;
    while (current) {
      if (this.ancestor.matches(current)) {
        return true;
      }
      current = current.parent;
    }
    
    return false;
  }
}

function style(node, rules) {
  node.style = {};
  
  for (const [property, default_value] of Object.entries(INHERITED_PROPERTIES)) {
    if (node.parent) {
      node.style[property] = node.parent.style[property];
    } else {
      node.style[property] = default_value;
    }
  }
  
  for (const [selector, body] of rules) {
    if (!selector.matches(node)) continue;
    
    for (const [property, value] of Object.entries(body)) {
      node.style[property] = value;
    }
  }
  
  if (node instanceof Element && node.attributes.style) {
    const pairs = new CSSParser(node.attributes.style).body();
    for (const [property, value] of Object.entries(pairs)) {
      node.style[property] = value;
    }
  }
  
  if (node.style["font-size"].endsWith("%")) {
    const parent_font_size = node.parent 
      ? node.parent.style["font-size"]
      : INHERITED_PROPERTIES["font-size"];
    
    const node_pct = parseFloat(node.style["font-size"]) / 100;
    const parent_px = parseFloat(parent_font_size);
    node.style["font-size"] = (node_pct * parent_px) + "px";
  }
  
  for (const child of node.children) {
    style(child, rules);
  }
}

function cascade_priority(rule) {
  const [selector, body] = rule;
  return selector.priority;
}

function tree_to_list(tree, list = []) {
  list.push(tree);
  for (const child of tree.children) {
    tree_to_list(child, list);
  }
  return list;
}

// ============================================================================
// Lab 7: Rect 및 그리기 명령
// ============================================================================

class Rect {
  constructor(left, top, right, bottom) {
    this.left = left;
    this.top = top;
    this.right = right;
    this.bottom = bottom;
  }

  contains_point(x, y) {
    return x >= this.left && x < this.right &&
           y >= this.top && y < this.bottom;
  }
}

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
}

class DrawText {
  constructor(x1, y1, text, font, color = "black") {
    this.rect = new Rect(
      x1, y1,
      x1 + font.measure(text), y1 + font.metrics("linespace")
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
      anchor: "nw",
      fill: this.color
    });
  }
}

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
}

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
}

// ============================================================================
// Lab 7: 레이아웃 (줄 기반)
// ============================================================================

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
    
    for (const word of this.children) {
      word.layout();
    }
    
    if (this.children.length === 0) {
      this.height = 0;
      return;
    }
    
    const max_ascent = Math.max(...this.children.map(w => w.font.metrics("ascent")));
    const baseline = this.y + 1.25 * max_ascent;
    
    for (const word of this.children) {
      word.y = baseline - word.font.metrics("ascent");
    }
    
    const max_descent = Math.max(...this.children.map(w => w.font.metrics("descent")));
    this.height = 1.25 * (max_ascent + max_descent);
  }

  paint() {
    return [];
  }
}

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
    const weight = this.node.style["font-weight"];
    let fontStyle = this.node.style["font-style"];
    if (fontStyle === "normal") fontStyle = "roman";
    const size = parseInt(parseFloat(this.node.style["font-size"]) * 0.75);
    this.font = get_font(size, weight, fontStyle);
    
    this.width = this.font.measure(this.word);
    
    if (this.previous) {
      const space = this.previous.font.measure(" ");
      this.x = this.previous.x + space + this.previous.width;
    } else {
      this.x = this.parent.x;
    }
    
    this.height = this.font.metrics("linespace");
  }

  paint() {
    const color = this.node.style["color"];
    return [new DrawText(this.x, this.y, this.word, this.font, color)];
  }
}

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
    
    if (mode === "block") {
      let previous = null;
      for (const child of this.node.children) {
        const next = new BlockLayout(child, this, previous);
        this.children.push(next);
        previous = next;
      }
    } else {
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
      return "inline";
    }
    
    const hasBlockChild = this.node.children.some(child => 
      child instanceof Element && BLOCK_ELEMENTS.includes(child.tag)
    );
    
    if (hasBlockChild) {
      return "block";
    }
    
    if (this.node.children.length > 0) {
      return "inline";
    }
    
    return "block";
  }

  recurse(tree) {
    if (tree instanceof Text) {
      const words = tree.text.split(/\s+/).filter(w => w.length > 0);
      for (const word of words) {
        this.word(tree, word);
      }
    } else {
      if (tree.tag === "br") {
        this.new_line();
      }
      for (const child of tree.children) {
        this.recurse(child);
      }
    }
  }

  new_line() {
    this.cursor_x = 0;
    const last_line = this.children.length > 0 
      ? this.children[this.children.length - 1] 
      : null;
    const new_line = new LineLayout(this.node, this, last_line);
    this.children.push(new_line);
  }

  word(node, word) {
    const weight = node.style["font-weight"];
    let fontStyle = node.style["font-style"];
    if (fontStyle === "normal") fontStyle = "roman";
    const size = parseInt(parseFloat(node.style["font-size"]) * 0.75);
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
    this.cursor_x += w + font.measure(" ");
  }

  self_rect() {
    return new Rect(this.x, this.y, this.x + this.width, this.y + this.height);
  }

  paint() {
    const cmds = [];
    
    const bgcolor = this.node.style?.["background-color"] || "transparent";
    if (bgcolor !== "transparent") {
      cmds.push(new DrawRect(this.self_rect(), bgcolor));
    }
    
    return cmds;
  }
}

class DocumentLayout {
  constructor(node) {
    this.node = node;
    this.parent = null;
    this.previous = null;
    this.children = [];
    this.height = 0;
  }

  layout() {
    const child = new BlockLayout(this.node, this, null);
    this.children.push(child);
    
    this.width = WIDTH - 2 * HSTEP;
    this.x = HSTEP;
    this.y = VSTEP;
    
    child.layout();
    this.height = child.height;
  }

  paint() {
    return [];
  }
}

function paint_tree(layout_object, display_list) {
  display_list.push(...layout_object.paint());
  
  for (const child of layout_object.children) {
    paint_tree(child, display_list);
  }
}

// ============================================================================
// Lab 7: Tab 클래스
// ============================================================================

class Tab {
  constructor(tab_height) {
    this.url = null;
    this.history = [];
    this.tab_height = tab_height;
    this.scroll = 0;
    this.document = null;
    this.display_list = [];
    this.nodes = null;
  }

  async load(url) {
    if (window.logger) window.logger.load('Tab load started', url.toString());
    
    this.scroll = 0;
    this.url = url;
    this.history.push(url);
    
    const body = await url.request();
    
    if (window.logger) window.logger.parse('Parsing HTML', `${body.length} bytes`);
    this.nodes = new HTMLParser(body).parse();
    if (window.logger) window.logger.parse('HTML parsing completed');
    
    if (window.logger) window.logger.style('Parsing default stylesheet');
    let rules = new CSSParser(DEFAULT_STYLE_SHEET).parse();
    
    const links = tree_to_list(this.nodes)
      .filter(node => 
        node instanceof Element &&
        node.tag === "link" &&
        node.attributes.rel === "stylesheet" &&
        node.attributes.href
      )
      .map(node => node.attributes.href);
    
    if (links.length > 0 && window.logger) {
      window.logger.style(`Found ${links.length} stylesheets`);
    }
    
    for (const link of links) {
      try {
        if (window.logger) window.logger.style('Loading stylesheet', link);
        const styleBody = await url.resolve(link).request();
        rules = rules.concat(new CSSParser(styleBody).parse());
      } catch (e) {
        console.error(`Failed to load stylesheet: ${link}`, e);
        if (window.logger) window.logger.error('Stylesheet load failed', link);
      }
    }
    
    if (window.logger) window.logger.style('Sorting and applying CSS rules', `${rules.length} rules`);
    rules.sort((a, b) => cascade_priority(a) - cascade_priority(b));
    style(this.nodes, rules);
    
    if (window.logger) window.logger.layout('Building layout tree');
    this.document = new DocumentLayout(this.nodes);
    this.document.layout();
    if (window.logger) window.logger.layout('Layout completed');
    
    if (window.logger) window.logger.render('Building display list');
    this.display_list = [];
    paint_tree(this.document, this.display_list);
    if (window.logger) window.logger.render('Display list completed', `${this.display_list.length} commands`);
    
    if (window.logger) window.logger.load('Tab load completed', url.toString());
  }

  draw(canvas, offset) {
    if (window.logger) window.logger.render('Drawing tab to canvas');
    for (const cmd of this.display_list) {
      if (cmd.top > this.scroll + this.tab_height) continue;
      if (cmd.bottom < this.scroll) continue;
      cmd.execute(this.scroll - offset, canvas);
    }
  }

  scrolldown() {
    const max_y = Math.max(
      this.document.height + 2 * VSTEP - this.tab_height, 0
    );
    this.scroll = Math.min(this.scroll + SCROLL_STEP, max_y);
  }

  scrollup() {
    this.scroll = Math.max(0, this.scroll - SCROLL_STEP);
  }

  click(x, y) {
    y += this.scroll;
    
    const objs = tree_to_list(this.document)
      .filter(obj => 
        obj.x <= x && x < obj.x + obj.width &&
        obj.y <= y && y < obj.y + obj.height
      );
    
    if (objs.length === 0) return;
    
    let elt = objs[objs.length - 1].node;
    
    while (elt) {
      if (elt instanceof Text) {
        elt = elt.parent;
      } else if (elt.tag === "a" && elt.attributes.href) {
        const url = this.url.resolve(elt.attributes.href);
        return this.load(url);
      } else {
        elt = elt.parent;
      }
    }
  }

  go_back() {
    if (this.history.length > 1) {
      this.history.pop();
      const back = this.history.pop();
      this.load(back);
    }
  }
}

// ============================================================================
// Lab 7: Chrome UI
// ============================================================================

class Chrome {
  constructor(browser) {
    this.browser = browser;
    this.focus = null;
    this.address_bar = "";
    
    this.font = get_font(20, "normal", "roman");
    this.font_height = this.font.metrics("linespace");
    
    this.padding = 5;
    
    this.tabbar_top = 0;
    this.tabbar_bottom = this.font_height + 2 * this.padding;
    
    const plus_width = this.font.measure("+") + 2 * this.padding;
    this.newtab_rect = new Rect(
      this.padding, this.padding,
      this.padding + plus_width,
      this.padding + this.font_height
    );
    
    this.urlbar_top = this.tabbar_bottom;
    this.urlbar_bottom = this.urlbar_top + this.font_height + 2 * this.padding;
    
    const back_width = this.font.measure("<") + 2 * this.padding;
    this.back_rect = new Rect(
      this.padding,
      this.urlbar_top + this.padding,
      this.padding + back_width,
      this.urlbar_bottom - this.padding
    );
    
    this.address_rect = new Rect(
      this.back_rect.right + this.padding,
      this.urlbar_top + this.padding,
      WIDTH - this.padding,
      this.urlbar_bottom - this.padding
    );
    
    this.bottom = this.urlbar_bottom;
  }

  tab_rect(i) {
    const tabs_start = this.newtab_rect.right + this.padding;
    const tab_width = this.font.measure(`Tab ${i}`) + 2 * this.padding;
    return new Rect(
      tabs_start + tab_width * i, this.tabbar_top,
      tabs_start + tab_width * (i + 1), this.tabbar_bottom
    );
  }

  paint() {
    const cmds = [];
    
    cmds.push(new DrawRect(
      new Rect(0, 0, WIDTH, this.bottom),
      "white"
    ));
    
    cmds.push(new DrawLine(
      0, this.bottom, WIDTH, this.bottom, "black", 1
    ));
    
    cmds.push(new DrawOutline(this.newtab_rect, "black", 1));
    cmds.push(new DrawText(
      this.newtab_rect.left + this.padding,
      this.newtab_rect.top,
      "+", this.font, "black"
    ));
    
    for (let i = 0; i < this.browser.tabs.length; i++) {
      const tab = this.browser.tabs[i];
      const bounds = this.tab_rect(i);
      
      cmds.push(new DrawLine(
        bounds.left, 0, bounds.left, bounds.bottom, "black", 1
      ));
      cmds.push(new DrawLine(
        bounds.right, 0, bounds.right, bounds.bottom, "black", 1
      ));
      
      cmds.push(new DrawText(
        bounds.left + this.padding, bounds.top + this.padding,
        `Tab ${i}`, this.font, "black"
      ));
      
      if (tab === this.browser.active_tab) {
        cmds.push(new DrawLine(
          0, bounds.bottom, bounds.left, bounds.bottom, "black", 1
        ));
        cmds.push(new DrawLine(
          bounds.right, bounds.bottom, WIDTH, bounds.bottom, "black", 1
        ));
      }
    }
    
    cmds.push(new DrawOutline(this.back_rect, "black", 1));
    cmds.push(new DrawText(
      this.back_rect.left + this.padding,
      this.back_rect.top,
      "<", this.font, "black"
    ));
    
    cmds.push(new DrawOutline(this.address_rect, "black", 1));
    
    if (this.focus === "address bar") {
      cmds.push(new DrawText(
        this.address_rect.left + this.padding,
        this.address_rect.top,
        this.address_bar, this.font, "black"
      ));
      
      const w = this.font.measure(this.address_bar);
      cmds.push(new DrawLine(
        this.address_rect.left + this.padding + w,
        this.address_rect.top,
        this.address_rect.left + this.padding + w,
        this.address_rect.bottom,
        "red", 1
      ));
    } else {
      const url = this.browser.active_tab 
        ? this.browser.active_tab.url.toString()
        : "";
      cmds.push(new DrawText(
        this.address_rect.left + this.padding,
        this.address_rect.top,
        url, this.font, "black"
      ));
    }
    
    return cmds;
  }

  click(x, y) {
    this.focus = null;
    
    if (this.newtab_rect.contains_point(x, y)) {
      this.browser.new_tab(new URL("https://browser.engineering/"));
    } else if (this.back_rect.contains_point(x, y)) {
      this.browser.active_tab.go_back();
    } else if (this.address_rect.contains_point(x, y)) {
      this.focus = "address bar";
      this.address_bar = "";
    } else {
      for (let i = 0; i < this.browser.tabs.length; i++) {
        if (this.tab_rect(i).contains_point(x, y)) {
          this.browser.active_tab = this.browser.tabs[i];
          break;
        }
      }
    }
  }

  keypress(char) {
    if (this.focus === "address bar") {
      this.address_bar += char;
    }
  }

  enter() {
    if (this.focus === "address bar") {
      this.browser.active_tab.load(new URL(this.address_bar));
      this.focus = null;
    }
  }
}

// ============================================================================
// Lab 7: Browser 클래스
// ============================================================================

class Browser {
  constructor(canvas, p5Instance) {
    this.canvas = canvas;
    this.p5Instance = p5Instance;
    this.tabs = [];
    this.active_tab = null;
    this.chrome = new Chrome(this);
    
    this.canvas.setBackground("white");
  }

  async new_tab(url) {
    if (window.logger) window.logger.info('Creating new tab', url.toString());
    const new_tab = new Tab(HEIGHT - this.chrome.bottom);
    await new_tab.load(url);
    this.active_tab = new_tab;
    this.tabs.push(new_tab);
    if (window.logger) window.logger.info('New tab created', `Total tabs: ${this.tabs.length}`);
    this.draw();
  }

  draw() {
    if (window.logger) window.logger.render('Browser redraw started');
    this.canvas.delete("all");
    
    if (this.active_tab) {
      this.active_tab.draw(this.canvas, this.chrome.bottom);
    }
    
    for (const cmd of this.chrome.paint()) {
      cmd.execute(0, this.canvas);
    }
    if (window.logger) window.logger.render('Browser redraw completed');
  }

  handle_click(x, y) {
    if (y < this.chrome.bottom) {
      this.chrome.click(x, y);
    } else if (this.active_tab) {
      const tab_y = y - this.chrome.bottom;
      this.active_tab.click(x, tab_y);
    }
    this.draw();
  }

  handle_key(char) {
    this.chrome.keypress(char);
    this.draw();
  }

  handle_enter() {
    this.chrome.enter();
    this.draw();
  }

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

