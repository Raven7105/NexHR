from rest_framework.routers import DefaultRouter

from .views import LeaveTypeViewSet, LeaveBalanceViewSet, LeaveRequestViewSet

router = DefaultRouter()
router.register("leave-types", LeaveTypeViewSet)
router.register("leave-balances", LeaveBalanceViewSet)
router.register("leave-requests", LeaveRequestViewSet)

urlpatterns = router.urls