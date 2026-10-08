from rest_framework import permissions, viewsets

from apps.doctors.models import Doctor
from apps.doctors.serializers import DoctorSerializer


class DoctorViewSet(viewsets.ModelViewSet):
    """
    CRUD ViewSet for managing Doctor records.

    Endpoints:
    - POST   /api/doctors/       -> Add a new doctor (Authenticated users)
    - GET    /api/doctors/       -> Retrieve all doctors
    - GET    /api/doctors/<id>/  -> Get details of a specific doctor
    - PUT    /api/doctors/<id>/  -> Update doctor details
    - PATCH  /api/doctors/<id>/  -> Partial update doctor details
    - DELETE /api/doctors/<id>/  -> Delete a doctor record
    """
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [permissions.IsAuthenticated]
