"""
Test settings for finance project.
"""

import os

# IMPORTANT: Set these BEFORE importing from .settings
# Phase 3 makes settings.py raise ImproperlyConfigured when these are missing,
# and that import happens before any override, so setting them afterwards would be too late.
os.environ.setdefault('SECRET_KEY', 'django-insecure-test-key-for-testing-only-do-not-use-in-production-abcdefghijklmnopqrstuvwxyz')
os.environ.setdefault('DEBUG', '0')
os.environ.setdefault('ALLOWED_HOSTS', 'testserver,localhost')

from .settings import *  # noqa: E402,F403

# Override for testing
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

DEBUG = False

# Use fast password hasher for tests
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

ALLOWED_HOSTS = ['*']

# Disable migrations for faster tests
class DisableMigrations:
    def __contains__(self, item):
        return True

    def __getitem__(self, item):
        return None

MIGRATION_MODULES = DisableMigrations()

# Use local memory cache for tests
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# SimpleJWT test settings (shorter token lifetimes)
from datetime import timedelta
SIMPLE_JWT = {
    **SIMPLE_JWT,
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=5),
    'REFRESH_TOKEN_LIFETIME': timedelta(minutes=10),
}

# Silence logging during tests
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'null': {
            'class': 'logging.NullHandler',
        },
    },
    'root': {
        'handlers': ['null'],
    },
}