from datetime import datetime, timezone
from math import radians, cos, sin, asin, sqrt
import base64

from rest_framework.views import APIView
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import (
    EtablissementSerializer,
    LocalisationSerializer,
    CustomTokenObtainPairSerializer, 
    
)

from .models import (
    Etablissement,
    Localisation,
    Formation,
    Avis,
    Utilisateur,
    Fichier
)




# ───────────────────────── JWT login ─────────────────────────
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


# ───────────────────────── Visitor Registration ─────────────
from django.utils import timezone
@api_view(['POST'])
def register_visitor(request):
    email = request.data.get("email")
    password = request.data.get("password")
    nom = request.data.get("nom", "Visiteur")  # use default if none provided

    if not email or not password:
        return Response({"error": "Email et mot de passe requis."}, status=400)

    if Utilisateur.objects.filter(email=email).exists():
        return Response({"error": "Email déjà utilisé."}, status=400)

    Utilisateur.objects.create_user(email=email, nom=nom, mot_de_passe=password)

    return Response({"message": "Inscription visiteur réussie."}, status=201)


# ───────────────────────── Establishment Registration ───────
@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def register_establishment(request):
    # ── required fields ─────────────────────────────────────────────
    email           = request.data.get("email")
    password        = request.data.get("password")
    nom             = request.data.get("nom")
    telephone       = request.data.get("telephone")
    niveau          = request.data.get("niveau")
    localisation_id = request.data.get("localisation_id")
    autorisation_file = request.FILES.get("autorisation")

    # ── optional fields ─────────────────────────────────────────────
    description = request.data.get("description", "")
    site        = request.data.get("site", "")
    etab_type   = request.data.get("type", "publique")   # must match model

    # ── basic validation ───────────────────────────────────────────
    if not all([email, password, nom, telephone, niveau, localisation_id, autorisation_file]):
        return Response({"error": "Tous les champs sont requis."}, status=400)

    email = email.strip().lower()
    if Utilisateur.objects.filter(email=email).exists():
        return Response({"error": "Cet email est déjà utilisé."}, status=400)

    try:
        # 1) create user (no hashing, original keyword)
        utilisateur = Utilisateur.objects.create_user(
            email=email,
            nom=nom,
            mot_de_passe=password,   # ← back to original style
        )

        # 2) save the authorisation file
        fichier = Fichier.objects.create(
            autorisation=autorisation_file.read(),
            mime_type=autorisation_file.content_type,
        )

        # 3) localisation FK
        localisation = Localisation.objects.get(id=localisation_id)

        # 4) establishment record
        Etablissement.objects.create(
            nom=nom,
            telephone=telephone,
            niveau=niveau,
            type=etab_type,
            description=description,
            site=site,
            date_creation=timezone.now().date(),
            validate=None,
            utilisateur=utilisateur,
            localisation=localisation,
            autorisation=fichier,
        )

        return Response(
            {"message": "Demande envoyée. En attente de validation."},
            status=201,
        )

    except Exception as e:
        if "utilisateur" in locals():
            utilisateur.delete()
        print(e)
        return Response(
            {"error": "Erreur lors de la création de l’établissement."},
            status=500,
        )

# ───────────────────────── Localisation List ────────────────
@api_view(["GET"])
def list_localisations(request):
    all = Localisation.objects.all().order_by("ville", "quartier")
    return Response(LocalisationSerializer(all, many=True).data)


# ───────────────────────── Metadata for filters ─────────────
@api_view(["GET"])
def api_metadata(request):
    niveaux = ["pré-scolaire", "primaire", "collège", "lycée", "supérieur"]

    villes = (
        Localisation.objects
        .exclude(ville__isnull=True)
        .values_list("ville", flat=True)
        .distinct()
        .order_by("ville")
    )

    quartiers = (
        Localisation.objects
        .exclude(quartier__isnull=True)
        .values_list("quartier", flat=True)
        .distinct()
        .order_by("quartier")
    )

    formations = (
        Formation.objects
        .values_list("intitule", flat=True)
        .distinct()
        .order_by("intitule")
    )

    return Response({
        "niveaux":     niveaux,
        "villes":      list(villes),
        "quartiers":   list(quartiers),
        "formations":  list(formations),
    })


@api_view(["GET"])
def api_noms_etablissements(request):
    noms = (
        Etablissement.objects
        .filter(validate=True)
        .order_by("nom")
        .values_list("nom", flat=True)
    )
    return Response(list(noms))


# ───────────────────────── Search Nearby ─────────────────────
# ───────────────────────── Search Nearby ─────────────────────
def haversine(lon1, lat1, lon2, lat2):
    R = 6371
    lon1, lat1, lon2, lat2 = map(radians, (lon1, lat1, lon2, lat2))
    dlon, dlat = lon2 - lon1, lat2 - lat1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return R * 2 * asin(sqrt(a))


class RechercheEtablissements(APIView):
    def get(self, request):
        # ---------------- mandatory coords -----------------
        try:
            lat = float(request.GET.get("lat"))
            lon = float(request.GET.get("lon"))
        except (TypeError, ValueError):
            return Response(
                {"error": "Latitude et longitude requises."},
                status=400,
            )

        # ---------------- query-string filters --------------
        niveau_q    = request.GET.get("niveau",     "").lower().strip()
        ville_q     = request.GET.get("ville",      "").lower().strip()
        quartier_q  = request.GET.get("quartier",   "").lower().strip()
        formation_q = request.GET.get("formation",  "").lower().strip()
        nom_q       = request.GET.get("nom",        "").lower().strip()
        type_q      = request.GET.get("type",       "").lower().strip()   # ← NEW

        qs = (
            Etablissement.objects
            .filter(validate=True)
            .select_related("localisation")
            .prefetch_related("formations")
        )

        if niveau_q:
            qs = qs.filter(niveau__icontains=niveau_q)
        if nom_q:
            qs = qs.filter(nom__icontains=nom_q)
        if ville_q or quartier_q:
            qs = qs.filter(localisation__isnull=False)
            if ville_q:
                qs = qs.filter(localisation__ville__icontains=ville_q)
            if quartier_q:
                qs = qs.filter(localisation__quartier__icontains=quartier_q)
        if formation_q:
            qs = qs.filter(formations__intitule__icontains=formation_q)

        # -------------- NEW: filter by “publique / privée” --
        if type_q:
            if type_q in ("privee", "privée"):
                type_q = "privée"                 # normalise spelling
            qs = qs.filter(type__iexact=type_q)
        # ----------------------------------------------------

        results = []
        for etab in qs:
            loc = etab.localisation
            if not loc or loc.latitude is None or loc.longitude is None:
                continue
            dist = round(haversine(lon, lat, loc.longitude, loc.latitude), 2)
            results.append({
                "id":         etab.id,
                "nom":        etab.nom,
                "niveau":     etab.niveau,
                "type":       etab.type,          # included for cards/map
                "ville":      loc.ville,
                "quartier":   loc.quartier,
                "latitude":   loc.latitude,
                "longitude":  loc.longitude,
                "distance":   dist,
                "formations": [f.intitule for f in etab.formations.all()],
            })

        results.sort(key=lambda x: x["distance"])
        return Response(results)


# ───────────────────────── Reviews ──────────────────────────
# core/views.py
from rest_framework.decorators import (
    api_view, authentication_classes, permission_classes
)
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from datetime import datetime

@api_view(["GET", "POST"])
@authentication_classes([JWTAuthentication])   # enables request.user
@permission_classes([AllowAny])                # default, we’ll check POST manually
def api_avis(request, etab_id):
    """
    GET  /api/etablissement/<id>/avis/   → list of avis (public)
    POST /api/etablissement/<id>/avis/   → add new avis (auth required)
    """
    # ---------- locate the establishment ----------
    try:
        etab = Etablissement.objects.get(id=etab_id, validate=True)
    except Etablissement.DoesNotExist:
        return Response({"error": "Établissement introuvable."}, status=404)

    # ---------- GET : return serialized list ----------
    if request.method == "GET":
        avis_data = [
            {
                "id":  a.id,
                "utilisateur": {"nom": a.utilisateur.nom},
                "note": a.note,
                "commentaire": a.commentaire,
                "date": a.date,
            }
            for a in etab.avis_set.order_by("-date")
        ]
        return Response(avis_data)

    # ---------- POST : create a new review ----------
    # Require authentication
    if not request.user or not request.user.is_authenticated:
        return Response({"error": "Authentification requise."}, status=401)

    # Validate note
    try:
        note = float(request.data.get("note"))
        if note < 1 or note > 5:
            raise ValueError
    except (TypeError, ValueError):
        return Response({"error": "Note invalide (1-5)."}, status=400)

    commentaire = request.data.get("commentaire", "").strip()
    display_name = request.data.get("nom", "").strip()

    # Optionally update the user’s display name
    if display_name and request.user.nom != display_name:
        request.user.nom = display_name
        request.user.save(update_fields=["nom"])

    Avis.objects.create(
        utilisateur=request.user,
        etablissement=etab,
        note=note,
        commentaire=commentaire,
        date=datetime.now(),
    )
    return Response({"success": True}, status=201)



# ───────────────────────── Autocomplete ─────────────────────
@api_view(["GET"])
def localisation_autocomplete(request):
    q = request.GET.get("q", "")
    results = []
    if q:
        qs = Localisation.objects.filter(ville__icontains=q) | Localisation.objects.filter(quartier__icontains=q)
        results = [{"id": loc.id, "label": f"{loc.ville}, {loc.quartier}"} for loc in qs]
    return Response(results)


@api_view(["GET"])
def etablissements_autocomplete(request):
    q = request.GET.get("q", "")
    if q:
        noms = (
            Etablissement.objects
            .filter(nom__icontains=q, validate=True)
            .values_list("nom", flat=True)[:8]
        )
        return Response(list(noms))
    return Response([])


# ───────────────────────── Admin: CRUD ──────────────────────
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAdminUser])       # staff / superuser only
def admin_list_etablissements(request):
    """
    GET /api/admin/etablissements/?status=pending|approved|rejected
    """
    status = request.query_params.get("status", "pending")
    qs = Etablissement.objects.select_related("localisation")

    if status == "approved":
        qs = qs.filter(validate=True)
    elif status == "rejected":
        qs = qs.filter(validate=False)
    else:                       # pending
        qs = qs.filter(validate__isnull=True)

    data = []
    for e in qs.order_by("-date_creation"):
        loc = e.localisation
        data.append({
            "id":            e.id,
            "nom":           e.nom,
            "ville":         loc.ville if loc else "",
            "niveau":        e.niveau,
            "type":          e.type,
            "telephone":     e.telephone,
            "site":          e.site,
            "description":   e.description or "",
            "validate":      e.validate,          # True / False / None
            "autorisation_id": e.autorisation_id,
        })
    return Response(data)

@api_view(["PUT"])
def admin_approve_etablissement(request, id):
    if Etablissement.objects.filter(id=id).update(validate=True) == 1:
        return Response({"success": True})
    return Response({"error": "Établissement introuvable."}, status=404)


@api_view(["PUT"])
def admin_reject_etablissement(request, id):
    if Etablissement.objects.filter(id=id).update(validate=False) == 1:
        return Response({"success": True})
    return Response({"error": "Établissement introuvable."}, status=404)


@api_view(["GET"])
def public_etablissement_detail(request, etab_id):
    try:
        etab = (
            Etablissement.objects
            .select_related("localisation")
            .prefetch_related("formations", "avis_set__utilisateur")
            .get(id=etab_id, validate=True)
        )
    except Etablissement.DoesNotExist:
        return Response({"error": "Établissement introuvable."}, status=404)

    data = {
        "id": etab.id,
        "nom": etab.nom,
        "telephone": etab.telephone,
        "niveau": etab.niveau,
        "type": etab.type,  # Make sure to include type
        "description": etab.description,
        "site": etab.site or "",
        "ville": etab.localisation.ville if etab.localisation else "",
        "quartier": etab.localisation.quartier if etab.localisation else "",
        "latitude": etab.localisation.latitude if etab.localisation else None,
        "longitude": etab.localisation.longitude if etab.localisation else None,
        "photo_urls": etab.photo_urls,
        "formations": [f.intitule for f in etab.formations.all()],
        "avis": [
            {
                "user": a.utilisateur.nom,
                "note": a.note,
                "commentaire": a.commentaire,
                "date": a.date.isoformat(),
            }
            for a in etab.avis_set.all()
        ],
    }
    return Response(data)



@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAdminUser])
def admin_autorisation(request, file_id):
    try:
        f = Fichier.objects.get(id=file_id)
    except Fichier.DoesNotExist:
        return Response({"data": ""})   # nothing
    mime = f.mime_type or "application/octet-stream"
    data_uri = f"data:{mime};base64,{base64.b64encode(f.autorisation).decode()}"
    return Response({"data": data_uri})

# Add to core/views.py
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from django.core.files.storage import default_storage
from django.conf import settings
import os
from datetime import datetime
from .models import Etablissement
from .serializers import EtablissementSerializer
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.response import Response


# core/views.py
@api_view(["GET"])
@authentication_classes([JWTAuthentication])   # make sure JWT runs
@permission_classes([IsAuthenticated])         # 401 if not logged in
def current_establishment(request):
    """
    Return the establishment owned by the authenticated user.
    """
    # DRF guarantees we have an authenticated user here
    etab = getattr(request.user, "etablissement", None)
    if etab is None:
        return Response(
            {"error": "No establishment associated with this user"},
            status=404,
        )

    return Response(EtablissementSerializer(etab).data)


# Add this to your views.py
@api_view(["GET", "PUT"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def manage_etablissement(request, etab_id):          # ← match the URL
    try:
        etab = Etablissement.objects.get(id=etab_id, utilisateur=request.user)
    except Etablissement.DoesNotExist:
        return Response({"error": "Not found or not authorized"}, status=404)

    if request.method == "GET":
        serializer = EtablissementSerializer(etab)
        return Response(serializer.data)
    
    elif request.method == "PUT":
        serializer = EtablissementSerializer(etab, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    

@api_view(["POST"])
@parser_classes([MultiPartParser])
def upload_establishment_photos(request, etab_id):
    """
    Upload photos for a specific establishment.
    """
    try:
        etab = Etablissement.objects.get(id=etab_id, utilisateur=request.user)
    except Etablissement.DoesNotExist:
        return Response({"error": "Establishment not found or not owned by user"}, status=404)

    photos = request.FILES.getlist('photos')
    if not photos:
        return Response({"error": "No photos provided"}, status=400)

    photo_urls = etab.photo_urls or []
    
    for photo in photos:
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        filename = f"etab_{etab_id}_{timestamp}_{photo.name}"
        
        # Save file to media storage
        filepath = os.path.join('etablissements', filename)
        saved_path = default_storage.save(filepath, photo)
        
        # Construct URL (adjust based on your setup)
        photo_url = f"{settings.MEDIA_URL}{saved_path}"
        photo_urls.append(photo_url)

    etab.photo_urls = photo_urls
    etab.save()
    
    return Response({
        "message": f"{len(photos)} photos uploaded successfully",
        "photos": photo_urls
    })

@api_view(["DELETE"])
def delete_establishment_photo(request, etab_id, photo_index):
    """
    Delete a specific photo from an establishment's photo collection.
    """
    try:
        etab = Etablissement.objects.get(id=etab_id, utilisateur=request.user)
    except Etablissement.DoesNotExist:
        return Response({"error": "Establishment not found or not owned by user"}, status=404)

    if not etab.photo_urls:
        return Response({"error": "No photos exist for this establishment"}, status=404)
    
    try:
        photo_index = int(photo_index)
        photo_url = etab.photo_urls[photo_index]
    except (ValueError, IndexError):
        return Response({"error": "Invalid photo index"}, status=400)

    # Extract the relative path from the URL
    relative_path = photo_url.replace(settings.MEDIA_URL, '')
    
    # Delete the physical file
    if default_storage.exists(relative_path):
        default_storage.delete(relative_path)
    
    # Remove from the array
    updated_photos = [p for i, p in enumerate(etab.photo_urls) if i != photo_index]
    etab.photo_urls = updated_photos
    etab.save()
    
    return Response({
        "message": "Photo deleted successfully",
        "remaining_photos": updated_photos
    })


# core/views.py  – admin review management
from rest_framework.decorators import (
    api_view, authentication_classes, permission_classes
)
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from .models import Avis   # and Etablissement / Utilisateur if not already imported


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAdminUser])          # ← only staff/superusers
def admin_list_avis(request):
    """
    GET /api/admin/avis/    → list of all reviews (latest first)
    """
    avis_qs = Avis.objects.select_related(
        "utilisateur", "etablissement"
    ).order_by("-date")

    data = [
        {
            "id":   a.id,
            "note": a.note,
            "commentaire": a.commentaire or "",
            "date": a.date,
            "utilisateur": {
                "id":  a.utilisateur_id,
                "nom": a.utilisateur.nom,
            },
            "etablissement": {
                "id":  a.etablissement_id,
                "nom": a.etablissement.nom if a.etablissement_id else None,
            },
        }
        for a in avis_qs
    ]
    return Response(data)


@api_view(["DELETE"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAdminUser])          # ← only staff/superusers
def admin_delete_avis(request, avis_id):
    """
    DELETE /api/admin/avis/<id>/   → hard-delete a review
    """
    deleted, _ = Avis.objects.filter(id=avis_id).delete()
    if deleted == 0:
        return Response({"error": "Avis introuvable."}, status=404)
    return Response({"success": True})
