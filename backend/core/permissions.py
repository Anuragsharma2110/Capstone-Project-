from rest_framework.permissions import BasePermission

class IsLearner(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'LEARNER'

class IsProfessor(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'PROFESSOR'

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADMIN'
