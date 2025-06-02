import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
} from '@mui/material';

const OrderInfo = ({ order }) => {
  if (!order) return null;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
          <Typography variant="h6" gutterBottom>
            Основная информация
          </Typography>
          <Box mb={2}>
            <Typography variant="subtitle2" color="textSecondary">
              Номер заказа
            </Typography>
            <Typography variant="body1">{order.order_number}</Typography>
          </Box>
          <Box mb={2}>
            <Typography variant="subtitle2" color="textSecondary">
              Статус
            </Typography>
            <Chip
              label={order.status}
              color={
                order.status === 'completed'
                  ? 'success'
                  : order.status === 'in_progress'
                  ? 'primary'
                  : 'default'
              }
            />
          </Box>
          <Box mb={2}>
            <Typography variant="subtitle2" color="textSecondary">
              Дата создания
            </Typography>
            <Typography variant="body1">
              {new Date(order.created_at).toLocaleDateString()}
            </Typography>
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
          <Typography variant="h6" gutterBottom>
            Информация о клиенте
          </Typography>
          <Box mb={2}>
            <Typography variant="subtitle2" color="textSecondary">
              Клиент
            </Typography>
            <Typography variant="body1">{order.client?.name}</Typography>
          </Box>
          <Box mb={2}>
            <Typography variant="subtitle2" color="textSecondary">
              Контактное лицо
            </Typography>
            <Typography variant="body1">{order.contact_person}</Typography>
          </Box>
          <Box mb={2}>
            <Typography variant="subtitle2" color="textSecondary">
              Телефон
            </Typography>
            <Typography variant="body1">{order.contact_phone}</Typography>
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
          <Typography variant="h6" gutterBottom>
            Дополнительная информация
          </Typography>
          <Box mb={2}>
            <Typography variant="subtitle2" color="textSecondary">
              Комментарий
            </Typography>
            <Typography variant="body1">{order.comment || 'Нет комментария'}</Typography>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default OrderInfo; 