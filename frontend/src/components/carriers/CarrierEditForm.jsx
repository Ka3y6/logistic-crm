import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab
} from '@mui/material';
import api from '../../api';

const CarrierEditForm = ({ open, onClose, onSubmit, carrier }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    company_name: '',
    working_directions: '',
    location: '',
    fleet: '',
    manager_name: '',
    manager_phone: '',
    manager_email: '',
    manager_skype: '',
    manager_telegram: '',
    director_name: '',
    director_phone: '',
    director_email: '',
    director_skype: '',
    director_telegram: '',
    comments: '',
    known_rates: '',
    vehicle_number: ''
  });

  useEffect(() => {
    if (carrier) {
      setFormData(carrier);
      setLoading(false);
    }
  }, [carrier]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/carriers/${carrier.id}/`, formData);
      onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Ошибка при обновлении перевозчика:', error);
      setError('Не удалось обновить данные перевозчика');
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const TabPanel = (props) => {
    const { children, value, index, ...other } = props;
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`carrier-edit-tabpanel-${index}`}
        aria-labelledby={`carrier-edit-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{
            border: 2,
            borderColor: 'grey.400',
            borderTop: 'none',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px',
          }}>
            {children}
          </Box>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  const renderBasicInfo = () => (
    <Box sx={{ p: 3 }}>
    <Grid container spacing={2} sx={{ mt: 1 }}>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Наименование компании"
          name="company_name"
          value={formData.company_name || ''}
          onChange={handleChange}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Расположение"
          name="location"
          value={formData.location || ''}
          onChange={handleChange}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Направления работы"
          name="working_directions"
          value={formData.working_directions || ''}
          onChange={handleChange}
          multiline
          rows={2}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Автопарк"
          name="fleet"
          value={formData.fleet || ''}
          onChange={handleChange}
          multiline
          rows={2}
        />
      </Grid>
    </Grid>
    </Box>
  );

  const renderManagerInfo = () => (
    <Box sx={{ p: 3 }}>
    <Grid container spacing={2} sx={{ mt: 1 }}>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="ФИО менеджера"
          name="manager_name"
          value={formData.manager_name || ''}
          onChange={handleChange}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Телефон менеджера"
          name="manager_phone"
          value={formData.manager_phone || ''}
          onChange={handleChange}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Email менеджера"
          name="manager_email"
          value={formData.manager_email || ''}
          onChange={handleChange}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Skype менеджера"
          name="manager_skype"
          value={formData.manager_skype || ''}
          onChange={handleChange}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Telegram менеджера"
          name="manager_telegram"
          value={formData.manager_telegram || ''}
          onChange={handleChange}
        />
      </Grid>
    </Grid>
    </Box>
  );

  const renderDirectorInfo = () => (
    <Box sx={{ p: 3 }}>
    <Grid container spacing={2} sx={{ mt: 1 }}>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="ФИО директора"
          name="director_name"
          value={formData.director_name || ''}
          onChange={handleChange}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Телефон директора"
          name="director_phone"
          value={formData.director_phone || ''}
          onChange={handleChange}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Email директора"
          name="director_email"
          value={formData.director_email || ''}
          onChange={handleChange}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Skype директора"
          name="director_skype"
          value={formData.director_skype || ''}
          onChange={handleChange}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Telegram директора"
          name="director_telegram"
          value={formData.director_telegram || ''}
          onChange={handleChange}
        />
      </Grid>
    </Grid>
    </Box>
  );

  const renderAdditionalInfo = () => (
    <Box sx={{ p: 3 }}>
    <Grid container spacing={2} sx={{ mt: 1 }}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Комментарии"
          name="comments"
          value={formData.comments || ''}
          onChange={handleChange}
          multiline
          rows={2}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Известные тарифы"
          name="known_rates"
          value={formData.known_rates || ''}
          onChange={handleChange}
          multiline
          rows={2}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Номер ТС или контейнера"
          name="vehicle_number"
          value={formData.vehicle_number || ''}
          onChange={handleChange}
        />
      </Grid>
    </Grid>
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h5">
          Редактирование перевозчика
        </Typography>
      </DialogTitle>
        <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 3, pt: 1, overflowY: 'visible' }}>
          <Box sx={{ borderBottom: '2px solid', borderColor: 'grey.400' /* pt: 2 */ }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="Carrier edit form tabs"
              sx={{
                '& .MuiTabs-indicator': {
                  display: 'none',
                },
                '& .MuiTab-root': {
                  position: 'relative',
                  border: '2px solid',
                  borderColor: 'grey.400',
                  borderBottom: 'none',
                  borderTopLeftRadius: '8px',
                  borderTopRightRadius: '8px',
                  mr: 0.5,
                  textTransform: 'none',
                  minHeight: '40px',
                  transition: 'background-color 0.3s ease, border-color 0.3s ease, z-index 0s 0.1s',
                  zIndex: 1,
                  '&:not(:first-of-type)': {
                    marginLeft: '-15px',
                  },
                  '&:not(.Mui-selected)': {
                    backgroundColor: 'grey.200',
                    borderBottom: '2px solid',
                    borderColor: 'grey.400',
                    '&:hover': {
                       backgroundColor: 'grey.300',
                       zIndex: 2,
                    }
                  },
                  '&.Mui-selected': {
                    fontWeight: 'bold',
                    color: 'primary.main',
                    backgroundColor: 'background.paper',
                    borderColor: 'grey.400',
                    borderBottom: 'none',
                    zIndex: 3,
                  },
                }
              }}
            >
              <Tab label="Основное" id="carrier-edit-tab-0" aria-controls="carrier-edit-tabpanel-0" />
              <Tab label="Менеджер" id="carrier-edit-tab-1" aria-controls="carrier-edit-tabpanel-1" />
              <Tab label="Директор" id="carrier-edit-tab-2" aria-controls="carrier-edit-tabpanel-2" />
              <Tab label="Дополнительно" id="carrier-edit-tab-3" aria-controls="carrier-edit-tabpanel-3" />
          </Tabs>
          </Box>

          <TabPanel value={activeTab} index={0}>
            {renderBasicInfo()}
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            {renderManagerInfo()}
          </TabPanel>
          <TabPanel value={activeTab} index={2}>
            {renderDirectorInfo()}
          </TabPanel>
          <TabPanel value={activeTab} index={3}>
            {renderAdditionalInfo()}
          </TabPanel>

          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
        <DialogActions sx={{ /* px: 3, pb: 2 */ }}>
        <Button onClick={onClose}>Отмена</Button>
          <Button type="submit" variant="contained">Сохранить</Button>
      </DialogActions>
      </form>
    </Dialog>
  );
};

export default CarrierEditForm; 