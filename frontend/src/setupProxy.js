const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Прокси для всех запросов к бэкенду
  app.use(
    ['/api', '/csrf-token', '/validate-token'],
    createProxyMiddleware({
      target: 'https://185.135.83.113:8000',
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
        proxyReq.setHeader('X-Forwarded-Host', '185.135.83.113:8000');
        proxyReq.setHeader('Origin', 'https://185.135.83.113:8000');
      },
      onProxyRes: (proxyRes, req, res) => {
        // Добавляем CORS заголовки
        proxyRes.headers['Access-Control-Allow-Origin'] = 'http://185.135.83.113:3000';
        proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
        
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