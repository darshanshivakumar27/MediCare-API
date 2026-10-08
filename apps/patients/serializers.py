import re
from django.utils import timezone
from rest_framework import serializers

from apps.patients.models import Patient


class PatientSerializer(serializers.ModelSerializer):
    """
    Serializer for Patient CRUD operations.
    Enforces strict field validation and ensures created_by is read-only
    to prevent client spoofing or unauthorized ownership manipulation.
    """
    created_by = serializers.ReadOnlyField(source='created_by.email')

    class Meta:
        model = Patient
        fields = (
            'id',
            'name',
            'date_of_birth',
            'gender',
            'contact_number',
            'email',
            'address',
            'medical_history',
            'created_by',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at')

    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Patient name cannot be blank.')
        if len(value.strip()) < 2:
            raise serializers.ValidationError('Patient name must be at least 2 characters.')
        return value.strip()

    def validate_date_of_birth(self, value):
        if value > timezone.now().date():
            raise serializers.ValidationError('Date of birth cannot be in the future.')
        return value

    def validate_gender(self, value):
        normalized = value.upper() if value else ''
        valid_genders = [choice[0] for choice in Patient.Gender.choices]
        if normalized not in valid_genders:
            raise serializers.ValidationError(
                f'Invalid gender. Choices are: {", ".join(valid_genders)}.'
            )
        return normalized

    def validate_contact_number(self, value):
        clean_value = value.strip()
        if not clean_value:
            raise serializers.ValidationError('Contact number cannot be blank.')
        # Validates phone format: optional leading +, followed by 7 to 15 digits/hyphens
        if not re.match(r'^\+?[0-9\-\s]{7,20}$', clean_value):
            raise serializers.ValidationError(
                'Enter a valid contact number (7-20 digits, optional leading +).'
            )
        return clean_value

    def validate_email(self, value):
        if value:
            return value.strip().lower()
        return value
