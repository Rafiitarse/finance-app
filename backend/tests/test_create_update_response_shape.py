"""
Tests for B4: Create/update responses must return the full object.
"""
import pytest
from rest_framework import status


@pytest.mark.django_db
class TestCategoryCreateUpdateResponseShape:
    """Tests for category create/update response shape matching GET detail."""

    def test_create_category_returns_full_object(self, auth_client, user, seed_default_categories):
        """POST /api/categories/ returns same shape as GET detail."""
        data = {'name': 'Test Category', 'type': 'expense', 'icon': 'tag', 'color': '#FF0000'}
        response = auth_client.post('/api/categories/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        
        # Check all expected fields are present
        expected_fields = {
            'id', 'name', 'type', 'icon', 'color', 
            'is_default', 'transaction_count', 'total_amount',
            'created_at', 'updated_at'
        }
        assert set(response.data.keys()) == expected_fields
        
        # Check field values
        assert response.data['name'] == 'Test Category'
        assert response.data['type'] == 'expense'
        assert response.data['icon'] == 'tag'
        assert response.data['color'] == '#FF0000'
        assert response.data['is_default'] is False
        assert response.data['transaction_count'] == 0
        assert response.data['total_amount'] is None or response.data['total_amount'] == 0
        assert response.data['id'] is not None
        assert response.data['created_at'] is not None
        assert response.data['updated_at'] is not None

    def test_patch_category_returns_full_object(self, auth_client, user, category, seed_default_categories):
        """PATCH /api/categories/{id}/ returns same shape as GET detail."""
        data = {'name': 'Updated Category', 'icon': 'new-icon'}
        response = auth_client.patch(f'/api/categories/{category.id}/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        
        # Check all expected fields are present
        expected_fields = {
            'id', 'name', 'type', 'icon', 'color', 
            'is_default', 'transaction_count', 'total_amount',
            'created_at', 'updated_at'
        }
        assert set(response.data.keys()) == expected_fields
        
        # Check field values
        assert response.data['name'] == 'Updated Category'
        assert response.data['icon'] == 'new-icon'
        assert response.data['id'] == category.id
        assert response.data['type'] == category.type
        assert response.data['color'] == category.color

    def test_create_category_response_matches_get_detail(self, auth_client, user, seed_default_categories):
        """POST response matches GET detail response for the same category."""
        data = {'name': 'Match Category', 'type': 'income', 'icon': 'dollar', 'color': '#00FF00'}
        create_response = auth_client.post('/api/categories/', data, format='json')
        assert create_response.status_code == status.HTTP_201_CREATED
        
        category_id = create_response.data['id']
        get_response = auth_client.get(f'/api/categories/{category_id}/')
        assert get_response.status_code == status.HTTP_200_OK
        
        # Both responses should have the same keys and values
        assert set(create_response.data.keys()) == set(get_response.data.keys())
        for key in create_response.data:
            assert create_response.data[key] == get_response.data[key], f"Mismatch on field {key}"


@pytest.mark.django_db
class TestTransactionCreateUpdateResponseShape:
    """Tests for transaction create/update response shape matching GET detail."""

    def test_create_transaction_returns_full_object(self, auth_client, user, category, seed_default_categories):
        """POST /api/transactions/ returns same shape as GET detail."""
        data = {
            'category_id': category.id,
            'amount': '50000.00',
            'description': 'Test transaction',
            'date': '2026-01-15'
        }
        response = auth_client.post('/api/transactions/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        
        # Check all expected fields are present
        expected_fields = {
            'id', 'category', 'category_id', 'type',
            'amount', 'description', 'date',
            'created_at', 'updated_at'
        }
        assert set(response.data.keys()) == expected_fields
        
        # Check field values
        assert response.data['amount'] == '50000.00'
        assert response.data['description'] == 'Test transaction'
        assert response.data['date'] == '2026-01-15'
        assert response.data['category_id'] == category.id
        assert response.data['type'] == category.type
        assert response.data['id'] is not None
        assert response.data['created_at'] is not None
        assert response.data['updated_at'] is not None
        
        # Check nested category object
        assert isinstance(response.data['category'], dict)
        assert response.data['category']['id'] == category.id
        assert response.data['category']['name'] == category.name
        assert response.data['category']['type'] == category.type

    def test_patch_transaction_returns_full_object(self, auth_client, user, transaction, seed_default_categories):
        """PATCH /api/transactions/{id}/ returns same shape as GET detail."""
        data = {'amount': '75000.00', 'description': 'Updated description'}
        response = auth_client.patch(f'/api/transactions/{transaction.id}/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        
        # Check all expected fields are present
        expected_fields = {
            'id', 'category', 'category_id', 'type',
            'amount', 'description', 'date',
            'created_at', 'updated_at'
        }
        assert set(response.data.keys()) == expected_fields
        
        # Check field values
        assert response.data['amount'] == '75000.00'
        assert response.data['description'] == 'Updated description'
        assert response.data['id'] == transaction.id
        assert response.data['category_id'] == transaction.category.id

    def test_create_transaction_response_matches_get_detail(self, auth_client, user, category, seed_default_categories):
        """POST response matches GET detail response for the same transaction."""
        data = {
            'category_id': category.id,
            'amount': '50000.00',
            'description': 'Match transaction',
            'date': '2026-01-15'
        }
        create_response = auth_client.post('/api/transactions/', data, format='json')
        assert create_response.status_code == status.HTTP_201_CREATED
        
        transaction_id = create_response.data['id']
        get_response = auth_client.get(f'/api/transactions/{transaction_id}/')
        assert get_response.status_code == status.HTTP_200_OK
        
        # Both responses should have the same keys and values
        assert set(create_response.data.keys()) == set(get_response.data.keys())
        for key in create_response.data:
            assert create_response.data[key] == get_response.data[key], f"Mismatch on field {key}"