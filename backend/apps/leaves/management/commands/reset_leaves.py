from django.core.management.base import BaseCommand
from apps.leaves.models import LeaveRequest, LeaveBalance

class Command(BaseCommand):
    help = "Réinitialise toutes les données de congés (suppression des demandes et remise à 0 des jours utilisés)"

    def handle(self, *args, **options):
        deleted_count, _ = LeaveRequest.objects.all().delete()
        updated_balances = LeaveBalance.objects.all().update(jours_utilises=0)

        self.stdout.write(
            self.style.SUCCESS(
                f"Réinitialisation réussie !\n"
                f"- Demandes de congés supprimées : {deleted_count}\n"
                f"- Soldes réinitialisés (0 jours utilisés) : {updated_balances}"
            )
        )
