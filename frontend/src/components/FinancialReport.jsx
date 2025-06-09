import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  TextField, 
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { financialApi } from '../api/api';
import config from '../config';

const FinancialReport = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      setError('Пожалуйста, выберите даты');
      return;
    }

    if (!validateDate(startDate) || !validateDate(endDate)) {
      setError('Пожалуйста, введите корректные даты');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      setError('Начальная дата не может быть позже конечной');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await financialApi.getReport({
        start_date: start.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0]
      });
      setReportData(response.data);
    } catch (err) {
      setError('Ошибка при получении отчета');
      console.error('Ошибка:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Финансовый отчет
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Начальная дата"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                max: endDate || new Date().toISOString().split('T')[0]
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Конечная дата"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                min: startDate,
                max: new Date().toISOString().split('T')[0]
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              onClick={handleGenerateReport}
              disabled={loading}
              fullWidth
            >
              {loading ? 'Загрузка...' : 'Сформировать отчет'}
            </Button>
          </Grid>
        </Grid>

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </Paper>

      {reportData && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Итоги периода
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'white' }}>
                <Typography variant="subtitle2">Общая выручка</Typography>
                <Typography variant="h6">{reportData.total_revenue} ₽</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'white' }}>
                <Typography variant="subtitle2">Оплаченные заказы</Typography>
                <Typography variant="h6">{reportData.paid_orders}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, bgcolor: 'warning.light', color: 'white' }}>
                <Typography variant="subtitle2">Ожидающие оплаты</Typography>
                <Typography variant="h6">{reportData.pending_payments} ₽</Typography>
              </Paper>
            </Grid>
          </Grid>

          <TableContainer sx={{ mt: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Дата</TableCell>
                  <TableCell>Заказ</TableCell>
                  <TableCell>Клиент</TableCell>
                  <TableCell align="right">Сумма</TableCell>
                  <TableCell>Статус</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{new Date(order.date).toLocaleDateString('ru-RU')}</TableCell>
                    <TableCell>{order.contract_number}</TableCell>
                    <TableCell>{order.client_name}</TableCell>
                    <TableCell align="right">{order.amount} ₽</TableCell>
                    <TableCell>{order.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default FinancialReport; 