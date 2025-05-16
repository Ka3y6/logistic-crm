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
  TableRow,
  Alert,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  LocalShipping as ShippingIcon,
} from '@mui/icons-material';
import api from '../../api/api';

const FinancialReport = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateDate = (date) => {
    return date && !isNaN(Date.parse(date));
  };

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      setError('Пожалуйста, выберите начальную и конечную даты');
      return;
    }

    if (!validateDate(startDate) || !validateDate(endDate)) {
      setError('Пожалуйста, введите корректные даты');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('Начальная дата не может быть позже конечной');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.get('finance/report/', {
        params: {
          start_date: startDate,
          end_date: endDate,
        },
      });
      setReport(response.data);
      setSuccess('Отчет успешно сгенерирован');
    } catch (error) {
      setError(error.response?.data?.message || 'Произошла ошибка при генерации отчета');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, trend }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {icon}
          <Typography variant="h6" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div">
          {value}
        </Typography>
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            {trend > 0 ? (
              <TrendingUpIcon color="success" />
            ) : (
              <TrendingDownIcon color="error" />
            )}
            <Typography
              variant="body2"
              color={trend > 0 ? 'success.main' : 'error.main'}
              sx={{ ml: 0.5 }}
            >
              {Math.abs(trend)}% по сравнению с предыдущим периодом
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Typography variant="h4" sx={{ mb: 3 }}>
        Финансовый отчет
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Начальная дата"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Конечная дата"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleGenerateReport}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Сгенерировать отчет'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {report && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Общая выручка"
                value={`₽${report.total_revenue.toLocaleString()}`}
                icon={<MoneyIcon color="primary" />}
                trend={report.revenue_trend}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Количество заказов"
                value={report.total_orders}
                icon={<ShippingIcon color="primary" />}
                trend={report.orders_trend}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Средний чек"
                value={`₽${report.average_order_value.toLocaleString()}`}
                icon={<MoneyIcon color="primary" />}
                trend={report.average_order_trend}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Прибыль"
                value={`₽${report.profit.toLocaleString()}`}
                icon={<MoneyIcon color="primary" />}
                trend={report.profit_trend}
              />
            </Grid>
          </Grid>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Дата</TableCell>
                  <TableCell align="right">Выручка</TableCell>
                  <TableCell align="right">Количество заказов</TableCell>
                  <TableCell align="right">Средний чек</TableCell>
                  <TableCell align="right">Прибыль</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.daily_stats.map((stat) => (
                  <TableRow key={stat.date}>
                    <TableCell>{new Date(stat.date).toLocaleDateString('ru-RU')}</TableCell>
                    <TableCell align="right">₽{stat.revenue.toLocaleString()}</TableCell>
                    <TableCell align="right">{stat.orders}</TableCell>
                    <TableCell align="right">₽{stat.average_order_value.toLocaleString()}</TableCell>
                    <TableCell align="right">₽{stat.profit.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
};

export default FinancialReport; 