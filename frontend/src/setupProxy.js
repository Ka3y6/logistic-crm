const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: true,
      secure: false,
      ws: false,
      onProxyReq: (proxyReq, req, res) => {
        // Убедимся, что запрос идет по HTTP
        proxyReq.setHeader('X-Forwarded-Proto', 'http');
      },
      onError: (err, req, res) => {
        console.error('Proxy Error:', err);
      }
    })
  );
}; 