from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsLearner(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'LEARNER'


class IsProfessor(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'PROFESSOR'


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADMIN'


class IsAdminOrReadOnly(BasePermission):
    """Admin can write; any authenticated user can read."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role == 'ADMIN'


class IsProfessorOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('PROFESSOR', 'ADMIN')


class IsLearnerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('LEARNER', 'ADMIN')


class IsAdminOrProfessorReadOnly(BasePermission):
    """Admins have full access; Professors can only read."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.role == 'ADMIN':
            return True
        if request.user.role == 'PROFESSOR' and request.method in SAFE_METHODS:
            return True
        return False
