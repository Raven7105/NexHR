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


class EmployeeCareerHistoryTests(TestCase):
    def setUp(self):
        self.company = Company.objects.create(
            nom="NexHR Test",
            slug="nexhr-test",
            email_contact="contact@nexhr-test.com",
        )
        self.admin = User.objects.create_user(
            username="rh@nexhr-test.com",
            email="rh@nexhr-test.com",
            password="password123",
            role="responsable_rh",
            company=self.company,
        )
        self.dept_it = self.company.departments.create(nom="Informatique", code="IT")
        self.dept_sales = self.company.departments.create(nom="Commercial", code="COM")

    def test_automatic_history_on_create_and_update(self):
        from rest_framework.test import APIClient
        from apps.employees.models import EmployeeHistory

        client = APIClient()
        client.force_authenticate(user=self.admin)

        # 1. Création avec create-with-user
        create_resp = client.post(
            "/api/employees/create-with-user/",
            {
                "email": "dev@nexhr-test.com",
                "password": "password123",
                "role": "employe",
                "poste": "Développeur Junior",
                "type_contrat": "cdi",
                "date_embauche": "2024-01-01",
                "salaire_de_base": "500000.00",
                "department": str(self.dept_it.id),
            },
            format="json",
        )
        self.assertEqual(create_resp.status_code, 201)
        employee_id = create_resp.data["id"]

        # Vérification de l'événement initial d'embauche
        initial_history = EmployeeHistory.objects.filter(employee_id=employee_id)
        self.assertEqual(initial_history.count(), 1)
        event_embauche = initial_history.first()
        self.assertEqual(event_embauche.field, "embauche")
        self.assertEqual(event_embauche.new_value, "Développeur Junior")
        self.assertEqual(event_embauche.department, self.dept_it)

        # 2. Mise à jour de salaire et de poste
        patch_resp = client.patch(
            f"/api/employees/{employee_id}/",
            {
                "poste": "Développeur Senior",
                "salaire_de_base": "800000.00",
                "change_reason": "Promotion annuelle",
            },
            format="json",
        )
        self.assertEqual(patch_resp.status_code, 200)

        # Vérifier que les événements ont été créés
        events = EmployeeHistory.objects.filter(employee_id=employee_id).order_by("date_creation")
        self.assertEqual(events.count(), 3)  # embauche + promotion + salaire

        promot_event = events.filter(field="promotion").first()
        self.assertIsNotNone(promot_event)
        self.assertEqual(promot_event.old_value, "Développeur Junior")
        self.assertEqual(promot_event.new_value, "Développeur Senior")
        self.assertEqual(promot_event.reason, "Promotion annuelle")

        salary_event = events.filter(field="salaire").first()
        self.assertIsNotNone(salary_event)
        self.assertEqual(salary_event.old_value, "500000.00")
        self.assertEqual(salary_event.new_value, "800000.00")

        # 3. Transfert de département
        transfer_resp = client.patch(
            f"/api/employees/{employee_id}/",
            {
                "department": str(self.dept_sales.id),
                "change_reason": "Transfert interne",
            },
            format="json",
        )
        self.assertEqual(transfer_resp.status_code, 200)
        transfer_event = EmployeeHistory.objects.filter(employee_id=employee_id, field="transfert").first()
        self.assertIsNotNone(transfer_event)
        self.assertEqual(transfer_event.old_value, "Informatique")
        self.assertEqual(transfer_event.new_value, "Commercial")
        self.assertEqual(transfer_event.department, self.dept_sales)

    def test_manual_history_event_creation(self):
        from rest_framework.test import APIClient
        from apps.employees.models import Employee, EmployeeHistory

        user_emp = User.objects.create_user(
            username="jane@nexhr-test.com",
            email="jane@nexhr-test.com",
            password="password123",
            role="employe",
            company=self.company,
        )
        employee = Employee.objects.create(
            user=user_emp,
            company=self.company,
            poste="Comptable",
            type_contrat="cdi",
            date_embauche="2023-05-01",
            salaire_de_base=400000,
        )

        client = APIClient()
        client.force_authenticate(user=self.admin)

        post_resp = client.post(
            "/api/employee-history/",
            {
                "employee": str(employee.id),
                "field": "salaire",
                "old_value": "400000",
                "new_value": "450000",
                "change_date": "2024-06-01",
                "reason": "Revalorisation annuelle",
            },
            format="json",
        )
        self.assertEqual(post_resp.status_code, 201)
        self.assertEqual(post_resp.data["field"], "salaire")
        self.assertEqual(post_resp.data["reason"], "Revalorisation annuelle")

    def test_employee_permissions_and_isolation(self):
        from rest_framework.test import APIClient
        from apps.employees.models import Employee, EmployeeHistory

        user_emp = User.objects.create_user(
            username="paul@nexhr-test.com",
            email="paul@nexhr-test.com",
            password="password123",
            role="employe",
            company=self.company,
        )
        emp1 = Employee.objects.create(
            user=user_emp,
            company=self.company,
            poste="Agent de Support",
            type_contrat="cdi",
            date_embauche="2023-01-01",
            salaire_de_base=300000,
        )

        user_emp2 = User.objects.create_user(
            username="marie@nexhr-test.com",
            email="marie@nexhr-test.com",
            password="password123",
            role="employe",
            company=self.company,
        )
        emp2 = Employee.objects.create(
            user=user_emp2,
            company=self.company,
            poste="Ingénieur QA",
            type_contrat="cdi",
            date_embauche="2023-02-01",
            salaire_de_base=450000,
        )

        EmployeeHistory.objects.create(
            company=self.company,
            employee=emp1,
            field="embauche",
            new_value="Agent de Support",
            change_date="2023-01-01",
        )
        EmployeeHistory.objects.create(
            company=self.company,
            employee=emp2,
            field="embauche",
            new_value="Ingénieur QA",
            change_date="2023-02-01",
        )

        client = APIClient()
        client.force_authenticate(user=user_emp)

        # 1. L'employé essaie d'ajouter un événement -> 403 FORBIDDEN
        post_resp = client.post(
            "/api/employee-history/",
            {
                "employee": str(emp1.id),
                "field": "salaire",
                "new_value": "900000",
                "change_date": "2024-01-01",
            },
            format="json",
        )
        self.assertEqual(post_resp.status_code, 403)

        # 2. L'employé récupère l'historique -> il ne voit QUE le sien (1 événement)
        get_resp = client.get("/api/employee-history/")
        self.assertEqual(get_resp.status_code, 200)
        results = get_resp.data.get("results", get_resp.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(str(results[0]["employee"]), str(emp1.id))

        # 3. L'employé essaie de filtrer sur l'autre employé -> le backend bloque et renvoie une liste vide
        get_other_resp = client.get(f"/api/employee-history/?employee={emp2.id}")
        self.assertEqual(get_other_resp.status_code, 200)
        results_other = get_other_resp.data.get("results", get_other_resp.data)
        self.assertEqual(len(results_other), 0)




