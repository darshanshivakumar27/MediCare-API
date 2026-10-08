from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class AuthenticationAPITests(APITestCase):
    """
    Comprehensive test suite for Authentication APIs:
    - User Registration (POST /api/auth/register/)
    - User Login (POST /api/auth/login/)
    - Token Refresh (POST /api/auth/refresh/)
    """

    def setUp(self):
        self.register_url = reverse('users:register')
        self.login_url = reverse('users:login')
        self.refresh_url = reverse('users:refresh')

        self.valid_user_data = {
            'name': 'Dr. Alice Smith',
            'email': 'alice.smith@hospital.org',
            'password': 'StrongPassword2026!',
        }

    # 1. Successful Registration
    def test_registration_success(self):
        response = self.client.post(self.register_url, self.valid_user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], self.valid_user_data['email'].lower())
        self.assertEqual(response.data['user']['name'], self.valid_user_data['name'])
        self.assertTrue(User.objects.filter(email=self.valid_user_data['email']).exists())

    # 2. Missing Name
    def test_registration_missing_name(self):
        payload = {
            'email': 'noname@hospital.org',
            'password': 'StrongPassword2026!',
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    # 3. Invalid Email Format
    def test_registration_invalid_email(self):
        payload = {
            'name': 'Invalid Email User',
            'email': 'not-an-email',
            'password': 'StrongPassword2026!',
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    # 4. Weak / Short Password
    def test_registration_weak_password(self):
        payload = {
            'name': 'Weak Pass User',
            'email': 'weak@hospital.org',
            'password': '123',
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    # 5. Duplicate Email (Case-Insensitive)
    def test_registration_duplicate_email(self):
        # Register first time
        first_resp = self.client.post(self.register_url, self.valid_user_data, format='json')
        self.assertEqual(first_resp.status_code, status.HTTP_201_CREATED)

        # Attempt second registration with uppercase casing
        duplicate_payload = {
            'name': 'Another Alice',
            'email': self.valid_user_data['email'].upper(),
            'password': 'AnotherStrongPassword2026!',
        }
        dup_resp = self.client.post(self.register_url, duplicate_payload, format='json')
        self.assertEqual(dup_resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', dup_resp.data)

    # 6. Successful Login
    def test_login_success(self):
        # Register user first
        User.objects.create_user(**self.valid_user_data)

        login_payload = {
            'email': self.valid_user_data['email'],
            'password': self.valid_user_data['password'],
        }
        response = self.client.post(self.login_url, login_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], self.valid_user_data['email'].lower())

    # 7. Wrong Password
    def test_login_wrong_password(self):
        User.objects.create_user(**self.valid_user_data)

        login_payload = {
            'email': self.valid_user_data['email'],
            'password': 'WrongPassword123!',
        }
        response = self.client.post(self.login_url, login_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)

    # 8. Nonexistent Email
    def test_login_nonexistent_email(self):
        login_payload = {
            'email': 'ghost@hospital.org',
            'password': 'AnyPassword123!',
        }
        response = self.client.post(self.login_url, login_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)

    # 9. Inactive User Cannot Log In
    def test_login_inactive_user(self):
        user = User.objects.create_user(**self.valid_user_data)
        user.is_active = False
        user.save()

        login_payload = {
            'email': self.valid_user_data['email'],
            'password': self.valid_user_data['password'],
        }
        response = self.client.post(self.login_url, login_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)
        self.assertIn('deactivated', str(response.data['non_field_errors']))

    # 10. Successful Token Refresh
    def test_token_refresh_success(self):
        User.objects.create_user(**self.valid_user_data)
        login_resp = self.client.post(
            self.login_url,
            {
                'email': self.valid_user_data['email'],
                'password': self.valid_user_data['password'],
            },
            format='json',
        )
        refresh_token = login_resp.data['refresh']

        refresh_payload = {'refresh': refresh_token}
        refresh_resp = self.client.post(self.refresh_url, refresh_payload, format='json')
        self.assertEqual(refresh_resp.status_code, status.HTTP_200_OK)
        self.assertIn('access', refresh_resp.data)
        self.assertTrue(len(refresh_resp.data['access']) > 20)

    # 11. Invalid Refresh Token
    def test_token_refresh_invalid_token(self):
        refresh_payload = {'refresh': 'corrupted.jwt.token'}
        response = self.client.post(self.refresh_url, refresh_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # 12. Password Is Truly Hashed in Database
    def test_password_is_hashed_in_database(self):
        self.client.post(self.register_url, self.valid_user_data, format='json')
        user = User.objects.get(email=self.valid_user_data['email'])

        # Verify password is not plaintext
        self.assertNotEqual(user.password, self.valid_user_data['password'])
        # Verify it has Django's hashing prefix (e.g., pbkdf2_sha256$)
        self.assertTrue(user.password.startswith('pbkdf2_sha256$'))
        # Verify hash verifies properly against original plaintext
        self.assertTrue(user.check_password(self.valid_user_data['password']))

    # 13. Password and Hash Are Never Returned in API Response
    def test_password_and_hash_never_exposed_in_response(self):
        reg_response = self.client.post(self.register_url, self.valid_user_data, format='json')
        self.assertNotIn('password', reg_response.data.get('user', {}))

        login_payload = {
            'email': self.valid_user_data['email'],
            'password': self.valid_user_data['password'],
        }
        login_response = self.client.post(self.login_url, login_payload, format='json')
        self.assertNotIn('password', login_response.data.get('user', {}))
        self.assertNotIn('password', login_response.data)
