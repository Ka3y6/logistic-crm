import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Checkbox,
  TablePagination,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import api from '../../api/api';
import OrderForm from '../orders/OrderForm';
import { isValid } from 'date-fns';

const UserOrdersView = ({ userId }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState([]);
  const [statusAnchorEl, setStatusAnchorEl] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [carriers, setCarriers] = useState([]);

  useEffect(() => {
    console.log('=== UserOrdersView mounted ===');
    console.log('userId:', userId);
    fetchOrders();
    fetchClients();
    fetchCarriers();
  }, [userId]);

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients/');
      setClients(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const fetchCarriers = async () => {
    try {
      const response = await api.get('/carriers/');
      setCarriers(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching carriers:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      console.log('Fetching orders for user:', userId);
      const response = await api.get(`/orders/?created_by=${userId}`);
      console.log('Orders response:', response.data);
      
      if (Array.isArray(response.data)) {
        setOrders(response.data);
      } else if (response.data && Array.isArray(response.data.results)) {
        setOrders(response.data.results);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Не удалось загрузить заказы');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    console.log('=== Tab Changed in UserOrdersView ===');
    console.log('New tab value:', newValue);
    setActiveTab(newValue);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = orders.map((n) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    setSelected(newSelected);
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  const filteredOrders = orders.filter(order => {
    if (activeTab === 0) {
      return order.status === 'new';
    } else {
      return order.status === 'in_progress';
    }
  });

  const handleStatusClick = (event, order) => {
    setStatusAnchorEl(event.currentTarget);
    setSelectedOrder(order);
  };

  const handleStatusClose = () => {
    setStatusAnchorEl(null);
    setSelectedOrder(null);
  };

  const handleStatusChange = async (newStatus) => {
    if (selectedOrder) {
      try {
        await api.patch(`/orders/${selectedOrder.id}/`, { status: newStatus });
        await fetchOrders();
      } catch (err) {
        console.error('Error updating order status:', err);
        setError('Не удалось обновить статус заказа');
      }
    }
    handleStatusClose();
  };

  const handleViewClick = (order) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };

  const handleEditClick = (order) => {
    setSelectedOrder(order);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = async (order) => {
    if (window.confirm('Вы уверены, что хотите удалить этот заказ?')) {
      try {
        await api.delete(`/orders/${order.id}/`);
        await fetchOrders();
      } catch (err) {
        console.error('Error deleting order:', err);
        setError('Не удалось удалить заказ');
      }
    }
  };

  const handleEditSubmit = async (formData) => {
    try {
      await api.patch(`/orders/${selectedOrder.id}/`, formData);
      await fetchOrders();
      setIsEditDialogOpen(false);
    } catch (err) {
      console.error('Error updating order:', err);
      setError('Не удалось обновить заказ');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return isValid(date) ? date.toLocaleDateString() : '-';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (orders.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          У пользователя пока нет заказов
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Новые" />
          <Tab label="В работе" />
        </Tabs>
      </Box>

      <Box sx={{ width: '100%' }}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < filteredOrders.length}
                    checked={filteredOrders.length > 0 && selected.length === filteredOrders.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
                <TableCell 
                  sx={{ 
                    minWidth: 150, 
                    backgroundColor: 'rgb(245, 245, 245)', 
                    fontWeight: 'bold',
                    borderBottom: '2px solid rgb(224, 224, 224)',
                    borderRight: '1px solid rgb(224, 224, 224)',
                    padding: '12px 16px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  Клиент
                </TableCell>
                <TableCell 
                  sx={{ 
                    minWidth: 150, 
                    backgroundColor: 'rgb(245, 245, 245)', 
                    fontWeight: 'bold',
                    borderBottom: '2px solid rgb(224, 224, 224)',
                    borderRight: '1px solid rgb(224, 224, 224)',
                    padding: '12px 16px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  Статус
                </TableCell>
                <TableCell 
                  sx={{ 
                    minWidth: 120, 
                    backgroundColor: 'rgb(245, 245, 245)', 
                    fontWeight: 'bold',
                    borderBottom: '2px solid rgb(224, 224, 224)',
                    borderRight: '1px solid rgb(224, 224, 224)',
                    padding: '12px 16px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  Дата загрузки
                </TableCell>
                <TableCell 
                  sx={{ 
                    minWidth: 120, 
                    backgroundColor: 'rgb(245, 245, 245)', 
                    fontWeight: 'bold',
                    borderBottom: '2px solid rgb(224, 224, 224)',
                    borderRight: '1px solid rgb(224, 224, 224)',
                    padding: '12px 16px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  Срок доставки
                </TableCell>
                <TableCell 
                  sx={{ 
                    minWidth: 100, 
                    backgroundColor: 'rgb(245, 245, 245)', 
                    fontWeight: 'bold',
                    borderBottom: '2px solid rgb(224, 224, 224)',
                    borderRight: '1px solid rgb(224, 224, 224)',
                    padding: '12px 16px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  Сумма
                </TableCell>
                <TableCell 
                  sx={{ 
                    minWidth: 120, 
                    backgroundColor: 'rgb(245, 245, 245)', 
                    fontWeight: 'bold',
                    borderBottom: '2px solid rgb(224, 224, 224)',
                    borderRight: '1px solid rgb(224, 224, 224)',
                    padding: '12px 16px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  Статус оплаты
                </TableCell>
                <TableCell 
                  sx={{ 
                    minWidth: 120, 
                    backgroundColor: 'rgb(245, 245, 245)', 
                    fontWeight: 'bold',
                    borderBottom: '2px solid rgb(224, 224, 224)',
                    borderRight: '1px solid rgb(224, 224, 224)',
                    padding: '12px 16px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  Действия
                </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
              {filteredOrders
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((order) => {
                  const isItemSelected = isSelected(order.id);
                  return (
                    <TableRow
                      hover
                      onClick={(event) => handleClick(event, order.id)}
                      role="checkbox"
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      key={order.id}
                      selected={isItemSelected}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox checked={isItemSelected} />
                      </TableCell>
                      <TableCell>{order.client?.company_name || '-'}</TableCell>
                      <TableCell>
                        <Box 
                          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                          onClick={(e) => handleStatusClick(e, order)}
                        >
                          <Typography variant="body2">
                            {order.status === 'new' ? 'Новый' : 'В работе'}
                          </Typography>
                          <ArrowDropDownIcon fontSize="small" />
                        </Box>
                      </TableCell>
                      <TableCell>
                        {formatDate(order.loading_date)}
                      </TableCell>
                      <TableCell>
                        {formatDate(order.delivery_date)}
                      </TableCell>
                      <TableCell>{order.total_amount || '-'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2">
                            {order.payment_status === 'paid' ? 'Оплачено' : 'Не оплачено'}
                          </Typography>
                          <ArrowDropDownIcon fontSize="small" />
                        </Box>
                      </TableCell>
                    <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton 
                            size="small" 
                            title="Просмотр"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewClick(order);
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            title="Редактировать"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(order);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            title="Удалить"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(order);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
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
      </Box>

      <Menu
        anchorEl={statusAnchorEl}
        open={Boolean(statusAnchorEl)}
        onClose={handleStatusClose}
      >
        <MenuItem onClick={() => handleStatusChange('new')}>Новый</MenuItem>
        <MenuItem onClick={() => handleStatusChange('in_progress')}>В работе</MenuItem>
      </Menu>

      <Dialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Редактирование заказа</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <OrderForm
              order={selectedOrder}
              clients={clients}
              carriers={carriers}
              onSubmit={handleEditSubmit}
              onCancel={() => setIsEditDialogOpen(false)}
              isEdit={true}
              preserveCreatedBy={true}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Просмотр заказа #{selectedOrder?.id}
            </Typography>
            <IconButton onClick={() => setIsViewDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {selectedOrder && (
            <Box sx={{ p: 2 }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
                  <Tab label="Перевозчик" />
                  <Tab label="Клиент" />
                  <Tab label="Документы и реквизиты" />
                  <Tab label="Параметры груза" />
                  <Tab label="Финансы" />
                  <Tab label="Перевозчик и логистика" />
                  <Tab label="Сроки" />
                  <Tab label="Контакты и адреса" />
                  <Tab label="Документы" />
                </Tabs>
              </Box>

              <Box sx={{ mt: 2 }}>
                {activeTab === 0 && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Перевозчик:</strong> {selectedOrder.carrier?.company_name}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>ИНН:</strong> {selectedOrder.carrier?.inn}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>КПП:</strong> {selectedOrder.carrier?.kpp}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>ОГРН:</strong> {selectedOrder.carrier?.ogrn}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Юридический адрес:</strong> {selectedOrder.carrier?.legal_address}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Фактический адрес:</strong> {selectedOrder.carrier?.actual_address}
                      </Typography>
                    </Grid>
                  </Grid>
                )}

                {activeTab === 1 && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Клиент:</strong> {selectedOrder.client?.company_name}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>ИНН:</strong> {selectedOrder.client?.inn}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>КПП:</strong> {selectedOrder.client?.kpp}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>ОГРН:</strong> {selectedOrder.client?.ogrn}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Юридический адрес:</strong> {selectedOrder.client?.legal_address}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Фактический адрес:</strong> {selectedOrder.client?.actual_address}
                      </Typography>
                    </Grid>
                  </Grid>
                )}

                {activeTab === 2 && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Номер счета на оплату:</strong> {selectedOrder.invoice_number}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Дата составления счета:</strong> {formatDate(selectedOrder.invoice_date)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Номер акта выполненных работ:</strong> {selectedOrder.act_number}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Дата составления акта:</strong> {formatDate(selectedOrder.act_date)}
                      </Typography>
                    </Grid>
                  </Grid>
                )}

                {activeTab === 3 && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Количество единиц груза:</strong> {selectedOrder.cargo_quantity}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Наименование груза:</strong> {selectedOrder.cargo_name}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Код ТНВЭД:</strong> {selectedOrder.tnved_code}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Опасность груза:</strong> {selectedOrder.cargo_danger}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Вес брутто (кг):</strong> {selectedOrder.cargo_weight}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Габариты груза:</strong> {selectedOrder.cargo_dimensions}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Объем груза (м³):</strong> {selectedOrder.cargo_volume}
                      </Typography>
                    </Grid>
                  </Grid>
                )}

                {activeTab === 4 && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Валюта расчетов:</strong> {selectedOrder.payment_currency}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Срок оплаты счетов:</strong> {selectedOrder.payment_term}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Сумма за простой транспорта:</strong> {selectedOrder.demurrage_amount}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Цена в долларах:</strong> {selectedOrder.price_usd}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Общая стоимость услуг:</strong> {selectedOrder.total_service_cost}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Статус оплаты:</strong> {selectedOrder.payment_status === 'paid' ? 'Оплачено' : 'Не оплачено'}
                      </Typography>
                    </Grid>
                  </Grid>
                )}

                {activeTab === 5 && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Дата загрузки:</strong> {formatDate(selectedOrder.loading_date)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Дата отправки:</strong> {formatDate(selectedOrder.departure_date)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Дата выгрузки:</strong> {formatDate(selectedOrder.unloading_date)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Дата заключения договора:</strong> {formatDate(selectedOrder.contract_date)}
                      </Typography>
                    </Grid>
                  </Grid>
                )}

                {activeTab === 6 && (
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Адрес грузоотправителя:</strong> {selectedOrder.shipper_address}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Контактные данные грузоотправителя:</strong> {selectedOrder.shipper_contacts}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>ОКПО грузополучателя:</strong> {selectedOrder.consignee_okpo}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Адрес загрузки:</strong> {selectedOrder.loading_address}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Адрес выгрузки:</strong> {selectedOrder.unloading_address}
                      </Typography>
                    </Grid>
                  </Grid>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsViewDialogOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserOrdersView; 