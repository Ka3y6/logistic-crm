from rest_framework import permissions
from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'admin'

class IsManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'manager'

class IsAdminOrManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ['admin', 'manager']