from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from core.api.views.auth import (
    LearnerRegistrationView,
    ProfessorRegistrationView,
    AdminRegistrationView,
    CookieTokenObtainPairView
)
from core.api.views.users import UserDetailView

urlpatterns = [
    path('auth/register/learner/', LearnerRegistrationView.as_view(), name='register_learner'),
    path('auth/register/professor/', ProfessorRegistrationView.as_view(), name='register_professor'),
    path('auth/register/admin/', AdminRegistrationView.as_view(), name='register_admin'),
    path('auth/login/', CookieTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', UserDetailView.as_view(), name='user_detail'),
]
