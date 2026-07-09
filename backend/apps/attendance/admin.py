from django.contrib import admin
from .models import Holiday, Attendance

# Register your models here.

@admin.register(Holiday)
class HolidayAdmin(admin.ModelAdmin):
    list_display = ("nom", "date", "company", "recurrent")
    list_filter = ("company", "recurrent")

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ("employee", "date", "heure_arrivee", "heure_depart", "statut", "methode_pointage")
    list_filter = ("statut", "methode_pointage")
    search_fields = ("employee__user__first_name", "employee__user__last_name", "employee__matricule")