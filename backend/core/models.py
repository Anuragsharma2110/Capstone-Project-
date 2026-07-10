from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
    class Role(models.TextChoices):
        LEARNER = 'LEARNER', _('Learner')
        PROFESSOR = 'PROFESSOR', _('Professor')
        ADMIN = 'ADMIN', _('Admin')

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.LEARNER,
    )
    access_until = models.DateField(null=True, blank=True)

    def is_learner(self):
        return self.role == self.Role.LEARNER

    def is_professor(self):
        return self.role == self.Role.PROFESSOR

    def is_admin(self):
        return self.role == self.Role.ADMIN

class Program(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    nomination_start_date = models.DateField()
    nomination_end_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Nomination(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', _('Pending')
        APPROVED = 'APPROVED', _('Approved')
        REJECTED = 'REJECTED', _('Rejected')

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='nominations')
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='nominations')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    statement_of_purpose = models.TextField(blank=True, null=True)
    nominated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.program.name}"

class Cohort(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', _('Active')
        PENDING = 'PENDING', _('Pending')
        ARCHIVED = 'ARCHIVED', _('Archived')

    name = models.CharField(max_length=255)
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='cohorts', null=True, blank=True)
    professor = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='assigned_cohorts', null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    preferred_team_size = models.PositiveIntegerField(default=5)
    institution_name = models.CharField(max_length=255, default='Unknown Institution')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    handbook = models.FileField(upload_to="handbooks/", null=True, blank=True)

    def __str__(self):
        return self.name

class CohortMembership(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', _('Active')
        GRADUATED = 'GRADUATED', _('Graduated')
        DROPPED = 'DROPPED', _('Dropped')
        SUSPENDED = 'SUSPENDED', _('Suspended')

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cohort_memberships')
    cohort = models.ForeignKey(Cohort, on_delete=models.CASCADE, related_name='memberships')
    joined_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    access_until = models.DateField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'cohort')

    def __str__(self):
        return f"{self.user.username} in {self.cohort.name}"

class Team(models.Model):
    name = models.CharField(max_length=255)
    cohort = models.ForeignKey(Cohort, on_delete=models.CASCADE, related_name='teams')
    is_final_submitted = models.BooleanField(default=False)
    # Shared login account for all students on this team
    team_user = models.OneToOneField(
        'User',
        on_delete=models.SET_NULL,
        related_name='owned_team',
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.cohort.name})"

class TeamMember(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='team_memberships')
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='members')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'team')

    def __str__(self):
        return f"{self.user.username} in {self.team.name}"

class WeeklyProgress(models.Model):
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='weekly_progress')
    week_number = models.PositiveIntegerField()
    update_text = models.TextField()
    blockers = models.TextField(blank=True, null=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.team.name} - Week {self.week_number}"

class Task(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    cohort = models.ForeignKey(Cohort, on_delete=models.CASCADE, related_name='tasks')
    deadline = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class Submission(models.Model):
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='submissions')
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='submissions')
    file_url = models.URLField(blank=True, null=True) # Repo link
    document = models.FileField(upload_to='submissions/', blank=True, null=True) # Actual upload
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Submission by {self.team.name} for {self.task.title}"

class Evaluation(models.Model):
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name='evaluations')
    evaluator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='evaluations_given')
    score = models.PositiveIntegerField() # e.g., 0-100
    feedback = models.TextField(blank=True, null=True)
    evaluated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Evaluation for {self.submission}"

class Notification(models.Model):
    class Audience(models.TextChoices):
        ALL = 'ALL', _('All Users')
        PROFESSORS = 'PROFESSORS', _('Professors Only')
        LEARNERS = 'LEARNERS', _('Learners Only')
        COHORT = 'COHORT', _('Specific Cohort')
        TEAM = 'TEAM', _('Specific Team')

    class Category(models.TextChoices):
        MESSAGE = 'MESSAGE', _('Message')
        SESSION = 'SESSION', _('Session')
        ERROR = 'ERROR', _('Error')
        SYSTEM = 'SYSTEM', _('System')

    title = models.CharField(max_length=255)
    message = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    audience = models.CharField(max_length=20, choices=Audience.choices, default=Audience.ALL)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.SYSTEM)
    cohort = models.ForeignKey(Cohort, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    team = models.ForeignKey('Team', on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class NotificationRead(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications_read')
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name='read_by')
    read_at = models.DateTimeField(auto_now_add=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'notification')

    def __str__(self):
        return f"{self.user.username} read {self.notification.title}"

class CohortMilestone(models.Model):
    cohort = models.ForeignKey(Cohort, on_delete=models.CASCADE, related_name='milestones')
    title = models.CharField(max_length=255)
    due_date = models.DateField()
    order_index = models.PositiveIntegerField(default=0)
    is_final_submission = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order_index', 'due_date']
        
    def __str__(self):
        return f"{self.cohort.name} - {self.title}"
