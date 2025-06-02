import api from './api';

export const createCalendarTask = async (taskData) => {
  console.log('createCalendarTask вызван с данными:', taskData);
  try {
    console.log('Отправка POST запроса на /calendar/tasks/ с данными:', taskData);
    const response = await api.post('/calendar/tasks/', taskData);
    console.log('Успешный ответ от сервера:', response.data);
    return response.data;
  } catch (error) {
    console.error('Ошибка при создании задачи в календаре:', error);
    if (error.response) {
      console.error('Статус ошибки:', error.response.status);
      console.error('Данные ошибки:', error.response.data);
    } else if (error.request) {
      console.error('Ошибка запроса:', error.request);
    } else {
      console.error('Ошибка:', error.message);
    }
    throw error;
  }
};

export const getCalendarTasks = async (userId = null, startDate = null, endDate = null) => {
  try {
    let url = '/calendar/tasks/';
    const params = new URLSearchParams();
    
    if (userId) {
      params.append('user', userId);
    }
    if (startDate) {
      params.append('start_date', startDate);
    }
    if (endDate) {
      params.append('end_date', endDate);
    }
    
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching calendar tasks:', error);
    throw error;
  }
};

export const deleteCalendarTask = async (taskId) => {
  try {
    const response = await api.delete(`/calendar/tasks/${taskId}/`);
    return response.data;
  } catch (error) {
    console.error('Error deleting calendar task:', error);
    throw error;
  }
};

export const updateCalendarTask = async (taskId, taskData) => {
  console.log(`updateCalendarTask вызван для taskId: ${taskId} с данными:`, taskData);
  try {
    console.log(`Отправка PUT запроса на /calendar/tasks/${taskId}/ с данными:`, taskData);
    const response = await api.put(`/calendar/tasks/${taskId}/`, taskData);
    console.log('Успешный ответ от сервера при обновлении:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Ошибка при обновлении задачи ${taskId} в календаре:`, error);
    if (error.response) {
      console.error('Статус ошибки:', error.response.status);
      console.error('Данные ошибки:', error.response.data);
    } else if (error.request) {
      console.error('Ошибка запроса:', error.request);
    } else {
      console.error('Ошибка:', error.message);
    }
    throw error;
  }
}; 