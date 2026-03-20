from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Seance
from .serializers import SeanceSerializer
from accounts.permissions import IsAdminRole, IsProfesseur, IsEtudiant


class SeanceViewSet(viewsets.ModelViewSet) :
    serializer_class = SeanceSerializer
    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Seance.objects.all()
        
        if user.role == 'PROF' and hasattr(user, 'prof_profile'):
            q = Seance.objects.filter(professeur=user.prof_profile)
            if hasattr(user.prof_profile, 'chef_de_filiere'):
                fil = user.prof_profile.chef_de_filiere
                q = q | Seance.objects.filter(groupe__filiere=fil)
            return q.distinct()
        
        if user.role == 'ETUDIANT' and hasattr(user, 'etudiant_profile'):
            groupe = user.etudiant_profile.groupe
            return Seance.objects.filter(groupe=groupe)
        return Seance.objects.none()

    def get_permissions(self):
        if self.action in ['create', 'destroy', 'update', 'partial_update']:
            permission_classes = [IsAdminRole | IsProfesseur]
        else:
            permission_classes = [IsAuthenticated]
        return [perm() for perm in permission_classes]

    def _check_chef_filiere_permission(self, groupe):
        user = self.request.user
        if user.role == 'ADMIN':
            return True
        if user.role == 'PROF' and hasattr(user, 'prof_profile'):
            if hasattr(user.prof_profile, 'chef_de_filiere'):
                if user.prof_profile.chef_de_filiere == groupe.filiere:
                    return True
        return False

    def perform_create(self, serializer):
        groupe = serializer.validated_data.get('groupe')
        if not self._check_chef_filiere_permission(groupe):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Vous n'êtes pas le chef de cette filière.")
        serializer.save()

    def perform_update(self, serializer):
        groupe = serializer.validated_data.get('groupe', serializer.instance.groupe)
        if not self._check_chef_filiere_permission(groupe):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Vous n'êtes pas le chef de cette filière.")
        serializer.save()

    def perform_destroy(self, instance):
        if not self._check_chef_filiere_permission(instance.groupe):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Vous n'êtes pas le chef de cette filière.")
        instance.delete()

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def start(self, request, pk=None):
        seance = self.get_object()
        # Ensure user is the professor of this seance (or admin)
        if request.user.role == 'PROF':
            if not hasattr(request.user, 'prof_profile') or seance.professeur != request.user.prof_profile:
                 return Response({'error': 'Not authorized'}, status=403)
        # Reset to EN_COURS (handles re-starting a weekly recurring session)
        seance.statut_seance = 'EN_COURS'
        seance.save()
        return Response({'status': 'Session started', 'statut_seance': seance.statut_seance})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def stop(self, request, pk=None):
        from datetime import datetime
        from attendance.models import PresenceProf
        from accounts.models import Utilisateur as Util

        seance = self.get_object()
        # Ensure user is the professor of this seance (or admin)
        if request.user.role == 'PROF':
            if not hasattr(request.user, 'prof_profile') or seance.professeur != request.user.prof_profile:
                return Response({'error': 'Not authorized'}, status=403)

        # Optionally save attendance lines atomically (bypasses the time check)
        lines = request.data.get('lines')
        date_str = request.data.get('date')
        if lines and date_str:
            try:
                date = datetime.strptime(date_str, '%Y-%m-%d').date()
                allowed_user_ids = set(
                    Util.objects.filter(
                        etudiant_profile__groupe=seance.groupe
                    ).values_list('id', flat=True)
                )
                valid_statuses = {'PRESENT', 'ABSENT', 'RETARD'}
                valid_methods = {'face_id', 'manual'}
                to_create = []
                for item in lines:
                    etudiant_id = item.get('etudiant_id')
                    status_val = (item.get('status') or 'ABSENT').upper()
                    method_val = item.get('method') or None
                    if status_val not in valid_statuses:
                        status_val = 'ABSENT'
                    if method_val and method_val not in valid_methods:
                        method_val = None
                    if etudiant_id not in allowed_user_ids:
                        continue
                    to_create.append(
                        PresenceProf(
                            seance=seance, date=date,
                            etudiant_id=etudiant_id,
                            status=status_val, method=method_val
                        )
                    )
                # Replace existing records for this session+date, then bulk create
                PresenceProf.objects.filter(seance=seance, date=date).delete()
                PresenceProf.objects.bulk_create(to_create)
            except Exception as exc:
                return Response({'error': f'Attendance save failed: {exc}'}, status=400)

        seance.statut_seance = 'CLOTUREE'
        seance.save()
        return Response({'status': 'Session stopped', 'statut_seance': seance.statut_seance})
    