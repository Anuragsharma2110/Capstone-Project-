import os
import django

# Setup django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
try:
    django.setup()
    from core.models import User, Cohort, Submission, Team, Evaluation
    
    print(f"Total Students: {User.objects.filter(role='LEARNER').count()}")
    print(f"Active Cohorts: {Cohort.objects.filter(status='ACTIVE').count()}")
    print(f"Total Submissions: {Submission.objects.count()}")
    print(f"Submissions with no evals: {Submission.objects.filter(evaluations__isnull=True).count()}")
    print(f"Teams: {Team.objects.count()}")
    print(f"Teams with is_final_submitted=True: {Team.objects.filter(is_final_submitted=True).count()}")
    
    # Check the specific pending professor evaluations logic
    pending_prof_evals = Team.objects.filter(
        is_final_submitted=True,
        submissions__evaluations__isnull=True
    ).distinct().count()
    print(f"Pending Prof Evals (current logic): {pending_prof_evals}")

except Exception as e:
    print(f"Error: {e}")
