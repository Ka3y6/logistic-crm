import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  LocalShipping as OrderIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import config from '../../config';

const statusColors = {
  todo: 'default',
  in_progress: 'warning',
  done: 'success',
};

const priorityColors = {
  low: 'info',
  medium: 'warning',
  high: 'error',
};

const statusLabels = {
  todo: 'К выполнению',
  in_progress: 'В работе',
  done: 'Завершено',
};

const priorityLabels = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
};

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderDetails, setOrderDetails] = useState(null);
  const [assigneeDetails, setAssigneeDetails] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchTaskDetails = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${config.API_URL}/api/tasks/${id}/`);
        setTask(response.data);

        // Если есть заказ, получаем его детали
        if (response.data.order) {
          const orderRes = await axios.get(`${config.API_URL}/api/orders/${response.data.order}/`);
          setOrderDetails(orderRes.data);
        }

        // Получаем информацию об исполнителе
        if (response.data.assignee) {
          const userRes = await axios.get(`${config.API_URL}/api/users/${response.data.assignee}/`);
          setAssigneeDetails(userRes.data);
        }
      } catch (error) {
        console.error('Error fetching task details:', error);
        setError('Не удалось загрузить данные задачи');
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();
  }, [id]);

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${config.API_URL}/tasks/${id}/`);
      navigate('/tasks');
    } catch (err) {
      console.error('Ошибка при удалении задачи:', err);
      setError('Не удалось удалить задачу');
      setDeleteDialogOpen(false);
    }
  };

  const handleMarkAsDone = async () => {
    try {
      const updatedTask = { ...task, status: 'done' };
      await axios.put(`${config.API_URL}/tasks/${id}/`, updatedTask);
      setTask(updatedTask);
    } catch (err) {
      console.error('Ошибка при обновлении статуса:', err);
      setError('Не удалось обновить статус задачи');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!task) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Задача не найдена
      </Alert>
    );
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/tasks')}
        sx={{ mb: 2 }}
      >
        Вернуться к списку
      </Button>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h5" component="h1">
            {task.title}
          </Typography>
          <Stack direction="row" spacing={1}>
            {task.status !== 'done' && (
              <Button
                variant="outlined"
                color="success"
                startIcon={<CheckIcon />}
                onClick={handleMarkAsDone}
              >
                Завершить
              </Button>
            )}
            {(user.role === 'admin' || user.role === 'manager') && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/tasks/${id}/edit`)}
                >
                  Редактировать
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteClick}
                >
                  Удалить
                </Button>
              </>
            )}
          </Stack>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <DescriptionIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="h6">Описание</Typography>
                </Box>
                <Typography variant="body1" color="text.secondary">
                  {task.description || 'Описание отсутствует'}
                </Typography>
              </CardContent>
            </Card>

            {orderDetails && (
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <OrderIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="h6">Связанный заказ</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Номер заказа
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        #{orderDetails.id}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Статус заказа
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {orderDetails.status === 'new' ? 'Новый' :
                         orderDetails.status === 'in_progress' ? 'В процессе' :
                         orderDetails.status === 'completed' ? 'Завершен' : 'Отменен'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Адрес загрузки
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {orderDetails.loading_address || 'Не указан'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Адрес выгрузки
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {orderDetails.unloading_address || 'Не указан'}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(`/orders/${orderDetails.id}`)}
                    >
                      Перейти к заказу
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Информация о задаче
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Статус
                    </Typography>
                    <Chip
                      label={statusLabels[task.status]}
                      color={statusColors[task.status]}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Приоритет
                    </Typography>
                    <Chip
                      label={priorityLabels[task.priority]}
                      color={priorityColors[task.priority]}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Срок выполнения
                    </Typography>
                    <Typography variant="body1">
                      {task.deadline
                        ? format(new Date(task.deadline), 'dd.MM.yyyy HH:mm')
                        : 'Не указан'}
                    </Typography>
                  </Box>
                  {task.start && task.end && (
                    <>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Начало
                        </Typography>
                        <Typography variant="body1">
                          {format(new Date(task.start), 'dd.MM.yyyy HH:mm')}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Окончание
                        </Typography>
                        <Typography variant="body1">
                          {format(new Date(task.end), 'dd.MM.yyyy HH:mm')}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {assigneeDetails && (
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="h6">Исполнитель</Typography>
                  </Box>
                  <Typography variant="body1" gutterBottom>
                    {assigneeDetails.first_name} {assigneeDetails.last_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {assigneeDetails.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Роль: {assigneeDetails.role === 'admin' ? 'Администратор' :
                         assigneeDetails.role === 'manager' ? 'Менеджер' : 'Клиент'}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Paper>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы действительно хотите удалить задачу "{task.title}"?
            Это действие нельзя будет отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaskDetail; 