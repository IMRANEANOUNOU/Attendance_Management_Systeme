from rest_framework import serializers
from .models import Seance

class SeanceSerializer(serializers.ModelSerializer):
    prof_nom = serializers.CharField(source='professeur.user.last_name', read_only=True)
    module_nom = serializers.CharField(source='module.nom', read_only=True)
    groupe_nom = serializers.CharField(source='groupe.nom', read_only=True)
    salle_nom = serializers.CharField(source='salle.nom', read_only=True)

    class Meta:
        model = Seance
        fields = '__all__'