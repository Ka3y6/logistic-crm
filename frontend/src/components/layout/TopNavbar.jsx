import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext';
import {
  AppBar,
  Toolbar,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Typography
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
} from '@mui/icons-material';
import './TopNavbar.css';

const DRAWER_WIDTH = 240;

function TopNavbar({ onSidebarToggle, open }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme: customTheme } = useCustomTheme();

  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationsMenuOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsMenuClose = () => {
    setNotificationsAnchorEl(null);
  };

  const handleProfileClick = () => {
    handleMenuClose();
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    handleMenuClose();
    navigate('/settings');
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  return (
    <AppBar
      position="fixed"
      className="top-navbar"
      sx={{
        width: { sm: `calc(100% - ${open ? DRAWER_WIDTH : 0}px)` },
        ml: { sm: open ? `${DRAWER_WIDTH}px` : 0 },
        zIndex: (theme) => theme.zIndex.drawer + 1,
        transition: (theme) => theme.transitions.create(['margin', 'width'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        backgroundColor: customTheme.topbar?.backgroundColor || '#fff',
        color: customTheme.topbar?.textColor || '#2A3042',
        '& .MuiIconButton-root': {
          color: customTheme.topbar?.iconColor || '#666666',
        },
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onSidebarToggle}
          sx={{ mr: 2, display: { sm: 'block' } }}
        >
          {open ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{ display: 'flex' }}>
          <IconButton
            size="large"
            aria-label="show notifications"
            color="inherit"
            onClick={handleNotificationsMenuOpen}
            sx={{ color: customTheme.topbar?.iconColor || '#666666' }}
          >
            <Badge badgeContent={4} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="primary-search-account-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
            sx={{ color: customTheme.topbar?.iconColor || '#666666' }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: customTheme.sidebar?.borderColor }}>
              {user?.name?.[0] || <PersonIcon />}
            </Avatar>
          </IconButton>
        </Box>
      </Toolbar>
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        id="primary-search-account-menu"
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            backgroundColor: customTheme.main?.cardBackground || '#fff',
            color: customTheme.main?.textColor || '#333333',
          },
        }}
      >
        <MenuItem onClick={handleProfileClick}>
          <PersonIcon sx={{ mr: 2, color: customTheme.topbar?.iconColor || '#666666' }} />
          <Typography sx={{ color: customTheme.topbar?.textColor || '#2A3042' }}>Профиль</Typography>
        </MenuItem>
        <MenuItem onClick={handleSettingsClick}>
          <SettingsIcon sx={{ mr: 2, color: customTheme.topbar?.iconColor || '#666666' }} />
          <Typography sx={{ color: customTheme.topbar?.textColor || '#2A3042' }}>Настройки</Typography>
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 2, color: customTheme.topbar?.iconColor || '#666666' }} />
          <Typography sx={{ color: customTheme.topbar?.textColor || '#2A3042' }}>Выйти</Typography>
        </MenuItem>
      </Menu>
      <Menu
        anchorEl={notificationsAnchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        id="notifications-menu"
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(notificationsAnchorEl)}
        onClose={handleNotificationsMenuClose}
        PaperProps={{
          sx: {
            backgroundColor: customTheme.main?.cardBackground || '#fff',
            color: customTheme.main?.textColor || '#333333',
          },
        }}
      >
        <MenuItem>
          <Typography>Нет новых уведомлений</Typography>
        </MenuItem>
      </Menu>
    </AppBar>
  );
}

export default TopNavbar; 