from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from core.models import User, Cohort, CohortMilestone

class MilestoneTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username='admin', email='admin@example.com', password='password'
        )
        self.client.force_authenticate(user=self.admin)
        self.cohort = Cohort.objects.create(name="Planning Cohort", status='ACTIVE')
        self.url = f"/api/cohort-milestones/"

    def test_create_milestone(self):
        """Test creating a new milestone for a cohort."""
        data = {
            "cohort": self.cohort.id,
            "title": "Module 1 Complete",
            "description": "Learners should finish module 1 by this date.",
            "due_date": "2026-05-01",
            "order": 0
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CohortMilestone.objects.filter(cohort=self.cohort).count(), 1)

    def test_reorder_milestones(self):
        """Test that the 'order' field is correctly saved."""
        m1 = CohortMilestone.objects.create(cohort=self.cohort, title="M1", due_date="2026-05-01", order=0)
        m2 = CohortMilestone.objects.create(cohort=self.cohort, title="M2", due_date="2026-05-05", order=1)
        
        # Move M2 to order 0
        patch_url = f"{self.url}{m2.id}/"
        response = self.client.patch(patch_url, {"order": 0})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        m2.refresh_from_db()
        self.assertEqual(m2.order, 0)
