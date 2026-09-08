from decimal import Decimal
from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets
from .serializers import (
    DepartmentSerializer,
    EmployeeSerializer,
    EmployeeCreateSerializer,
    EmployeeUpdateSerializer,
    UserProfileUpdateSerializer,
    EmployeeHistorySerializer,
)
from apps.core.mixins import CompanyScopedQuerySetMixin
from apps.core.permissions import IsAdminOrManagerOrReadOnly, IsAdminOnlyOrReadOnly
from .models import Department, Employee, EmployeeHistory
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status


def _record_employee_changes(instance, old_state, reason, user):
    today = timezone.now().date()
    created_by = user if (user and user.is_authenticated) else None

    # 1. Poste / Promotion
    if instance.poste != old_state["poste"]:
        field = "promotion" if "promot" in (reason or "").lower() else "poste"
        EmployeeHistory.objects.create(
            company=instance.company,
            employee=instance,
            field=field,
            old_value=old_state["poste"],
            new_value=instance.poste,
            change_date=today,
            reason=reason or "Changement de poste",
            created_by=created_by,
        )

    # 2. Salaire
    try:
        old_sal = Decimal(str(old_state["salaire_de_base"] or 0))
        new_sal = Decimal(str(instance.salaire_de_base or 0))
    except Exception:
        old_sal = old_state["salaire_de_base"]
        new_sal = instance.salaire_de_base

    if old_sal != new_sal:
        EmployeeHistory.objects.create(
            company=instance.company,
            employee=instance,
            field="salaire",
            old_value=str(old_state["salaire_de_base"]),
            new_value=str(instance.salaire_de_base),
            change_date=today,
            reason=reason or "Ajustement salarial",
            created_by=created_by,
        )

    # 3. Département (Transfert)
    if instance.department_id != old_state["department_id"]:
        old_dept = old_state["department"]
        old_dept_nom = old_dept.nom if old_dept else "Aucun"
        new_dept_nom = instance.department.nom if instance.department else "Aucun"
        EmployeeHistory.objects.create(
            company=instance.company,
            employee=instance,
            field="transfert",
            old_value=old_dept_nom,
            new_value=new_dept_nom,
            department=instance.department,
            change_date=today,
            reason=reason or "Transfert de département",
            created_by=created_by,
        )

    # 4. Type de contrat
    if instance.type_contrat != old_state["type_contrat"]:
        EmployeeHistory.objects.create(
            company=instance.company,
            employee=instance,
            field="changement_contrat",
            old_value=old_state["type_contrat"],
            new_value=instance.type_contrat,
            contract_type=instance.type_contrat,
            change_date=today,
            reason=reason or "Changement de type de contrat",
            created_by=created_by,
        )

    # 5. Statut
    if instance.statut != old_state["statut"]:
        field = "depart" if instance.statut in ["inactif", "suspendu"] else "statut"
        EmployeeHistory.objects.create(
            company=instance.company,
            employee=instance,
            field=field,
            old_value=old_state["statut"],
            new_value=instance.statut,
            change_date=today,
            reason=reason or f"Changement de statut ({instance.statut})",
            created_by=created_by,
        )


def _initialize_employee_career(employee, user):
    created_by = user if (user and user.is_authenticated) else None
    hire_date = employee.date_embauche or timezone.now().date()
    contract_label = employee.get_type_contrat_display() if hasattr(employee, "get_type_contrat_display") else (employee.type_contrat or "").upper()

    # 1. Événement initial d'embauche
    EmployeeHistory.objects.create(
        company=employee.company,
        employee=employee,
        field="embauche",
        old_value="",
        new_value=employee.poste,
        contract_type=employee.type_contrat,
        department=employee.department,
        change_date=hire_date,
        reason=f"Entrée en fonction en contrat {contract_label} au poste de {employee.poste}",
        created_by=created_by,
    )

    # 2. Jalon salarial initial d'embauche
    if employee.salaire_de_base and Decimal(str(employee.salaire_de_base)) > 0:
        EmployeeHistory.objects.create(
            company=employee.company,
            employee=employee,
            field="salaire",
            old_value="0",
            new_value=str(employee.salaire_de_base),
            change_date=hire_date,
            reason="Fixation du salaire initial d'embauche",
            created_by=created_by,
        )


class DepartmentViewSet(CompanyScopedQuerySetMixin, viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
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


class EmployeeViewSet(CompanyScopedQuerySetMixin, viewsets.ModelViewSet):
    queryset = Employee.objects.filter(is_active=True, deleted_at__isnull=True)
    serializer_class = EmployeeSerializer
    permission_classes = [IsAdminOnlyOrReadOnly]
    filterset_fields = ["department", "statut", "type_contrat", "manager"]

    def get_permissions(self):
        if self.action == "recommend_evolution":
            return [IsAdminOrManagerOrReadOnly()]
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        queryset = super().get_queryset().filter(is_active=True, deleted_at__isnull=True)
        search = self.request.query_params.get("search", "")
        if search:
            queryset = queryset.filter(
                user__first_name__icontains=search
            ) | queryset.filter(user__last_name__icontains=search) | queryset.filter(poste__icontains=search) | queryset.filter(matricule__icontains=search)
        ordering = self.request.query_params.get("ordering", "-date_creation")
        return queryset.order_by(ordering)

    def perform_create(self, serializer):
        employee = serializer.save()
        _initialize_employee_career(employee, self.request.user)

    @action(detail=False, methods=["post"], url_path="create-with-user")
    def create_with_user(self, request):
        serializer = EmployeeCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        employee = serializer.save()

        # Initialisation complète du parcours professionnel (embauche + salaire initial)
        _initialize_employee_career(employee, request.user)

        return Response(EmployeeSerializer(employee).data, status=status.HTTP_201_CREATED)


    @action(detail=True, methods=["patch"], url_path="profile")
    def update_profile(self, request, pk=None):
        employee = self.get_object()
        serializer = UserProfileUpdateSerializer(employee.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(EmployeeSerializer(employee).data, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        employee = self.get_object()
        employee.is_active = False
        employee.deleted_at = timezone.now()
        employee.save(update_fields=["is_active", "deleted_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_state = {
            "poste": instance.poste,
            "salaire_de_base": instance.salaire_de_base,
            "department": instance.department,
            "department_id": instance.department_id,
            "type_contrat": instance.type_contrat,
            "statut": instance.statut,
        }
        reason = request.data.get("change_reason") or request.data.get("reason") or "Modification manuelle"
        serializer = EmployeeUpdateSerializer(instance, data=request.data, partial=False, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        instance.refresh_from_db()
        _record_employee_changes(instance, old_state, reason, request.user)
        return Response(EmployeeSerializer(instance).data, status=status.HTTP_200_OK)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_state = {
            "poste": instance.poste,
            "salaire_de_base": instance.salaire_de_base,
            "department": instance.department,
            "department_id": instance.department_id,
            "type_contrat": instance.type_contrat,
            "statut": instance.statut,
        }
        reason = request.data.get("change_reason") or request.data.get("reason") or "Modification manuelle"
        serializer = EmployeeUpdateSerializer(instance, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        instance.refresh_from_db()
        _record_employee_changes(instance, old_state, reason, request.user)
        return Response(EmployeeSerializer(instance).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="recommend-evolution")
    def recommend_evolution(self, request, pk=None):
        employee = self.get_object()
        user = request.user
        if not user or not user.is_authenticated:
            return Response({"detail": "Non authentifié."}, status=status.HTTP_401_UNAUTHORIZED)

        profile = getattr(user, "employee_profile", None)

        # Autorisation : manager direct de l'employé ou administration RH / Direction
        is_direct_manager = bool(profile and employee.manager_id == profile.id)
        is_hr_or_admin = user.role in ["responsable_rh", "admin_rh", "superadmin", "pdg"]

        if not (is_direct_manager or is_hr_or_admin):
            return Response(
                {"detail": "Vous ne pouvez recommander une évolution que pour les collaborateurs sous votre responsabilité directe."},
                status=status.HTTP_403_FORBIDDEN,
            )

        evolution_type = request.data.get("evolution_type", "promotion")
        proposed_value = (request.data.get("proposed_value") or "").strip()
        justification = (request.data.get("justification") or "").strip()

        if not justification:
            return Response(
                {"detail": "Une justification managériale est requise."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        evolution_labels = {
            "promotion": "Promotion de poste",
            "salaire": "Revalorisation salariale",
            "changement_contrat": "Changement / Pérennisation de contrat",
            "transfert": "Transfert de département",
            "autre": "Évolution de carrière",
        }
        evolution_label = evolution_labels.get(evolution_type, evolution_type)

        history_item = EmployeeHistory.objects.create(
            company=employee.company,
            employee=employee,
            field="recommandation",
            old_value=f"Type: {evolution_label}",
            new_value=proposed_value,
            change_date=timezone.now().date(),
            reason=f"[Recommandation managériale par {user.get_full_name() or user.email}] {justification}",
            created_by=user,
        )

        # Notifier les équipes RH et Direction
        from apps.accounts.models import User
        from apps.notifications.utils import create_notification
        hr_users = User.objects.filter(
            company=employee.company,
            role__in=["responsable_rh", "admin_rh", "superadmin", "pdg"],
        ).exclude(pk=user.pk)

        emp_name = employee.user.get_full_name() if employee.user else employee.poste
        mgr_name = user.get_full_name() or user.email

        for hr_user in hr_users:
            create_notification(
                recipient=hr_user,
                title=f"Recommandation RH ({mgr_name}) : {emp_name}",
                message=f"Le manager {mgr_name} recommande une évolution ({evolution_label} : {proposed_value}) pour {emp_name}.\nMotif: {justification}",
                link=f"/employees/{employee.id}",
            )

        return Response(
            {
                "status": "success",
                "message": "Votre recommandation a été transmise aux Ressources Humaines avec succès.",
                "history_id": str(history_item.id),
            },
            status=status.HTTP_201_CREATED,
        )


class EmployeeHistoryViewSet(CompanyScopedQuerySetMixin, viewsets.ModelViewSet):
    queryset = EmployeeHistory.objects.select_related("employee", "department", "created_by").all()
    serializer_class = EmployeeHistorySerializer
    permission_classes = [IsAdminOnlyOrReadOnly]
    filterset_fields = ["employee", "field"]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        ordering = self.request.query_params.get("ordering", "change_date")

        if not user or not user.is_authenticated:
            return queryset.none()

        # Sécurisation stricte selon les rôles :
        if user.role == "employe":
            # L'employé ne peut accéder qu'à son propre historique
            profile = getattr(user, "employee_profile", None)
            if not profile:
                return queryset.none()
            return queryset.filter(employee=profile).order_by(ordering, "date_creation")

        if user.role == "manager":
            profile = getattr(user, "employee_profile", None)
            if profile:
                queryset = queryset.filter(Q(employee=profile) | Q(employee__manager=profile))
            else:
                return queryset.none()

        employee_id = self.request.query_params.get("employee")
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        return queryset.order_by(ordering, "date_creation")

    def perform_create(self, serializer):
        user = self.request.user
        company = getattr(user, "company", None)
        employee = serializer.validated_data.get("employee")
        if not company and employee:
            company = employee.company
        if not company:
            from apps.companies.models import Company
            company = Company.objects.first()

        history_item = serializer.save(company=company, created_by=user if user.is_authenticated else None)

        # Synchronisation automatique sur la fiche de l'employé
        if employee:
            update_fields = []
            # 1. Ajustement salarial
            if history_item.field == "salaire" and history_item.new_value:
                try:
                    employee.salaire_de_base = Decimal(str(history_item.new_value))
                    update_fields.append("salaire_de_base")
                except Exception:
                    pass
            # 2. Promotion ou changement de poste
            elif history_item.field in ("promotion", "poste") and history_item.new_value:
                employee.poste = history_item.new_value
                update_fields.append("poste")
            # 3. Changement de type de contrat (CDI, CDD, Stage, Freelance)
            elif history_item.field in ("changement_contrat", "stage", "embauche"):
                raw_contract = (history_item.contract_type or history_item.new_value or "").lower().strip()
                if raw_contract in ["cdi", "cdd", "stage", "freelance"]:
                    employee.type_contrat = raw_contract
                    update_fields.append("type_contrat")
            # 4. Transfert de département
            elif history_item.field == "transfert":
                if history_item.department:
                    employee.department = history_item.department
                    update_fields.append("department")
                elif history_item.new_value:
                    from apps.employees.models import Department
                    dept = Department.objects.filter(company=employee.company, nom__iexact=history_item.new_value.strip()).first()
                    if dept:
                        employee.department = dept
                        update_fields.append("department")
            # 5. Départ ou changement de statut
            elif history_item.field == "depart":
                employee.statut = "inactif"
                update_fields.append("statut")
                if history_item.change_date:
                    employee.date_fin_contrat = history_item.change_date
                    update_fields.append("date_fin_contrat")
            elif history_item.field == "statut" and history_item.new_value:
                raw_statut = history_item.new_value.lower().strip()
                if raw_statut in ["actif", "inactif", "suspendu", "en_conge"]:
                    employee.statut = raw_statut
                    update_fields.append("statut")

            if update_fields:
                employee.save(update_fields=list(set(update_fields)))