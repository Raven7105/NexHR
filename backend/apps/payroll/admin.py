from django.contrib import admin
from .models import PayrollSetting, Payslip

# Register your models here.

@admin.register(PayrollSetting)
class PayrollSettingAdmin(admin.ModelAdmin):
    list_display = ("company", "date_effet", "taux_cnss_salariale", "taux_cnss_patronale")


@admin.register(Payslip)
class PayslipAdmin(admin.ModelAdmin):
    list_display = ("employee", "mois", "annee", "salaire_brut", "salaire_net", "statut")
    list_filter = ("statut", "annee", "mois")
    search_fields = ("employee__user__first_name", "employee__user__last_name")

