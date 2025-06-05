import React, { useState, useEffect, useCallback } from 'react';
import { Box, TextField, Button, Typography, Switch, FormControlLabel, Grid, CircularProgress, Alert } from '@mui/material';
import api from '../../api/api'; // Убедитесь, что путь к api правильный

const EmailSettingsForm = () => {
    const [settings, setSettings] = useState({
        email_integration_enabled: false,
        imap_host: '',
        imap_port: '',
        imap_user: '',
        smtp_host: '',
        smtp_port: '',
        smtp_user: '',
    });
    // Отдельные состояния для паролей, чтобы не хранить их в основном состоянии
    const [imapPassword, setImapPassword] = useState('');
    const [smtpPassword, setSmtpPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const response = await api.get('/profile/email-settings/');
            setSettings({
                email_integration_enabled: response.data.email_integration_enabled || false,
                imap_host: response.data.imap_host || '',
                imap_port: response.data.imap_port || '',
                imap_user: response.data.imap_user || '',
                smtp_host: response.data.smtp_host || '',
                smtp_port: response.data.smtp_port || '',
                smtp_user: response.data.smtp_user || '',
            });
            // Пароли не загружаем, поля будут пустыми
            setImapPassword('');
            setSmtpPassword('');
        } catch (err) {
            console.error("Ошибка загрузки настроек почты:", err);
            setError('Не удалось загрузить настройки почты. Попробуйте позже.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        setSettings(prevSettings => ({
            ...prevSettings,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSave = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        const dataToSend = { ...settings };

        // Добавляем пароли, только если они были введены (не пустые строки)
        if (imapPassword) {
            dataToSend.imap_password = imapPassword;
        }
        if (smtpPassword) {
            dataToSend.smtp_password = smtpPassword;
        }

        try {
            await api.put('/profile/email-settings/', dataToSend);
            setSuccess('Настройки успешно сохранены.');
            // Очищаем поля паролей после успешного сохранения
            setImapPassword('');
            setSmtpPassword('');
        } catch (err) {
            console.error("Ошибка сохранения настроек почты:", err);
            setError(`Не удалось сохранить настройки. ${err.response?.data?.error || 'Проверьте введенные данные и попробуйте снова.'}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <CircularProgress />;
    }

    return (
        <Box component="form" onSubmit={handleSave} sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
                Настройки интеграции с почтой
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <FormControlLabel
                control={
                    <Switch
                        checked={settings.email_integration_enabled}
                        onChange={handleChange}
                        name="email_integration_enabled"
                    />
                }
                label="Включить интеграцию с почтой"
                sx={{ mb: 2 }}
            />

            {settings.email_integration_enabled && (
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle1" gutterBottom>IMAP (для получения писем)</Typography>
                        <TextField
                            label="IMAP Хост"
                            name="imap_host"
                            value={settings.imap_host}
                            onChange={handleChange}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="IMAP Порт"
                            name="imap_port"
                            type="number"
                            value={settings.imap_port}
                            onChange={handleChange}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="IMAP Пользователь (Email)"
                            name="imap_user"
                            type="email"
                            value={settings.imap_user}
                            onChange={handleChange}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="IMAP Пароль"
                            name="imap_password"
                            type="password"
                            value={imapPassword} // Используем отдельное состояние
                            onChange={(e) => setImapPassword(e.target.value)}
                            fullWidth
                            margin="normal"
                            helperText="Введите пароль только если хотите его изменить"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle1" gutterBottom>SMTP (для отправки писем)</Typography>
                         <TextField
                            label="SMTP Хост"
                            name="smtp_host"
                            value={settings.smtp_host}
                            onChange={handleChange}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="SMTP Порт"
                            name="smtp_port"
                            type="number"
                            value={settings.smtp_port}
                            onChange={handleChange}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="SMTP Пользователь (Email)"
                            name="smtp_user"
                            type="email"
                            value={settings.smtp_user}
                            onChange={handleChange}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="SMTP Пароль"
                            name="smtp_password"
                            type="password"
                            value={smtpPassword} // Используем отдельное состояние
                            onChange={(e) => setSmtpPassword(e.target.value)}
                            fullWidth
                            margin="normal"
                            helperText="Введите пароль только если хотите его изменить"
                        />
                    </Grid>
                </Grid>
            )}

            <Button
                type="submit"
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={saving || loading}
            >
                {saving ? <CircularProgress size={24} /> : 'Сохранить настройки почты'}
            </Button>
        </Box>
    );
};

export default EmailSettingsForm; 