class CompanyScopedQuerySetMixin:
    
    company_lookup = "company"

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if not user or not user.is_authenticated:
            return queryset.none()

        if getattr(user, "role", None) == "superadmin":
            return queryset

        return queryset.filter(**{self.company_lookup: user.company})