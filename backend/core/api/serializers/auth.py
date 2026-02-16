from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name')

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class LearnerRegistrationSerializer(UserRegistrationSerializer):
    def create(self, validated_data):
        validated_data['role'] = User.Role.LEARNER
        return super().create(validated_data)

class ProfessorRegistrationSerializer(UserRegistrationSerializer):
    def create(self, validated_data):
        validated_data['role'] = User.Role.PROFESSOR
        return super().create(validated_data)

class AdminRegistrationSerializer(UserRegistrationSerializer):
    def create(self, validated_data):
        validated_data['role'] = User.Role.ADMIN
        validated_data['is_staff'] = True
        validated_data['is_superuser'] = True
        return super().create(validated_data)

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['role'] = user.role
        token['username'] = user.username

        return token
