import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  IconButton,
  Popover,
  Stack,
  TablePagination
} from '@mui/material';
import {
  Add as AddIcon,
  FileDownload as ExportIcon,
  FileUpload as ImportIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ColorLens as ColorLensIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import ClientCard from './ClientCard';
import ClientForm from './ClientForm';
import DataTable from '../common/DataTable';
import TableFilters from '../common/TableFilters';
import { clientsApi } from '../../api/api';
import { predefinedColors } from '../../constants/colors';

const ClientList = ({ onDelete, onAdd, onExport, onImport, onApplyFilters, loading, error, onBulkDelete }) => {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [importError, setImportError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const fileInputRef = useRef(null);

  // --- Состояние для Popover выбора цвета ---
  const [colorAnchorEl, setColorAnchorEl] = useState(null);
  const dataTableRef = useRef(null);
  const [selectedCellsCount, setSelectedCellsCount] = useState(0);
  const [currentColorIndex, setCurrentColorIndex] = useState(0);

  // --- Обработчики для Popover ---
  const handleColorMenuOpen = (event) => {
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
        setCurrentColorIndex(index);
    }
  };

  const handleApplyColorClick = () => {
    console.log('[ClientList] handleApplyColorClick triggered');
    if (dataTableRef.current) {
      dataTableRef.current.handleApplyColor();
      setSelectedCellsCount(0);
    }
    handleColorMenuClose();
  };

  const handleClearColorClick = () => {
    console.log('[ClientList] handleClearColorClick triggered');
    if (dataTableRef.current) {
      dataTableRef.current.handleClearColor();
       setSelectedCellsCount(0);
    }
    handleColorMenuClose();
  };
   // --- Конец обработчиков кнопок ---

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await clientsApi.getAll();
      if (response.data && Array.isArray(response.data)) {
        setClients(response.data);
      } else if (response.data && Array.isArray(response.data.results)) {
        setClients(response.data.results);
      } else if (response.data && typeof response.data === 'object') {
        setClients(Object.values(response.data));
      }
    } catch (error) {
      console.error('Ошибка при загрузке клиентов:', error);
    }
  };

  const handleRowClick = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    setSelectedClient(client);
    setIsCardOpen(true);
  };

  const handleEditClick = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setSelectedClient(client);
      setIsFormOpen(true);
    } else {
      console.error('Client not found for editing:', clientId);
    }
  };

  const handleCloseCard = () => {
    setIsCardOpen(false);
    setSelectedClient(null);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedClient(null);
  };

  const handleSubmitForm = async (formData) => {
    try {
      if (selectedClient) {
        await clientsApi.update(selectedClient.id, formData);
      } else {
        await clientsApi.create(formData);
      }
      await fetchClients();
      handleCloseForm();
    } catch (error) {
      console.error('Ошибка при сохранении клиента:', error);
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

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
        <Typography variant="h5" sx={{ flexShrink: 0 }}>Клиенты</Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <TableFilters
            filters={[
              { name: 'company_name', label: 'Наименование компании', type: 'text' },
              { name: 'business_scope', label: 'Сфера деятельности', type: 'text' },
              { name: 'unp', label: 'УНП', type: 'text' }
            ]}
            onApplyFilters={onApplyFilters}
            onClearFilters={() => onApplyFilters({})}
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
              setSelectedClient(null);
              setIsFormOpen(true);
            }}
            title="Добавить клиента"
          >
            <AddIcon />
          </IconButton>
        </Box>
      </Box>

      {importError && (
        <Box mb={2}><Alert severity="error">{importError}</Alert></Box>
      )}

      <Popover
        id={isColorMenuOpen ? 'color-picker-popover' : undefined}
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

      <DataTable
        ref={dataTableRef}
        data={clients.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)}
        columns={[
          { field: 'company_name', headerName: 'Наименование компании', minWidth: 200 },
          { field: 'business_scope', headerName: 'Сфера деятельности', minWidth: 200 },
          { field: 'address', headerName: 'Адрес', minWidth: 200 },
          { field: 'unp', headerName: 'УНП', minWidth: 120 },
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
        ]}
        onEdit={handleEditClick}
        onDelete={onDelete}
        onViewDetails={handleRowClick}
        loading={loading}
        error={error}
        tableContext="clients"
        onBulkDelete={onBulkDelete}
      />

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={clients.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Строк на странице:"
      />

      <ClientCard
        open={isCardOpen}
        onClose={handleCloseCard}
        client={selectedClient}
      />

      <ClientForm
        open={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmitForm}
        client={selectedClient}
      />
    </Box>
  );
};

export default ClientList; 