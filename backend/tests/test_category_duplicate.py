"""
Tests for B3: Duplicate category names return 400 with field error.
"""
import pytest
from rest_framework import status
from transactions.models import Category


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

    def test_patch_name_to_existing_own_category_same_type_returns_400(self, auth_client, user, seed_default_categories):
        """PATCH with name of another own category of same type returns 400."""
        # Create first category
        data1 = {'name': 'Food', 'type': 'expense', 'icon': 'tag', 'color': '#FF0000'}
        response = auth_client.post('/api/categories/', data1, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        cat1 = Category.objects.get(user=user, name='Food', type='expense')
        cat1_id = cat1.id
        
        # Create second category
        data2 = {'name': 'Transport', 'type': 'expense', 'icon': 'car', 'color': '#00FF00'}
        response = auth_client.post('/api/categories/', data2, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        cat2 = Category.objects.get(user=user, name='Transport', type='expense')
        cat2_id = cat2.id
        
        # Try to rename second category to first category's name (same type)
        response = auth_client.patch(f'/api/categories/{cat2_id}/', {'name': 'Food'}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'name' in response.data
        assert 'already exists' in str(response.data['name'][0]).lower()

    def test_patch_type_to_colliding_type_same_name_returns_400(self, auth_client, user, seed_default_categories):
        """PATCH with type that collides with existing category of same name returns 400."""
        # Create expense category
        data1 = {'name': 'Shopping', 'type': 'expense', 'icon': 'tag', 'color': '#FF0000'}
        response = auth_client.post('/api/categories/', data1, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        cat1 = Category.objects.get(user=user, name='Shopping', type='expense')
        cat1_id = cat1.id
        
        # Create income category with different name
        data2 = {'name': 'Salary', 'type': 'income', 'icon': 'money', 'color': '#00FF00'}
        response = auth_client.post('/api/categories/', data2, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        cat2 = Category.objects.get(user=user, name='Salary', type='income')
        cat2_id = cat2.id
        
        # Create a third category with name 'Shopping' but type 'income'
        data3 = {'name': 'Shopping', 'type': 'income', 'icon': 'shop', 'color': '#0000FF'}
        response = auth_client.post('/api/categories/', data3, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        cat3 = Category.objects.get(user=user, name='Shopping', type='income')
        cat3_id = cat3.id
        
        # Now try to change cat3's type to 'expense' - should fail because 'Shopping' + 'expense' exists
        response = auth_client.patch(f'/api/categories/{cat3_id}/', {'type': 'expense'}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'name' in response.data
        assert 'already exists' in str(response.data['name'][0]).lower()

    def test_patch_icon_only_returns_200(self, auth_client, category):
        """PATCH with only icon field returns 200."""
        response = auth_client.patch(f'/api/categories/{category.id}/', {'icon': 'new-icon'}, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['icon'] == 'new-icon'

    def test_patch_name_case_insensitive_duplicate_returns_400(self, auth_client, user, seed_default_categories):
        """PATCH with name differing only in case returns 400 (case-insensitive check)."""
        # Create category with name 'Kopi'
        data1 = {'name': 'Kopi', 'type': 'expense', 'icon': 'coffee', 'color': '#FF0000'}
        response = auth_client.post('/api/categories/', data1, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        cat1 = Category.objects.get(user=user, name='Kopi', type='expense')
        cat1_id = cat1.id
        
        # Create second category
        data2 = {'name': 'Teh', 'type': 'expense', 'icon': 'tea', 'color': '#00FF00'}
        response = auth_client.post('/api/categories/', data2, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        cat2 = Category.objects.get(user=user, name='Teh', type='expense')
        cat2_id = cat2.id
        
        # Try to rename second category to 'kopi' (lowercase) - should fail due to case-insensitive check
        response = auth_client.patch(f'/api/categories/{cat2_id}/', {'name': 'kopi'}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'name' in response.data
        assert 'already exists' in str(response.data['name'][0]).lower()