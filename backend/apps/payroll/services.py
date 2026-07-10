from decimal import Decimal


def calculer_irpp(revenu_net_imposable_mensuel, bareme_irpp):
    """
    Applique le barème progressif de l'IRPP sur un revenu ANNUEL,
    puis retourne le montant MENSUEL correspondant.
    """
    revenu_annuel = revenu_net_imposable_mensuel * 12
    impot_annuel = Decimal("0")

    for tranche in bareme_irpp:
        tranche_min = Decimal(str(tranche["min"]))
        tranche_max = Decimal(str(tranche["max"])) if tranche["max"] is not None else None
        taux = Decimal(str(tranche["taux"])) / 100

        if revenu_annuel <= tranche_min:
            continue

        plafond_tranche = min(revenu_annuel, tranche_max) if tranche_max else revenu_annuel
        montant_dans_tranche = plafond_tranche - tranche_min

        if montant_dans_tranche > 0:
            impot_annuel += montant_dans_tranche * taux

    return round(impot_annuel / 12, 2)



from apps.payroll.models import PayrollSetting, Payslip, PayslipItem


def generate_payslip(employee, mois, annee, jours_absence_non_payee=0):
    settings = (
        PayrollSetting.objects.filter(company=employee.company)
        .order_by("-date_effet")
        .first()
    )
    if settings is None:
        raise ValueError("Aucun PayrollSetting configuré pour cette entreprise.")

    payslip, _ = Payslip.objects.get_or_create(
        employee=employee,
        mois=mois,
        annee=annee,
        defaults={"salaire_brut": employee.salaire_de_base},
    )

    salaire_brut = employee.salaire_de_base
    items = PayslipItem.objects.filter(payslip=payslip)

    base_cnss = salaire_brut
    for item in items:
        if item.salary_component.soumis_cnss:
            base_cnss += item.montant

    cnss_salariale = round(base_cnss * settings.taux_cnss_salariale / 100, 2)
    cnss_patronale = round(base_cnss * settings.taux_cnss_patronale / 100, 2)
    inam_salariale = round(base_cnss * settings.taux_inam_salariale / 100, 2)
    inam_patronale = round(base_cnss * settings.taux_inam_patronale / 100, 2)

    revenu_avant_abattement = salaire_brut - cnss_salariale - inam_salariale
    abattement = revenu_avant_abattement * settings.abattement_forfaitaire_pourcentage / 100
    charges_famille = min(
        getattr(employee, "nombre_personnes_charge", 0),
        settings.max_personnes_charges,
    ) * settings.montant_charge_famille

    revenu_imposable = revenu_avant_abattement - abattement - charges_famille
    if revenu_imposable < 0:
        revenu_imposable = Decimal("0")

    irpp = calculer_irpp(revenu_imposable, settings.bareme_irpp)
    salaire_net = salaire_brut - cnss_salariale - inam_salariale - irpp

    payslip.salaire_brut = salaire_brut
    payslip.jours_absence_non_payee = jours_absence_non_payee
    payslip.cotisation_cnss_salariale = cnss_salariale
    payslip.cotisation_cnss_patronale = cnss_patronale
    payslip.cotisation_inam_salariale = inam_salariale
    payslip.cotisation_inam_patronale = inam_patronale
    payslip.revenu_imposable = revenu_imposable
    payslip.irpp = irpp
    payslip.salaire_net = salaire_net
    payslip.save()

    return payslip