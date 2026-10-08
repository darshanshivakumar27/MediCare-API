from rest_framework import permissions, status
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.doctors.models import Doctor
from apps.mappings.models import PatientDoctorMapping
from apps.mappings.serializers import PatientDoctorMappingSerializer
from apps.patients.models import Patient


class MappingListCreateView(APIView):
    """
    API View for Patient-Doctor Mapping collection operations.

    Endpoints:
    - POST /api/mappings/ -> Assign a doctor to a patient
    - GET  /api/mappings/ -> Retrieve all mappings for patients owned by the user
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Retrieve all mappings for patients created by the authenticated user.
        """
        mappings = PatientDoctorMapping.objects.filter(
            patient__created_by=request.user
        ).select_related('patient', 'doctor')
        serializer = PatientDoctorMappingSerializer(mappings, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """
        Assign a doctor to a patient.
        Ensures the patient belongs to the authenticated user (anti-IDOR).
        Enforces existence checks and duplicate prevention.
        """
        patient_id = request.data.get('patient')
        doctor_id = request.data.get('doctor')

        errors = {}
        if patient_id is None:
            errors['patient'] = ['This field is required.']
        if doctor_id is None:
            errors['doctor'] = ['This field is required.']
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        # Validate patient exists AND belongs to the requesting user
        try:
            patient = Patient.objects.get(id=patient_id, created_by=request.user)
        except (Patient.DoesNotExist, ValueError):
            raise NotFound('Patient with this ID does not exist.')

        # Validate doctor exists
        try:
            doctor = Doctor.objects.get(id=doctor_id)
        except (Doctor.DoesNotExist, ValueError):
            raise NotFound('Doctor with this ID does not exist.')

        # Check for existing duplicate mapping
        if PatientDoctorMapping.objects.filter(patient=patient, doctor=doctor).exists():
            return Response(
                {'non_field_errors': ['This doctor is already assigned to this patient.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create mapping
        mapping = PatientDoctorMapping.objects.create(patient=patient, doctor=doctor)
        serializer = PatientDoctorMappingSerializer(mapping)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MappingDetailView(APIView):
    """
    API View for specific patient mappings and mapping deletion.

    Endpoints:
    - GET    /api/mappings/<patient_id>/ -> Get all doctors assigned to a specific patient
    - DELETE /api/mappings/<id>/         -> Remove a doctor from a patient by mapping ID
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        """
        Retrieve all doctor mappings for the specified patient ID.
        Verifies that the patient belongs to the requesting user.
        """
        try:
            patient = Patient.objects.get(id=pk, created_by=request.user)
        except (Patient.DoesNotExist, ValueError):
            raise NotFound('Patient with this ID does not exist.')

        mappings = PatientDoctorMapping.objects.filter(
            patient=patient
        ).select_related('patient', 'doctor')
        serializer = PatientDoctorMappingSerializer(mappings, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        """
        Remove doctor from patient by mapping ID.
        Verifies that the mapping's patient belongs to the requesting user.
        """
        try:
            mapping = PatientDoctorMapping.objects.get(
                id=pk,
                patient__created_by=request.user,
            )
        except (PatientDoctorMapping.DoesNotExist, ValueError):
            raise NotFound('Mapping with this ID does not exist.')

        mapping.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
