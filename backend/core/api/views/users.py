from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from core.api.serializers.auth import UserUpdateSerializer
from core.api.serializers.core import UserSimpleSerializer

User = get_user_model()

class UserDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        team_id = None
        if user.role == 'LEARNER':
            membership = user.team_memberships.first()
            if membership:
                team_id = membership.team.id

        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'team_id': team_id,
        })

    def put(self, request):
        user = request.user
        serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            # Return full user data after update
            team_id = None
            if user.role == 'LEARNER':
                membership = user.team_memberships.first()
                if membership:
                    team_id = membership.team.id

            return Response({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'team_id': team_id,
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProfessorListView(generics.ListAPIView):
    serializer_class = UserSimpleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(role=User.Role.PROFESSOR)
