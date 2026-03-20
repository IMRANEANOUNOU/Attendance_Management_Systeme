from django.db import models
from accounts.models import Utilisateur, Professeur
from academic.models import Module,Groupe,Salle


class Seance(models.Model) :
   
    class Jour(models.TextChoices) :
        LUNDI = 'LUNDI', 'Lundi'
        MARDI = 'MARDI', 'Mardi'
        MERCREDI = 'MERCREDI', 'Mercredi'
        JEUDI = 'JEUDI', 'Jeudi'
        VENDREDI = 'VENDREDI', 'Vendredi'
        SAMEDI = 'SAMEDI', 'Samedi'
        DIMANCHE = 'DIMANCHE', 'Dimanche'

    class TypeSeance(models.TextChoices) :
        COURS = 'COURS', 'Cours'
        TP = 'TP', 'TP'
        TD = 'TD', 'TD' 
    class Statut(models.TextChoices) :
        PROGRAMMEE = 'PROGRAMMEE', 'Programmee'
        EN_COURS = 'EN_COURS', 'En Cours'
        CLOTUREE = 'CLOTUREE', 'Cloturee'
        ANNULEE = 'ANNULEE', 'Annulee'
    jour = models.CharField(max_length=10,choices=Jour.choices)
    seance_id = models.IntegerField()
    heure_debut = models.TimeField()
    heure_fin = models.TimeField()
    type_seance = models.CharField(max_length=10,choices=TypeSeance.choices,default=TypeSeance.COURS)
    statut_seance = models.CharField(max_length=30,choices=Statut.choices,default=Statut.PROGRAMMEE)
    professeur = models.ForeignKey(Professeur, on_delete=models.SET_NULL,null=True,related_name='seances')
    module = models.ForeignKey(Module, on_delete=models.CASCADE,related_name='seances')
    salle = models.ForeignKey(Salle,on_delete=models.SET_NULL,null=True,related_name='seances')
    groupe = models.ForeignKey(Groupe, on_delete=models.CASCADE)
    class Meta:
        ordering=['jour','heure_debut']
        verbose_name="Seance"
        verbose_name_plural="Seances"
    def __str__(self):
        prof_name = self.professeur.user.last_name if self.professeur else "Inconnu"
        return f"{self.module.nom} ({self.type_seance}) - {self.groupe} - {prof_name}"

