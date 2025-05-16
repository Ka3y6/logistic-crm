import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  CircularProgress,
  Alert,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';
import api from '../../api/api';

const TaskForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    deadline: null,
    start: null,
    end: null,
    assignee: '',
    order: '',
  });

  const [formErrors, setFormErrors] = useState({
    title: '',
    assignee: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Загрузка списка пользователей и заказов
        const [usersRes, ordersRes] = await Promise.all([
          api.get('users/'),
          api.get('orders/'),
        ]);
        setUsers(usersRes.data);
        setOrders(ordersRes.data);

        // Если это редактирование, загрузка данных задачи
        if (isEditing) {
          const taskRes = await api.get(`tasks/${id}/`);
          const taskData = taskRes.data;

          setFormData({
            title: taskData.title || '',
            description: taskData.description || '',
            status: taskData.status || 'todo',
            priority: taskData.priority || 'medium',
            deadline: taskData.deadline ? new Date(taskData.deadline) : null,
            start: taskData.start ? new Date(taskData.start) : null,
            end: taskData.end ? new Date(taskData.end) : null,
            assignee: taskData.assignee?.toString() || '',
            order: taskData.order?.toString() || '',
          });
        }
      } catch (err) {
        console.error('Ошибка при загрузке данных:', err);
        setError('Не удалось загрузить данные. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEditing]);

  const validateForm = () => {
    const errors = {
      title: '',
      assignee: '',
    };
    let isValid = true;

    if (!formData.title.trim()) {
      errors.title = 'Название задачи обязательно';
      isValid = false;
    }

    if (!formData.assignee) {
      errors.assignee = 'Необходимо выбрать исполнителя';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Очистка ошибки поля при вводе
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleDateChange = (name, date) => {
    setFormData((prev) => ({
      ...prev,
      [name]: date,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        ...formData,
        // Преобразование пустых строк в null
        order: formData.order || null,
      };

      if (isEditing) {
        await api.put(`tasks/${id}/`, payload);
      } else {
        await api.post('tasks/', payload);
      }

      navigate('/tasks');
    } catch (err) {
      console.error('Ошибка при сохранении задачи:', err);
      setError(
        err.response?.data?.message || 'Произошла ошибка при сохранении задачи'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" mb={3}>
        {isEditing ? 'Редактирование задачи' : 'Создание новой задачи'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Название задачи"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              error={Boolean(formErrors.title)}
              helperText={formErrors.title}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Описание"
              name="description"
              multiline
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth required error={Boolean(formErrors.assignee)}>
              <InputLabel>Исполнитель</InputLabel>
              <Select
                name="assignee"
                value={formData.assignee}
                onChange={handleInputChange}
                label="Исполнитель"
              >
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id.toString()}>
                    {user.first_name} {user.last_name}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.assignee && (
                <FormHelperText>{formErrors.assignee}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Заказ</InputLabel>
              <Select
                name="order"
                value={formData.order}
                onChange={handleInputChange}
                label="Заказ"
              >
                <MenuItem value="">Не привязан</MenuItem>
                {orders.map((order) => (
                  <MenuItem key={order.id} value={order.id.toString()}>
                    #{order.id} - {order.client ? order.client.name : 'Без клиента'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Статус</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                label="Статус"
              >
                <MenuItem value="todo">К выполнению</MenuItem>
                <MenuItem value="in_progress">В работе</MenuItem>
                <MenuItem value="done">Завершено</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Приоритет</InputLabel>
              <Select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                label="Приоритет"
              >
                <MenuItem value="low">Низкий</MenuItem>
                <MenuItem value="medium">Средний</MenuItem>
                <MenuItem value="high">Высокий</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
            <Grid item xs={12} sm={6} md={4}>
              <DateTimePicker
                label="Срок выполнения"
                value={formData.deadline}
                onChange={(date) => handleDateChange('deadline', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: 'outlined',
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <DateTimePicker
                label="Начало (для календаря)"
                value={formData.start}
                onChange={(date) => handleDateChange('start', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: 'outlined',
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <DateTimePicker
                label="Окончание (для календаря)"
                value={formData.end}
                onChange={(date) => handleDateChange('end', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: 'outlined',
                  },
                }}
              />
            </Grid>
          </LocalizationProvider>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={() => navigate('/tasks')}>
                Отмена
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
              >
                {submitting ? 'Сохранение...' : isEditing ? 'Сохранить' : 'Создать'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default TaskForm; 