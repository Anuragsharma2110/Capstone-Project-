from rest_framework import serializers
from core.models import (
    Program, Nomination, Cohort, CohortMembership, 
    Team, TeamMember, Task, Submission, Evaluation, WeeklyProgress, User, Announcement
)

class UserSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'role')

class ProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = Program
        fields = '__all__'

class NominationSerializer(serializers.ModelSerializer):
    user_details = UserSimpleSerializer(source='user', read_only=True)
    program_details = ProgramSerializer(source='program', read_only=True)

    class Meta:
        model = Nomination
        fields = '__all__'

class CohortSerializer(serializers.ModelSerializer):
    program_details = ProgramSerializer(source='program', read_only=True)
    professor_details = UserSimpleSerializer(source='professor', read_only=True)
    team_count = serializers.SerializerMethodField()
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = Cohort
        fields = '__all__'

    def get_team_count(self, obj):
        return obj.teams.count()

    def get_student_count(self, obj):
        return obj.memberships.count()

class CohortMembershipSerializer(serializers.ModelSerializer):
    user_details = UserSimpleSerializer(source='user', read_only=True)
    cohort_details = CohortSerializer(source='cohort', read_only=True)

    class Meta:
        model = CohortMembership
        fields = '__all__'

class TeamMemberSimpleSerializer(serializers.ModelSerializer):
    user_details = UserSimpleSerializer(source='user', read_only=True)

    class Meta:
        model = TeamMember
        fields = ('id', 'user', 'user_details', 'joined_at')

class TeamSerializer(serializers.ModelSerializer):
    cohort_details = CohortSerializer(source='cohort', read_only=True)
    members = TeamMemberSimpleSerializer(many=True, read_only=True)

    class Meta:
        model = Team
        fields = '__all__'

class TeamMemberSerializer(serializers.ModelSerializer):
    user_details = UserSimpleSerializer(source='user', read_only=True)
    team_details = TeamSerializer(source='team', read_only=True)

    class Meta:
        model = TeamMember
        fields = '__all__'

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'

class SubmissionSerializer(serializers.ModelSerializer):
    team_details = TeamSerializer(source='team', read_only=True)
    task_details = TaskSerializer(source='task', read_only=True)

    class Meta:
        model = Submission
        fields = '__all__'

class EvaluationSerializer(serializers.ModelSerializer):
    evaluator_details = UserSimpleSerializer(source='evaluator', read_only=True)
    submission_details = SubmissionSerializer(source='submission', read_only=True)

    class Meta:
        model = Evaluation
        fields = '__all__'

class WeeklyProgressSerializer(serializers.ModelSerializer):
    team_details = TeamSerializer(source='team', read_only=True)

    class Meta:
        model = WeeklyProgress
        fields = '__all__'

class AnnouncementSerializer(serializers.ModelSerializer):
    created_by_details = UserSimpleSerializer(source='created_by', read_only=True)

    class Meta:
        model = Announcement
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at')
