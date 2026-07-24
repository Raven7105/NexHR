from django.shortcuts import render

from rest_framework import viewsets
from .serializers import DepartmentSerializer, EmployeeSerializer
from apps.core.mixins import CompanyScopedQuerySetMixin
from apps.core.permissions import IsAdminOrManagerOrReadOnly
from .models import Department, Employee
# Create your views here.


class DepartmentViewSet( CompanyScopedQuerySetMixin, viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminOrManagerOrReadOnly]


class EmployeeViewSet(CompanyScopedQuerySetMixin, viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAdminOrManagerOrReadOnly]
    filterset_fields = ["department", "statut", "type_contrat"]