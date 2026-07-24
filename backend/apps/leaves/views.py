from django.shortcuts import render

from rest_framework import viewsets
from apps.core.mixins import CompanyScopedQuerySetMixin
from apps.core.permissions import IsAdminOrManagerOrReadOnly, IsAdminOrOwnManagerOrReadOnly
from .models import LeaveType, LeaveBalance, LeaveRequest
from .serializers import LeaveTypeSerializer, LeaveBalanceSerializer, LeaveRequestSerializer
# Create your views here.


class LeaveTypeViewSet(CompanyScopedQuerySetMixin, viewsets.ModelViewSet):
    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer
    permission_classes = [IsAdminOrManagerOrReadOnly]


class LeaveBalanceViewSet(CompanyScopedQuerySetMixin, viewsets.ModelViewSet):
    queryset = LeaveBalance.objects.all()
    serializer_class = LeaveBalanceSerializer
    company_lookup = "employee__company"
    permission_classes = [IsAdminOrManagerOrReadOnly]


class LeaveRequestViewSet(CompanyScopedQuerySetMixin, viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.all()
    serializer_class = LeaveRequestSerializer
    company_lookup = "employee__company"
    permission_classes = [IsAdminOrOwnManagerOrReadOnly]
    filterset_fields = ["statut", "employee", "leave_type"]