from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()

class EmailOrUsernameModelBackend(ModelBackend):
    """
    Authenticates against settings.AUTH_USER_MODEL by username or email.
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        # The key might be the `USERNAME_FIELD` depending on how it's called
        if username is None:
            username = kwargs.get(User.USERNAME_FIELD)
        
        if username is None:
            return None

        try:
            # Prefer case-insensitive match on username or email
            user = User.objects.get(Q(username__iexact=username) | Q(email__iexact=username))
        except User.DoesNotExist:
            # Run the default password hasher once to reduce timing attacks
            User().set_password(password)
            return None
        except User.MultipleObjectsReturned:
            user = User.objects.filter(Q(username__iexact=username) | Q(email__iexact=username)).order_by('id').first()

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
