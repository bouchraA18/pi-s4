from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from core.models import Utilisateur, Etablissement
from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

class CustomTokenObtainPairSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        try:
            user = Utilisateur.objects.get(email=email)
        except Utilisateur.DoesNotExist:
            raise serializers.ValidationError("Adresse e-mail inconnue.")

        if user.mot_de_passe != password:
            raise serializers.ValidationError("Mot de passe incorrect.")

        # If user is an establishment, check validation flag
        if hasattr(user, 'etablissement') and user.etablissement.validate is not True:
            raise serializers.ValidationError("Votre établissement n'est pas encore validé par l'administration.")

        refresh = RefreshToken.for_user(user)

        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "email": user.email,
            "user_id": user.id,
        }
