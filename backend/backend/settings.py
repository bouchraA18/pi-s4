"""
Django settings – pure MongoDB / REST-only
"""

from pathlib import Path


REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "UNAUTHENTICATED_USER": None,
    "UNAUTHENTICATED_TOKEN": None,
}

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = "django-insecure-$z5oj9)j#&o%bv@mu1#us8#jj8kgd!2l#b!4l78z0)b9y9euw9"
DEBUG = True
ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "testserver",   # ← add this line
]
INSTALLED_APPS = [
    'django.contrib.admin',            
    'django.contrib.auth',
    'django.contrib.contenttypes',     
    'django.contrib.sessions',         
    'django.contrib.messages',         
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'core',
]

# ───────── Middleware ─────────
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",              # ✅ REQUIRED
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",                         # ✅ RECOMMENDED
    "django.contrib.auth.middleware.AuthenticationMiddleware",           # ✅ REQUIRED
    "django.contrib.messages.middleware.MessageMiddleware",              # ✅ REQUIRED
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",                      # ✅ ADDED
                "django.template.context_processors.request",                    # ✅ REQUIRED FOR ADMIN NAV
                "django.contrib.auth.context_processors.auth",                   # ✅ REQUIRED
                "django.contrib.messages.context_processors.messages",           # ✅ REQUIRED
            ],
        },
    },
]

WSGI_APPLICATION = "backend.wsgi.application"

# ───────── No SQL DB – dummy backend ─────────
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'monprojetdb',
        'USER': 'postgres',
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

from datetime import timedelta

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(days=1),
    "AUTH_HEADER_TYPES": ("Bearer",),
}
