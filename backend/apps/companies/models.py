import uuid
from django.db import models

# Create your models here.

class Company(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    email_contact = models.EmailField(max_length=255, unique=True)

    plan_abonnement = models.CharField(
        max_length=20,
        choices=[
            ("gratuit", "Gratuit"),
            ("starter", "Starter"),
            ("pro", "Pro"),
        ],
        default="gratuit",
    )
    format_matricule = models.CharField(
        max_length=20,
        choices=[
            ("departement", "Préfixe département + number"),
            ("entreprise", "Préfixe entreprise + number"),
        ],
        default="entreprise",
    )

    prefixe_matricule = models.CharField(
        max_length=10, 
        default="EMP",
        help_text="Utilisé uniquement si le format est 'entreprise'. EX:NEX"
    )

    telephone = models.CharField(max_length=50, blank=True, null=True)
    adresse = models.TextField(blank=True, null=True)
    ville = models.CharField(max_length=100, blank=True, null=True)
    pays = models.CharField(max_length=100, default="Bénin", blank=True)
    numero_ifu = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        help_text="Numéro IFU / SIRET / Immatriculation fiscale"
    )
    devise = models.CharField(max_length=10, default="FCFA", blank=True)

    heure_debut_journee = models.TimeField(default="08:00:00", blank=True, null=True)
    heure_fin_journee = models.TimeField(default="17:30:00", blank=True, null=True)
    tolerance_retard_minutes = models.PositiveIntegerField(default=15, blank=True)
    delai_prevenance_conge_jours = models.PositiveIntegerField(default=2, blank=True)

    logo = models.TextField(
        blank=True,
        null=True,
        help_text="Logo de l'entreprise (Base64 data URL ou URL d'image)"
    )

    actif = models.BooleanField(default=True)

    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nom
