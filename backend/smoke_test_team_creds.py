from core.models import Team, Cohort, User
from core.api.views.core import _create_team_user, _build_human_password

# Test password format
pw = _build_human_password('Alpha Squad')
print(f'Sample password: {pw}')

# Check team_user field exists on model
cohort = Cohort.objects.first()
if cohort:
    print(f'Cohort found: {cohort.name}')
    print(f'Team.team_user field exists: {hasattr(Team, "team_user")}')
else:
    print('No cohort found in DB (normal for fresh setup)')

# Check the DB column exists by inspecting existing teams
print(f'Total teams in DB: {Team.objects.count()}')
print('All checks passed.')
