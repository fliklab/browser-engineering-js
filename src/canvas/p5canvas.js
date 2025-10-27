/**
 * p5.js 기반 Canvas 드로잉 모듈
 * Python Tkinter의 Canvas API를 모방하여 브라우저 렌더링을 수행합니다.
 *
 * 이 모듈은 book/graphics.md의 Drawing to the Screen 개념을 구현합니다.
 */

class P5Canvas {
  constructor(p5Instance, width, height) {
    this.p = p5Instance;
    this.width = width;
    this.height = height;
    this.commands = []; // 그리기 명령들을 저장
    this.bgColor = "white";
  }

  /**
   * Tkinter의 Canvas.pack()을 대체
   * p5.js는 자동으로 설정되므로 빈 메서드
   */
  pack() {
    // p5.js에서는 자동으로 처리됨
  }

  /**
   * 모든 그리기 명령을 삭제합니다 (Tkinter의 delete("all") 대체)
   * book/graphics.md: 매 프레임마다 화면을 지우고 다시 그립니다
   */
  delete(tag) {
    if (tag === "all") {
      this.commands = [];
    }
  }

  /**
   * 텍스트를 그립니다 (Tkinter의 create_text 대체)
   * book/text.md: 텍스트 렌더링의 핵심 메서드
   *
   * @param {number} x - x 좌표
   * @param {number} y - y 좌표
   * @param {object} options - {text, font, anchor, fill} 옵션
   */
  create_text(x, y, options = {}) {
    this.commands.push({
      type: "text",
      x: x,
      y: y,
      text: options.text || "",
      font: options.font || null,
      anchor: options.anchor || "center",
      fill: options.fill || "black",
    });
  }

  /**
   * 사각형을 그립니다 (Tkinter의 create_rectangle 대체)
   * book/layout.md: 블록 요소의 배경을 그립니다
   *
   * @param {number} x1 - 좌측 상단 x
   * @param {number} y1 - 좌측 상단 y
   * @param {number} x2 - 우측 하단 x
   * @param {number} y2 - 우측 하단 y
   * @param {object} options - {width, fill, outline} 옵션
   */
  create_rectangle(x1, y1, x2, y2, options = {}) {
    this.commands.push({
      type: "rectangle",
      x1: x1,
      y1: y1,
      x2: x2,
      y2: y2,
      strokeWidth: options.width !== undefined ? options.width : 1,
      fill: options.fill || null,
      outline: options.outline || null,
    });
  }

  /**
   * 선을 그립니다 (Tkinter의 create_line 대체)
   * book/chrome.md: Chrome UI의 경계선을 그립니다
   *
   * @param {number} x1 - 시작점 x
   * @param {number} y1 - 시작점 y
   * @param {number} x2 - 끝점 x
   * @param {number} y2 - 끝점 y
   * @param {object} options - {fill, width} 옵션
   */
  create_line(x1, y1, x2, y2, options = {}) {
    this.commands.push({
      type: "line",
      x1: x1,
      y1: y1,
      x2: x2,
      y2: y2,
      stroke: options.fill || "black",
      strokeWidth: options.width !== undefined ? options.width : 1,
    });
  }

  /**
   * 저장된 모든 그리기 명령을 실행합니다
   * book/graphics.md: 디스플레이 리스트를 순회하며 렌더링
   */
  render() {
    const p = this.p;

    // 배경 그리기
    p.background(this.bgColor);

    // 모든 명령 실행
    for (const cmd of this.commands) {
      if (cmd.type === "text") {
        this._renderText(cmd);
      } else if (cmd.type === "rectangle") {
        this._renderRectangle(cmd);
      } else if (cmd.type === "line") {
        this._renderLine(cmd);
      }
    }
  }

  /**
   * 텍스트 렌더링 헬퍼
   * book/text.md: 폰트, 색상, 앵커를 고려한 텍스트 그리기
   */
  _renderText(cmd) {
    const p = this.p;

    // 폰트 설정
    if (cmd.font) {
      p.textSize(cmd.font.size);
      p.textStyle(
        cmd.font.weight === "bold"
          ? p.BOLD
          : cmd.font.slant === "italic"
          ? p.ITALIC
          : p.NORMAL
      );
    }

    // 색상 설정
    p.fill(cmd.fill);
    p.noStroke();

    // 앵커 설정 (book/text.md: 텍스트 정렬)
    if (cmd.anchor === "nw") {
      p.textAlign(p.LEFT, p.TOP);
    } else {
      p.textAlign(p.CENTER, p.CENTER);
    }

    // 텍스트 그리기
    p.text(cmd.text, cmd.x, cmd.y);
  }

  /**
   * 사각형 렌더링 헬퍼
   * book/layout.md: 블록 레이아웃의 배경 렌더링
   */
  _renderRectangle(cmd) {
    const p = this.p;

    // 채우기 색상
    if (cmd.fill) {
      p.fill(cmd.fill);
    } else {
      p.noFill();
    }

    // 테두리
    if (cmd.outline && cmd.strokeWidth > 0) {
      p.stroke(cmd.outline);
      p.strokeWeight(cmd.strokeWidth);
    } else {
      p.noStroke();
    }

    // 사각형 그리기
    const width = cmd.x2 - cmd.x1;
    const height = cmd.y2 - cmd.y1;
    p.rect(cmd.x1, cmd.y1, width, height);
  }

  /**
   * 선 렌더링 헬퍼
   * book/chrome.md: Chrome UI의 구분선 그리기
   */
  _renderLine(cmd) {
    const p = this.p;

    p.stroke(cmd.stroke);
    p.strokeWeight(cmd.strokeWidth);
    p.line(cmd.x1, cmd.y1, cmd.x2, cmd.y2);
  }

  /**
   * 배경색 설정
   */
  setBackground(color) {
    this.bgColor = color;
  }
}
