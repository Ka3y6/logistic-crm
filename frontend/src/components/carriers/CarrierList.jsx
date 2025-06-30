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
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import CarrierCard from './CarrierCard';
import CarrierForm from './CarrierForm';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import DataTable from '../common/DataTable';
import TableFilters from '../common/TableFilters';
import { carriersApi } from '../../api/api';
import { predefinedColors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { useEmail } from '../../contexts/EmailContext';
import Link from '@mui/material/Link';
import api from '../../api/api';

const CarrierList = ({ carriers, onDelete, onAdd, onExport, onImport, onApplyFilters, loading, error, fetchCarriers, onBulkDelete }) => {
  const { user } = useAuth();
  const { openComposeModal } = useEmail();
  const [selectedCarrier, setSelectedCarrier] = useState(null);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [importError, setImportError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const fileInputRef = React.useRef(null);
  const [usersList, setUsersList] = useState([]);

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

  const [columnsAnchorEl, setColumnsAnchorEl] = useState(null);

  const defaultVisibility = {
    company_name: true,
    working_directions: true,
    location: true,
    fleet: true,
    vehicle_number: true,
    contacts: true,
    comments: false,
    known_rates: false,
    created_by: true,
  };

  const [columnVisibility, setColumnVisibility] = useState(() => {
    const saved = localStorage.getItem('carrier_columns_visibility');
    const parsed = saved ? JSON.parse(saved) : {};
    return { ...defaultVisibility, ...parsed };
  });

  const handleOpenColumnsMenu = (e) => setColumnsAnchorEl(e.currentTarget);
  const handleCloseColumnsMenu = () => setColumnsAnchorEl(null);
  const handleToggleColumn = (field) => {
    setColumnVisibility((prev) => {
      const updated = { ...prev, [field]: !prev[field] };
      localStorage.setItem('carrier_columns_visibility', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      api.get('/users/').then(res => {
        const arr = Array.isArray(res.data) ? res.data : res.data.results || [];
        setUsersList(arr);
      }).catch(() => {});
    }
  }, [user]);

  const handleReassign = async (carrierId, newUserId) => {
    try {
      await api.patch(`/carriers/${carrierId}/`, { created_by_id: newUserId });
      if (fetchCarriers) fetchCarriers();
    } catch (e) {
      console.error('Ошибка переназначения', e);
    }
  };

  const columns = [
    ...(columnVisibility.company_name ? [{ field: 'company_name', headerName: 'Наименование', minWidth: 200 }] : []),
    ...(columnVisibility.working_directions ? [{ field: 'working_directions', headerName: 'Направления', minWidth: 200 }] : []),
    ...(columnVisibility.location ? [{ field: 'location', headerName: 'Местоположение', minWidth: 150 }] : []),
    ...(columnVisibility.fleet ? [{ field: 'fleet', headerName: 'Автопарк', minWidth: 150 }] : []),
    ...(columnVisibility.contacts ? [{
      field: 'contacts',
      headerName: 'Контакты',
      minWidth: 200,
      renderCell: ({ row }) => {
        const contact = row.contacts?.manager?.[0] || row.contacts?.director?.[0];
        if (!contact) return '-';
        return (
          <Box sx={{ display:'flex', flexDirection:'column' }}>
            {contact.name && <span>{contact.name}</span>}
            {contact.phone && <span>{contact.phone}</span>}
            {contact.email && (
              <Link component="button" onClick={(e)=>{e.stopPropagation();openComposeModal({to: contact.email});}} underline="hover">
                {contact.email}
              </Link>
            )}
          </Box>
        );
      }
    }] : []),
    ...(columnVisibility.comments ? [{ field: 'comments', headerName: 'Комментарии', minWidth: 200 }] : []),
    ...(columnVisibility.known_rates ? [{ field: 'known_rates', headerName: 'Известные тарифы', minWidth: 200 }] : []),
    ...(columnVisibility.vehicle_number ? [{ field: 'vehicle_number', headerName: 'Номер ТС', minWidth: 120 }] : []),
    ...(user?.role === 'admin' && columnVisibility.created_by ? [{
      field: 'created_by',
      headerName: 'Назначено',
      minWidth: 170,
      renderCell: ({ row }) => (
        <FormControl size="small" fullWidth onClick={(e)=>e.stopPropagation()}>
          <Select
            value={row.created_by?.id || ''}
            onChange={(e)=>handleReassign(row.id, e.target.value)}
          >
            {usersList.map(u => <MenuItem key={u.id} value={u.id}>{u.email}</MenuItem>)}
          </Select>
        </FormControl>
      ),
    }] : user?.role!=='admin' && columnVisibility.created_by ? [{
      field:'created_by', headerName:'Назначено', minWidth:170, renderCell:({row})=>row.created_by?row.created_by.email:'-'
    }]: []),
    {
      field: 'actions',
      headerName: 'Действия',
      minWidth: 120,
      renderCell: ({ row }) => (
        <Box display="flex" gap={1}>
          <IconButton
            size="small"
            onClick={() => handleRowClick(row.id)}
            title="Просмотр"
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleEditClick(row.id)}
            title="Редактировать"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onDelete(row.id)}
            title="Удалить"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    }
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
          <IconButton
            onClick={handleOpenColumnsMenu}
            color="primary"
            title="Настройки столбцов"
            size="small"
          >
            <SettingsIcon />
          </IconButton>
        </Box>
      </Box>

      {importError && (
        <Box mb={2}><Alert severity="error">{importError}</Alert></Box>
      )}

       <DataTable
         ref={dataTableRef}
         data={carriers}
         columns={columns}
         loading={loading}
         error={error}
         onBulkDelete={onBulkDelete}
         tableContext="carriers"
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

      <Menu
        anchorEl={columnsAnchorEl}
        open={Boolean(columnsAnchorEl)}
        onClose={handleCloseColumnsMenu}
      >
        {Object.keys(defaultVisibility).map((field) => {
          const visible = columnVisibility[field];
          if (field === 'created_by' && user?.role !== 'admin') return null;
          const labels = {
            company_name: 'Наименование',
            working_directions: 'Направления',
            location: 'Местоположение',
            fleet: 'Автопарк',
            vehicle_number: 'Номер ТС',
            contacts: 'Контакты',
            comments: 'Комментарии',
            known_rates: 'Известные тарифы',
            created_by: 'Создатель',
          };
          return (
            <MenuItem key={field} onClick={() => handleToggleColumn(field)}>
              <Checkbox checked={visible} size="small" />
              {labels[field] || field}
            </MenuItem>
          );
        })}
      </Menu>
    </Box>
  );
};

export default CarrierList; 