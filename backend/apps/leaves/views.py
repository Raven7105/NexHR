from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from django.db import models, transaction
from django.http import HttpResponse, FileResponse, Http404
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response

from apps.core.mixins import CompanyScopedQuerySetMixin
from apps.core.permissions import (
    CanValidateLeaveRequest,
    IsAdminOrManagerOrReadOnly,
    IsAdminOrOwnManagerOrReadOnly,
    IsEmployeeSelfOrAdminOrManagerOrReadOnly,
)
from apps.accounts.models import User
from apps.notifications.utils import create_notification
from .models import LeaveType, LeaveBalance, LeaveRequest, LeaveApprovalHistory
from .serializers import LeaveTypeSerializer, LeaveBalanceSerializer, LeaveRequestSerializer, LeaveApprovalHistorySerializer
from .pdf_service import generate_leave_pdf


class LeaveTypeViewSet(CompanyScopedQuerySetMixin, viewsets.ModelViewSet):
    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer
    permission_classes = [IsAdminOrManagerOrReadOnly]

    def perform_create(self, serializer):
        user = self.request.user
        company = getattr(user, "company", None)
        if not company and getattr(user, "employee_profile", None):
            company = getattr(user.employee_profile, "company", None)
        if not company:
            from apps.companies.models import Company
            company = Company.objects.first()
        if company:
            serializer.save(company=company)
        else:
            serializer.save()


class LeaveBalanceViewSet(CompanyScopedQuerySetMixin, viewsets.ModelViewSet):
    queryset = LeaveBalance.objects.all()
    serializer_class = LeaveBalanceSerializer
    company_lookup = "employee__company"
    permission_classes = [IsAdminOrManagerOrReadOnly]
    filterset_fields = ["annee", "employee", "leave_type"]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if not user.is_authenticated:
            return queryset.none()

        if user.role == "pdg":
            return queryset.none()

        my_balances = self.request.query_params.get("my_balances")
        if my_balances == "true" or user.role == "employe":
            employee_profile = getattr(user, "employee_profile", None)
            if employee_profile is not None:
                queryset = queryset.filter(employee=employee_profile)

        year = self.request.query_params.get("year")
        if year and year.isdigit():
            queryset = queryset.filter(annee=int(year))

        return queryset

    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        user = request.user
        if user.role == "pdg":
            return Response([])
        emp = getattr(user, "employee_profile", None)
        if not emp:
            return Response([])

        year_str = request.query_params.get("year")
        year = int(year_str) if (year_str and year_str.isdigit()) else timezone.now().year

        balances = LeaveBalance.objects.filter(employee=emp, annee=year)
        serializer = self.get_serializer(balances, many=True)
        return Response(serializer.data)


class LeaveRequestViewSet(CompanyScopedQuerySetMixin, viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.all()
    serializer_class = LeaveRequestSerializer
    company_lookup = "employee__company"
    permission_classes = [IsEmployeeSelfOrAdminOrManagerOrReadOnly]
    filterset_fields = ["statut", "employee", "leave_type"]

    def get_permissions(self):
        if self.action in {"partial_update", "update"}:
            return [CanValidateLeaveRequest()]
        return super().get_permissions()

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.is_authenticated:
            if user.role == "employe":
                employee_profile = getattr(user, "employee_profile", None)
                if employee_profile is not None:
                    return queryset.filter(employee=employee_profile)
            elif user.role == "manager":
                employee_profile = getattr(user, "employee_profile", None)
                if employee_profile is not None:
                    # Le manager voit ses demandes personnelles ET celles de ses subordonnés
                    return queryset.filter(
                        models.Q(employee=employee_profile) | models.Q(employee__manager=employee_profile)
                    )
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        
        if user.role == "pdg":
            raise permissions.exceptions.PermissionDenied("Le PDG est le responsable hiérarchique final et ne peut pas créer de demande de congé.")

        if user.role == "manager":
            initial_status = "PENDING_HR"
        elif user.role in ["responsable_rh", "admin_rh"]:
            initial_status = "PENDING_CEO"
        else:
            initial_status = "PENDING_MANAGER"

        with transaction.atomic():
            instance = serializer.save(statut=initial_status)
            
            # Journal d'historique initial
            LeaveApprovalHistory.objects.create(
                leave_request=instance,
                actor=user,
                actor_role=user.role,
                action="submit",
                previous_status="",
                new_status=initial_status,
                comment=instance.motif or "Soumission de la demande de congé",
            )

            # Notifications selon le workflow
            if initial_status == "PENDING_MANAGER":
                manager_emp = instance.employee.manager if instance.employee else None
                if manager_emp and manager_emp.user:
                    create_notification(
                        recipient=manager_emp.user,
                        title="Nouvelle demande de congé à valider",
                        message=f"{user.get_full_name()} a soumis une demande de congé ({instance.leave_type.nom}) du {instance.date_debut.strftime('%d/%m/%Y')} au {instance.date_fin.strftime('%d/%m/%Y')}.",
                        link="/leaves",
                    )
            elif initial_status == "PENDING_HR":
                from apps.accounts.models import User
                rh_users = User.objects.filter(role__in=["responsable_rh", "admin_rh"])
                for rh in rh_users:
                    create_notification(
                        recipient=rh,
                        title="Nouvelle demande de congé (Manager) à valider",
                        message=f"Le manager {user.get_full_name()} a soumis une demande de congé ({instance.leave_type.nom}) en attente de votre validation.",
                        link="/leaves",
                    )
            elif initial_status == "PENDING_CEO":
                from apps.accounts.models import User
                ceo_users = User.objects.filter(role__in=["pdg", "superadmin"])
                for ceo in ceo_users:
                    create_notification(
                        recipient=ceo,
                        title="Nouvelle demande de congé (RH) à valider",
                        message=f"Le Responsable RH {user.get_full_name()} a soumis une demande de congé ({instance.leave_type.nom}) en attente de votre signature.",
                        link="/leaves",
                    )

    # Helper pour la traçabilité IP
    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    # 1. Validation Manager
    @action(detail=True, methods=["post"], url_path="manager-approve")
    def manager_approve(self, request, pk=None):
        leave_req = self.get_object()
        user = request.user

        if leave_req.employee.user == user:
            return Response({"detail": "Un utilisateur ne peut pas valider sa propre demande de congé."}, status=status.HTTP_403_FORBIDDEN)

        if user.role not in ["manager", "superadmin"] and getattr(leave_req.employee, "manager_id", None) != getattr(user, "employee_profile", None):
            return Response({"detail": "Seul le manager hiérarchique ou un Administrateur peut effectuer cette validation."}, status=status.HTTP_403_FORBIDDEN)

        if leave_req.statut not in ["PENDING_MANAGER", "en_attente"]:
            return Response({"detail": f"Transition impossible. La demande est au statut '{leave_req.statut}'."}, status=status.HTTP_400_BAD_REQUEST)

        comment = request.data.get("comment", "")
        signature = request.data.get("signature", user.signature or "")

        with transaction.atomic():
            old_status = leave_req.statut
            leave_req.statut = "PENDING_HR"
            leave_req.manager_user = user
            leave_req.manager_status = "APPROVED"
            leave_req.manager_comment = comment
            leave_req.manager_approved_at = timezone.now()
            leave_req.manager_signature = signature
            leave_req.save()

            LeaveApprovalHistory.objects.create(
                leave_request=leave_req,
                actor=user,
                actor_role="manager",
                action="manager_approve",
                previous_status=old_status,
                new_status="PENDING_HR",
                comment=comment,
                ip_address=self._get_client_ip(request),
            )

            # Notifications
            # Notify Employee
            create_notification(
                recipient=leave_req.employee.user,
                title="Demande de congé approuvée par votre Manager",
                message=f"Votre demande a été approuvée par {user.get_full_name()} et est transmise au Responsable RH.",
                link="/leaves",
            )

            # Notify Responsables RH
            rh_users = User.objects.filter(role__in=["responsable_rh", "admin_rh"])
            for rh in rh_users:
                create_notification(
                    recipient=rh,
                    title="Demande de congé à valider (Étape RH)",
                    message=f"La demande de {leave_req.employee.user.get_full_name()} (Manager: {user.get_full_name()}) est en attente de votre validation.",
                    link="/leaves",
                )

        return Response(LeaveRequestSerializer(leave_req, context={'request': request}).data)

    @action(detail=True, methods=["post"], url_path="manager-reject")
    def manager_reject(self, request, pk=None):
        leave_req = self.get_object()
        user = request.user

        if user.role not in ["manager", "superadmin"] and getattr(leave_req.employee, "manager_id", None) != getattr(user, "employee_profile", None):
            return Response({"detail": "Seul le manager hiérarchique ou un Administrateur peut rejeter cette demande."}, status=status.HTTP_403_FORBIDDEN)

        if leave_req.statut not in ["PENDING_MANAGER", "en_attente"]:
            return Response({"detail": "Cette demande n'est plus en attente de la validation du manager."}, status=status.HTTP_400_BAD_REQUEST)

        comment = request.data.get("comment", "")
        if not comment.strip():
            return Response({"comment": "Le motif du rejet est obligatoire."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            old_status = leave_req.statut
            leave_req.statut = "REJECTED"
            leave_req.manager_user = user
            leave_req.manager_status = "REJECTED"
            leave_req.manager_comment = comment
            leave_req.manager_approved_at = timezone.now()
            leave_req.save()

            LeaveApprovalHistory.objects.create(
                leave_request=leave_req,
                actor=user,
                actor_role="manager",
                action="manager_reject",
                previous_status=old_status,
                new_status="REJECTED",
                comment=comment,
                ip_address=self._get_client_ip(request),
            )

            create_notification(
                recipient=leave_req.employee.user,
                title="Demande de congé rejetée par votre Manager",
                message=f"Votre demande a été rejetée par {user.get_full_name()}. Motif : {comment}",
                link="/leaves",
            )

        return Response(LeaveRequestSerializer(leave_req, context={'request': request}).data)

    # 2. Validation RH
    @action(detail=True, methods=["post"], url_path="hr-approve")
    def hr_approve(self, request, pk=None):
        leave_req = self.get_object()
        user = request.user

        if leave_req.employee.user == user:
            return Response({"detail": "Un utilisateur ne peut pas valider sa propre demande de congé."}, status=status.HTTP_403_FORBIDDEN)

        if user.role not in ["responsable_rh", "admin_rh", "superadmin"]:
            return Response({"detail": "Accès réservé au Responsable RH."}, status=status.HTTP_403_FORBIDDEN)

        if leave_req.statut != "PENDING_HR":
            return Response({"detail": f"Transition impossible. La demande doit être validée par le Manager en premier lieu (Statut actuel: '{leave_req.statut}')."}, status=status.HTTP_400_BAD_REQUEST)

        comment = request.data.get("comment", "")
        signature = request.data.get("signature", user.signature or "")

        with transaction.atomic():
            old_status = leave_req.statut
            leave_req.statut = "PENDING_CEO"
            leave_req.hr_user = user
            leave_req.hr_status = "APPROVED"
            leave_req.hr_comment = comment
            leave_req.hr_approved_at = timezone.now()
            leave_req.hr_signature = signature
            leave_req.save()

            LeaveApprovalHistory.objects.create(
                leave_request=leave_req,
                actor=user,
                actor_role="responsable_rh",
                action="hr_approve",
                previous_status=old_status,
                new_status="PENDING_CEO",
                comment=comment,
                ip_address=self._get_client_ip(request),
            )

            # Notifications
            create_notification(
                recipient=leave_req.employee.user,
                title="Demande de congé approuvée par le Responsable RH",
                message="Votre demande est transmise à la Direction Générale (PDG) pour approbation finale.",
                link="/leaves",
            )

            ceo_users = User.objects.filter(role__in=["pdg", "superadmin"])
            for ceo in ceo_users:
                create_notification(
                    recipient=ceo,
                    title="Autorisation de congé en attente de signature PDG",
                    message=f"La demande de {leave_req.employee.user.get_full_name()} nécessite votre validation finale.",
                    link="/leaves",
                )

        return Response(LeaveRequestSerializer(leave_req, context={'request': request}).data)

    @action(detail=True, methods=["post"], url_path="hr-reject")
    def hr_reject(self, request, pk=None):
        leave_req = self.get_object()
        user = request.user

        if user.role not in ["responsable_rh", "admin_rh", "superadmin"]:
            return Response({"detail": "Accès réservé au Responsable RH."}, status=status.HTTP_403_FORBIDDEN)

        if leave_req.statut != "PENDING_HR":
            return Response({"detail": "Cette demande n'est pas en attente de validation RH."}, status=status.HTTP_400_BAD_REQUEST)

        comment = request.data.get("comment", "")
        if not comment.strip():
            return Response({"comment": "Le motif du rejet est obligatoire."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            old_status = leave_req.statut
            leave_req.statut = "REJECTED"
            leave_req.hr_user = user
            leave_req.hr_status = "REJECTED"
            leave_req.hr_comment = comment
            leave_req.hr_approved_at = timezone.now()
            leave_req.save()

            LeaveApprovalHistory.objects.create(
                leave_request=leave_req,
                actor=user,
                actor_role="responsable_rh",
                action="hr_reject",
                previous_status=old_status,
                new_status="REJECTED",
                comment=comment,
                ip_address=self._get_client_ip(request),
            )

            create_notification(
                recipient=leave_req.employee.user,
                title="Demande de congé rejetée par les RH",
                message=f"Votre demande a été rejetée par le service RH. Motif : {comment}",
                link="/leaves",
            )

        return Response(LeaveRequestSerializer(leave_req, context={'request': request}).data)

    # 3. Validation PDG (Décision finale + Génération PDF & Déduction solde)
    @action(detail=True, methods=["post"], url_path="ceo-approve")
    def ceo_approve(self, request, pk=None):
        leave_req = self.get_object()
        user = request.user

        if user.role not in ["pdg", "superadmin"]:
            return Response({"detail": "Accès réservé au PDG / Direction Générale."}, status=status.HTTP_403_FORBIDDEN)

        if leave_req.statut != "PENDING_CEO":
            return Response({"detail": f"Transition impossible. La demande doit d'abord être approuvée par le Manager et le Responsable RH (Statut actuel: '{leave_req.statut}')."}, status=status.HTTP_400_BAD_REQUEST)

        comment = request.data.get("comment", "")
        signature = request.data.get("signature", user.signature or "")

        with transaction.atomic():
            old_status = leave_req.statut
            leave_req.statut = "APPROVED"
            leave_req.ceo_user = user
            leave_req.ceo_status = "APPROVED"
            leave_req.ceo_comment = comment
            leave_req.ceo_approved_at = timezone.now()
            leave_req.ceo_signature = signature
            leave_req.save()

            # Mettre à jour le solde de congé de l'employé
            balance = LeaveBalance.objects.filter(
                employee=leave_req.employee,
                leave_type=leave_req.leave_type,
                annee=leave_req.date_debut.year,
            ).first()
            if balance:
                balance.jours_utilises = Decimal(str(balance.jours_utilises)) + Decimal(str(leave_req.nombre_jours))
                balance.save()

            # Marquer la présence dans le journal d'assiduité
            from apps.attendance.models import Attendance
            curr_date = leave_req.date_debut
            while curr_date <= leave_req.date_fin:
                Attendance.objects.update_or_create(
                    employee=leave_req.employee,
                    date=curr_date,
                    defaults={
                        "statut": "en_conge",
                        "methode_pointage": "manual",
                    }
                )
                curr_date += timedelta(days=1)

            # Génération du document PDF officiel avec QR Code
            generate_leave_pdf(leave_req)

            # Consigner dans l'historique
            LeaveApprovalHistory.objects.create(
                leave_request=leave_req,
                actor=user,
                actor_role="pdg",
                action="ceo_approve",
                previous_status=old_status,
                new_status="APPROVED",
                comment=comment,
                ip_address=self._get_client_ip(request),
            )

            # Notification finale à l'employé
            create_notification(
                recipient=leave_req.employee.user,
                title="Congé définitivement approuvé par le PDG !",
                message=f"Votre congé du {leave_req.date_debut.strftime('%d/%m/%Y')} au {leave_req.date_fin.strftime('%d/%m/%Y')} est officiellement accordé. Votre autorisation PDF (N° {leave_req.authorization_number}) est disponible au téléchargement.",
                link="/leaves",
            )

        return Response(LeaveRequestSerializer(leave_req, context={'request': request}).data)

    @action(detail=True, methods=["post"], url_path="ceo-reject")
    def ceo_reject(self, request, pk=None):
        leave_req = self.get_object()
        user = request.user

        if user.role not in ["pdg", "superadmin"]:
            return Response({"detail": "Accès réservé au PDG / Direction Générale."}, status=status.HTTP_403_FORBIDDEN)

        if leave_req.statut != "PENDING_CEO":
            return Response({"detail": "Cette demande n'est pas en attente de la validation du PDG."}, status=status.HTTP_400_BAD_REQUEST)

        comment = request.data.get("comment", "")
        if not comment.strip():
            return Response({"comment": "Le motif du rejet est obligatoire."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            old_status = leave_req.statut
            leave_req.statut = "REJECTED"
            leave_req.ceo_user = user
            leave_req.ceo_status = "REJECTED"
            leave_req.ceo_comment = comment
            leave_req.ceo_approved_at = timezone.now()
            leave_req.save()

            LeaveApprovalHistory.objects.create(
                leave_request=leave_req,
                actor=user,
                actor_role="pdg",
                action="ceo_reject",
                previous_status=old_status,
                new_status="REJECTED",
                comment=comment,
                ip_address=self._get_client_ip(request),
            )

            create_notification(
                recipient=leave_req.employee.user,
                title="Demande de congé rejetée par le PDG",
                message=f"Votre demande de congé a été rejetée par le PDG. Motif : {comment}",
                link="/leaves",
            )

        return Response(LeaveRequestSerializer(leave_req, context={'request': request}).data)

    # 4. Consultation de l'historique et téléchargement PDF
    @action(detail=True, methods=["get"], url_path="history")
    def history(self, request, pk=None):
        leave_req = self.get_object()
        history_entries = leave_req.history.all()
        return Response(LeaveApprovalHistorySerializer(history_entries, many=True).data)

    @action(detail=True, methods=["get"], url_path="pdf")
    def download_pdf(self, request, pk=None):
        leave_req = self.get_object()
        if leave_req.statut != "APPROVED" or not leave_req.authorization_document:
            return Response({"detail": "L'autorisation PDF n'est disponible que pour les demandes définitivement approuvées par le PDG."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            response = FileResponse(leave_req.authorization_document.open("rb"), content_type="application/pdf")
            response["Content-Disposition"] = f'attachment; filename="Autorisation_Conge_{leave_req.authorization_number}.pdf"'
            return response
        except Exception as e:
            return Response({"detail": f"Fichier inaccessible : {str(e)}"}, status=status.HTTP_404_NOT_FOUND)


# API publique de vérification QR Code
@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def verify_leave_public(request, token):
    try:
        leave_req = LeaveRequest.objects.get(qr_code_token=token)
    except (LeaveRequest.DoesNotExist, ValueError):
        return Response({
            "valid": False,
            "status": "INVALID",
            "message": "Autorisation non trouvée ou jeton de sécurité invalide."
        }, status=status.HTTP_404_NOT_FOUND)

    emp = leave_req.employee
    user_emp = emp.user
    first_name = user_emp.first_name or "Employé"
    last_initial = f"{user_emp.last_name[0]}." if user_emp.last_name else ""

    return Response({
        "valid": leave_req.statut == "APPROVED",
        "authorization_number": leave_req.authorization_number,
        "employee_name": f"{first_name} {last_initial}",
        "matricule": emp.matricule,
        "leave_type": leave_req.leave_type.nom,
        "date_debut": leave_req.date_debut.strftime("%d/%m/%Y"),
        "date_fin": leave_req.date_fin.strftime("%d/%m/%Y"),
        "nombre_jours": str(leave_req.nombre_jours),
        "statut": "AUTORISATION OFFICIELLE VALIDE" if leave_req.statut == "APPROVED" else leave_req.statut,
        "validations": {
            "manager": {
                "approved": leave_req.manager_status == "APPROVED",
                "date": leave_req.manager_approved_at.strftime("%d/%m/%Y %H:%M") if leave_req.manager_approved_at else None
            },
            "hr": {
                "approved": leave_req.hr_status == "APPROVED",
                "date": leave_req.hr_approved_at.strftime("%d/%m/%Y %H:%M") if leave_req.hr_approved_at else None
            },
            "ceo": {
                "approved": leave_req.ceo_status == "APPROVED",
                "date": leave_req.ceo_approved_at.strftime("%d/%m/%Y %H:%M") if leave_req.ceo_approved_at else None
            }
        }
    })