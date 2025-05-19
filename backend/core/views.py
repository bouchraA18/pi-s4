from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Etablissement
import unicodedata

def normalize(text):
    if not text:
        return ""
    return ''.join(
        c for c in unicodedata.normalize('NFD', text)
        if unicodedata.category(c) != 'Mn'
    ).lower().strip()

class RechercheEtablissements(APIView):
    def get(self, request):
        ville_recherchee = normalize(request.GET.get("ville", ""))
        filtre_recherche = normalize(request.GET.get("filtre", ""))

        # ✅ Ignorer si les deux sont vides
        if not ville_recherchee and not filtre_recherche:
            return Response([])

        results = []
        etablissements = Etablissement.objects.all()

        for e in etablissements:
            if not e.validate:
                continue
            try:
                loc = e.localisation
                if not loc:
                    continue
            except:
                continue

            ville_etab = normalize(loc.ville)
            nom_etab = normalize(e.nom)
            niveau_etab = normalize(e.niveau)

            if ville_recherchee in ville_etab and (
                filtre_recherche in nom_etab or filtre_recherche in niveau_etab
            ):
                results.append({
                    'id': e.id,
                    'nom': e.nom,
                    'niveau': e.niveau,
                    'ville': loc.ville,
                    'latitude': loc.latitude,
                    'longitude': loc.longitude,
                })

        return Response(results)
