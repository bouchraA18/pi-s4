
from django.db import models

class Utilisateur(models.Model):
    nom = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    mot_de_passe = models.CharField(max_length=255)

    def __str__(self):
        return self.nom


class Localisation(models.Model):
    ville = models.CharField(max_length=100)
    quartier = models.CharField(max_length=100)
    latitude = models.FloatField()
    longitude = models.FloatField()

    def __str__(self):
        return f"{self.ville}, {self.quartier}"


class Formation(models.Model):
    intitule = models.CharField(max_length=150)
    autorisation = models.BinaryField(blank=True, null=True)

    def __str__(self):
        return self.intitule


class Fichier(models.Model):
    photo = models.BinaryField()
    autorisation = models.BinaryField(blank=True, null=True)


class Etablissement(models.Model):
    NIVEAU_CHOICES = [
        ('primaire', 'Primaire'),
        ('secondaire', 'Secondaire'),
        ('supérieur', 'Supérieur'),
        ('lycée', 'Lycée'),
        ('formation professionnelle', 'Formation professionnelle'),
    ]

    nom = models.CharField(max_length=255)
    telephone = models.CharField(max_length=20)
    date_creation = models.DateField()
    validate = models.BooleanField(default=True)
    niveau = models.CharField(max_length=40, choices=NIVEAU_CHOICES)
    description = models.TextField()
    site = models.URLField(blank=True, null=True)
    photo_urls = models.JSONField(default=list, blank=True)

    localisation = models.ForeignKey(Localisation, on_delete=models.SET_NULL, null=True)
    formations = models.ManyToManyField(Formation)

    def __str__(self):
        return self.nom


class Avis(models.Model):
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE)
    etablissement = models.ForeignKey(Etablissement, on_delete=models.CASCADE)
    note = models.PositiveIntegerField()
    commentaire = models.TextField(blank=True, null=True)
    date = models.DateTimeField()

    def __str__(self):
        return f"{self.utilisateur.nom} > {self.etablissement.nom} ({self.note}/5)"
