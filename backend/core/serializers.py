from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from core.models import Utilisateur, Localisation, Formation, Fichier, Etablissement, Avis


# ─────────────── USER AUTHENTICATION ────────────────

class CustomTokenObtainPairSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        try:
            user = Utilisateur.objects.get(email=email)
        except Utilisateur.DoesNotExist:
            raise serializers.ValidationError({
                "status": "invalid_credentials",
                "message": "Aucun compte trouvé avec cet e-mail."
            })

        if not user.check_password(password):
            raise serializers.ValidationError({
                "status": "invalid_credentials",
                "message": "Mot de passe incorrect."
            })

        # Check if user is an establishment and is not approved
        if hasattr(user, 'etablissement') and user.etablissement.validate is not True:
            raise serializers.ValidationError({
                "status": "pending_approval",
                "message": "Votre établissement est en attente de validation par l'administration."
            })

        refresh = RefreshToken.for_user(user)

        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "email": user.email,
            "user_id": user.id,
            "role": (
                "admin" if user.is_staff else
                "etablissement" if hasattr(user, "etablissement") else
                "visiteur"
            ),
            "is_staff": user.is_staff  
        }




    


# ─────────────── CORE SERIALIZERS ────────────────

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


# core/serializers.py
class EtablissementSerializer(serializers.ModelSerializer):
    localisation_id = serializers.PrimaryKeyRelatedField(
        source="localisation",
        queryset=Localisation.objects.all(),
        write_only=True,
        required=False,
    )
    formations = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Formation.objects.all(),
        write_only=True,
        required=False,
    )

    class Meta:
        model  = Etablissement
        fields = [
            "id", "nom", "type", "telephone", "niveau",
            "description", "site", "photo_urls",
            "localisation_id",          # write-only FK
            "ville", "quartier",        # read-only extras
            "formations",               # write-only M2M
            "validate",
        ]
        read_only_fields = ("validate", "ville", "quartier")

    # read-only localisation extras
    ville    = serializers.CharField(source="localisation.ville", read_only=True)
    quartier = serializers.CharField(source="localisation.quartier", read_only=True)

    def update(self, instance, validated_data):
        # handle FK update
        if "localisation" in validated_data:
            instance.localisation = validated_data.pop("localisation")

        # handle M2M update
        if "formations" in validated_data:
            formations = validated_data.pop("formations")
            instance.formations.set(formations)

        return super().update(instance, validated_data)


class AvisSerializer(serializers.ModelSerializer):
    utilisateur = UtilisateurSerializer(read_only=True)
    etablissement = EtablissementSerializer(read_only=True)

    class Meta:
        model = Avis
        fields = '__all__'
