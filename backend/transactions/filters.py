"""
Transaction filters for TransactionViewSet.
"""
import django_filters
from django import forms
from transactions.models import Transaction


class IntegerFilter(django_filters.NumberFilter):
    """Integer filter that validates integer input (rejects floats like 3.5)."""
    field_class = forms.IntegerField


class TransactionFilter(django_filters.FilterSet):
    """FilterSet for TransactionViewSet."""

    year = IntegerFilter(
        field_name='date',
        lookup_expr='year',
        min_value=1970,
        max_value=2100,
    )
    month = IntegerFilter(
        field_name='date',
        lookup_expr='month',
        min_value=1,
        max_value=12,
    )
    type = django_filters.ChoiceFilter(
        field_name='category__type',
        choices=[('income', 'income'), ('expense', 'expense')],
    )
    category = django_filters.NumberFilter(field_name='category_id')
    category__type = django_filters.ChoiceFilter(
        field_name='category__type',
        choices=[('income', 'income'), ('expense', 'expense')],
    )
    date = django_filters.DateFilter(field_name='date')

    class Meta:
        model = Transaction
        fields = ['year', 'month', 'type', 'category', 'category__type', 'date']