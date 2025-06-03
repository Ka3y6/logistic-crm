import axios from 'axios';

const api = axios.create({
  baseURL: 'http://185.135.83.113:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем перехватчик для добавления токена
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Добавляем префикс "Token" к токену
      config.headers.Authorization = `Token ${token}`;
      console.log('Request headers:', config.headers);
    }
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
  getAll: (filters = {}) => api.get('/api/clients/', { params: filters }),
  getById: (id) => api.get(`/api/clients/${id}/`),
  create: (data) => api.post('/api/clients/', data),
  update: (id, data) => api.put(`/api/clients/${id}/`, data),
  delete: (id) => api.delete(`/api/clients/${id}/`),
  exportExcel: () => api.get('/api/clients/export_excel/', { responseType: 'blob' }),
  importExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/clients/import_excel/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export const carriersApi = {
  getAll: (filters = {}) => api.get('/api/carriers/', { params: filters }),
  getById: (id) => api.get(`/api/carriers/${id}/`),
  create: (data) => api.post('/api/carriers/', data),
  update: (id, data) => api.put(`/api/carriers/${id}/`, data),
  delete: (id) => api.delete(`/api/carriers/${id}/`),
  exportExcel: () => api.get('/api/carriers/export_excel/', { responseType: 'blob' }),
  importExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/carriers/import_excel/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export const documentsApi = {
  getAll: (filters = {}) => api.get('/api/documents/', { params: filters }),
  getById: (id) => api.get(`/api/documents/${id}/`),
  create: (data) => api.post('/api/documents/', data),
  update: (id, data) => api.put(`/api/documents/${id}/`, data),
  delete: (id) => api.delete(`/api/documents/${id}/`),
  download: (id) => api.get(`/api/documents/${id}/?download=true`, { responseType: 'blob' }),
}; 