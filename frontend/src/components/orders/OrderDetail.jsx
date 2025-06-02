import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { ordersApi, cargosApi } from '../../api/api';
import OrderInfo from './OrderInfo';
import CargoList from './CargoList';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [cargos, setCargos] = useState([]);
  const [showCargoDialog, setShowCargoDialog] = useState(false);

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const [orderRes, cargosRes] = await Promise.all([
          ordersApi.getById(id),
          cargosApi.getByOrderId(id)
        ]);
        setOrder(orderRes.data);
        setCargos(cargosRes.data);
        setLoading(false);
      } catch (err) {
        setError('Ошибка при загрузке данных');
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [id]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleAddCargo = () => {
    setShowCargoDialog(true);
  };

  const handleCloseCargoDialog = () => {
    setShowCargoDialog(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Заказ #{order?.order_number}</Typography>
        <Button variant="outlined" onClick={() => navigate('/orders')}>
          Назад к списку
        </Button>
      </Box>

      <Paper elevation={3}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Информация о заказе" />
          <Tab label="Грузы" />
        </Tabs>

        <Box p={3}>
          {activeTab === 0 && <OrderInfo order={order} />}
          {activeTab === 1 && (
            <Box>
              <Box display="flex" justifyContent="flex-end" mb={2}>
                <Button variant="contained" color="primary" onClick={handleAddCargo}>
                  Добавить груз
                </Button>
              </Box>
              <CargoList cargos={cargos} orderId={id} />
            </Box>
          )}
        </Box>
      </Paper>

      <Dialog open={showCargoDialog} onClose={handleCloseCargoDialog} maxWidth="md" fullWidth>
        <DialogTitle>Добавить груз</DialogTitle>
        <DialogContent>
          {/* Здесь будет форма добавления груза */}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCargoDialog}>Отмена</Button>
          <Button variant="contained" color="primary">
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderDetail; 