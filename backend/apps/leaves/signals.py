from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver

from .models import LeaveRequest, LeaveBalance


@receiver(pre_save, sender=LeaveRequest)
def memoriser_ancien_statut(sender, instance, **kwargs):
    if instance.pk:
        try:
            ancienne_version = LeaveRequest.objects.get(pk=instance.pk)
            instance._ancien_statut = ancienne_version.statut
            instance._ancien_nombre_jours = ancienne_version.nombre_jours
        except LeaveRequest.DoesNotExist:
            instance._ancien_statut = None
            instance._ancien_nombre_jours = None
    else:
        instance._ancien_statut = None
        instance._ancien_nombre_jours = None


@receiver(post_save, sender=LeaveRequest)
def mettre_a_jour_solde_conge(sender, instance, **kwargs):
    ancien_statut = getattr(instance, "_ancien_statut", None)

    if instance.statut == "approuve" and ancien_statut != "approuve":
        _ajuster_solde(instance, instance.nombre_jours)
    elif instance.statut != "approuve" and ancien_statut == "approuve":
        _ajuster_solde(instance, -instance._ancien_nombre_jours)


def _ajuster_solde(instance, delta_jours):
    annee = instance.date_debut.year
    solde, _ = LeaveBalance.objects.get_or_create(
        employee=instance.employee,
        leave_type=instance.leave_type,
        annee=annee,
        defaults={"jours_alloues": instance.leave_type.jours_par_an},
    )
    solde.jours_utilises += delta_jours
    solde.save()