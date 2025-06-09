import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  TextField,
  Grid,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
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

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Фильтры
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignee: '',
    order: '',
    search: '',
  });

  // Пагинация
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [tasksRes, ordersRes, usersRes] = await Promise.all([
          axios.get(`${config.API_URL}/api/tasks/`),
          axios.get(`${config.API_URL}/api/orders/`),
          axios.get(`${config.API_URL}/api/users/`),
        ]);
        setTasks(tasksRes.data);
        setOrders(ordersRes.data);
        setUsers(usersRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
    setPage(0);
  };

  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${config.API_URL}/api/tasks/${taskToDelete.id}/`);
      setTasks(tasks.filter((t) => t.id !== taskToDelete.id));
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Ошибка при удалении задачи:', error);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setTaskToDelete(null);
  };

  // Фильтрация задач
  const filteredTasks = tasks.filter((task) => {
    return (
      (filters.status === '' || task.status === filters.status) &&
      (filters.priority === '' || task.priority === filters.priority) &&
      (filters.assignee === '' || task.assignee.toString() === filters.assignee) &&
      (filters.order === '' || 
        (task.order && task.order.toString() === filters.order)) &&
      (filters.search === '' || 
        task.title.toLowerCase().includes(filters.search.toLowerCase()) || 
        (task.description && task.description.toLowerCase().includes(filters.search.toLowerCase())))
    );
  });

  // Получение имени исполнителя
  const getAssigneeName = (assigneeId) => {
    const assignee = users.find((u) => u.id === assigneeId);
    return assignee ? `${assignee.first_name} ${assignee.last_name}` : 'Неизвестно';
  };

  // Получение номера заказа
  const getOrderNumber = (orderId) => {
    const order = orders.find((o) => o.id === orderId);
    return order ? `#${order.id}` : 'Не привязан';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Управление задачами</Typography>
        {(user.role === 'admin' || user.role === 'manager') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/tasks/new')}
          >
            Новая задача
          </Button>
        )}
      </Box>

      {/* Фильтры */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Поиск задачи"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              margin="normal"
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={6} md={1.5}>
            <FormControl fullWidth margin="normal" size="small">
              <InputLabel>Статус</InputLabel>
              <Select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                label="Статус"
              >
                <MenuItem value="">Все</MenuItem>
                <MenuItem value="todo">К выполнению</MenuItem>
                <MenuItem value="in_progress">В работе</MenuItem>
                <MenuItem value="done">Завершено</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={1.5}>
            <FormControl fullWidth margin="normal" size="small">
              <InputLabel>Приоритет</InputLabel>
              <Select
                name="priority"
                value={filters.priority}
                onChange={handleFilterChange}
                label="Приоритет"
              >
                <MenuItem value="">Все</MenuItem>
                <MenuItem value="low">Низкий</MenuItem>
                <MenuItem value="medium">Средний</MenuItem>
                <MenuItem value="high">Высокий</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={1.5}>
            <FormControl fullWidth margin="normal" size="small">
              <InputLabel>Исполнитель</InputLabel>
              <Select
                name="assignee"
                value={filters.assignee}
                onChange={handleFilterChange}
                label="Исполнитель"
              >
                <MenuItem value="">Все</MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id.toString()}>
                    {user.first_name} {user.last_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={1.5}>
            <FormControl fullWidth margin="normal" size="small">
              <InputLabel>Заказ</InputLabel>
              <Select
                name="order"
                value={filters.order}
                onChange={handleFilterChange}
                label="Заказ"
              >
                <MenuItem value="">Все</MenuItem>
                {orders.map((order) => (
                  <MenuItem key={order.id} value={order.id.toString()}>
                    #{order.id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredTasks.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">Задачи не найдены</Typography>
        </Paper>
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>Название</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell>Приоритет</TableCell>
                  <TableCell>Исполнитель</TableCell>
                  <TableCell>Срок выполнения</TableCell>
                  <TableCell>Заказ</TableCell>
                  <TableCell align="center">Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTasks
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((task) => (
                    <TableRow key={task.id} hover>
                      <TableCell
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/tasks/${task.id}`)}
                      >
                        {task.title}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            task.status === 'todo'
                              ? 'К выполнению'
                              : task.status === 'in_progress'
                              ? 'В работе'
                              : 'Завершено'
                          }
                          color={statusColors[task.status]}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            task.priority === 'low'
                              ? 'Низкий'
                              : task.priority === 'medium'
                              ? 'Средний'
                              : 'Высокий'
                          }
                          color={priorityColors[task.priority]}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{getAssigneeName(task.assignee)}</TableCell>
                      <TableCell>
                        {task.deadline
                          ? format(new Date(task.deadline), 'dd.MM.yyyy HH:mm')
                          : 'Не указан'}
                      </TableCell>
                      <TableCell>
                        {task.order ? getOrderNumber(task.order) : 'Не привязан'}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/tasks/${task.id}/edit`)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        {(user.role === 'admin' || user.role === 'manager') && (
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(task)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                        {task.status !== 'done' && (
                          <IconButton
                            size="small"
                            onClick={() => {
                              // Изменение статуса задачи на "Завершено"
                              const updatedTask = { ...task, status: 'done' };
                              api
                                .put(`tasks/${task.id}/`, updatedTask)
                                .then(() => {
                                  setTasks(
                                    tasks.map((t) =>
                                      t.id === task.id ? { ...t, status: 'done' } : t
                                    )
                                  );
                                })
                                .catch((error) => {
                                  console.error('Ошибка при обновлении статуса:', error);
                                });
                            }}
                            color="success"
                          >
                            <CheckIcon fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredTasks.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Строк на странице:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} из ${count}`
            }
          />
        </Paper>
      )}

      {/* Диалоговое окно подтверждения удаления */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы действительно хотите удалить задачу "{taskToDelete?.title}"?
            Это действие нельзя будет отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Отмена</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaskList; 