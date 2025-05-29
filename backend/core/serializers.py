# apps/ecoles/serializers.py
from rest_framework import serializers
from .models import (
    Etablissement, Photo,
    Formation, EtablissementFormation, Avis
)

class PhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Photo
        fields = ["id", "image", "legend"]

class FormationSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Formation
        fields = ["id", "intitule"]

class EtablissementFormationSerializer(serializers.ModelSerializer):
    formation = FormationSerializer(read_only=True)

    class Meta:
        model  = EtablissementFormation
        fields = ["id", "formation", "autorisation"]

class AvisSerializer(serializers.ModelSerializer):
    utilisateur = serializers.StringRelatedField()

    class Meta:
        model  = Avis
        fields = ["id", "utilisateur", "note", "commentaire", "date"]

class EtablissementSerializer(serializers.ModelSerializer):
    photos      = PhotoSerializer(many=True, read_only=True)
    formations  = EtablissementFormationSerializer(
        source="etablissementformation_set",
        many=True, read_only=True
    )
    avis        = AvisSerializer(many=True, read_only=True)

    class Meta:
        model  = Etablissement
        fields = [
            "id", "nom", "telephone", "date_creation", "valide",
            "niveau", "description", "localisation",
            "photos", "formations", "avis",
            "latitude", "longitude"          # if you keep them on the model
        ]
