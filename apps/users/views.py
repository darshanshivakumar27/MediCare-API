from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenRefreshView

from apps.users.serializers import LoginSerializer, RegisterSerializer, UserSerializer


class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    Registers a new user with name, email, and password.
    Returns safe user profile details with HTTP 201 Created.
    """
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                'message': 'User registered successfully.',
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(generics.GenericAPIView):
    """
    POST /api/auth/login/
    Authenticates a user and returns JWT access & refresh tokens along with user info.
    Returns HTTP 200 OK on success, or HTTP 400/401 on invalid credentials.
    """
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data
        return Response(
            {
                'access': validated_data['access'],
                'refresh': validated_data['refresh'],
                'user': UserSerializer(validated_data['user']).data,
            },
            status=status.HTTP_200_OK,
        )


class CustomTokenRefreshView(TokenRefreshView):
    """
    POST /api/auth/refresh/
    Exchanges a valid refresh token for a fresh access token.
    """
    permission_classes = [AllowAny]
