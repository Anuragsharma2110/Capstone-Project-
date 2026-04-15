from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.api.views.auth import (
    LearnerRegistrationView,
    ProfessorRegistrationView,
    AdminRegistrationView,
    CookieTokenObtainPairView,
    CookieTokenRefreshView,
    LogoutView,
    ChangePasswordView,
)
from core.api.views.users import UserDetailView, ProfessorListView
from core.api.views.core import (
    ProgramViewSet, NominationViewSet, CohortViewSet,
    CohortMembershipViewSet, TeamViewSet, TeamMemberViewSet, TaskViewSet,
    SubmissionViewSet, EvaluationViewSet, WeeklyProgressViewSet, NotificationViewSet, CohortMilestoneViewSet
)

router = DefaultRouter()
router.register(r'programs', ProgramViewSet)
router.register(r'nominations', NominationViewSet)
router.register(r'cohorts', CohortViewSet)
router.register(r'cohort-memberships', CohortMembershipViewSet)
router.register(r'teams', TeamViewSet)
router.register(r'team-members', TeamMemberViewSet)
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'submissions', SubmissionViewSet)
router.register(r'evaluations', EvaluationViewSet)
router.register(r'weekly-progress', WeeklyProgressViewSet)
router.register(r'notifications', NotificationViewSet)
router.register(r'cohort-milestones', CohortMilestoneViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/learner/', LearnerRegistrationView.as_view(), name='register_learner'),
    path('auth/register/professor/', ProfessorRegistrationView.as_view(), name='register_professor'),
    path('auth/register/admin/', AdminRegistrationView.as_view(), name='register_admin'),
    path('auth/login/', CookieTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', UserDetailView.as_view(), name='user_detail'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('users/professors/', ProfessorListView.as_view(), name='professor_list'),
]
