"""
Tests for TransactionViewSet filters.
"""
import pytest
from decimal import Decimal
from datetime import date
from django.urls import reverse
from rest_framework import status


@pytest.mark.django_db
class TestTransactionFilters:
    """Test transaction list filters."""

    @pytest.fixture(autouse=True)
    def setup_data(self, user, other_user, seed_default_categories):
        """Set up test data using fixtures."""
        from transactions.models import Category
        from tests.factories import CategoryFactory, TransactionFactory

        # Create categories for user
        self.income_cat = CategoryFactory(user=user, name='Salary', type='income')
        self.expense_cat = CategoryFactory(user=user, name='Food', type='expense')

        # Create transactions for user
        self.t1 = TransactionFactory(
            user=user, category=self.income_cat,
            amount=Decimal('1000.00'), date=date(2026, 1, 15), description='Jan salary'
        )
        self.t2 = TransactionFactory(
            user=user, category=self.expense_cat,
            amount=Decimal('50.00'), date=date(2026, 1, 20), description='Jan food'
        )
        self.t3 = TransactionFactory(
            user=user, category=self.income_cat,
            amount=Decimal('2000.00'), date=date(2026, 2, 10), description='Feb salary'
        )
        self.t4 = TransactionFactory(
            user=user, category=self.expense_cat,
            amount=Decimal('30.00'), date=date(2026, 2, 15), description='Feb food'
        )

        # Create transaction for other_user (should not be visible)
        self.other_t = TransactionFactory(
            user=other_user, category=CategoryFactory(user=other_user, type='income'),
            amount=Decimal('9999.00'), date=date(2026, 1, 15), description='Other user'
        )

    def _get(self, client, params):
        """Helper to GET /api/transactions/ with query params."""
        url = reverse('transaction-list')
        if params:
            query = '&'.join(f'{k}={v}' for k, v in params.items())
            url = f'{url}?{query}'
        return client.get(url)

    # --- Valid filter tests ---

    def test_year_and_month_together(self, auth_client, user):
        """?year=Y&month=M returns only that month's transactions."""
        from transactions.models import Transaction
        print("DEBUG: User transactions:", list(Transaction.objects.filter(user=user).values('id', 'date', 'amount')))
        resp = self._get(auth_client, {'year': '2026', 'month': '1'})
        print("DEBUG: Response:", resp.status_code, resp.data)
        assert resp.status_code == status.HTTP_200_OK
        results = resp.data['results']
        assert len(results) == 2
        dates = {r['date'] for r in results}
        assert dates == {'2026-01-15', '2026-01-20'}

    def test_year_alone(self, auth_client):
        """?year=Y alone returns all transactions in that year."""
        resp = self._get(auth_client, {'year': '2026'})
        assert resp.status_code == status.HTTP_200_OK
        results = resp.data['results']
        assert len(results) == 4
        dates = {r['date'] for r in results}
        assert dates == {'2026-01-15', '2026-01-20', '2026-02-10', '2026-02-15'}

    def test_month_alone(self, auth_client):
        """?month=M alone returns all transactions in that month (any year)."""
        resp = self._get(auth_client, {'month': '1'})
        assert resp.status_code == status.HTTP_200_OK
        results = resp.data['results']
        assert len(results) == 2
        dates = {r['date'] for r in results}
        assert dates == {'2026-01-15', '2026-01-20'}

    def test_type_income(self, auth_client):
        """?type=income returns only income transactions."""
        resp = self._get(auth_client, {'type': 'income'})
        assert resp.status_code == status.HTTP_200_OK
        results = resp.data['results']
        assert len(results) == 2
        for r in results:
            assert r['type'] == 'income'

    def test_type_expense(self, auth_client):
        """?type=expense returns only expense transactions."""
        resp = self._get(auth_client, {'type': 'expense'})
        assert resp.status_code == status.HTTP_200_OK
        results = resp.data['results']
        assert len(results) == 2
        for r in results:
            assert r['type'] == 'expense'

    def test_category_type_alias_still_works(self, auth_client):
        """Old ?category__type=income still works."""
        resp = self._get(auth_client, {'category__type': 'income'})
        assert resp.status_code == status.HTTP_200_OK
        results = resp.data['results']
        assert len(results) == 2
        for r in results:
            assert r['type'] == 'income'

    def test_category_filter_still_works(self, auth_client):
        """Old ?category=<id> still works."""
        resp = self._get(auth_client, {'category': str(self.income_cat.id)})
        assert resp.status_code == status.HTTP_200_OK
        results = resp.data['results']
        assert len(results) == 2
        for r in results:
            assert r['category_id'] == self.income_cat.id

    def test_date_filter_still_works(self, auth_client):
        """Old ?date=<date> still works."""
        resp = self._get(auth_client, {'date': '2026-01-15'})
        assert resp.status_code == status.HTTP_200_OK
        results = resp.data['results']
        assert len(results) == 1
        assert results[0]['date'] == '2026-01-15'

    # --- Invalid filter tests (must return 400, never 500) ---

    def test_type_invalid_returns_400(self, auth_client):
        """?type=other returns 400."""
        resp = self._get(auth_client, {'type': 'other'})
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert 'type' in resp.data

    def test_month_abc_returns_400(self, auth_client):
        """?month=abc returns 400."""
        resp = self._get(auth_client, {'month': 'abc'})
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert 'month' in resp.data

    def test_month_float_returns_400(self, auth_client):
        """?month=3.5 returns 400."""
        resp = self._get(auth_client, {'month': '3.5'})
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert 'month' in resp.data

    def test_month_zero_returns_400(self, auth_client):
        """?month=0 returns 400."""
        resp = self._get(auth_client, {'month': '0'})
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert 'month' in resp.data

    def test_month_13_returns_400(self, auth_client):
        """?month=13 returns 400."""
        resp = self._get(auth_client, {'month': '13'})
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert 'month' in resp.data

    def test_year_abc_returns_400(self, auth_client):
        """?year=abc returns 400."""
        resp = self._get(auth_client, {'year': 'abc'})
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert 'year' in resp.data

    # --- Isolation tests ---

    def test_other_user_transactions_not_visible(self, other_user_client, other_user):
        """Second user never sees first user's transactions with any filter."""
        # Get other_user's custom income category (the one used by other_t)
        from transactions.models import Category
        other_income_cat = Category.objects.filter(user=other_user, type='income').first()

        # No filter
        resp = self._get(other_user_client, {})
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data['results']) == 1  # only other_t

        # With year filter
        resp = self._get(other_user_client, {'year': '2026'})
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data['results']) == 1

        # With month filter
        resp = self._get(other_user_client, {'month': '1'})
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data['results']) == 1

        # With type filter
        resp = self._get(other_user_client, {'type': 'income'})
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data['results']) == 1

        # With category__type filter
        resp = self._get(other_user_client, {'category__type': 'income'})
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data['results']) == 1

        # With category filter (other user's custom category id)
        resp = self._get(other_user_client, {'category': str(other_income_cat.id)})
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data['results']) == 1

        # With date filter
        resp = self._get(other_user_client, {'date': '2026-01-15'})
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data['results']) == 1