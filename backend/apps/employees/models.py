import uuid
from apps.companies.models import Company
from django.db import models

# Create your models here.

class Department(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,   
        related_name='departments',
    )
    nom = models.CharField(max_length=255)  
    description = models.TextField(blank=True,)

    manager = models.ForeignKey(
        "Employee",
        on_delete=models.SET_NULL,
        related_name='managed_departments',
        blank=True,
        null=True,
    )

    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["company", "nom"],
                name="unique_department_name_per_company"
            )
        ]

    def __str__(self):
        return f"{self.nom} ({self.company.nom})"

class Employee(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='employee_profile',
    )
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='employees',
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        related_name='employees',
        blank=True,
        null=True,
    )
    manager = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        related_name='subordinates',
        blank=True,
        null=True,
    )

    matricule = models.CharField(max_length=100)
    poste = models.CharField(max_length=255)
    type_contrat = models.CharField(
        max_length=50,
        choices=[
            ('cdi', 'CDI'),
            ('cdd', 'CDD'),
            ('stage', 'Stage'),
            ('freelance', 'Freelance'),
        ],
        default='cdi',
    )
    date_embauche = models.DateField()
    date_fin_contrat = models.DateField(blank=True, null=True)
    statut = models.CharField(
        max_length=50,
        choices=[
            ('actif', 'Actif'),
            ('inactif', 'Inactif'),
            ('en_conge', 'En congé'),
            ('suspendu', 'Suspendu'),
        ],
        default='actif',
    )

    date_creation = models.DateTimeField(auto_now_add=True)


    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["company", "matricule"],
                name="unique_employee_matricule_per_company"
            )
        ]

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.poste})"  
