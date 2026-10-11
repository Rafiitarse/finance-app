"""
Regression guard tests - these verify behaviors that already work correctly
and must never regress.
"""
import pytest
from rest_framework import status


@pytest.mark.django_db
class TestRegressionGuards:
    """Regression guard tests for existing correct behaviors."""

    def test_other_user_cannot_access_transaction_returns_404(self, auth_client, other_user_client, transaction):
        """A second user doing GET /api/transactions/{id}/ on someone else's transaction gets 404."""
        response = other_user_client.get(f'/api/transactions/{transaction.id}/')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_other_user_cannot_use_custom_category_returns_400(self, auth_client, other_user_client, category):
        """A second user creating a transaction with someone else's custom category gets 400."""
        response = other_user_client.post('/api/transactions/', {
            'category_id': category.id,
            'amount': '10.00',
            'description': 'Test',
            'date': '2026-10-01',
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        # The error should be about invalid category
        assert 'category_id' in response.data or 'detail' in response.data

    def test_user_cannot_delete_default_category_returns_403(self, auth_client, default_category):
        """A user trying to delete a default (system) category gets 403."""
        response = auth_client.delete(f'/api/categories/{default_category.id}/')
        assert response.status_code == status.HTTP_403_FORBIDDEN