from django.urls import path, include

urlpatterns = [
    # Admin route removed – no admin app installed
    path("api/", include("core.urls")),
]
