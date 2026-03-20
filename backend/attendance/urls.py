from django.urls import path
from .views import (
    MarquerPresenceView,
    ProfPresenceView,
    MesAbsencesView,
    JustifierAbsenceView,
    ChefJustificationsView,
    ChefTraiterJustificationView,
    AdminEtudiantAbsencesView,
)

urlpatterns = [
    path("marquer-presence/", MarquerPresenceView.as_view(), name="marquer_presence"),
    path("prof/presence/", ProfPresenceView.as_view(), name="prof_presence"),
    path("mes-absences/", MesAbsencesView.as_view(), name="mes_absences"),
    path("justify/", JustifierAbsenceView.as_view(), name="justifier_absence"),
    path("chef/justifications/", ChefJustificationsView.as_view(), name="chef_justifications"),
    path("chef/traiter-justification/", ChefTraiterJustificationView.as_view(), name="chef_traiter_justification"),
    path("admin/etudiants/<int:etudiant_id>/absences/", AdminEtudiantAbsencesView.as_view(), name="admin_etudiant_absences"),
]