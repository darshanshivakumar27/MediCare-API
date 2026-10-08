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


class PatientDoctorMappingAPITests(APITestCase):
    """
    Automated test suite for Patient-Doctor Mapping APIs:
    - POST   /api/mappings/
    - GET    /api/mappings/
    - GET    /api/mappings/<patient_id>/
    - DELETE /api/mappings/<id>/

    Verifies authentication, ownership isolation, duplicate prevention,
    anti-IDOR security, and cascade deletion integrity.
    """

    def setUp(self):
        # Create User A
        self.user_a = User.objects.create_user(
            email='doctor_admin_a@hospital.org',
            name='Dr. Admin A',
            password='Password123!',
        )
        self.token_a = str(RefreshToken.for_user(self.user_a).access_token)

        # Create User B
        self.user_b = User.objects.create_user(
            email='doctor_admin_b@hospital.org',
            name='Dr. Admin B',
            password='Password123!',
        )
        self.token_b = str(RefreshToken.for_user(self.user_b).access_token)

        # Create Patients
        self.patient_a = Patient.objects.create(
            created_by=self.user_a,
            name='Patient A',
            date_of_birth=datetime.date(1988, 4, 12),
            gender='MALE',
            contact_number='+911111111111',
        )
        self.patient_b = Patient.objects.create(
            created_by=self.user_b,
            name='Patient B',
            date_of_birth=datetime.date(1993, 7, 24),
            gender='FEMALE',
            contact_number='+912222222222',
        )

        # Create Doctors
        self.doctor_1 = Doctor.objects.create(
            name='Dr. Evans',
            specialization='Cardiology',
            contact_number='+913333333333',
            email='evans@hospital.org',
            years_of_experience=15,
        )
        self.doctor_2 = Doctor.objects.create(
            name='Dr. Foster',
            specialization='Neurology',
            contact_number='+914444444444',
            email='foster@hospital.org',
            years_of_experience=10,
        )

        # URLs
        self.list_create_url = reverse('mappings:mapping-list-create')

    def authenticate_as(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def clear_authentication(self):
        self.client.credentials()

    # --- 1. AUTHENTICATION ENFORCEMENT ---

    def test_unauthenticated_post_returns_401(self):
        self.clear_authentication()
        payload = {'patient': self.patient_a.id, 'doctor': self.doctor_1.id}
        response = self.client.post(self.list_create_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_get_returns_401(self):
        self.clear_authentication()
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_patient_specific_get_returns_401(self):
        self.clear_authentication()
        detail_url = reverse('mappings:mapping-detail', kwargs={'pk': self.patient_a.id})
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_delete_returns_401(self):
        self.clear_authentication()
        mapping = PatientDoctorMapping.objects.create(patient=self.patient_a, doctor=self.doctor_1)
        detail_url = reverse('mappings:mapping-detail', kwargs={'pk': mapping.id})
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- 2. CREATE MAPPING & VALIDATION ---

    def test_create_mapping_valid_returns_201(self):
        self.authenticate_as(self.token_a)
        payload = {'patient': self.patient_a.id, 'doctor': self.doctor_1.id}
        response = self.client.post(self.list_create_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['patient'], self.patient_a.id)
        self.assertEqual(response.data['doctor'], self.doctor_1.id)
        self.assertEqual(response.data['patient_name'], self.patient_a.name)
        self.assertEqual(response.data['doctor_name'], self.doctor_1.name)
        self.assertTrue(PatientDoctorMapping.objects.filter(id=response.data['id']).exists())

    def test_create_mapping_missing_patient_returns_400(self):
        self.authenticate_as(self.token_a)
        payload = {'doctor': self.doctor_1.id}
        response = self.client.post(self.list_create_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('patient', response.data)

    def test_create_mapping_missing_doctor_returns_400(self):
        self.authenticate_as(self.token_a)
        payload = {'patient': self.patient_a.id}
        response = self.client.post(self.list_create_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('doctor', response.data)

    def test_create_mapping_nonexistent_patient_returns_404(self):
        self.authenticate_as(self.token_a)
        payload = {'patient': 999999, 'doctor': self.doctor_1.id}
        response = self.client.post(self.list_create_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_mapping_nonexistent_doctor_returns_404(self):
        self.authenticate_as(self.token_a)
        payload = {'patient': self.patient_a.id, 'doctor': 999999}
        response = self.client.post(self.list_create_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_mapping_duplicate_returns_400(self):
        self.authenticate_as(self.token_a)
        payload = {'patient': self.patient_a.id, 'doctor': self.doctor_1.id}
        # First creation succeeds
        resp1 = self.client.post(self.list_create_url, payload, format='json')
        self.assertEqual(resp1.status_code, status.HTTP_201_CREATED)
        # Duplicate creation fails
        resp2 = self.client.post(self.list_create_url, payload, format='json')
        self.assertEqual(resp2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', resp2.data)

    # --- 3. OWNERSHIP & ANTI-IDOR SECURITY ---

    def test_user_b_cannot_create_mapping_for_user_a_patient_returns_404(self):
        self.authenticate_as(self.token_b)
        # User B attempts to map User A's patient to Doctor 1
        payload = {'patient': self.patient_a.id, 'doctor': self.doctor_1.id}
        response = self.client.post(self.list_create_url, payload, format='json')
        # Returns 404 because Patient A does not exist in User B's scope
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_user_b_cannot_retrieve_user_a_patient_mappings_returns_404(self):
        # User A maps Patient A to Doctor 1
        PatientDoctorMapping.objects.create(patient=self.patient_a, doctor=self.doctor_1)

        # User B attempts to view mappings for Patient A
        self.authenticate_as(self.token_b)
        detail_url = reverse('mappings:mapping-detail', kwargs={'pk': self.patient_a.id})
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_user_b_cannot_delete_user_a_mapping_returns_404(self):
        # User A maps Patient A to Doctor 1
        mapping = PatientDoctorMapping.objects.create(patient=self.patient_a, doctor=self.doctor_1)

        # User B attempts to delete User A's mapping
        self.authenticate_as(self.token_b)
        detail_url = reverse('mappings:mapping-detail', kwargs={'pk': mapping.id})
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        # Confirm mapping still exists in DB
        self.assertTrue(PatientDoctorMapping.objects.filter(id=mapping.id).exists())

    # --- 4. LISTING OWN MAPPINGS ---

    def test_user_sees_only_mappings_for_own_patients(self):
        # User A creates 2 mappings
        m_a1 = PatientDoctorMapping.objects.create(patient=self.patient_a, doctor=self.doctor_1)
        m_a2 = PatientDoctorMapping.objects.create(patient=self.patient_a, doctor=self.doctor_2)
        # User B creates 1 mapping
        m_b1 = PatientDoctorMapping.objects.create(patient=self.patient_b, doctor=self.doctor_1)

        # User A lists mappings
        self.authenticate_as(self.token_a)
        resp_a = self.client.get(self.list_create_url)
        self.assertEqual(resp_a.status_code, status.HTTP_200_OK)
        returned_ids_a = [m['id'] for m in resp_a.data]
        self.assertIn(m_a1.id, returned_ids_a)
        self.assertIn(m_a2.id, returned_ids_a)
        self.assertNotIn(m_b1.id, returned_ids_a)
        self.assertEqual(len(returned_ids_a), 2)

        # User B lists mappings
        self.authenticate_as(self.token_b)
        resp_b = self.client.get(self.list_create_url)
        self.assertEqual(resp_b.status_code, status.HTTP_200_OK)
        returned_ids_b = [m['id'] for m in resp_b.data]
        self.assertIn(m_b1.id, returned_ids_b)
        self.assertNotIn(m_a1.id, returned_ids_b)
        self.assertNotIn(m_a2.id, returned_ids_b)
        self.assertEqual(len(returned_ids_b), 1)

    def test_empty_mappings_returns_200_empty_list(self):
        self.authenticate_as(self.token_a)
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    # --- 5. PATIENT-SPECIFIC MAPPINGS ---

    def test_retrieve_patient_mappings_owned_patient_returns_200(self):
        # Map Patient A to Doctor 1 and Doctor 2
        PatientDoctorMapping.objects.create(patient=self.patient_a, doctor=self.doctor_1)
        PatientDoctorMapping.objects.create(patient=self.patient_a, doctor=self.doctor_2)

        self.authenticate_as(self.token_a)
        detail_url = reverse('mappings:mapping-detail', kwargs={'pk': self.patient_a.id})
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        doctor_ids = [m['doctor'] for m in response.data]
        self.assertIn(self.doctor_1.id, doctor_ids)
        self.assertIn(self.doctor_2.id, doctor_ids)

    def test_retrieve_patient_mappings_empty_returns_200_empty_list(self):
        self.authenticate_as(self.token_a)
        detail_url = reverse('mappings:mapping-detail', kwargs={'pk': self.patient_a.id})
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_retrieve_patient_mappings_nonexistent_patient_returns_404(self):
        self.authenticate_as(self.token_a)
        detail_url = reverse('mappings:mapping-detail', kwargs={'pk': 888888})
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # --- 6. DELETE MAPPING ---

    def test_delete_mapping_owner_can_delete_returns_204(self):
        mapping = PatientDoctorMapping.objects.create(patient=self.patient_a, doctor=self.doctor_1)
        self.authenticate_as(self.token_a)
        detail_url = reverse('mappings:mapping-detail', kwargs={'pk': mapping.id})
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(PatientDoctorMapping.objects.filter(id=mapping.id).exists())

    def test_delete_mapping_nonexistent_returns_404(self):
        self.authenticate_as(self.token_a)
        detail_url = reverse('mappings:mapping-detail', kwargs={'pk': 777777})
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # --- 7. DATABASE INTEGRITY & CASCADE BEHAVIOR ---

    def test_assigned_at_automatically_populated(self):
        self.authenticate_as(self.token_a)
        payload = {'patient': self.patient_a.id, 'doctor': self.doctor_1.id}
        response = self.client.post(self.list_create_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('assigned_at', response.data)
        self.assertIsNotNone(response.data['assigned_at'])

    def test_doctor_deletion_cascades_and_removes_mapping(self):
        mapping = PatientDoctorMapping.objects.create(patient=self.patient_a, doctor=self.doctor_1)
        self.assertTrue(PatientDoctorMapping.objects.filter(id=mapping.id).exists())

        # Directly or via API delete doctor_1
        self.doctor_1.delete()

        # Mapping is cascade-deleted
        self.assertFalse(PatientDoctorMapping.objects.filter(id=mapping.id).exists())
        # Patient still exists
        self.assertTrue(Patient.objects.filter(id=self.patient_a.id).exists())
