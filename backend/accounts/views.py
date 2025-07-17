from core.models import Etablissement, Localisation, Fichier
from rest_framework.views       import APIView
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.utils import timezone

from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer



@api_view(['POST'])
def register_visitor(request):
    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response({"error": "Email et mot de passe requis."}, status=400)

    if User.objects.filter(email=email).exists():
        return Response({"error": "Email déjà utilisé."}, status=400)

    user = User.objects.create_user(username=email, email=email, password=password)
    return Response({"message": "Inscription visiteur réussie."}, status=201)




from core.models import Utilisateur, Etablissement, Localisation, Fichier

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def register_establishment(request):
    email           = request.data.get("email")
    password        = request.data.get("password")
    nom             = request.data.get("nom")
    telephone       = request.data.get("telephone")
    niveau          = request.data.get("niveau")
    localisation_id = request.data.get("localisation_id")
    description     = request.data.get("description", "")
    site            = request.data.get("site", "")
    autorisation_file = request.FILES.get("autorisation")

    # Basic validation
    if not all([email, password, nom, telephone, niveau, localisation_id, autorisation_file]):
        return Response({"error": "Tous les champs sont requis."}, status=400)

    if Utilisateur.objects.filter(email=email).exists():
        return Response({"error": "Cet email est déjà utilisé."}, status=400)

    try:
        # create user
        utilisateur = Utilisateur.objects.create(
            nom=nom,
            email=email,
            mot_de_passe=password  # You should hash this later for production!
        )

        # store autorisation file as BLOB
        fichier = Fichier.objects.create(
            autorisation=autorisation_file.read(),
            mime_type=autorisation_file.content_type
        )

        localisation = Localisation.objects.get(id=localisation_id)

        etab = Etablissement.objects.create(
            nom=nom,
            telephone=telephone,
            niveau=niveau,
            date_creation=timezone.now().date(),
            validate=None,
            utilisateur=utilisateur,
            localisation=localisation,
            autorisation=fichier,
            description=description,
            site=site
        )

        return Response({"message": "Demande envoyée. En attente de validation."}, status=201)

    except Exception as e:
        print(e)
        if 'utilisateur' in locals():
            utilisateur.delete()
        return Response({"error": "Erreur lors de la création de l’établissement."}, status=500)


@api_view(["GET"])
def list_localisations(request):
    from core.serializers import LocalisationSerializer
    all = Localisation.objects.all().order_by("ville", "quartier")
    return Response(LocalisationSerializer(all, many=True).data)
