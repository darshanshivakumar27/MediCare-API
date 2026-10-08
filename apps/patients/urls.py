from rest_framework.routers import SimpleRouter
from apps.patients.views import PatientViewSet

app_name = 'patients'

router = SimpleRouter()
router.register(r'patients', PatientViewSet, basename='patient')

urlpatterns = router.urls
