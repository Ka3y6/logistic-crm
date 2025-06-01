import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ShoppingCart as OrdersIcon,
  People as ClientsIcon,
  Description as DocumentsIcon,
  LocalShipping as CarriersIcon,
  AccountBalance as FinanceIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  CalendarToday as CalendarIcon,
  Chat as ChatIcon,
  Email as EmailIcon,
  SupervisorAccount as UsersIcon,
  Feedback as FeedbackIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext';
import logoImage from '../../assets/images/logo.png';

const DRAWER_WIDTH = 240;

function Sidebar({ isOpen }) {
  const location = useLocation();
  const { logout, user } = useAuth();
  const { theme: customTheme } = useCustomTheme();
  const navigate = useNavigate();

  console.log('Sidebar - Current user:', user);
  console.log('Sidebar - User role:', user?.role);

  const handleLogout = () => {
    logout();
  };

  const menuItems = [
    {
      text: 'Дашборд',
      icon: <DashboardIcon />,
      path: '/dashboard',
    },
    {
      text: 'Заказы',
      icon: <OrdersIcon />,
      path: '/orders',
    },
    {
      text: 'Клиенты',
      icon: <ClientsIcon />,
      path: '/clients',
    },
    {
      text: 'Перевозчики',
      icon: <CarriersIcon />,
      path: '/carriers',
    },
    {
      text: 'Пользователи',
      icon: <UsersIcon />,
      path: '/users',
      roles: ['admin'],
    },
    {
      text: 'Заявки с сайта',
      icon: <FeedbackIcon />,
      path: '/site-requests',
      roles: ['admin'],
    },
    {
      text: 'Календарь',
      icon: <CalendarIcon />,
      path: '/calendar',
    },
    {
      text: 'Чат',
      icon: <ChatIcon />,
      path: '/chat',
    },
    {
      text: 'Почта',
      icon: <EmailIcon />,
      path: '/email',
    },
    {
      text: 'Финансы',
      icon: <FinanceIcon />,
      path: '/finance',
    }
  ];

  return (
    <Drawer
      variant="permanent"
      open={isOpen}
      sx={{
        width: isOpen ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          backgroundColor: customTheme.sidebar?.backgroundColor || '#2A3042',
          color: customTheme.sidebar?.textColor || '#ffffff',
          borderRight: 'none',
          overflowX: 'hidden',
          transform: isOpen ? 'none' : `translateX(-${DRAWER_WIDTH}px)`,
          transition: (theme) => theme.transitions.create(['transform', 'width'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
          }),
          '& .MuiListItemIcon-root': {
            color: customTheme.sidebar?.textColor || '#ffffff',
            minWidth: '40px',
          },
          '& .MuiListItemText-root': {
            color: customTheme.sidebar?.textColor || '#ffffff',
            '& .MuiTypography-root': {
              fontSize: '0.9rem',
              fontWeight: 500,
              color: customTheme.sidebar?.textColor || '#ffffff',
            },
          },
          '& .MuiListItem-root': {
            marginBottom: '4px',
            borderRadius: '4px',
            margin: '0 8px',
            padding: '8px 16px',
            '&:hover': {
              backgroundColor: customTheme.sidebar?.selectedColor || 'rgba(255, 255, 255, 0.1)',
            },
            '&.Mui-selected': {
              backgroundColor: customTheme.sidebar?.selectedColor || 'rgba(255, 255, 255, 0.1)',
              borderLeft: `4px solid ${customTheme.sidebar?.borderColor || '#2196F3'}`,
              '&:hover': {
                backgroundColor: customTheme.sidebar?.selectedColor || 'rgba(255, 255, 255, 0.15)',
              },
            },
          },
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <img
            src={logoImage}
            alt="Logo"
            className="logo"
            style={{
              width: '180px',
              height: 'auto',
              maxWidth: '100%'
            }}
          />
        </Box>
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        <List sx={{ p: 1 }}>
          {menuItems
            .filter(item => {
              const shouldShow = !item.roles || (user && item.roles.includes(user.role?.toLowerCase()));
              if (item.text === 'Пользователи') {
                console.log('Sidebar - Users menu item:',
                  {
                    text: item.text,
                    roles: item.roles,
                    userRole: user?.role?.toLowerCase(),
                    shouldShow
                  }
                );
              }
              return shouldShow;
            })
            .map((item) => (
            <ListItem
              button
              component={Link}
              to={item.path}
              key={item.path}
              selected={location.pathname === item.path}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
        <Box sx={{ mt: 'auto', p: 2 }}>
          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
          <ListItem
            button
            onClick={() => navigate('/settings')}
            sx={{
              mt: 1,
              borderRadius: '4px',
              '&:hover': {
                backgroundColor: customTheme.sidebar?.hoverColor || 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Настройки" />
          </ListItem>
          <ListItem
            button
            onClick={handleLogout}
            sx={{
              mt: 1,
              borderRadius: '4px',
              '&:hover': {
                backgroundColor: customTheme.sidebar?.hoverColor || 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Выйти" />
          </ListItem>
        </Box>
      </Box>
    </Drawer>
  );
}

export default Sidebar; 