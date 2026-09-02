from decimal import Decimal
# pyrefly: ignore [missing-import]
from rest_framework import serializers

from .models import LeaveType, LeaveBalance, LeaveRequest, LeaveApprovalHistory

class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = '__all__'
        read_only_fields = ("company",)


class LeaveBalanceSerializer(serializers.ModelSerializer):
    leave_type_nom = serializers.ReadOnlyField(source="leave_type.nom")
    leave_type_couleur = serializers.ReadOnlyField(source="leave_type.couleur")
    jours_restants = serializers.ReadOnlyField()

    class Meta:
        model = LeaveBalance
        fields = '__all__'


class LeaveApprovalHistorySerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = LeaveApprovalHistory
        fields = '__all__'

    def get_actor_name(self, obj):
        if obj.actor:
            full = f"{obj.actor.first_name} {obj.actor.last_name}".strip()
            return full if full else obj.actor.email
        return "Système"


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_detail = serializers.SerializerMethodField()
    leave_type_nom = serializers.ReadOnlyField(source="leave_type.nom")
    leave_type_couleur = serializers.ReadOnlyField(source="leave_type.couleur")
    history = LeaveApprovalHistorySerializer(many=True, read_only=True)
    authorization_document_url = serializers.SerializerMethodField()

    class Meta:
        model = LeaveRequest
        fields = '__all__'
        read_only_fields = (
            "date_creation",
            "date_modification",
            "statut",
            "manager_user",
            "manager_status",
            "manager_approved_at",
            "manager_signature",
            "hr_user",
            "hr_status",
            "hr_approved_at",
            "hr_signature",
            "ceo_user",
            "ceo_status",
            "ceo_approved_at",
            "ceo_signature",
            "authorization_number",
            "authorization_document",
            "qr_code_token",
        )
        extra_kwargs = {
            "employee": {"required": False},
            "nombre_jours": {"required": False},
        }

    def get_employee_detail(self, obj):
        emp = obj.employee
        if not emp:
            return None
        user = emp.user
        manager_user = emp.manager.user if emp.manager else None
        manager_name = f"{manager_user.first_name} {manager_user.last_name}".strip() if manager_user else None
        return {
            "id": str(emp.id),
            "nom_complet": f"{user.first_name} {user.last_name}".strip() or user.email,
            "email": user.email,
            "matricule": emp.matricule,
            "poste": emp.poste,
            "department_nom": emp.department.nom if emp.department else None,
            "manager_nom": manager_name,
        }

    def get_authorization_document_url(self, obj):
        if obj.authorization_document:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.authorization_document.url)
            return obj.authorization_document.url
        return None

    def validate(self, attrs):
        request = self.context.get("request")
        if not request or not getattr(request.user, "is_authenticated", False):
            raise serializers.ValidationError({"detail": "Authentification requise."})

        user = request.user
        user_employee = getattr(user, "employee_profile", None)

        if not self.instance:
            if user.role == "pdg":
                raise serializers.ValidationError({"detail": "Le PDG est le responsable hiérarchique final et ne peut pas créer de demande de congé."})

            if user.role == "employe":
                if not user_employee:
                    raise serializers.ValidationError({"detail": "Aucun profil employé associé à cet utilisateur."})
                target_employee = user_employee
            else:
                target_employee = user_employee or attrs.get("employee")
                if not target_employee:
                    raise serializers.ValidationError({"employee": "Veuillez spécifier un profil employé valide pour cette demande."})
                
                if target_employee.user.role == "pdg":
                    raise serializers.ValidationError({"detail": "Impossible d'enregistrer une demande de congé pour le PDG."})

            attrs["employee"] = target_employee
        else:
            target_employee = attrs.get("employee", self.instance.employee)

        date_debut = attrs.get("date_debut", self.instance.date_debut if self.instance else None)
        date_fin = attrs.get("date_fin", self.instance.date_fin if self.instance else None)
        leave_type = attrs.get("leave_type", self.instance.leave_type if self.instance else None)

        if date_debut and date_fin and date_debut > date_fin:
            raise serializers.ValidationError({"date_fin": "La date de fin doit être égale ou postérieure à la date de début."})

        if not self.instance and target_employee and leave_type and date_debut and date_fin:
            if leave_type.company_id != target_employee.company_id:
                raise serializers.ValidationError({"leave_type": "Ce type de congé n’appartient pas à l’entreprise de l’employé."})

            requested_days = (date_fin - date_debut).days + 1
            if requested_days <= 0:
                raise serializers.ValidationError({"date_fin": "La période demandée est invalide."})

            balance = LeaveBalance.objects.filter(
                employee=target_employee,
                leave_type=leave_type,
                annee=date_debut.year,
            ).first()

            if balance is None:
                raise serializers.ValidationError({"leave_type": "Aucune allocation de congé n’a été trouvée pour cette année."})

            remaining = Decimal(str(balance.jours_alloues)) - Decimal(str(balance.jours_utilises))
            if remaining < Decimal(requested_days):
                raise serializers.ValidationError({"nombre_jours": f"Solde de congés insuffisant ({remaining} jour(s) disponible(s))."})

            attrs["nombre_jours"] = requested_days

        return attrs
