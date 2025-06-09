const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Прокси для всех запросов к бэкенду
  app.use(
    ['/api', '/csrf-token', '/validate-token'],
    createProxyMiddleware({
      target: 'http://127.0.0.1:8000',
      changeOrigin: true,
      secure: false,
      ws: true,
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
        proxyReq.setHeader('X-Forwarded-Host', 'crm.greatline.by');
        proxyReq.setHeader('Origin', 'https://crm.greatline.by');
      },
      onProxyRes: (proxyRes, req, res) => {
        // Добавляем CORS заголовки
        proxyRes.headers['Access-Control-Allow-Origin'] = 'https://crm.greatline.by';
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