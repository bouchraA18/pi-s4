from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Etablissement
import unicodedata
from django.http import JsonResponse
from core.models import Localisation
from django.http import JsonResponse
from .models import Etablissement, Localisation
from rest_framework import status


class RechercheEtablissements(APIView):
    def get(self, request):
        nom = request.GET.get("nom", "").strip().lower()
        niveau = request.GET.get("niveau", "").strip().lower()
        type_query = request.GET.get("type", "").strip().lower()
        localisation_id = request.GET.get("localisation", "").strip()  # ici on garde l'ID, pas de lower()

        if not any([nom, niveau, type_query, localisation_id]):
            return Response({"error": "Veuillez fournir au moins un critère."}, status=status.HTTP_400_BAD_REQUEST)

        etablissements = Etablissement.objects.all()
        results = []

        for e in etablissements:
            if not e.validate:
                continue

            match = True

            if nom and nom not in e.nom.lower():
                match = False
            if niveau and niveau != e.niveau.lower():
                match = False
            if type_query and type_query != e.type.lower():
                match = False
            if localisation_id:
                try:
                    if not e.localisation or str(e.localisation.id) != localisation_id:
                        match = False
                except Exception:
                    match = False

            if match:
                loc = e.localisation
                results.append({
                    "id": e.id,
                    "nom": e.nom,
                    "téléphone": e.téléphone,
                    "date_creation": str(e.date_creation),
                    "validate": e.validate,
                    "niveau": e.niveau,
                    "type": e.type,
                    "localisation": {
                        "id": loc.id if loc else None,
                        "ville": loc.ville if loc else "",
                        "quartier": loc.quartier if loc else "",
                        "latitude": loc.latitude if loc else None,
                        "longitude": loc.longitude if loc else None,
                    }
                })

        if not results:
            return Response({"message": "Aucun établissement trouvé."}, status=status.HTTP_404_NOT_FOUND)

        return Response(results, status=status.HTTP_200_OK)











#    auto-completion ville,quartier

def autocomplete_localisation(request):
    q = request.GET.get('q', '').strip().lower()

    if not q:
        return JsonResponse([], safe=False)

    results = []

    # Cas 1 : "ville, quartier"
    if ',' in q:
        ville_part, quartier_part = map(str.strip, q.split(',', 1))
        matches = Localisation.objects.filter(
            ville__istartswith=ville_part,
            quartier__istartswith=quartier_part
        )[:10]
    else:
        # Cas 2 : recherche uniquement par ville
        matches = Localisation.objects.filter(
            ville__istartswith=q
        )[:10]

    for loc in matches:
        label = f"{loc.ville}, {loc.quartier}" if loc.quartier else loc.ville
        results.append({
            "id": loc.id,
            "label": label
        })

    return JsonResponse(results, safe=False)

    
    
# auto-completion de nom-etablissement
def autocomplete_etablissement(request):
    query = request.GET.get("q", "")
    if query:
        etablissements = Etablissement.objects.filter(
            nom__icontains=query  # ✅ contient, pas commence par
        ).values_list("nom", flat=True).distinct()[:10]
        return JsonResponse(list(etablissements), safe=False)
    return JsonResponse([], safe=False)



