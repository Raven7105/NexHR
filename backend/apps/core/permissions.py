from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminOrManagerOrReadOnly(BasePermission):
    """
    Autorise la lecture (GET, HEAD, OPTIONS) à tout utilisateur authentifié.
    Autorise l'écriture (POST, PUT, PATCH, DELETE) uniquement aux rôles
    admin_rh, manager et super_admin.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        return request.user.role in ["admin_rh", "manager", "super_admin"]


class IsAdminOrOwnManagerOrReadOnly(BasePermission):
    """
    Lecture libre pour tous. Écriture autorisée à admin_rh/super_admin
    sans restriction, et aux managers UNIQUEMENT sur les objets liés
    à leurs propres subordonnés.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user.role in ["admin_rh", "manager", "super_admin"]

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True

        if request.user.role in ["admin_rh", "super_admin"]:
            return True

        employee_profile = getattr(request.user, "employee_profile", None)
        if employee_profile is None:
            return False

        return obj.employee.manager_id == employee_profile.id


class IsAdminOnlyOrReadOnly(BasePermission):
    """
    Lecture libre pour tous. Écriture réservée à admin_rh et super_admin
    uniquement — même un manager n'y a pas accès. Utilisé pour les
    données de paie, les plus sensibles de l'application.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        return request.user.role in ["admin_rh", "super_admin"]