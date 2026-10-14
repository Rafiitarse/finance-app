"""
F-03: GET /api/categories/ must NOT be paginated.

CategoryViewSet inherits DEFAULT_PAGINATION_CLASS (PageNumberPagination,
PAGE_SIZE=20) from settings, so the endpoint returns a dict with
results/count/next/previous and only 20 items. The frontend (categories
dropdown, categories page) expects the full plain list.

Test: seed 14 default categories + 12 custom categories for the user
(26 total, well above the page size of 20), GET /api/categories/ must
return a JSON LIST containing all of them.
"""
import pytest
from rest_framework import status

from tests.factories import CategoryFactory


CUSTOM_CATEGORY_COUNT = 12


@pytest.mark.django_db
class TestCategoryListNotPaginated:
    """F-03: category listing returns the full unpaginated list."""

    def test_categories_endpoint_returns_full_list(
        self, auth_client, user, seed_default_categories
    ):
        """All default + custom categories come back as a plain list."""
        custom_categories = [
            CategoryFactory(user=user) for _ in range(CUSTOM_CATEGORY_COUNT)
        ]

        response = auth_client.get('/api/categories/')

        assert response.status_code == status.HTTP_200_OK

        # Must be a plain list, not a paginated dict
        assert isinstance(
            response.data, list
        ), 'Category list must be a plain JSON array (pagination_class = None)'

        # 14 default + 12 custom = 26, above PAGE_SIZE of 20
        assert len(response.data) >= 24

        # Every created custom category must be present
        returned_ids = {cat['id'] for cat in response.data}
        for category in custom_categories:
            assert category.id in returned_ids, f'Missing category: {category.name}'
