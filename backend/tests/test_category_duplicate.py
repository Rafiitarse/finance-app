"""
Tests for B3: Duplicate category names return 400 with field error.
"""
import pytest
from rest_framework import status


@pytest.mark.django_db
class TestCategoryDuplicateNames:
    """Tests for duplicate category name validation."""

    def test_create_duplicate_category_same_user_same_type_returns_400(self, auth_client, user, seed_default_categories):
        """Creating a category with same name and type as existing own category returns 400."""
        # Create first category
        data = {'name': 'Test Category', 'type': 'expense', 'icon': 'tag', 'color': '#FF0000'}
        response = auth_client.post('/api/categories/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        
        # Try to create duplicate
        response = auth_client.post('/api/categories/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'name' in response.data
        assert 'already exists' in str(response.data['name'][0]).lower()

    def test_create_duplicate_category_same_name_different_type_allowed(self, auth_client, user, seed_default_categories):
        """Creating a category with same name but different type is allowed."""
        # Create expense category
        data1 = {'name': 'Test Category', 'type': 'expense', 'icon': 'tag', 'color': '#FF0000'}
        response = auth_client.post('/api/categories/', data1, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        
        # Create income category with same name
        data2 = {'name': 'Test Category', 'type': 'income', 'icon': 'tag', 'color': '#00FF00'}
        response = auth_client.post('/api/categories/', data2, format='json')
        assert response.status_code == status.HTTP_201_CREATED

    def test_create_category_duplicate_of_default_returns_400(self, auth_client, user, default_category):
        """Creating a category with same name and type as a default category returns 400."""
        data = {'name': default_category.name, 'type': default_category.type, 'icon': 'tag', 'color': '#FF0000'}
        response = auth_client.post('/api/categories/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'name' in response.data
        assert 'already exists' in str(response.data['name'][0]).lower()

    def test_update_category_to_own_current_name_allowed(self, auth_client, user, category):
        """Renaming a category to its own current name does not fail."""
        data = {'name': category.name, 'type': category.type}
        response = auth_client.patch(f'/api/categories/{category.id}/', data, format='json')
        assert response.status_code == status.HTTP_200_OK

    def test_create_same_name_another_user_allowed(self, auth_client, other_user_client, user, seed_default_categories):
        """Another user may create the same name."""
        # First user creates category
        data = {'name': 'Shared Name', 'type': 'expense', 'icon': 'tag', 'color': '#FF0000'}
        response = auth_client.post('/api/categories/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        
        # Second user creates same name
        response = other_user_client.post('/api/categories/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED