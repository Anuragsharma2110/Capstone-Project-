import os
import django
import sys

# Add the backend directory to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import authenticate, get_user_model

User = get_user_model()
users = User.objects.all()
print(f"Total users: {users.count()}")

if users.exists():
    user = users.first()
    print(f"Testing with user: {user.username} (Email: {user.email}, Role: {user.role})")
    
    # Let's set a known password for testing
    user.set_password("TestPass123!")
    user.save()
    
    auth_user = authenticate(username=user.username, password="TestPass123!")
    print(f"Authenticated by username: {auth_user}")
    
    if user.email:
        auth_user_email = authenticate(username=user.email, password="TestPass123!")
        print(f"Authenticated by email: {auth_user_email}")
else:
    print("No users found.")
