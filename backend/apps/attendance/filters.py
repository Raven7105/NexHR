import django_filters
from .models import Attendance


class AttendanceFilter(django_filters.FilterSet):
    date_apres = django_filters.DateFilter(field_name="date", lookup_expr="gte")
    date_avant = django_filters.DateFilter(field_name="date", lookup_expr="lte")

    class Meta:
        model = Attendance
        fields = ["statut", "date", "employee", "date_apres", "date_avant"]