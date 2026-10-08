from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import User


class UserSerializer(serializers.ModelSerializer):
    """
    Safe user serializer for public/client profile representation.
    Guarantees no passwords or hashes are ever exposed.
    """
    class Meta:
        model = User
        fields = ('id', 'name', 'email', 'created_at', 'updated_at')
        read_only_fields = fields


class RegisterSerializer(serializers.ModelSerializer):
    """
    Registration serializer that handles email normalization,
    password validation (length, common passwords, similarity),
    and creates the new User record.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text='Account password (must meet Django security requirements).',
    )

    class Meta:
        model = User
        fields = ('id', 'name', 'email', 'password')

    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Name cannot be blank.')
        return value.strip()

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError('A user with this email address already exists.')
        return normalized

    def validate_password(self, value):
        # Enforces AUTH_PASSWORD_VALIDATORS configured in settings.py
        validate_password(value)
        return value

    def create(self, validated_data):
        return User.objects.create_user(
            email=validated_data['email'],
            name=validated_data['name'],
            password=validated_data['password'],
        )


class LoginSerializer(serializers.Serializer):
    """
    Login serializer that authenticates user credentials,
    ensures account active status, and generates JWT tokens.
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
    )

    def validate(self, attrs):
        email = attrs.get('email', '').strip().lower()
        password = attrs.get('password', '')

        if not email or not password:
            raise serializers.ValidationError('Both email and password are required.')

        user = authenticate(
            request=self.context.get('request'),
            email=email,
            password=password,
        )

        if user is None:
            # Check if user exists but is inactive
            try:
                existing_user = User.objects.get(email__iexact=email)
                if not existing_user.is_active:
                    raise serializers.ValidationError('This account has been deactivated.')
            except User.DoesNotExist:
                pass
            raise serializers.ValidationError('Invalid email or password.')

        if not user.is_active:
            raise serializers.ValidationError('This account has been deactivated.')

        # Generate JWT tokens via SimpleJWT
        refresh = RefreshToken.for_user(user)

        return {
            'user': user,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }
