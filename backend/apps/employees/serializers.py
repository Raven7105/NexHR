from rest_framework import serializers
from .models import Department, Employee


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = "__all__"


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