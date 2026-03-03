from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from core.api.serializers.auth import (
    LearnerRegistrationSerializer,
    ProfessorRegistrationSerializer,
    AdminRegistrationSerializer,
    CustomTokenObtainPairSerializer,
    ChangePasswordSerializer
)
from django.contrib.auth import get_user_model

User = get_user_model()

class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            if not user.check_password(serializer.data.get("old_password")):
                return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)
            
            user.set_password(serializer.data.get("new_password"))
            user.save()
            return Response({"detail": "Password updated successfully."}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@method_decorator(csrf_exempt, name='dispatch')
class LearnerRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = LearnerRegistrationSerializer

@method_decorator(csrf_exempt, name='dispatch')
class ProfessorRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = ProfessorRegistrationSerializer

@method_decorator(csrf_exempt, name='dispatch')
class AdminRegistrationView(generics.CreateAPIView):
    """
    WARNING: This view allows anyone to register as an admin.
    This is a security risk and should be disabled in production.
    """
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = AdminRegistrationSerializer

@method_decorator(csrf_exempt, name='dispatch')
class LogoutView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        response = Response({'detail': 'Logged out successfully.'}, status=status.HTTP_200_OK)
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')
        return response

@method_decorator(csrf_exempt, name='dispatch')
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
