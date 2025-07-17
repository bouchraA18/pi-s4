from django.urls import path
from .views import (
    CustomTokenObtainPairView,
    register_visitor,
    register_establishment,
    list_localisations
)
urlpatterns = [
    path("token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("register/visitor/", register_visitor, name="register_visitor"),
    path("register/establishment/", register_establishment, name="register_establishment"),
    path("localisations/", list_localisations),


]

