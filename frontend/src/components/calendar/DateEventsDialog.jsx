import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Box,
  Typography,
  Divider
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import moment from 'moment';
import 'moment/locale/ru';
import RenderDescription from './RenderDescription';

const DateEventsDialog = ({ 
  open, 
  onClose, 
  date, 
  tasks, 
  onDeleteTask,
  onAddTask,
  onEditTask
}) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high':
        return 'Высокий';
      case 'medium':
        return 'Средний';
      case 'low':
        return 'Низкий';
      default:
        return priority;
    }
  };

  const filteredTasks = tasks.filter(task => 
    moment(task.start).format('YYYY-MM-DD') === moment(date).format('YYYY-MM-DD')
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
        {moment(date).format('DD MMMM YYYY')}
      </DialogTitle>
      <DialogContent sx={{ py: 2 }}>
        {filteredTasks.length > 0 ? (
          <List disablePadding>
            {filteredTasks.map((task, index) => (
              <React.Fragment key={task.id}>
                <ListItem alignItems="flex-start" sx={{ py: 1.5 }}>
                  <ListItemText
                    primary={<Typography variant="body1" component="span" sx={{ fontWeight: 500 }}>{task.title}</Typography>}
                    secondary={<RenderDescription description={task.description} />}
                    sx={{ mr: 6 }}
                  />
                  <ListItemSecondaryAction sx={{ top: '16px', right:'16px', display: 'flex', alignItems: 'center' }}>
                    <Chip
                      label={getPriorityLabel(task.priority)}
                      color={getPriorityColor(task.priority)}
                      size="small"
                      sx={{ mr: 0.5 }}
                    />
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => onEditTask(task)}
                      title="Редактировать задачу"
                      sx={{ mr: 0.5 }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => onDeleteTask(task)}
                      title="Удалить задачу"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < filteredTasks.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
            Нет задач на эту дату
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ borderTop: '1px solid', borderColor: 'divider', px: 3, py: 2 }}>
        <Button
          startIcon={<AddIcon />}
          onClick={() => {
            onAddTask(date);
          }}
          variant="outlined"
          size="medium"
        >
          Добавить задачу
        </Button>
        <Button onClick={onClose} variant="contained" size="medium">Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DateEventsDialog; 