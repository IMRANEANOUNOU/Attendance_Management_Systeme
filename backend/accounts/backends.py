"""
Custom auth backend so login works with email (USERNAME_FIELD).
Django's ModelBackend expects the credential in the 'username' parameter;
this backend looks up by email whether we receive 'username' or 'email'.
"""
from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend


class EmailBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, email=None, **kwargs):
        UserModel = get_user_model()
        identifier = (email or username)
        if identifier is not None:
            identifier = str(identifier).strip()
        if not identifier or password is None:
            return None
        try:
            user = UserModel.objects.get(email__iexact=identifier)
        except UserModel.DoesNotExist:
            return None
        if not user.check_password(password):
            return None
        if not self.user_can_authenticate(user):
            return None
        return user
