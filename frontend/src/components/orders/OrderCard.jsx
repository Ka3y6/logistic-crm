import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import OrderDocumentsTab from './OrderDocumentsTab';

const OrderCard = ({ order, open, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  if (!order) {
    return null; // Не рендерим, если нет данных заказа
  }

  // Функция для безопасного отображения дат
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      // Попробуем разные форматы, т.к. в данных могут быть разные
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Неверная дата';
      // Отображаем дату и время
      return date.toLocaleString('ru-RU'); 
    } catch (e) {
      return 'Ошибка даты';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Детали заказа #{order.id}</DialogTitle>
      <DialogContent dividers>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
          <Tab label="Детали" />
          <Tab label="Документы" />
        </Tabs>
        {activeTab === 0 && (
          <Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>Основная информация</Typography>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6}><Typography variant="body2"><b>Клиент:</b> {order.client?.company_name || '-'}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography variant="body2"><b>Перевозчик:</b> {order.carrier?.company_name || '-'}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography variant="body2"><b>Статус:</b> {order.status || '-'}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography variant="body2"><b>Статус оплаты:</b> {order.payment_status || '-'}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography variant="body2"><b>Номер договора:</b> {order.contract_number || '-'}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography variant="body2"><b>Дата договора:</b> {formatDate(order.contract_date)}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography variant="body2"><b>Номер тр. заказа:</b> {order.transport_order_number || '-'}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography variant="body2"><b>Сумма:</b> {order.total_price ? `${order.total_price} ₽` : '-'}</Typography></Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>Груз</Typography>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6}><Typography variant="body2"><b>Наименование:</b> {order.cargo_name || '-'}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography variant="body2"><b>Код ТНВЭД:</b> {order.tnved_code || '-'}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography variant="body2"><b>Класс опасности:</b> {order.cargo_danger || '-'}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography variant="body2"><b>Вес (кг):</b> {order.cargo_weight || '-'}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography variant="body2"><b>Габариты:</b> {order.cargo_dimensions || '-'}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography variant="body2"><b>Объем (м³):</b> {order.cargo_volume || '-'}</Typography></Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>Даты и адреса</Typography>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={4}><Typography variant="body2"><b>Дата загрузки:</b> {formatDate(order.loading_date)}</Typography></Grid>
                <Grid item xs={12} sm={4}><Typography variant="body2"><b>Дата отправки:</b> {formatDate(order.departure_date)}</Typography></Grid>
                <Grid item xs={12} sm={4}><Typography variant="body2"><b>Дата выгрузки:</b> {formatDate(order.unloading_date)}</Typography></Grid>
                <Grid item xs={12}><Typography variant="body2"><b>Адрес загрузки:</b> {order.loading_address || '-'}</Typography></Grid>
                <Grid item xs={12}><Typography variant="body2"><b>Адрес выгрузки:</b> {order.unloading_address || '-'}</Typography></Grid>
                <Grid item xs={12}><Typography variant="body2"><b>Маршрут:</b> {order.route || '-'}</Typography></Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Typography variant="h6" gutterBottom>Дополнительно</Typography>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6}><Typography variant="body2"><b>Тип транспорта:</b> {order.transport_type || '-'}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography variant="body2"><b>Условия поставки:</b> {order.delivery_terms || '-'}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography variant="body2"><b>Грузоотправитель:</b> {order.shipper || '-'}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography variant="body2"><b>Пункт назначения:</b> {order.destination || '-'}</Typography></Grid>
                <Grid item xs={12}><Typography variant="body2"><b>Примечания:</b> {order.notes || '-'}</Typography></Grid>
              </Grid>
            </Box>
          </Box>
        )}
        {activeTab === 1 && (
          <OrderDocumentsTab orderId={order.id} />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderCard; 