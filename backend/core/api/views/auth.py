from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from core.permissions import IsAdmin
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
    WARNING: This view is restricted to authenticated admins to prevent unauthorized access.
    """
    queryset = User.objects.all()
    permission_classes = (IsAuthenticated, IsAdmin,)
    serializer_class = AdminRegistrationSerializer

@method_decorator(csrf_exempt, name='dispatch')
class LogoutView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        try:
            refresh_token = request.COOKIES.get(settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh_token'))
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass

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
                settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token'),
                token,
                max_age=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds(),
                secure=settings.SIMPLE_JWT.get('AUTH_COOKIE_SECURE', False),
                httponly=settings.SIMPLE_JWT.get('AUTH_COOKIE_HTTP_ONLY', True),
                samesite=settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Lax')
            )
        
        if refresh:
            response.set_cookie(
                settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh_token'),
                refresh,
                max_age=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds(),
                secure=settings.SIMPLE_JWT.get('AUTH_COOKIE_SECURE', False),
                httponly=settings.SIMPLE_JWT.get('AUTH_COOKIE_HTTP_ONLY', True),
                samesite=settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Lax')
            )
        
        return response

@method_decorator(csrf_exempt, name='dispatch')
class CookieTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh_token'))
        
        if refresh_token:
            data = request.data.copy()
            data['refresh'] = refresh_token
            serializer = self.get_serializer(data=data)
            
            try:
                serializer.is_valid(raise_exception=True)
            except Exception as e:
                # If is_valid(raise_exception=True) raises, we shouldn't access .errors 
                # unless we are sure it's a validation error. SimpleJWT raises TokenError.
                from rest_framework_simplejwt.exceptions import TokenError
                if isinstance(e, TokenError):
                    return Response({"detail": str(e)}, status=status.HTTP_401_UNAUTHORIZED)
                return Response(serializer.errors if hasattr(serializer, '_errors') else {"detail": str(e)}, status=status.HTTP_401_UNAUTHORIZED)
                
            response = Response(serializer.validated_data, status=status.HTTP_200_OK)
            
            token = response.data.get('access')
            refresh = response.data.get('refresh')
            
            if token:
                response.set_cookie(
                    settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token'),
                    token,
                    max_age=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds(),
                    secure=settings.SIMPLE_JWT.get('AUTH_COOKIE_SECURE', False),
                    httponly=settings.SIMPLE_JWT.get('AUTH_COOKIE_HTTP_ONLY', True),
                    samesite=settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Lax')
                )
            
            if refresh:
                response.set_cookie(
                    settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh_token'),
                    refresh,
                    max_age=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds(),
                    secure=settings.SIMPLE_JWT.get('AUTH_COOKIE_SECURE', False),
                    httponly=settings.SIMPLE_JWT.get('AUTH_COOKIE_HTTP_ONLY', True),
                    samesite=settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Lax')
                )
            return response

        return Response({"detail": "Refresh token missing from cookie."}, status=status.HTTP_401_UNAUTHORIZED)
