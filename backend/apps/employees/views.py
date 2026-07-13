from django.shortcuts import render

from rest_framework import viewsets
from .serializers import DepartmentSerializer, EmployeeSerializer
from .models import Department, Employee
# Create your views here.


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer