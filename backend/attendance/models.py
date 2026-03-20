from django.db import models
from django.conf import settings


class PresenceProf(models.Model):
    """Professor-recorded attendance for a session (no photo/GPS required)."""
    STATUS_CHOICES = [
        ("PRESENT", "Present"),
        ("ABSENT", "Absent"),
        ("RETARD", "En Retard"),
    ]
    METHOD_CHOICES = [
        ("face_id", "Face ID"),
        ("manual", "Manuel"),
    ]
    seance = models.ForeignKey(
        "schedule.Seance", on_delete=models.CASCADE, related_name="presences_prof"
    )
    date = models.DateField()
    etudiant = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="presences_prof"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PRESENT")
    method = models.CharField(max_length=20, choices=METHOD_CHOICES, default="manual", blank=True, null=True)

    class Meta:
        verbose_name = "Présence (prof)"
        verbose_name_plural = "Présences (prof)"
        unique_together = [["seance", "date", "etudiant"]]

    def __str__(self):
        return f"{self.seance} | {self.date} | {self.etudiant} → {self.status}"


class Pointage(models.Model):
    STATUS_CHOICES = [
        ('PRESENT','Present'),
        ('ABSENT','Absent'),
        ('RETARD','En Retard'), 
    ]
    etudiant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,related_name='pointages')
    seance_id = models.IntegerField()
    date_heure = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20,choices=STATUS_CHOICES)
    photo_preuve = models.ImageField(upload_to='pointages/')
    latitude = models.FloatField()
    longitude = models.FloatField()
    score_ai = models.FloatField(default=0.0)


    def __str__(self):
        return f"{self.etudiant} - {self.date_heure}"
    
class Justification(models.Model):
    ETAT_CHOICES = [
        ('EN_ATTENTE','En Attente'),
        ('APPROUVE','Approuve'),
        ('REFUSE','Refuse'),
    ]

    pointage = models.OneToOneField(Pointage,on_delete=models.CASCADE, null=True, blank=True)
    presence_prof = models.OneToOneField(PresenceProf, on_delete=models.CASCADE, null=True, blank=True, related_name='justification')
    motif = models.TextField(max_length=40)
    fichier = models.FileField(upload_to='justifications/')
    etat = models.CharField(max_length=20,choices=ETAT_CHOICES,default='EN_ATTENTE')
    date_soumission = models.DateTimeField(auto_now_add=True)
    