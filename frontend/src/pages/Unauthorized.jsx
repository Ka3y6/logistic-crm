import React from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Unauthorized() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const state = location.state || {};
  const { from, userRole, requiredRoles } = state;

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoToDashboard = () => {
    if (user?.role?.toLowerCase() === 'admin') {
      navigate('/dashboard');
    } else if (user?.role?.toLowerCase() === 'manager') {
      navigate('/dashboard/manager');
    } else if (user?.role?.toLowerCase() === 'client') {
      navigate('/dashboard/client');
    } else {
      navigate('/login');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Typography variant="h1" component="h1" gutterBottom>
          403
        </Typography>
        <Typography variant="h4" component="h2" gutterBottom>
          Доступ запрещен
        </Typography>
        
        <Paper elevation={3} sx={{ p: 3, width: '100%', mb: 3 }}>
          <Typography variant="body1" color="text.secondary" paragraph>
            {user ? (
              <>
                У вас нет необходимых прав для доступа к этой странице.
                {from && <><br />Запрошенная страница: {from}</>}
                {userRole && <><br />Ваша роль: {userRole}</>}
                {requiredRoles && requiredRoles.length > 0 && (
                  <><br />Требуемые роли: {requiredRoles.join(', ')}</>
                )}
              </>
            ) : (
              'Пожалуйста, войдите в систему для доступа к этой странице.'
            )}
          </Typography>
        </Paper>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handleGoBack}
          >
            Назад
          </Button>
          {user ? (
            <Button
              variant="contained"
              onClick={handleGoToDashboard}
              color="primary"
            >
              На панель управления
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={() => navigate('/login')}
              color="primary"
            >
              Войти
            </Button>
          )}
        </Box>
      </Box>
    </Container>
  );
}

export default Unauthorized; 