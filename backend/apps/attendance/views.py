from django.shortcuts import render

from rest_framework import viewsets
from apps.core.mixins import CompanyScopedQuerySetMixin
from apps.core.permissions import IsAdminOrManagerOrReadOnly, IsAdminOrOwnManagerOrReadOnly
from .serializers import HolidaySerializer, AttendanceSerializer
from .models import Holiday, Attendance
from .filters import AttendanceFilter


# Create your views here.

class HolidayViewSet(CompanyScopedQuerySetMixin, viewsets.ModelViewSet):
    queryset = Holiday.objects.all()
    serializer_class = HolidaySerializer
    permission_classes = [IsAdminOrManagerOrReadOnly]

    def perform_create(self, serializer):
        user = self.request.user
        company = getattr(user, "company", None)
        if not company and getattr(user, "employee_profile", None):
            company = getattr(user.employee_profile, "company", None)
        if not company:
            from apps.companies.models import Company
            company = Company.objects.first()
        if company:
            serializer.save(company=company)
        else:
            serializer.save()

class AttendanceViewSet(CompanyScopedQuerySetMixin, viewsets.ModelViewSet):
    queryset = Attendance.objects.all().order_by("date")
    serializer_class = AttendanceSerializer
    company_lookup = "employee__company"
    permission_classes = [IsAdminOrOwnManagerOrReadOnly]
    filterset_class = AttendanceFilter
    pagination_class = None