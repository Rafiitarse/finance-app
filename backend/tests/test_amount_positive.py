"""
Tests for B6: Transaction amount must be positive (>= 0.01).
"""
import pytest
from rest_framework import status
from decimal import Decimal


@pytest.mark.django_db
class TestTransactionAmountPositive:
    """Tests for transaction amount validation."""

    def test_create_transaction_with_negative_amount_returns_400(self, auth_client, category):
        """Creating transaction with negative amount returns 400."""
        response = auth_client.post('/api/transactions/', {
            'category_id': category.id,
            'amount': '-100000',
            'description': 'Test',
            'date': '2026-10-01',
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'amount' in response.data

    def test_create_transaction_with_zero_amount_returns_400(self, auth_client, category):
        """Creating transaction with zero amount returns 400."""
        response = auth_client.post('/api/transactions/', {
            'category_id': category.id,
            'amount': '0',
            'description': 'Test',
            'date': '2026-10-01',
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'amount' in response.data

    def test_create_transaction_with_negative_small_amount_returns_400(self, auth_client, category):
        """Creating transaction with -0.01 amount returns 400."""
        response = auth_client.post('/api/transactions/', {
            'category_id': category.id,
            'amount': '-0.01',
            'description': 'Test',
            'date': '2026-10-01',
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'amount' in response.data

    def test_create_transaction_with_minimum_valid_amount_returns_201(self, auth_client, category):
        """Creating transaction with 0.01 amount returns 201."""
        response = auth_client.post('/api/transactions/', {
            'category_id': category.id,
            'amount': '0.01',
            'description': 'Test',
            'date': '2026-10-01',
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['amount'] == '0.01'

    def test_update_transaction_to_negative_amount_returns_400(self, auth_client, transaction):
        """Updating transaction to negative amount returns 400."""
        response = auth_client.patch(f'/api/transactions/{transaction.id}/', {
            'amount': '-100',
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'amount' in response.data

    def test_update_transaction_to_zero_amount_returns_400(self, auth_client, transaction):
        """Updating transaction to zero amount returns 400."""
        response = auth_client.patch(f'/api/transactions/{transaction.id}/', {
            'amount': '0',
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'amount' in response.data

    def test_update_transaction_to_valid_amount_returns_200(self, auth_client, transaction):
        """Updating transaction to valid amount returns 200."""
        response = auth_client.patch(f'/api/transactions/{transaction.id}/', {
            'amount': '50.00',
        }, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['amount'] == '50.00'