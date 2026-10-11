"""
Tests for B2: Deleting a category that has transactions returns 409.
"""
import pytest
from rest_framework import status
from django.db.models import ProtectedError


@pytest.mark.django_db
class TestCategoryDeleteWithTransactions:
    """Tests for category deletion with existing transactions."""

    def test_delete_category_with_transactions_returns_409(self, auth_client, user, category):
        """Delete a category that has transactions returns 409."""
        from transactions.models import Transaction
        # Create a transaction using this category
        Transaction.objects.create(
            user=user,
            category=category,
            amount=10000,
            description='Test transaction',
            date='2026-01-15'
        )
        
        response = auth_client.delete(f'/api/categories/{category.id}/')
        assert response.status_code == status.HTTP_409_CONFLICT
        assert response.data['detail'] == 'Category is used by existing transactions and cannot be deleted.'

    def test_delete_unused_category_returns_204(self, auth_client, user, category):
        """Delete an unused category returns 204."""
        response = auth_client.delete(f'/api/categories/{category.id}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_delete_default_category_returns_403(self, auth_client, default_category):
        """Delete a default (system) category returns 403 (guard test)."""
        response = auth_client.delete(f'/api/categories/{default_category.id}/')
        assert response.status_code == status.HTTP_403_FORBIDDEN