import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Paper,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import api from '../api';
import ClientList from '../components/clients/ClientList';
import { clientsApi } from '../api/api';

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({});

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await clientsApi.getAll(filters);
      
      if (response.data && Array.isArray(response.data)) {
        setClients(response.data);
      } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
        setClients(response.data.results);
      } else {
        console.warn('Неожиданный формат данных:', response.data);
        setClients([]);
      }
    } catch (error) {
      console.error('Ошибка при загрузке клиентов:', error);
      if (!clients.length) {
      setError('Не удалось загрузить клиентов. Пожалуйста, попробуйте позже.');
      }
    } finally {
      setLoading(false);
    }
  }, [clients.length, filters]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleDelete = async (clientId) => {
    try {
      await api.delete(`/clients/${clientId}/`);
      setClients(clients.filter(client => client.id !== clientId));
    } catch (error) {
      console.error('Ошибка при удалении клиента:', error);
      setError('Не удалось удалить клиента. Пожалуйста, попробуйте позже.');
    }
  };

  const handleAdd = () => {
    // TODO: Реализовать добавление нового клиента
  };

  const handleExport = async () => {
    try {
      const response = await clientsApi.exportExcel();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'clients.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Ошибка при экспорте данных');
      console.error('Ошибка:', err);
    }
  };

  const handleImport = async (file) => {
    try {
      await clientsApi.importExcel(file);
      setSuccess('Данные успешно импортированы');
      fetchClients();
    } catch (err) {
      setError('Ошибка при импорте данных');
      console.error('Ошибка:', err);
    }
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
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

      <ClientList
        clients={clients}
        onDelete={handleDelete}
        onAdd={handleAdd}
        onExport={handleExport}
        onImport={handleImport}
        onApplyFilters={handleApplyFilters}
        loading={loading}
        error={error}
      />
    </Box>
  );
};

export default ClientsPage; 