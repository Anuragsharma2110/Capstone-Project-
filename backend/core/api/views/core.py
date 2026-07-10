from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
import random
import csv
import io
import pandas as pd
from django.utils import timezone
from datetime import timedelta
from core.models import (
    Program, Nomination, Cohort, CohortMembership,
    Team, TeamMember, Task, Submission, Evaluation, WeeklyProgress, Notification, NotificationRead, User, CohortMilestone
)
from core.api.serializers.core import (
    ProgramSerializer, NominationSerializer, CohortSerializer,
    CohortMembershipSerializer, TeamSerializer, TeamMemberSerializer,
    TaskSerializer, SubmissionSerializer, EvaluationSerializer, WeeklyProgressSerializer,
    NotificationSerializer, UserSimpleSerializer, CohortMilestoneSerializer
)
from core.permissions import (
    IsAdmin, IsProfessor, IsLearner,
    IsAdminOrReadOnly, IsProfessorOrAdmin, IsLearnerOrAdmin,
    IsAdminOrProfessorReadOnly,
)


# ─── Shared Team Account Helper ───────────────────────────────────────────────

def _build_human_password(team_name: str) -> str:
    """
    Generate a human-readable password in the format: TeamName-XXXX
    e.g. "Alpha-4821". Uses the sanitised first word of the team name.
    """
    import re
    # Take the first word, strip non-alphanumeric, capitalise
    word = re.sub(r'[^A-Za-z0-9]', '', team_name.split()[0]).capitalize() if team_name.split() else 'Team'
    suffix = str(random.randint(1000, 9999))
    return f"{word}-{suffix}"


def _create_team_user(team: Team):
    """
    Create (or replace) the shared Django User account for a Team.
    Username : cohort<cohort_id>_team<team_id>   e.g. cohort3_team7
    Password : human-readable  e.g. Alpha-4821
    Returns  : (user, plain_text_password)
    """
    username = f"cohort{team.cohort_id}_team{team.id}"
    plain_pw = _build_human_password(team.name)

    user = User.objects.create_user(
        username=username,
        password=plain_pw,
        role=User.Role.LEARNER,
        first_name=team.name,
    )
    team.team_user = user
    team.save(update_fields=['team_user'])

    # Create a CohortMembership so the lifecycle auth check (requires ACTIVE membership)
    # does not block this shared account from logging in.
    CohortMembership.objects.get_or_create(
        user=user,
        cohort=team.cohort,
        defaults={'status': 'ACTIVE'},
    )

    return user, plain_pw


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
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def dashboard_stats(self, request):
        """Return global stats for the admin dashboard with diagnostic info."""
        today = timezone.now().date()
        next_week = today + timedelta(days=7)

        # DIAGNOSTIC: Total counts without filters
        all_users_count = User.objects.count()
        all_cohorts_count = Cohort.objects.count()
        unique_roles = list(User.objects.values_list('role', flat=True).distinct())
        unique_statuses = list(Cohort.objects.values_list('status', flat=True).distinct())

        # Corrected / Updated filters
        # Total real students — exclude shared team-account users
        team_account_ids = set(
            Team.objects.filter(team_user__isnull=False).values_list('team_user_id', flat=True)
        )
        total_students = User.objects.filter(role__iexact='LEARNER').exclude(id__in=team_account_ids).count()
        active_cohorts = Cohort.objects.exclude(status='ARCHIVED').count()
        
        # New Metrics
        total_faculty = User.objects.filter(role__iexact='PROFESSOR').count()
        upcoming_deadlines = CohortMilestone.objects.filter(
            due_date__range=[today, next_week]
        ).count()

        return Response({
            "total_students": total_students,
            "active_cohorts": active_cohorts,
            "total_faculty": total_faculty,
            "upcoming_deadlines": upcoming_deadlines,
            # Diagnostic fields
            "debug": {
                "all_users": all_users_count,
                "all_cohorts": all_cohorts_count,
                "roles_found": unique_roles,
                "statuses_found": unique_statuses
            }
        })

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
        cohort_memberships = CohortMembership.objects.filter(cohort=cohort, status='ACTIVE').select_related('user')

        # Exclude shared team-account users (they have a membership for login purposes only)
        team_user_ids = set(
            Team.objects.filter(cohort=cohort, team_user__isnull=False).values_list('team_user_id', flat=True)
        )
        all_learners = [
            cm.user for cm in cohort_memberships
            if cm.user.role == 'LEARNER' and cm.user.id not in team_user_ids
        ]

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
        from django.db import transaction
        cohort = self.get_object()
        name = request.data.get('name', '').strip()
        if not name:
            # Auto-name based on existing team count
            existing_count = Team.objects.filter(cohort=cohort).count()
            name = f"Team {existing_count + 1}"

        with transaction.atomic():
            team = Team.objects.create(name=name, cohort=cohort)
            team_user, plain_pw = _create_team_user(team)

        data = TeamSerializer(team).data
        data['team_credentials'] = {
            'username': team_user.username,
            'password': plain_pw,
        }
        return Response(data, status=status.HTTP_201_CREATED)

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

        # Fetch all ACTIVE learners in this cohort, excluding shared team accounts
        cohort_memberships = CohortMembership.objects.filter(cohort=cohort, status='ACTIVE').select_related('user')
        team_user_ids = set(
            Team.objects.filter(cohort=cohort, team_user__isnull=False).values_list('team_user_id', flat=True)
        )
        all_learners = [
            cm.user for cm in cohort_memberships
            if cm.user.role == 'LEARNER' and cm.user.id not in team_user_ids
        ]

        if not all_learners:
            return Response(
                {"detail": "No learners available in this cohort to form teams."},
                status=status.HTTP_400_BAD_REQUEST
            )

        teams_created = []

        try:
            with transaction.atomic():
                if reset_requested:
                    # Full reset: delete orphaned team-user accounts first, then teams
                    User.objects.filter(
                        owned_team__cohort=cohort
                    ).delete()
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

                print(f"Assigning {num_learners} learners to teams of size {team_size}...")

                learner_idx = 0
                last_team_obj = None

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
                    last_team_obj = Team.objects.create(name=team_name, cohort=cohort)
                    TeamMember.objects.bulk_create([TeamMember(team=last_team_obj, user=u) for u in chunk])
                    team_user, plain_pw = _create_team_user(last_team_obj)

                    teams_created.append({
                        "id": last_team_obj.id,
                        "name": last_team_obj.name,
                        "member_count": len(chunk),
                        "credentials": {
                            "username": team_user.username,
                            "password": plain_pw,
                        }
                    })
                    team_counter += 1

                # Safety: stray learners go to the last team created
                if learner_idx < num_learners and last_team_obj:
                    leftovers = learners_to_assign[learner_idx:]
                    TeamMember.objects.bulk_create([TeamMember(team=last_team_obj, user=u) for u in leftovers])
                    teams_created[-1]["member_count"] += len(leftovers)
                    print(f"Assigned {len(leftovers)} stray learners to {last_team_obj.name}")

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

        # 1. Fetch all ACTIVE real learners (exclude shared team accounts)
        cohort_memberships = CohortMembership.objects.filter(cohort=cohort, status='ACTIVE').select_related('user')
        team_user_ids = set(
            Team.objects.filter(cohort=cohort, team_user__isnull=False).values_list('team_user_id', flat=True)
        )
        all_learners = [
            cm.user for cm in cohort_memberships
            if cm.user.role == 'LEARNER' and cm.user.id not in team_user_ids
        ]

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
        from django.utils.crypto import get_random_string
        import random
        import string
        
        cohort = self.get_object()
        file_obj = request.FILES.get('file')

        if not file_obj:
            return Response({"detail": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)

        if file_obj.size > 5 * 1024 * 1024:
            return Response({"detail": "File too large. Maximum size is 5MB."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            filename = file_obj.name.lower()
            if filename.endswith('.csv'):
                try:
                    # Try common encodings for CSV
                    df = pd.read_csv(file_obj, encoding='utf-8')
                except UnicodeDecodeError:
                    file_obj.seek(0)
                    df = pd.read_csv(file_obj, encoding='latin1')
            elif filename.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(file_obj)
            else:
                return Response({"detail": "Unsupported file format. Please upload a .csv or Excel file."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": f"Error reading file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Find essential columns (case-insensitive)
            # Google Forms often use "Email ID (Registered one)" and "Full Name"
            email_col = next((c for c in df.columns if 'email' in str(c).lower()), None)
            full_name_col = next((c for c in df.columns if 'full name' in str(c).lower()), None)
            
            if full_name_col:
                first_name_col = full_name_col
                last_name_col = None
            else:
                first_name_col = next((c for c in df.columns if 'first' in str(c).lower() or 'name' == str(c).lower()), None)
                last_name_col = next((c for c in df.columns if 'last' in str(c).lower()), None)
            
            if not email_col:
                 return Response({"detail": "File must contain an 'email' column."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Unique emails from the found column
            emails_to_process = set(df[email_col].dropna().astype(str).str.strip().str.lower())
            emails_to_process = {e for e in emails_to_process if e}

            if not emails_to_process:
                return Response({"detail": "No valid emails found in the file."}, status=status.HTTP_400_BAD_REQUEST)

            assigned_count = 0
            overwritten_count = 0
            created_count = 0
            failed_emails = []
            created_credentials = []

            with transaction.atomic():
                for _, row in df.iterrows():
                    email = str(row[email_col]).strip().lower()
                    if not email or email == 'nan':
                        continue
                    
                    try:
                        # 1. Try to find existing learner
                        user = User.objects.filter(email__iexact=email).first()
                        
                        if not user:
                            # 2. Create new learner if not found
                            # Extract names if cols exist, otherwise use parts of email
                            f_name = str(row[first_name_col]).strip() if first_name_col and str(row[first_name_col]) != 'nan' else ""
                            l_name = str(row[last_name_col]).strip() if last_name_col and str(row[last_name_col]) != 'nan' else ""
                            
                            # If only one "Name" column exists, split it
                            if f_name and not l_name and " " in f_name:
                                parts = f_name.split(" ", 1)
                                f_name, l_name = parts[0], parts[1]

                            # Generate a unique username
                            base_username = email.split('@')[0].replace('.', '_')
                            username = base_username
                            counter = 1
                            while User.objects.filter(username=username).exists():
                                username = f"{base_username}{counter}"
                                counter += 1
                            
                            # Generate a random password
                            temp_password = get_random_string(8)

                            user = User.objects.create_user(
                                username=username,
                                email=email,
                                password=temp_password,
                                first_name=f_name,
                                last_name=l_name,
                                role='LEARNER'
                            )
                            created_count += 1
                            created_credentials.append({
                                "email": email,
                                "username": username,
                                "password": temp_password
                            })
                        
                        if user.role != 'LEARNER':
                            failed_emails.append(f"{email} (User exists but role is {user.role})")
                            continue
                        
                        # 3. Handle membership
                        existing_membership = CohortMembership.objects.filter(user=user).first()
                        
                        if existing_membership:
                            # Re-activate if they were graduated/dropped
                            if existing_membership.status != 'ACTIVE':
                                existing_membership.status = 'ACTIVE'
                                overwritten_count += 1
                            
                            if existing_membership.cohort == cohort:
                                existing_membership.save()
                                continue # Already in this cohort
                            else:
                                # Reassign to this cohort
                                existing_membership.cohort = cohort
                                existing_membership.save()
                                assigned_count += 1
                        else:
                            # Create new membership
                            CohortMembership.objects.create(user=user, cohort=cohort, status='ACTIVE')
                            assigned_count += 1

                    except Exception as e:
                        failed_emails.append(f"{email} ({str(e)})")

            return Response({
                "assigned_count": assigned_count,
                "overwritten_count": overwritten_count,
                "created_count": created_count,
                "failed_count": len(failed_emails),
                "failed_emails": failed_emails,
                "credentials": created_credentials,
                "detail": f"Processed {len(emails_to_process)} unique emails. Created: {created_count}. Assigned: {assigned_count}. Failed: {len(failed_emails)}."
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"detail": f"Error processing file: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def bulk_update_access(self, request, pk=None):
        """Update access_until or status for multiple learners in a cohort."""
        from django.db import transaction
        cohort = self.get_object()
        user_ids = request.data.get('user_ids', [])
        access_until = request.data.get('access_until')
        new_status = request.data.get('status') # Optional: ACTIVE, GRADUATED, etc.

        if not user_ids:
            return Response({"detail": "user_ids list is required."}, status=status.HTTP_400_BAD_REQUEST)

        updated_count = 0
        try:
            with transaction.atomic():
                memberships = CohortMembership.objects.filter(cohort=cohort, user_id__in=user_ids)
                
                update_fields = {}
                if access_until is not None:
                    # Handle empty string as None
                    update_fields['access_until'] = access_until if access_until else None
                if new_status:
                    update_fields['status'] = new_status
                
                if update_fields:
                    updated_count = memberships.update(**update_fields)
            
            return Response({
                "detail": f"Successfully updated {updated_count} learners.",
                "updated_count": updated_count
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": f"Error during bulk update: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def clear_learners(self, request, pk=None):
        """Remove all learners from this cohort, optionally deleting their accounts."""
        from django.db import transaction
        cohort = self.get_object()
        delete_accounts = request.data.get('delete_accounts', False)
        
        memberships = CohortMembership.objects.filter(cohort=cohort)
        users_to_check = [m.user for m in memberships]
        count = memberships.count()
        deleted_count = 0
        
        try:
            with transaction.atomic():
                memberships.delete()
                if delete_accounts:
                    for user in users_to_check:
                        # Only delete learners who are not in any OTHER cohorts and not assigned to any team in OTHER cohorts
                        # (Checking memberships is enough since cohort membership is required for team assignment)
                        if user.role == 'LEARNER' and not CohortMembership.objects.filter(user=user).exists():
                            user.delete()
                            deleted_count += 1
            
            msg = f"Successfully removed {count} learners from cohort."
            if delete_accounts:
                msg += f" Deleted {deleted_count} learner accounts entirely."
            
            return Response({"detail": msg}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": f"Error clearing learners: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def reactivate_learner(self, request, pk=None):
        """Manually restore access for a graduated or dropped learner."""
        cohort = self.get_object()
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({"detail": "user_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        membership = CohortMembership.objects.filter(cohort=cohort, user_id=user_id).first()
        if not membership:
            return Response({"detail": "Membership not found."}, status=status.HTTP_404_NOT_FOUND)
            
        membership.status = 'ACTIVE'
        membership.save()
        return Response({"detail": "Learner access has been restored."})

    @action(detail=True, methods=['get'], permission_classes=[IsAdmin])
    def team_credentials(self, request, pk=None):
        """Return stored team usernames for all teams in this cohort.
        Passwords are hashed and cannot be re-read; use regenerate_credentials on a team to reset."""
        cohort = self.get_object()
        teams = Team.objects.filter(cohort=cohort).select_related('team_user')
        data = []
        for team in teams:
            data.append({
                "team_id": team.id,
                "team_name": team.name,
                "username": team.team_user.username if team.team_user else None,
                "has_account": team.team_user is not None,
            })
        return Response(data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def dispatch_credentials_emails(self, request, pk=None):
        """
        Receives a JSON list of credentials and dispatches emails to the respective team members.
        Expects payload: {'credentials': [{'team_id': 1, 'username': 'x', 'password': 'y'}, ...]}
        """
        cohort = self.get_object()
        credentials_list = request.data.get('credentials', [])
        
        if not credentials_list or not isinstance(credentials_list, list):
            return Response(
                {"detail": "Invalid or empty credentials list."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        from core.emails import send_team_credentials_batch
        
        # Dispatch emails using utility
        emails_sent = send_team_credentials_batch(cohort, credentials_list)
        
        return Response({
            "detail": f"Successfully queued {emails_sent} credential emails to students.",
            "emails_sent": emails_sent
        }, status=status.HTTP_200_OK)

    # ──────────────────────────────────────────────────────────────────────
    # TEAM PERFORMANCES (Admin Dashboard)
    # ──────────────────────────────────────────────────────────────────────

    @action(detail=True, methods=['get'], permission_classes=[IsAdmin])
    def team_performances(self, request, pk=None):
        """Return teams in this cohort with members and final submission state."""
        cohort = self.get_object()
        teams = Team.objects.filter(cohort=cohort).prefetch_related('members__user')
        milestones = CohortMilestone.objects.filter(cohort=cohort).order_by('order_index', 'due_date')

        teams_data = []
        for team in teams:
            members = []
            for tm in team.members.all():
                u = tm.user
                members.append({
                    'id': u.id,
                    'username': u.username,
                    'first_name': u.first_name,
                    'last_name': u.last_name,
                    'email': u.email,
                })
            teams_data.append({
                'id': team.id,
                'name': team.name,
                'is_final_submitted': team.is_final_submitted,
                'members': members,
            })

        milestones_data = CohortMilestoneSerializer(milestones, many=True).data

        professor_data = None
        if cohort.professor:
            professor_data = {
                'first_name': cohort.professor.first_name,
                'last_name': cohort.professor.last_name,
                'email': cohort.professor.email,
            }

        return Response({
            'cohort_id': cohort.id,
            'cohort_name': cohort.name,
            'professor': professor_data,
            'milestones': milestones_data,
            'teams': teams_data,
        })

    # ──────────────────────────────────────────────────────────────────────
    # HANDBOOK ACTIONS
    # ──────────────────────────────────────────────────────────────────────

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin],
            parser_classes=[MultiPartParser, FormParser])
    def upload_handbook(self, request, pk=None):
        """Admin uploads (or replaces) the cohort handbook (PDF/Doc)."""
        import os
        cohort = self.get_object()
        uploaded = request.FILES.get('file')
        if not uploaded:
            return Response({"detail": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

        allowed_extensions = ['.pdf', '.doc', '.docx']
        ext = os.path.splitext(uploaded.name)[1].lower()
        if ext not in allowed_extensions:
            return Response(
                {"detail": f"Unsupported file type '{ext}'. Allowed: {', '.join(allowed_extensions)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Delete existing file to avoid orphaned files on disk
        if cohort.handbook:
            try:
                if os.path.isfile(cohort.handbook.path):
                    os.remove(cohort.handbook.path)
            except Exception:
                pass

        cohort.handbook = uploaded
        cohort.save(update_fields=['handbook'])

        return Response({
            "detail": f"Handbook '{uploaded.name}' uploaded successfully.",
            "handbook_name": uploaded.name,
            "handbook_url": request.build_absolute_uri(cohort.handbook.url),
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def download_handbook(self, request, pk=None):
        """
        Serve the cohort handbook for download.
        Learners can only access handbooks for cohorts they belong to.
        Admins and Professors can access any.
        """
        import os
        from django.http import FileResponse
        cohort = self.get_object()

        if request.user.role == 'LEARNER':
            if not CohortMembership.objects.filter(user=request.user, cohort=cohort).exists():
                return Response(
                    {"detail": "You are not a member of this cohort."},
                    status=status.HTTP_403_FORBIDDEN
                )

        if not cohort.handbook:
            return Response({"detail": "No handbook has been uploaded for this cohort yet."}, status=status.HTTP_404_NOT_FOUND)

        file_path = cohort.handbook.path
        if not os.path.isfile(file_path):
            return Response({"detail": "Handbook file not found on server."}, status=status.HTTP_404_NOT_FOUND)

        filename = os.path.basename(file_path)
        response = FileResponse(open(file_path, 'rb'), as_attachment=True, filename=filename)
        return response

    @action(detail=True, methods=['delete'], permission_classes=[IsAdmin])
    def delete_handbook(self, request, pk=None):
        """Admin removes the cohort handbook."""
        import os
        cohort = self.get_object()
        if not cohort.handbook:
            return Response({"detail": "No handbook to delete."}, status=status.HTTP_404_NOT_FOUND)

        try:
            if os.path.isfile(cohort.handbook.path):
                os.remove(cohort.handbook.path)
        except Exception:
            pass

        cohort.handbook = None
        cohort.save(update_fields=['handbook'])
        return Response({"detail": "Handbook removed successfully."}, status=status.HTTP_200_OK)


class CohortMembershipViewSet(viewsets.ModelViewSet):
    """
    Admin manages cohort memberships (also auto-created on nomination approval).
    everyone authenticated can read.
    """
    queryset = CohortMembership.objects.all()
    serializer_class = CohortMembershipSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = CohortMembership.objects.select_related('user', 'cohort').all()
        cohort_id = self.request.query_params.get('cohort')
        if cohort_id:
            qs = qs.filter(cohort_id=cohort_id)
        # Exclude memberships that belong to shared team-login accounts
        qs = qs.exclude(user__owned_team__isnull=False)
        return qs


class TeamViewSet(viewsets.ModelViewSet):
    """
    Admin creates/manages teams.
    Everyone authenticated can read.
    """
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        qs = Team.objects.all()

        if user.is_authenticated:
            if user.role == 'LEARNER':
                # Regular learners: team they are a member of
                # Shared team accounts: team they "own" (linked via team_user)
                from django.db.models import Q
                qs = qs.filter(
                    Q(members__user=user) | Q(team_user=user)
                )
            elif user.role == 'PROFESSOR':
                # Professors only see teams in their cohorts
                qs = qs.filter(cohort__professor=user)

        cohort_id = self.request.query_params.get('cohort')
        if cohort_id:
            qs = qs.filter(cohort_id=cohort_id)
        return qs.distinct()

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
            Notification.objects.create(
                title="New Team Member",
                message=f"{user.get_full_name() or user.username} has joined your team.",
                audience='TEAM',
                category='SYSTEM',
                team=team,
                cohort=team.cohort,
                created_by=request.user
            )

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
            try:
                learner_user = User.objects.get(id=user_id)
                Notification.objects.create(
                    title="New Team Member",
                    message=f"{learner_user.get_full_name() or learner_user.username} has been moved to your team.",
                    audience='TEAM',
                    category='SYSTEM',
                    team=target_team,
                    cohort=target_team.cohort,
                    created_by=request.user
                )
            except User.DoesNotExist:
                pass

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

    from rest_framework.parsers import MultiPartParser, FormParser

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def regenerate_credentials(self, request, pk=None):
        """Generate a new human-readable password for this team's shared account."""
        team = self.get_object()
        if not team.team_user:
            # No account yet — create one
            team_user, plain_pw = _create_team_user(team)
        else:
            plain_pw = _build_human_password(team.name)
            team.team_user.set_password(plain_pw)
            team.team_user.save(update_fields=['password'])
            team_user = team.team_user
        return Response({
            "team_id": team.id,
            "team_name": team.name,
            "username": team_user.username,
            "new_password": plain_pw,
        })

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated], parser_classes=[MultiPartParser, FormParser])
    def submit_final(self, request, pk=None):
        """Mark a team's final submission as completed and upload associated document."""
        team = self.get_object()
        user = request.user

        # Allow admin, actual team member, or the shared team_user account
        is_team_account = hasattr(user, 'owned_team') and user.owned_team_id == team.id
        if user.role != 'ADMIN' and not user.is_staff:
            if not is_team_account and not TeamMember.objects.filter(team=team, user=user).exists():
                return Response(
                    {"detail": "You are not a member of this team."},
                    status=status.HTTP_403_FORBIDDEN
                )

        # First try to find an existing Task for this cohort
        task = Task.objects.filter(cohort=team.cohort).order_by('-deadline').first()

        # If no Task exists, auto-create one from the final CohortMilestone
        if not task:
            from core.models import CohortMilestone
            from django.utils import timezone
            milestone = CohortMilestone.objects.filter(
                cohort=team.cohort, is_final_submission=True
            ).first()
            if not milestone:
                # Fall back to the latest milestone
                milestone = CohortMilestone.objects.filter(
                    cohort=team.cohort
                ).order_by('-due_date').first()
            if milestone:
                task = Task.objects.create(
                    title=milestone.title,
                    description=f"Auto-created from milestone: {milestone.title}",
                    cohort=team.cohort,
                    deadline=timezone.make_aware(
                        timezone.datetime.combine(milestone.due_date, timezone.datetime.max.time())
                    ) if timezone.is_naive(
                        timezone.datetime.combine(milestone.due_date, timezone.datetime.max.time())
                    ) else timezone.datetime.combine(milestone.due_date, timezone.datetime.max.time()),
                )
            else:
                return Response({"detail": "No active tasks or milestones found to submit against."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if the latest submission for this task is already evaluated
        latest_submission = Submission.objects.filter(team=team, task=task).order_by('-submitted_at').first()
        if latest_submission and latest_submission.evaluations.exists():
            return Response(
                {"detail": "This submission has been reviewed and is now locked for changes. Please contact your professor if you need to submit a new version."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        # Create a new version of the submission
        submission = Submission(
            team=team,
            task=task
        )

        repo_link = request.data.get('repoLink')
        if repo_link:
            submission.file_url = repo_link

        file_obj = request.FILES.get('document')
        if file_obj:
            submission.document = file_obj

        submission.save()

        team.is_final_submitted = True
        team.save(update_fields=['is_final_submitted'])
        
        Notification.objects.create(
            title="Final Submission Received",
            message=f"{team.name} has submitted their final deliverable for task '{task.title}'.",
            audience='PROFESSORS',
            category='SYSTEM',
            cohort=team.cohort,
            created_by=user
        )

        return Response({"detail": "Final submission marked as completed.", "is_final_submitted": True}, status=status.HTTP_200_OK)


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

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if not user.is_authenticated:
            return qs.none()
            
        if user.role == 'ADMIN' or user.is_staff:
            return qs
        elif user.role == 'PROFESSOR':
            return qs.filter(team__cohort__professor=user)
        elif user.role == 'LEARNER':
            return qs.filter(team__members__user=user)
        return qs.none()


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

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if not user.is_authenticated:
            return qs.none()
            
        if user.role == 'ADMIN' or user.is_staff:
            pass
        elif user.role == 'PROFESSOR':
            qs = qs.filter(submission__team__cohort__professor=user)
        elif user.role == 'LEARNER':
            qs = qs.filter(submission__team__members__user=user)
        else:
            return qs.none()

        submission_id = self.request.query_params.get('submission')
        if submission_id:
            qs = qs.filter(submission_id=submission_id)
        return qs
    def create(self, request, *args, **kwargs):
        submission_id = request.data.get('submission')
        try:
            # If an evaluation already exists for this submission, update it
            instance = Evaluation.objects.get(submission_id=submission_id)
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            instance.evaluator = request.user
            instance.save()
            Notification.objects.create(
                title="Evaluation Updated",
                message=f"Your submission for '{instance.submission.task.title}' has been re-evaluated.",
                audience='TEAM',
                category='MESSAGE',
                team=instance.submission.team,
                cohort=instance.submission.team.cohort,
                created_by=request.user
            )
            return Response(serializer.data)
        except Evaluation.DoesNotExist:
            return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        evaluation = serializer.save(evaluator=self.request.user)
        Notification.objects.create(
            title="Evaluation Received",
            message=f"Your submission for '{evaluation.submission.task.title}' has been evaluated.",
            audience='TEAM',
            category='MESSAGE',
            team=evaluation.submission.team,
            cohort=evaluation.submission.team.cohort,
            created_by=self.request.user
        )

class WeeklyProgressViewSet(viewsets.ModelViewSet):
    """
    Learners submit weekly progress for their team.
    Professors + Admins can read.
    """
    queryset = WeeklyProgress.objects.all()
    serializer_class = WeeklyProgressSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update'):
            # Allow both individual learners AND shared team accounts (also role=LEARNER)
            return [IsLearner()]
        if self.action == 'destroy':
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
            return qs.filter(team__cohort__professor=user)
        elif user.role == 'LEARNER':
            # Individual learner OR shared team account
            if hasattr(user, 'owned_team') and user.owned_team is not None:
                return qs.filter(team=user.owned_team)
            return qs.filter(team__members__user=user)
        return qs.none()


class NotificationViewSet(viewsets.ModelViewSet):
    """
    Admin creates notifications that are broadcast to Professors and/or Learners.
    Professors/Learners see only notifications targeted at them.
    """
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update'):
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if not user.is_authenticated:
            return qs.none()
        
        # Filter out notifications the user has soft-deleted
        deleted_ids = NotificationRead.objects.filter(user=user, is_deleted=True).values_list('notification_id', flat=True)
        qs = qs.exclude(id__in=deleted_ids)

        if user.role == 'ADMIN' or user.is_staff:
            return qs
            
        from django.db.models import Q
        q = Q(audience='ALL')

        if user.role == 'PROFESSOR':
            cohort_ids = Cohort.objects.filter(professor=user).values_list('id', flat=True)
            q |= Q(audience='PROFESSORS')
            q |= Q(audience='COHORT', cohort_id__in=cohort_ids)
        elif user.role == 'LEARNER':
            cohort_ids = CohortMembership.objects.filter(user=user).values_list('cohort_id', flat=True)
            team_ids = []
            if hasattr(user, 'owned_team') and user.owned_team:
                team_ids.append(user.owned_team.id)
            else:
                team_ids = list(TeamMember.objects.filter(user=user).values_list('team_id', flat=True))
                
            q |= Q(audience='LEARNERS')
            q |= Q(audience='COHORT', cohort_id__in=cohort_ids)
            if team_ids:
                q |= Q(audience='TEAM', team_id__in=team_ids)

        return qs.filter(q).distinct()

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def unread_count(self, request):
        qs = self.get_queryset()
        read_ids = NotificationRead.objects.filter(user=request.user).values_list('notification_id', flat=True)
        unread_count = qs.exclude(id__in=read_ids).count()
        return Response({'unread_count': unread_count})

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        NotificationRead.objects.get_or_create(user=request.user, notification=notification)
        return Response({'status': 'marked as read'})

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def mark_all_as_read(self, request):
        notifications = self.get_queryset()
        notification_reads = [
            NotificationRead(user=request.user, notification=n)
            for n in notifications
            if not NotificationRead.objects.filter(user=request.user, notification=n).exists()
        ]
        NotificationRead.objects.bulk_create(notification_reads)
        return Response({'status': f'marked {len(notification_reads)} notifications as read'})

    def destroy(self, request, *args, **kwargs):
        user = request.user
        instance = self.get_object()
        
        if user.role == 'ADMIN' or user.is_staff:
            return super().destroy(request, *args, **kwargs)
        
        NotificationRead.objects.update_or_create(
            user=user, 
            notification=instance, 
            defaults={'is_deleted': True}
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

class CohortMilestoneViewSet(viewsets.ModelViewSet):
    """
    Admin adds/manages milestones for cohorts.
    Everyone authenticated can read them.
    """
    queryset = CohortMilestone.objects.all()
    serializer_class = CohortMilestoneSerializer
    permission_classes = [IsAdminOrReadOnly]
    
    def get_queryset(self):
        qs = super().get_queryset()
        cohort_id = self.request.query_params.get('cohort')
        if cohort_id:
            qs = qs.filter(cohort_id=cohort_id)
        return qs
