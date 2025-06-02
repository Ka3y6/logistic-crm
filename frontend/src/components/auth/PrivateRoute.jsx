import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import api from '../../api/api';

const PrivateRoute = ({ children, allowedRoles }) => {
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const validate = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsValid(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get('validate-token/');
        const serverRole = response.data.user.role.toLowerCase();
        
        if (allowedRoles.includes(serverRole)) {
          setIsValid(true);
        } else {
          setIsValid(false);
          localStorage.removeItem('token');
        }
      } catch (err) {
        if (err.response?.status === 403) {
          localStorage.removeItem('token');
        }
        setIsValid(false);
      } finally {
        setIsLoading(false);
      }
    };
    validate();
  }, [allowedRoles, location]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }
  
  return isValid ? children : (
    <Navigate 
      to="/login" 
      state={{ from: location }} 
      replace 
    />
  );
};

export default PrivateRoute;