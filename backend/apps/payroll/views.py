from django.shortcuts import render

from rest_framework import viewsets

from .serializers import PayrollSettingSerializer, SalaryComponentSerializer, PayslipSerializer, PayslipItemSerializer
from .models import PayrollSetting, SalaryComponent, Payslip, PayslipItem
# Create your views here.


class PayrollSettingViewSet(viewsets.ModelViewSet):
    queryset = PayrollSetting.objects.all()
    serializer_class = PayrollSettingSerializer


class SalaryComponentViewSet(viewsets.ModelViewSet):
    queryset = SalaryComponent.objects.all()
    serializer_class = SalaryComponentSerializer


class PayslipViewSet(viewsets.ModelViewSet):
    queryset = Payslip.objects.all()
    serializer_class = PayslipSerializer


class PayslipItemViewSet(viewsets.ModelViewSet):
    queryset = PayslipItem.objects.all()
    serializer_class = PayslipItemSerializer
