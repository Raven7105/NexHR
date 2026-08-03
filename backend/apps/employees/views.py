from django.utils import timezone
from rest_framework import viewsets
from .serializers import DepartmentSerializer, EmployeeSerializer, EmployeeCreateSerializer, EmployeeUpdateSerializer, UserProfileUpdateSerializer
from apps.core.mixins import CompanyScopedQuerySetMixin
from apps.core.permissions import IsAdminOrManagerOrReadOnly
from .models import Department, Employee
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

# Create your views here.


class DepartmentViewSet(CompanyScopedQuerySetMixin, viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminOrManagerOrReadOnly]


class EmployeeViewSet(CompanyScopedQuerySetMixin, viewsets.ModelViewSet):
    queryset = Employee.objects.filter(is_active=True, deleted_at__isnull=True)
    serializer_class = EmployeeSerializer
    permission_classes = [IsAdminOrManagerOrReadOnly]
    filterset_fields = ["department", "statut", "type_contrat"]

    def get_queryset(self):
        queryset = super().get_queryset().filter(is_active=True, deleted_at__isnull=True)
        search = self.request.query_params.get("search", "")
        if search:
            queryset = queryset.filter(
                user__first_name__icontains=search
            ) | queryset.filter(user__last_name__icontains=search) | queryset.filter(poste__icontains=search) | queryset.filter(matricule__icontains=search)
        ordering = self.request.query_params.get("ordering", "-date_creation")
        return queryset.order_by(ordering)

    @action(detail=False, methods=["post"], url_path="create-with-user")
    def create_with_user(self, request):
        serializer = EmployeeCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        employee = serializer.save()
        return Response(EmployeeSerializer(employee).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["patch"], url_path="profile")
    def update_profile(self, request, pk=None):
        employee = self.get_object()
        serializer = UserProfileUpdateSerializer(employee.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(EmployeeSerializer(employee).data, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        employee = self.get_object()
        employee.is_active = False
        employee.deleted_at = timezone.now()
        employee.save(update_fields=["is_active", "deleted_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = EmployeeUpdateSerializer(instance, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(EmployeeSerializer(instance).data, status=status.HTTP_200_OK)