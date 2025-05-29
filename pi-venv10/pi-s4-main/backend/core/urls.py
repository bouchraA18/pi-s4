from django.urls import path
from .views import RechercheEtablissements
from .views import autocomplete_localisation
from .views import autocomplete_etablissement

urlpatterns = [
    path('recherche/', RechercheEtablissements.as_view()),
    path('localisation-autocomplete/', autocomplete_localisation, name='autocomplete'),
    path('etablissements-autocomplete/', autocomplete_etablissement , name="etablissements-autocomplete"),
    
]
