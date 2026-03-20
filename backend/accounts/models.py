from django.db import models
from django.contrib.auth.models import AbstractUser

class Utilisateur(AbstractUser):

    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Administrateur"   
        PROF = "PROF", "Professeur"       
        ETUDIANT = "ETUDIANT", "Etudiant" 

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.ETUDIANT)
    is_first_login = models.BooleanField(default=True)
    
    email = models.EmailField(unique=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username'] 

    def __str__(self):
        return self.email
        
class Etudiant(models.Model):
    user = models.OneToOneField(Utilisateur,on_delete=models.CASCADE,related_name='etudiant_profile'
    )  
    cne = models.CharField(max_length=20, unique=True) 
    photo_profile = models.ImageField(upload_to='etudiants_faces/',null=True,blank=False
    )
    date_naissance = models.DateField(null=True, blank=True)
    adresse = models.TextField(null=True, blank=True)
    groupe = models.ForeignKey('academic.Groupe',on_delete=models.SET_NULL,null=True,blank=True,related_name="etudiants"
    )
    filiere = models.ForeignKey("academic.Filiere",on_delete=models.CASCADE,related_name="etudiants")
    def __str__(self):
        return f"{self.cne} - {self.user.last_name} {self.user.first_name}"
class Professeur(models.Model):
    user = models.OneToOneField(Utilisateur, on_delete=models.CASCADE, related_name='prof_profile')
    
    matricule = models.CharField(max_length=50, unique=True)
    specialite = models.CharField(max_length=100)
    
    departement = models.ForeignKey('academic.Departement', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"Prof. {self.user.last_name}"