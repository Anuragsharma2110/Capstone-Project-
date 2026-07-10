import io
import pandas as pd
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from core.models import User, Cohort, CohortMembership

class EnrollmentTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username='admin', email='admin@example.com', password='password'
        )
        self.client.force_authenticate(user=self.admin)
        self.cohort = Cohort.objects.create(name="Test Cohort", status='ACTIVE')
        self.url = f"/api/cohorts/{self.cohort.id}/upload_learners/"

    def test_upload_csv_standard_headers(self):
        """Test uploading a CSV with standard email/name headers."""
        data = {
            'email': ['learner1@example.com', 'learner2@example.com'],
            'first_name': ['Learner', 'Test'],
            'last_name': ['One', 'Two']
        }
        df = pd.DataFrame(data)
        csv_file = io.BytesIO()
        df.to_csv(csv_file, index=False)
        csv_file.seek(0)
        csv_file.name = 'learners.csv'

        response = self.client.post(self.url, {'file': csv_file}, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(User.objects.filter(role='LEARNER').count(), 2)
        self.assertEqual(CohortMembership.objects.filter(cohort=self.cohort).count(), 2)

    def test_upload_google_form_csv(self):
        """Test uploading a CSV with Google Form style headers."""
        data = {
            'Email ID (Registered one)': ['gf1@example.com'],
            'Full Name': ['Google Form Learner']
        }
        df = pd.DataFrame(data)
        csv_file = io.BytesIO()
        df.to_csv(csv_file, index=False)
        csv_file.seek(0)
        csv_file.name = 'responses.csv'

        response = self.client.post(self.url, {'file': csv_file}, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user = User.objects.get(email='gf1@example.com')
        self.assertEqual(user.first_name, 'Google')
        self.assertEqual(user.last_name, 'Form Learner')

    def test_upload_duplicate_email(self):
        """Test that duplicate emails in the file don't cause duplicate users."""
        data = {
            'email': ['dup@example.com', 'dup@example.com']
        }
        df = pd.DataFrame(data)
        csv_file = io.BytesIO()
        df.to_csv(csv_file, index=False)
        csv_file.seek(0)
        csv_file.name = 'duplicates.csv'

        response = self.client.post(self.url, {'file': csv_file}, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(User.objects.filter(email='dup@example.com').count(), 1)
