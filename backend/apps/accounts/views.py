from django.shortcuts import render

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        employee_profile = None

        if hasattr(user, "employee_profile"):
            emp = user.employee_profile
            employee_profile = {
                "id": str(emp.id),
                "matricule": emp.matricule,
                "poste": emp.poste,
                "department": str(emp.department_id) if emp.department_id else None,
                "manager": str(emp.manager_id) if emp.manager_id else None,
            }

        return Response({
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "company": str(user.company_id) if user.company_id else None,
            "company_nom": user.company.nom if user.company else None,
            "employee_profile": employee_profile,
        })