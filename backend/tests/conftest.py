"""
Test configuration and fixtures.
"""
import pytest
from django.core.cache import cache
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from tests.factories import UserFactory, CategoryFactory, TransactionFactory


User = get_user_model()


@pytest.fixture(autouse=True)
def clear_cache():
    """Clear the throttle cache between tests (throttling uses the default cache)."""
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def api_client():
    """Unauthenticated API client."""
    return APIClient()


@pytest.fixture
def user(db):
    """Create a test user."""
    return UserFactory()


@pytest.fixture
def other_user(db):
    """Create another test user."""
    return UserFactory(email='other@example.com', username='otheruser')


@pytest.fixture
def auth_client(api_client, user):
    """Authenticated API client with JWT access token."""
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def other_user_client(other_user):
    """Authenticated API client for another user."""
    from rest_framework.test import APIClient
    from rest_framework_simplejwt.tokens import RefreshToken
    client = APIClient()
    refresh = RefreshToken.for_user(other_user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return client


@pytest.fixture
def seed_default_categories(db):
    """Seed default categories for tests."""
    from django.core.management import call_command
    call_command('seed_default_categories', verbosity=0)


@pytest.fixture
def category(user, seed_default_categories):
    """Create a user category."""
    return CategoryFactory(user=user)


@pytest.fixture
def default_category(seed_default_categories):
    """Get a default category."""
    from transactions.models import Category
    return Category.objects.filter(is_default=True).first()


@pytest.fixture
def transaction(user, category):
    """Create a transaction."""
    return TransactionFactory(user=user, category=category)