import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TablePagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
  Chip,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  CircularProgress,
  Container
} from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import CarrierForm from '../components/carriers/CarrierForm';
import DataTable from '../components/common/DataTable';
import CarrierCard from '../components/carriers/CarrierCard';
import { carriersApi } from '../api/api';
import CarrierList from '../components/carriers/CarrierList';

const CarriersPage = () => {
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({});

  const fetchCarriers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await carriersApi.getAll(filters);
      
      if (response.data && Array.isArray(response.data)) {
        setCarriers(response.data);
      } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
        setCarriers(response.data.results);
      } else {
        console.warn('Неожиданный формат данных:', response.data);
        setCarriers([]);
      }
    } catch (error) {
      console.error('Ошибка при загрузке перевозчиков:', error);
      if (!carriers.length) {
        setError('Не удалось загрузить перевозчиков. Пожалуйста, попробуйте позже.');
      }
    } finally {
      setLoading(false);
    }
  }, [carriers.length, filters]);

  useEffect(() => {
    fetchCarriers();
  }, [fetchCarriers]);

  const handleDelete = async (carrierId) => {
    try {
      await carriersApi.delete(carrierId);
      setCarriers(carriers.filter(carrier => carrier.id !== carrierId));
      setSuccess('Перевозчик успешно удален');
    } catch (error) {
      console.error('Ошибка при удалении перевозчика:', error);
      setError('Не удалось удалить перевозчика. Пожалуйста, попробуйте позже.');
    }
  };

  const handleAdd = async (formData) => {
    try {
      setError(null);
      const response = await carriersApi.create(formData);
      setCarriers([...carriers, response.data]);
      setSuccess('Перевозчик успешно добавлен');
    } catch (error) {
      console.error('Ошибка при создании перевозчика:', error);
      setError('Не удалось создать перевозчика. Пожалуйста, проверьте введенные данные и попробуйте снова.');
    }
  };

  const handleExport = async () => {
    try {
      const response = await carriersApi.exportExcel();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'carriers.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSuccess('Данные успешно экспортированы');
    } catch (err) {
      setError('Ошибка при экспорте данных');
      console.error('Ошибка:', err);
    }
  };

  const handleImport = async (file) => {
    try {
      await carriersApi.importExcel(file);
      setSuccess('Данные успешно импортированы');
      fetchCarriers();
    } catch (err) {
      setError('Ошибка при импорте данных');
      console.error('Ошибка:', err);
    }
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  const handleBulkDelete = async (carrierIds) => {
    if (!window.confirm(`Вы уверены, что хотите удалить ${carrierIds.length} перевозчиков?`)) {
      return;
    }

    try {
      setLoading(true);
      // Удаляем перевозчиков последовательно
      for (const carrierId of carrierIds) {
        await api.delete(`/carriers/${carrierId}/`);
      }
      
      // Обновляем список перевозчиков
      await fetchCarriers();
      setSuccess(`Успешно удалено ${carrierIds.length} перевозчиков`);
    } catch (error) {
      console.error('Ошибка при массовом удалении перевозчиков:', error);
      setError('Не удалось удалить некоторых перевозчиков');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !carriers.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <CarrierList
        carriers={carriers}
        onDelete={handleDelete}
        onAdd={handleAdd}
        onExport={handleExport}
        onImport={handleImport}
        onApplyFilters={handleApplyFilters}
        loading={loading}
        error={error}
        fetchCarriers={fetchCarriers}
        onBulkDelete={handleBulkDelete}
      />
    </Container>
  );
};

export default CarriersPage; 