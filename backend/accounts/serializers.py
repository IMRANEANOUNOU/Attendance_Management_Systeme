from rest_framework import serializers
from .models import Utilisateur, Etudiant, Professeur

class UtilisateurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = ['id', 'email', 'first_name', 'last_name', 'role']

class EtudiantSerializer(serializers.ModelSerializer):
    user = UtilisateurSerializer(read_only=True)

    groupe_nom = serializers.SerializerMethodField()
    filiere_nom = serializers.CharField(source='filiere.nom', read_only=True)

    def get_groupe_nom(self, obj):
        return obj.groupe.nom if obj.groupe else None

    departement = serializers.IntegerField(source='filiere.departement.id', read_only=True)

    # Absence stats (annotated in get_etudiants view)
    nb_absences = serializers.IntegerField(read_only=True, default=0)
    nb_absences_justifiees = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Etudiant
        fields = ['id', 'user', 'cne', 'photo_profile', 'date_naissance', 'groupe', 'groupe_nom', 'filiere', 'filiere_nom', 'departement', 'nb_absences', 'nb_absences_justifiees']

class ProfesseurModuleSerializer(serializers.Serializer):
    """Lightweight serializer for professor's modules (used for filière filtering)."""
    id = serializers.IntegerField()
    nom = serializers.CharField()
    filiere = serializers.IntegerField(source='filiere_id')
    filiere_nom = serializers.CharField(source='filiere.nom')

class ProfesseurSerializer(serializers.ModelSerializer):
    user = UtilisateurSerializer(read_only=True)
    modules = ProfesseurModuleSerializer(many=True, read_only=True)

    class Meta:
        model = Professeur
        fields = ['id', 'user', 'matricule', 'specialite', 'departement', 'modules']