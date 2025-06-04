
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
    localisation = LocalisationSerializer(read_only=True)
    formations = FormationSerializer(many=True, read_only=True)

    class Meta:
        model = Etablissement
        fields = '__all__'


class AvisSerializer(serializers.ModelSerializer):
    utilisateur = UtilisateurSerializer(read_only=True)
    etablissement = EtablissementSerializer(read_only=True)

    class Meta:
        model = Avis
        fields = '__all__'
