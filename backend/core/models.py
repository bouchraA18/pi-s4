from django.db import models

class Utilisateur(models.Model):
    nom = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    mot_de_passe = models.CharField(max_length=100)

    def __str__(self):
        return self.nom

class Localisation(models.Model):
    ville = models.CharField(max_length=100)
    longitude = models.FloatField()
    latitude = models.FloatField()

    def __str__(self):
        return self.ville

class Etablissement(models.Model):
    nom = models.CharField(max_length=100)
    téléphone = models.CharField(max_length=20)
    date_creation = models.DateField()
    validate = models.BooleanField(default=False)
    niveau = models.CharField(max_length=50)
    localisation = models.ForeignKey(Localisation, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return self.nom

class Avis(models.Model):
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE)
    etablissement = models.ForeignKey(Etablissement, on_delete=models.CASCADE)
    note = models.IntegerField()
    commentaire = models.TextField()

    def __str__(self):
        return f"Avis de {self.utilisateur.nom} - Note: {self.note}"

class Formation(models.Model):
    etablissement = models.ForeignKey(Etablissement, on_delete=models.CASCADE)
    autorisation = models.BinaryField()

    def __str__(self):
        return f"Formation - {self.etablissement.nom}"

class Fichier(models.Model):
    etablissement = models.ForeignKey(Etablissement, on_delete=models.CASCADE)
    photo = models.BinaryField()
    autorisation = models.BinaryField()

    def __str__(self):
        return f"Fichier - {self.etablissement.nom}"
