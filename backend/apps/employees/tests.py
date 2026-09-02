from types import SimpleNamespace

from django.test import TestCase

from apps.accounts.models import User
from apps.companies.models import Company
from apps.employees.models import Employee
from apps.employees.serializers import EmployeeCreateSerializer


class EmployeeCreateSerializerTests(TestCase):
    def test_create_serializer_accepts_phone_number(self):
        company = Company.objects.create(
            nom="NexHR",
            slug="nexhr",
            email_contact="contact@nexhr.com",
        )
        request_user = User.objects.create_user(
            username="admin@nexhr.com",
            email="admin@nexhr.com",
            password="password123",
            role="responsable_rh",
            company=company,
        )

        serializer = EmployeeCreateSerializer(
            data={
                "email": "employee@nexhr.com",
                "password": "password123",
                "role": "employe",
                "poste": "Développeur",
                "type_contrat": "cdi",
                "date_embauche": "2024-01-15",
                "phone_number": "+221771234567",
            },
            context={"request": SimpleNamespace(user=request_user)},
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        employee = serializer.save()

        self.assertEqual(employee.phone_number, "+221771234567")
        self.assertTrue(Employee.objects.filter(pk=employee.pk).exists())
