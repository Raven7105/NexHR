from rest_framework.routers import DefaultRouter

from .views import HolidayViewSet, AttendanceViewSet

router = DefaultRouter()
router.register("holidays", HolidayViewSet)
router.register("attendances", AttendanceViewSet)

urlpatterns = router.urls