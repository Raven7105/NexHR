from django.contrib import admin
from .models import LeaveType, LeaveBalance, LeaveRequest
# Register your models here.

@admin.register(LeaveType)
class LeaveTypeAdmin(admin.ModelAdmin):
    list_display = ("nom", "company", "jours_par_an")
    

@admin.register(LeaveBalance)
class LeaveBalanceAdmin(admin.ModelAdmin):
    list_display = ("employee", "leave_type", "annee", "jours_alloues", "jours_utilises")
    list_filter = ("annee", "leave_type")

@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ("employee", "leave_type", "date_debut", "date_fin", "statut")
    list_filter = ("statut", "leave_type")