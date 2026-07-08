import uuid
from apps.companies.models import Company
from django.db import models

# Create your models here.

class LeaveType(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE, 
        related_name="leave_types"
    )

    nom = models.CharField(max_length=255)
    jours_par_an = models.PositiveIntegerField(default=0)
    couleur = models.CharField(max_length=7, default="#378ADD")  

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["company", "nom"],
                name="unique_leave_type_name_per_company"
            )
        ]


    def __str__(self):
        return f"{self.nom} ({self.company.nom})"
    

class LeaveBalance(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(
        "employees.Employee",
        on_delete=models.CASCADE,
        related_name="leave_balances"
    )
    leave_type = models.ForeignKey(
        LeaveType,
        on_delete=models.CASCADE,   
        related_name="leave_balances"
    )

    annee = models.PositiveIntegerField()
    jours_alloues = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    jours_utilises = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["employee", "leave_type", "annee"],
                name="unique_balance_per_employee_type_year"
            )
        ]

    def __str__(self):
        return f"{self.employee} - {self.leave_type.nom} ({self.annee})"
    

class LeaveRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(
        "employees.Employee",
        on_delete=models.CASCADE,
        related_name="leave_requests"
    )
    leave_type = models.ForeignKey(
        LeaveType,
        on_delete=models.PROTECT,
        related_name="leave_requests"
    )

    date_debut = models.DateField()
    date_fin = models.DateField()
    nombre_jours = models.DecimalField(max_digits=5, decimal_places=2)
    motif = models.TextField(blank=True)
    statut = models.CharField(
        max_length=20, 
        choices=[
            ("en_attente", "En attente"),
            ("approuve", "Approuvé"),
            ("rejete", "Rejeté"),
            ("annule", "Annulé"),
        ], 
        default="en_attente")
    validateur = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        related_name="demandes_validees",
        null=True,
        blank=True
    )
    date_validation = models.DateTimeField(null=True, blank=True)
    commentaire_validateur = models.TextField(blank=True)

    date_creation = models.DateTimeField(auto_now_add=True)


    def __str__(self):
        return f"{self.employee} - {self.leave_type.nom} - {self.statut}"