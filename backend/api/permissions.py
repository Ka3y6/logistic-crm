from rest_framework import permissions
from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'role', None) == 'admin')

class IsManager(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'role', None) == 'manager')

class IsAdminOrManager(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'role', None) in ['admin', 'manager'])

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        # Проверяем, что пользователь аутентифицирован и имеет роль admin
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'role', None) == 'admin')

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        # Проверяем, что пользователь аутентифицирован и имеет роль admin
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'role', None) == 'admin')