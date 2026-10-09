"""
Transactions admin.
"""
from django.contrib import admin
from .models import Category, Transaction


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'user', 'is_default', 'icon', 'color', 'created_at']
    list_filter = ['type', 'is_default', 'created_at']
    search_fields = ['name', 'user__email', 'user__username']
    ordering = ['type', 'name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['user', 'category', 'amount', 'date', 'description', 'created_at']
    list_filter = ['category__type', 'date', 'created_at']
    search_fields = ['description', 'user__email', 'category__name']
    ordering = ['-date', '-created_at']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'date'
