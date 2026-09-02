import os
import io
import uuid
import qrcode
from django.conf import settings
from django.core.files.base import ContentFile
from django.utils import timezone

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch


def generate_leave_pdf(leave_request):
    """
    Génère un document PDF officiel d'autorisation de congé de haute qualité professionnelle
    comprenant l'en-tête entreprise, la décision de la direction, la matrice hiérarchique à 3 niveaux,
    le sceau d'approbation et le QR Code de vérification d'authenticité.
    """
    # 1. Génération du numéro d'autorisation et du jeton si absents
    if not leave_request.authorization_number:
        year = timezone.now().year
        count = leave_request.__class__.objects.filter(authorization_number__startswith=f"AUT-CON-{year}").count() + 1
        leave_request.authorization_number = f"AUT-CON-{year}-{count:06d}"

    if not leave_request.qr_code_token:
        leave_request.qr_code_token = uuid.uuid4()

    # 2. Génération du QR Code HD
    verify_url = f"http://localhost:5173/verify/{leave_request.qr_code_token}"
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=5,
        border=1
    )
    qr.add_data(verify_url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="#0F172A", back_color="white")

    qr_buffer = io.BytesIO()
    qr_img.save(qr_buffer, format="PNG")
    qr_buffer.seek(0)

    # 3. Création du PDF ReportLab A4
    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        pdf_buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Dynamic Custom Paragraph Styles
    company_title_style = ParagraphStyle(
        'CompanyTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor("#0F172A"),
    )

    doc_title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#1E3A8A"),
        alignment=1  # Center
    )

    doc_subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#059669"),
        alignment=1
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#1E293B"),
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#334155")
    )

    body_bold = ParagraphStyle(
        'BodyBoldCustom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#0F172A")
    )

    stamp_text_style = ParagraphStyle(
        'StampText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor("#047857"),
        alignment=1
    )

    elements = []

    # En-tête Entreprise
    company = getattr(leave_request.employee, "company", None)
    company_name = company.nom if company else "NexHR Inc."
    company_contact = company.email_contact if company and company.email_contact else "contact@nexhr.com"

    header_left = Paragraph(
        f"<b>{company_name}</b><br/>"
        f"<font size=8 color='#64748B'>Plateforme de Gestion RH NexHR • {company_contact}</font>",
        body_style
    )

    header_right = Paragraph(
        f"<font size=8 color='#64748B'>Document édité le : {timezone.now().strftime('%d/%m/%Y à %H:%M')}<br/>"
        f"N° de Réf : <font color='#1E3A8A'><b>{leave_request.authorization_number}</b></font></font>",
        ParagraphStyle('RightText', parent=body_style, alignment=2)
    )

    header_table = Table([[header_left, header_right]], colWidths=[260, 260])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 8))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1E3A8A"), spaceAfter=14))

    # Titre Officiel du Document
    elements.append(Paragraph("AUTORISATION OFFICIELLE DE CONGÉ", doc_title_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph("DÉCISION CONJOINTE DE LA DIRECTION ET DU SERVICE RESSOURCES HUMAINES", doc_subtitle_style))
    elements.append(Spacer(1, 14))

    # Sceau d'Approbation Officiel (Stamp Box)
    stamp_content = [
        [
            Paragraph(
                "✔ <b>AUTORISATION ACCORDÉE ET SIGNÉE</b><br/>"
                f"<font size=8 color='#065F46'>Validée électroniquement selon le workflow hiérarchique à 3 niveaux de NexHR</font>",
                stamp_text_style
            )
        ]
    ]
    stamp_table = Table(stamp_content, colWidths=[520])
    stamp_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#ECFDF5")),
        ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor("#10B981")),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    elements.append(stamp_table)
    elements.append(Spacer(1, 14))

    # Tableau Récapitulatif : Employé & Congé
    emp = leave_request.employee
    user_emp = emp.user
    emp_full_name = f"{user_emp.first_name} {user_emp.last_name}".strip() or user_emp.email
    dept_nom = emp.department.nom if emp.department else "Non assigné"

    emp_info_p = Paragraph(
        f"<b>Nom & Prénom :</b> {emp_full_name}<br/>"
        f"<b>Matricule :</b> <font color='#1E3A8A'><b>{emp.matricule}</b></font><br/>"
        f"<b>Poste / Fonction :</b> {emp.poste}<br/>"
        f"<b>Département :</b> {dept_nom}<br/>"
        f"<b>Adresse Email :</b> {user_emp.email}",
        body_style
    )

    leave_info_p = Paragraph(
        f"<b>Type de Congé :</b> {leave_request.leave_type.nom}<br/>"
        f"<b>Date de début :</b> {leave_request.date_debut.strftime('%d/%m/%Y')}<br/>"
        f"<b>Date de fin :</b> {leave_request.date_fin.strftime('%d/%m/%Y')}<br/>"
        f"<b>Durée accordée :</b> <font color='#059669'><b>{leave_request.nombre_jours} jour(s) ouvré(s)</b></font><br/>"
        f"<b>Motif :</b> {leave_request.motif or 'Non renseigné'}",
        body_style
    )

    info_data = [
        [
            Paragraph("<b>INFORMATIONS DU BÉNÉFICIAIRE</b>", section_heading),
            Paragraph("<b>CARACTÉRISTIQUES DU CONGÉ ACCORDÉ</b>", section_heading)
        ],
        [emp_info_p, leave_info_p]
    ]

    info_table = Table(info_data, colWidths=[255, 255])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor("#F8FAFC")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 16))

    # Matrice Hiérarchique de Validation Adaptée
    elements.append(Paragraph("<b>HISTORIQUE ET VALIDATIONS HIÉRARCHIQUES DU WORKFLOW</b>", section_heading))

    manager_name = f"{leave_request.manager_user.first_name} {leave_request.manager_user.last_name}".strip() if leave_request.manager_user else "Manager d'Équipe"
    manager_date = leave_request.manager_approved_at.strftime('%d/%m/%Y à %H:%M') if leave_request.manager_approved_at else "-"

    hr_name = f"{leave_request.hr_user.first_name} {leave_request.hr_user.last_name}".strip() if leave_request.hr_user else "Responsable RH"
    hr_date = leave_request.hr_approved_at.strftime('%d/%m/%Y à %H:%M') if leave_request.hr_approved_at else "-"

    ceo_name = f"{leave_request.ceo_user.first_name} {leave_request.ceo_user.last_name}".strip() if leave_request.ceo_user else "PDG / Direction Générale"
    ceo_date = leave_request.ceo_approved_at.strftime('%d/%m/%Y à %H:%M') if leave_request.ceo_approved_at else "-"

    val_header_style = ParagraphStyle('ValHeader', parent=body_bold, textColor=colors.HexColor("#0F172A"))

    applicant_role = leave_request.employee.user.role if (leave_request.employee and leave_request.employee.user) else "employe"

    validation_data = [
        [
            Paragraph("Niveau / Étape", val_header_style),
            Paragraph("Validateur / Signataire", val_header_style),
            Paragraph("Décision", val_header_style),
            Paragraph("Date & Heure", val_header_style),
            Paragraph("Commentaire / Remarques", val_header_style)
        ]
    ]

    if applicant_role == "employe":
        validation_data.append([
            Paragraph("<b>Niveau 1 : Manager</b>", body_style),
            Paragraph(manager_name, body_style),
            Paragraph("<font color='#059669'><b>✔ APPROUVÉ</b></font>", body_style),
            Paragraph(manager_date, body_style),
            Paragraph(leave_request.manager_comment or "Accordé par le Manager", body_style)
        ])

    if applicant_role in ["employe", "manager"]:
        level_num = "2" if applicant_role == "employe" else "1"
        validation_data.append([
            Paragraph(f"<b>Niveau {level_num} : Responsable RH</b>", body_style),
            Paragraph(hr_name, body_style),
            Paragraph("<font color='#059669'><b>✔ APPROUVÉ</b></font>", body_style),
            Paragraph(hr_date, body_style),
            Paragraph(leave_request.hr_comment or "Solde vérifié & conforme", body_style)
        ])

    ceo_level_num = "3" if applicant_role == "employe" else "2" if applicant_role == "manager" else "1"
    validation_data.append([
        Paragraph(f"<b>Niveau {ceo_level_num} : PDG / Direction</b>", body_style),
        Paragraph(ceo_name, body_style),
        Paragraph("<font color='#059669'><b>✔ SIGNÉ</b></font>", body_style),
        Paragraph(ceo_date, body_style),
        Paragraph(leave_request.ceo_comment or "Autorisation définitive accordée", body_style)
    ])

    val_table = Table(validation_data, colWidths=[105, 115, 75, 95, 130])
    val_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor("#FFFFFF")),
        ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor("#F8FAFC")),
        ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor("#FFFFFF")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(val_table)
    elements.append(Spacer(1, 16))

    # Pied de page Sécurisé avec QR Code et Inviolabilité
    qr_img_reportlab = Image(qr_buffer, width=1.1 * inch, height=1.1 * inch)

    footer_text = Paragraph(
        f"<b>SÉCURITÉ & VÉRIFICATION D'AUTHENTICITÉ (QR CODE)</b><br/>"
        f"Ce document est une attestation officielle d'autorisation de congé générée électroniquement.<br/>"
        f"• Numéro d'autorisation : <b>{leave_request.authorization_number}</b><br/>"
        f"• Jeton d'inviolabilité : <font size=7 fontName='Courier' color='#475569'>{leave_request.qr_code_token}</font><br/>"
        f"• Scanner le QR Code pour vérifier la validité en temps réel sur la plateforme NexHR.<br/>"
        f"<font color='#2563EB'><u>{verify_url}</u></font>",
        body_style
    )

    footer_data = [
        [qr_img_reportlab, footer_text]
    ]
    footer_table = Table(footer_data, colWidths=[90, 430])
    footer_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F0F9FF")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#BAE6FD")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(KeepTogether(footer_table))

    # Build PDF
    doc.build(elements)

    pdf_value = pdf_buffer.getvalue()
    pdf_buffer.close()

    filename = f"Autorisation_Conge_{leave_request.authorization_number}.pdf"
    leave_request.authorization_document.save(filename, ContentFile(pdf_value), save=False)
    leave_request.save()

    return leave_request.authorization_document
