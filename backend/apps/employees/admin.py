from django.contrib import admin
from .models import Department, Employee, EmployeeHistory


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("nom", "company", "manager")


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ("matricule", "user", "company", "department", "poste", "statut")
    list_filter = ("company", "department", "statut", "type_contrat")
    search_fields = ("matricule", "user__first_name", "user__last_name", "poste")


@admin.register(EmployeeHistory)
class EmployeeHistoryAdmin(admin.ModelAdmin):
    list_display = ("employee", "field", "change_date", "old_value", "new_value", "company", "created_by")
    list_filter = ("company", "field", "change_date")
    search_fields = ("employee__user__first_name", "employee__user__last_name", "reason", "old_value", "new_value")
