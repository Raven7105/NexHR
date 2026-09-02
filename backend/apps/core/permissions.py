# pyright: reportIncompatibleMethodOverride=false
from rest_framework.permissions import BasePermission, SAFE_METHODS


class CanValidateLeaveRequest(BasePermission):
    def has_permission(self, request, view) -> bool:
        if request.method in SAFE_METHODS:
            return True

        return bool(request.user.is_authenticated)

    def has_object_permission(self, request, view, obj) -> bool:
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
            return bool(obj.statut == "en_attente")

        if request.user.role in ["responsable_rh", "admin_rh", "superadmin"]:
            return True

        if employee_profile is None or request.user.role != "manager":
            return False

        return bool(obj.employee.manager_id == employee_profile.id)


class IsAdminOrManagerOrReadOnly(BasePermission):
    def has_permission(self, request, view) -> bool:
        if request.method in SAFE_METHODS:
            return True

        return bool(request.user.is_authenticated and request.user.role in ["responsable_rh", "admin_rh", "manager", "pdg", "superadmin"])


class IsAdminOrOwnManagerOrReadOnly(BasePermission):
    def has_permission(self, request, view) -> bool:
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user.is_authenticated and request.user.role in ["responsable_rh", "admin_rh", "manager", "pdg", "superadmin"])

    def has_object_permission(self, request, view, obj) -> bool:
        if request.method in SAFE_METHODS:
            return True

        if not request.user.is_authenticated:
            return False

        if request.user.role in ["responsable_rh", "admin_rh", "pdg", "superadmin"]:
            return True

        employee_profile = getattr(request.user, "employee_profile", None)
        if employee_profile is None:
            return False

        return bool(obj.employee.manager_id == employee_profile.id)


class IsEmployeeSelfOrAdminOrManagerOrReadOnly(BasePermission):
    def has_permission(self, request, view) -> bool:
        if request.method in SAFE_METHODS:
            return True

        if not request.user.is_authenticated:
            return False

        if request.user.role in ["responsable_rh", "admin_rh", "manager", "pdg", "superadmin"]:
            return True

        return getattr(request.user, "employee_profile", None) is not None

    def has_object_permission(self, request, view, obj) -> bool:
        if request.method in SAFE_METHODS:
            return True

        if not request.user.is_authenticated:
            return False

        if request.user.role in ["responsable_rh", "admin_rh", "pdg", "superadmin"]:
            return True

        employee_profile = getattr(request.user, "employee_profile", None)
        if employee_profile is None:
            return False

        if request.user.role == "manager":
            return bool(obj.employee.manager_id == employee_profile.id)

        return bool(obj.employee_id == employee_profile.id)


class IsAdminOnlyOrReadOnly(BasePermission):
    def has_permission(self, request, view) -> bool:
        if request.method in SAFE_METHODS:
            return True

        return request.user.role in ["responsable_rh", "admin_rh", "pdg", "superadmin"]