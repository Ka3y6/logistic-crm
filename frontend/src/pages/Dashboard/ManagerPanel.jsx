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
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  Group as GroupIcon
} from '@mui/icons-material';

const ManagerPanel = () => {
  const [orders, setOrders] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    client: '',
    status: 'new',
    loading_date: '',
    loading_address: '',
    unloading_address: '',
    transport_type: '',
    contract_number: '',
    total_price: '',
    shipper: '',
    notes: '',
    delivery_deadline: '',
    payment_status: 'pending'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchOrders(),
          fetchClients()
        ]);
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/');
      if (Array.isArray(response.data)) {
        setOrders(response.data);
      } else if (response.data.results) {
        setOrders(response.data.results);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients/');
      const data = response.data;
      if (data && Array.isArray(data)) {
        setClients(data);
      } else if (data && Array.isArray(data.results)) {
        setClients(data.results);
      } else {
        setClients([]);
      }
    } catch (error) {
      console.error('Ошибка при загрузке клиентов:', error);
      setClients([]);
    }
  };

  const handleOpenDialog = (order = null) => {
    if (order) {
      setFormData({
        client: order.client,
        contract_number: order.contract_number,
        loading_address: order.loading_address,
        loading_date: order.loading_date,
        transport_type: order.transport_type,
        unloading_address: order.unloading_address,
        status: order.status,
        total_price: order.total_price,
        payment_status: order.payment_status,
        notes: order.notes,
        shipper: order.shipper,
        delivery_deadline: order.delivery_deadline,
      });
      setSelectedOrder(order);
    } else {
      setFormData({
        client: '',
        contract_number: '',
        loading_address: '',
        loading_date: '',
        transport_type: '',
        unloading_address: '',
        status: 'new',
        total_price: '',
        payment_status: 'pending',
        notes: '',
        shipper: '',
        delivery_deadline: '',
      });
      setSelectedOrder(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOrder(null);
  };

  const handleClientChange = (event) => {
    const clientId = event.target.value;
    setFormData(prev => ({
      ...prev,
      client: clientId,
      loading_address: '', // Сброс адреса при смене клиента
      unloading_address: ''
    }));
  };

  const validateField = (name, value) => {
    // Если поле пустое, считаем его валидным
    if (!value) return '';

    switch (name) {
      case 'client':
        return !isNaN(value) && value > 0 ? '' : 'ID клиента должен быть положительным числом';
      case 'contract_number':
        return value.length <= 50 ? '' : 'Номер договора не более 50 символов';
      case 'loading_address':
      case 'unloading_address':
        return value.length <= 200 ? '' : 'Адрес не более 200 символов';
      case 'notes':
        return value.length <= 500 ? '' : 'Примечания не более 500 символов';
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
      // Преобразуем данные в формат, ожидаемый сервером
      const orderData = {
        client: formData.client ? parseInt(formData.client) : null,
        contract_number: formData.contract_number || '',
        loading_address: formData.loading_address || '',
        loading_date: formData.loading_date || null,
        transport_type: formData.transport_type || null,
        unloading_address: formData.unloading_address || '',
        status: formData.status,
        total_price: formData.total_price ? parseFloat(formData.total_price) : null,
        payment_status: formData.payment_status,
        notes: formData.notes || '',
        shipper: formData.shipper || '',
        delivery_deadline: formData.delivery_deadline || null,
      };

      console.log('Отправка данных заказа:', orderData);

      if (selectedOrder) {
        await api.put(`orders/${selectedOrder.id}/`, orderData);
      } else {
        const response = await api.post('orders/', orderData);
        console.log('Ответ сервера:', response.data);
      }
      fetchOrders();
      handleCloseDialog();
    } catch (error) {
      console.error('Ошибка при сохранении заказа:', error);
      console.error('Детали ошибки:', error.response?.data);
      alert(error.response?.data?.error || 'Ошибка при сохранении заказа');
    }
  };

  const handleDelete = async (orderId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот заказ?')) {
      try {
        await api.delete(`orders/${orderId}/`);
        fetchOrders();
      } catch (error) {
        console.error('Ошибка при удалении заказа:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'pending':
        return 'default';
      default:
        return 'default';
    }
  };

  const stats = [
    { title: 'Всего заказов', value: orders.length, icon: <PeopleIcon /> },
    { title: 'В процессе', value: orders.filter(o => o.status === 'in_progress').length, icon: <GroupIcon /> },
    { title: 'Завершено', value: orders.filter(o => o.status === 'completed').length, icon: <PersonIcon /> },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Панель менеджера
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

      {/* Управление заказами */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Управление заказами</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Добавить заказ
        </Button>
      </Box>

      <TableContainer 
        component={Paper} 
        sx={{ 
          maxHeight: 'calc(100vh - 300px)',
          overflow: 'auto'
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Клиент</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Дата погрузки</TableCell>
              <TableCell>Срок доставки</TableCell>
              <TableCell>Стоимость</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.id}</TableCell>
                <TableCell>{order.client_name || `Клиент ${order.client}`}</TableCell>
                <TableCell>
                  <Chip
                    label={order.status === 'new' ? 'Новый' : 
                           order.status === 'in_progress' ? 'В процессе' : 
                           order.status === 'completed' ? 'Завершен' : 
                           'Отменен'}
                    color={getStatusColor(order.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{order.loading_date ? new Date(order.loading_date).toLocaleDateString() : '-'}</TableCell>
                <TableCell>{order.delivery_deadline ? new Date(order.delivery_deadline).toLocaleDateString() : '-'}</TableCell>
                <TableCell>{order.total_price ? `${order.total_price} ₽` : '-'}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(order)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(order.id)} size="small">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Диалог добавления/редактирования заказа */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedOrder ? 'Редактировать заказ' : 'Новый заказ'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              select
              label="Клиент"
              name="client"
              value={formData.client}
              onChange={handleClientChange}
              error={!!errors.client}
              helperText={errors.client || 'Выберите клиента'}
              fullWidth
              disabled={loading}
              SelectProps={{
                native: true
              }}
            >
              <option value="">Выберите клиента</option>
              {!loading && Array.isArray(clients) && clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.user?.username || client.user?.email || `Клиент ${client.id}`}
                </option>
              ))}
            </TextField>

            <TextField
              select
              label="Статус"
              name="status"
              value={formData.status}
              onChange={handleFieldChange}
              error={!!errors.status}
              helperText={errors.status || 'Выберите статус'}
              fullWidth
              SelectProps={{
                native: true
              }}
            >
              <option value="new">Новый</option>
              <option value="in_progress">В процессе</option>
              <option value="completed">Завершен</option>
              <option value="cancelled">Отменен</option>
            </TextField>

            <TextField
              fullWidth
              label="Номер договора"
              name="contract_number"
              value={formData.contract_number}
              onChange={handleFieldChange}
              error={!!errors.contract_number}
              helperText={errors.contract_number || 'Введите номер договора (необязательно)'}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Адрес погрузки"
              name="loading_address"
              value={formData.loading_address}
              onChange={handleFieldChange}
              error={!!errors.loading_address}
              helperText={errors.loading_address || 'Введите адрес погрузки (необязательно)'}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Дата погрузки"
              name="loading_date"
              type="date"
              value={formData.loading_date}
              onChange={handleFieldChange}
              error={!!errors.loading_date}
              helperText={errors.loading_date || 'Выберите дату погрузки (необязательно)'}
              margin="normal"
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              fullWidth
              select
              label="Тип транспорта"
              name="transport_type"
              value={formData.transport_type}
              onChange={handleFieldChange}
              margin="normal"
              SelectProps={{
                native: true,
              }}
            >
              <option value="">Выберите тип транспорта</option>
              <option value="truck">Грузовик</option>
              <option value="van">Фургон</option>
              <option value="refrigerator">Рефрижератор</option>
            </TextField>
            <TextField
              fullWidth
              label="Адрес разгрузки"
              name="unloading_address"
              value={formData.unloading_address}
              onChange={handleFieldChange}
              error={!!errors.unloading_address}
              helperText={errors.unloading_address || 'Введите адрес разгрузки (необязательно)'}
              margin="normal"
            />
            <TextField
              fullWidth
              select
              label="Статус оплаты"
              name="payment_status"
              value={formData.payment_status}
              onChange={handleFieldChange}
              margin="normal"
              SelectProps={{
                native: true,
              }}
            >
              <option value="pending">Ожидает оплаты</option>
              <option value="paid">Оплачен</option>
              <option value="cancelled">Отменен</option>
            </TextField>
            <TextField
              fullWidth
              label="Примечания"
              name="notes"
              multiline
              rows={4}
              value={formData.notes}
              onChange={handleFieldChange}
              error={!!errors.notes}
              helperText={errors.notes || 'Введите примечания (необязательно)'}
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
            {selectedOrder ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManagerPanel;