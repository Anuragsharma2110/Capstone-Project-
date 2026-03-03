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
    AnnouncementSerializer
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

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def auto_generate_teams(self, request, pk=None):
        from django.db import transaction

        cohort = self.get_object()
        # Fallback to requested size if cohort doesn't have preferred yet (for safety), default to cohort preferred_team_size
        team_size_input = request.data.get('team_size')
        team_size = int(team_size_input) if team_size_input else cohort.preferred_team_size

        if not team_size or not isinstance(team_size, int) or team_size <= 0:
            return Response(
                {"detail": "Invalid team_size. Must be a positive integer."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check existing teams and reset flag
        existing_teams_exist = Team.objects.filter(cohort=cohort).exists()
        reset_requested = request.data.get('reset', False)

        if existing_teams_exist and not reset_requested:
            return Response(
                {"detail": "Teams already exist for this cohort. Please provide reset=True to overwrite."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 1. Fetch all learners in this cohort
        cohort_memberships = CohortMembership.objects.filter(cohort=cohort).select_related('user')
        all_learners = [cm.user for cm in cohort_memberships if cm.user.role == 'LEARNER']

        if not all_learners:
            return Response(
                {"detail": "No learners available in this cohort to form teams."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Shuffle
        random.shuffle(all_learners)

        teams_created = []

        try:
            with transaction.atomic():
                # 3. Clean slate if reset requested
                if reset_requested:
                    Team.objects.filter(cohort=cohort).delete()

                num_learners = len(all_learners)
                num_base_teams = max(1, num_learners // team_size)
                
                # We will create exactly num_base_teams.
                # The remainder will be distributed 1 by 1.
                remainder = num_learners % team_size

                # If we have fewer total learners than team_size, we just make 1 team.
                if num_base_teams == 1 and num_learners < team_size:
                    remainder = 0

                team_counter = 1
                learner_idx = 0

                for i in range(num_base_teams):
                    # Base size for this team
                    current_team_size = team_size
                    # Add 1 if we still have remainder to distribute
                    if remainder > 0:
                        current_team_size += 1
                        remainder -= 1
                    
                    if learner_idx >= num_learners:
                        break # Safety

                    chunk = all_learners[learner_idx : learner_idx + current_team_size]
                    learner_idx += current_team_size

                    team_name = f"Team {team_counter}"
                    team = Team.objects.create(name=team_name, cohort=cohort)

                    # Create TeamMembers for the chunk
                    team_members_to_create = [
                        TeamMember(team=team, user=user) for user in chunk
                    ]
                    TeamMember.objects.bulk_create(team_members_to_create)

                    teams_created.append({
                        "id": team.id,
                        "name": team.name,
                        "member_count": len(chunk)
                    })
                    team_counter += 1

                # Just in case there are loose learners (shouldn't happen with above math unless very weird numbers)
                if learner_idx < num_learners:
                     leftovers = all_learners[learner_idx:]
                     # append to last team
                     if teams_created:
                         last_team = Team.objects.latest('id')
                         TeamMember.objects.bulk_create([TeamMember(team=last_team, user=user) for user in leftovers])
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
