import React, { useState, useEffect } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Alert,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete
} from '@mui/material';
import api from '../../api';

const OrderForm = ({ open, onClose, onSubmit, order, clients, carriers }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    client_id: '',
    carrier_id: '',
    order_number: '',
    contract_number: '',
    order_date: new Date().toISOString().split('T')[0],
    loading_date: '',
    unloading_date: '',
    loading_address: '',
    unloading_address: '',
    cargo_description: '',
    cargo_weight: '',
    cargo_volume: '',
    cargo_type: '',
    transport_type: '',
    price: '',
    payment_status: 'pending',
    status: 'new',
    comments: ''
  });

  useEffect(() => {
    if (order) {
      setFormData({
        client_id: order.client?.id || '',
        carrier_id: order.carrier?.id || '',
        order_number: order.order_number || '',
        contract_number: order.contract_number || '',
        order_date: order.order_date || new Date().toISOString().split('T')[0],
        loading_date: order.loading_date || '',
        unloading_date: order.unloading_date || '',
        loading_address: order.loading_address || '',
        unloading_address: order.unloading_address || '',
        cargo_description: order.cargo_description || '',
        cargo_weight: order.cargo_weight || '',
        cargo_volume: order.cargo_volume || '',
        cargo_type: order.cargo_type || '',
        transport_type: order.transport_type || '',
        price: order.price || '',
        payment_status: order.payment_status || 'pending',
        status: order.status || 'new',
        comments: order.comments || ''
      });
    } else {
      setFormData({
        client_id: '',
        carrier_id: '',
        order_number: '',
        contract_number: '',
        order_date: new Date().toISOString().split('T')[0],
        loading_date: '',
        unloading_date: '',
        loading_address: '',
        unloading_address: '',
        cargo_description: '',
        cargo_weight: '',
        cargo_volume: '',
        cargo_type: '',
        transport_type: '',
        price: '',
        payment_status: 'pending',
        status: 'new',
        comments: ''
      });
    }
  }, [order]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Проверка обязательных полей
    const requiredFields = {
      client_id: 'Пожалуйста, выберите клиента',
      carrier_id: 'Пожалуйста, выберите перевозчика',
      contract_number: 'Пожалуйста, введите номер договора'
    };

    for (const [field, message] of Object.entries(requiredFields)) {
      if (!formData[field]) {
        setError(message);
        return;
      }
    }

    try {
      console.log('Отправляемые данные:', formData);
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Ошибка при отправке формы:', error);
      setError(error.message || 'Произошла ошибка при сохранении заказа');
    }
  };

  const renderBasicInfo = () => (
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
          <InputLabel>Клиент *</InputLabel>
                <Select
            name="client_id"
            value={formData.client_id}
                onChange={handleChange}
            label="Клиент *"
                required
            error={!formData.client_id}
                >
            {clients?.map(client => (
                    <MenuItem key={client.id} value={client.id}>
                    {client.company_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
          <InputLabel>Перевозчик *</InputLabel>
                <Select
            name="carrier_id"
            value={formData.carrier_id}
                onChange={handleChange}
            label="Перевозчик *"
                required
            error={!formData.carrier_id}
              >
            {carriers?.map(carrier => (
                  <MenuItem key={carrier.id} value={carrier.id}>
                    {carrier.company_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
          label="Номер заказа"
          name="order_number"
          value={formData.order_number}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
          label="Номер договора *"
          name="contract_number"
          value={formData.contract_number}
              onChange={handleChange}
              required
          error={!formData.contract_number}
          helperText={!formData.contract_number ? "Это поле обязательно для заполнения" : ""}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
          label="Дата заказа"
          name="order_date"
          type="date"
          value={formData.order_date}
              onChange={handleChange}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
    </Grid>
  );

  const renderCargoInfo = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Описание груза"
          name="cargo_description"
          value={formData.cargo_description}
          onChange={handleChange}
          multiline
          rows={3}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
          label="Вес груза"
          name="cargo_weight"
          value={formData.cargo_weight}
              onChange={handleChange}
            />
          </Grid>
      <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
          label="Объем груза"
          name="cargo_volume"
          value={formData.cargo_volume}
              onChange={handleChange}
            />
          </Grid>
      <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
          <InputLabel>Тип груза</InputLabel>
              <Select
            name="cargo_type"
            value={formData.cargo_type}
                onChange={handleChange}
            label="Тип груза"
          >
            <MenuItem value="general">Обычный</MenuItem>
            <MenuItem value="dangerous">Опасный</MenuItem>
            <MenuItem value="perishable">Скоропортящийся</MenuItem>
              </Select>
            </FormControl>
          </Grid>
    </Grid>
  );

  const renderRouteInfo = () => (
    <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
          label="Адрес загрузки"
          name="loading_address"
          value={formData.loading_address}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
          label="Адрес выгрузки"
          name="unloading_address"
          value={formData.unloading_address}
              onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Дата загрузки"
              name="loading_date"
          type="date"
                value={formData.loading_date}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Дата выгрузки"
              name="unloading_date"
          type="date"
              value={formData.unloading_date}
              onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Тип транспорта</InputLabel>
              <Select
              name="transport_type"
                  value={formData.transport_type}
              onChange={handleChange}
            label="Тип транспорта"
              >
            <MenuItem value="truck">Грузовик</MenuItem>
            <MenuItem value="train">Железная дорога</MenuItem>
                <MenuItem value="ship">Морской транспорт</MenuItem>
            <MenuItem value="air">Авиация</MenuItem>
              </Select>
            </FormControl>
            </Grid>
          </Grid>
  );

  const renderFinancialInfo = () => (
    <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
          label="Стоимость"
          name="price"
          value={formData.price}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Статус оплаты</InputLabel>
              <Select
              name="payment_status"
              value={formData.payment_status}
                onChange={handleChange}
            label="Статус оплаты"
              >
                <MenuItem value="pending">Ожидает оплаты</MenuItem>
                <MenuItem value="paid">Оплачено</MenuItem>
            <MenuItem value="partially_paid">Частично оплачено</MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );

  const renderAdditionalInfo = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Статус заказа</InputLabel>
          <Select
            name="status"
            value={formData.status}
            onChange={handleChange}
            label="Статус заказа"
          >
            <MenuItem value="new">Новый</MenuItem>
            <MenuItem value="in_progress">В работе</MenuItem>
            <MenuItem value="completed">Завершен</MenuItem>
            <MenuItem value="cancelled">Отменен</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
          label="Комментарии"
          name="comments"
          value={formData.comments}
              onChange={handleChange}
              multiline
          rows={4}
              />
      </Grid>
    </Grid>
    );

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
        <Tab label="Основная информация" />
        <Tab label="Информация о грузе" />
        <Tab label="Маршрут" />
        <Tab label="Финансовая информация" />
        <Tab label="Дополнительно" />
        </Tabs>

      {activeTab === 0 && renderBasicInfo()}
      {activeTab === 1 && renderCargoInfo()}
      {activeTab === 2 && renderRouteInfo()}
      {activeTab === 3 && renderFinancialInfo()}
      {activeTab === 4 && renderAdditionalInfo()}

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button onClick={onClose}>Отмена</Button>
        <Button type="submit" variant="contained" color="primary">
          Сохранить
        </Button>
      </Box>
    </Box>
  );
};

export default OrderForm; 