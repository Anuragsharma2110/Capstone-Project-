import csv
from django.contrib.auth import get_user_model
from core.models import Cohort, CohortMembership

User = get_user_model()

# Use the first cohort as default for these test accounts
cohort = Cohort.objects.first()
if not cohort:
    print("Error: No cohort found to assign learners to.")
    exit(1)

print(f"Assigning to cohort: {cohort.name}")

CSV_PATH = "/app/learners_test_data.csv"
password = "Welcome123!"

try:
    with open(CSV_PATH, 'r') as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            name = row.get('Name', '').strip()
            email = row.get('Email address', '').strip().lower()
            if not email:
                continue
                
            # Username pattern: part before @, dots replaced by underscores
            username = email.split('@')[0].replace('.', '_')
            
            # Extract first/last name
            parts = name.split(' ', 1)
            f_name = parts[0]
            l_name = parts[1] if len(parts) > 1 else ""

            # Check if user already exists
            user = User.objects.filter(email__iexact=email).first()
            if not user:
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    first_name=f_name,
                    last_name=l_name,
                    role='LEARNER'
                )
                print(f"Created: {username}")
                count += 1
            else:
                print(f"Exists: {username}")
            
            # Assign to cohort
            CohortMembership.objects.get_or_create(user=user, cohort=cohort)
            
        print(f"Successfully processed {count} new test learners.")

except FileNotFoundError:
    print(f"Error: CSV file not found at {CSV_PATH}")
except Exception as e:
    print(f"Error: {str(e)}")
