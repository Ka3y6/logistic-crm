import React, { useState, useEffect, useCallback } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { cargosApi } from '../../api/api';
import DataTable from '../common/DataTable';

const CargoList = () => {
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const navigate = useNavigate();

  const columns = [
    { field: 'name', headerName: 'Наименование', minWidth: 200 },
    { field: 'weight', headerName: 'Вес (кг)', minWidth: 120 },
    { field: 'volume', headerName: 'Объем (м³)', minWidth: 120 },
    { field: 'tnved_code', headerName: 'Код ТН ВЭД', minWidth: 150 },
    { field: 'cargo_type', headerName: 'Тип груза', minWidth: 150 },
    { field: 'transport_conditions', headerName: 'Условия перевозки', minWidth: 200 },
    { field: 'cargo_value', headerName: 'Стоимость', minWidth: 120 },
    { field: 'status', headerName: 'Статус', minWidth: 120 },
  ];

  const filterConfig = [
    { name: 'name', label: 'Наименование', type: 'text' },
    { name: 'tnved_code', label: 'Код ТН ВЭД', type: 'text' },
    { name: 'cargo_type', label: 'Тип груза', type: 'select', options: [
      { value: 'general', label: 'Генеральный' },
      { value: 'bulk', label: 'Навалочный' },
      { value: 'liquid', label: 'Наливной' },
      { value: 'dangerous', label: 'Опасный' },
      { value: 'perishable', label: 'Скоропортящийся' },
    ]},
    { name: 'weight_from', label: 'Вес от (кг)', type: 'number' },
    { name: 'weight_to', label: 'Вес до (кг)', type: 'number' },
    { name: 'value_from', label: 'Стоимость от', type: 'number' },
    { name: 'value_to', label: 'Стоимость до', type: 'number' },
    { name: 'status', label: 'Статус', type: 'select', options: [
      { value: 'active', label: 'Активный' },
      { value: 'pending', label: 'В ожидании' },
      { value: 'completed', label: 'Завершен' },
      { value: 'cancelled', label: 'Отменен' },
    ]},
  ];

  const fetchCargos = async () => {
    try {
      setLoading(true);
      const response = await cargosApi.getAll(filters);
      let cargosData = response.data;
      
      if (typeof cargosData === 'object' && cargosData !== null) {
        if (Array.isArray(cargosData.results)) {
          cargosData = cargosData.results;
        } else if (Array.isArray(cargosData.data)) {
          cargosData = cargosData.data;
        }
      }

      // Форматирование данных для отображения
      const formattedCargos = Array.isArray(cargosData) ? cargosData.map(cargo => ({
        ...cargo,
        weight: cargo.weight ? `${cargo.weight} кг` : '-',
        volume: cargo.volume ? `${cargo.volume} м³` : '-',
        cargo_value: cargo.cargo_value ? `${cargo.cargo_value} ₽` : '-',
        status: cargo.status || 'Активный', // Значение по умолчанию
      })) : [];
      
      setCargos(formattedCargos);
      setError(null);
    } catch (error) {
      console.error('Ошибка при загрузке грузов:', error);
      setError('Ошибка при загрузке списка грузов');
      setCargos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCargos();
  }, [filters, fetchCargos]);

  // Оборачиваем функцию fetchCargos в useCallback
  const memoizedFetchCargos = useCallback(fetchCargos, [filters]);

  const handleEdit = (id) => {
    navigate(`/cargos/${id}/edit`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этот груз?')) {
      try {
        await cargosApi.delete(id);
        fetchCargos();
      } catch (error) {
        console.error('Ошибка при удалении:', error);
        setError('Ошибка при удалении груза');
      }
    }
  };

  const handleExport = async () => {
    try {
      const response = await cargosApi.export();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'cargos.xlsx');
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
        await cargosApi.import(file);
        fetchCargos();
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
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <DataTable
        title="Грузы"
        data={cargos}
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

export default CargoList; 