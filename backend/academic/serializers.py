from rest_framework import serializers
from .models import Departement, Filiere, Groupe, Module, Salle


# --- DEPARTEMENT ---
class DepartementSerializer(serializers.ModelSerializer):
    chef_nom = serializers.CharField(source="chef.__str__", read_only=True)
    
    class Meta:
        model = Departement
        fields = ["id", "nom", "description", "chef", "chef_nom"]


class DepartementDetailSerializer(serializers.ModelSerializer):
    filieres_count = serializers.IntegerField(source="filieres.count", read_only=True)
    chef_nom = serializers.CharField(source="chef.__str__", read_only=True)

    class Meta:
        model = Departement
        fields = ["id", "nom", "description", "chef", "chef_nom", "filieres_count"]


# --- FILIERE ---
class FiliereListSerializer(serializers.ModelSerializer):
    departement_nom = serializers.CharField(source="departement.nom", read_only=True)
    chef_nom = serializers.SerializerMethodField()

    class Meta:
        model = Filiere
        fields = [
            "id",
            "nom",
            "description",
            "type_diplome",
            "departement",
            "departement_nom",
            "chef",
            "chef_nom",
        ]
        extra_kwargs = {"departement": {"read_only": True}}

    def get_chef_nom(self, obj):
        if obj.chef and hasattr(obj.chef, 'user'):
            return f"{obj.chef.user.last_name} {obj.chef.user.first_name}"
        return None


class FiliereDetailSerializer(serializers.ModelSerializer):
    departement_nom = serializers.CharField(source="departement.nom", read_only=True)
    groupes_count = serializers.IntegerField(source="groupes.count", read_only=True)
    modules_count = serializers.IntegerField(source="modules.count", read_only=True)
    chef_nom = serializers.CharField(source="chef.__str__", read_only=True)

    type_diplome_display = serializers.CharField(
        source="get_type_diplome_display", read_only=True
    )

    class Meta:
        model = Filiere
        fields = [
            "id",
            "nom",
            "description",
            "type_diplome",
            "type_diplome_display",
            "departement",
            "departement_nom",
            "chef",
            "chef_nom",
            "groupes_count",
            "modules_count",
        ]


# --- GROUPE ---
class GroupeSerializer(serializers.ModelSerializer):
    filiere_nom = serializers.CharField(source="filiere.nom", read_only=True)
    niveau_display = serializers.CharField(source="get_niveau_display", read_only=True)
    type_formation_display = serializers.CharField(
        source="get_type_formation_display", read_only=True
    )

    class Meta:
        model = Groupe
        fields = [
            "id",
            "nom",
            "niveau",
            "niveau_display",
            "type_formation",
            "type_formation_display",
            "filiere",
            "filiere_nom",
        ]


# --- MODULE ---
class ModuleSerializer(serializers.ModelSerializer):
    filiere_nom = serializers.CharField(source="filiere.nom", read_only=True)

    professeur_nom = serializers.SerializerMethodField()

    class Meta:
        model = Module
        fields = [
            "id",
            "nom",
            "code",
            "semestre",
            "filiere",
            "filiere_nom",
            "professeur",
            "professeur_nom",
        ]

    def get_professeur_nom(self, obj):

        if obj.professeur:
            return str(obj.professeur)
        return "Non assigné"


# --- SALLE ---
class SalleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Salle
        fields = ["id", "nom", "capacite", "latitude", "longitude", "rayon"]
