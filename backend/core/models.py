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


class Etablissement(models.Model):
    NIVEAU_CHOICES = [
        ("primaire",  "Primaire"),
        ("secondaire","Secondaire"),
        ("supérieur", "Supérieur"),
        ("lycée",     "Lycée"),
        ("formation professionnelle", "Formation professionnelle"),
    ]

    nom           = models.CharField(max_length=255)
    telephone     = models.CharField(max_length=20)
    date_creation = models.DateField()

    # ─── approval flag ──────────────────────────────────────
    # None   → en attente
    # True   → approuvé
    # False  → rejeté
    validate      = models.BooleanField(null=True, default=None)

    niveau        = models.CharField(max_length=40, choices=NIVEAU_CHOICES)
    description   = models.TextField()
    site          = models.URLField(blank=True, null=True)
    photo_urls    = models.JSONField(default=list, blank=True)

    localisation  = models.ForeignKey(Localisation, on_delete=models.SET_NULL, null=True)
    formations    = models.ManyToManyField(Formation)

    # NEW: one authorisation file per établissement
    autorisation  = models.OneToOneField(
        "Fichier",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="etablissement",
    )

    def __str__(self):
        return self.nom


class Fichier(models.Model):
    """Generic binary file: photo OR PDF autorisation"""
    # keep existing blobs
    photo         = models.BinaryField(blank=True, null=True)
    autorisation  = models.BinaryField(blank=True, null=True)

    # NEW: store MIME for easy preview (optional but handy)
    mime_type     = models.CharField(max_length=60, blank=True)

    def __str__(self):
        return f"Fichier {self.id}"
    
    
class Avis(models.Model):
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE)
    etablissement = models.ForeignKey(Etablissement, on_delete=models.CASCADE)
    note = models.PositiveIntegerField()
    commentaire = models.TextField(blank=True, null=True)
    date = models.DateTimeField()

    def __str__(self):
        return f"{self.utilisateur.nom} > {self.etablissement.nom} ({self.note}/5)"
