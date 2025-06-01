import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import logger from '../utils/logger';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [networkError, setNetworkError] = useState(false);
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('autoLogin');
      setUser(null);
      setError(null);
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }, [navigate]);

  const validateToken = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      api.defaults.headers.common['Authorization'] = token;
      logger.info('Sending request with token:', token);
      
      const response = await api.get('/validate-token/');
      logger.info('Token validation response:', response.data);
      
      if (response.data.valid) {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch (error) {
            logger.error('Error parsing saved user:', error);
            handleLogout();
          }
        }
      } else {
        logger.warning('Token validation failed');
        handleLogout();
      }
    } catch (err) {
      logger.error('Token validation error:', err);
      if (err.response?.status === 401) {
        handleLogout();
      } else if (!err.response) {
        setNetworkError(true);
      }
    } finally {
      setLoading(false);
    }
  }, [handleLogout]);

  useEffect(() => {
    validateToken();
  }, [validateToken]);

  const login = async (email, password, rememberMe = false) => {
    try {
      setLoading(true);
      setError(null);
      setNetworkError(false);
      
      const response = await api.post('/api/login/', {
        email,
        password,
        remember_me: rememberMe
      });
      
      const { token, user } = response.data;
      
      if (!token || !user) {
        throw new Error('Invalid response from server');
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      if (rememberMe) {
        localStorage.setItem('autoLogin', 'true');
      }
      
      api.defaults.headers.common['Authorization'] = `Token ${token}`;
      logger.info('Login successful, token set:', token);
      
      setUser(user);
      setError(null);
      
      navigate('/dashboard');
      return true;
    } catch (err) {
      if (!err.response) {
        setNetworkError(true);
        setError('Ошибка сети. Проверьте подключение к интернету.');
      } else if (err.response.status === 401) {
        setError('Неверный email или пароль');
      } else {
        setError(err.response?.data?.message || 'Ошибка авторизации');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    handleLogout();
  }, [handleLogout]);

  const updateUser = useCallback((newUserData) => {
    try {
      setUser(newUserData);
      localStorage.setItem('user', JSON.stringify(newUserData));
    } catch (error) {
      console.error('Error updating user:', error);
    }
  }, []);

  const resetPassword = async (email) => {
    try {
      setLoading(true);
      setError(null);
      setNetworkError(false);
      
      await api.post('/password-reset/', { email });
      return true;
    } catch (err) {
      if (!err.response) {
        setNetworkError(true);
        setError('Ошибка сети. Проверьте подключение к интернету.');
      } else {
        setError(err.response?.data?.message || 'Ошибка при сбросе пароля');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  if (!children) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      networkError,
      login, 
      logout, 
      updateUser,
      resetPassword 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider; 