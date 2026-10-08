from rest_framework.routers import SimpleRouter
from apps.doctors.views import DoctorViewSet

app_name = 'doctors'

router = SimpleRouter()
router.register(r'doctors', DoctorViewSet, basename='doctor')

urlpatterns = router.urls
