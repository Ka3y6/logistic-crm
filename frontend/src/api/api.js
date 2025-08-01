import axios from 'axios';
import config from '../config';

const api = axios.create({
  baseURL: config.API_URL + '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});

// Добавляем перехватчик для добавления токена
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Добавляем префикс "Token" к токену
      config.headers.Authorization = `Token ${token}`;
    }
    // Отладочный код
    console.log('Request URL:', config.url);
    console.log('Base URL:', config.baseURL);
    console.log('Full URL:', config.baseURL + (config.url.startsWith('/') ? config.url : '/' + config.url));
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Добавляем перехватчик для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Форматируем сообщение об ошибке
      const errorMessage = error.response.data?.message || 
                         error.response.data?.detail || 
                         error.response.data?.error || 
                         'Произошла ошибка при выполнении запроса';
      
      // Добавляем отформатированное сообщение в объект ошибки
      error.formattedMessage = errorMessage;
      
      console.error('Ошибка API:', errorMessage);
      
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } else if (error.request) {
      error.formattedMessage = 'Ошибка сети. Проверьте подключение к интернету.';
      console.error('Ошибка сети:', error.request);
    } else {
      error.formattedMessage = 'Произошла непредвиденная ошибка';
      console.error('Ошибка:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;

export const clientsApi = {
  getAll: (filters = {}) => api.get('/clients/', { params: filters }),
  getById: (id) => api.get(`/clients/${id}/`),
  create: (data) => api.post('/clients/', data),
  update: (id, data) => api.put(`/clients/${id}/`, data),
  delete: (id) => api.delete(`/clients/${id}/`),
  exportExcel: () => api.get('/clients/export_excel/', { responseType: 'blob' }),
  importExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/clients/import_excel/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export const carriersApi = {
  getAll: (filters = {}) => api.get('/carriers/', { params: filters }),
  getById: (id) => api.get(`/carriers/${id}/`),
  create: (data) => api.post('/carriers/', data),
  update: (id, data) => api.put(`/carriers/${id}/`, data),
  delete: (id) => api.delete(`/carriers/${id}/`),
  exportExcel: () => api.get('/carriers/export_excel/', { responseType: 'blob' }),
  importExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/carriers/import_excel/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export const documentsApi = {
  getAll: (filters = {}) => api.get('/documents/', { params: filters }),
  getById: (id) => api.get(`/documents/${id}/`),
  create: (data) => api.post('/documents/', data),
  update: (id, data) => api.put(`/documents/${id}/`, data),
  delete: (id) => api.delete(`/documents/${id}/`),
  download: (id) => api.get(`/documents/${id}/?download=true`, { responseType: 'blob' }),
};

export const siteRequestsApi = {
  getAll: () => api.get('site-requests/requests/'),
  process: (id) => api.post(`site-requests/requests/${id}/process/`),
  complete: (id) => api.post(`site-requests/requests/${id}/complete/`),
  reject: (id) => api.post(`site-requests/requests/${id}/reject/`),
  delete: (id) => api.delete(`site-requests/requests/${id}/`),
}; 