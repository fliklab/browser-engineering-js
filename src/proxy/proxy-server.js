/**
 * CORS 프록시 서버
 * 
 * 이 서버는 브라우저의 CORS 정책을 우회하여 외부 웹사이트를 로드할 수 있게 합니다.
 * 클라이언트의 요청을 받아 외부 사이트에 요청하고, 응답을 전달합니다.
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3000;

// CORS 미들웨어 - 모든 출처에서 접근 허용
app.use(cors());

// JSON 파싱
app.use(express.json());

/**
 * GET /proxy
 * 
 * Query Parameters:
 *   - url: 요청할 URL (필수)
 * 
 * 예: http://localhost:3000/proxy?url=https://browser.engineering
 */
app.get('/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  
  if (!targetUrl) {
    return res.status(400).json({
      error: 'URL parameter is required',
      usage: '/proxy?url=https://example.com'
    });
  }
  
  try {
    console.log(`[PROXY] Fetching: ${targetUrl}`);
    
    // 외부 사이트에 요청
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    const body = await response.text();
    
    console.log(`[PROXY] Success: ${targetUrl} (${body.length} bytes)`);
    
    // Content-Type 헤더 설정
    if (contentType) {
      res.set('Content-Type', contentType);
    }
    
    // 응답 전송
    res.send(body);
    
  } catch (error) {
    console.error(`[PROXY] Error fetching ${targetUrl}:`, error.message);
    res.status(500).json({
      error: 'Failed to fetch URL',
      message: error.message,
      url: targetUrl
    });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║         CORS Proxy Server Running                      ║
║         http://localhost:${PORT}                           ║
╚════════════════════════════════════════════════════════╝

Usage:
  http://localhost:${PORT}/proxy?url=https://browser.engineering

Ready to proxy requests! 🚀
  `);
});

// 프로세스 종료 시 정리
process.on('SIGINT', () => {
  console.log('\n\nShutting down proxy server...');
  process.exit(0);
});

