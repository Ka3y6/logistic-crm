import React, { useState, useEffect } from 'react';
import api from '../../api';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  Group as GroupIcon,
} from '@mui/icons-material';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: '',
    password: '',
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.role) {
      setError('Пожалуйста, заполните все обязательные поля');
      return false;
    }
    if (!selectedUser && !formData.password) {
      setError('Пожалуйста, введите пароль для нового пользователя');
      return false;
    }
    return true;
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('users/');
      console.log('Users response:', response.data);
      
      // Проверяем структуру ответа
      let usersData = response.data;
      if (typeof usersData === 'object' && usersData !== null) {
        // Если данные в свойстве results (стандартный формат DRF)
        if (Array.isArray(usersData.results)) {
          usersData = usersData.results;
        }
        // Если данные в свойстве data
        else if (Array.isArray(usersData.data)) {
          usersData = usersData.data;
        }
      }
      
      // Убеждаемся, что данные являются массивом
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error('Ошибка при загрузке пользователей:', error);
      setUsers([]);
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        role: user.role,
        password: '',
      });
      setSelectedUser(user);
    } else {
      setFormData({
        username: '',
        email: '',
        role: '',
        password: '',
      });
      setSelectedUser(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const userData = {
          ...formData,
          password: formData.password || undefined // Отправляем пароль только если он не пустой
        };

        if (selectedUser) {
          // При редактировании отправляем пароль только если он был изменен
          if (!formData.password) {
            delete userData.password;
          }
          await api.put(`/users/${selectedUser.id}/`, userData);
          setSuccess('Пользователь успешно обновлен');
        } else {
          // При создании нового пользователя пароль обязателен
          if (!formData.password) {
            setError('Пожалуйста, введите пароль для нового пользователя');
            return;
          }
          await api.post('/users/', userData);
          setSuccess('Пользователь успешно создан');
        }
        handleCloseDialog();
        fetchUsers();
      } catch (error) {
        setError(error.response?.data?.message || 'Произошла ошибка при сохранении пользователя');
      }
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      try {
        await api.delete(`users/${userId}/`);
        fetchUsers();
      } catch (error) {
        console.error('Ошибка при удалении пользователя:', error);
      }
    }
  };

  const stats = [
    { title: 'Всего пользователей', value: users.length, icon: <PeopleIcon /> },
    { title: 'Менеджеров', value: users.filter(u => u.role === 'manager').length, icon: <GroupIcon /> },
    { title: 'Клиентов', value: users.filter(u => u.role === 'client').length, icon: <PersonIcon /> },
  ];

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      username: user.username,
      role: user.role,
      phone: user.phone || '',
      inn: user.inn || '',
      kpp: user.kpp || '',
      bank_details: user.bank_details || '',
      password: '' // Очищаем поле пароля при редактировании
    });
    setOpenDialog(true);
  };

  return (
    <Box>
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      <Typography variant="h4" gutterBottom>
        Панель администратора
      </Typography>

      {/* Статистика */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={4} key={stat.title}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ mr: 2, color: 'primary.main' }}>{stat.icon}</Box>
                  <Typography variant="h6">{stat.title}</Typography>
                </Box>
                <Typography variant="h4">{stat.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Управление пользователями */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Управление пользователями</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Добавить пользователя
        </Button>
      </Box>

      <Paper>
        <List>
          {users.map((user) => (
            <ListItem
              key={user.id}
              secondaryAction={
                <Box>
                  <IconButton edge="end" onClick={() => handleEdit(user)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" onClick={() => handleDelete(user.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              }
            >
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText
                primary={user.username}
                secondary={user.email}
              />
              <Chip
                label={user.role}
                color={user.role === 'admin' ? 'primary' : user.role === 'manager' ? 'secondary' : 'default'}
                size="small"
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Диалог добавления/редактирования пользователя */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {selectedUser ? 'Редактировать пользователя' : 'Добавить пользователя'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Имя пользователя"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              select
              label="Роль"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              margin="normal"
              SelectProps={{
                native: true,
              }}
            >
              <option value="">Выберите роль</option>
              <option value="admin">Администратор</option>
              <option value="manager">Менеджер</option>
              <option value="client">Клиент</option>
            </TextField>
            <TextField
              fullWidth
              label="Пароль"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedUser ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPanel;