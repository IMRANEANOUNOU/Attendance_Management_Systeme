from django.contrib import admin
from .models import Utilisateur,Etudiant,Professeur

# admin.site.register(Utilisateur)
# admin.site.register(Professeur)

@admin.register(Utilisateur)
class UtilisateurAdmin(admin.ModelAdmin) :
    list_display = ('email' , 'first_name','last_name','role')

@admin.register(Etudiant)
class EtudiantAdmin(admin.ModelAdmin) :
    list_display = ('user', 'cne')
    search_fields = ('cne', 'user__email') 

@admin.register(Professeur)
class ProfesseurAdmin(admin.ModelAdmin) :
    list_display = ('user', 'matricule','specialite')
    search_fields = ('cne', 'user__email') 