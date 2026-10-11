"""
Tests for B7: Register must apply Django password validators.
"""
import pytest
from rest_framework import status


@pytest.mark.django_db
class TestRegisterPasswordValidation:
    """Tests for password validation during registration."""

    def test_register_with_weak_password_12345678_returns_400(self, api_client):
        """Register with password '12345678' returns 400."""
        response = api_client.post('/api/auth/register/', {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': '12345678',
            'password_confirm': '12345678',
            'first_name': 'Test',
            'last_name': 'User',
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'password' in response.data

    def test_register_with_weak_password_password_returns_400(self, api_client):
        """Register with password 'password' returns 400."""
        response = api_client.post('/api/auth/register/', {
            'username': 'testuser2',
            'email': 'test2@example.com',
            'password': 'password',
            'password_confirm': 'password',
            'first_name': 'Test',
            'last_name': 'User',
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'password' in response.data

    def test_register_with_strong_password_returns_201(self, api_client):
        """Register with strong password returns 201."""
        response = api_client.post('/api/auth/register/', {
            'username': 'testuser3',
            'email': 'test3@example.com',
            'password': 'StrongPass123!',
            'password_confirm': 'StrongPass123!',
            'first_name': 'Test',
            'last_name': 'User',
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert 'user' in response.data
        assert 'access' in response.data
        assert 'refresh' in response.data

    def test_register_with_mismatched_password_confirm_returns_400(self, api_client):
        """Register with mismatched password_confirm returns 400."""
        response = api_client.post('/api/auth/register/', {
            'username': 'testuser4',
            'email': 'test4@example.com',
            'password': 'StrongPass123!',
            'password_confirm': 'DifferentPass123!',
            'first_name': 'Test',
            'last_name': 'User',
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'password_confirm' in response.data