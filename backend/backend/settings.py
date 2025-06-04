"""
Django settings – pure MongoDB / REST-only
"""

from pathlib import Path


REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [],   # no Session / Basic / Token auth
    "UNAUTHENTICATED_USER": None,           # stop importing django.contrib.auth
    "UNAUTHENTICATED_TOKEN": None,
}
BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = "django-insecure-$z5oj9)j#&o%bv@mu1#us8#jj8kgd!2l#b!4l78z0)b9y9euw9"
DEBUG = True
ALLOWED_HOSTS = []

# ───────── Apps ─────────
INSTALLED_APPS = [
    "django.contrib.staticfiles",   # keep static files
    "rest_framework",
    "corsheaders",
    "core",                         # your Mongo endpoints
]

# ───────── Middleware ─────────
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": { "context_processors": [] },
    },
]

WSGI_APPLICATION = "backend.wsgi.application"

# ───────── No SQL DB – dummy backend ─────────
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'monprojetdb',
        'USER': 'mk',
        'PASSWORD': '1234',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# tell Django not to look for migration files
#MIGRATION_MODULES = {"core": None}

# ───────── Internationalisation / etc. ─────────
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ───────── CORS ─────────
CORS_ALLOW_ALL_ORIGINS = True

# ───────── Media (optional) ─────────
MEDIA_URL  = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

