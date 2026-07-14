from django.shortcuts import render

from rest_framework import viewsets
from .serializers import DepartmentSerializer, EmployeeSerializer
from apps.core.mixins import CompanyScopedQuerySetMixin
from .models import Department, Employee
# Create your views here.


class DepartmentViewSet( CompanyScopedQuerySetMixin, viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer


class EmployeeViewSet(CompanyScopedQuerySetMixin, viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer