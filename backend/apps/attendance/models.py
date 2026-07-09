import uuid
from apps.companies.models import Company

from django.db import models

# Create your models here.


class Holiday(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="holidays",
    )
    nom = models.CharField(max_length=255)
    date = models.DateField()
    recurrent = models.BooleanField(
        default=False,
        help_text="If checked, the holiday will be considered as a recurrent holiday and will be applied to all future years."
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["company", "date"],
                name="unique_holiday_date_per_company",
            )
        ]

    def __str__(self):
        return f"{self.nom} ({self.date})"


class Attendance(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(
        "employees.Employee",
        on_delete=models.CASCADE,
        related_name="attendances",
    )
    date = models.DateField()
    heure_arrivee = models.TimeField(null=True, blank=True)
    heure_depart = models.TimeField(null=True, blank=True)
    statut = models.CharField(
        max_length=20,
        choices=[
            ("present", "Present"),
            ("absent", "Absent"),
            ("late", "Late"),
            ("en_conge", "En Congé"),
            ("jour_ferie", "Jour Férié"),
        ],
        default="present",
    )

    methode_pointage = models.CharField(
        max_length=20,
        choices=[
            ("manual", "Manual"),
            ("biometric", "Biometric"),
            ("qr", "QR Code"),
        ],
        default="manual",
    )  

    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["employee", "date"],
                name="unique_attendance_per_employee_per_date",
            )
        ]

    def __str__(self):
        return f"{self.employee} - {self.date} ({self.statut})"