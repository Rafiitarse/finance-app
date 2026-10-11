"""
Tests for B5: Summary endpoints validation and timezone handling.
"""
import pytest
from datetime import date
from decimal import Decimal
from rest_framework import status
from freezegun import freeze_time


@pytest.mark.django_db
class TestTransactionSummaryValidation:
    """Tests for transaction summary query parameter validation."""

    def test_summary_without_params_uses_current_month_jakarta_time(self, user, seed_default_categories):
        """At 2026-10-31 20:00 UTC (2026-11-01 03:00 Asia/Jakarta), summary covers November 2026."""
        from transactions.models import Transaction, Category
        from rest_framework.test import APIClient
        from rest_framework_simplejwt.tokens import RefreshToken
        
        # Create an expense category for the user
        category = Category.objects.create(user=user, name='Test Expense', type='expense', icon='tag', color='#FF0000')
        
        # 2026-10-31 20:00 UTC = 2026-11-01 03:00 Jakarta (UTC+7)
        with freeze_time('2026-10-31 20:00:00+00:00'):
            # Create transaction on 2026-10-30 (October in Jakarta)
            Transaction.objects.create(
                user=user,
                category=category,
                amount=Decimal('100000'),
                description='October expense',
                date=date(2026, 10, 30)
            )
            # Create transaction on 2026-11-01 (November in Jakarta)
            Transaction.objects.create(
                user=user,
                category=category,
                amount=Decimal('200000'),
                description='November expense',
                date=date(2026, 11, 1)
            )
            # Create transaction on 2026-11-30 (last day of November in Jakarta)
            Transaction.objects.create(
                user=user,
                category=category,
                amount=Decimal('300000'),
                description='November last day',
                date=date(2026, 11, 30)
            )
            
            # Create fresh client with token inside freeze_time
            client = APIClient()
            refresh = RefreshToken.for_user(user)
            client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
            
            # Request summary without params - should use Jakarta current month (November 2026)
            response = client.get('/api/transactions/summary/')
            assert response.status_code == status.HTTP_200_OK
            
            # Should only include November transactions (Nov 1 and Nov 30)
            assert response.data['total_expense'] == '500000.00'  # 200000 + 300000
            assert response.data['total_income'] == '0.00'
            assert response.data['balance'] == '-500000.00'
            assert response.data['month'] == '2026-11-01'

    def test_summary_with_valid_year_month_params(self, auth_client, user, seed_default_categories):
        """Summary with valid year/month params returns data for that month."""
        from transactions.models import Transaction, Category
        
        category = Category.objects.create(user=user, name='Test Expense', type='expense', icon='tag', color='#FF0000')
        
        Transaction.objects.create(
            user=user,
            category=category,
            amount=Decimal('100000'),
            description='Jan expense',
            date=date(2026, 1, 15)
        )
        Transaction.objects.create(
            user=user,
            category=category,
            amount=Decimal('200000'),
            description='Feb expense',
            date=date(2026, 2, 15)
        )
        
        response = auth_client.get('/api/transactions/summary/?year=2026&month=1')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['total_expense'] == '100000.00'
        assert response.data['month'] == '2026-01-01'

    def test_summary_invalid_month_abc_returns_400(self, auth_client, user, seed_default_categories):
        """month=abc returns 400 with field error."""
        response = auth_client.get('/api/transactions/summary/?month=abc')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'month' in response.data

    def test_summary_invalid_month_13_returns_400(self, auth_client, user, seed_default_categories):
        """month=13 returns 400 with field error."""
        response = auth_client.get('/api/transactions/summary/?month=13')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'month' in response.data

    def test_summary_invalid_month_0_returns_400(self, auth_client, user, seed_default_categories):
        """month=0 returns 400 with field error."""
        response = auth_client.get('/api/transactions/summary/?month=0')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'month' in response.data

    def test_summary_invalid_year_0_returns_400(self, auth_client, user, seed_default_categories):
        """year=0 returns 400 with field error."""
        response = auth_client.get('/api/transactions/summary/?year=0&month=1')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'year' in response.data

    def test_summary_invalid_year_99999_returns_400(self, auth_client, user, seed_default_categories):
        """year=99999 returns 400 with field error."""
        response = auth_client.get('/api/transactions/summary/?year=99999&month=1')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'year' in response.data

    def test_summary_transaction_on_last_day_of_month(self, auth_client, user, seed_default_categories):
        """Transaction dated on last day of month lands in that month only."""
        from transactions.models import Transaction, Category
        
        category = Category.objects.create(user=user, name='Test Expense', type='expense', icon='tag', color='#FF0000')
        
        # Create transaction on 2026-01-31 (last day of January)
        Transaction.objects.create(
            user=user,
            category=category,
            amount=Decimal('100000'),
            description='Jan 31 expense',
            date=date(2026, 1, 31)
        )
        # Create transaction on 2026-02-01 (first day of February)
        Transaction.objects.create(
            user=user,
            category=category,
            amount=Decimal('200000'),
            description='Feb 1 expense',
            date=date(2026, 2, 1)
        )
        
        # Request January summary
        response = auth_client.get('/api/transactions/summary/?year=2026&month=1')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['total_expense'] == '100000.00'
        
        # Request February summary
        response = auth_client.get('/api/transactions/summary/?year=2026&month=2')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['total_expense'] == '200000.00'


@pytest.mark.django_db
class TestCategorySummaryValidation:
    """Tests for category summary query parameter validation."""

    def test_category_summary_without_params_uses_current_month_jakarta_time(self, user, seed_default_categories):
        """Category summary without params uses Jakarta local date."""
        from transactions.models import Transaction, Category
        from rest_framework.test import APIClient
        from rest_framework_simplejwt.tokens import RefreshToken
        
        category = Category.objects.create(user=user, name='Test Expense', type='expense', icon='tag', color='#FF0000')
        
        with freeze_time('2026-10-31 20:00:00+00:00'):
            # Create transaction on 2026-11-01 (November in Jakarta)
            Transaction.objects.create(
                user=user,
                category=category,
                amount=Decimal('100000'),
                description='November expense',
                date=date(2026, 11, 1)
            )
            
            # Create fresh client with token inside freeze_time
            client = APIClient()
            refresh = RefreshToken.for_user(user)
            client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
            
            response = client.get('/api/categories/summary/')
            assert response.status_code == status.HTTP_200_OK
            # Should include the November transaction
            assert len(response.data) > 0
            total = sum(Decimal(str(item['total_amount'])) for item in response.data)
            assert total == Decimal('100000.00')

    def test_category_summary_invalid_params_return_400(self, auth_client, user, seed_default_categories):
        """Category summary invalid params return 400."""
        for param in ['month=abc', 'month=13', 'month=0', 'year=0&month=1', 'year=99999&month=1']:
            response = auth_client.get(f'/api/categories/summary/?{param}')
            assert response.status_code == status.HTTP_400_BAD_REQUEST, f"Failed for {param}"

    def test_category_summary_with_valid_params(self, auth_client, user, seed_default_categories):
        """Category summary with valid params works."""
        from transactions.models import Transaction, Category
        
        category = Category.objects.create(user=user, name='Test Expense', type='expense', icon='tag', color='#FF0000')
        
        Transaction.objects.create(
            user=user,
            category=category,
            amount=Decimal('50000'),
            description='Test expense',
            date=date(2026, 3, 15)
        )
        
        response = auth_client.get('/api/categories/summary/?year=2026&month=3')
        assert response.status_code == status.HTTP_200_OK
        total = sum(Decimal(str(item['total_amount'])) for item in response.data)
        assert total == Decimal('50000.00')