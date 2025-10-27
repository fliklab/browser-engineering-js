/**
 * CORS 프록시 - Vercel Serverless Function
 *
 * 이 함수는 브라우저의 CORS 정책을 우회하여 외부 웹사이트를 로드할 수 있게 합니다.
 *
 * Endpoint: /api/proxy?url=https://example.com
 */

// Node.js 18+에서는 native fetch 사용, 아니면 node-fetch 사용
const fetch = globalThis.fetch || require("node-fetch");

module.exports = async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight 요청 처리
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // GET 요청만 허용
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed",
      message: "Only GET requests are supported",
    });
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      error: "URL parameter is required",
      usage: "/api/proxy?url=https://example.com",
    });
  }

  try {
    console.log(`[PROXY] Fetching: ${url}`);

    // 외부 사이트에 요청
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    const body = await response.text();

    console.log(`[PROXY] Success: ${url} (${body.length} bytes)`);

    // Content-Type 헤더 설정
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    } else {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
    }

    // 응답 전송
    return res.status(200).send(body);
  } catch (error) {
    console.error(`[PROXY] Error fetching ${url}:`, error.message);
    return res.status(500).json({
      error: "Failed to fetch URL",
      message: error.message,
      url: url,
    });
  }
};
