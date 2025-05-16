import axios from 'axios';

// Убедимся, что всегда используется HTTP и правильный путь API
const API_BASE_URL = (process.env.REACT_APP_API_URL || '/api').replace('https://', 'http://');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 секунд таймаут
});

// Обработчик запросов
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    
    // Убедимся, что URL начинается с /api/
    if (!config.url.startsWith('/')) {
      config.url = '/' + config.url;
    }
    
    console.log('Making request to:', config.url);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Обработчик ответов
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      response: error.response?.data
    });

    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Неавторизован - очищаем данные только если мы не на странице логина
          if (!window.location.pathname.includes('/login')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
          break;
        case 403:
          // Доступ запрещен - просто логируем ошибку
          console.error('Access forbidden:', error.config.url);
          break;
        case 404:
          console.error('Resource not found:', error.config.url);
          break;
        case 500:
          console.error('Server error:', error.response.data);
          break;
        default:
          console.error('Unhandled error:', error);
      }
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Request setup error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api; 