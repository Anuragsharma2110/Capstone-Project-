from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from core.models import (
    User, Program, Nomination, Cohort, CohortMembership,
    Team, TeamMember, Task, Submission, Evaluation, WeeklyProgress
)


class CustomUserAdmin(UserAdmin):
    # Add the custom 'role' field to the display and forms
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active')
    fieldsets = UserAdmin.fieldsets + (
        ('Role', {'fields': ('role',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Role', {'fields': ('role',)}),
    )


admin.site.register(User, CustomUserAdmin)
admin.site.register(Program)
admin.site.register(Nomination)
admin.site.register(Cohort)
admin.site.register(CohortMembership)
admin.site.register(Team)
admin.site.register(TeamMember)
admin.site.register(Task)
admin.site.register(Submission)
admin.site.register(Evaluation)
admin.site.register(WeeklyProgress)
