import logging
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from .models import Team, TeamMember

logger = logging.getLogger(__name__)

def send_team_credentials_batch(cohort, credentials_list):
    """
    Given a list of dictionaries [{'team_id': 1, 'username': 'x', 'password': 'y'}, ...],
    fetch the members of each team and send them an HTML email with the credentials.
    """
    
    html_template = """
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Capstone Project - Team Credentials</h2>
        
        <p>Hello {student_name},</p>
        
        <p>Your team <strong>{team_name}</strong> has been provisioned for the <strong>{cohort_name}</strong> cohort.</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin-top: 0;"><strong>Here are your shared team login credentials:</strong></p>
          <p style="margin-bottom: 5px;"><strong>Username:</strong> <code style="background: #fff; padding: 2px 6px; border-radius: 4px;">{username}</code></p>
          <p style="margin-bottom: 0;"><strong>Password:</strong> <code style="background: #fff; padding: 2px 6px; border-radius: 4px; color: #d97706;">{password}</code></p>
        </div>
        
        <p><em>Please note: These credentials are shared among all members of your team. You will use this account to log in and submit your project milestones.</em></p>
        
        <p>Best regards,<br>The Capstone Admin Team</p>
      </body>
    </html>
    """
    
    text_template = """
    Hello {student_name},
    
    Your team {team_name} has been provisioned for the {cohort_name} cohort.
    
    Here are your shared team login credentials:
    Username: {username}
    Password: {password}
    
    Please note: These credentials are shared among all members of your team. You will use this account to log in and submit your project milestones.
    
    Best regards,
    The Capstone Admin Team
    """

    emails_sent_count = 0

    for cred in credentials_list:
        team_id = cred.get('team_id')
        username = cred.get('username')
        password = cred.get('password')
        
        if not all([team_id, username, password]):
            logger.warning(f"Missing credential data for team_id {team_id}. Skipping.")
            continue
            
        try:
            team = Team.objects.get(id=team_id, cohort=cohort)
        except Team.DoesNotExist:
            logger.warning(f"Team {team_id} not found in cohort {cohort.id}. Skipping email.")
            continue
            
        # Get all members of this team
        members = TeamMember.objects.filter(team=team).select_related('user')
        
        for member in members:
            student_user = member.user
            student_email = student_user.email
            
            if not student_email:
                continue
                
            student_name = student_user.first_name or student_user.username
            
            # Format message
            context = {
                'student_name': student_name,
                'team_name': team.name,
                'cohort_name': cohort.name,
                'username': username,
                'password': password
            }
            
            text_content = text_template.format(**context)
            html_content = html_template.format(**context)
            
            subject = f"Your Capstone Team Credentials - {team.name}"
            
            # Create the email message
            msg = EmailMultiAlternatives(
                subject,
                text_content,
                settings.DEFAULT_FROM_EMAIL,
                [student_email]
            )
            msg.attach_alternative(html_content, "text/html")
            
            try:
                msg.send()
                emails_sent_count += 1
            except Exception as e:
                logger.error(f"Failed to send email to {student_email}: {str(e)}")
                
    return emails_sent_count
