import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import api from '../../api/api';

const DriverList = () => {
  const [drivers, setDrivers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    license_number: '',
    license_type: '',
    status: 'active',
    experience: '',
    notes: '',
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await api.get('drivers/');
      let driversData = response.data;
      if (typeof driversData === 'object' && driversData !== null) {
        if (Array.isArray(driversData.results)) {
          driversData = driversData.results;
        } else if (Array.isArray(driversData.data)) {
          driversData = driversData.data;
        }
      }
      setDrivers(Array.isArray(driversData) ? driversData : []);
    } catch (error) {
      console.error('Ошибка при загрузке водителей:', error);
      setDrivers([]);
    }
  };

  const handleOpenDialog = (driver = null) => {
    if (driver) {
      setFormData({
        name: driver.name,
        phone: driver.phone,
        license_number: driver.license_number,
        license_type: driver.license_type,
        status: driver.status,
        experience: driver.experience,
        notes: driver.notes,
      });
      setSelectedDriver(driver);
    } else {
      setFormData({
        name: '',
        phone: '',
        license_number: '',
        license_type: '',
        status: 'active',
        experience: '',
        notes: '',
      });
      setSelectedDriver(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedDriver(null);
  };

  const handleSubmit = async () => {
    try {
      if (selectedDriver) {
        await api.put(`drivers/${selectedDriver.id}/`, formData);
        setSuccess('Водитель успешно обновлен');
      } else {
        await api.post('drivers/', formData);
        setSuccess('Водитель успешно создан');
      }
      handleCloseDialog();
      fetchDrivers();
    } catch (error) {
      setError(error.response?.data?.message || 'Произошла ошибка при сохранении водителя');
    }
  };

  const handleDelete = async (driverId) => {
    if (window.confirm('Вы уверены, что хотите удалить этого водителя?')) {
      try {
        await api.delete(`drivers/${driverId}/`);
        fetchDrivers();
      } catch (error) {
        console.error('Ошибка при удалении водителя:', error);
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Водители</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Добавить водителя
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ФИО</TableCell>
              <TableCell>Телефон</TableCell>
              <TableCell>Номер прав</TableCell>
              <TableCell>Категория</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Опыт</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {drivers.map((driver) => (
              <TableRow key={driver.id}>
                <TableCell>{driver.name}</TableCell>
                <TableCell>{driver.phone}</TableCell>
                <TableCell>{driver.license_number}</TableCell>
                <TableCell>{driver.license_type}</TableCell>
                <TableCell>
                  <Chip
                    label={driver.status}
                    color={driver.status === 'active' ? 'success' : 'error'}
                  />
                </TableCell>
                <TableCell>{driver.experience} лет</TableCell>
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(driver)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(driver.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedDriver ? 'Редактировать водителя' : 'Новый водитель'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ФИО"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Телефон"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Номер прав"
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Категория прав</InputLabel>
                <Select
                  value={formData.license_type}
                  onChange={(e) => setFormData({ ...formData, license_type: e.target.value })}
                  label="Категория прав"
                >
                  <MenuItem value="B">B</MenuItem>
                  <MenuItem value="C">C</MenuItem>
                  <MenuItem value="D">D</MenuItem>
                  <MenuItem value="E">E</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Опыт работы (лет)"
                type="number"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Статус</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  label="Статус"
                >
                  <MenuItem value="active">Активный</MenuItem>
                  <MenuItem value="inactive">Неактивный</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Примечания"
                multiline
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedDriver ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DriverList; 