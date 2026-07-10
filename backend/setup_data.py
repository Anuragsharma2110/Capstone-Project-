import os
import django
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import User, Program, Cohort

# Create Admin/Professor
admin_user, created = User.objects.get_or_create(username='admin', email='admin@example.com')
if created:
    admin_user.set_password('admin')
    admin_user.is_superuser = True
    admin_user.is_staff = True
    admin_user.role = User.Role.PROFESSOR
    admin_user.save()
    print("Created admin/professor user: admin / admin")

# Create a Program
program, p_created = Program.objects.get_or_create(
    name="Software Engineering Capstone",
    defaults={
        'nomination_start_date': date.today(),
        'nomination_end_date': date.today() + timedelta(days=30),
    }
)
if p_created: print("Created Program: Software Engineering Capstone")

# Create a Cohort
cohort, c_created = Cohort.objects.get_or_create(
    name="Test Cohort",
    defaults={
        'program': program,
        'professor': admin_user,
        'start_date': date.today(),
        'end_date': date.today() + timedelta(days=90),
    }
)
if c_created: print("Created Cohort: Test Cohort")
