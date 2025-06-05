import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/api';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EventIcon from '@mui/icons-material/Event';
import { useNavigate } from 'react-router-dom';
import UserViewDialog from '../components/users/UserViewDialog';

const UsersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    role: 'client',
    password: ''
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);

  const roles = [
    { value: 'admin', label: 'Администратор' },
    { value: 'manager', label: 'Менеджер' },
    { value: 'client', label: 'Клиент' }
  ];

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/');
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else if (response.data && Array.isArray(response.data.results)) {
        setUsers(response.data.results);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Не удалось загрузить пользователей');
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = (user) => {
    console.log('=== handleViewUser ===');
    console.log('Selected user:', user);
    setSelectedUser(user);
    setOpenViewDialog(true);
  };

  const handleCreateCalendarEvent = (user) => {
    navigate('/calendar', { 
      state: { 
        newEvent: {
          title: `Встреча с ${user.first_name} ${user.last_name}`,
          description: `Встреча с клиентом ${user.email}`,
          client: user.id
        }
      }
    });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        username: user.username,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        role: user.role,
        password: ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        username: '',
        first_name: '',
        last_name: '',
        role: 'client',
        password: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormData({
      email: '',
      username: '',
      first_name: '',
      last_name: '',
      role: 'client',
      password: ''
    });
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedUser(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      const submitData = { ...formData };
      
      if (editingUser) {
        if (!submitData.password) {
          delete submitData.password;
        }
        await api.put(`/users/${editingUser.id}/`, submitData);
      } else {
        if (!submitData.password) {
          setError('Пароль обязателен для нового пользователя');
          return;
        }
        await api.post('/users/', submitData);
      }
      handleCloseDialog();
      fetchUsers();
    } catch (err) {
      console.error('Error saving user:', err);
      const errorMessage = err.response?.data?.detail;
      if (typeof errorMessage === 'string') {
        try {
          const parsedError = JSON.parse(errorMessage);
          setError(Object.values(parsedError).flat().join(', '));
        } catch {
          setError(errorMessage);
        }
      } else {
        setError('Ошибка при сохранении пользователя');
      }
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      try {
        await api.delete(`/users/${userId}/`);
        fetchUsers();
      } catch (err) {
        console.error('Error deleting user:', err);
        setError('Ошибка при удалении пользователя');
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Управление пользователями</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Добавить пользователя
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Имя пользователя</TableCell>
              <TableCell>Имя</TableCell>
              <TableCell>Фамилия</TableCell>
              <TableCell>Роль</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.first_name}</TableCell>
                <TableCell>{user.last_name}</TableCell>
                <TableCell>
                  {roles.find(r => r.value === user.role)?.label || user.role}
                </TableCell>
                <TableCell>
                  <Tooltip title="Просмотр">
                    <IconButton onClick={() => handleViewUser(user)}>
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Редактировать">
                    <IconButton onClick={() => handleOpenDialog(user)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Удалить">
                    <IconButton onClick={() => handleDelete(user.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Диалог редактирования/создания пользователя */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Редактировать пользователя' : 'Добавить пользователя'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              name="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              fullWidth
            />
            <TextField
              name="username"
              label="Имя пользователя"
              value={formData.username}
              onChange={handleInputChange}
              required
              fullWidth
            />
            <TextField
              name="first_name"
              label="Имя"
              value={formData.first_name}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              name="last_name"
              label="Фамилия"
              value={formData.last_name}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              name="role"
              label="Роль"
              select
              value={formData.role}
              onChange={handleInputChange}
              required
              fullWidth
            >
              {roles.map((role) => (
                <MenuItem key={role.value} value={role.value}>
                  {role.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              name="password"
              label={editingUser ? 'Новый пароль (оставьте пустым, чтобы не менять)' : 'Пароль'}
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required={!editingUser}
              fullWidth
              helperText={editingUser ? 'Оставьте пустым, чтобы не менять пароль' : 'Обязательное поле для нового пользователя'}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingUser ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог просмотра пользователя */}
      <UserViewDialog
        open={openViewDialog}
        onClose={handleCloseViewDialog}
        user={selectedUser}
      />
    </Box>
  );
};

export default UsersPage; 