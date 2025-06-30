import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Grid,
  Tabs,
  Tab,
  Divider,
  Paper
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import OrderDocumentsTab from './OrderDocumentsTab';

const OrderCard = ({ open, onClose, order }) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const formatMoney = (amount, currencyCode = order?.payment_currency || 'RUB') => {
    if (!amount && amount !== 0) return '-';
    const code = currencyCode || 'RUB';
    return `${amount} ${code}`;
  };

  const renderField = (label, value) => (
    <Grid item xs={12} sm={6}>
      <Typography variant="body2" color="text.secondary">
        {label}:
      </Typography>
      <Typography variant="body1">
        {value || '-'}
      </Typography>
    </Grid>
  );

  const renderCarrierTab = () => (
    <Grid container spacing={2}>
      {renderField('Название компании', order.carrier?.company_name)}
      {renderField('ИНН', order.carrier?.inn)}
      {renderField('КПП', order.carrier?.kpp)}
      {renderField('ОГРН', order.carrier?.ogrn)}
      {renderField('Юридический адрес', order.carrier?.legal_address)}
      {renderField('Фактический адрес', order.carrier?.actual_address)}
      {renderField('Телефон', order.carrier?.phone)}
      {renderField('Email', order.carrier?.email)}
      {renderField('Банк', order.carrier?.bank_name)}
      {renderField('БИК', order.carrier?.bik)}
      {renderField('Расчетный счет', order.carrier?.account_number)}
      {renderField('Корр. счет', order.carrier?.corr_account)}
    </Grid>
  );

  const renderClientTab = () => (
    <Grid container spacing={2}>
      {renderField('Название компании', order.client?.company_name)}
      {renderField('ИНН', order.client?.inn)}
      {renderField('КПП', order.client?.kpp)}
      {renderField('ОГРН', order.client?.ogrn)}
      {renderField('Юридический адрес', order.client?.legal_address)}
      {renderField('Фактический адрес', order.client?.actual_address)}
      {renderField('Телефон', order.client?.phone)}
      {renderField('Email', order.client?.email)}
      {renderField('Банк', order.client?.bank_name)}
      {renderField('БИК', order.client?.bik)}
      {renderField('Расчетный счет', order.client?.account_number)}
      {renderField('Корр. счет', order.client?.corr_account)}
    </Grid>
  );

  const renderDocumentsTab = () => (
    <Grid container spacing={2}>
      {renderField('Номер счета на оплату', order.invoice_number)}
      {renderField('Дата составления счета', formatDate(order.invoice_date))}
      {renderField('Номер акта выполненных работ', order.act_number)}
      {renderField('Дата составления акта', formatDate(order.act_date))}
      {renderField('Номер контракта с перевозчиком', order.carrier_contract_number)}
      {renderField('Номер CMR', order.cmr_number)}
      {renderField('Номер договора', order.contract_number)}
      {renderField('Транспортный заказ номер', order.transport_order_number)}
    </Grid>
  );

  const renderCargoTab = () => (
    <Grid container spacing={2}>
      {renderField('Количество единиц груза', order.cargo_quantity)}
      {renderField('Наименование груза', order.cargo_name)}
      {renderField('Код ТНВЭД', order.tnved_code)}
      {renderField('Опасность груза', order.cargo_danger)}
      {renderField('Вес брутто (кг)', order.cargo_weight)}
      {renderField('Габариты груза', order.cargo_dimensions)}
      {renderField('Объем груза (м³)', order.cargo_volume)}
      {renderField('Условия поставки (INCOTERMS)', order.delivery_terms)}
    </Grid>
  );

  const renderFinanceTab = () => (
    <Grid container spacing={2}>
      {renderField('Валюта расчетов', order.payment_currency)}
      {renderField('Срок оплаты счетов', order.payment_term)}
      {renderField('Сумма за простой транспорта', formatMoney(order.demurrage_amount))}
      {renderField('Цена в долларах', formatMoney(order.price_usd, 'USD'))}
      {renderField('Общая стоимость услуг', formatMoney(order.total_service_cost))}
      {renderField('Стоимость услуг без НДС', formatMoney(order.cost_without_vat))}
      {renderField('Ставка НДС', `${order.vat_rate}%`)}
      {renderField('Итоговая стоимость с НДС', formatMoney(order.cost_with_vat))}
      {renderField('Ставка перевозчика', formatMoney(order.carrier_rate))}
      {renderField('Ставка клиента', formatMoney(order.client_rate))}
      {renderField('Маржинальный доход', formatMoney(order.margin_income))}
      {renderField('Цена', formatMoney(order.total_price))}
      {renderField('Статус оплаты', order.payment_status)}
    </Grid>
  );

  const renderCarrierLogisticsTab = () => (
    <Grid container spacing={2}>
      {renderField('Перевозчик', order.carrier?.company_name)}
      {renderField('Номер контракта с перевозчиком', order.carrier_contract_number)}
      {renderField('Валюта расчетов с перевозчиком', order.carrier_currency)}
      {renderField('Тип транспорта', order.transport_type)}
      {renderField('Маршрут', order.route)}
      {renderField('Условия поставки (INCOTERMS)', order.delivery_terms)}
    </Grid>
  );

  const renderDatesTab = () => (
    <Grid container spacing={2}>
      {renderField('Срок доставки', order.delivery_term)}
      {renderField('Дата загрузки', formatDate(order.loading_date))}
      {renderField('Дата отправки', formatDate(order.departure_date))}
      {renderField('Дата выгрузки', formatDate(order.unloading_date))}
      {renderField('Дата заключения договора', formatDate(order.contract_date))}
    </Grid>
  );

  const renderContactsTab = () => (
    <Grid container spacing={2}>
      {renderField('Адрес грузоотправителя', order.shipper_address)}
      {renderField('Контактные данные грузоотправителя', order.shipper_contacts)}
      {renderField('ОКПО грузополучателя', order.consignee_okpo)}
      {renderField('Адрес загрузки', order.loading_address)}
      {renderField('Адрес выгрузки', order.unloading_address)}
      {renderField('Грузоотправитель', order.shipper)}
      {renderField('Пункт назначения', order.destination)}
    </Grid>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '80vh',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Заказ #{order?.id}
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
          {activeTab === 5 && renderCarrierLogisticsTab()}
          {activeTab === 6 && renderDatesTab()}
          {activeTab === 7 && renderContactsTab()}
          {activeTab === 8 && <OrderDocumentsTab orderId={order.id} />}
          </Box>
      </DialogContent>
    </Dialog>
  );
};

export default OrderCard; 