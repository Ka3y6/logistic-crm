import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  Alert,
  Chip,
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { ordersApi } from '../../api/api';
import DataTable from '../common/DataTable';

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const navigate = useNavigate();

  const columns = [
    {
      field: 'order_number',
      headerName: 'Номер заказа',
      minWidth: 120,
      renderCell: (params) => (
        <Link
          component={RouterLink}
          to={`/orders/${params.row.id}`}
          sx={{ textDecoration: 'none', color: 'primary.main' }}
        >
          {params.value}
        </Link>
      ),
    },
    { field: 'contract_number', headerName: 'Номер договора', minWidth: 150 },
    { field: 'client_name', headerName: 'Клиент', minWidth: 200 },
    { field: 'status', headerName: 'Статус', minWidth: 120 },
    { field: 'loading_date', headerName: 'Дата загрузки', minWidth: 120 },
    { field: 'total_price', headerName: 'Сумма', minWidth: 120 },
  ];

  const filterConfig = [
    { name: 'contract_number', label: 'Номер договора', type: 'text' },
    { name: 'client', label: 'Клиент', type: 'text' },
    { name: 'status', label: 'Статус', type: 'select', options: [
      { value: 'new', label: 'Новый' },
      { value: 'in_progress', label: 'В работе' },
      { value: 'completed', label: 'Завершен' },
      { value: 'cancelled', label: 'Отменен' },
    ]},
    { name: 'date_from', label: 'Дата с', type: 'date' },
    { name: 'date_to', label: 'Дата по', type: 'date' },
  ];

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersApi.getAll(filters);
      let ordersData = response.data;
      
      console.log('Полученные данные заказов:', ordersData);
      
      if (typeof ordersData === 'object' && ordersData !== null) {
        if (Array.isArray(ordersData.results)) {
          ordersData = ordersData.results;
        } else if (Array.isArray(ordersData.data)) {
          ordersData = ordersData.data;
        }
      }

      // Преобразование данных для отображения
      const formattedOrders = Array.isArray(ordersData) ? ordersData.map(order => {
        console.log('Обработка заказа:', order);
        return {
          ...order,
          client_name: order.client?.company_name || 'Не указан',
          loading_date: order.loading_date ? new Date(order.loading_date).toLocaleDateString('ru-RU') : '-',
          total_price: order.total_price ? `${order.total_price} ₽` : '-',
        };
      }) : [];
      
      setOrders(formattedOrders);
      setError(null);
    } catch (err) {
      console.error('Ошибка при загрузке заказов:', err);
      setError('Ошибка при загрузке заказов');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleEdit = (id) => {
    navigate(`/orders/${id}/edit`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этот заказ?')) {
      try {
        await ordersApi.delete(id);
        fetchOrders();
      } catch (err) {
        setError('Ошибка при удалении заказа');
        console.error('Ошибка:', err);
      }
    }
  };

  const handleExport = async () => {
    try {
      const response = await ordersApi.export();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'orders.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Ошибка при экспорте:', error);
      setError('Ошибка при экспорте данных');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = async (event) => {
      const file = event.target.files[0];
      try {
        await ordersApi.import(file);
        fetchOrders();
      } catch (error) {
        console.error('Ошибка при импорте:', error);
        setError('Ошибка при импорте данных');
      }
    };
    input.click();
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        {/* Убрали CircularProgress */}
      </Box>
    );
  }

  return (
    <Box>
      <DataTable
        data={orders}
        columns={columns}
        filters={filterConfig}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onExport={handleExport}
        onImport={handleImport}
        onApplyFilters={handleApplyFilters}
        loading={loading}
        error={error}
      />
    </Box>
  );
};

export default OrdersList; 