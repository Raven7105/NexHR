from django.shortcuts import render
from rest_framework import viewsets
from apps.core.mixins import CompanyScopedQuerySetMixin
from apps.core.permissions import IsAdminOnlyOrReadOnly
from .serializers import PayrollSettingSerializer, SalaryComponentSerializer, PayslipSerializer, PayslipItemSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from apps.payroll.services import generate_payslip
from apps.employees.models import Employee
from .models import PayrollSetting, SalaryComponent, Payslip, PayslipItem
# Create your views here.


class PayrollSettingViewSet(CompanyScopedQuerySetMixin, viewsets.ModelViewSet):
    queryset = PayrollSetting.objects.all()
    serializer_class = PayrollSettingSerializer
    permission_classes = [IsAdminOnlyOrReadOnly]


class SalaryComponentViewSet(CompanyScopedQuerySetMixin, viewsets.ModelViewSet):
    queryset = SalaryComponent.objects.all()
    serializer_class = SalaryComponentSerializer
    permission_classes = [IsAdminOnlyOrReadOnly]


class PayslipViewSet(CompanyScopedQuerySetMixin, viewsets.ModelViewSet):
    queryset = Payslip.objects.all()
    serializer_class = PayslipSerializer
    company_lookup = "employee__company"
    permission_classes = [IsAdminOnlyOrReadOnly]

    @action(detail=False, methods=["post"])
    def generate(self, request):
        employee_id = request.data.get("employee")
        mois = request.data.get("mois")
        annee = request.data.get("annee")

        if not employee_id or not mois or not annee:
            return Response(
                {"detail": "Les champs employee, mois et annee sont obligatoires."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            mois = int(mois)
            annee = int(annee)
        except (ValueError, TypeError):
            return Response(
                {"detail": "mois et annee doivent être des nombres entiers."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not (1 <= mois <= 12):
            return Response(
                {"detail": "mois doit être compris entre 1 et 12."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            employee = Employee.objects.get(id=employee_id, company=request.user.company)
        except Employee.DoesNotExist:
            return Response(
                {"detail": "Employé introuvable dans votre entreprise."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            payslip = generate_payslip(employee, mois, annee)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(payslip)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PayslipItemViewSet(CompanyScopedQuerySetMixin, viewsets.ModelViewSet):
    queryset = PayslipItem.objects.all()
    serializer_class = PayslipItemSerializer
    company_lookup = "payslip__employee__company"
    permission_classes = [IsAdminOnlyOrReadOnly]
