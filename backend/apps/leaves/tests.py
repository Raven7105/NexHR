from django.test import TestCase
from django.contrib.auth import get_user_model
# pyrefly: ignore [missing-import]
from rest_framework.test import APIRequestFactory

from apps.companies.models import Company
from apps.core.permissions import (
    CanValidateLeaveRequest,
    IsAdminOrOwnManagerOrReadOnly,
    IsEmployeeSelfOrAdminOrManagerOrReadOnly,
)
from apps.employees.models import Department, Employee
from .models import LeaveBalance, LeaveRequest, LeaveType


class LeavePermissionTests(TestCase):
    def setUp(self):
        self.company = Company.objects.create(
            nom="NexHR",
            slug="nexhr",
            email_contact="contact@nexhr.test",
        )
        self.user = get_user_model().objects.create_user(
            email="employee@nexhr.test",
            password="secret123",
            role="employe",
            company=self.company,
        )
        self.department = Department.objects.create(
            company=self.company,
            nom="RH",
            code="RH",
            description="RH",
        )
        self.employee = Employee.objects.create(
            user=self.user,
            company=self.company,
            department=self.department,
            poste="Consultant",
            date_embauche="2024-01-01",
        )

    def test_employee_can_create_leave_request(self):
        factory = APIRequestFactory()
        request = factory.post("/leave-requests/", data={})
        request.user = self.user

        permission = IsEmployeeSelfOrAdminOrManagerOrReadOnly()

        self.assertTrue(permission.has_permission(request, None))


class LeaveValidationPermissionTests(TestCase):
    def setUp(self):
        self.company = Company.objects.create(
            nom="NexHR",
            slug="nexhr",
            email_contact="contact@nexhr.test",
        )
        self.department = Department.objects.create(
            company=self.company,
            nom="RH",
            code="RH",
            description="RH",
        )
        self.manager_user = get_user_model().objects.create_user(
            email="manager@nexhr.test",
            password="secret123",
            role="manager",
            company=self.company,
        )
        self.manager_employee = Employee.objects.create(
            user=self.manager_user,
            company=self.company,
            department=self.department,
            poste="Manager",
            date_embauche="2024-01-01",
        )
        self.other_manager_user = get_user_model().objects.create_user(
            email="other-manager@nexhr.test",
            password="secret123",
            role="manager",
            company=self.company,
        )
        self.other_manager_employee = Employee.objects.create(
            user=self.other_manager_user,
            company=self.company,
            department=self.department,
            poste="Manager",
            date_embauche="2024-01-01",
        )
        self.employee_user = get_user_model().objects.create_user(
            email="employee2@nexhr.test",
            password="secret123",
            role="employe",
            company=self.company,
        )
        self.subordinate_employee = Employee.objects.create(
            user=self.employee_user,
            company=self.company,
            department=self.department,
            manager=self.manager_employee,
            poste="Consultant",
            date_embauche="2024-01-01",
        )
        self.other_employee_user = get_user_model().objects.create_user(
            email="employee3@nexhr.test",
            password="secret123",
            role="employe",
            company=self.company,
        )
        self.other_employee = Employee.objects.create(
            user=self.other_employee_user,
            company=self.company,
            department=self.department,
            manager=self.other_manager_employee,
            poste="Consultant",
            date_embauche="2024-01-01",
        )
        self.leave_type = LeaveType.objects.create(
            company=self.company,
            nom="Congés payés",
            jours_par_an=25,
        )
        self.leave_request = LeaveRequest.objects.create(
            employee=self.subordinate_employee,
            leave_type=self.leave_type,
            date_debut="2024-06-10",
            date_fin="2024-06-12",
            nombre_jours=3,
            statut="en_attente",
        )
        self.other_leave_request = LeaveRequest.objects.create(
            employee=self.other_employee,
            leave_type=self.leave_type,
            date_debut="2024-06-10",
            date_fin="2024-06-12",
            nombre_jours=3,
            statut="en_attente",
        )
        self.unmanaged_request = LeaveRequest.objects.create(
            employee=Employee.objects.create(
                user=get_user_model().objects.create_user(
                    email="employee4@nexhr.test",
                    password="secret123",
                    role="employe",
                    company=self.company,
                ),
                company=self.company,
                department=self.department,
                poste="Consultant",
                date_embauche="2024-01-01",
            ),
            leave_type=self.leave_type,
            date_debut="2024-06-10",
            date_fin="2024-06-12",
            nombre_jours=3,
            statut="en_attente",
        )

    def test_manager_can_validate_their_subordinate_request(self):
        factory = APIRequestFactory()
        request = factory.patch("/leave-requests/1/", data={})
        request.user = self.manager_user

        permission = CanValidateLeaveRequest()

        self.assertTrue(permission.has_object_permission(request, None, self.leave_request))

    def test_manager_cannot_validate_request_from_other_team(self):
        factory = APIRequestFactory()
        request = factory.patch("/leave-requests/1/", data={})
        request.user = self.manager_user

        permission = CanValidateLeaveRequest()

        self.assertFalse(permission.has_object_permission(request, None, self.other_leave_request))

    def test_admin_rh_can_validate_requests(self):
        factory = APIRequestFactory()
        request = factory.patch("/leave-requests/1/", data={})
        request.user = get_user_model().objects.create_user(
            email="adminrh@nexhr.test",
            password="secret123",
            role="admin_rh",
            company=self.company,
        )

        permission = CanValidateLeaveRequest()

        self.assertTrue(permission.has_object_permission(request, None, self.unmanaged_request))
        self.assertTrue(permission.has_object_permission(request, None, self.leave_request))

    def test_employee_can_cancel_own_pending_request(self):
        factory = APIRequestFactory()
        request = factory.patch("/leave-requests/1/", data={"statut": "annule"}, format="json")
        request.user = self.employee_user

        permission = CanValidateLeaveRequest()

        self.assertTrue(permission.has_object_permission(request, None, self.leave_request))
