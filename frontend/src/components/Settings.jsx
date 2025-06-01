import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    FormControl,
    InputLabel,
    TextField,
    Button,
    Snackbar,
    Alert,
    Divider,
    Select,
    MenuItem,
    Slider,
    FormControlLabel,
    Switch
} from '@mui/material';
import { ChromePicker } from 'react-color';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';

const Settings = () => {
    const { theme, updateTheme } = useTheme();
    const { user } = useAuth();
    const [localTheme, setLocalTheme] = useState(theme);
    const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' });
    const [colorPicker, setColorPicker] = React.useState({
        open: false,
        target: null,
        color: '#000000'
    });

    const fontFamilyList = [
        'Roboto', // Хорошо читаемый кириллический шрифт
        'Open Sans', // Популярный кириллический шрифт
        'Montserrat', // Современный кириллический шрифт
        'PT Sans', // Специально разработан для кириллицы
        'Roboto Condensed', // Узкий вариант Roboto
        'Ubuntu', // Хорошая поддержка кириллицы
        'Noto Sans', // Отличная поддержка кириллицы
        'Fira Sans', // Современный шрифт с хорошей кириллицей
        'Rubik', // Современный геометрический шрифт
        'Exo 2', // Современный техно-шрифт
        // Новые стильные шрифты
        'Bad Script', // Красивый рукописный шрифт
        'Cormorant', // Элегантный шрифт с засечками
        'El Messiri', // Арабский стиль с кириллицей
        'Neucha', // Ручной шрифт
        'Pacifico', // Ручной шрифт с характером
        'Playfair Display', // Элегантный шрифт с засечками
        'Press Start 2P', // Пиксельный шрифт
        'Russo One', // Мощный техно-шрифт
        'Tenor Sans', // Элегантный шрифт без засечек
        'Yanone Kaffeesatz' // Стильный шрифт с характером
    ];

    useEffect(() => {
        setLocalTheme(theme);
    }, [theme]);

    const handleChange = (section, field, value) => {
        const newTheme = {
            ...localTheme,
            [section]: {
                ...localTheme[section],
                [field]: value
            }
        };
        setLocalTheme(newTheme);
        updateTheme(newTheme);
    };

    const handleColorChange = (color) => {
        if (colorPicker.target) {
            const [section, field] = colorPicker.target.split('.');
            handleChange(section, field, color.hex);
        }
    };

    const handleSave = async () => {
        if (!user) {
            setSnackbar({
                open: true,
                message: 'Для сохранения настроек необходимо авторизоваться',
                severity: 'warning'
            });
            return;
        }

        try {
            await api.put('/user-settings/update_settings/', {
                theme_settings: localTheme
            });
            setSnackbar({
                open: true,
                message: 'Настройки успешно сохранены',
                severity: 'success'
            });
        } catch (error) {
            console.error('Ошибка при сохранении настроек:', error);
            setSnackbar({
                open: true,
                message: 'Ошибка при сохранении настроек',
                severity: 'error'
            });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Настройки темы
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                        Цвета боковой панели
                    </Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <TextField
                            type="color"
                            label="Фоновый цвет"
                            value={localTheme.sidebar?.backgroundColor || '#2A3042'}
                            onChange={(e) => handleChange('sidebar', 'backgroundColor', e.target.value)}
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <TextField
                            type="color"
                            label="Цвет текста"
                            value={localTheme.sidebar?.textColor || '#FFFFFF'}
                            onChange={(e) => handleChange('sidebar', 'textColor', e.target.value)}
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <TextField
                            type="color"
                            label="Цвет иконок"
                            value={localTheme.sidebar?.iconColor || '#FFFFFF'}
                            onChange={(e) => handleChange('sidebar', 'iconColor', e.target.value)}
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <TextField
                            type="color"
                            label="Цвет выделения"
                            value={localTheme.sidebar?.selectedColor || 'rgba(255, 255, 255, 0.1)'}
                            onChange={(e) => handleChange('sidebar', 'selectedColor', e.target.value)}
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={localTheme.sidebar?.logoColor === '#FFFFFF'}
                                    onChange={(e) => handleChange('sidebar', 'logoColor', e.target.checked ? '#FFFFFF' : '#000000')}
                                />
                            }
                            label="Белый логотип"
                        />
                    </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                        Цвета верхней панели
                    </Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <TextField
                            type="color"
                            label="Фоновый цвет"
                            value={localTheme.topbar?.backgroundColor || '#ffffff'}
                            onChange={(e) => handleChange('topbar', 'backgroundColor', e.target.value)}
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <TextField
                            type="color"
                            label="Цвет текста"
                            value={localTheme.topbar?.textColor || '#000000'}
                            onChange={(e) => handleChange('topbar', 'textColor', e.target.value)}
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <TextField
                            type="color"
                            label="Цвет иконок"
                            value={localTheme.topbar?.iconColor || '#666666'}
                            onChange={(e) => handleChange('topbar', 'iconColor', e.target.value)}
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />
                    </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                        Цвета карточек и контента
                    </Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <TextField
                            type="color"
                            label="Фоновый цвет карточек"
                            value={localTheme.main?.cardBackground || '#ffffff'}
                            onChange={(e) => handleChange('main', 'cardBackground', e.target.value)}
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <TextField
                            type="color"
                            label="Основной цвет"
                            value={localTheme.main?.primaryColor || '#1976d2'}
                            onChange={(e) => handleChange('main', 'primaryColor', e.target.value)}
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <TextField
                            type="color"
                            label="Цвет текста"
                            value={localTheme.main?.textColor || '#333333'}
                            onChange={(e) => handleChange('main', 'textColor', e.target.value)}
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <TextField
                            type="color"
                            label="Цвет фона"
                            value={localTheme.main?.backgroundColor || '#f5f5f5'}
                            onChange={(e) => handleChange('main', 'backgroundColor', e.target.value)}
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <TextField
                            type="color"
                            label="Цвет границ"
                            value={localTheme.main?.borderColor || '#e0e0e0'}
                            onChange={(e) => handleChange('main', 'borderColor', e.target.value)}
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />
                    </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                        Настройки шрифта
                    </Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Семейство шрифтов</InputLabel>
                        <Select
                            value={localTheme.font?.family || 'Inter'}
                            onChange={(e) => handleChange('font', 'family', e.target.value)}
                            MenuProps={{
                                PaperProps: {
                                    style: {
                                        maxHeight: 300
                                    }
                                }
                            }}
                        >
                            {fontFamilyList.map((font) => (
                                <MenuItem
                                    key={font}
                                    value={font}
                                    style={{ fontFamily: font }}
                                >
                                    {font}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <Typography gutterBottom>Размер шрифта</Typography>
                        <Slider
                            value={parseInt(localTheme.font?.size || '16')}
                            onChange={(e, value) => handleChange('font', 'size', `${value}px`)}
                            min={12}
                            max={24}
                            step={1}
                            marks={[
                                { value: 12, label: '12px' },
                                { value: 16, label: '16px' },
                                { value: 20, label: '20px' },
                                { value: 24, label: '24px' }
                            ]}
                        />
                    </FormControl>
                </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSave}
                >
                    Сохранить настройки
                </Button>
            </Box>

            {colorPicker.open && (
                <Box sx={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000 }}>
                    <Box sx={{ position: 'relative' }}>
                        <ChromePicker
                            color={colorPicker.color}
                            onChange={handleColorChange}
                        />
                        <Button
                            variant="contained"
                            onClick={() => setColorPicker({ ...colorPicker, open: false })}
                            sx={{ mt: 2, width: '100%' }}
                        >
                            Закрыть
                        </Button>
                    </Box>
                </Box>
            )}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Settings; 