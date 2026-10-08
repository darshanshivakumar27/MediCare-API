from rest_framework import permissions, viewsets

from apps.patients.models import Patient
from apps.patients.serializers import PatientSerializer


class PatientViewSet(viewsets.ModelViewSet):
    """
    CRUD ViewSet for managing Patient records.

    Endpoints:
    - POST   /api/patients/       -> Create patient (auto-assigns created_by)
    - GET    /api/patients/       -> List patients created by authenticated user
    - GET    /api/patients/<id>/  -> Retrieve specific patient (owner only)
    - PUT    /api/patients/<id>/  -> Update patient details (owner only)
    - PATCH  /api/patients/<id>/  -> Partial update patient details (owner only)
    - DELETE /api/patients/<id>/  -> Delete patient record (owner only)

    Security & Anti-IDOR:
    All queryset operations are strictly isolated to `created_by = request.user`.
    If another authenticated user requests a patient ID they do not own,
    Django returns HTTP 404 Not Found, preventing user enumeration and data leakage.
    """
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Return only patients created by the currently authenticated user.
        """
        return Patient.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        """
        Bind the current authenticated user as the creator.
        """
        serializer.save(created_by=self.request.user)
