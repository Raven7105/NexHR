import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.leaves.models import LeaveRequest, LeaveBalance, LeaveType

def reset_leaves_data():
    try:
        # 1. Supprimer toutes les demandes de congés
        deleted_requests, _ = LeaveRequest.objects.all().delete()
        print(f"Demandes de congés supprimées : {deleted_requests}")

        # 2. Réinitialiser les jours utilisés à 0 sur tous les soldes
        updated_balances = LeaveBalance.objects.all().update(jours_utilises=0)
        print(f"Soldes de congés réinitialisés (jours_utilises = 0) : {updated_balances}")
    except Exception as e:
        print(f"Erreur lors de la réinitialisation : {e}")

if __name__ == '__main__':
    reset_leaves_data()
