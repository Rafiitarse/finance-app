"""
Transactions views - Category & Transaction CRUD + Summaries.
"""
from datetime import date
from decimal import Decimal
from django.db.models import Sum, Count, Q
from django.db.models import ProtectedError
from django.utils import timezone
from rest_framework import viewsets, status, filters, permissions, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Category, Transaction
from .serializers import (
    CategorySerializer,
    CategoryCreateSerializer,
    TransactionSerializer,
    TransactionCreateSerializer,
    TransactionUpdateSerializer,
    MonthlySummarySerializer,
    CategorySummarySerializer,
)
from .filters import TransactionFilter


class SummaryQuerySerializer(serializers.Serializer):
    """Serializer for summary query parameters."""
    year = serializers.IntegerField(min_value=1970, max_value=2100, required=False)
    month = serializers.IntegerField(min_value=1, max_value=12, required=False)


def month_range(year: int, month: int) -> tuple[date, date]:
    """Return (start_of_month, start_of_next_month) for the given year and month."""
    start = date(year, month, 1)
    if month == 12:
        next_start = date(year + 1, 1, 1)
    else:
        next_start = date(year, month + 1, 1)
    return start, next_start


class IsOwner(permissions.BasePermission):
    """Permission to only allow owners of an object to access it."""
    
    def has_object_permission(self, request, view, obj):
        # Default categories (is_default=True) can be read by all, but not modified
        if view.action in ['update', 'partial_update', 'destroy']:
            return obj.user == request.user
        return True


class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for Category CRUD."""
    permission_classes = [permissions.IsAuthenticated]
    # F-03: return the full category list (dropdowns/pages need every category);
    # pagination would truncate at PAGE_SIZE and force a paginated response shape.
    pagination_class = None
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['type']
    ordering_fields = ['name', 'created_at']
    ordering = ['type', 'name']

    def get_queryset(self):
        """Return categories for current user + default categories."""
        user = self.request.user
        return Category.objects.filter(
            Q(user=user) | Q(is_default=True)
        ).annotate(
            transaction_count=Count('transactions', filter=Q(transactions__user=user)),
            total_amount=Sum('transactions__amount', filter=Q(transactions__user=user))
        )

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CategoryCreateSerializer
        return CategorySerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        """Create and return the full object using the read serializer."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        # Re-fetch with annotations and serialize with read serializer
        instance = self.get_queryset().get(pk=serializer.instance.pk)
        read_serializer = CategorySerializer(instance, context={'request': request})
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update and return the full object using the read serializer."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        # Re-fetch with annotations and serialize with read serializer
        instance = self.get_queryset().get(pk=instance.pk)
        read_serializer = CategorySerializer(instance, context={'request': request})
        return Response(read_serializer.data)

    def get_permissions(self):
        if self.action in ['destroy', 'update', 'partial_update']:
            return [permissions.IsAuthenticated(), IsOwner()]
        return [permissions.IsAuthenticated()]

    def destroy(self, request, *args, **kwargs):
        """Override destroy to catch ProtectedError when category has transactions."""
        instance = self.get_object()
        try:
            self.perform_destroy(instance)
        except ProtectedError:
            return Response(
                {'detail': 'Category is used by existing transactions and cannot be deleted.'},
                status=status.HTTP_409_CONFLICT
            )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get category breakdown for current month."""
        # Validate query parameters
        query_serializer = SummaryQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)
        
        user = request.user
        today = timezone.localdate()
        
        year = query_serializer.validated_data.get('year', today.year)
        month = query_serializer.validated_data.get('month', today.month)
        
        start_of_month, next_month = month_range(year, month)
        
        # Aggregate expenses by category
        expenses = Transaction.objects.filter(
            user=user,
            date__gte=start_of_month,
            date__lt=next_month,
            category__type='expense'
        ).values(
            'category__id', 'category__name', 'category__icon', 'category__color', 'category__type'
        ).annotate(
            total_amount=Sum('amount'),
            transaction_count=Count('id')
        ).order_by('-total_amount')
        
        # Calculate total for percentage
        total_expense = sum(e['total_amount'] or Decimal('0') for e in expenses)
        
        results = []
        for exp in expenses:
            amount = exp['total_amount'] or Decimal('0')
            percentage = (amount / total_expense * 100) if total_expense > 0 else Decimal('0')
            results.append({
                'category_id': exp['category__id'],
                'category_name': exp['category__name'],
                'category_icon': exp['category__icon'],
                'category_color': exp['category__color'],
                'type': exp['category__type'],
                'total_amount': amount,
                'transaction_count': exp['transaction_count'],
                'percentage': percentage.quantize(Decimal('0.01')),
            })
        
        serializer = CategorySummarySerializer(results, many=True)
        return Response(serializer.data)


class TransactionViewSet(viewsets.ModelViewSet):
    """ViewSet for Transaction CRUD."""
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_class = TransactionFilter
    search_fields = ['description', 'category__name']
    ordering_fields = ['date', 'amount', 'created_at']
    ordering = ['-date', '-created_at']

    def get_queryset(self):
        """Return transactions for current user."""
        return Transaction.objects.filter(user=self.request.user).select_related('category')

    def get_serializer_class(self):
        if self.action == 'create':
            return TransactionCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return TransactionUpdateSerializer
        return TransactionSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        """Create and return the full object using the read serializer."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        # Re-fetch with select_related and serialize with read serializer
        instance = self.get_queryset().get(pk=serializer.instance.pk)
        read_serializer = TransactionSerializer(instance, context={'request': request})
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update and return the full object using the read serializer."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        # Re-fetch with select_related and serialize with read serializer
        instance = self.get_queryset().get(pk=instance.pk)
        read_serializer = TransactionSerializer(instance, context={'request': request})
        return Response(read_serializer.data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get monthly summary (income, expense, balance)."""
        # Validate query parameters
        query_serializer = SummaryQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)
        
        user = request.user
        today = timezone.localdate()
        
        year = query_serializer.validated_data.get('year', today.year)
        month = query_serializer.validated_data.get('month', today.month)
        
        start_of_month, next_month = month_range(year, month)
        
        transactions = Transaction.objects.filter(
            user=user,
            date__gte=start_of_month,
            date__lt=next_month
        ).values('category__type').annotate(total=Sum('amount'))
        
        total_income = Decimal('0')
        total_expense = Decimal('0')
        
        for t in transactions:
            if t['category__type'] == 'income':
                total_income = t['total'] or Decimal('0')
            elif t['category__type'] == 'expense':
                total_expense = t['total'] or Decimal('0')
        
        balance = total_income - total_expense
        
        serializer = MonthlySummarySerializer({
            'month': start_of_month,
            'total_income': total_income,
            'total_expense': total_expense,
            'balance': balance,
        })
        return Response(serializer.data)
