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
  Menu,
  MenuItem,
  Checkbox,
  Link,
  Select,
  FormControl
} from '@mui/material';
import {
  Add as AddIcon,
  FileDownload as ExportIcon,
  FileUpload as ImportIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ColorLens as ColorLensIcon,
  Visibility as VisibilityIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import ClientCard from './ClientCard';
import ClientForm from './ClientForm';
import DataTable from '../common/DataTable';
import TableFilters from '../common/TableFilters';
import { clientsApi } from '../../api/api';
import { predefinedColors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { useEmail } from '../../contexts/EmailContext';
import api from '../../api/api';

const ClientList = ({ onDelete, onAdd, onExport, onImport, onApplyFilters, loading, error, onBulkDelete }) => {
  const { user } = useAuth();
  const { openComposeModal } = useEmail();
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

  const [columnsAnchorEl, setColumnsAnchorEl] = useState(null);
  const defaultVisibility = {
    company_name: true,
    business_scope: true,
    address: true,
    unp: true,
    bank_details: false,
    unn: false,
    okpo: false,
    comments: false,
    contacts: true,
    has_active_order: true,
    created_at: false,
    updated_at: false,
    created_by: true,
  };
  const [columnVisibility, setColumnVisibility] = useState(() => {
    const saved = localStorage.getItem('client_columns_visibility');
    return saved ? JSON.parse(saved) : defaultVisibility;
  });

  const handleOpenColumnsMenu = (e) => setColumnsAnchorEl(e.currentTarget);
  const handleCloseColumnsMenu = () => setColumnsAnchorEl(null);
  const handleToggleColumn = (field) => {
    setColumnVisibility((prev) => {
      const updated = { ...prev, [field]: !prev[field] };
      localStorage.setItem('client_columns_visibility', JSON.stringify(updated));
      return updated;
    });
  };

  const [usersList, setUsersList] = useState([]);
  useEffect(()=>{ if(user?.role==='admin'){ api.get('/users/').then(r=>{ const arr=Array.isArray(r.data)?r.data:r.data.results||[]; setUsersList(arr);});}},[user]);
  const handleReassign = async (rowId,newUserId)=>{ try{ await api.patch(`/clients/${rowId}/`,{created_by_id:newUserId}); fetchClients();}catch(e){console.error('Reassign error',e);} };

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
            onClick={handleOpenColumnsMenu}
            color="primary"
            title="Настроить колонки"
            size="small"
          >
            <SettingsIcon />
          </IconButton>
          <Menu
            anchorEl={columnsAnchorEl}
            open={Boolean(columnsAnchorEl)}
            onClose={handleCloseColumnsMenu}
          >
            {Object.keys(defaultVisibility).map((field) => {
              if (field === 'created_by' && user?.role !== 'admin') return null;
              const labels = {
                company_name: 'Наименование компании',
                business_scope: 'Сфера деятельности',
                address: 'Адрес',
                unp: 'УНП',
                bank_details: 'Банковские реквизиты',
                unn: 'УНН',
                okpo: 'ОКПО',
                comments: 'Комментарии',
                contacts: 'Контакты',
                has_active_order: 'Есть активные заказы',
                created_at: 'Создан',
                updated_at: 'Обновлён',
                created_by: 'Создатель',
              };
              return (
                <MenuItem key={field} onClick={() => handleToggleColumn(field)}>
                  <Checkbox checked={columnVisibility[field]} size="small" />
                  {labels[field] || field}
                </MenuItem>
              );
            })}
          </Menu>
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
          ...(columnVisibility.company_name ? [{ field: 'company_name', headerName: 'Наименование компании', minWidth: 200 }] : []),
          ...(columnVisibility.business_scope ? [{ field: 'business_scope', headerName: 'Сфера деятельности', minWidth: 200 }] : []),
          ...(columnVisibility.address ? [{ field: 'address', headerName: 'Адрес', minWidth: 200 }] : []),
          ...(columnVisibility.unp ? [{ field: 'unp', headerName: 'УНП', minWidth: 120 }] : []),
          ...(columnVisibility.bank_details ? [{ field: 'bank_details', headerName: 'Банковские реквизиты', minWidth: 200 }] : []),
          ...(columnVisibility.unn ? [{ field: 'unn', headerName: 'УНН', minWidth: 140 }] : []),
          ...(columnVisibility.okpo ? [{ field: 'okpo', headerName: 'ОКПО', minWidth: 140 }] : []),
          ...(columnVisibility.comments ? [{ field: 'comments', headerName: 'Комментарии', minWidth: 200 }] : []),
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
          ...(columnVisibility.has_active_order ? [{ field: 'has_active_order', headerName: 'Активные заказы', minWidth: 160, renderCell: ({ row }) => row.has_active_order ? 'Да' : 'Нет' }] : []),
          ...(columnVisibility.created_at ? [{ field: 'created_at', headerName: 'Создан', minWidth: 160 }] : []),
          ...(columnVisibility.updated_at ? [{ field: 'updated_at', headerName: 'Обновлён', minWidth: 160 }] : []),
          ...(user?.role === 'admin' && columnVisibility.created_by ? [{
            field: 'created_by',
            headerName: 'Назначено',
            minWidth: 170,
            renderCell: ({ row }) => (
              <FormControl size="small" fullWidth>
                <Select
                  value={row.created_by?.id || ''}
                  renderValue={(selected)=>{
                    const u=usersList.find(x=>x.id===selected);
                    return u?`${u.first_name || ''} ${u.last_name || ''}`.trim()||u.email:'-';
                  }}
                  onClick={(e)=>e.stopPropagation()}
                  onChange={(e)=>handleReassign(row.id,e.target.value)}
                >
                  {usersList.map(u=><MenuItem key={u.id} value={u.id}>{`${u.first_name || ''} ${u.last_name || ''}`.trim()||u.email}</MenuItem>)}
                </Select>
              </FormControl>
            ),
          }] : user?.role!=='admin' && columnVisibility.created_by ? [{
            field:'created_by',headerName:'Назначено',minWidth:170,renderCell:({row})=>row.created_by?(`${row.created_by.first_name||''} ${row.created_by.last_name||''}`.trim()||row.created_by.email):'-'
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