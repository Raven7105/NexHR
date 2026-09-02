# type: ignore
# pyrefly: ignore [missing-import]
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
# pyrefly: ignore [missing-import]
from rest_framework.test import APIRequestFactory

# pyrefly: ignore [missing-import]
from apps.companies.models import Company

# pyrefly: ignore [missing-import]
from apps.core.permissions import (
    CanValidateLeaveRequest,
    IsAdminOrOwnManagerOrReadOnly,
    IsEmployeeSelfOrAdminOrManagerOrReadOnly,
)

# pyrefly: ignore [missing-import]
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

    def test_responsable_rh_can_validate_requests(self):
        factory = APIRequestFactory()
        request = factory.patch("/leave-requests/1/", data={})
        request.user = get_user_model().objects.create_user(
            email="responsablerh@nexhr.test",
            password="secret123",
            role="responsable_rh",
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


class LeaveSequentialWorkflowTests(TestCase):
    def setUp(self):
        self.company = Company.objects.create(nom="NexHR", slug="nexhr", email_contact="contact@nexhr.test")
        self.department = Department.objects.create(company=self.company, nom="Tech", code="IT")
        
        # User PDG
        self.pdg_user = get_user_model().objects.create_user(email="pdg@nexhr.test", password="secret", role="pdg", company=self.company)
        
        # User RH
        self.rh_user = get_user_model().objects.create_user(email="rh@nexhr.test", password="secret", role="responsable_rh", company=self.company)
        
        # Manager & Employee
        self.manager_user = get_user_model().objects.create_user(email="mgr@nexhr.test", password="secret", role="manager", company=self.company)
        self.manager_emp = Employee.objects.create(user=self.manager_user, company=self.company, department=self.department, poste="Lead Tech", date_embauche="2024-01-01")
        
        self.emp_user = get_user_model().objects.create_user(email="dev@nexhr.test", password="secret", role="employe", company=self.company)
        self.employee = Employee.objects.create(user=self.emp_user, company=self.company, department=self.department, manager=self.manager_emp, poste="Développeur", date_embauche="2024-01-01")

        self.leave_type = LeaveType.objects.create(company=self.company, nom="Congés payés", jours_par_an=25)
        self.balance, _ = LeaveBalance.objects.get_or_create(employee=self.employee, leave_type=self.leave_type, annee=2026, defaults={"jours_alloues": 25, "jours_utilises": 0})

        self.leave_req = LeaveRequest.objects.create(
            employee=self.employee,
            leave_type=self.leave_type,
            date_debut="2026-09-15",
            date_fin="2026-09-20",
            nombre_jours=6,
            motif="Vacances d'été",
            statut="PENDING_MANAGER"
        )

    def test_full_successful_3_tier_workflow(self):
        from rest_framework.test import APIClient
        client = APIClient()

        # Step 1: Manager Approve
        client.force_authenticate(user=self.manager_user)
        res1 = client.post(f"/api/leave-requests/{self.leave_req.id}/manager-approve/", {"comment": "OK Manager"})
        self.assertEqual(res1.status_code, 200)
        self.leave_req.refresh_from_db()
        self.assertEqual(self.leave_req.statut, "PENDING_HR")
        self.assertEqual(self.leave_req.manager_status, "APPROVED")

        # Step 2: RH Approve
        client.force_authenticate(user=self.rh_user)
        res2 = client.post(f"/api/leave-requests/{self.leave_req.id}/hr-approve/", {"comment": "OK RH"})
        self.assertEqual(res2.status_code, 200)
        self.leave_req.refresh_from_db()
        self.assertEqual(self.leave_req.statut, "PENDING_CEO")
        self.assertEqual(self.leave_req.hr_status, "APPROVED")

        # Step 3: PDG Approve
        client.force_authenticate(user=self.pdg_user)
        res3 = client.post(f"/api/leave-requests/{self.leave_req.id}/ceo-approve/", {"comment": "OK PDG"})
        self.assertEqual(res3.status_code, 200)
        self.leave_req.refresh_from_db()
        self.assertEqual(self.leave_req.statut, "APPROVED")
        self.assertEqual(self.leave_req.ceo_status, "APPROVED")
        self.assertIsNotNone(self.leave_req.authorization_number)
        self.assertTrue(self.leave_req.authorization_number.startswith("AUT-CON-2026-"))
        self.assertTrue(bool(self.leave_req.authorization_document))

        # Check balance deduction after PDG approval
        self.balance.refresh_from_db()
        self.assertEqual(self.balance.jours_utilises, 6)

    def test_ceo_cannot_approve_pending_manager_request(self):
        from rest_framework.test import APIClient
        client = APIClient()
        client.force_authenticate(user=self.pdg_user)

        res = client.post(f"/api/leave-requests/{self.leave_req.id}/ceo-approve/", {"comment": "Accélération"})
        self.assertEqual(res.status_code, 400)
        self.leave_req.refresh_from_db()
        self.assertEqual(self.leave_req.statut, "PENDING_MANAGER")

    def test_manager_rejection_blocks_workflow(self):
        from rest_framework.test import APIClient
        client = APIClient()
        client.force_authenticate(user=self.manager_user)

        res = client.post(f"/api/leave-requests/{self.leave_req.id}/manager-reject/", {"comment": "Forte activité"})
        self.assertEqual(res.status_code, 200)
        self.leave_req.refresh_from_db()
        self.assertEqual(self.leave_req.statut, "REJECTED")

        # RH cannot approve a rejected request
        client.force_authenticate(user=self.rh_user)
        res_rh = client.post(f"/api/leave-requests/{self.leave_req.id}/hr-approve/", {"comment": "OK RH"})
        self.assertEqual(res_rh.status_code, 400)

    def test_manager_request_creation_starts_at_pending_hr(self):
        from rest_framework.test import APIClient
        client = APIClient()
        LeaveBalance.objects.get_or_create(employee=self.manager_emp, leave_type=self.leave_type, annee=2026, defaults={"jours_alloues": 25})
        client.force_authenticate(user=self.manager_user)

        res = client.post("/api/leave-requests/", {
            "leave_type": str(self.leave_type.id),
            "date_debut": "2026-10-01",
            "date_fin": "2026-10-05",
            "motif": "Congé Manager"
        })
        self.assertEqual(res.status_code, 201, msg=f"Error: {res.data}")
        self.assertEqual(res.data["statut"], "PENDING_HR")

    def test_rh_request_creation_starts_at_pending_ceo(self):
        from rest_framework.test import APIClient
        client = APIClient()

        # Employee profile for RH
        rh_emp = Employee.objects.create(user=self.rh_user, company=self.company, department=self.department, poste="Responsable RH", date_embauche="2024-01-01")
        LeaveBalance.objects.get_or_create(employee=rh_emp, leave_type=self.leave_type, annee=2026, defaults={"jours_alloues": 25})

        client.force_authenticate(user=self.rh_user)
        res = client.post("/api/leave-requests/", {
            "leave_type": str(self.leave_type.id),
            "date_debut": "2026-11-01",
            "date_fin": "2026-11-05",
            "motif": "Congé RH"
        })
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["statut"], "PENDING_CEO")

    def test_pdg_cannot_create_leave_request(self):
        from rest_framework.test import APIClient
        client = APIClient()
        client.force_authenticate(user=self.pdg_user)

        res = client.post("/api/leave-requests/", {
            "leave_type": str(self.leave_type.id),
            "date_debut": "2026-12-01",
            "date_fin": "2026-12-05",
            "motif": "Tentative PDG"
        })
        self.assertTrue(res.status_code in [400, 403])

    def test_leave_type_creation_automatically_populates_balances_for_existing_employees(self):
        # Create a new LeaveType
        new_lt = LeaveType.objects.create(company=self.company, nom="Congé Formation", jours_par_an=10)
        current_year = timezone.now().year

        # Check that LeaveBalance was created automatically for employee
        bal = LeaveBalance.objects.filter(employee=self.employee, leave_type=new_lt, annee=current_year).first()
        self.assertIsNotNone(bal)
        self.assertEqual(bal.jours_alloues, 10)
        self.assertEqual(bal.jours_utilises, 0)
        self.assertEqual(bal.jours_restants, 10)

    def test_employee_creation_automatically_populates_balances_for_active_leave_types(self):
        new_user = get_user_model().objects.create_user(email="newemp@nexhr.test", password="secret", role="employe", company=self.company)
        new_emp = Employee.objects.create(user=new_user, company=self.company, department=self.department, poste="Designer", date_embauche="2024-01-01")
        current_year = timezone.now().year

        bal = LeaveBalance.objects.filter(employee=new_emp, leave_type=self.leave_type, annee=current_year).first()
        self.assertIsNotNone(bal)
        self.assertEqual(bal.jours_alloues, 25)

    def test_individual_balance_isolation(self):
        emp2_user = get_user_model().objects.create_user(email="emp2@nexhr.test", password="secret", role="employe", company=self.company)
        emp2 = Employee.objects.create(user=emp2_user, company=self.company, department=self.department, poste="Dev 2", date_embauche="2024-01-01")
        current_year = timezone.now().year

        bal1 = LeaveBalance.objects.get(employee=self.employee, leave_type=self.leave_type, annee=current_year)
        bal2 = LeaveBalance.objects.get(employee=emp2, leave_type=self.leave_type, annee=current_year)

        bal1.jours_utilises = 5
        bal1.save()

        bal2.refresh_from_db()
        self.assertEqual(bal2.jours_utilises, 0)
        self.assertEqual(bal2.jours_restants, 25)
        self.assertEqual(bal1.jours_restants, 20)

    def test_get_my_leave_balances_endpoint(self):
        from rest_framework.test import APIClient
        client = APIClient()
        client.force_authenticate(user=self.emp_user)

        res = client.get("/api/leave-balances/me/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["leave_type_nom"], "Congés payés")
        self.assertEqual(float(res.data[0]["jours_restants"]), 25.0)

