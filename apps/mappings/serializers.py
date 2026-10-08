from rest_framework import serializers

from apps.doctors.models import Doctor
from apps.mappings.models import PatientDoctorMapping
from apps.patients.models import Patient


class PatientDoctorMappingSerializer(serializers.ModelSerializer):
    """
    Serializer for Patient-Doctor Mapping representation.
    Includes human-readable names and doctor specialization
    while keeping payload concise and secure.
    """
    patient_name = serializers.ReadOnlyField(source='patient.name')
    doctor_name = serializers.ReadOnlyField(source='doctor.name')
    doctor_specialization = serializers.ReadOnlyField(source='doctor.specialization')
    doctor_email = serializers.ReadOnlyField(source='doctor.email')

    class Meta:
        model = PatientDoctorMapping
        fields = (
            'id',
            'patient',
            'patient_name',
            'doctor',
            'doctor_name',
            'doctor_specialization',
            'doctor_email',
            'assigned_at',
        )
        read_only_fields = ('id', 'assigned_at')
