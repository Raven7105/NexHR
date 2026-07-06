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
    actif = models.BooleanField(default=True)

    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nom
