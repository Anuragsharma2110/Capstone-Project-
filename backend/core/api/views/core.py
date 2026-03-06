from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
import random
import csv
import io
from core.models import (
    Program, Nomination, Cohort, CohortMembership,
    Team, TeamMember, Task, Submission, Evaluation, WeeklyProgress, Announcement, User
)
from core.api.serializers.core import (
    ProgramSerializer, NominationSerializer, CohortSerializer,
    CohortMembershipSerializer, TeamSerializer, TeamMemberSerializer,
    TaskSerializer, SubmissionSerializer, EvaluationSerializer, WeeklyProgressSerializer,
    AnnouncementSerializer, UserSimpleSerializer
)
from core.permissions import (
    IsAdmin, IsProfessor, IsLearner,
    IsAdminOrReadOnly, IsProfessorOrAdmin, IsLearnerOrAdmin,
    IsAdminOrProfessorReadOnly,
)


class ProgramViewSet(viewsets.ModelViewSet):
    """Programs are managed by Admin; anyone authenticated can read."""
    queryset = Program.objects.all()
    serializer_class = ProgramSerializer
    permission_classes = [IsAdminOrReadOnly]


class NominationViewSet(viewsets.ModelViewSet):
    """
    Learners create their own nominations.
    Admins approve/reject (update).
    """
    queryset = Nomination.objects.all()
    serializer_class = NominationSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [IsLearner()]
        if self.action in ('update', 'partial_update', 'destroy'):
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.status == 'APPROVED':
            cohort = Cohort.objects.filter(program=instance.program).first()
            if cohort:
                CohortMembership.objects.get_or_create(user=instance.user, cohort=cohort)


class CohortViewSet(viewsets.ModelViewSet):
    """
    Admin creates/assigns cohorts (including assigning a professor).
    Professors see assigned cohorts.
    Learners see their cohorts.
    """
    serializer_class = CohortSerializer
    queryset = Cohort.objects.all()
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Cohort.objects.none()
        if user.role == "ADMIN" or user.is_staff:
            return Cohort.objects.all()
        elif user.role == "PROFESSOR":
            return Cohort.objects.filter(professor=user)
        elif user.role == "LEARNER":
            return Cohort.objects.filter(memberships__user=user)
        return Cohort.objects.none()

    @action(detail=True, methods=['get'], permission_classes=[IsAdmin])
    def unassigned_learners(self, request, pk=None):
        """Return learners in this cohort who are not in any team."""
        cohort = self.get_object()
        cohort_memberships = CohortMembership.objects.filter(cohort=cohort).select_related('user')
        all_learners = [cm.user for cm in cohort_memberships if cm.user.role == 'LEARNER']

        # Get IDs of learners already assigned to any team in this cohort
        assigned_user_ids = set(
            TeamMember.objects.filter(team__cohort=cohort).values_list('user_id', flat=True)
        )

        unassigned = [u for u in all_learners if u.id not in assigned_user_ids]
        serializer = UserSimpleSerializer(unassigned, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def create_team(self, request, pk=None):
        """Manually create a new (empty) team in this cohort."""
        cohort = self.get_object()
        name = request.data.get('name', '').strip()
        if not name:
            # Auto-name based on existing team count
            existing_count = Team.objects.filter(cohort=cohort).count()
            name = f"Team {existing_count + 1}"
        team = Team.objects.create(name=name, cohort=cohort)
        serializer = TeamSerializer(team)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def auto_generate_teams(self, request, pk=None):
        from django.db import transaction

        cohort = self.get_object()
        team_size_input = request.data.get('team_size')
        team_size = int(team_size_input) if team_size_input else cohort.preferred_team_size

        if not team_size or not isinstance(team_size, int) or team_size <= 0:
            return Response(
                {"detail": "Invalid team_size. Must be a positive integer."},
                status=status.HTTP_400_BAD_REQUEST
            )

        existing_teams_exist = Team.objects.filter(cohort=cohort).exists()
        reset_requested = request.data.get('reset', False)

        if existing_teams_exist and not reset_requested:
            return Response(
                {"detail": "Teams already exist for this cohort. Please provide reset=True to overwrite."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Fetch all learners in this cohort
        cohort_memberships = CohortMembership.objects.filter(cohort=cohort).select_related('user')
        all_learners = [cm.user for cm in cohort_memberships if cm.user.role == 'LEARNER']

        if not all_learners:
            return Response(
                {"detail": "No learners available in this cohort to form teams."},
                status=status.HTTP_400_BAD_REQUEST
            )

        teams_created = []

        try:
            with transaction.atomic():
                if reset_requested:
                    # Full reset: delete all teams and redistribute everyone
                    Team.objects.filter(cohort=cohort).delete()
                    learners_to_assign = all_learners
                else:
                    # Only assign learners NOT already in a team in this cohort
                    assigned_user_ids = set(
                        TeamMember.objects.filter(team__cohort=cohort).values_list('user_id', flat=True)
                    )
                    learners_to_assign = [u for u in all_learners if u.id not in assigned_user_ids]

                if not learners_to_assign:
                    return Response(
                        {"detail": "No unassigned learners found to form new teams."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                random.shuffle(learners_to_assign)

                # Determine starting team counter offset
                existing_count = Team.objects.filter(cohort=cohort).count()
                team_counter = existing_count + 1

                num_learners = len(learners_to_assign)
                num_base_teams = max(1, num_learners // team_size)
                remainder = num_learners % team_size

                if num_base_teams == 1 and num_learners < team_size:
                    remainder = 0

                learner_idx = 0

                for i in range(num_base_teams):
                    current_team_size = team_size
                    if remainder > 0:
                        current_team_size += 1
                        remainder -= 1

                    if learner_idx >= num_learners:
                        break

                    chunk = learners_to_assign[learner_idx: learner_idx + current_team_size]
                    learner_idx += current_team_size

                    team_name = f"Team {team_counter}"
                    team = Team.objects.create(name=team_name, cohort=cohort)
                    TeamMember.objects.bulk_create([TeamMember(team=team, user=u) for u in chunk])

                    teams_created.append({
                        "id": team.id,
                        "name": team.name,
                        "member_count": len(chunk)
                    })
                    team_counter += 1

                # Safety: stray learners go to the last team
                if learner_idx < num_learners:
                    leftovers = learners_to_assign[learner_idx:]
                    if teams_created:
                        last_team = Team.objects.filter(cohort=cohort).latest('id')
                        TeamMember.objects.bulk_create([TeamMember(team=last_team, user=u) for u in leftovers])
                        teams_created[-1]["member_count"] += len(leftovers)

        except Exception as e:
            return Response(
                {"detail": f"An error occurred during team generation: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response({
            "detail": f"Successfully created {len(teams_created)} teams.",
            "teams": teams_created
        }, status=status.HTTP_201_CREATED)


    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def auto_assign_late_joiners(self, request, pk=None):
        from django.db import transaction
        from django.db.models import Count

        cohort = self.get_object()
        preferred_size = cohort.preferred_team_size
        max_allowed = preferred_size + 1

        # 1. Fetch all learners
        cohort_memberships = CohortMembership.objects.filter(cohort=cohort).select_related('user')
        all_learners = [cm.user for cm in cohort_memberships if cm.user.role == 'LEARNER']

        # 2. Filter for unassigned learners
        unassigned_learners = []
        for learner in all_learners:
            if not TeamMember.objects.filter(team__cohort=cohort, user=learner).exists():
                unassigned_learners.append(learner)

        if not unassigned_learners:
            return Response(
                {"detail": "No unassigned learners found. All learners are already in a team."},
                status=status.HTTP_400_BAD_REQUEST
            )

        assignments = []
        
        try:
            with transaction.atomic():
                for learner in unassigned_learners:
                    # Find existing teams with counts
                    teams_with_counts = Team.objects.filter(cohort=cohort).annotate(
                        member_count=Count('members')
                    ).order_by('member_count', 'id')  # Smallest teams first

                    smallest_team = teams_with_counts.first()

                    # If no teams exist, or smallest team is FULL, create a new team
                    if not smallest_team or smallest_team.member_count >= max_allowed:
                        existing_team_count = Team.objects.filter(cohort=cohort).count()
                        team_name = f"Team {existing_team_count + 1}"
                        smallest_team = Team.objects.create(name=team_name, cohort=cohort)
                        smallest_team.member_count = 0 

                    # Assign learner to the smallest team
                    TeamMember.objects.create(team=smallest_team, user=learner)
                    assignments.append({
                        "user": learner.username,
                        "team": smallest_team.name
                    })

        except Exception as e:
            return Response(
                {"detail": f"An error occurred during late joiner assignment: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response({
            "detail": f"Successfully assigned {len(assignments)} late joiners.",
            "assignments": assignments
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin], parser_classes=[MultiPartParser, FormParser])
    def upload_learners(self, request, pk=None):
        from django.db import transaction
        
        cohort = self.get_object()
        file_obj = request.FILES.get('file')

        if not file_obj:
            return Response({"detail": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)

        if not file_obj.name.endswith('.csv'):
            return Response({"detail": "Invalid file format. Please upload a .csv file."}, status=status.HTTP_400_BAD_REQUEST)

        # Basic size limit (e.g., 5MB)
        if file_obj.size > 5 * 1024 * 1024:
            return Response({"detail": "File too large. Maximum size is 5MB."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            decoded_file = file_obj.read().decode('utf-8')
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)
            
            # Case-insensitive column search for 'email'
            fieldnames = [field.strip().lower() for field in (reader.fieldnames or [])]
            if 'email' not in fieldnames:
                 return Response({"detail": "CSV must contain an 'email' column."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Map original fieldnames to lowered ones for extraction
            reader.fieldnames = fieldnames

            emails_to_process = set()
            for row in reader:
                email = row.get('email', '').strip().lower()
                if email:
                    emails_to_process.add(email)

            if not emails_to_process:
                return Response({"detail": "No valid emails found in the CSV."}, status=status.HTTP_400_BAD_REQUEST)

            assigned_count = 0
            overwritten_count = 0
            failed_emails = []

            with transaction.atomic():
                for email in emails_to_process:
                    try:
                        user = User.objects.get(email__iexact=email, role='LEARNER')
                        
                        # Check existing membership
                        existing_membership = CohortMembership.objects.filter(user=user).first()
                        
                        if existing_membership:
                            if existing_membership.cohort == cohort:
                                # Already in this cohort, skip
                                continue
                            else:
                                # Reassign and count as overwrite
                                existing_membership.cohort = cohort
                                existing_membership.save()
                                overwritten_count += 1
                                assigned_count += 1
                        else:
                            # Create new membership
                            CohortMembership.objects.create(user=user, cohort=cohort)
                            assigned_count += 1

                    except User.DoesNotExist:
                        failed_emails.append(email)

            return Response({
                "assigned_count": assigned_count,
                "overwritten_count": overwritten_count,
                "failed_count": len(failed_emails),
                "failed_emails": failed_emails,
                "detail": f"Processed {len(emails_to_process)} unique emails. Assigned: {assigned_count}. Failed: {len(failed_emails)}."
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"detail": f"Error processing file: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CohortMembershipViewSet(viewsets.ModelViewSet):
    """
    Admin manages cohort memberships (also auto-created on nomination approval).
    everyone authenticated can read.
    """
    queryset = CohortMembership.objects.all()
    serializer_class = CohortMembershipSerializer
    permission_classes = [IsAdminOrReadOnly]


class TeamViewSet(viewsets.ModelViewSet):
    """
    Admin creates/manages teams.
    Everyone authenticated can read.
    """
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = Team.objects.all()
        cohort_id = self.request.query_params.get('cohort')
        if cohort_id:
            qs = qs.filter(cohort_id=cohort_id)
        return qs

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def assign_learner(self, request, pk=None):
        """Assign an unassigned learner to this team."""
        from django.db import transaction
        team = self.get_object()
        cohort = team.cohort
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({"detail": "user_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id, role='LEARNER')
        except User.DoesNotExist:
            return Response({"detail": "Learner not found."}, status=status.HTTP_404_NOT_FOUND)

        # Verify the learner is in this cohort
        if not CohortMembership.objects.filter(user=user, cohort=cohort).exists():
            return Response({"detail": "Learner is not a member of this cohort."}, status=status.HTTP_400_BAD_REQUEST)

        # Verify the learner is not already in a team in this cohort
        if TeamMember.objects.filter(user=user, team__cohort=cohort).exists():
            return Response({"detail": "Learner is already assigned to a team in this cohort."}, status=status.HTTP_400_BAD_REQUEST)

        preferred_size = cohort.preferred_team_size
        current_count = team.members.count()
        warning = None
        if current_count >= preferred_size:
            warning = f"Warning: This team now has {current_count + 1} members, exceeding preferred size of {preferred_size}."

        with transaction.atomic():
            TeamMember.objects.create(team=team, user=user)

        data = {"detail": f"{user.get_full_name() or user.username} assigned to {team.name}."}
        if warning:
            data["warning"] = warning
        return Response(data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def move_learner(self, request, pk=None):
        """Move a learner from this team to another team in the same cohort."""
        from django.db import transaction
        team = self.get_object()
        cohort = team.cohort
        user_id = request.data.get('user_id')
        target_team_id = request.data.get('target_team_id')

        if not user_id or not target_team_id:
            return Response({"detail": "user_id and target_team_id are required."}, status=status.HTTP_400_BAD_REQUEST)

        if str(target_team_id) == str(team.id):
            return Response({"detail": "Source and target teams are the same."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_team = Team.objects.get(id=target_team_id, cohort=cohort)
        except Team.DoesNotExist:
            return Response({"detail": "Target team not found in this cohort."}, status=status.HTTP_404_NOT_FOUND)

        try:
            membership = TeamMember.objects.get(user_id=user_id, team=team)
        except TeamMember.DoesNotExist:
            return Response({"detail": "Learner is not a member of this team."}, status=status.HTTP_404_NOT_FOUND)

        preferred_size = cohort.preferred_team_size
        target_count = target_team.members.count()
        warning = None
        if target_count >= preferred_size:
            warning = f"Warning: Target team now has {target_count + 1} members, exceeding preferred size of {preferred_size}."

        with transaction.atomic():
            membership.delete()
            # Ensure learner is not already in target (safety)
            TeamMember.objects.get_or_create(team=target_team, user_id=user_id)

        data = {"detail": f"Learner moved from {team.name} to {target_team.name}."}
        if warning:
            data["warning"] = warning
        return Response(data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def remove_learner(self, request, pk=None):
        """Remove a learner from this team (learner becomes unassigned)."""
        from django.db import transaction
        team = self.get_object()
        user_id = request.data.get('user_id')

        if not user_id:
            return Response({"detail": "user_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            membership = TeamMember.objects.get(user_id=user_id, team=team)
        except TeamMember.DoesNotExist:
            return Response({"detail": "Learner is not a member of this team."}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            membership.delete()

        return Response({"detail": "Learner removed from team successfully."}, status=status.HTTP_200_OK)


class TeamMemberViewSet(viewsets.ModelViewSet):
    """
    Admin assigns learners to teams.
    Everyone authenticated can read.
    """
    queryset = TeamMember.objects.all()
    serializer_class = TeamMemberSerializer
    permission_classes = [IsAdminOrReadOnly]


class TaskViewSet(viewsets.ModelViewSet):
    """
    Admin creates tasks (linked to cohorts).
    Learners see tasks for their cohort automatically.
    Professors see tasks for their assigned cohorts.
    """
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if not user.is_authenticated:
            return qs.none()
        if user.role == 'ADMIN' or user.is_staff:
            cohort_id = self.request.query_params.get('cohort_id')
            if cohort_id:
                return qs.filter(cohort_id=cohort_id).order_by('deadline')
            return qs.order_by('deadline')
        elif user.role == 'PROFESSOR':
            return qs.filter(cohort__professor=user).order_by('deadline')
        elif user.role == 'LEARNER':
            cohort_ids = CohortMembership.objects.filter(user=user).values_list('cohort_id', flat=True)
            return qs.filter(cohort_id__in=cohort_ids).order_by('deadline')
        return qs.none()



class SubmissionViewSet(viewsets.ModelViewSet):
    """
    Learners submit (create).
    Professors + Admins can read/update (for review).
    Only Admin can delete.
    """
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [IsLearner()]
        if self.action == 'destroy':
            return [IsAdmin()]
        # list, retrieve, update: professor, admin, and learner (own team)
        return [permissions.IsAuthenticated()]


class EvaluationViewSet(viewsets.ModelViewSet):
    """
    Professors evaluate submissions.
    Learners + Admins can read evaluations (shared with teams).
    Only Admin can delete.
    """
    queryset = Evaluation.objects.all()
    serializer_class = EvaluationSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update'):
            return [IsProfessor()]
        if self.action == 'destroy':
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(evaluator=self.request.user)


class WeeklyProgressViewSet(viewsets.ModelViewSet):
    """
    Learners submit weekly progress for their team.
    Professors + Admins can read.
    """
    queryset = WeeklyProgress.objects.all()
    serializer_class = WeeklyProgressSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update'):
            return [IsLearner()]
        if self.action == 'destroy':
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]


class AnnouncementViewSet(viewsets.ModelViewSet):
    """
    Admin creates announcements that are broadcast to Professors and/or Learners.
    Professors/Learners see only announcements targeted at them.
    """
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if not user.is_authenticated:
            return qs.none()
        if user.role == 'ADMIN' or user.is_staff:
            return qs
        elif user.role == 'PROFESSOR':
            return qs.filter(audience__in=['ALL', 'PROFESSORS'])
        elif user.role == 'LEARNER':
            return qs.filter(audience__in=['ALL', 'LEARNERS'])
        return qs.none()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
