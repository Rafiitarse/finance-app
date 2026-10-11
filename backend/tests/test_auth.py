"""
Tests for B1: Logout must really revoke the refresh token.
"""
import pytest
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError


@pytest.mark.django_db
class TestLogoutBlacklist:
    """Tests for logout token blacklisting."""

    def test_logout_with_valid_refresh_returns_200(self, auth_client, user):
        """Logout with valid refresh token returns 200."""
        refresh = RefreshToken.for_user(user)
        response = auth_client.post('/api/auth/logout/', {'refresh': str(refresh)}, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['detail'] == 'Successfully logged out.'

    def test_logout_then_refresh_returns_401(self, auth_client, user):
        """After logout, using the same refresh token returns 401."""
        refresh = RefreshToken.for_user(user)
        refresh_str = str(refresh)
        
        # Logout
        response = auth_client.post('/api/auth/logout/', {'refresh': refresh_str}, format='json')
        assert response.status_code == status.HTTP_200_OK
        
        # Try to refresh with the same token
        response = auth_client.post('/api/auth/refresh/', {'refresh': refresh_str}, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_logout_without_refresh_returns_400(self, auth_client):
        """Logout without refresh token returns 400 with proper message."""
        response = auth_client.post('/api/auth/logout/', {}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['detail'] == 'Refresh token is required.'

    def test_logout_with_empty_refresh_returns_400(self, auth_client):
        """Logout with empty refresh token returns 400 with proper message."""
        response = auth_client.post('/api/auth/logout/', {'refresh': ''}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['detail'] == 'Refresh token is required.'

    def test_logout_with_invalid_refresh_returns_400(self, auth_client):
        """Logout with garbage refresh token returns 400 with proper message."""
        response = auth_client.post('/api/auth/logout/', {'refresh': 'garbage.token.here'}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['detail'] == 'Invalid token.'