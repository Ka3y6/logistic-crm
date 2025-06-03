import axios from 'axios';

// Убедимся, что всегда используется HTTP и правильный путь API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 секунд таймаут
});

// Получаем CSRF токен при инициализации
const getCsrfToken = async () => {
  try {
    const response = await api.get('/csrf-token');
    const csrfToken = response.data.csrfToken;
    api.defaults.headers.common['X-CSRFToken'] = csrfToken;
  } catch (error) {
    console.error('Error getting CSRF token:', error);
  }
};

// Получаем CSRF токен при старте
getCsrfToken();

// Обработчик запросов
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // Добавляем заголовки для CORS
    config.headers['Content-Type'] = 'application/json';
    config.headers['Accept'] = 'application/json';
    
    // Добавляем токен для всех запросов, кроме /login/
    if (!config.url.includes('/login/')) {
      if (token) {
        // Добавляем префикс "Token" к токену
        config.headers.Authorization = `Token ${token}`;
        console.log('Request headers:', config.headers);
      } else {
        console.warn('No token found in localStorage for protected route:', config.url);
      }
    }
    
    console.log('Making request to:', config.url, 'with headers:', config.headers);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Добавляем перехватчик для обновления CSRF токена
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 403 && error.response?.data?.detail === 'CSRF Failed: CSRF token missing or incorrect.') {
      await getCsrfToken();
      // Повторяем запрос с новым токеном
      return api(error.config);
    }
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
    if (error.response) {
      // Обработка ошибок от сервера
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // Ошибка запроса
      console.error('Request Error:', error.request);
    } else {
      // Другие ошибки
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api; 