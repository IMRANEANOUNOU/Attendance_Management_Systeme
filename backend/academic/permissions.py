from rest_framework import permissions
class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.role == 'ADMIN' or request.user.is_superuser)
class IsProfesseur(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'PROF'
class IsEtudiant(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ETUDIANT'
class IsChefDepartement(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == 'PROF' and
            hasattr(request.user, 'prof_profile') and
            hasattr(request.user.prof_profile, 'chef_de_departement') and
            request.user.prof_profile.chef_de_departement is not None
        )
class IsChefFiliere(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == 'PROF' and
            hasattr(request.user, 'prof_profile') and
            hasattr(request.user.prof_profile, 'chef_de_filiere') and
            request.user.prof_profile.chef_de_filiere is not None
        )