from django.shortcuts import render

from rest_framework import viewsets
from apps.core.mixins import CompanyScopedQuerySetMixin
from apps.core.permissions import IsAdminOnlyOrReadOnly
from .serializers import PayrollSettingSerializer, SalaryComponentSerializer, PayslipSerializer, PayslipItemSerializer
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


class PayslipItemViewSet(CompanyScopedQuerySetMixin, viewsets.ModelViewSet):
    queryset = PayslipItem.objects.all()
    serializer_class = PayslipItemSerializer
    company_lookup = "payslip__employee__company"
    permission_classes = [IsAdminOnlyOrReadOnly]
