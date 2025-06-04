# core/urls.py
from django.urls import path
from .views import api_ajouter_avis
from .views import localisation_autocomplete
from .views import etablissements_autocomplete
from .views import (
    api_metadata, api_noms_etablissements,
    RechercheEtablissements, api_etablissement_detail   # ← import
)

urlpatterns = [
    path("metadata/",        api_metadata),
    path("noms/",            api_noms_etablissements),
    path("recherche/",       RechercheEtablissements.as_view()),
    path("etablissement/<str:etab_id>/", api_etablissement_detail),   # ← new line
    path("etablissement/<str:etab_id>/avis/", api_ajouter_avis),
    path("localisation-autocomplete/", localisation_autocomplete),
    path("etablissements-autocomplete/", etablissements_autocomplete),
]
