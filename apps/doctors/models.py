from django.core.exceptions import ValidationError
from django.db import models

from apps.common.models import TimeStampedModel


class Doctor(TimeStampedModel):
    """
    Doctor model representing healthcare professionals in the directory.
    """
    name = models.CharField(
        max_length=150,
        help_text='Full name and title of the healthcare practitioner.',
    )
    specialization = models.CharField(
        max_length=100,
        db_index=True,
        help_text='Medical discipline or field of practice (e.g., Cardiology).',
    )
    contact_number = models.CharField(
        max_length=20,
        help_text='Primary contact telephone number.',
    )
    email = models.EmailField(
        max_length=255,
        unique=True,
        db_index=True,
        help_text='Professional email address (must be unique).',
    )
    years_of_experience = models.PositiveIntegerField(
        default=0,
        help_text='Years of clinical or professional experience.',
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text='Indicates if the doctor is currently practicing/active.',
    )

    class Meta:
        verbose_name = 'Doctor'
        verbose_name_plural = 'Doctors'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['specialization', 'is_active']),
        ]

    def clean(self):
        super().clean()
        if self.years_of_experience is not None and self.years_of_experience < 0:
            raise ValidationError({'years_of_experience': 'Years of experience cannot be negative.'})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Dr. {self.name} - {self.specialization}"
