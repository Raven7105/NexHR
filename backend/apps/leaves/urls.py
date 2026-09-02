from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import LeaveTypeViewSet, LeaveBalanceViewSet, LeaveRequestViewSet, verify_leave_public

router = DefaultRouter()
router.register("leave-types", LeaveTypeViewSet)
router.register("leave-balances", LeaveBalanceViewSet)
router.register("leave-requests", LeaveRequestViewSet)

urlpatterns = router.urls + [
    path("public/verify-leave/<str:token>/", verify_leave_public, name="verify-leave-public"),
]