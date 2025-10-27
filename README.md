# Browser Engineering - JavaScript Implementation

This is a JavaScript implementation of the browser built in
[Web Browser Engineering](https://browser.engineering/) by
Pavel Panchekha and Chris Harrelson.

A web-based browser engine built with **p5.js** for learning purposes,
implementing Labs 1-7 from the Web Browser Engineering book.

The original Python implementation is available at
https://github.com/browserengineering/book

## ✨ Features

- 🌐 **HTTP Request/Response** - URL parsing and HTTP protocol handling
- 🎨 **HTML/CSS Parsing** - DOM tree construction and CSS style application
- 📐 **Layout Engine** - Block and inline layout rendering
- 🖱️ **Interactive** - Link navigation, multi-tab browsing, scrolling
- 🎯 **Chrome UI** - Tab bar, address bar, back button
- 🔄 **CORS Proxy** - Built-in proxy server for external site loading

## 🚀 Quick Start

### 로컬 개발

```bash
# Install dependencies
npm install

# Run application and proxy server
npm start
```

Visit `http://localhost:8000` in your browser.

### Vercel 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel --prod
```

자세한 배포 가이드는 [DEPLOYMENT.md](DEPLOYMENT.md)를 참고하세요.

## 📖 Documentation

For detailed documentation, see [src/README.md](src/README.md)

## 📝 Implementation Notes

This project is created for educational purposes. While following the book's algorithms closely, some adaptations were made for the JavaScript/p5.js environment:

### Platform Differences

**Font Handling**: Unlike Python's `tkinter.font.Font` which is self-contained, p5.js requires a canvas instance for text measurement. We use a global p5 instance pattern to ensure fonts can access `textWidth()` and other p5 methods when needed.

**Default Styles**: The default stylesheet includes basic styles for common elements (`<a>`, `<b>`, `<i>`, etc.) to ensure reasonable rendering even when external stylesheets fail to load.

This implementation follows the book's core concepts while adapting to JavaScript's ecosystem and browser environment.

## License

This project is licensed under the MIT License, maintaining
compatibility with the original project's license.
