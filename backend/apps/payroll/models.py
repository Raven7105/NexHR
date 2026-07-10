import uuid

from apps.companies.models import Company

from django.db import models

# Create your models here.

class PayrollSetting(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='payroll_settings'
    )
    date_effet = models.DateField(
        help_text="Date à partir de laquelle ces taux s'appliquent"
    )

    taux_cnss_salariale = models.DecimalField(max_digits=5, decimal_places=2, default=4.00)
    taux_cnss_patronale = models.DecimalField(max_digits=5, decimal_places=2, default=17.50)
    taux_inam_salariale = models.DecimalField(max_digits=5, decimal_places=2, default=5.00)
    taux_inam_patronale = models.DecimalField(max_digits=5, decimal_places=2, default=5.00)

    abattement_forfaitaire_pourcentage = models.DecimalField(max_digits=5, decimal_places=2, default=28.00)
    plafond_abattement = models.DecimalField(max_digits=12, decimal_places=2, default=10000000.00)

    montant_charge_famille = models.DecimalField(max_digits=10, decimal_places=2, default=10000.00)
    max_personnes_charges = models.PositiveIntegerField(default=6)

    smig = models.DecimalField(
        max_digits=10, decimal_places=2, default=52500,
        help_text="Salaire minimum interprofessionnel garanti en vigueur."
    )
    plafond_cotisation_cnss = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        help_text="Laisser vide si aucun plafond ne s'applique."
    )
    jours_travail_par_mois = models.PositiveIntegerField(default=26)

    bareme_irpp = models.JSONField(
        default=list,
        help_text="Liste des tranches: [{'min': 0, 'max': 900000, 'taux': 0}, ...]",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['company', 'date_effet'],
                name='unique_payroll_setting_per_company_per_date'
            )
        ]
    

    def __str__(self):
        return f"Réglages paie {self.company.nom} (depuis {self.date_effet})"
    




class SalaryComponent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="salary_components",
    ) 
    nom = models.CharField(max_length=150)
    type_composant = models.CharField(
        max_length=20,
        choices=[
            ("gain", "Gain (ajouté au brut)"),
            ("retenue", "Retenue (déduite du net)"),
        ]
    )
    imposable = models.BooleanField(
        default=True,
        help_text="Ce composant est-il soumis à l'IRPP?",
    )
    soumis_cnss = models.BooleanField(
        default=True,
        help_text="Ce composant est-il soumis aux cotiations CNSS?",
    )

    class Meta:
        constraints =[
            models.UniqueConstraint(
                fields=["company", "nom"],
                name="unique_salary_component_name_per_company",
            
            )
        ]

    def __str__(self):
        return f"{self.nom} ({self.get_type_composant_display()})"
    



class Payslip(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(
        "employees.Employee",
        on_delete=models.PROTECT,
        related_name='payslips'
    )
    mois = models.PositiveIntegerField(help_text="Mois de la fiche de paie (1-12)")
    annee = models.PositiveIntegerField()

    salaire_brut = models.DecimalField(max_digits=12, decimal_places=2)
    jours_absence_non_payee = models.PositiveIntegerField(default=0)

    cotisation_cnss_salariale = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cotisation_inam_salariale = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cotisation_cnss_patronale = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cotisation_inam_patronale = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    revenu_imposable = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    nombre_personnes_charges = models.PositiveIntegerField(default=0)
    charges_famille_deduites = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    irpp = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    salaire_net = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    statut = models.CharField(
        max_length=20,
        choices=[
            ('brouillon', 'Brouillon'),
            ('valide', 'Validé'),
            ('paye', 'Payé'),
        ],
        default='brouillon',
    )

    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['employee', 'mois', 'annee'],
                name='unique_payslip_per_employee_per_month',
            )
        ]

    def __str__(self):
        return f"Bulletin {self.employee} - {self.mois}/{self.annee}"
    

class PayslipItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payslip = models.ForeignKey(
        Payslip, 
        on_delete=models.CASCADE,
        related_name="items",
    )
    salary_component = models.ForeignKey(
        SalaryComponent, 
        on_delete=models.PROTECT,
        related_name="payslip_items",
    )
    montant = models.DecimalField(max_digits=12, decimal_places=2)


    def __str__(self):
        return f"{self.salary_component.nom}: {self.montant} ({self.payslip})"