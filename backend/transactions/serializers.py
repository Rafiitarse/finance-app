"""
Transactions serializers.
"""
from rest_framework import serializers
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


class TransactionSerializer(serializers.ModelSerializer):
    """Serializer for Transaction model."""
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True
    )
    type = serializers.CharField(source='category.type', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'category', 'category_id', 'type',
            'amount', 'description', 'date',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


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
