import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  TablePagination,
  Alert,
  Menu,
  Popover,
  Stack,
  Paper,
  CircularProgress
} from '@mui/material';
import { 
  Add as AddIcon,
  ArrowDropDown as ArrowDropDownIcon,
  FileUpload as ImportIcon,
  FileDownload as ExportIcon,
  ColorLens as ColorLensIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import OrderForm from '../components/orders/OrderForm';
import DataTable from '../components/common/DataTable';
import OrderCard from '../components/orders/OrderCard';
import DocumentGenerator from '../components/orders/DocumentGenerator';
import { createCalendarTask } from '../api/calendar';
import { predefinedColors } from '../constants/colors';
import TableFilters from '../components/common/TableFilters';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [success, setSuccess] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isOrderCardOpen, setIsOrderCardOpen] = useState(false);
  const [selectedOrderForCard, setSelectedOrderForCard] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [orderForDoc, setOrderForDoc] = useState(null);
  const [colorAnchorEl, setColorAnchorEl] = useState(null);
  const dataTableRef = useRef(null);
  const [selectedCellsCount, setSelectedCellsCount] = useState(0);
  const [currentColorIndex, setCurrentColorIndex] = useState(-1);
  const navigate = useNavigate();
  const [statusAnchorEl, setStatusAnchorEl] = useState(null);
  const [selectedStatusType, setSelectedStatusType] = useState(null);

  // Стили для вкладок, чтобы они выглядели как кнопки
  const buttonLikeTabStyles = {
    border: '1px solid #ccc',
    padding: '5px 15px', 
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
    boxShadow: '0 3px 5px rgba(0, 0, 0, 0.15)',
    fontFamily: "'Tenor Sans', sans-serif",
    color: '#333', 
    textTransform: 'none',
    '&:hover': {
      backgroundColor: '#eee',
      boxShadow: '0 4px 7px rgba(0, 0, 0, 0.2)',
    },
    '&.Mui-selected': {
      backgroundColor: '#e0e0e0',
      boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)',
      color: 'black',
      borderRadius: '8px',
      border: '1px solid #ccc',
    },
    minHeight: 'auto', 
    minWidth: 'auto', 
  };

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders/');
      if (Array.isArray(response.data)) {
        setOrders(response.data);
      } else if (response.data && Array.isArray(response.data.results)) {
        setOrders(response.data.results);
      } else {
        setOrders([]);
        setError('Неверный формат данных заказов');
      }
    } catch (error) {
      console.error('Ошибка при загрузке заказов:', error);
      setError('Не удалось загрузить заказы');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      const response = await api.get('/clients/');
      if (response.data && Array.isArray(response.data.results)) {
        setClients(response.data.results);
      } else if (Array.isArray(response.data)) {
        setClients(response.data);
      } else {
        setClients([]);
        console.error('Неверный формат данных клиентов');
      }
    } catch (error) {
      console.error('Ошибка при загрузке клиентов:', error);
      setClients([]);
    }
  }, []);

  const fetchCarriers = useCallback(async () => {
    try {
      const response = await api.get('/carriers/');
      if (response.data && Array.isArray(response.data.results)) {
        setCarriers(response.data.results);
      } else if (Array.isArray(response.data)) {
        setCarriers(response.data);
      } else {
        setCarriers([]);
        console.error('Неверный формат данных перевозчиков');
      }
    } catch (error) {
      console.error('Ошибка при загрузке перевозчиков:', error);
      setCarriers([]);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchClients();
    fetchCarriers();
  }, [fetchOrders, fetchClients, fetchCarriers]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
        return 'rgba(2, 136, 209, 0.1)';
      case 'in_progress':
        return 'rgba(255, 152, 0, 0.1)';
      case 'completed':
        return 'rgba(76, 175, 80, 0.1)';
      case 'cancelled':
        return 'rgba(244, 67, 54, 0.1)';
      default:
        return 'inherit';
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'new':
        return 'info.main';
      case 'in_progress':
        return 'warning.main';
      case 'completed':
        return 'success.main';
      case 'cancelled':
        return 'error.main';
      default:
        return 'text.primary';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'new':
        return 'Новый';
      case 'in_progress':
        return 'В работе';
      case 'completed':
        return 'Завершен';
      case 'cancelled':
        return 'Отменен';
      default:
        return status;
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'rgba(76, 175, 80, 0.1)';
      case 'pending':
        return 'rgba(255, 152, 0, 0.1)';
      case 'unpaid':
        return 'rgba(244, 67, 54, 0.1)';
      default:
        return 'inherit';
    }
  };

  const getPaymentStatusTextColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success.main';
      case 'pending':
        return 'warning.main';
      case 'unpaid':
        return 'error.main';
      default:
        return 'text.primary';
    }
  };

  const getPaymentStatusLabel = (status) => {
    switch (status) {
      case 'paid':
        return 'Оплачено';
      case 'pending':
        return 'Ожидает оплаты';
      case 'unpaid':
        return 'Не оплачено';
      default:
        return status;
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedOrder(null);
    setIsEditMode(false);
    fetchOrders();
  };

  const handleEditOrder = async (order) => {
    try {
      const response = await api.get(`/orders/${order.id}/`);
      const orderData = response.data;
      
      setSelectedOrder(orderData);
      setIsEditMode(true);
      setDialogOpen(true);
    } catch (error) {
      console.error('Ошибка при получении данных заказа:', error);
      setError('Не удалось загрузить данные заказа');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот заказ?')) {
      try {
        await api.delete(`/orders/${orderId}/`);
        await fetchOrders();
      } catch (error) {
        console.error('Ошибка при удалении заказа:', error);
        setError('Не удалось удалить заказ');
      }
    }
  };

  const handleFormSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    setSuccess('');

    try {
      console.log('Данные для отправки (из формы):', formData);
      
      const payload = {
        ...formData,
        client: formData.client_id,
        carrier: formData.carrier_id
      };

      console.log('Данные для API:', payload);

      let createdOrderData = null;
      let orderResponse = null;

      if (isEditMode && selectedOrder) {
        orderResponse = await api.put(`/orders/${selectedOrder.id}/`, payload);
        createdOrderData = orderResponse.data;
        setSuccess('Заказ успешно обновлен.');
      } else {
        orderResponse = await api.post('/orders/', payload);
        createdOrderData = orderResponse.data;
        setSuccess('Заказ успешно создан.');

        // --- Создание задач в календаре после успешного создания заказа --- 
        if (createdOrderData && createdOrderData.id) {
          const orderId = createdOrderData.id;
          const clientName = clients.find(c => c.id === parseInt(formData.client_id))?.company_name || 'Неизвестный клиент';
          const carrierName = carriers.find(c => c.id === parseInt(formData.carrier_id))?.company_name || 'Неизвестный перевозчик';
          const route = `${formData.loading_address || '-'} -> ${formData.unloading_address || '-'}`;

          const baseTaskDescription = `Заказ: #${orderId}\nКлиент: ${clientName}\nПеревозчик: ${carrierName}\nМаршрут: ${route}`;
          const commonTaskData = {
            description: baseTaskDescription,
            priority: 'medium',
            assignee: formData.carrier_id || null, // Assignee может быть carrier_id
          };

          let taskSuccessMessages = [];
          let taskErrorMessages = [];

          // Задача на загрузку
          if (formData.loading_date) {
            try {
              await createCalendarTask({
                ...commonTaskData,
                title: `Загрузка: Заказ #${orderId}`,
                deadline: new Date(formData.loading_date).toISOString(),
              });
              taskSuccessMessages.push('Задача на загрузку создана.');
            } catch (taskError) {
              console.error('Не удалось создать задачу на загрузку:', taskError);
              taskErrorMessages.push('Ошибка создания задачи на загрузку.');
            }
          }

          // Задача на выгрузку
          if (formData.unloading_date) {
            try {
              await createCalendarTask({
                ...commonTaskData,
                title: `Выгрузка: Заказ #${orderId}`,
                deadline: new Date(formData.unloading_date).toISOString(),
              });
              taskSuccessMessages.push('Задача на выгрузку создана.');
            } catch (taskError) {
              console.error('Не удалось создать задачу на выгрузку:', taskError);
              taskErrorMessages.push('Ошибка создания задачи на выгрузку.');
            }
          }

          // Обновление сообщений об успехе/ошибке
          if (taskSuccessMessages.length > 0) {
            setSuccess(prev => `${prev} ${taskSuccessMessages.join(' ')}`);
          }
          if (taskErrorMessages.length > 0) {
            setError(prev => prev ? `${prev} ${taskErrorMessages.join(' ')}` : taskErrorMessages.join(' '));
          }
        }
        // --- Конец создания задач в календаре --- 
      }

      handleCloseDialog();
      fetchOrders();
    } catch (error) {
      console.error('Ошибка при сохранении заказа:', error);
      console.error('Ответ сервера:', error.response?.data);
      let errorMessage = 'Произошла ошибка при сохранении заказа';
      if (error.response?.data) {
        const errors = Object.entries(error.response.data).map(([key, value]) => {
            return `${key}: ${Array.isArray(value) ? value.join(', ') : value}`;
        }).join('; ');
        errorMessage = errors || errorMessage;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleDialogTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const filteredOrders = useMemo(() => {
    let currentOrders = orders;
    if (tabValue === 0) {
      currentOrders = orders.filter(order => ['new', 'cancelled'].includes(order.status));
    } else if (tabValue === 1) {
      currentOrders = orders.filter(order => ['in_progress', 'completed'].includes(order.status));
    }
    // Здесь можно будет добавить логику фильтрации, если TableFilters будет использоваться
    return currentOrders;
  }, [orders, tabValue /* , filters */]);

  const handleOpenStatusMenu = (event, orderId, statusType) => {
    setStatusAnchorEl(event.currentTarget);
    setSelectedOrderId(orderId);
    setSelectedStatusType(statusType);
  };

  const handleCloseStatusMenu = () => {
    setStatusAnchorEl(null);
    setSelectedOrderId(null);
    setSelectedStatusType(null);
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedOrderId || !selectedStatusType) return;

    try {
      const response = await api.get(`/orders/${selectedOrderId}/`);
      const currentOrder = response.data;
      
      const updatedOrder = {
        ...currentOrder,
        [selectedStatusType]: newStatus,
        client_id: currentOrder.client.id,
        carrier: currentOrder.carrier.id
      };
      delete updatedOrder.client;
      if (typeof updatedOrder.carrier === 'object' && updatedOrder.carrier !== null && updatedOrder.carrier.id) {
         updatedOrder.carrier = updatedOrder.carrier.id;
      } else if (typeof updatedOrder.carrier === 'object') {
         delete updatedOrder.carrier;
      }
      
      await api.put(`/orders/${selectedOrderId}/`, updatedOrder);
      await fetchOrders();
      setSuccess('Статус успешно обновлен');
      
      handleCloseStatusMenu();

      const timer = setTimeout(() => {
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    } catch (error) {
      console.error('Ошибка при обновлении статуса:', error);
      setError('Не удалось обновить статус');
      handleCloseStatusMenu();
    }
  };

  const statusOptions = {
    status: [
      { value: 'new', label: 'Новый' },
      { value: 'in_progress', label: 'В работе' },
      { value: 'completed', label: 'Завершен' },
      { value: 'cancelled', label: 'Отменен' }
    ],
    payment_status: [
      { value: 'paid', label: 'Оплачено' },
      { value: 'pending', label: 'Ожидает оплаты' }
    ]
  };

  const handleViewDetails = (orderId) => {
    const orderToShow = orders.find(order => order.id === orderId);
    if (orderToShow) {
      setSelectedOrderForCard(orderToShow);
      setIsOrderCardOpen(true);
    } else {
      console.error('Заказ для просмотра не найден:', orderId);
      setError('Не удалось найти заказ для просмотра.')
    }
  };

  const handleOpenDocModal = (order) => {
    setOrderForDoc(order);
    setDocModalOpen(true);
  };

  const handleCloseDocModal = () => {
    setDocModalOpen(false);
    setOrderForDoc(null);
  };

  const orderColumns = [
    { field: 'id', headerName: 'ID', minWidth: 50 },
    {
      field: 'client',
      headerName: 'Клиент',
      minWidth: 150,
      renderCell: ({ row }) => row.client?.company_name || 'Не указан',
    },
    {
      field: 'status',
      headerName: 'Статус',
      minWidth: 150,
      renderCell: ({ row }) => (
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            width: '100%',
            height: '100%',
            backgroundColor: getStatusColor(row.status),
            padding: '4px 8px',
            borderRadius: '4px'
          }}
        >
          <Typography 
            variant="body2" 
            sx={{ 
              color: getStatusTextColor(row.status),
              flexGrow: 1
            }}
          >
            {getStatusLabel(row.status)}
          </Typography>
          <Box
            onClick={(e) => handleOpenStatusMenu(e, row.id, 'status')}
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                borderRadius: '4px'
              }
            }}
          >
            <ArrowDropDownIcon 
              fontSize="small" 
              sx={{ color: getStatusTextColor(row.status) }}
            />
          </Box>
        </Box>
      ),
    },
    {
      field: 'loadingDate',
      headerName: 'Дата загрузки',
      minWidth: 120,
      renderCell: ({ row }) => row.loading_date ? new Date(row.loading_date).toLocaleDateString() : '-',
    },
    {
      field: 'deliveryDeadline',
      headerName: 'Срок доставки',
      minWidth: 120,
      renderCell: ({ row }) => row.delivery_deadline ? new Date(row.delivery_deadline).toLocaleDateString() : '-',
    },
    {
      field: 'totalPrice',
      headerName: 'Сумма',
      minWidth: 100,
      renderCell: ({ row }) => row.total_price ? `${row.total_price} ₽` : '-',
    },
    {
      field: 'paymentStatus',
      headerName: 'Статус оплаты',
      minWidth: 120,
      renderCell: ({ row }) => (
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            width: '100%',
            height: '100%',
            backgroundColor: getPaymentStatusColor(row.payment_status),
            padding: '4px 8px',
            borderRadius: '4px'
          }}
        >
          <Typography 
            variant="body2" 
            sx={{ 
              color: getPaymentStatusTextColor(row.payment_status),
              flexGrow: 1
            }}
          >
            {getPaymentStatusLabel(row.payment_status)}
          </Typography>
          <Box
            onClick={(e) => handleOpenStatusMenu(e, row.id, 'payment_status')}
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                borderRadius: '4px'
              }
            }}
          >
            <ArrowDropDownIcon 
              fontSize="small" 
              sx={{ color: getPaymentStatusTextColor(row.payment_status) }}
            />
          </Box>
        </Box>
      ),
    },
  ];

  const handleEditClick = (orderId) => {
    const orderToEdit = orders.find(order => order.id === orderId);
    if (orderToEdit) {
      handleEditOrder(orderToEdit);
    } else {
      console.error('Заказ для редактирования не найден:', orderId);
      setError('Не удалось найти заказ для редактирования.')
    }
  };

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

  const handleSelectColor = (index) => {
    if (dataTableRef.current) {
        dataTableRef.current.setCurrentColorIndex(index);
        setCurrentColorIndex(index);
    }
  };

  const handleApplyColorClick = () => {
    if (dataTableRef.current) {
      dataTableRef.current.handleApplyColor();
      setSelectedCellsCount(0);
    }
    handleColorMenuClose();
  };

  const handleClearColorClick = () => {
    if (dataTableRef.current) {
      dataTableRef.current.clearRowColor();
    }
    setSuccess('Цвет строк сброшен.');
    handleColorMenuClose();
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 200px)' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ pt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h1">
          Заказы
        </Typography>
        <Stack direction="row" spacing={1}>
          <IconButton
            title="Фильтры"
            onClick={() => console.log('Filters clicked')}
            size="small"
          >
            <FilterListIcon />
          </IconButton>
          <IconButton
            title="Импорт"
            onClick={() => console.log('Import clicked')}
            size="small"
          >
            <ImportIcon />
          </IconButton>
          <IconButton
            title="Экспорт"
            onClick={() => console.log('Export clicked')}
            size="small"
          >
            <ExportIcon />
          </IconButton>
          <IconButton
            title="Раскрасить ячейки"
            onClick={handleColorMenuOpen}
            size="small"
            color="primary"
          >
            <ColorLensIcon />
          </IconButton>
          <IconButton 
            title="Добавить заказ"
            onClick={() => {
              setSelectedOrder(null);
              setIsEditMode(false);
              setDialogOpen(true);
            }}
            size="small"
            color="primary"
          >
            <AddIcon />
          </IconButton>
        </Stack>
      </Box>

      {/* Сообщение об ошибке */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Сообщение об успехе */}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Box sx={{ borderBottom: 0, borderColor: 'divider', mb: 2 }}> {/* Убрана граница снизу для Tabs */}
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="Статусы заказов"
          sx={{
            mb: 2,
            '& .MuiTabs-indicator': { display: 'none' }, // Скрываем стандартный индикатор
            '& .MuiTabs-flexContainer': {
              // gap: '10px', // Можно использовать gap, если marginRight на Tab не подходит
            }
          }}
        >
          <Tab label="Новые и отмененные" sx={buttonLikeTabStyles} />
          <Tab label="В процессе и выполненные" sx={buttonLikeTabStyles} />
        </Tabs>
      </Box>

      {/* <TableFilters onApplyFilters={handleApplyFilters} /> */}

      <Paper 
        className="MuiTableContainer-root css-24tvrc-MuiPaper-root-MuiTableContainer-root" 
        sx={{
          width: '100%', 
          overflow: 'hidden', 
          boxShadow: 'none', // Убираем тень
          backgroundColor: 'transparent', // Убираем фон
          border: 'none', // Убираем границы
          pl:0, pr:0 
        }}
      >
        <DataTable
          data={filteredOrders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)}
          columns={orderColumns}
          loading={loading}
          error={error}
          onEdit={handleEditClick}
          onDelete={handleDeleteOrder}
          onViewDetails={handleViewDetails}
          onGenerateDocument={handleOpenDocModal}
          tableContext="orders"
          ref={dataTableRef}
        />
      </Paper>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredOrders.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Строк на странице:"
      />

      <Menu
        anchorEl={statusAnchorEl}
        open={Boolean(statusAnchorEl)}
        onClose={handleCloseStatusMenu}
      >
        {selectedStatusType && statusOptions[selectedStatusType].map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => handleStatusChange(option.value)}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {isEditMode ? 'Редактирование заказа' : 'Создание заказа'}
        </DialogTitle>
        <DialogContent>
          <OrderForm
            open={dialogOpen}
            onClose={handleCloseDialog}
            onSubmit={handleFormSubmit}
            order={selectedOrder}
            clients={clients}
            carriers={carriers}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={docModalOpen}
        onClose={handleCloseDocModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Генерация документов для заказа #{orderForDoc?.id}</DialogTitle>
        <DialogContent>
          {orderForDoc && <DocumentGenerator order={orderForDoc} />}
        </DialogContent>
      </Dialog>

      {isOrderCardOpen && (
        <OrderCard
          open={isOrderCardOpen}
          onClose={() => setIsOrderCardOpen(false)}
          order={selectedOrderForCard}
        />
      )}

      <Popover
        id={isColorMenuOpen ? 'order-color-picker-popover' : undefined}
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
    </Container>
  );
};

export default OrdersPage; 