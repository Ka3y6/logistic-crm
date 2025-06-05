import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Chip,
  Button,
  Stack,
  Typography,
  CircularProgress,
  Checkbox,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Description as DescriptionIcon,
  ColorLens as ColorLensIcon,
  DeleteSweep as DeleteSweepIcon
} from '@mui/icons-material';
import api from '../../api/api';
import { predefinedColors } from '../../constants/colors'; // Импортируем константу

// Определяем цвета радуги + белый/серый
/* Удаляем локальное определение
const predefinedColors = [
  { name: 'Красный', value: '#FFCDD2' },
  { name: 'Розовый', value: '#F8BBD0' },
  { name: 'Фиолетовый', value: '#E1BEE7' },
  { name: 'Синий', value: '#BBDEFB' },
  { name: 'Зеленый', value: '#C8E6C9' },
  { name: 'Желтый', value: '#FFF9C4' },
  { name: 'Оранжевый', value: '#FFE0B2' },
  { name: 'Серый', value: '#EEEEEE' },
  { name: 'Нет', value: null },
];
*/

// Оборачиваем в forwardRef
const DataTable = forwardRef(({
  data,
  columns,
  onEdit,
  onDelete,
  onViewDetails,
  loading,
  error,
  tableContext,
  onGenerateDocument,
  onBulkDelete,
}, ref) => {
  const [selectedCells, setSelectedCells] = useState([]);
  const [highlightedCells, setHighlightedCells] = useState({});
  const [currentColorIndex, setCurrentColorIndex] = useState(0);
  const [selectedRows, setSelectedRows] = useState([]);

  useImperativeHandle(ref, () => ({
    getSelectedCellsCount: () => selectedCells.length,
    getCurrentColorIndex: () => currentColorIndex,
    setCurrentColorIndex: (index) => setCurrentColorIndex(index),
    handleApplyColor: handleApplyColor,
    handleClearColor: handleClearColor
  }));

  // Загрузка выделений при монтировании или смене контекста таблицы
  useEffect(() => {
    if (!tableContext) {
      console.warn('DataTable: tableContext prop is missing, highlights will not be loaded/saved.');
      return;
    }

    const loadHighlights = async () => {
      try {
        const response = await api.get(`/highlights/?table=${tableContext}`);
        const loaded = {};
        
        // Проверяем, что response.data существует и является массивом, 
        // или содержит массив в свойстве results
        let highlightsArray = null;
        if (response.data) {
          if (Array.isArray(response.data)) {
            highlightsArray = response.data;
          } else if (response.data.results && Array.isArray(response.data.results)) {
            highlightsArray = response.data.results;
          }
        }

        if (highlightsArray) {
          highlightsArray.forEach(h => {
            if (h && typeof h.row_id !== 'undefined' && typeof h.column_id !== 'undefined') {
          loaded[`${h.row_id}-${h.column_id}`] = h.color;
            }
        });
        } else {
          console.log(`[DataTable-${tableContext}] No highlights data found or data is not an array. Response data:`, response.data);
        }
        
        setHighlightedCells(loaded);
        console.log(`[DataTable-${tableContext}] Highlights processed. Loaded cells:`, loaded);
      } catch (err) {
        console.error(`[DataTable-${tableContext}] Error loading highlights:`, err);
        // TODO: Показать ошибку пользователю?
      }
    };

    loadHighlights();
  }, [tableContext]); // Зависимость от tableContext

  const getStatusColor = (status) => {
    if (!status) return 'default';
    switch (status.toLowerCase()) {
      case 'активный':
        return 'success';
      case 'перспективный':
        return 'warning';
      case 'есть интерес':
        return 'info';
      case 'новый':
        return 'info';
      case 'в работе':
        return 'warning';
      case 'завершен':
        return 'success';
      case 'отменен':
        return 'error';
      default:
        return 'default';
    }
  };

  // Функции для раскраски ячеек
  const handleCellClick = (rowId, columnId) => {
    // Игнорируем клики на колонку действий и статуса
    if (columnId === 'actions' || columnId === 'status') return;
    const cellId = `${rowId}-${columnId}`;
    setSelectedCells((prevSelected) =>
      prevSelected.includes(cellId)
        ? prevSelected.filter((id) => id !== cellId)
        : [...prevSelected, cellId]
    );
  };

  const handleApplyColor = async () => {
    console.log('[DataTable] handleApplyColor called via ref'); // ЛОГ 3
    if (!tableContext) {
      console.error('[DataTable] Cannot apply color: tableContext is missing.');
      return;
    }
    const newHighlights = { ...highlightedCells };
    const updatesToSave = [];
    const colorToApply = predefinedColors[currentColorIndex].value;

    selectedCells.forEach(cellId => {
      const [rowIdStr, columnId] = cellId.split('-');
      const rowId = parseInt(rowIdStr, 10);
      if (isNaN(rowId)) {
         console.error(`[DataTable] Invalid rowId after parse: ${rowIdStr}`);
         return; // Пропускаем эту ячейку, если ID некорректный
      }
      newHighlights[cellId] = colorToApply;
      updatesToSave.push({
        table_name: tableContext,
        row_id: rowId,
        column_id: columnId,
        color: colorToApply,
      });
    });

    setHighlightedCells(newHighlights);
    setSelectedCells([]); // Сбрасываем выделение после применения
    console.log(`[DataTable-${tableContext}] Applying color:`, colorToApply, 'to cells:', selectedCells);
    try {
      if (updatesToSave.length > 0) {
         // Убираем лишний /api из URL
         await api.post('/highlights/save/', updatesToSave);
         console.log(`[DataTable-${tableContext}] Highlights saved:`, updatesToSave);
      }
    } catch (err) {
      console.error(`[DataTable-${tableContext}] Error saving highlights:`, err);
      setHighlightedCells(highlightedCells);
      setSelectedCells(selectedCells);
      alert('Не удалось сохранить выделение. Пожалуйста, попробуйте еще раз.');
    }
  };

  // Функция для очистки цвета выделенных ячеек
  const handleClearColor = async () => {
    console.log('[DataTable] handleClearColor called via ref'); // ЛОГ 4
    if (!tableContext) {
      console.error('[DataTable] Cannot clear color: tableContext is missing.');
      return;
    }
    const newHighlights = { ...highlightedCells };
    const updatesToDelete = [];

    selectedCells.forEach(cellId => {
      const [rowIdStr, columnId] = cellId.split('-');
      const rowId = parseInt(rowIdStr, 10);
       if (isNaN(rowId)) {
         console.error(`[DataTable] Invalid rowId after parse: ${rowIdStr}`);
         return; // Пропускаем эту ячейку, если ID некорректный
      }
      delete newHighlights[cellId];
        updatesToDelete.push({
        table_name: tableContext,
          row_id: rowId,
          column_id: columnId,
        color: null,
      });
    });

    setHighlightedCells(newHighlights);
    setSelectedCells([]); // Сбрасываем выделение
    console.log(`[DataTable-${tableContext}] Clearing color for cells:`, selectedCells);
     try {
      if (updatesToDelete.length > 0) {
        // Убираем лишний /api из URL
        await api.post('/highlights/save/', updatesToDelete);
        console.log(`[DataTable-${tableContext}] Highlights cleared:`, updatesToDelete);
      }
    } catch (err) {
      console.error(`[DataTable-${tableContext}] Error clearing highlights:`, err);
      setHighlightedCells(highlightedCells);
      setSelectedCells(selectedCells);
      alert('Не удалось очистить выделение. Пожалуйста, попробуйте еще раз.');
    }
  };

  const handleSelectAllRows = (event) => {
    if (event.target.checked) {
      setSelectedRows(data.map(row => row.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (rowId) => {
    setSelectedRows(prev => 
      prev.includes(rowId)
        ? prev.filter(id => id !== rowId)
        : [...prev, rowId]
    );
  };

  const handleBulkDelete = () => {
    console.log('handleBulkDelete called');
    console.log('selectedRows:', selectedRows);
    console.log('onBulkDelete exists:', !!onBulkDelete);
    if (selectedRows.length > 0 && onBulkDelete) {
      console.log('Calling onBulkDelete with:', selectedRows);
      onBulkDelete(selectedRows);
      setSelectedRows([]); // Очищаем выбранные строки после удаления
    }
  };

  const tableCellStyle = {
    paddingTop: '8px',
    paddingBottom: '8px',
    fontSize: '0.875rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    borderBottom: '1px solid rgba(224, 224, 224, 1)',
    borderRight: '1px solid rgba(224, 224, 224, 1)',
    '&:first-of-type': {
      borderLeft: 'none',
      paddingLeft: '16px'
    },
    '&:last-of-type': {
      paddingRight: '16px'
    }
  };

  const headerCellStyle = {
    paddingTop: '12px',
    paddingBottom: '12px',
    fontSize: '0.875rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    borderRight: '1px solid rgba(224, 224, 224, 1)',
    borderBottom: '2px solid rgba(224, 224, 224, 1)',
    fontWeight: '600',
    backgroundColor: '#f8f9fa',
    color: 'rgba(0, 0, 0, 0.87)',
    '&:first-of-type': {
      borderLeft: 'none',
      paddingLeft: '16px'
    },
    '&:last-of-type': {
      paddingRight: '16px'
    }
  };

  const tableContainerStyle = {
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    border: '1px solid rgba(224, 224, 224, 1)',
    '& .MuiTable-root': {
      borderCollapse: 'separate',
      borderSpacing: 0
    }
  };

  // Лог перед return для проверки состояния highlightedCells
  console.log(`[DataTable-${tableContext}] Rendering with highlightedCells:`, highlightedCells); // ЛОГ 5

  return (
    <Box sx={{ width: '100%' }}>
      {/* УБИРАЕМ ПАНЕЛЬ ВЫБОРА ЦВЕТА ОТСЮДА */}
      {/* 
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, ml: 1, flexWrap: 'wrap' }}>
         ...
      </Box>
      */}

      {/* Фильтры теперь только если нужны внутри таблицы, иначе убираем */}
      {/* <TableFilters filters={filters} onApplyFilters={onApplyFilters} onClearFilters={() => onApplyFilters({})} /> */}
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {!loading && data && data.length === 0 && <Typography sx={{ p: 2 }}>Нет данных для отображения</Typography>}
      {!loading && data && data.length > 0 && (
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          {selectedRows.length > 0 && (
            <Tooltip title="Удалить выбранные">
              <IconButton
                color="error"
                onClick={handleBulkDelete}
                size="small"
                sx={{
                  backgroundColor: 'error.light',
                  '&:hover': {
                    backgroundColor: 'error.main',
                  },
                }}
              >
                <DeleteSweepIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      )}
      {!loading && data && data.length > 0 && (
        <TableContainer 
          component={Paper}
          elevation={1}
          sx={tableContainerStyle}
        >
          <Table
            stickyHeader
            size="small"
            sx={{ 
              borderCollapse: 'collapse',
              width: '100%'
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={data.length > 0 && selectedRows.length === data.length}
                    indeterminate={selectedRows.length > 0 && selectedRows.length < data.length}
                    onChange={handleSelectAllRows}
                  />
                </TableCell>
                {columns.map((column) => (
                  <TableCell
                    key={column.field}
                    style={{
                      minWidth: column.minWidth || 150,
                      width: column.width || 'auto',
                      backgroundColor: '#f5f5f5',
                      fontWeight: 'bold',
                      borderBottom: '2px solid rgba(224, 224, 224, 1)',
                      borderRight: '1px solid rgba(224, 224, 224, 1)',
                      padding: '12px 16px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {column.headerName}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} align="center">
                    Нет данных
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedRows.includes(row.id)}
                        onChange={() => handleSelectRow(row.id)}
                      />
                    </TableCell>
                    {columns.map((column) => {
                      const cellId = `${row.id}-${column.field}`;
                      const isSelected = selectedCells.includes(cellId);
                      const backgroundColor = highlightedCells[cellId] || 'inherit';

                      return (
                        <TableCell 
                          key={column.field}
                          sx={{
                            ...tableCellStyle,
                            minWidth: column.minWidth || 150,
                            width: column.width || 'auto',
                            backgroundColor: backgroundColor,
                            outline: isSelected ? '2px solid blue' : 'none',
                            cursor: column.field === 'actions' || column.field === 'status' ? 'default' : 'pointer',
                            paddingLeft: '0px',
                            paddingRight: '0px',
                          }}
                          onClick={() => handleCellClick(row.id, column.field)}
                        >
                          {column.renderCell ? column.renderCell({ row }) :
                            column.field === 'status' ? (
                              row[column.field] ? (
                                <Chip
                                  label={row[column.field]}
                                  color={getStatusColor(row[column.field])}
                                  size="small"
                                />
                              ) : (
                                <Chip
                                  label="Не указан"
                                  color="default"
                                  size="small"
                                />
                              )
                            ) : (row[column.field] || '-')
                          }
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}); // Закрываем forwardRef

export default DataTable; 