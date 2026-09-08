from rest_framework.routers import DefaultRouter

from .views import DepartmentViewSet, EmployeeViewSet, EmployeeHistoryViewSet

router = DefaultRouter()
router.register("departments", DepartmentViewSet)
router.register("employees", EmployeeViewSet)
router.register("employee-history", EmployeeHistoryViewSet, basename="employee-history")

urlpatterns = router.urls