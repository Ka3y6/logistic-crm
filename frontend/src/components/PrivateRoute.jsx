import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
    const { user, loading } = useAuth();
    const location = useLocation();
    
    console.log('PrivateRoute - Current path:', location.pathname);
    console.log('PrivateRoute - User:', user);
    console.log('PrivateRoute - Allowed roles:', allowedRoles);

    // Показываем загрузку
    if (loading) {
        console.log('PrivateRoute - Loading...');
        return <div>Loading...</div>;
    }

    // Проверяем наличие пользователя
    if (!user) {
        console.log('PrivateRoute - No user found, redirecting to login');
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    // Проверяем наличие роли
    if (!user.role) {
        console.error('PrivateRoute - User has no role:', user);
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    // Приводим роли к нижнему регистру для сравнения
    const userRole = user.role.toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());
    
    console.log('PrivateRoute - User role (normalized):', userRole);
    console.log('PrivateRoute - Allowed roles (normalized):', normalizedAllowedRoles);
    
    // Если роли не указаны, просто проверяем аутентификацию
    if (normalizedAllowedRoles.length === 0) {
        console.log('PrivateRoute - No roles specified, allowing access');
        return children;
    }

    // Проверяем соответствие роли
    const hasAllowedRole = normalizedAllowedRoles.includes(userRole);
    console.log('PrivateRoute - Has allowed role:', hasAllowedRole);

    if (!hasAllowedRole) {
        console.error('PrivateRoute - Access denied for role:', userRole);
        console.error('PrivateRoute - Required roles:', normalizedAllowedRoles);
        return <Navigate to="/unauthorized" state={{ 
            from: location.pathname,
            userRole: userRole,
            requiredRoles: normalizedAllowedRoles
        }} replace />;
    }

    console.log('PrivateRoute - Access granted for role:', userRole);
    return children;
};

export default PrivateRoute; 