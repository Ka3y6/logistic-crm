import React, { useState, useEffect } from 'react';
import api from '../../api';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const ClientPanel = () => {
  const [clients, setClients] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    phone: '',
    inn: '',
    kpp: '',
    bank_details: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await api.get('clients/');
      console.log('Clients response:', response.data);
      
      let clientsData = response.data;
      if (typeof clientsData === 'object' && clientsData !== null) {
        if (Array.isArray(clientsData.results)) {
          clientsData = clientsData.results;
        } else if (Array.isArray(clientsData.data)) {
          clientsData = clientsData.data;
        }
      }
      
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (error) {
      console.error('Ошибка при загрузке клиентов:', error);
      setClients([]);
    }
  };

  const handleOpenDialog = (client = null) => {
    if (client) {
      setFormData({
        email: client.email || '',
        username: client.username || '',
        phone: client.phone || '',
        inn: client.inn || '',
        kpp: client.kpp || '',
        bank_details: client.bank_details || '',
      });
      setSelectedClient(client);
    } else {
      setFormData({
        email: '',
        username: '',
        phone: '',
        inn: '',
        kpp: '',
        bank_details: '',
      });
      setSelectedClient(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedClient(null);
  };

  const validateField = (name, value) => {
    if (!value) return '';

    switch (name) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Введите корректный email';
      case 'phone':
        return /^\+?1?\d{9,15}$/.test(value) ? '' : 'Введите корректный номер телефона';
      case 'inn':
        return /^\d{10,12}$/.test(value) ? '' : 'ИНН должен содержать 10 или 12 цифр';
      case 'kpp':
        return /^\d{9}$/.test(value) ? '' : 'КПП должен содержать 9 цифр';
      default:
        return '';
    }
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    console.log(`Изменение поля ${name}:`, value);
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = async () => {
    try {
      const clientData = {
        email: formData.email,
        username: formData.username,
        phone: formData.phone,
        inn: formData.inn,
        kpp: formData.kpp,
        bank_details: formData.bank_details,
      };

      console.log('Отправка данных клиента:', clientData);

      if (selectedClient) {
        await api.put(`clients/${selectedClient.id}/`, clientData);
      } else {
        const response = await api.post('clients/', clientData);
        console.log('Ответ сервера:', response.data);
      }
      fetchClients();
      handleCloseDialog();
    } catch (error) {
      console.error('Ошибка при сохранении клиента:', error);
      console.error('Детали ошибки:', error.response?.data);
      alert(error.response?.data?.error || 'Ошибка при сохранении клиента');
    }
  };

  const handleDelete = async (clientId) => {
    if (window.confirm('Вы уверены, что хотите удалить этого клиента?')) {
      try {
        await api.delete(`clients/${clientId}/`);
        fetchClients();
      } catch (error) {
        console.error('Ошибка при удалении клиента:', error);
      }
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Управление клиентами
      </Typography>

      {/* Управление клиентами */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Список клиентов</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Новый клиент
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Имя</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Телефон</TableCell>
              <TableCell>ИНН</TableCell>
              <TableCell>КПП</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.map((client) => {
              const rowId = client.id;
              return (
                <TableRow key={rowId}>
                  {/* ID Cell */}
                  <TableCell >
                    {client.id}
                  </TableCell>
                  {/* Username Cell */}
                   <TableCell >
                    {client.user?.username || '-'}
                  </TableCell>
                  {/* Email Cell */}
                   <TableCell >
                    {client.user?.email || '-'}
                  </TableCell>
                  {/* Phone Cell */}
                   <TableCell >
                    {client.phone || '-'}
                  </TableCell>
                  {/* INN Cell */}
                   <TableCell >
                    {client.inn || '-'}
                  </TableCell>
                  {/* KPP Cell */}
                   <TableCell >
                    {client.kpp || '-'}
                  </TableCell>
                  {/* Actions Cell - не кликабельная */}
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(client)} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(rowId)} size="small">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Диалог добавления/редактирования клиента */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedClient ? 'Редактировать клиента' : 'Новый клиент'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleFieldChange}
              error={!!errors.email}
              helperText={errors.email || 'Введите email'}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Имя пользователя"
              name="username"
              value={formData.username}
              onChange={handleFieldChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Телефон"
              name="phone"
              value={formData.phone}
              onChange={handleFieldChange}
              error={!!errors.phone}
              helperText={errors.phone || 'Введите номер телефона'}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="ИНН"
              name="inn"
              value={formData.inn}
              onChange={handleFieldChange}
              error={!!errors.inn}
              helperText={errors.inn || 'Введите ИНН'}
              margin="normal"
            />
            <TextField
              fullWidth
              label="КПП"
              name="kpp"
              value={formData.kpp}
              onChange={handleFieldChange}
              error={!!errors.kpp}
              helperText={errors.kpp || 'Введите КПП'}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Банковские реквизиты"
              name="bank_details"
              multiline
              rows={4}
              value={formData.bank_details}
              onChange={handleFieldChange}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={Object.values(errors).some(error => error !== '')}
          >
            {selectedClient ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientPanel;