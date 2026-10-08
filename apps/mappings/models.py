from django.core.exceptions import ValidationError
from django.db import models


class PatientDoctorMapping(models.Model):
    """
    Junction model mapping patients to assigned doctors.
    Enforces a database-level unique constraint to guarantee that the
    same doctor cannot be assigned to the same patient more than once.
    """
    patient = models.ForeignKey(
        'patients.Patient',
        on_delete=models.CASCADE,
        related_name='doctor_mappings',
        db_index=True,
        help_text='The patient being assigned a doctor.',
    )
    doctor = models.ForeignKey(
        'doctors.Doctor',
        on_delete=models.CASCADE,
        related_name='patient_mappings',
        db_index=True,
        help_text='The doctor assigned to the patient.',
    )
    assigned_at = models.DateTimeField(
        auto_now_add=True,
        help_text='Timestamp when the assignment was established.',
    )

    class Meta:
        verbose_name = 'Patient-Doctor Mapping'
        verbose_name_plural = 'Patient-Doctor Mappings'
        ordering = ['-assigned_at']
        constraints = [
            models.UniqueConstraint(
                fields=['patient', 'doctor'],
                name='unique_patient_doctor_mapping',
            ),
        ]
        indexes = [
            models.Index(fields=['patient', 'doctor']),
        ]

    def clean(self):
        super().clean()
        if hasattr(self, 'patient') and hasattr(self, 'doctor'):
            existing = PatientDoctorMapping.objects.filter(
                patient=self.patient,
                doctor=self.doctor,
            )
            if self.pk:
                existing = existing.exclude(pk=self.pk)
            if existing.exists():
                raise ValidationError('This doctor is already assigned to this patient.')

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.patient.name} <-> {self.doctor.name} (Assigned: {self.assigned_at.strftime('%Y-%m-%d')})"
