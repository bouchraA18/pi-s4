#core/models.py
from django.db import models

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager

class UtilisateurManager(BaseUserManager):
    def create_user(self, email, nom, mot_de_passe=None, **extra_fields):
        if not email:
            raise ValueError("L'adresse e-mail est requise.")
        email = self.normalize_email(email)
        utilisateur = self.model(email=email, nom=nom, **extra_fields)
        utilisateur.set_password(mot_de_passe)
        utilisateur.save(using=self._db)
        return utilisateur

    def create_superuser(self, email, nom, mot_de_passe=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, nom, mot_de_passe, **extra_fields)

class Utilisateur(AbstractBaseUser, PermissionsMixin):
    nom = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UtilisateurManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["nom"]

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
    TYPE_CHOICES = [
        ("publique", "Publique"),
        ("privée",   "Privée"),
    ]

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
    validate      = models.BooleanField(null=True, default=None)
    niveau        = models.CharField(max_length=40, choices=NIVEAU_CHOICES)
    type          = models.CharField(max_length=20, choices=TYPE_CHOICES, default="publique")  # 👈 NEW
    description   = models.TextField()
    site          = models.URLField(blank=True, null=True)
    photo_urls    = models.JSONField(default=list, blank=True)
    localisation  = models.ForeignKey(Localisation, on_delete=models.SET_NULL, null=True)
    formations    = models.ManyToManyField(Formation)
    utilisateur   = models.OneToOneField(Utilisateur, on_delete=models.CASCADE, null=True)
    autorisation  = models.OneToOneField("Fichier", on_delete=models.SET_NULL, null=True, blank=True, related_name="etablissement")

    utilisateur = models.OneToOneField(
        Utilisateur,
        on_delete=models.CASCADE,
        related_name='etablissement',
        null=True,  # Important for initial creation
        blank=True
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
