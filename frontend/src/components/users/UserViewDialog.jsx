import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Tabs,
  Tab,
  Typography,
  IconButton,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import UserOrdersView from './UserOrdersView';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import api from '../../api';
import CalendarTaskForm from '../calendar/CalendarTaskForm';

const UserCalendarView = ({ userId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [taskFormOpen, setTaskFormOpen] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchTasks();
    }
  }, [userId, currentDate]);

  const fetchTasks = async () => {
    try {
      const startDate = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);
      console.log('Fetching tasks for user:', userId, 'from:', startDate, 'to:', endDate);
      const response = await api.get(`/calendar/tasks/?user=${userId}&start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`);
      console.log('Tasks response:', response.data);
      setTasks(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Не удалось загрузить задачи');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setTaskFormOpen(true);
  };

  const handleTaskFormClose = () => {
    setTaskFormOpen(false);
    setSelectedDate(null);
  };

  const handleTaskCreated = () => {
    fetchTasks();
    setTaskFormOpen(false);
    setSelectedDate(null);
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const getTasksForDay = (date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.deadline);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef5350';
      case 'medium': return '#9575cd';
      case 'low': return '#66bb6a';
      default: return '#607d8b';
    }
  };

  return (
    <Box sx={{ 
      p: 1,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: '400px'
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 0.5 
      }}>
        <Typography variant="subtitle2">
          {format(currentDate, 'LLLL yyyy', { locale: ru })}
        </Typography>
        <Box>
          <IconButton onClick={handlePrevMonth} size="small">
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
          <IconButton onClick={handleNextMonth} size="small">
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        gap: 0.5,
        flex: 1,
        minHeight: 0,
        '& > *': { 
          aspectRatio: '1',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          position: 'relative',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'action.hover'
          }
        }
      }}>
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
          <Paper key={day} elevation={1} sx={{ p: 0.5, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}>
              {day}
            </Typography>
          </Paper>
        ))}
        
        {days.map((date, index) => {
          const dayTasks = getTasksForDay(date);
          const isToday = isSameDay(date, new Date());
          
          return (
            <Paper
              key={index}
              elevation={1}
              onClick={() => handleDateClick(date)}
              sx={{
                p: 0.5,
                backgroundColor: isToday ? 'action.selected' : 'background.paper',
                border: isToday ? '1px solid primary.main' : 'none',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <Typography variant="caption" sx={{ mb: 0.5, fontSize: '0.7rem' }}>
                {format(date, 'd')}
              </Typography>
              {dayTasks.length > 0 && (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 0.5,
                  width: '100%',
                  overflow: 'hidden'
                }}>
                  {dayTasks.slice(0, 2).map(task => (
                    <Box
                      key={task.id}
                      sx={{
                        width: '100%',
                        height: '2px',
                        backgroundColor: getPriorityColor(task.priority),
                        borderRadius: '1px'
                      }}
                    />
                  ))}
                  {dayTasks.length > 2 && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem' }}>
                      +{dayTasks.length - 2}
                    </Typography>
                  )}
                </Box>
              )}
            </Paper>
          );
        })}
      </Box>

      {taskFormOpen && (
        <CalendarTaskForm
          open={taskFormOpen}
          onClose={handleTaskFormClose}
          onTaskCreated={handleTaskCreated}
          initialDate={selectedDate}
          userId={userId}
        />
      )}
    </Box>
  );
};

const UserViewDialog = ({ open, onClose, user }) => {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    console.log('=== UserViewDialog MOUNTED ===');
    console.log('UserViewDialog - open:', open);
    console.log('UserViewDialog - user:', user);
    if (user) {
      console.log('UserViewDialog - user.id:', user.id);
    }
  }, [open, user]);

  const handleTabChange = (event, newValue) => {
    console.log('=== Tab Changed ===');
    console.log('New tab value:', newValue);
    setActiveTab(newValue);
  };

  if (!user) {
    console.log('=== UserViewDialog - No user provided ===');
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Typography variant="h6">Информация о пользователе</Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Основная информация" />
            <Tab label="Заказы" />
            <Tab label="Календарь" />
          </Tabs>
        </Box>

        {activeTab === 0 && (
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              <strong>Email:</strong> {user.email}
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              <strong>Роль:</strong> {user.role}
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              <strong>Имя пользователя:</strong> {user.username}
            </Typography>
            {user.first_name && (
              <Typography variant="subtitle1" gutterBottom>
                <strong>Имя:</strong> {user.first_name}
              </Typography>
            )}
            {user.last_name && (
              <Typography variant="subtitle1" gutterBottom>
                <strong>Фамилия:</strong> {user.last_name}
              </Typography>
            )}
          </Box>
        )}

        {activeTab === 1 && (
          <Box sx={{ p: 2 }}>
            <UserOrdersView userId={user.id} />
          </Box>
        )}

        {activeTab === 2 && (
          <Box sx={{ p: 2 }}>
            <UserCalendarView userId={user.id} />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserViewDialog; 