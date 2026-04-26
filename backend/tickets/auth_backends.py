from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

class CaseInsensitiveModelBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        UserModel = get_user_model()
        if username is None:
            username = kwargs.get(UserModel.USERNAME_FIELD)
            
        if not username:
            return None
            
        try:
            # Case insensitive exact match for the username
            user = UserModel.objects.get(username__iexact=username)
        except UserModel.DoesNotExist:
            # Run the generic hasher once to reduce timing attacks
            UserModel().set_password(password)
            return None
        except UserModel.MultipleObjectsReturned:
            # Failsafe: Return the first matched user alphabetically via ID instead of crashing
            user = UserModel.objects.filter(username__iexact=username).order_by('id').first()

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
            
        return None
