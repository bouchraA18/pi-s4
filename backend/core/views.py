# core/views.py
from datetime import datetime
from math import radians, cos, sin, asin, sqrt

from rest_framework.decorators import api_view
from rest_framework.response    import Response
from rest_framework.views       import APIView

from .models import (
    Etablissement,
    Localisation,
    Formation,
    Avis,
    Utilisateur,
)
from .serializers import EtablissementSerializer


# ───────────────────────── helpers ──────────────────────────
def haversine(lon1, lat1, lon2, lat2):
    R = 6371
    lon1, lat1, lon2, lat2 = map(radians, (lon1, lat1, lon2, lat2))
    dlon, dlat = lon2 - lon1, lat2 - lat1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return R * 2 * asin(sqrt(a))


# ───────────────────────── metadata list ────────────────────
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


# ───────────────────────── names list ───────────────────────
@api_view(["GET"])
def api_noms_etablissements(request):
    noms = (
        Etablissement.objects
        .filter(validate=True)
        .order_by("nom")
        .values_list("nom", flat=True)
    )
    return Response(list(noms))


# ───────────────────────── search nearby ────────────────────
class RechercheEtablissements(APIView):
    def get(self, request):
        # ① coords required
        try:
            lat = float(request.GET.get("lat"))
            lon = float(request.GET.get("lon"))
        except (TypeError, ValueError):
            return Response({"error": "Latitude et longitude requises."}, status=400)

        # ② textual filters
        niveau_q    = request.GET.get("niveau",     "").lower().strip()
        ville_q     = request.GET.get("ville",      "").lower().strip()
        quartier_q  = request.GET.get("quartier",   "").lower().strip()
        formation_q = request.GET.get("formation",  "").lower().strip()
        nom_q       = request.GET.get("nom",        "").lower().strip()

        # ③ base queryset → only approved
        qs = (
            Etablissement.objects
            .filter(validate=True)
            .select_related("localisation")
            .prefetch_related("formations")
        )

        # ④ apply filters
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

        # ⑤ build response with distances
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
                "ville":      loc.ville,
                "quartier":   loc.quartier,
                "latitude":   loc.latitude,
                "longitude":  loc.longitude,
                "distance":   dist,
                "formations": [f.intitule for f in etab.formations.all()],
            })

        results.sort(key=lambda x: x["distance"])
        return Response(results)


# ───────────────────────── add review ───────────────────────
@api_view(["POST"])
def api_ajouter_avis(request, etab_id):
    try:
        note = float(request.data.get("note"))
        commentaire = request.data.get("commentaire", "").strip()
        if not commentaire:
            return Response({"error": "Commentaire requis."}, status=400)
    except (TypeError, ValueError):
        return Response({"error": "Note invalide."}, status=400)

    try:
        etab = Etablissement.objects.get(id=etab_id, validate=True)
    except Etablissement.DoesNotExist:
        return Response({"error": "Établissement introuvable."}, status=404)

    user, _ = Utilisateur.objects.get_or_create(
        email="anon@example.com",
        defaults={"nom": "Visiteur"}
    )

    Avis.objects.create(
        utilisateur=user,
        etablissement=etab,
        note=note,
        commentaire=commentaire,
        date=datetime.now(),
    )
    return Response({"success": True})


# ───────────────────────── localisation autocomplete ────────
@api_view(["GET"])
def localisation_autocomplete(request):
    q = request.GET.get("q", "")
    results = []
    if q:
        qs = Localisation.objects.filter(ville__icontains=q) | Localisation.objects.filter(quartier__icontains=q)
        results = [{"id": loc.id, "label": f"{loc.ville}, {loc.quartier}"} for loc in qs]
    return Response(results)


# ───────────────────────── établissement autocomplete ───────
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


# ───────────────────────── admin list / approve / reject ────
@api_view(["GET"])
def admin_list_etablissements(request):
    status = request.GET.get("status", "pending")
    if status == "approved":
        qs = Etablissement.objects.filter(validate=True)
    elif status == "rejected":
        qs = Etablissement.objects.filter(validate=False)
    else:
        qs = Etablissement.objects.filter(validate__isnull=True)

    return Response(EtablissementSerializer(qs, many=True).data)


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
def api_etablissement_detail(request, etab_id):
    try:
        etab = (
            Etablissement.objects
            .select_related("localisation")
            .prefetch_related("formations", "avis_set__utilisateur")
            .get(id=etab_id, validate=True)
        )
    except Etablissement.DoesNotExist:
        return Response({"error": "Établissement introuvable."}, status=404)

    loc = etab.localisation
    data = {
        "id":          etab.id,
        "nom":         etab.nom,
        "telephone":   etab.telephone,
        "niveau":      etab.niveau,
        "description": etab.description,
        "site":        etab.site or "",
        "ville":       loc.ville if loc else "",
        "latitude":    loc.latitude if loc else None,
        "longitude":   loc.longitude if loc else None,
        "photo_urls":  etab.photo_urls,
        "formations":  [f.intitule for f in etab.formations.all()],
        "avis": [
            {
                "user":  a.utilisateur.nom,
                "note":  a.note,
                "commentaire": a.commentaire,
                "date":  a.date.isoformat(),
            }
            for a in etab.avis_set.all()
        ],
    }
    return Response(data)