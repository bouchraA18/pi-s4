# core/urls.py  – PUT THIS WHOLE FILE IN PLACE

from django.urls import path
from .views import (
    # Visitor & Establishment Auth
    CustomTokenObtainPairView,
    register_visitor,
    register_establishment,
    list_localisations,

    # Admin + Public APIs
    api_metadata,
    api_noms_etablissements,
    public_etablissement_detail,
    RechercheEtablissements,
    manage_etablissement,
    api_avis,
    localisation_autocomplete,
    etablissements_autocomplete,
    admin_list_etablissements,
    admin_approve_etablissement,
    admin_reject_etablissement,
    admin_autorisation,
    current_establishment,
    upload_establishment_photos,
    delete_establishment_photo,
    admin_list_avis,
    admin_delete_avis,
)

urlpatterns = [
    # ─── Authentication ──────────────────────────────────────────────
    path("token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("register/visitor/", register_visitor, name="register_visitor"),
    path("register/establishment/", register_establishment, name="register_establishment"),
    path("localisations/", list_localisations),

    # ─── Search & Metadata ───────────────────────────────────────────
    path("metadata/", api_metadata),
    path("noms/", api_noms_etablissements),
    path("recherche/", RechercheEtablissements.as_view()),
    path("localisation-autocomplete/", localisation_autocomplete),
    path("etablissements-autocomplete/", etablissements_autocomplete),

    path(
        "etablissement/<int:etab_id>/",
        public_etablissement_detail,
        name="public-etablissement-detail",
    ),

    # ─── Establishment owned by the logged-in user (static first) ────
    path(
        "etablissement/current/",
        current_establishment,
        name="current-establishment",
    ),

    # ─── Public / owner CRUD by *numeric* id only  ───────────────────
     path(
        "manage/etablissement/<int:etab_id>/",
        manage_etablissement,
        name="manage-etablissement",
    ),
   path(
    "etablissement/<int:etab_id>/avis/",
    api_avis,                  # ← make sure this matches
    name="etablissement-avis",
),

    path(
        "etablissement/<int:etab_id>/photos/",
        upload_establishment_photos,
        name="upload-photos",
    ),
    path(
        "etablissement/<int:etab_id>/photos/<int:photo_index>/",
        delete_establishment_photo,
        name="delete-photo",
    ),

    path("admin/avis/", admin_list_avis, name="admin-avis-list"),
    path("admin/avis/<int:avis_id>/", admin_delete_avis, name="admin-avis-delete"),

    # ─── Admin Panel ────────────────────────────────────────────────
    path("admin/etablissements/", admin_list_etablissements),
    path("admin/etablissements/<int:id>/approve/", admin_approve_etablissement),
    path("admin/etablissements/<int:id>/reject/", admin_reject_etablissement),
    path("admin/autorisation/<int:file_id>/", admin_autorisation),
    path("admin/etablissements/", admin_list_etablissements, name="admin-etab-list"),
]
