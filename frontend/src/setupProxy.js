const { createProxyMiddleware } = require('http-proxy-middleware');

const targetUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const url = new URL(targetUrl);
const targetHost = url.host;

module.exports = function(app) {
  // Прокси для всех запросов к бэкенду
  app.use(
    ['/api', '/api/csrf-token', '/api/validate-token'],
    createProxyMiddleware({
      target: targetUrl,
      changeOrigin: true,
      secure: false,
      ws: false,
      pathRewrite: {
        '^/api': '/api' // Сохраняем префикс /api
      },
      onProxyReq: (proxyReq, req, res) => {
        // Логируем детали запроса
        console.log('Proxy Request Details:', {
          originalUrl: req.originalUrl,
          url: req.url,
          method: req.method,
          headers: req.headers,
          targetUrl: proxyReq.path
        });
        
        // Устанавливаем заголовки
        proxyReq.setHeader('X-Forwarded-Proto', 'https');
        proxyReq.setHeader('X-Forwarded-Host', targetHost);
        proxyReq.setHeader('Origin', `${url.protocol}//${targetHost}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        // Добавляем CORS заголовки
        proxyRes.headers['Access-Control-Allow-Origin'] = `${url.protocol}//${targetHost}`;
        proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
        proxyRes.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
        
        // Логируем ответ
        console.log('Proxy Response:', {
          statusCode: proxyRes.statusCode,
          headers: proxyRes.headers,
          originalUrl: req.originalUrl
        });
      },
      onError: (err, req, res) => {
        console.error('Proxy Error:', {
          error: err.message,
          originalUrl: req.originalUrl,
          url: req.url,
          method: req.method,
          headers: req.headers
        });
      }
    })
  );
}; 