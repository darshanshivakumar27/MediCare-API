import datetime
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.patients.models import Patient

User = get_user_model()


class PatientAPITests(APITestCase):
    """
    Automated test suite for Patient Management APIs:
    - POST   /api/patients/
    - GET    /api/patients/
    - GET    /api/patients/<id>/
    - PUT    /api/patients/<id>/
    - DELETE /api/patients/<id>/

    Verifies authentication, field validations, ownership isolation,
    and anti-IDOR protections.
    """

    def setUp(self):
        # Create User A
        self.user_a = User.objects.create_user(
            email='user_a@hospital.org',
            name='Dr. User A',
            password='Password123!',
        )
        self.token_a = str(RefreshToken.for_user(self.user_a).access_token)

        # Create User B
        self.user_b = User.objects.create_user(
            email='user_b@hospital.org',
            name='Dr. User B',
            password='Password123!',
        )
        self.token_b = str(RefreshToken.for_user(self.user_b).access_token)

        # URLs
        self.list_create_url = reverse('patients:patient-list')

        # Standard Patient payload
        self.valid_patient_payload = {
            'name': 'John Doe',
            'date_of_birth': '1990-05-15',
            'gender': 'MALE',
            'contact_number': '+919876543210',
            'email': 'johndoe@example.com',
            'address': 'Mysore, Karnataka',
            'medical_history': 'Mild hypertension',
        }

    def authenticate_as(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def clear_authentication(self):
        self.client.credentials()

    # --- 1. AUTHENTICATION ENFORCEMENT ---

    def test_unauthenticated_post_returns_401(self):
        self.clear_authentication()
        response = self.client.post(self.list_create_url, self.valid_patient_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_get_returns_401(self):
        self.clear_authentication()
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- 2. PATIENT CREATION & VALIDATION ---

    def test_create_patient_valid_returns_201(self):
        self.authenticate_as(self.token_a)
        response = self.client.post(self.list_create_url, self.valid_patient_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['name'], self.valid_patient_payload['name'])
        self.assertEqual(response.data['created_by'], self.user_a.email)

    def test_create_patient_auto_assigns_created_by(self):
        self.authenticate_as(self.token_a)
        response = self.client.post(self.list_create_url, self.valid_patient_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        patient = Patient.objects.get(id=response.data['id'])
        self.assertEqual(patient.created_by, self.user_a)

    def test_create_patient_client_cannot_spoof_created_by(self):
        self.authenticate_as(self.token_a)
        # Attempt to spoof created_by to User B's ID or email
        spoofed_payload = self.valid_patient_payload.copy()
        spoofed_payload['created_by'] = self.user_b.id
        response = self.client.post(self.list_create_url, spoofed_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Verify created_by was NOT spoofed, must remain User A
        patient = Patient.objects.get(id=response.data['id'])
        self.assertEqual(patient.created_by, self.user_a)

    def test_create_patient_invalid_email_returns_400(self):
        self.authenticate_as(self.token_a)
        payload = self.valid_patient_payload.copy()
        payload['email'] = 'not-a-valid-email'
        response = self.client.post(self.list_create_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_create_patient_future_dob_returns_400(self):
        self.authenticate_as(self.token_a)
        payload = self.valid_patient_payload.copy()
        payload['date_of_birth'] = '2099-01-01'
        response = self.client.post(self.list_create_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('date_of_birth', response.data)

    def test_create_patient_invalid_gender_returns_400(self):
        self.authenticate_as(self.token_a)
        payload = self.valid_patient_payload.copy()
        payload['gender'] = 'UNKNOWN_GENDER'
        response = self.client.post(self.list_create_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('gender', response.data)

    def test_create_patient_missing_required_field_returns_400(self):
        self.authenticate_as(self.token_a)
        payload = self.valid_patient_payload.copy()
        del payload['name']
        response = self.client.post(self.list_create_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    # --- 3. PATIENT LISTING & OWNERSHIP ISOLATION ---

    def test_list_user_sees_own_patients_and_not_others(self):
        # User A creates 2 patients
        p1 = Patient.objects.create(
            created_by=self.user_a,
            name='Patient A1',
            date_of_birth=datetime.date(1985, 1, 1),
            gender='MALE',
            contact_number='+911111111111',
        )
        p2 = Patient.objects.create(
            created_by=self.user_a,
            name='Patient A2',
            date_of_birth=datetime.date(1992, 2, 2),
            gender='FEMALE',
            contact_number='+912222222222',
        )
        # User B creates 1 patient
        p3 = Patient.objects.create(
            created_by=self.user_b,
            name='Patient B1',
            date_of_birth=datetime.date(1995, 3, 3),
            gender='OTHER',
            contact_number='+913333333333',
        )

        # User A queries /api/patients/
        self.authenticate_as(self.token_a)
        response_a = self.client.get(self.list_create_url)
        self.assertEqual(response_a.status_code, status.HTTP_200_OK)
        returned_ids_a = [item['id'] for item in response_a.data]
        self.assertIn(p1.id, returned_ids_a)
        self.assertIn(p2.id, returned_ids_a)
        self.assertNotIn(p3.id, returned_ids_a)
        self.assertEqual(len(returned_ids_a), 2)

        # User B queries /api/patients/
        self.authenticate_as(self.token_b)
        response_b = self.client.get(self.list_create_url)
        self.assertEqual(response_b.status_code, status.HTTP_200_OK)
        returned_ids_b = [item['id'] for item in response_b.data]
        self.assertIn(p3.id, returned_ids_b)
        self.assertNotIn(p1.id, returned_ids_b)
        self.assertNotIn(p2.id, returned_ids_b)
        self.assertEqual(len(returned_ids_b), 1)

    def test_list_empty_returns_200_empty_list(self):
        self.authenticate_as(self.token_a)
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    # --- 4. RETRIEVE & IDOR PROTECTION ---

    def test_retrieve_owner_can_retrieve_200(self):
        p1 = Patient.objects.create(
            created_by=self.user_a,
            name='Patient A1',
            date_of_birth=datetime.date(1985, 1, 1),
            gender='MALE',
            contact_number='+911111111111',
        )
        self.authenticate_as(self.token_a)
        detail_url = reverse('patients:patient-detail', kwargs={'pk': p1.id})
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], p1.id)
        self.assertEqual(response.data['name'], p1.name)

    def test_retrieve_other_user_receives_404_idor_protection(self):
        p1 = Patient.objects.create(
            created_by=self.user_a,
            name='Patient A1',
            date_of_birth=datetime.date(1985, 1, 1),
            gender='MALE',
            contact_number='+911111111111',
        )
        # User B attempts to access User A's patient
        self.authenticate_as(self.token_b)
        detail_url = reverse('patients:patient-detail', kwargs={'pk': p1.id})
        response = self.client.get(detail_url)
        # Must return 404 to avoid leaking existence of record
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # --- 5. UPDATE & PERMISSIONS ---

    def test_update_owner_can_update_200(self):
        p1 = Patient.objects.create(
            created_by=self.user_a,
            name='Old Name',
            date_of_birth=datetime.date(1985, 1, 1),
            gender='MALE',
            contact_number='+911111111111',
        )
        self.authenticate_as(self.token_a)
        detail_url = reverse('patients:patient-detail', kwargs={'pk': p1.id})
        update_payload = self.valid_patient_payload.copy()
        update_payload['name'] = 'Updated Name'

        response = self.client.put(detail_url, update_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Name')
        p1.refresh_from_db()
        self.assertEqual(p1.name, 'Updated Name')

    def test_update_other_user_cannot_update_returns_404(self):
        p1 = Patient.objects.create(
            created_by=self.user_a,
            name='Original Name',
            date_of_birth=datetime.date(1985, 1, 1),
            gender='MALE',
            contact_number='+911111111111',
        )
        # User B attempts to update User A's patient
        self.authenticate_as(self.token_b)
        detail_url = reverse('patients:patient-detail', kwargs={'pk': p1.id})
        update_payload = self.valid_patient_payload.copy()
        update_payload['name'] = 'Hacked Name'

        response = self.client.put(detail_url, update_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        p1.refresh_from_db()
        self.assertEqual(p1.name, 'Original Name')

    def test_update_invalid_data_returns_400(self):
        p1 = Patient.objects.create(
            created_by=self.user_a,
            name='Patient A1',
            date_of_birth=datetime.date(1985, 1, 1),
            gender='MALE',
            contact_number='+911111111111',
        )
        self.authenticate_as(self.token_a)
        detail_url = reverse('patients:patient-detail', kwargs={'pk': p1.id})
        update_payload = self.valid_patient_payload.copy()
        update_payload['date_of_birth'] = '2099-12-31'  # Future DOB

        response = self.client.put(detail_url, update_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('date_of_birth', response.data)

    def test_update_cannot_change_created_by(self):
        p1 = Patient.objects.create(
            created_by=self.user_a,
            name='Patient A1',
            date_of_birth=datetime.date(1985, 1, 1),
            gender='MALE',
            contact_number='+911111111111',
        )
        self.authenticate_as(self.token_a)
        detail_url = reverse('patients:patient-detail', kwargs={'pk': p1.id})
        update_payload = self.valid_patient_payload.copy()
        update_payload['created_by'] = self.user_b.id

        response = self.client.put(detail_url, update_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        p1.refresh_from_db()
        self.assertEqual(p1.created_by, self.user_a)

    # --- 6. DELETE & PERMISSIONS ---

    def test_delete_owner_can_delete_204(self):
        p1 = Patient.objects.create(
            created_by=self.user_a,
            name='Patient To Delete',
            date_of_birth=datetime.date(1985, 1, 1),
            gender='MALE',
            contact_number='+911111111111',
        )
        self.authenticate_as(self.token_a)
        detail_url = reverse('patients:patient-detail', kwargs={'pk': p1.id})
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Patient.objects.filter(id=p1.id).exists())

    def test_delete_other_user_cannot_delete_returns_404(self):
        p1 = Patient.objects.create(
            created_by=self.user_a,
            name='Protected Patient',
            date_of_birth=datetime.date(1985, 1, 1),
            gender='MALE',
            contact_number='+911111111111',
        )
        # User B attempts to delete User A's patient
        self.authenticate_as(self.token_b)
        detail_url = reverse('patients:patient-detail', kwargs={'pk': p1.id})
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        # Confirm still exists in DB
        self.assertTrue(Patient.objects.filter(id=p1.id).exists())
