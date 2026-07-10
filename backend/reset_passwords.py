import os
import django
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()
users = User.objects.all()

print(f"Updating passwords for {users.count()} users...")
for u in users:
    u.set_password("Welcome123!")
    u.save()

print("All passwords updated to: Welcome123!")
