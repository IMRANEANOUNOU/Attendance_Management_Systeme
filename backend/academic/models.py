from django.db import models


class Departement(models.Model):
    nom = models.CharField(max_length=100, unique=True)
    description = models.TextField(null=True, blank=True)
    chef = models.OneToOneField(
        "accounts.Professeur",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="chef_de_departement",
    )

    def __str__(self):
        return self.nom


class Filiere(models.Model):

    class TypeDiplome(models.TextChoices):
        DUT = "DUT", "Diplôme Universitaire de Technologie"
        BACHELOR = "BACHELOR", "Bachelor"

    type_diplome = models.CharField(max_length=50, choices=TypeDiplome.choices)
    nom = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    departement = models.ForeignKey(
        Departement, on_delete=models.CASCADE, related_name="filieres"
    )
    chef = models.OneToOneField(
        "accounts.Professeur",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="chef_de_filiere",
    )

    def __str__(self):
        return f"{self.nom} ({self.departement.nom})"


class Groupe(models.Model):

    class Niveau(models.TextChoices):
        FIRST_YEAR = "1ERE", "1ere Annee"
        SECOND_YEAR = "2EME", "2eme Annee"
        BACHELOR = "BC", "bachelor"

    class TypeFormation(models.TextChoices):
        INITIALE = "FI", "Formation Initiale"
        CONTINUE_SOIR = "FTA", "Formation Continue Soir"

    nom = models.CharField(max_length=50)
    filiere = models.ForeignKey(
        Filiere, on_delete=models.CASCADE, related_name="groupes"
    )
    niveau = models.CharField(
        max_length=20, choices=Niveau.choices, default=Niveau.FIRST_YEAR
    )
    type_formation = models.CharField(
        max_length=20, choices=TypeFormation.choices, default=TypeFormation.INITIALE
    )

    class Meta:
        unique_together = ("nom", "filiere")

    def __str__(self):
        return f"{self.nom} - {self.get_type_formation_display()} ({self.filiere.nom})"


class Module(models.Model):
    nom = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True, null=True, blank=True)

    filiere = models.ForeignKey(
        Filiere, on_delete=models.CASCADE, related_name="modules"
    )
    professeur = models.ForeignKey(
        "accounts.Professeur",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="modules",
    )
    semestre = models.IntegerField(default=1)

    class Meta:
        unique_together = ("nom", "filiere")
    def __str__(self):
        prof_name = self.professeur.user.first_name if self.professeur else "—"
        return f"{self.nom} ({self.filiere.nom}) ({prof_name})"



class Salle(models.Model):
    nom = models.CharField(max_length=50, unique=True)
    capacite = models.PositiveIntegerField(default=30)
    latitude = models.FloatField()
    longitude = models.FloatField()
    rayon = models.FloatField(default=20.0, help_text="Le rayn de la salle en metres")

    def __str__(self):
        return self.nom
