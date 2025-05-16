import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  IconButton,
  Popover,
  Stack,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import {
  Add as AddIcon,
  FileDownload as ExportIcon,
  FileUpload as ImportIcon,
  ColorLens as ColorLensIcon,
} from '@mui/icons-material';
import CarrierCard from './CarrierCard';
import CarrierForm from './CarrierForm';
import DataTable from '../common/DataTable';
import TableFilters from '../common/TableFilters';
import { carriersApi } from '../../api/api';
import { predefinedColors } from '../../constants/colors';

const CarrierList = ({ carriers, onDelete, onAdd, onExport, onImport, onApplyFilters, loading, error, fetchCarriers }) => {
  const [selectedCarrier, setSelectedCarrier] = useState(null);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [importError, setImportError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const fileInputRef = React.useRef(null);

  // --- Состояние для Popover выбора цвета ---
  const [colorAnchorEl, setColorAnchorEl] = useState(null);
  const dataTableRef = useRef(null); // Ref для DataTable
  const [selectedCellsCount, setSelectedCellsCount] = useState(0); // Состояние для отображения кол-ва
  const [currentColorIndex, setCurrentColorIndex] = useState(0); // Состояние для текущего цвета

  // --- Обработчики для Popover ---
  const handleColorMenuOpen = (event) => {
    // Обновляем количество выделенных ячеек перед открытием
    if (dataTableRef.current) {
       setSelectedCellsCount(dataTableRef.current.getSelectedCellsCount());
       setCurrentColorIndex(dataTableRef.current.getCurrentColorIndex());
    }
    setColorAnchorEl(event.currentTarget);
  };

  const handleColorMenuClose = () => {
    setColorAnchorEl(null);
  };

  const isColorMenuOpen = Boolean(colorAnchorEl);
  // --- Конец обработчиков Popover ---

  // --- Обработчики для кнопок внутри Popover ---
  const handleSelectColor = (index) => {
    if (dataTableRef.current) {
        dataTableRef.current.setCurrentColorIndex(index);
        setCurrentColorIndex(index); // Обновляем локальное состояние для UI
    }
  };

  const handleApplyColorClick = () => {
    if (dataTableRef.current) {
      dataTableRef.current.handleApplyColor();
      // Обновляем счетчик после применения
      setSelectedCellsCount(0); // Сброс, т.к. DataTable сбрасывает выделение
    }
    handleColorMenuClose(); // Закрываем поповер
  };

  const handleClearColorClick = () => {
    if (dataTableRef.current) {
      dataTableRef.current.handleClearColor();
       // Обновляем счетчик после очистки
       setSelectedCellsCount(0); // Сброс
    }
    handleColorMenuClose(); // Закрываем поповер
  };
   // --- Конец обработчиков кнопок ---

  const handleRowClick = (carrierId) => {
    const carrier = carriers.find(c => c.id === carrierId);
    setSelectedCarrier(carrier);
    setIsCardOpen(true);
  };

  const handleEditClick = (carrierId) => {
    const carrier = carriers.find(c => c.id === carrierId);
    if (carrier) {
      setSelectedCarrier(carrier);
      setIsFormOpen(true);
    } else {
      console.error('Carrier not found for editing:', carrierId);
    }
  };

  const handleCloseCard = () => {
    setIsCardOpen(false);
    setSelectedCarrier(null);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedCarrier(null);
  };

  const handleSubmitForm = async (formData) => {
    try {
      if (selectedCarrier) {
        await carriersApi.update(selectedCarrier.id, formData);
        // Вызываем fetchCarriers после успешного обновления
        if (fetchCarriers) {
            fetchCarriers();
        }
      } else {
        await onAdd(formData);
        // Вызываем fetchCarriers после успешного добавления, если onAdd не делает этого
        if (fetchCarriers) {
            fetchCarriers();
        }
      }
      handleCloseForm();
    } catch (error) {
      console.error('Ошибка при сохранении перевозчика:', error);
      // Можно добавить setError('Сообщение об ошибке для пользователя')
    }
  };

  // --- Кнопки ---
  const handleImportClick = () => fileInputRef.current.click();
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setImportError('Пожалуйста, выберите файл Excel (.xlsx или .xls)');
      return;
    }
    setImportError(null);
    onImport(file);
    event.target.value = '';
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const columns = [
    { field: 'id', headerName: 'ID', minWidth: 50 },
    { field: 'company_name', headerName: 'Наименование компании', minWidth: 200 },
    { field: 'location', headerName: 'Расположение', minWidth: 150 },
    {
        field: 'contacts',
        headerName: 'Контакты',
        minWidth: 250,
        renderCell: ({ row }) => {
            // Проверяем наличие контактов и менеджеров
            const managerContacts = row.contacts?.manager;
            if (managerContacts && managerContacts.length > 0) {
                return managerContacts.map((contact, index) => (
                    <div key={index}>
                        {contact.name || '-'} ({contact.phone || '-'})
                    </div>
                ));
            }
            return '-';
        },
    },
    { field: 'working_directions', headerName: 'Направления', minWidth: 200 },
];


  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
        <Typography variant="h5" sx={{ flexShrink: 0 }}>Перевозчики</Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <TableFilters
            filters={[
              { name: 'company_name', label: 'Наименование компании', type: 'text' },
              { name: 'working_directions', label: 'Направления работы', type: 'text' },
              { name: 'location', label: 'Расположение', type: 'text' },
              // { name: 'manager_name', label: 'Менеджер', type: 'text' } // Пример, если нужно фильтровать по менеджеру
            ]}
            onApplyFilters={onApplyFilters}
            onClearFilters={() => onApplyFilters({})} // Сброс фильтров
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
          />
          <IconButton
            onClick={handleImportClick}
            size="small"
            title="Импорт"
          >
            <ImportIcon />
          </IconButton>
          <IconButton
            onClick={onExport}
            size="small"
            title="Экспорт"
          >
            <ExportIcon />
          </IconButton>
          <IconButton
            onClick={handleColorMenuOpen}
            color="primary"
            title="Раскрасить ячейки"
            size="small"
          >
            <ColorLensIcon />
          </IconButton>
          <IconButton
            color="primary"
            size="small"
            onClick={() => {
              setSelectedCarrier(null);
              setIsFormOpen(true);
            }}
            title="Добавить перевозчика"
          >
            <AddIcon />
          </IconButton>
        </Box>
      </Box>

      {importError && (
        <Box mb={2}><Alert severity="error">{importError}</Alert></Box>
      )}

       <DataTable
         ref={dataTableRef} // Передаем ref в DataTable
         data={carriers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)}
         columns={columns}
         loading={loading}
         error={error}
         onEdit={handleEditClick}
         onDelete={onDelete}
         onViewDetails={handleRowClick}
         tableContext="carriers" // Указываем контекст таблицы
       />

       <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={carriers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Строк на странице:"
        />

      <Popover
        id={isColorMenuOpen ? 'carrier-color-picker-popover' : undefined}
        open={isColorMenuOpen}
        anchorEl={colorAnchorEl}
        onClose={handleColorMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Выбор цвета:</Typography>
          <Stack direction="row" spacing={0.5} sx={{ mb: 1 }}>
            {predefinedColors.map((color, index) => (
              <Button
                key={color.value || `no-color-${index}`}
                variant="contained"
                onClick={() => handleSelectColor(index)}
                sx={{
                  minWidth: '28px',
                  width: '28px',
                  height: '28px',
                  padding: 0,
                  backgroundColor: color.value || '#ffffff',
                  border: currentColorIndex === index ? '2px solid black' : `2px solid ${color.value || '#eeeeee'}`,
                  boxShadow: currentColorIndex === index ? '0 0 5px rgba(0,0,0,0.5)' : 'none',
                  '&:hover': {
                    backgroundColor: color.value || '#ffffff',
                    opacity: 0.8,
                  },
                }}
                title={color.name}
              />
            ))}
          </Stack>
          <Button
            variant="contained"
            size="small"
            onClick={handleApplyColorClick}
            disabled={selectedCellsCount === 0}
          >
            Раскрасить ({selectedCellsCount})
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={handleClearColorClick}
            disabled={selectedCellsCount === 0}
          >
            Очистить цвет
          </Button>
        </Box>
      </Popover>

      {selectedCarrier && (
      <CarrierCard
        open={isCardOpen}
        onClose={handleCloseCard}
        carrier={selectedCarrier}
      />
      )}

      <Dialog 
        open={isFormOpen}
        onClose={handleCloseForm}
         maxWidth="md"
         fullWidth
      >
          <DialogTitle>{selectedCarrier ? 'Редактирование перевозчика' : 'Добавить перевозчика'}</DialogTitle>
          <DialogContent>
             <CarrierForm
                carrier={selectedCarrier}
        onSubmit={handleSubmitForm}
                onClose={handleCloseForm}
      />
          </DialogContent>
      </Dialog>
    </Box>
  );
};

export default CarrierList; 