"""
Smoke tests for basic authentication and category listing.
"""
import pytest
from rest_framework import status


@pytest.mark.django_db
class TestSmoke:
    """Smoke tests to verify test infrastructure works."""

    def test_register_login_list_categories(self, api_client, seed_default_categories):
        """Test user registration, login, and listing categories."""
        # Register
        register_data = {
            'username': 'smoketest',
            'email': 'smoke@example.com',
            'password': 'TestPass123!',
            'password_confirm': 'TestPass123!',
            'first_name': 'Smoke',
            'last_name': 'Test',
        }
        response = api_client.post('/api/auth/register/', register_data, format='json')
        assert response.status_code == status.HTTP_201_CREATED, f'Register failed: {response.data}'
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert 'user' in response.data

        access_token = response.data['access']
        refresh_token = response.data['refresh']

        # Login with the same credentials
        login_data = {
            'email': 'smoke@example.com',
            'password': 'TestPass123!',
        }
        response = api_client.post('/api/auth/login/', login_data, format='json')
        assert response.status_code == status.HTTP_200_OK, f'Login failed: {response.data}'
        assert 'access' in response.data
        assert 'refresh' in response.data

        # Use access token to list categories
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = api_client.get('/api/categories/')
        assert response.status_code == status.HTTP_200_OK, f'List categories failed: {response.data}'
        # Handle paginated or plain list response
        results = (
            response.data
            if isinstance(response.data, list)
            else response.data.get('results', response.data)
        )
        # Should have default categories
        assert len(results) > 0
        # Check structure
        for cat in results:
            assert 'id' in cat
            assert 'name' in cat
            assert 'type' in cat
            assert 'icon' in cat
            assert 'color' in cat
            assert 'is_default' in cat