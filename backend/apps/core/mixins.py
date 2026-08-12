class CompanyScopedQuerySetMixin:
    
    company_lookup = "company"

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if user.role == "superadmin":
            return queryset

        return queryset.filter(**{self.company_lookup: user.company})