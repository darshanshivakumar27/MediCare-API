from rest_framework.routers import DefaultRouter
from apps.doctors.views import DoctorViewSet

app_name = 'doctors'

router = DefaultRouter()
router.register(r'doctors', DoctorViewSet, basename='doctor')

urlpatterns = router.urls
