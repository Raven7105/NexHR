from decimal import Decimal
from django.utils import timezone
from django.shortcuts import render
from rest_framework import viewsets
from apps.core.mixins import CompanyScopedQuerySetMixin
from apps.core.permissions import (
    CanValidateLeaveRequest,
    IsAdminOrManagerOrReadOnly,
    IsAdminOrOwnManagerOrReadOnly,
    IsEmployeeSelfOrAdminOrManagerOrReadOnly,
)
from .models import LeaveType, LeaveBalance, LeaveRequest
from .serializers import LeaveTypeSerializer, LeaveBalanceSerializer, LeaveRequestSerializer


class LeaveTypeViewSet(CompanyScopedQuerySetMixin, viewsets.ModelViewSet):
    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer
    permission_classes = [IsAdminOrManagerOrReadOnly]

    def perform_create(self, serializer):
        user = self.request.user
        if getattr(user, "company", None):
            serializer.save(company=user.company)
        else:
            serializer.save()


class LeaveBalanceViewSet(CompanyScopedQuerySetMixin, viewsets.ModelViewSet):
    queryset = LeaveBalance.objects.all()
    serializer_class = LeaveBalanceSerializer
    company_lookup = "employee__company"
    permission_classes = [IsAdminOrManagerOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.is_authenticated and user.role == "employe":
            employee_profile = getattr(user, "employee_profile", None)
            if employee_profile is not None:
                return queryset.filter(employee=employee_profile)
        return queryset


class LeaveRequestViewSet(CompanyScopedQuerySetMixin, viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.all()
    serializer_class = LeaveRequestSerializer
    company_lookup = "employee__company"
    permission_classes = [IsEmployeeSelfOrAdminOrManagerOrReadOnly]
    filterset_fields = ["statut", "employee", "leave_type"]

    def get_permissions(self):
        if self.action in {"partial_update", "update"}:
            return [CanValidateLeaveRequest()]
        return super().get_permissions()

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.is_authenticated and user.role == "employe":
            employee_profile = getattr(user, "employee_profile", None)
            if employee_profile is not None:
                return queryset.filter(employee=employee_profile)
        return queryset

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        old_status = serializer.instance.statut

        save_kwargs = {}
        if user.is_authenticated and user.role in ["admin_rh", "manager", "superadmin"]:
            save_kwargs["validateur"] = user
            save_kwargs["date_validation"] = timezone.now()

        instance = serializer.save(**save_kwargs)
        new_status = instance.statut

        if old_status != "approuve" and new_status == "approuve":
            balance = LeaveBalance.objects.filter(
                employee=instance.employee,
                leave_type=instance.leave_type,
                annee=instance.date_debut.year,
            ).first()
            if balance:
                balance.jours_utilises = Decimal(str(balance.jours_utilises)) + Decimal(str(instance.nombre_jours))
                balance.save()

        elif old_status == "approuve" and new_status in ["rejete", "annule"]:
            balance = LeaveBalance.objects.filter(
                employee=instance.employee,
                leave_type=instance.leave_type,
                annee=instance.date_debut.year,
            ).first()
            if balance:
                balance.jours_utilises = max(
                    Decimal("0.00"),
                    Decimal(str(balance.jours_utilises)) - Decimal(str(instance.nombre_jours))
                )
                balance.save()