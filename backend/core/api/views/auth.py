from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from django.conf import settings
from core.api.serializers.auth import (
    LearnerRegistrationSerializer,
    ProfessorRegistrationSerializer,
    AdminRegistrationSerializer,
    CustomTokenObtainPairSerializer
)
from django.contrib.auth import get_user_model

User = get_user_model()

class LearnerRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = LearnerRegistrationSerializer

class ProfessorRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = ProfessorRegistrationSerializer

class AdminRegistrationView(generics.CreateAPIView):
    """
    WARNING: This view allows anyone to register as an admin.
    This is a security risk and should be disabled in production.
    """
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = AdminRegistrationSerializer

class CookieTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        token = response.data.get('access')
        refresh = response.data.get('refresh')
        
        print(f"Login success. Token: {token is not None}")

        if token:
            response.set_cookie(
                'access_token',
                token,
                max_age=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds(),
                secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                httponly=True,
                samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
            )
        
        if refresh:
            response.set_cookie(
                'refresh_token',
                refresh,
                max_age=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds(),
                secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                httponly=True,
                samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
            )
        
        return response
