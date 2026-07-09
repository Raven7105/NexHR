from django.contrib import admin
from .models import Department, Employee

# Register your models here.

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("nom", "company", "manager")

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ("matricule", "user", "company", "department", "poste", "statut")
    list_filter = ("company", "department", "statut", "type_contrat")
    search_fields = ("matricule", "user__first_name", "user__last_name", "poste")
