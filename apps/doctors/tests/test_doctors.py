import datetime
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.doctors.models import Doctor
from apps.mappings.models import PatientDoctorMapping
from apps.patients.models import Patient

User = get_user_model()


class DoctorAPITests(APITestCase):
    """
    Automated test suite for Doctor Management APIs:
    - POST   /api/doctors/
    - GET    /api/doctors/
    - GET    /api/doctors/<id>/
    - PUT    /api/doctors/<id>/
    - DELETE /api/doctors/<id>/

    Verifies authentication, field validations, unique constraints,
    directory queries, updates, deletions, and mapping cascade interactions.
    """

    def setUp(self):
        # Create an authenticated user
        self.user = User.objects.create_user(
            email='hospital_admin@hospital.org',
            name='Hospital Admin',
            password='AdminPassword123!',
        )
        self.token = str(RefreshToken.for_user(self.user).access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        # URLs
        self.list_create_url = reverse('doctors:doctor-list')

        # Sample valid doctor payload
        self.valid_doctor_payload = {
            'name': 'Dr. Sarah Wilson',
            'specialization': 'Cardiology',
            'contact_number': '+919876543210',
            'email': 'sarah.wilson@hospital.org',
            'years_of_experience': 12,
            'is_active': True,
        }

    def clear_authentication(self):
        self.client.credentials()

    # --- 1. AUTHENTICATION ENFORCEMENT ---

    def test_unauthenticated_post_returns_401(self):
        self.clear_authentication()
        response = self.client.post(self.list_create_url, self.valid_doctor_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_get_returns_401(self):
        self.clear_authentication()
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- 2. DOCTOR CREATION & VALIDATION ---

    def test_create_doctor_valid_returns_201(self):
        response = self.client.post(self.list_create_url, self.valid_doctor_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['name'], self.valid_doctor_payload['name'])
        self.assertEqual(response.data['email'], self.valid_doctor_payload['email'].lower())
        self.assertEqual(response.data['specialization'], self.valid_doctor_payload['specialization'])

    def test_create_doctor_missing_required_field_returns_400(self):
        payload = self.valid_doctor_payload.copy()
        del payload['name']
        response = self.client.post(self.list_create_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    def test_create_doctor_invalid_email_returns_400(self):
        payload = self.valid_doctor_payload.copy()
        payload['email'] = 'not-an-email-address'
        response = self.client.post(self.list_create_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_create_doctor_negative_experience_returns_400(self):
        payload = self.valid_doctor_payload.copy()
        payload['years_of_experience'] = -5
        response = self.client.post(self.list_create_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('years_of_experience', response.data)

    def test_create_doctor_duplicate_email_returns_400(self):
        # Create first doctor
        self.client.post(self.list_create_url, self.valid_doctor_payload, format='json')
        # Attempt second doctor with same email (uppercase casing)
        dup_payload = self.valid_doctor_payload.copy()
        dup_payload['email'] = self.valid_doctor_payload['email'].upper()
        dup_payload['name'] = 'Dr. Impostor'
        response = self.client.post(self.list_create_url, dup_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_create_doctor_successful_creation_persists_in_db(self):
        response = self.client.post(self.list_create_url, self.valid_doctor_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        doctor = Doctor.objects.get(id=response.data['id'])
        self.assertEqual(doctor.name, self.valid_doctor_payload['name'])
        self.assertEqual(doctor.email, self.valid_doctor_payload['email'].lower())
        self.assertEqual(doctor.years_of_experience, 12)

    # --- 3. LIST DIRECTORY ---

    def test_list_doctors_authenticated_user_retrieves_all_200(self):
        d1 = Doctor.objects.create(
            name='Dr. Alice',
            specialization='Neurology',
            contact_number='+911111111111',
            email='alice@hospital.org',
            years_of_experience=10,
        )
        d2 = Doctor.objects.create(
            name='Dr. Bob',
            specialization='Orthopedics',
            contact_number='+912222222222',
            email='bob@hospital.org',
            years_of_experience=8,
        )
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = [doc['id'] for doc in response.data]
        self.assertIn(d1.id, returned_ids)
        self.assertIn(d2.id, returned_ids)
        self.assertEqual(len(returned_ids), 2)

    def test_list_doctors_empty_returns_200(self):
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    # --- 4. RETRIEVE DETAILS ---

    def test_retrieve_existing_doctor_returns_200(self):
        doctor = Doctor.objects.create(
            name='Dr. Clara',
            specialization='Dermatology',
            contact_number='+913333333333',
            email='clara@hospital.org',
            years_of_experience=5,
        )
        detail_url = reverse('doctors:doctor-detail', kwargs={'pk': doctor.id})
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], doctor.id)
        self.assertEqual(response.data['name'], doctor.name)

    def test_retrieve_nonexistent_doctor_returns_404(self):
        detail_url = reverse('doctors:doctor-detail', kwargs={'pk': 999999})
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # --- 5. UPDATE ---

    def test_update_doctor_valid_put_returns_200(self):
        doctor = Doctor.objects.create(
            name='Dr. David',
            specialization='Pediatrics',
            contact_number='+914444444444',
            email='david@hospital.org',
            years_of_experience=7,
        )
        detail_url = reverse('doctors:doctor-detail', kwargs={'pk': doctor.id})
        update_payload = {
            'name': 'Dr. David Updated',
            'specialization': 'Pediatric Cardiology',
            'contact_number': '+914444444499',
            'email': 'david.updated@hospital.org',
            'years_of_experience': 8,
            'is_active': True,
        }
        response = self.client.put(detail_url, update_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Dr. David Updated')
        self.assertEqual(response.data['specialization'], 'Pediatric Cardiology')
        doctor.refresh_from_db()
        self.assertEqual(doctor.name, 'Dr. David Updated')
        self.assertEqual(doctor.years_of_experience, 8)

    def test_update_doctor_invalid_payload_returns_400(self):
        doctor = Doctor.objects.create(
            name='Dr. Edward',
            specialization='Oncology',
            contact_number='+915555555555',
            email='edward@hospital.org',
            years_of_experience=15,
        )
        detail_url = reverse('doctors:doctor-detail', kwargs={'pk': doctor.id})
        update_payload = {
            'name': 'Dr. Edward',
            'specialization': 'Oncology',
            'contact_number': '+915555555555',
            'email': 'edward@hospital.org',
            'years_of_experience': -3,  # Invalid negative experience
            'is_active': True,
        }
        response = self.client.put(detail_url, update_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('years_of_experience', response.data)

    def test_update_doctor_nonexistent_returns_404(self):
        detail_url = reverse('doctors:doctor-detail', kwargs={'pk': 888888})
        response = self.client.put(detail_url, self.valid_doctor_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_doctor_cannot_modify_read_only_fields(self):
        doctor = Doctor.objects.create(
            name='Dr. Frank',
            specialization='Urology',
            contact_number='+916666666666',
            email='frank@hospital.org',
            years_of_experience=9,
        )
        orig_id = doctor.id
        orig_created_at = doctor.created_at
        detail_url = reverse('doctors:doctor-detail', kwargs={'pk': orig_id})

        update_payload = self.valid_doctor_payload.copy()
        update_payload['id'] = 777777  # Attempt to change ID
        update_payload['created_at'] = '2000-01-01T00:00:00Z'

        response = self.client.put(detail_url, update_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        doctor.refresh_from_db()
        self.assertEqual(doctor.id, orig_id)
        self.assertEqual(doctor.created_at, orig_created_at)

    # --- 6. DELETE & CASCADE INTERACTION ---

    def test_delete_existing_doctor_returns_204(self):
        doctor = Doctor.objects.create(
            name='Dr. Grace',
            specialization='Psychiatry',
            contact_number='+917777777777',
            email='grace@hospital.org',
            years_of_experience=11,
        )
        detail_url = reverse('doctors:doctor-detail', kwargs={'pk': doctor.id})
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Doctor.objects.filter(id=doctor.id).exists())

    def test_delete_nonexistent_doctor_returns_404(self):
        detail_url = reverse('doctors:doctor-detail', kwargs={'pk': 555555})
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_doctor_cascades_and_removes_patient_mappings(self):
        doctor = Doctor.objects.create(
            name='Dr. Henry',
            specialization='General Medicine',
            contact_number='+918888888888',
            email='henry@hospital.org',
            years_of_experience=14,
        )
        patient = Patient.objects.create(
            created_by=self.user,
            name='Test Patient',
            date_of_birth=datetime.date(1991, 1, 1),
            gender='MALE',
            contact_number='+919999999999',
        )
        # Create a mapping record
        mapping = PatientDoctorMapping.objects.create(patient=patient, doctor=doctor)
        self.assertTrue(PatientDoctorMapping.objects.filter(id=mapping.id).exists())

        # Delete the doctor via API
        detail_url = reverse('doctors:doctor-detail', kwargs={'pk': doctor.id})
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Confirm Doctor is deleted
        self.assertFalse(Doctor.objects.filter(id=doctor.id).exists())
        # Confirm mapping was CASCADE-deleted automatically
        self.assertFalse(PatientDoctorMapping.objects.filter(id=mapping.id).exists())
        # Confirm patient still exists
        self.assertTrue(Patient.objects.filter(id=patient.id).exists())
