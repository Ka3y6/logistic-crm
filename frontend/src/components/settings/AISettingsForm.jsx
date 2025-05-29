import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  InputAdornment,
} from '@mui/material';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';

const AISettingsForm = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    api_key: '',
    model: 'google/gemini-flash-1.5-8b',
    base_url: 'https://openrouter.ai/api/v1',
    max_tokens: 500,
    temperature: 0.7,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ai-assistant/settings/current/');
      if (response.data) {
        setSettings(response.data);
      }
    } catch (err) {
      setError('Ошибка при загрузке настроек');
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const response = await api.post('/ai-assistant/settings/', settings);
      if (response.data) {
        setSuccess(true);
        setSettings(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при сохранении настроек');
      console.error('Error saving settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSliderChange = (name) => (event, newValue) => {
    setSettings(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  if (loading && !settings.api_key) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Настройки AI ассистента
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Настройки успешно сохранены
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="API ключ"
            name="api_key"
            value={settings.api_key}
            onChange={handleChange}
            fullWidth
            required
            type="password"
          />

          <TextField
            label="Модель"
            name="model"
            value={settings.model}
            onChange={handleChange}
            fullWidth
            required
          />

          <TextField
            label="Базовый URL"
            name="base_url"
            value={settings.base_url}
            onChange={handleChange}
            fullWidth
            required
          />

          <Box>
            <Typography gutterBottom>
              Максимальное количество токенов: {settings.max_tokens}
            </Typography>
            <Slider
              value={settings.max_tokens}
              onChange={handleSliderChange('max_tokens')}
              min={100}
              max={2000}
              step={100}
              marks={[
                { value: 100, label: '100' },
                { value: 1000, label: '1000' },
                { value: 2000, label: '2000' },
              ]}
            />
          </Box>

          <Box>
            <Typography gutterBottom>
              Температура: {settings.temperature}
            </Typography>
            <Slider
              value={settings.temperature}
              onChange={handleSliderChange('temperature')}
              min={0}
              max={1}
              step={0.1}
              marks={[
                { value: 0, label: '0' },
                { value: 0.5, label: '0.5' },
                { value: 1, label: '1' },
              ]}
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Сохранить настройки'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default AISettingsForm; 