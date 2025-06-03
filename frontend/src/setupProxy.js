const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Прокси для всех запросов к бэкенду
  app.use(
    ['/api', '/csrf-token', '/validate-token'],
    createProxyMiddleware({
      target: 'http://185.135.83.113:8000',
      changeOrigin: true,
      secure: false,
      ws: false,
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
        proxyReq.setHeader('X-Forwarded-Proto', 'http');
        proxyReq.setHeader('X-Forwarded-Host', '185.135.83.113:8000');
      },
      onProxyRes: (proxyRes, req, res) => {
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