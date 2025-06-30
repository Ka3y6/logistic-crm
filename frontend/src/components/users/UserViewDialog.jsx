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
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import api from '../../api';
import CalendarTaskForm from '../calendar/CalendarTaskForm';
import DateEventsDialog from '../calendar/DateEventsDialog';
import { deleteCalendarTask } from '../../api/calendar';

const UserCalendarView = ({ userId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [dateEventsDialogOpen, setDateEventsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

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
      const formatted = (response.data.results || response.data).map(t => ({
        ...t,
        start: new Date(t.deadline),
      }));
      setTasks(formatted);
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
    setDateEventsDialogOpen(true);
  };

  const handleDateEventsDialogClose = () => {
    setDateEventsDialogOpen(false);
    setSelectedDate(null);
  };

  const handleAddTaskClick = (date) => {
    setDateEventsDialogOpen(false);
    setEditingTask(null);
    setSelectedDate(date);
    setTaskFormOpen(true);
  };

  const handleEditTaskClick = (task) => {
    setDateEventsDialogOpen(false);
    setEditingTask(task);
    setSelectedDate(new Date(task.deadline));
    setTaskFormOpen(true);
  };

  const handleDeleteTask = async (task) => {
    try {
      await deleteCalendarTask(task.id);
      fetchTasks();
    } catch (e) {
      console.error('Error deleting task', e);
    }
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

  // Формируем сетку от понедельника перед первым днём месяца
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // понедельник
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 }); // воскресенье

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const getTasksForDay = (date) => {
    return tasks.filter(task => task.start.toDateString() === date.toDateString());
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
        gridAutoRows: '60px',
        flex: 1,
        border: '1px solid #e0e0e0',
        borderTop: 'none' /* верхнюю границу даст шапка */
      }}>
        {/* Шапка дней недели */}
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, idx) => (
          <Box
            key={day}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '0.75rem',
              backgroundColor: idx >= 5 ? '#ffe0e0' : '#f0f2f5',
              borderRight: idx === 6 ? 'none' : '1px solid #e0e0e0',
              borderTop: '1px solid #e0e0e0',
              borderBottom: '1px solid #d0d0d0'
            }}
          >
            {day}
          </Box>
        ))}

        {/* Дни месяца */}
        {days.map((date, index) => {
          const dayTasks = getTasksForDay(date);
          const isToday = isSameDay(date, new Date());
          const isWeekend = date.getDay() === 6 || date.getDay() === 0;
          const isOtherMonth = !isSameMonth(date, currentDate);
          const hasTasks = dayTasks.length > 0;

          return (
            <Box
              key={index}
              onClick={() => handleDateClick(date)}
              sx={{
                p: 0.5,
                backgroundColor: isToday
                  ? '#eaf6ff'
                  : isOtherMonth
                  ? '#fafafa'
                  : hasTasks
                  ? '#e6f4ff'
                  : isWeekend
                  ? '#fff5f5'
                  : 'background.paper',
                borderRight: (index % 7 === 6) ? 'none' : '1px solid #e0e0e0',
                borderBottom: '1px solid #e0e0e0',
                position: 'relative',
                cursor: 'pointer',
                '&:hover': { backgroundColor: 'action.hover' },
                color: isOtherMonth ? 'text.disabled' : 'text.primary'
              }}
            >
              <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                {format(date, 'd')}
              </Typography>
              {dayTasks.length > 0 && (
                <Typography variant="caption" sx={{ position: 'absolute', bottom: 4, right: 4, fontSize: '0.65rem', color: 'text.secondary' }}>
                  {dayTasks.length}
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>

      {dateEventsDialogOpen && selectedDate && (
        <DateEventsDialog
          open={dateEventsDialogOpen}
          onClose={handleDateEventsDialogClose}
          date={selectedDate}
          tasks={tasks}
          onDeleteTask={handleDeleteTask}
          onAddTask={handleAddTaskClick}
          onEditTask={handleEditTaskClick}
        />
      )}

      {taskFormOpen && (
        <CalendarTaskForm
          open={taskFormOpen}
          onClose={handleTaskFormClose}
          onTaskCreated={handleTaskCreated}
          initialDate={selectedDate}
          taskToEdit={editingTask}
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