const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  const backendHost = new URL(backendUrl).hostname;
  const backendPort = new URL(backendUrl).port || '8000';

  // Прокси для всех запросов к бэкенду
  app.use(
    ['/api', '/csrf-token', '/validate-token'],
    createProxyMiddleware({
      target: backendUrl,
      changeOrigin: true,
      secure: false,
      ws: false,
      pathRewrite: {
        '^/api/api/(.*)': '/api/$1', // Удаляем дублирование /api
        '^/api/(.*)': '/api/$1' // Оставляем один /api
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
        proxyReq.setHeader('X-Forwarded-Proto', 'http');
        proxyReq.setHeader('X-Forwarded-Host', `${backendHost}:${backendPort}`);
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