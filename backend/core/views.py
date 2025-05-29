# core/views.py
from rest_framework.decorators import api_view
from rest_framework.views      import APIView
from rest_framework.response   import Response
from pymongo                   import MongoClient
from bson                      import ObjectId        # NEW
from math import radians, cos, sin, asin, sqrt

# ───────────────────────── helpers ──────────────────────────
def haversine(lon1, lat1, lon2, lat2):
    R = 6371  # km
    lon1, lat1, lon2, lat2 = map(radians, (lon1, lat1, lon2, lat2))
    dlon, dlat = lon2 - lon1, lat2 - lat1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return R * 2 * asin(sqrt(a))

# ───────────────────────── Mongo client ─────────────────────
mongo = MongoClient("mongodb://localhost:27017")
db    = mongo["monprojetdb"]


# ───────────────────────── metadata list ────────────────────
@api_view(["GET"])
def api_metadata(request):
    niveaux = ["pré-scolaire", "primaire", "collège", "lycée", "supérieur"]

    villes = sorted({d.get("ville")
                     for d in db.core_localisation.find({}, {"ville": 1}) if d.get("ville")})

    quartiers = sorted({d.get("quartier")
                        for d in db.core_localisation.find({}, {"quartier": 1}) if d.get("quartier")})

    # formations est un tableau -> on aplatit
    formations = sorted({f
                         for d in db.core_etablissement.find({}, {"formations": 1})
                         for f in d.get("formations", [])})

    return Response({
        "niveaux":     niveaux,
        "villes":      villes,
        "quartiers":   quartiers,
        "formations":  formations,
    })


# ───────────────────────── names list ───────────────────────
@api_view(["GET"])
def api_noms_etablissements(request):
    noms = [
        doc["nom"]
        for doc in db.core_etablissement.find(
            {"validate": True}, {"nom": 1, "_id": 0}
        ).sort("nom", 1)
    ]
    return Response(noms)


# ───────────────────────── search nearby ────────────────────
class RechercheEtablissements(APIView):
    def get(self, request):
        try:
            lat = float(request.GET.get("lat"))
            lon = float(request.GET.get("lon"))
        except (TypeError, ValueError):
            return Response({"error": "Latitude et longitude requises."}, 400)

        niveau_q    = request.GET.get("niveau",     "").lower().strip()
        ville_q     = request.GET.get("ville",      "").lower().strip()
        quartier_q  = request.GET.get("quartier",   "").lower().strip()
        formation_q = request.GET.get("formation",  "").lower().strip()
        nom_q       = request.GET.get("nom",        "").lower().strip()

        results = []
        for etab in db.core_etablissement.find({"validate": True}):
            nom        = etab.get("nom", "")
            niveau     = etab.get("niveau", "")
            formations = [f.lower() for f in etab.get("formations", [])]

            loc_id = etab.get("localisation_id")
            if not loc_id:
                continue
            loc = db.core_localisation.find_one({"_id": loc_id}) or {}
            ville     = loc.get("ville", "")
            quartier  = loc.get("quartier", "")

            # ---------- filtres ----------
            if niveau_q    and niveau_q    not in niveau.lower():         continue
            if ville_q     and ville_q     not in ville.lower():          continue
            if quartier_q  and quartier_q  not in quartier.lower():       continue
            if formation_q and formation_q not in formations:             continue
            if nom_q       and nom_q       not in nom.lower():            continue
            # --------------------------------

            lat2, lon2 = loc.get("latitude"), loc.get("longitude")
            if lat2 is None or lon2 is None:
                continue
            dist = round(haversine(lon, lat, lon2, lat2), 2)

            results.append({
                "id":        str(etab["_id"]),
                "nom":       nom,
                "niveau":    niveau,
                "ville":     ville,
                "quartier":  quartier,
                "latitude":  lat2,
                "longitude": lon2,
                "distance":  dist,
                "formations": etab.get("formations", []),
            })

        results.sort(key=lambda x: x["distance"])
        return Response(results)



# ───────────────────────── NEW: detail endpoint ─────────────


# ─── detail endpoint ─────────────────────────────
@api_view(["GET"])
def api_etablissement_detail(request, etab_id):
    etab = db.core_etablissement.find_one({"_id": ObjectId(etab_id), "validate": True})
    if not etab:
        return Response({"error": "Établissement introuvable."}, status=404)

    loc = db.core_localisation.find_one({"_id": etab.get("localisation_id")}) or {}

    data = {
        "id":         str(etab["_id"]),
        "nom":        etab["nom"],
        "telephone":  etab.get("telephone"),
        "niveau":     etab.get("niveau"),
        "description":etab.get("description"),
        "site":       etab.get("site", ""),
        "ville":      loc.get("ville"),
        "latitude":   loc.get("latitude"),
        "longitude":  loc.get("longitude"),
        "photo_urls": etab.get("photo_urls", []),
        "formations": etab.get("formations", []),
        "avis": [
            {
                "user":        a.get("auteur", "Utilisateur"),
                "note":        a.get("note", 0),
                "commentaire": a.get("commentaire", ""),
                "date":        a.get("date", "")
            }
            for a in db.core_avis.find({"etablissement_id": etab["_id"]})
        ],
    }
    return Response(data)

from datetime import datetime

@api_view(["POST"])
def api_ajouter_avis(request, etab_id):
    try:
        note = float(request.data.get("note"))
        commentaire = request.data.get("commentaire", "").strip()
        if not commentaire:
            return Response({"error": "Commentaire requis."}, status=400)
    except (ValueError, TypeError):
        return Response({"error": "Note invalide."}, status=400)

    etab = db.core_etablissement.find_one({"_id": ObjectId(etab_id)})
    if not etab:
        return Response({"error": "Établissement introuvable."}, status=404)

    db.core_avis.insert_one({
        "etablissement_id": etab["_id"],
        "auteur": "Utilisateur",
        "note": note,
        "commentaire": commentaire,
        "date": datetime.now().isoformat()
    })

    return Response({"success": True})
