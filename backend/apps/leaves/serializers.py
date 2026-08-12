from decimal import Decimal
# pyrefly: ignore [missing-import]
from rest_framework import serializers

from .models import LeaveType, LeaveBalance, LeaveRequest

class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = '__all__'


class LeaveBalanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveBalance
        fields = '__all__'


class LeaveRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveRequest
        fields = '__all__'
        read_only_fields = ("date_creation",)
        extra_kwargs = {
            "employee": {"required": False},
        }

    def validate(self, attrs):
        request = self.context.get("request")
        if not request or not getattr(request.user, "is_authenticated", False):
            raise serializers.ValidationError({"detail": "Authentification requise."})

        user = request.user
        user_employee = getattr(user, "employee_profile", None)

        if not self.instance:
            if user.role == "employe":
                if not user_employee:
                    raise serializers.ValidationError({"detail": "Aucun profil employé associé à cet utilisateur."})
                target_employee = user_employee
            else:
                target_employee = attrs.get("employee") or user_employee
                if not target_employee:
                    raise serializers.ValidationError({"employee": "Veuillez spécifier un employé pour la demande."})
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
