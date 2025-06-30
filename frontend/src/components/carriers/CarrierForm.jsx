import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/api';
import {
  Box,
  TextField,
  Button,
  Grid,
  Alert,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';

const CarrierForm = ({ onSubmit, carrier, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [contactType, setContactType] = useState('manager');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    company_name: '',
    business_scope: '',
    address: '',
    bank_details: '',
    unp: '',
    unn: '',
    okpo: '',
    comments: '',
    contacts: []
  });
  const [usersList, setUsersList] = useState([]);

  const validateUnp = (unp) => {
    if (!unp) return '';
    return /^\d{9}$/.test(unp) ? '' : 'УНП должен содержать 9 цифр';
  };

  const validateUnn = (unn) => {
    if (!unn) return '';
    return /^\d{12}$/.test(unn) ? '' : 'УНН должен содержать 12 цифр';
  };

  const validateOkpo = (okpo) => {
    if (!okpo) return '';
    return /^\d{10}$/.test(okpo) ? '' : 'ОКПО должен содержать 10 цифр';
  };

  useEffect(() => {
    console.log('[CarrierForm] useEffect triggered. Carrier prop:', carrier);
    if (carrier) {
      console.log('[CarrierForm] Setting form data from carrier:', carrier);
      setFormData({
        ...carrier,
        created_by_id: carrier.created_by?.id || '',
        contacts: Array.isArray(carrier.contacts) ? carrier.contacts : []
      });
    } else {
      console.log('[CarrierForm] Resetting form data for new carrier.');
      setFormData({
        company_name: '',
        business_scope: '',
        address: '',
        bank_details: '',
        unp: '',
        unn: '',
        okpo: '',
        comments: '',
        contacts: []
      });
    }
    if (user?.role === 'admin') {
      api.get('/users/').then(res => {
        setUsersList(Array.isArray(res.data) ? res.data : res.data.results || []);
      }).catch(() => {});
    }
  }, [carrier, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContactChange = (field, value) => {
    setFormData(prev => {
      const contacts = Array.isArray(prev.contacts) ? [...prev.contacts] : [];
      const currentContact = contacts.find(c => c.type === contactType) || { type: contactType };
      const contactIndex = contacts.findIndex(c => c.type === contactType);
      
      if (contactIndex >= 0) {
        contacts[contactIndex] = { ...currentContact, [field]: value };
      } else {
        contacts.push({ ...currentContact, [field]: value });
      }

      return {
        ...prev,
        contacts
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const errors = {
      unp: validateUnp(formData.unp),
      unn: validateUnn(formData.unn),
      okpo: validateOkpo(formData.okpo)
    };

    if (Object.values(errors).some(error => error)) {
      setError(Object.values(errors).find(error => error));
      return;
    }

    try {
      const payload = { ...formData };
      if (user?.role === 'admin' && formData.created_by_id) {
        payload.created_by_id = formData.created_by_id;
      }
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Произошла ошибка при сохранении');
    }
  };

  const renderBasicInfo = () => (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Название компании"
            name="company_name"
            value={formData.company_name}
            onChange={handleChange}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Сфера деятельности"
            name="business_scope"
            value={formData.business_scope}
            onChange={handleChange}
            multiline
            rows={2}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Адрес"
            name="address"
            value={formData.address}
            onChange={handleChange}
            multiline
            rows={2}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Банковские реквизиты"
            name="bank_details"
            value={formData.bank_details}
            onChange={handleChange}
            multiline
            rows={3}
          />
        </Grid>
        {user?.role === 'admin' && (
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Создатель</InputLabel>
              <Select
                label="Создатель"
                name="created_by_id"
                value={formData.created_by_id || ''}
                onChange={handleChange}
              >
                {usersList.map(u => (
                  <MenuItem key={u.id} value={u.id}>{u.email}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}
      </Grid>
    </Box>
  );

  const renderContactInfo = () => {
    const contacts = Array.isArray(formData.contacts) ? formData.contacts : [];
    const currentContact = contacts.find(c => c.type === contactType) || {};
    
    return (
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Тип контакта</InputLabel>
              <Select
                name="type"
                value={contactType}
                onChange={(e) => setContactType(e.target.value)}
                label="Тип контакта"
              >
                <MenuItem value="manager">Менеджер</MenuItem>
                <MenuItem value="director">Директор</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="ФИО контактного лица"
              name="name"
              value={currentContact.name || ''}
              onChange={(e) => handleContactChange('name', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Телефон"
              name="phone"
              value={currentContact.phone || ''}
              onChange={(e) => handleContactChange('phone', e.target.value)}
              placeholder="+375000000000"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              value={currentContact.email || ''}
              onChange={(e) => handleContactChange('email', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Skype"
              name="skype"
              value={currentContact.skype || ''}
              onChange={(e) => handleContactChange('skype', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Telegram"
              name="telegram"
              value={currentContact.telegram || ''}
              onChange={(e) => handleContactChange('telegram', e.target.value)}
            />
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderLegalInfo = () => (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="УНП"
            name="unp"
            value={formData.unp}
            onChange={handleChange}
            error={!!validateUnp(formData.unp)}
            helperText={validateUnp(formData.unp)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="УНН"
            name="unn"
            value={formData.unn}
            onChange={handleChange}
            error={!!validateUnn(formData.unn)}
            helperText={validateUnn(formData.unn)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="ОКПО"
            name="okpo"
            value={formData.okpo}
            onChange={handleChange}
            error={!!validateOkpo(formData.okpo)}
            helperText={validateOkpo(formData.okpo)}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderAdditionalInfo = () => (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Комментарии"
            name="comments"
            value={formData.comments}
            onChange={handleChange}
            multiline
            rows={4}
          />
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Основная информация" />
          <Tab label="Юридическая информация" />
          <Tab label="Контакты" />
          <Tab label="Дополнительно" />
        </Tabs>
      </Box>
      {activeTab === 0 && renderBasicInfo()}
      {activeTab === 1 && renderLegalInfo()}
      {activeTab === 2 && renderContactInfo()}
      {activeTab === 3 && renderAdditionalInfo()}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3, p: 3, pt: 0 }}>
        <Button onClick={onClose}>Отмена</Button>
        <Button type="submit" variant="contained">
          {carrier ? 'Сохранить' : 'Добавить'}
        </Button>
      </Box>
    </form>
  );
};

export default CarrierForm; 