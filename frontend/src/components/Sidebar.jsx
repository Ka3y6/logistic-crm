import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemButton,
    Divider,
    Box,
    Typography,
    Avatar,
    Badge,
} from '@mui/material';
import {
    ShoppingCart as OrdersIcon,
    Person as PersonIcon,
    Logout as LogoutIcon,
    Settings as SettingsIcon,
} from '@mui/icons-material';
import Settings from './Settings';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const { theme: customTheme } = useTheme();

    const getRoleName = (role) => {
        const roles = {
            'admin': 'Администратор',
            'manager': 'Менеджер',
            'client': 'Клиент'
        };
        return roles[role] || role;
    };

    const getUserName = () => {
        if (user?.first_name && user?.last_name) {
            return `${user.first_name} ${user.last_name}`;
        }
        return user?.username || 'Пользователь';
    };

    const menuItems = [
        {
            path: '/orders',
            icon: <OrdersIcon />,
            label: 'Заказы',
        },
        {
            path: '/profile',
            icon: <PersonIcon />,
            label: 'Профиль',
        },
        {
            path: 'logout',
            icon: <LogoutIcon />,
            label: 'Выйти',
        },
    ];

    const handleMenuClick = (path) => {
        if (path === 'logout') {
            logout();
            navigate('/login');
        } else {
            navigate(path);
        }
    };

    const handleSettingsClick = () => {
        setSettingsOpen(true);
    };

    return (
        <>
            <Drawer
                variant="permanent"
                sx={{
                    width: 240,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: 240,
                        boxSizing: 'border-box',
                        backgroundColor: customTheme.sidebar?.backgroundColor,
                        color: customTheme.sidebar?.textColor,
                    },
                }}
            >
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                            <Box
                                sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: '#4CAF50',
                                    border: '2px solid white',
                                }}
                            />
                        }
                    >
                        <Avatar
                            sx={{
                                width: 40,
                                height: 40,
                                bgcolor: customTheme.sidebar?.borderColor,
                            }}
                        >
                            <PersonIcon />
                        </Avatar>
                    </Badge>
                    <Box sx={{ ml: 2 }}>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontWeight: 600,
                                color: customTheme.sidebar?.textColor,
                            }}
                        >
                            {getUserName()}
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                color: customTheme.sidebar?.textColor,
                                opacity: 0.7,
                            }}
                        >
                            {getRoleName(user?.role)}
                        </Typography>
                    </Box>
                </Box>
                <List>
                    {menuItems.map((item) => (
                        <ListItem key={item.path} disablePadding>
                            <ListItemButton
                                selected={location.pathname === item.path}
                                onClick={() => handleMenuClick(item.path)}
                                sx={{
                                    '&.Mui-selected': {
                                        backgroundColor: customTheme.sidebar?.selectedColor,
                                        borderLeft: `4px solid ${customTheme.sidebar?.borderColor}`,
                                    },
                                    '&:hover': {
                                        backgroundColor: customTheme.sidebar?.hoverColor,
                                    },
                                }}
                            >
                                <ListItemIcon sx={{ color: customTheme.sidebar?.textColor }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.label}
                                    sx={{ color: customTheme.sidebar?.textColor }}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                <ListItemButton
                    onClick={handleSettingsClick}
                    sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: customTheme.sidebar?.backgroundColor,
                        color: customTheme.sidebar?.textColor,
                        '&:hover': {
                            backgroundColor: customTheme.sidebar?.hoverColor,
                        },
                    }}
                >
                    <ListItemIcon sx={{ color: customTheme.sidebar?.textColor }}>
                        <SettingsIcon />
                    </ListItemIcon>
                    <ListItemText primary="Настройки" />
                </ListItemButton>
            </Drawer>
            <Settings
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
            />
        </>
    );
};

export default Sidebar; 