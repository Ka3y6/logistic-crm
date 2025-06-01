import { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import api from '../../api/api';

const CargoPanel = () => {
  const [cargos, setCargos] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCargo, setSelectedCargo] = useState(null);
  const [formData, setFormData] = useState({
    weight: '',
    volume: '',
    tnved_code: '',
    transport_conditions: '',
    cargo_value: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCargos();
  }, []);

  const fetchCargos = async () => {
    try {
      const response = await api.get('cargos/');
      console.log('Cargos response:', response.data);
      
      let cargosData = response.data;
      if (typeof cargosData === 'object' && cargosData !== null) {
        if (Array.isArray(cargosData.results)) {
          cargosData = cargosData.results;
        } else if (Array.isArray(cargosData.data)) {
          cargosData = cargosData.data;
        }
      }
      
      setCargos(Array.isArray(cargosData) ? cargosData : []);
    } catch (error) {
      console.error('Ошибка при загрузке грузов:', error);
      setCargos([]);
    }
  };

  const handleOpenDialog = (cargo = null) => {
    if (cargo) {
      setFormData({
        weight: cargo.weight || '',
        volume: cargo.volume || '',
        tnved_code: cargo.tnved_code || '',
        transport_conditions: cargo.transport_conditions || '',
        cargo_value: cargo.cargo_value || '',
      });
      setSelectedCargo(cargo);
    } else {
      setFormData({
        weight: '',
        volume: '',
        tnved_code: '',
        transport_conditions: '',
        cargo_value: '',
      });
      setSelectedCargo(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCargo(null);
  };

  const validateField = (name, value) => {
    if (!value) return '';

    switch (name) {
      case 'weight':
        return !isNaN(value) && value > 0 ? '' : 'Вес должен быть положительным числом';
      case 'volume':
        return !isNaN(value) && value > 0 ? '' : 'Объем должен быть положительным числом';
      case 'cargo_value':
        return !isNaN(value) && value >= 0 ? '' : 'Стоимость должна быть неотрицательным числом';
      case 'tnved_code':
        return /^\d{10}$/.test(value) ? '' : 'Код ТН ВЭД должен содержать 10 цифр';
      default:
        return '';
    }
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    console.log(`Изменение поля ${name}:`, value);
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = async () => {
    try {
      const cargoData = {
        weight: formData.weight ? parseFloat(formData.weight) : null,
        volume: formData.volume ? parseFloat(formData.volume) : null,
        tnved_code: formData.tnved_code || '',
        transport_conditions: formData.transport_conditions || '',
        cargo_value: formData.cargo_value ? parseFloat(formData.cargo_value) : 0,
      };

      console.log('Отправка данных груза:', cargoData);

      if (selectedCargo) {
        await api.put(`cargos/${selectedCargo.id}/`, cargoData);
      } else {
        const response = await api.post('cargos/', cargoData);
        console.log('Ответ сервера:', response.data);
      }
      fetchCargos();
      handleCloseDialog();
    } catch (error) {
      console.error('Ошибка при сохранении груза:', error);
      console.error('Детали ошибки:', error.response?.data);
      alert(error.response?.data?.error || 'Ошибка при сохранении груза');
    }
  };

  const handleDelete = async (cargoId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот груз?')) {
      try {
        await api.delete(`cargos/${cargoId}/`);
        fetchCargos();
      } catch (error) {
        console.error('Ошибка при удалении груза:', error);
      }
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Управление грузами
      </Typography>

      {/* Управление грузами */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Список грузов</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Новый груз
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Наименование</TableCell>
                <TableCell>Вес (кг)</TableCell>
                <TableCell>Объем (м³)</TableCell>
                <TableCell>Тип</TableCell>
                <TableCell>Стоимость</TableCell>
                <TableCell>Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cargos.map((cargo) => (
                <TableRow key={cargo.id}>
                  <TableCell>{cargo.id}</TableCell>
                  <TableCell>{cargo.name || '-'}</TableCell>
                  <TableCell>{cargo.weight || '-'}</TableCell>
                  <TableCell>{cargo.volume || '-'}</TableCell>
                  <TableCell>{cargo.cargo_type || '-'}</TableCell>
                  <TableCell>{cargo.cargo_value ? `${cargo.cargo_value} ₽` : '-'}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(cargo)} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(cargo.id)} size="small">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Диалог добавления/редактирования груза */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedCargo ? 'Редактировать груз' : 'Новый груз'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Вес (кг)"
              name="weight"
              type="number"
              value={formData.weight}
              onChange={handleFieldChange}
              error={!!errors.weight}
              helperText={errors.weight || 'Введите вес груза'}
              margin="normal"
              required
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              fullWidth
              label="Объем (м³)"
              name="volume"
              type="number"
              value={formData.volume}
              onChange={handleFieldChange}
              error={!!errors.volume}
              helperText={errors.volume || 'Введите объем груза'}
              margin="normal"
              required
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              fullWidth
              label="Код ТН ВЭД"
              name="tnved_code"
              value={formData.tnved_code}
              onChange={handleFieldChange}
              error={!!errors.tnved_code}
              helperText={errors.tnved_code || 'Введите код ТН ВЭД'}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Условия перевозки"
              name="transport_conditions"
              multiline
              rows={4}
              value={formData.transport_conditions}
              onChange={handleFieldChange}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Стоимость груза"
              name="cargo_value"
              type="number"
              value={formData.cargo_value}
              onChange={handleFieldChange}
              error={!!errors.cargo_value}
              helperText={errors.cargo_value || 'Введите стоимость груза'}
              margin="normal"
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={Object.values(errors).some(error => error !== '')}
          >
            {selectedCargo ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CargoPanel; 