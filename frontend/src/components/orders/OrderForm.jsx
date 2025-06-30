import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Button,
  Typography,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';
import { isValid } from 'date-fns';
import { createCalendarTask } from '../../api/calendar';

const OrderForm = ({ order, clients, carriers, onSubmit, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const financeFields = [
    'payment_currency',
    'carrier_rate',
    'client_rate',
    'price_usd',
    'cost_with_vat',
    'cost_without_vat',
    'vat_rate',
    'margin_income',
    'demurrage_amount',
  ];

  // Пустой шаблон для нового заказа
  const EMPTY_ORDER = financeFields.reduce((acc, f) => ({ ...acc, [f]: '' }), {});

  const [formData, setFormData] = useState(EMPTY_ORDER);

  useEffect(() => {
    if (order) {
      const mapped = {
        ...order,
        client: order.client?.id || order.client_id || '',
        carrier: order.carrier?.id || order.carrier_id || '',
      };
      // гарантируем наличие всех финансовых полей
      financeFields.forEach((f) => {
        if (mapped[f] === undefined || mapped[f] === null) mapped[f] = '';
      });
      setFormData(mapped);
    }
  }, [order]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  const createCalendarTaskForOrder = async (date, type, orderNumber, clientName) => {
    try {
      if (!formData.carrier) {
        console.log('Перевозчик не выбран, задача не создана');
        return;
      }

      const taskData = {
        title: type === 'loading' ? 'Загрузка' : 'Выгрузка',
        description: `Заказ №${orderNumber}\nКлиент: ${clientName}`,
        priority: 'high',
        deadline: date.toISOString(),
      };
      await createCalendarTask(taskData);
    } catch (error) {
      console.error('Ошибка при создании задачи в календаре:', error);
    }
  };

  const handleDateChange = (field) => (date) => {
    if (date && isValid(date)) {
      setFormData({
        ...formData,
        [field]: date.toISOString()
      });
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      client_id: formData.client || null,
      carrier_id: formData.carrier || null,
    };

    // переносим все остальные поля (пустые строки превращаем в null)
    Object.entries(formData).forEach(([key, val]) => {
      if (key === 'client' || key === 'carrier') return;
      payload[key] = val === '' ? null : val;
    });

    console.log('Отправка формы с данными:', payload);
    onSubmit(payload);
  };

  const renderDocumentsTab = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Номер счета на оплату"
          value={formData.invoice_number || ''}
          onChange={handleChange('invoice_number')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
          <DatePicker
            label="Дата составления счета"
            value={formData.invoice_date ? new Date(formData.invoice_date) : null}
            onChange={handleDateChange('invoice_date')}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </LocalizationProvider>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Номер акта выполненных работ"
          value={formData.act_number || ''}
          onChange={handleChange('act_number')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
          <DatePicker
            label="Дата составления акта"
            value={formData.act_date ? new Date(formData.act_date) : null}
            onChange={handleDateChange('act_date')}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </LocalizationProvider>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Номер контракта с перевозчиком"
          value={formData.carrier_contract_number || ''}
          onChange={handleChange('carrier_contract_number')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Номер CMR"
          value={formData.cmr_number || ''}
          onChange={handleChange('cmr_number')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Номер договора"
          value={formData.contract_number || ''}
          onChange={handleChange('contract_number')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Транспортный заказ номер"
          value={formData.transport_order_number || ''}
          onChange={handleChange('transport_order_number')}
        />
      </Grid>
    </Grid>
  );

  const renderCargoTab = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Количество единиц груза"
          type="number"
          value={formData.cargo_quantity || ''}
          onChange={handleChange('cargo_quantity')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Наименование груза"
          value={formData.cargo_name || ''}
          onChange={handleChange('cargo_name')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Код ТНВЭД"
          value={formData.tnved_code || ''}
          onChange={handleChange('tnved_code')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Опасность груза"
          value={formData.cargo_danger || ''}
          onChange={handleChange('cargo_danger')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Вес брутто (кг)"
          type="number"
          value={formData.cargo_weight || ''}
          onChange={handleChange('cargo_weight')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Габариты груза"
          value={formData.cargo_dimensions || ''}
          onChange={handleChange('cargo_dimensions')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Объем груза (м³)"
          type="number"
          value={formData.cargo_volume || ''}
          onChange={handleChange('cargo_volume')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Условия поставки (INCOTERMS)"
          value={formData.delivery_terms || ''}
          onChange={handleChange('delivery_terms')}
        />
      </Grid>
    </Grid>
  );

  const renderFinanceTab = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Валюта расчетов</InputLabel>
          <Select
            value={formData.payment_currency || ''}
            onChange={handleChange('payment_currency')}
            label="Валюта расчетов"
          >
            <MenuItem value="RUB">Рубль (RUB)</MenuItem>
            <MenuItem value="USD">Доллар (USD)</MenuItem>
            <MenuItem value="EUR">Евро (EUR)</MenuItem>
            <MenuItem value="BYN">Бел. рубль (BYN)</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Срок оплаты счетов"
          value={formData.payment_term || ''}
          onChange={handleChange('payment_term')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Сумма за простой транспорта"
          type="number"
          value={formData.demurrage_amount || ''}
          onChange={handleChange('demurrage_amount')}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">{formData.payment_currency || 'RUB'}</InputAdornment>
            )
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Цена в долларах"
          type="number"
          value={formData.price_usd || ''}
          onChange={handleChange('price_usd')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Общая стоимость услуг"
          type="number"
          value={formData.total_service_cost || ''}
          onChange={handleChange('total_service_cost')}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">{formData.payment_currency || 'RUB'}</InputAdornment>
            )
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Стоимость услуг без НДС"
          type="number"
          value={formData.cost_without_vat || ''}
          onChange={handleChange('cost_without_vat')}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">{formData.payment_currency || 'RUB'}</InputAdornment>
            )
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Ставка НДС"
          type="number"
          value={formData.vat_rate || ''}
          onChange={handleChange('vat_rate')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Итоговая стоимость с НДС"
          type="number"
          value={formData.cost_with_vat || ''}
          onChange={handleChange('cost_with_vat')}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">{formData.payment_currency || 'RUB'}</InputAdornment>
            )
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Ставка перевозчика"
          type="number"
          value={formData.carrier_rate || ''}
          onChange={handleChange('carrier_rate')}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">{formData.payment_currency || 'RUB'}</InputAdornment>
            )
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Ставка клиента"
          type="number"
          value={formData.client_rate || ''}
          onChange={handleChange('client_rate')}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">{formData.payment_currency || 'RUB'}</InputAdornment>
            )
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Маржинальный доход"
          type="number"
          value={formData.margin_income || ''}
          onChange={handleChange('margin_income')}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">{formData.payment_currency || 'RUB'}</InputAdornment>
            )
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Цена"
          type="number"
          value={formData.total_price || ''}
          onChange={handleChange('total_price')}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">{formData.payment_currency || 'RUB'}</InputAdornment>
            )
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Статус оплаты</InputLabel>
          <Select
            value={formData.payment_status || ''}
            onChange={handleChange('payment_status')}
            label="Статус оплаты"
          >
            <MenuItem value="paid">Оплачено</MenuItem>
            <MenuItem value="pending">Ожидает оплаты</MenuItem>
            <MenuItem value="unpaid">Не оплачено</MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );

  const renderCarrierTab = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Перевозчик</InputLabel>
          <Select
            value={formData.carrier || ''}
            onChange={handleChange('carrier')}
            label="Перевозчик"
          >
            {carriers.map((carrier) => (
              <MenuItem key={carrier.id} value={carrier.id}>
                {carrier.company_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );

  const renderClientTab = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Клиент</InputLabel>
          <Select
            value={formData.client || ''}
            onChange={handleChange('client')}
            label="Клиент"
          >
            {clients.map((client) => (
              <MenuItem key={client.id} value={client.id}>
                {client.company_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );

  const renderDatesTab = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Срок доставки"
          value={formData.delivery_term || ''}
          onChange={handleChange('delivery_term')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
          <DatePicker
            label="Дата загрузки"
            value={formData.loading_date ? new Date(formData.loading_date) : null}
            onChange={handleDateChange('loading_date')}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </LocalizationProvider>
      </Grid>
      <Grid item xs={12} sm={6}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
          <DatePicker
            label="Дата отправки"
            value={formData.departure_date ? new Date(formData.departure_date) : null}
            onChange={handleDateChange('departure_date')}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </LocalizationProvider>
      </Grid>
      <Grid item xs={12} sm={6}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
          <DatePicker
            label="Дата выгрузки"
            value={formData.unloading_date ? new Date(formData.unloading_date) : null}
            onChange={handleDateChange('unloading_date')}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </LocalizationProvider>
      </Grid>
      <Grid item xs={12} sm={6}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
          <DatePicker
            label="Дата заключения договора"
            value={formData.contract_date ? new Date(formData.contract_date) : null}
            onChange={handleDateChange('contract_date')}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </LocalizationProvider>
      </Grid>
    </Grid>
  );

  const renderContactsTab = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Адрес грузоотправителя"
          value={formData.shipper_address || ''}
          onChange={handleChange('shipper_address')}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Контактные данные грузоотправителя"
          value={formData.shipper_contacts || ''}
          onChange={handleChange('shipper_contacts')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="ОКПО грузополучателя"
          value={formData.consignee_okpo || ''}
          onChange={handleChange('consignee_okpo')}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Адрес загрузки"
          value={formData.loading_address || ''}
          onChange={handleChange('loading_address')}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Адрес выгрузки"
          value={formData.unloading_address || ''}
          onChange={handleChange('unloading_address')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Грузоотправитель"
          value={formData.shipper || ''}
          onChange={handleChange('shipper')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Пункт назначения"
          value={formData.destination || ''}
          onChange={handleChange('destination')}
        />
      </Grid>
    </Grid>
  );

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {order ? 'Редактирование заказа' : 'Создание заказа'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
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

      <DialogContent dividers>
        <Box sx={{ p: 2 }}>
          {activeTab === 0 && renderCarrierTab()}
          {activeTab === 1 && renderClientTab()}
          {activeTab === 2 && renderDocumentsTab()}
          {activeTab === 3 && renderCargoTab()}
          {activeTab === 4 && renderFinanceTab()}
          {activeTab === 5 && renderDatesTab()}
          {activeTab === 6 && renderContactsTab()}
          {activeTab === 7 && renderDocumentsTab()}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button type="submit" variant="contained" color="primary">
          {order ? 'Сохранить' : 'Создать'}
        </Button>
      </DialogActions>
    </Box>
  );
};

export default OrderForm; 