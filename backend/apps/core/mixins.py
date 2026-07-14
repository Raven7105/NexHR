class CompanyScopedQuerySetMixin:
    """
    Limite automatiquement les résultats d'un ViewSet à l'entreprise
    de l'utilisateur connecté. Le super_admin voit tout, sans filtre.
    """
    company_lookup = "company"

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if user.role == "super_admin":
            return queryset

        return queryset.filter(**{self.company_lookup: user.company})