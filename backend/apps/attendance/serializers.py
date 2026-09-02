from rest_framework import serializers

from .models import Holiday, Attendance


class HolidaySerializer(serializers.ModelSerializer):
    class Meta : 
        model = Holiday
        fields = '__all__'
        read_only_fields = ("company",)

class AttendanceSerializer(serializers.ModelSerializer):
    class Meta :
        model = Attendance
        fields = '__all__'

