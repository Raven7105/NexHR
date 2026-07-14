from rest_framework.routers import DefaultRouter

from .views import PayrollSettingViewSet, SalaryComponentViewSet, PayslipViewSet, PayslipItemViewSet

router = DefaultRouter()
router.register("payroll-settings", PayrollSettingViewSet)
router.register("salary-components", SalaryComponentViewSet)
router.register("payslips", PayslipViewSet)
router.register("payslip-items", PayslipItemViewSet)

urlpatterns = router.urls