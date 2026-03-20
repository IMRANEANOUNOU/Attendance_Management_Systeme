from django.contrib import admin
from .models import Pointage, Justification, PresenceProf


@admin.register(Pointage)
class PointageAdmin(admin.ModelAdmin):
    list_display = ('etudiant', 'seance_id', 'status', 'date_heure', 'score_ai')
    list_filter = ('status', 'seance_id')
    search_fields = ('etudiant__email',)
    readonly_fields = ('date_heure',)


@admin.register(Justification)
class JustificationAdmin(admin.ModelAdmin):
    list_display = ('pointage', 'presence_prof', 'etat', 'date_soumission', 'motif')
    list_filter = ('etat',)
    readonly_fields = ('date_soumission',)


@admin.register(PresenceProf)
class PresenceProfAdmin(admin.ModelAdmin):
    list_display = ('seance', 'date', 'etudiant', 'status')
    list_filter = ('status', 'date', 'seance')
    search_fields = ('etudiant__email',)
