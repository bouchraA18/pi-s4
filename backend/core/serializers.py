
from rest_framework import serializers
from .models import Utilisateur, Localisation, Formation, Fichier, Etablissement, Avis

class UtilisateurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = '__all__'


class LocalisationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Localisation
        fields = '__all__'


class FormationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Formation
        fields = '__all__'


class FichierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fichier
        fields = '__all__'


class EtablissementSerializer(serializers.ModelSerializer):
    # handy extras for the admin table
    ville            = serializers.CharField(source="localisation.ville",     read_only=True)
    quartier         = serializers.CharField(source="localisation.quartier",  read_only=True)

    # NEW → sends the <int> ID the front-end calls /admin/autorisation/<id>/
    autorisation_id  = serializers.IntegerField(source="autorisation.id",     read_only=True)

    class Meta:
        model  = Etablissement
        fields = [
            "id", "nom", "telephone",
            "niveau", "description",
            "validate",
            "ville", "quartier",
            "autorisation_id",
        ]


class AvisSerializer(serializers.ModelSerializer):
    utilisateur = UtilisateurSerializer(read_only=True)
    etablissement = EtablissementSerializer(read_only=True)

    class Meta:
        model = Avis
        fields = '__all__'
