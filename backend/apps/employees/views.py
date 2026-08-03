from django.shortcuts import render
from rest_framework import viewsets
from .serializers import DepartmentSerializer, EmployeeSerializer
from apps.core.mixins import CompanyScopedQuerySetMixin
from apps.core.permissions import IsAdminOrManagerOrReadOnly
from .models import Department, Employee
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from .serializers import EmployeeCreateSerializer

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

    @action(detail=False, methods=["post"], url_path="create-with-user")
    def create_with_user(self, request):
        serializer = EmployeeCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        employee = serializer.save()
        return Response(EmployeeSerializer(employee).data, status=status.HTTP_201_CREATED)