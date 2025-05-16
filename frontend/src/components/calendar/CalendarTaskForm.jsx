import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Alert,
  MenuItem,
  Grid,
  FormControl,
  InputLabel,
  Select,
  Box,
  Tooltip
} from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { createCalendarTask, updateCalendarTask } from '../../api/calendar';
import { useAuth } from '../../contexts/AuthContext';
import ContactSelectionModal from './ContactSelectionModal';

// Helper function to format date for datetime-local input
const formatDateForInput = (dateStringOrObject) => {
  if (!dateStringOrObject) {
    console.warn('[formatDateForInput] Received null or empty dateStringOrObject');
    return '';
  }
  try {
      const d = new Date(dateStringOrObject);
      // Проверка на валидность даты
      if (isNaN(d.getTime())) {
        console.error('[formatDateForInput] Invalid date after parsing:', dateStringOrObject, d);
        return '';
      }
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (e) {
      console.error("[formatDateForInput] Error formatting date:", dateStringOrObject, e);
      return '';
  }
};

const CalendarTaskForm = ({ open, onClose, onTaskCreated, initialDate, taskToEdit }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    deadline: '' // Инициализируем пустой строкой
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [contactModalOpen, setContactModalOpen] = useState(false);

  useEffect(() => {
    if (open) console.log('[CalendarTaskForm] useEffect - taskToEdit:', taskToEdit, 'initialDate:', initialDate);

    if (open) {
        let newDeadline = '';
        // Используем taskToEdit.apiDeadline если оно есть, иначе taskToEdit.start
        const deadlineSource = taskToEdit?.apiDeadline || taskToEdit?.start;

        if (taskToEdit && deadlineSource) {
            console.log('[CalendarTaskForm] Formatting deadline for taskToEdit, source:', deadlineSource);
            newDeadline = formatDateForInput(deadlineSource); 
        } else if (initialDate) {
            console.log('[CalendarTaskForm] Formatting deadline for initialDate:', initialDate);
            newDeadline = formatDateForInput(initialDate);
        }
        console.log('[CalendarTaskForm] Calculated newDeadline string:', newDeadline);

        if (taskToEdit) { 
          setFormData({
            title: taskToEdit.title || '',
            description: taskToEdit.description || '',
            priority: taskToEdit.priority || 'medium',
            deadline: newDeadline,
          });
        } else { 
          setFormData({
              title: '',
              description: '',
              priority: 'medium',
              deadline: newDeadline, 
          });
        }
        setError('');
        setSubmitting(false);
      }
  }, [open, initialDate, taskToEdit]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContactSelected = (contactString) => {
      setFormData((prev) => ({
          ...prev,
          description: prev.description ? `${prev.description}\n${contactString}` : contactString,
      }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[handleSubmit] Current formData:', formData); // Логируем formData перед проверкой
    if (!user || !user.id) {
        setError('Не удалось определить текущего пользователя. Попробуйте перезайти.');
        return;
    }
    if (!formData.title || !formData.deadline) {
      setError('Пожалуйста, заполните все обязательные поля: Название, Срок.');
      console.error('Validation Error: Title or Deadline is missing. Title:', formData.title, 'Deadline:', formData.deadline);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        assignee: user.id,
        deadline: new Date(formData.deadline).toISOString(),
      };

      if (taskToEdit && taskToEdit.id) {
        console.log('Обновление задачи в календаре:', taskToEdit.id, payload);
        await updateCalendarTask(taskToEdit.id, payload);
      } else {
        console.log('Отправка новой задачи в календарь:', payload);
        await createCalendarTask(payload);
      }
      
      onTaskCreated();
      onClose();
    } catch (err) {
      console.error('Ошибка при сохранении задачи:', err);
      let errorMsg = taskToEdit ? 'Произошла ошибка при обновлении задачи' : 'Произошла ошибка при создании задачи';
      if (err.response?.data) {
          if (typeof err.response.data === 'string') {
              errorMsg = err.response.data;
          } else if (err.response.data.message) {
              errorMsg = err.response.data.message;
          } else if (typeof err.response.data === 'object') {
              const messages = Object.entries(err.response.data)
                  .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                  .join('; ');
              if (messages) errorMsg = messages;
          }
      }
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
            {taskToEdit ? 'Редактирование задачи' : 'Новая задача в календаре'}
        </DialogTitle>
        <DialogContent sx={{ bgcolor: 'grey.50', py: 3 }}> 
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2.5}> 
            <Grid item xs={12}>
              <TextField
                autoFocus
                required
                fullWidth
                label="Название задачи"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Описание"
                name="description"
                multiline
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Tooltip title="Прикрепить контакт клиента/перевозчика">
                  <Button 
                    startIcon={<AttachFileIcon />}
                    size="small"
                    onClick={() => setContactModalOpen(true)}
                    sx={{ textTransform: 'none' }}
                  >
                    Контакт
                  </Button>
                </Tooltip>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Приоритет</InputLabel>
                <Select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  label="Приоритет"
                >
                  <MenuItem value="low">Низкий</MenuItem>
                  <MenuItem value="medium">Средний</MenuItem>
                  <MenuItem value="high">Высокий</MenuItem>
                </Select>
              </FormControl>
            </Grid>
             <Grid item xs={12} sm={6}>
              <TextField
                  required
                  fullWidth
                  label="Срок выполнения"
                  type="datetime-local"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  InputLabelProps={{
                      shrink: true,
                  }}
                  inputProps={{}}
                />
             </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid', borderColor: 'divider', px: 3, py: 2 }}>
          {submitting && <CircularProgress size={24} sx={{ mr: 1.5 }} />}
          <Button onClick={onClose} disabled={submitting} variant="outlined">Отмена</Button>
          <Button onClick={handleSubmit} disabled={submitting} variant="contained">
            {taskToEdit ? 'Сохранить изменения' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>

      <ContactSelectionModal
        open={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        onContactSelect={handleContactSelected}
      />
    </>
  );
};

export default CalendarTaskForm; 