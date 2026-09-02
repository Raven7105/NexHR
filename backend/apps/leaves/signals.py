from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from .models import LeaveType, LeaveBalance
from apps.employees.models import Employee


@receiver(post_save, sender=LeaveType)
def auto_create_balances_for_new_leave_type(sender, instance, created, **kwargs):
    """
    Lorsqu'un nouveau type de congé est créé, initialiser automatiquement
    le solde pour tous les employés existants de l'entreprise pour l'année en cours.
    """
    if created and instance.company:
        current_year = timezone.now().year
        employees = Employee.objects.filter(
            company=instance.company,
            is_active=True,
            deleted_at__isnull=True
        ).exclude(user__role="pdg")

        for emp in employees:
            LeaveBalance.objects.get_or_create(
                employee=emp,
                leave_type=instance,
                annee=current_year,
                defaults={
                    "jours_alloues": instance.jours_par_an,
                    "jours_utilises": 0,
                }
            )


@receiver(post_save, sender=Employee)
def auto_create_balances_for_new_employee(sender, instance, created, **kwargs):
    """
    Lorsqu'un nouvel employé est créé (hors PDG), lui attribuer automatiquement
    ses soldes pour tous les types de congés actifs de l'entreprise pour l'année en cours.
    """
    if created and instance.company:
        if getattr(instance.user, "role", None) == "pdg":
            return

        current_year = timezone.now().year
        leave_types = LeaveType.objects.filter(company=instance.company)

        for lt in leave_types:
            LeaveBalance.objects.get_or_create(
                employee=instance,
                leave_type=lt,
                annee=current_year,
                defaults={
                    "jours_alloues": lt.jours_par_an,
                    "jours_utilises": 0,
                }
            )