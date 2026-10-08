import re
from rest_framework import serializers

from apps.doctors.models import Doctor


class DoctorSerializer(serializers.ModelSerializer):
    """
    Serializer for Doctor CRUD operations.
    Validates name, specialization, contact information,
    email uniqueness, and years of experience.
    """

    class Meta:
        model = Doctor
        fields = (
            'id',
            'name',
            'specialization',
            'contact_number',
            'email',
            'years_of_experience',
            'is_active',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Doctor name cannot be blank.')
        if len(value.strip()) < 2:
            raise serializers.ValidationError('Doctor name must be at least 2 characters.')
        return value.strip()

    def validate_specialization(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Specialization cannot be blank.')
        return value.strip()

    def validate_contact_number(self, value):
        clean_value = value.strip()
        if not clean_value:
            raise serializers.ValidationError('Contact number cannot be blank.')
        if not re.match(r'^\+?[0-9\-\s]{7,20}$', clean_value):
            raise serializers.ValidationError(
                'Enter a valid contact number (7-20 digits, optional leading +).'
            )
        return clean_value

    def validate_email(self, value):
        normalized_email = value.strip().lower()
        query = Doctor.objects.filter(email__iexact=normalized_email)
        if self.instance:
            query = query.exclude(pk=self.instance.pk)
        if query.exists():
            raise serializers.ValidationError('A doctor with this email address already exists.')
        return normalized_email

    def validate_years_of_experience(self, value):
        if value is None or value < 0:
            raise serializers.ValidationError('Years of experience cannot be negative.')
        return value
