"""
Transactions serializers.
"""
from rest_framework import serializers
from django.db.models import Q
from decimal import Decimal
from .models import Category, Transaction


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model."""
    transaction_count = serializers.IntegerField(read_only=True)
    total_amount = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)

    class Meta:
        model = Category
        fields = [
            'id', 'name', 'type', 'icon', 'color', 
            'is_default', 'transaction_count', 'total_amount',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'is_default', 'created_at', 'updated_at']


class CategoryCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating Category."""
    
    class Meta:
        model = Category
        fields = ['name', 'type', 'icon', 'color']

    def validate(self, attrs):
        """Validate that category name + type combination is unique for user or default."""
        # On PATCH, fall back to instance's current values for missing fields
        if self.instance:
            name = attrs.get('name', self.instance.name).strip()
            category_type = attrs.get('type', self.instance.type)
        else:
            name = attrs.get('name', '').strip()
            category_type = attrs.get('type')
        
        if not name or not category_type:
            return attrs
        
        attrs['name'] = name
        
        user = self.context['request'].user
        
        # Build query for existing categories with same name (case-insensitive) and type
        # that belong to the current user or are default categories
        # Note: The model constraint is (user, name, type), so different users CAN have same name+type
        queryset = Category.objects.filter(
            Q(user=user) | Q(is_default=True),
            name__iexact=name,
            type=category_type
        )
        
        # Exclude the instance being updated (for PATCH)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        
        if queryset.exists():
            raise serializers.ValidationError({
                'name': ['A category with this name and type already exists.']
            })
        
        return attrs


class TransactionSerializer(serializers.ModelSerializer):
    """Serializer for Transaction model."""
    category = CategorySerializer(read_only=True)
    category_id = serializers.IntegerField(source='category.id', read_only=True)
    type = serializers.CharField(source='category.type', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'category', 'category_id', 'type',
            'amount', 'description', 'date',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'category_id', 'created_at', 'updated_at']


class TransactionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating Transaction."""
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True
    )

    class Meta:
        model = Transaction
        fields = ['category_id', 'amount', 'description', 'date']

    def validate_category_id(self, value):
        """Ensure category belongs to current user or is default."""
        user = self.context['request'].user
        if value.user is not None and value.user != user:
            raise serializers.ValidationError('Invalid category.')
        return value

    def validate_amount(self, value):
        """Ensure amount is positive (>= 0.01)."""
        if value < Decimal('0.01'):
            raise serializers.ValidationError('Amount must be at least 0.01.')
        return value


class TransactionUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating Transaction."""
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        required=False
    )

    class Meta:
        model = Transaction
        fields = ['category_id', 'amount', 'description', 'date']

    def validate_category_id(self, value):
        user = self.context['request'].user
        if value.user is not None and value.user != user:
            raise serializers.ValidationError('Invalid category.')
        return value

    def validate_amount(self, value):
        """Ensure amount is positive (>= 0.01)."""
        if value < Decimal('0.01'):
            raise serializers.ValidationError('Amount must be at least 0.01.')
        return value


# Summary Serializers
class MonthlySummarySerializer(serializers.Serializer):
    """Monthly summary serializer."""
    month = serializers.DateField()
    total_income = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_expense = serializers.DecimalField(max_digits=15, decimal_places=2)
    balance = serializers.DecimalField(max_digits=15, decimal_places=2)


class CategorySummarySerializer(serializers.Serializer):
    """Category breakdown serializer."""
    category_id = serializers.IntegerField()
    category_name = serializers.CharField()
    category_icon = serializers.CharField()
    category_color = serializers.CharField()
    type = serializers.CharField()
    total_amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    transaction_count = serializers.IntegerField()
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
