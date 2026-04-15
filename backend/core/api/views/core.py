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
        total_students = User.objects.filter(role__iexact='LEARNER').count()
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
                df = pd.read_csv(file_obj)
            elif filename.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(file_obj)
            else:
                return Response({"detail": "Unsupported file format. Please upload a .csv or Excel file."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Find essential columns (case-insensitive)
            email_col = next((c for c in df.columns if 'email' in str(c).lower()), None)
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

            default_password = "Welcome123!"

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
                            
                            user = User.objects.create_user(
                                username=username,
                                email=email,
                                password=default_password,
                                first_name=f_name,
                                last_name=l_name,
                                role='LEARNER'
                            )
                            created_count += 1
                        
                        if user.role != 'LEARNER':
                            failed_emails.append(f"{email} (User exists but role is {user.role})")
                            continue
                        
                        # 3. Handle membership
                        existing_membership = CohortMembership.objects.filter(user=user).first()
                        
                        if existing_membership:
                            if existing_membership.cohort == cohort:
                                continue # Already in this cohort
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

                    except Exception as e:
                        failed_emails.append(f"{email} ({str(e)})")

            return Response({
                "assigned_count": assigned_count,
                "overwritten_count": overwritten_count,
                "created_count": created_count,
                "failed_count": len(failed_emails),
                "failed_emails": failed_emails,
                "detail": f"Processed {len(emails_to_process)} unique emails. Created: {created_count}. Assigned: {assigned_count}. Failed: {len(failed_emails)}."
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"detail": f"Error processing file: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
                # Learners only see team(s) they are members of
                qs = qs.filter(members__user=user)
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

    from rest_framework.parsers import MultiPartParser, FormParser

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated], parser_classes=[MultiPartParser, FormParser])
    def submit_final(self, request, pk=None):
        """Mark a team's final submission as completed and upload associated document."""
        team = self.get_object()
        user = request.user

        # Allow admin or actual team member
        if user.role != 'ADMIN' and not user.is_staff:
            if not TeamMember.objects.filter(team=team, user=user).exists():
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
            return qs
        elif user.role == 'PROFESSOR':
            return qs.filter(submission__team__cohort__professor=user)
        elif user.role == 'LEARNER':
            return qs.filter(submission__team__members__user=user)
        return qs.none()
    def create(self, request, *args, **kwargs):
        submission_id = request.data.get('submission')
        try:
            # If an evaluation already exists for this submission, update it
            instance = Evaluation.objects.get(submission_id=submission_id)
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            # Ensure evaluator is set to current user during update as well
            instance.evaluator = request.user
            instance.save()
            return Response(serializer.data)
        except Evaluation.DoesNotExist:
            return super().create(request, *args, **kwargs)

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
        elif user.role == 'PROFESSOR':
            return qs.filter(audience__in=['ALL', 'PROFESSORS'])
        elif user.role == 'LEARNER':
            return qs.filter(audience__in=['ALL', 'LEARNERS'])
        return qs.none()

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
