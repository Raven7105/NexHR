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

    @property
    def jours_restants(self):
        from decimal import Decimal
        return max(Decimal("0.00"), self.jours_alloues - self.jours_utilises)

    def __str__(self):
        return f"{self.employee} - {self.leave_type.nom} ({self.annee})"
    

class LeaveRequest(models.Model):
    STATUS_CHOICES = [
        ("PENDING_MANAGER", "En attente du Manager"),
        ("PENDING_HR", "En attente RH"),
        ("PENDING_CEO", "En attente du PDG"),
        ("APPROVED", "Approuvé"),
        ("REJECTED", "Rejeté"),
        ("CANCELLED", "Annulé"),
        # Alias pour rétrocompatibilité
        ("en_attente", "En attente du Manager"),
        ("approuve", "Approuvé"),
        ("rejete", "Rejeté"),
        ("annule", "Annulé"),
    ]

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
    piece_justificative = models.FileField(upload_to="leaves/justificatifs/", null=True, blank=True)
    statut = models.CharField(
        max_length=30, 
        choices=STATUS_CHOICES, 
        default="PENDING_MANAGER"
    )

    # Étape 1 : Validation Manager
    manager_user = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        related_name="manager_leave_validations",
        null=True,
        blank=True
    )
    manager_status = models.CharField(max_length=20, blank=True, default="")
    manager_comment = models.TextField(blank=True, default="")
    manager_approved_at = models.DateTimeField(null=True, blank=True)
    manager_signature = models.TextField(blank=True, default="")

    # Étape 2 : Validation Responsable RH
    hr_user = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        related_name="hr_leave_validations",
        null=True,
        blank=True
    )
    hr_status = models.CharField(max_length=20, blank=True, default="")
    hr_comment = models.TextField(blank=True, default="")
    hr_approved_at = models.DateTimeField(null=True, blank=True)
    hr_signature = models.TextField(blank=True, default="")

    # Étape 3 : Validation PDG
    ceo_user = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        related_name="ceo_leave_validations",
        null=True,
        blank=True
    )
    ceo_status = models.CharField(max_length=20, blank=True, default="")
    ceo_comment = models.TextField(blank=True, default="")
    ceo_approved_at = models.DateTimeField(null=True, blank=True)
    ceo_signature = models.TextField(blank=True, default="")

    # Rétrocompatibilité anciens champs
    validateur = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        related_name="demandes_validees",
        null=True,
        blank=True
    )
    date_validation = models.DateTimeField(null=True, blank=True)
    commentaire_validateur = models.TextField(blank=True)

    # Document Officiel & QR Code
    authorization_number = models.CharField(max_length=100, blank=True, null=True, unique=True)
    authorization_document = models.FileField(upload_to="leaves/authorizations/", null=True, blank=True)
    qr_code_token = models.UUIDField(default=uuid.uuid4, null=True, blank=True)

    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee} - {self.leave_type.nom} - {self.statut}"


class LeaveApprovalHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    leave_request = models.ForeignKey(
        LeaveRequest,
        on_delete=models.CASCADE,
        related_name="history"
    )
    actor = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="leave_history_actions"
    )
    actor_role = models.CharField(max_length=50)
    action = models.CharField(max_length=50)  # submit, manager_approve, manager_reject, hr_approve, hr_reject, ceo_approve, ceo_reject, cancel
    previous_status = models.CharField(max_length=50, blank=True, default="")
    new_status = models.CharField(max_length=50)
    comment = models.TextField(blank=True, default="")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"[{self.created_at.strftime('%Y-%m-%d %H:%M')}] {self.actor} - {self.action} ({self.previous_status} -> {self.new_status})"