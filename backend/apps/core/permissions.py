from rest_framework.permissions import BasePermission, SAFE_METHODS


class CanValidateLeaveRequest(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True

        if not request.user.is_authenticated:
            return False

        if hasattr(request, "data"):
            req_data = request.data
        else:
            req_data = getattr(request, "POST", {})
            if not req_data and getattr(request, "body", None):
                import json
                try:
                    req_data = json.loads(request.body.decode("utf-8"))
                except Exception:
                    req_data = {}

        new_statut = req_data.get("statut") if isinstance(req_data, dict) else None
        employee_profile = getattr(request.user, "employee_profile", None)

        if new_statut == "annule" and employee_profile and obj.employee_id == employee_profile.id:
            return obj.statut == "en_attente"

        if request.user.role in ["admin_rh", "superadmin"]:
            return True

        if employee_profile is None or request.user.role != "manager":
            return False

        return obj.employee.manager_id == employee_profile.id


class IsAdminOrManagerOrReadOnly(BasePermission):
    """
    Autorise la lecture (GET, HEAD, OPTIONS) à tout utilisateur authentifié.
    Autorise l'écriture (POST, PUT, PATCH, DELETE) uniquement aux rôles
    admin_rh, manager et superadmin.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        return request.user.is_authenticated and request.user.role in ["admin_rh", "manager", "superadmin"]


class IsAdminOrOwnManagerOrReadOnly(BasePermission):
    """
    Lecture libre pour tous. Écriture autorisée à admin_rh/superadmin
    sans restriction, et aux managers UNIQUEMENT sur les objets liés
    à leurs propres subordonnés.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role in ["admin_rh", "manager", "superadmin"]

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True

        if not request.user.is_authenticated:
            return False

        if request.user.role in ["admin_rh", "superadmin"]:
            return True

        employee_profile = getattr(request.user, "employee_profile", None)
        if employee_profile is None:
            return False

        return obj.employee.manager_id == employee_profile.id


class IsEmployeeSelfOrAdminOrManagerOrReadOnly(BasePermission):
    """
    Les employés peuvent créer ou modifier leurs propres demandes de congé.
    Les managers et admins peuvent gérer les demandes de leurs équipes.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        if not request.user.is_authenticated:
            return False

        if request.user.role in ["admin_rh", "manager", "superadmin"]:
            return True

        return getattr(request.user, "employee_profile", None) is not None

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True

        if not request.user.is_authenticated:
            return False

        if request.user.role in ["admin_rh", "superadmin"]:
            return True

        employee_profile = getattr(request.user, "employee_profile", None)
        if employee_profile is None:
            return False

        if request.user.role == "manager":
            return obj.employee.manager_id == employee_profile.id

        return obj.employee_id == employee_profile.id


class IsAdminOnlyOrReadOnly(BasePermission):
    """
    Lecture libre pour tous. Écriture réservée à admin_rh et superadmin
    uniquement — même un manager n'y a pas accès. Utilisé pour les
    données de paie, les plus sensibles de l'application.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        return request.user.role in ["admin_rh", "superadmin"]