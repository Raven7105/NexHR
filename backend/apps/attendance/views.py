from django.shortcuts import render

from rest_framework import viewsets
from apps.core.mixins import CompanyScopedQuerySetMixin
from apps.core.permissions import IsAdminOrManagerOrReadOnly, IsAdminOrOwnManagerOrReadOnly
from .serializers import HolidaySerializer, AttendanceSerializer
from .models import Holiday, Attendance


# Create your views here.

class HolidayViewSet(CompanyScopedQuerySetMixin, viewsets.ModelViewSet):
    queryset = Holiday.objects.all()
    serializer_class = HolidaySerializer
    permission_classes = [IsAdminOrManagerOrReadOnly]

class AttendanceViewSet(CompanyScopedQuerySetMixin, viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    company_lookup = "employee__company"
    permission_classes = [IsAdminOrOwnManagerOrReadOnly]
    filterset_fields = ["statut", "date", "employee"]