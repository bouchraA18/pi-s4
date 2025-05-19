from django.urls import path
from .views import RechercheEtablissements

urlpatterns = [
    path('recherche/', RechercheEtablissements.as_view()),
    
]
