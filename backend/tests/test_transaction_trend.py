"""
Tests for D-02 (backend): GET /api/transactions/trend/ - real N-month trend endpoint.
"""
import pytest
from datetime import date
from decimal import Decimal
from django.db import connection
from django.test.utils import CaptureQueriesContext
from freezegun import freeze_time
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from transactions.models import Category, Transaction


@pytest.fixture
def income_category(user):
    return Category.objects.create(
        user=user, name='Salary', type='income', icon='wallet', color='#22C55E'
    )


@pytest.fixture
def expense_category(user):
    return Category.objects.create(
        user=user, name='Food', type='expense', icon='tag', color='#FF0000'
    )


def make_transaction(user, category, amount, day, description=''):
    return Transaction.objects.create(
        user=user,
        category=category,
        amount=Decimal(amount),
        description=description,
        date=day,
    )


@pytest.mark.django_db
class TestTransactionTrendZeroFill:
    """Zero-fill: months without transactions still appear with 0.00 values."""

    def test_gap_month_appears_with_zero_values(self, auth_client, user, income_category, expense_category):
        """A month with no transactions still appears in the list with 0.00 values."""
        # May 2026 has data, April 2026 has none, March 2026 has data.
        make_transaction(user, income_category, '1000000.00', date(2026, 5, 10))
        make_transaction(user, expense_category, '400000.00', date(2026, 5, 12))
        make_transaction(user, expense_category, '250000.00', date(2026, 3, 20))

        response = auth_client.get('/api/transactions/trend/?months=3&year=2026&month=5')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3
        months = [item['month'] for item in response.data]
        assert months == ['2026-03-01', '2026-04-01', '2026-05-01']

        april = response.data[1]
        assert april['total_income'] == '0.00'
        assert april['total_expense'] == '0.00'
        assert april['balance'] == '0.00'

        may = response.data[2]
        assert may['total_income'] == '1000000.00'
        assert may['total_expense'] == '400000.00'
        assert may['balance'] == '600000.00'


@pytest.mark.django_db
class TestTransactionTrendOrder:
    """Ascending chronological order."""

    def test_months_returned_in_ascending_order(self, auth_client, user, income_category):
        """Response is ordered oldest -> newest, ending at the reference month."""
        for month in range(1, 7):
            make_transaction(user, income_category, '100.00', date(2026, month, 15))

        response = auth_client.get('/api/transactions/trend/?months=6&year=2026&month=6')

        assert response.status_code == status.HTTP_200_OK
        months = [item['month'] for item in response.data]
        assert months == ['2026-01-01', '2026-02-01', '2026-03-01',
                          '2026-04-01', '2026-05-01', '2026-06-01']
        assert months == sorted(months)


@pytest.mark.django_db
class TestTransactionTrendYearRollover:
    """Year rollover: a January reference includes December of the previous year."""

    def test_january_reference_includes_previous_december(self, auth_client, user, income_category, expense_category):
        """months=3 ending at January 2026 covers Nov 2025, Dec 2025, Jan 2026."""
        make_transaction(user, expense_category, '100.00', date(2025, 11, 5))
        make_transaction(user, expense_category, '200.00', date(2025, 12, 5))
        make_transaction(user, income_category, '900.00', date(2026, 1, 5))

        response = auth_client.get('/api/transactions/trend/?months=3&year=2026&month=1')

        assert response.status_code == status.HTTP_200_OK
        assert [item['month'] for item in response.data] == ['2025-11-01', '2025-12-01', '2026-01-01']
        assert response.data[1]['total_expense'] == '200.00'
        assert response.data[2]['total_income'] == '900.00'

    def test_twelve_months_crossing_year_boundary(self, auth_client, user, expense_category):
        """months=12 ending at March 2026 starts at April 2025."""
        make_transaction(user, expense_category, '10.00', date(2025, 4, 1))
        make_transaction(user, expense_category, '20.00', date(2026, 3, 31))

        response = auth_client.get('/api/transactions/trend/?months=12&year=2026&month=3')

        assert response.status_code == status.HTTP_200_OK
        months = [item['month'] for item in response.data]
        assert len(months) == 12
        assert months[0] == '2025-04-01'
        assert months[-1] == '2026-03-01'
        assert response.data[0]['total_expense'] == '10.00'
        assert response.data[-1]['total_expense'] == '20.00'


@pytest.mark.django_db
class TestTransactionTrendUserIsolation:
    """Only the logged-in user's transactions are counted."""

    def test_user_b_never_sees_user_a_transactions(
        self, user, auth_client, other_user, other_user_client, income_category, expense_category
    ):
        """User B's trend request must not include user A's transactions."""
        make_transaction(user, expense_category, '500000.00', date(2026, 5, 10))
        make_transaction(user, income_category, '800000.00', date(2026, 5, 11))

        response = other_user_client.get('/api/transactions/trend/?months=3&year=2026&month=5')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3
        for item in response.data:
            assert item['total_income'] == '0.00'
            assert item['total_expense'] == '0.00'
            assert item['balance'] == '0.00'

    def test_each_user_sees_only_their_own_totals(
        self, user, other_user, auth_client, other_user_client, income_category, expense_category
    ):
        """Same month, different totals per user."""
        make_transaction(user, expense_category, '100.00', date(2026, 5, 10))

        other_income = Category.objects.create(
            user=other_user, name='Other Salary', type='income', icon='wallet', color='#22C55E'
        )
        make_transaction(other_user, other_income, '777.00', date(2026, 5, 10))

        mine = auth_client.get('/api/transactions/trend/?months=1&year=2026&month=5')
        theirs = other_user_client.get('/api/transactions/trend/?months=1&year=2026&month=5')

        assert mine.data[0]['total_expense'] == '100.00'
        assert mine.data[0]['total_income'] == '0.00'
        assert theirs.data[0]['total_income'] == '777.00'
        assert theirs.data[0]['total_expense'] == '0.00'

    def test_trend_requires_authentication(self, api_client):
        """Unauthenticated requests are rejected."""
        response = api_client.get('/api/transactions/trend/')
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


@pytest.mark.django_db
class TestTransactionTrendValidation:
    """Invalid query params return 400 with field errors."""

    @pytest.mark.parametrize('param', [
        'month=abc',
        'month=13',
        'month=0',
        'year=0&month=1',
        'year=99999&month=1',
    ])
    def test_invalid_year_month_return_400(self, auth_client, user, seed_default_categories, param):
        # Guard: the trend action must exist. Without this, `?month=abc` would 400
        # from the detail route's TransactionFilter (trend parsed as a pk) and the
        # test would pass vacuously.
        assert auth_client.get('/api/transactions/trend/?months=3&year=2026&month=5').status_code == status.HTTP_200_OK

        response = auth_client.get(f'/api/transactions/trend/?{param}')
        assert response.status_code == status.HTTP_400_BAD_REQUEST, f'Failed for {param}'
        errors = response.data
        assert 'month' in errors or 'year' in errors, f'No field error for {param}'

    @pytest.mark.parametrize('param,field', [
        ('months=abc', 'months'),
        ('months=0', 'months'),
        ('months=25', 'months'),
        ('months=-3', 'months'),
    ])
    def test_invalid_months_return_400(self, auth_client, user, seed_default_categories, param, field):
        assert auth_client.get('/api/transactions/trend/?months=3&year=2026&month=5').status_code == status.HTTP_200_OK

        response = auth_client.get(f'/api/transactions/trend/?{param}')
        assert response.status_code == status.HTTP_400_BAD_REQUEST, f'Failed for {param}'
        assert field in response.data

    def test_month_abc_returns_field_error_on_month(self, auth_client, user, seed_default_categories):
        assert auth_client.get('/api/transactions/trend/?months=3&year=2026&month=5').status_code == status.HTTP_200_OK

        response = auth_client.get('/api/transactions/trend/?month=abc')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'month' in response.data

    def test_year_99999_returns_field_error_on_year(self, auth_client, user, seed_default_categories):
        assert auth_client.get('/api/transactions/trend/?months=3&year=2026&month=5').status_code == status.HTTP_200_OK

        response = auth_client.get('/api/transactions/trend/?year=99999&month=1')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'year' in response.data


@pytest.mark.django_db
class TestTransactionTrendMonthsBounds:
    """months default and bounds."""

    def test_default_months_is_six(self, auth_client, user, income_category):
        """No months param -> 6 months."""
        for month in range(1, 9):
            make_transaction(user, income_category, '10.00', date(2026, month, 1))

        response = auth_client.get('/api/transactions/trend/?year=2026&month=8')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 6
        assert response.data[-1]['month'] == '2026-08-01'
        assert response.data[0]['month'] == '2026-03-01'

    def test_months_one_returns_single_month(self, auth_client, user, income_category):
        make_transaction(user, income_category, '10.00', date(2026, 5, 1))
        response = auth_client.get('/api/transactions/trend/?months=1&year=2026&month=5')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['month'] == '2026-05-01'

    def test_months_twentyfour_accepted(self, auth_client, user, income_category):
        response = auth_client.get('/api/transactions/trend/?months=24&year=2026&month=5')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 24
        assert response.data[0]['month'] == '2024-06-01'
        assert response.data[-1]['month'] == '2026-05-01'


@pytest.mark.django_db
class TestTransactionTrendSingleQuery:
    """D-02 requires ONE aggregate query (group by year+month), not N queries."""

    def test_uses_single_aggregate_query(self, auth_client, user, income_category, expense_category):
        """24 months of data spread across the window still cost a constant number of queries."""
        for month in range(1, 25):
            make_transaction(user, income_category, '10.00', date(2024 + (month - 1) // 12, (month - 1) % 12 + 1, 15))
            make_transaction(user, expense_category, '5.00', date(2024 + (month - 1) // 12, (month - 1) % 12 + 1, 16))

        with CaptureQueriesContext(connection) as ctx:
            response = auth_client.get('/api/transactions/trend/?months=24&year=2026&month=5')

        assert response.status_code == status.HTTP_200_OK
        aggregate_queries = [q for q in ctx.captured_queries if 'GROUP BY' in q['sql'].upper()]
        assert len(aggregate_queries) == 1, (
            f'Expected exactly 1 GROUP BY aggregate query, got {len(aggregate_queries)}'
        )


@pytest.mark.django_db
class TestTransactionTrendJakartaTimezone:
    """Default reference month uses Asia/Jakarta local time."""

    def test_reference_month_defaults_to_jakarta_local_month(self, user, seed_default_categories):
        """At 2026-10-31 20:00 UTC (2026-11-01 03:00 Jakarta) the reference month is November 2026."""
        category = Category.objects.create(
            user=user, name='Test Expense', type='expense', icon='tag', color='#FF0000'
        )

        with freeze_time('2026-10-31 20:00:00+00:00'):
            # October 2026 - outside the November window, must not appear
            make_transaction(user, category, '100000.00', date(2026, 10, 30), 'October expense')
            # November 2026 - the reference month in Jakarta
            make_transaction(user, category, '200000.00', date(2026, 11, 1), 'November expense')
            make_transaction(user, category, '300000.00', date(2026, 11, 30), 'November last day')

            # Fresh client with a token minted inside freeze_time
            client = APIClient()
            refresh = RefreshToken.for_user(user)
            client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

            response = client.get('/api/transactions/trend/')

        assert response.status_code == status.HTTP_200_OK
        months = [item['month'] for item in response.data]
        assert months == ['2026-06-01', '2026-07-01', '2026-08-01',
                          '2026-09-01', '2026-10-01', '2026-11-01']
        # Reference month is November 2026, and October's 100000 does not leak in.
        november = response.data[-1]
        assert november['total_expense'] == '500000.00'
        october = response.data[-2]
        assert october['total_expense'] == '100000.00'
        assert october['total_income'] == '0.00'

    def test_reference_month_earlier_in_month_uses_that_month(self, user, seed_default_categories):
        """At 2026-03-15 10:00 Jakarta the reference month is March 2026."""
        category = Category.objects.create(
            user=user, name='Test Expense', type='expense', icon='tag', color='#FF0000'
        )
        make_transaction(user, category, '10.00', date(2026, 3, 15))

        with freeze_time('2026-03-15 10:00:00+07:00'):
            client = APIClient()
            refresh = RefreshToken.for_user(user)
            client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
            response = client.get('/api/transactions/trend/?months=3')

        assert response.status_code == status.HTTP_200_OK
        assert [item['month'] for item in response.data] == ['2026-01-01', '2026-02-01', '2026-03-01']
