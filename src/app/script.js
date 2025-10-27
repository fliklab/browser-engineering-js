/**
 * Web Browser Engineering - JavaScript implementation
 * Main application
 */

/**
 * Logger 클래스 - 브라우저 동작을 로깅
 */
class BrowserLogger {
  constructor() {
    this.logContent = document.getElementById("log-content");
    this.autoScroll = document.getElementById("auto-scroll");
    this.logPanel = document.getElementById("log-panel");
    this.mainLayout = document.getElementById("main-layout");
    this.toggleBtn = document.getElementById("toggle-log-btn");
    this.startTime = Date.now();
    this.isVisible = false;

    // Clear 버튼 이벤트
    document.getElementById("clear-logs").addEventListener("click", () => {
      this.clear();
    });

    // Toggle 버튼 (Show/Hide Log)
    this.toggleBtn.addEventListener("click", () => {
      this.toggleLog();
    });

    // Close 버튼 (X)
    document.getElementById("close-log-btn").addEventListener("click", () => {
      this.hideLog();
    });

    this.log("info", "Logger initialized");
  }

  toggleLog() {
    if (this.isVisible) {
      this.hideLog();
    } else {
      this.showLog();
    }
  }

  showLog() {
    this.isVisible = true;
    this.logPanel.classList.remove("hidden");
    this.mainLayout.classList.add("log-visible");
    this.toggleBtn.textContent = "Hide Log";
  }

  hideLog() {
    this.isVisible = false;
    this.logPanel.classList.add("hidden");
    this.mainLayout.classList.remove("log-visible");
    this.toggleBtn.textContent = "Show Log";
  }

  log(type, message, details = "") {
    const timestamp = this.getTimestamp();
    const entry = document.createElement("div");
    entry.className = `log-entry ${type}`;

    const typeLabels = {
      fetch: "🌐 FETCH",
      load: "📥 LOAD",
      render: "🎨 RENDER",
      parse: "📝 PARSE",
      layout: "📐 LAYOUT",
      style: "💅 STYLE",
      error: "❌ ERROR",
      info: "ℹ️  INFO",
    };

    entry.innerHTML = `
      <span class="log-timestamp">${timestamp}</span>
      <span class="log-type">${typeLabels[type] || type.toUpperCase()}</span>
      <span class="log-message">${this.escapeHtml(message)}${
      details ? " " + this.escapeHtml(details) : ""
    }</span>
    `;

    this.logContent.appendChild(entry);

    // Auto-scroll
    if (this.autoScroll.checked) {
      this.logContent.scrollTop = this.logContent.scrollHeight;
    }
  }

  getTimestamp() {
    const elapsed = Date.now() - this.startTime;
    const seconds = Math.floor(elapsed / 1000);
    const ms = elapsed % 1000;
    return `${seconds.toString().padStart(2, "0")}.${ms
      .toString()
      .padStart(3, "0")}s`;
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  clear() {
    this.logContent.innerHTML = "";
    this.startTime = Date.now();
    this.log("info", "Logs cleared");
  }

  // 편의 메서드들
  fetch(message, details) {
    this.log("fetch", message, details);
  }
  load(message, details) {
    this.log("load", message, details);
  }
  render(message, details) {
    this.log("render", message, details);
  }
  parse(message, details) {
    this.log("parse", message, details);
  }
  layout(message, details) {
    this.log("layout", message, details);
  }
  style(message, details) {
    this.log("style", message, details);
  }
  error(message, details) {
    this.log("error", message, details);
  }
  info(message, details) {
    this.log("info", message, details);
  }
}

// 전역 로거 인스턴스
let logger;
window.logger = null; // 브라우저 코드에서 접근 가능하도록

/**
 * p5.js 스케치
 * book/graphics.md: p5.js를 사용한 캔버스 렌더링
 */
let browser;
let canvas;

const sketch = (p) => {
  p.setup = () => {
    // 로거 초기화
    logger = new BrowserLogger();
    window.logger = logger; // 전역적으로 접근 가능하도록
    logger.info("Browser initialization started");

    // book/graphics.md: 캔버스 생성 (800x600)
    p.createCanvas(WIDTH, HEIGHT);
    logger.render("Canvas created", `${WIDTH}x${HEIGHT}`);

    // p5canvas.js의 P5Canvas 래퍼 생성
    canvas = new P5Canvas(p, WIDTH, HEIGHT);
    logger.render("P5Canvas wrapper initialized");

    // 모든 폰트에 p5 인스턴스 설정
    Object.values(FONTS).forEach((font) => {
      font.setP5Instance(p);
    });
    logger.info("Fonts initialized");

    // book/chrome.md: Lab 7 브라우저 생성 (멀티탭)
    browser = new Browser(canvas, p);
    logger.info("Browser instance created");

    // 기본 페이지 로드
    const defaultUrl = document.getElementById("url-input").value;
    logger.load("Loading default page", defaultUrl);
    browser.new_tab(new URL(defaultUrl));
  };

  p.draw = () => {
    // book/graphics.md: 매 프레임마다 캔버스 렌더링
    canvas.render();
  };

  // book/graphics.md: 마우스 클릭 이벤트
  p.mousePressed = () => {
    if (
      browser &&
      p.mouseX >= 0 &&
      p.mouseX < WIDTH &&
      p.mouseY >= 0 &&
      p.mouseY < HEIGHT
    ) {
      logger.info("Click event", `at (${p.mouseX}, ${p.mouseY})`);
      browser.handle_click(p.mouseX, p.mouseY);
    }
  };

  // book/graphics.md: 키보드 이벤트
  p.keyPressed = () => {
    if (!browser) return;

    if (p.keyCode === p.DOWN_ARROW) {
      // book/graphics.md: 아래 스크롤
      logger.info("Scroll down");
      browser.handle_down();
    } else if (p.keyCode === p.UP_ARROW) {
      // book/graphics.md: 위 스크롤
      logger.info("Scroll up");
      browser.handle_up();
    } else if (p.keyCode === p.ENTER || p.keyCode === p.RETURN) {
      // book/chrome.md: 엔터 키
      logger.info("Enter key pressed");
      browser.handle_enter();
    } else if (p.key && p.key.length === 1) {
      // book/chrome.md: 문자 입력
      const charCode = p.key.charCodeAt(0);
      if (charCode >= 0x20 && charCode < 0x7f) {
        browser.handle_key(p.key);
      }
    }
  };

  // book/graphics.md: 마우스 휠 이벤트
  // canvas 영역 내에서만 스크롤을 가로챔
  p.mouseWheel = (event) => {
    // 마우스가 canvas 영역 내에 있는지 확인
    const isMouseOverCanvas =
      p.mouseX >= 0 && p.mouseX < WIDTH && p.mouseY >= 0 && p.mouseY < HEIGHT;

    // canvas 영역 내에서만 브라우저 스크롤 처리
    if (browser && isMouseOverCanvas) {
      browser.handleWheel(event.delta);
      return false; // 기본 스크롤 방지
    }

    // canvas 외부에서는 기본 스크롤 동작 허용
    return true;
  };
};

// p5.js 인스턴스 생성
new p5(sketch, "canvas-wrapper");

/**
 * 프록시 서버 상태 확인
 */
async function updateProxyStatus() {
  const statusDiv = document.getElementById("proxy-status");
  const isAvailable = await checkProxyStatus();

  if (isAvailable) {
    statusDiv.innerHTML = `
       <p style="color: #28a745;">
         ✅ 프록시 서버 연결됨 - 외부 사이트를 로드할 수 있습니다!
       </p>
     `;
  } else {
    statusDiv.innerHTML = `
       <p style="color: #ffc107;">
         ⚠️ 프록시 서버에 연결할 수 없습니다. 로컬 파일만 로드 가능합니다.<br>
         <small>외부 사이트를 로드하려면 프록시 서버를 시작하세요.</small>
       </p>
     `;
  }
}

// 페이지 로드 시 프록시 상태 확인
setTimeout(updateProxyStatus, 500);

/**
 * 페이지 로드 버튼 이벤트
 */
document.getElementById("load-btn").addEventListener("click", async () => {
  const urlInput = document.getElementById("url-input");
  const urlStr = urlInput.value.trim();

  if (!urlStr) {
    alert("URL을 입력해주세요");
    return;
  }

  try {
    // 새 탭에 URL 로드
    logger.load("Loading new page", urlStr);
    const url = new URL(urlStr);
    await browser.new_tab(url);
    logger.load("Page load initiated");
  } catch (e) {
    console.error("페이지 로드 실패:", e);
    logger.error("Page load failed", e.message);
    alert("페이지를 로드할 수 없습니다. URL을 확인해주세요.");
  }
});

// 엔터 키로도 로드
document.getElementById("url-input").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    document.getElementById("load-btn").click();
  }
});
