from django.shortcuts import render

from rest_framework import viewsets
from .serializers import HolidaySerializer, AttendanceSerializer
from .models import Holiday, Attendance


# Create your views here.

class HolidayViewSet(viewsets.ModelViewSet):
    queryset = Holiday.objects.all()
    serializer_class = HolidaySerializer

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer