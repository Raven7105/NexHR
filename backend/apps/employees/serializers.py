from rest_framework import serializers
from .models import Department, Employee, EmployeeHistory
from django.db import transaction
from apps.accounts.models import User


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = "__all__"
        read_only_fields = ("company",)


class EmployeeSerializer(serializers.ModelSerializer):
    nom_complet = serializers.SerializerMethodField()
    email = serializers.EmailField(source="user.email", read_only=True)
    department_nom = serializers.CharField(source="department.nom", read_only=True, default=None)

    class Meta:
        model = Employee
        fields = "__all__"

    def get_nom_complet(self, obj):
        full_name = obj.user.get_full_name()
        return full_name if full_name else obj.user.email


class EmployeeCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=[choice[0] for choice in User._meta.get_field("role").choices], default="employe")
    first_name = serializers.CharField(required=False, allow_blank=True, default="")
    last_name = serializers.CharField(required=False, allow_blank=True, default="")

    poste = serializers.CharField()
    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(), required=False, allow_null=True
    )
    manager = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(), required=False, allow_null=True
    )
    type_contrat = serializers.ChoiceField(choices=Employee._meta.get_field("type_contrat").choices, default="cdi")
    date_embauche = serializers.DateField()
    date_naissance = serializers.DateField(required=False, allow_null=True)
    phone_number = serializers.CharField(required=False, allow_blank=True, default="")
    date_fin_contrat = serializers.DateField(required=False, allow_null=True)
    salaire_de_base = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    nombre_personnes_charge = serializers.IntegerField(default=0)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        request = self.context["request"]
        company = request.user.company

        user = User.objects.create_user(
            username=validated_data["email"],
            email=validated_data["email"],
            password=validated_data.pop("password"),
            role=validated_data.pop("role"),
            first_name=validated_data.pop("first_name", ""),
            last_name=validated_data.pop("last_name", ""),
            company=company,
        )

        employee = Employee.objects.create(
            user=user,
            company=company,
            **{k: v for k, v in validated_data.items() if k != "email"},
        )
        return employee


class EmployeeUpdateSerializer(serializers.ModelSerializer):
    change_reason = serializers.CharField(required=False, allow_blank=True, write_only=True, default="")

    class Meta:
        model = Employee
        fields = [
            "poste",
            "department",
            "manager",
            "type_contrat",
            "salaire_de_base",
            "nombre_personnes_charge",
            "date_embauche",
            "date_naissance",
            "phone_number",
            "date_fin_contrat",
            "statut",
            "matricule",
            "is_active",
            "change_reason",
        ]


class EmployeeHistorySerializer(serializers.ModelSerializer):
    employee_nom = serializers.SerializerMethodField()
    department_nom = serializers.CharField(source="department.nom", read_only=True, default=None)
    created_by_nom = serializers.SerializerMethodField()
    field_display = serializers.CharField(source="get_field_display", read_only=True)

    class Meta:
        model = EmployeeHistory
        fields = [
            "id",
            "company",
            "employee",
            "employee_nom",
            "field",
            "field_display",
            "old_value",
            "new_value",
            "contract_type",
            "department",
            "department_nom",
            "change_date",
            "reason",
            "created_by",
            "created_by_nom",
            "date_creation",
        ]
        read_only_fields = ("company", "date_creation", "created_by")

    def get_employee_nom(self, obj):
        if obj.employee and obj.employee.user:
            return obj.employee.user.get_full_name() or obj.employee.user.email
        return None

    def get_created_by_nom(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.email
        return None


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["email", "first_name", "last_name", "role"]

    def validate_email(self, value):
        if User.objects.filter(email=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé.")
        return value
