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

    def is_learner(self):
        return self.role == self.Role.LEARNER

    def is_professor(self):
        return self.role == self.Role.PROFESSOR

    def is_admin(self):
        return self.role == self.Role.ADMIN

class Cohort(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    start_date = models.DateField()
    end_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class CohortMembership(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cohort_memberships')
    cohort = models.ForeignKey(Cohort, on_delete=models.CASCADE, related_name='memberships')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'cohort')

    def __str__(self):
        return f"{self.user.username} in {self.cohort.name}"

class Team(models.Model):
    name = models.CharField(max_length=255)
    cohort = models.ForeignKey(Cohort, on_delete=models.CASCADE, related_name='teams')
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
    file_url = models.URLField(blank=True, null=True) # Or FileField if using real storage
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Submission by {self.team.name} for {self.task.title}"

class Evaluation(models.Model):
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name='evaluations')
    evaluator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='evaluations_given')
    score = models.PositiveIntegerField() # e.g., 0-100
    feedback = models.TextField()
    evaluated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Evaluation for {self.submission}"
