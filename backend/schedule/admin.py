from django.contrib import admin
from .models import Seance


@admin.register(Seance)
class SeanceAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'jour', 'heure_debut', 'heure_fin', 'professeur', 'groupe', 'module', 'salle', 'statut_seance')
    list_filter = ('jour', 'type_seance', 'statut_seance')
    search_fields = ('module__nom', 'groupe__nom')
    raw_id_fields = ('professeur', 'module', 'groupe', 'salle')
    ordering = ('jour', 'heure_debut')
