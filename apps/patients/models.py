from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from apps.common.models import TimeStampedModel


class Patient(TimeStampedModel):
    """
    Patient model representing healthcare records.
    Each patient is tied to the user who created the record via 'created_by'
    to enforce secure scoped ownership and prevent IDOR vulnerabilities.
    """
    class Gender(models.TextChoices):
        MALE = 'MALE', 'Male'
        FEMALE = 'FEMALE', 'Female'
        OTHER = 'OTHER', 'Other'

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='patients',
        db_index=True,
        help_text='User account that registered this patient record.',
    )
    name = models.CharField(
        max_length=150,
        help_text='Full legal name of the patient.',
    )
    date_of_birth = models.DateField(
        help_text='Patient date of birth (cannot be in the future).',
    )
    gender = models.CharField(
        max_length=10,
        choices=Gender.choices,
        help_text='Gender identity of the patient.',
    )
    contact_number = models.CharField(
        max_length=20,
        help_text='Primary contact telephone or mobile number.',
    )
    email = models.EmailField(
        max_length=255,
        blank=True,
        null=True,
        help_text='Patient contact email address.',
    )
    address = models.TextField(
        blank=True,
        help_text='Residential address.',
    )
    medical_history = models.TextField(
        blank=True,
        help_text='Relevant medical conditions, allergies, or past treatments.',
    )

    class Meta:
        verbose_name = 'Patient'
        verbose_name_plural = 'Patients'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['created_by', '-created_at']),
        ]

    def clean(self):
        super().clean()
        if self.date_of_birth and self.date_of_birth > timezone.now().date():
            raise ValidationError({'date_of_birth': 'Date of birth cannot be in the future.'})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} (DOB: {self.date_of_birth})"
