"""
Django command to seed default categories.
"""
from django.core.management.base import BaseCommand
from transactions.models import Category


DEFAULT_CATEGORIES = [
    # Income categories
    {'name': 'Gaji', 'type': 'income', 'icon': 'briefcase', 'color': '#10B981'},
    {'name': 'Freelance', 'type': 'income', 'icon': 'laptop', 'color': '#059669'},
    {'name': 'Investasi', 'type': 'income', 'icon': 'trending-up', 'color': '#047857'},
    {'name': 'Hadiah', 'type': 'income', 'icon': 'gift', 'color': '#065F46'},
    {'name': 'Lainnya (Masuk)', 'type': 'income', 'icon': 'plus-circle', 'color': '#064E3B'},
    
    # Expense categories
    {'name': 'Makanan & Minuman', 'type': 'expense', 'icon': 'utensils', 'color': '#EF4444'},
    {'name': 'Transportasi', 'type': 'expense', 'icon': 'car', 'color': '#DC2626'},
    {'name': 'Belanja', 'type': 'expense', 'icon': 'shopping-bag', 'color': '#B91C1C'},
    {'name': 'Hiburan', 'type': 'expense', 'icon': 'film', 'color': '#991B1B'},
    {'name': 'Kesehatan', 'type': 'expense', 'icon': 'heart-pulse', 'color': '#7F1D1D'},
    {'name': 'Pendidikan', 'type': 'expense', 'icon': 'book-open', 'color': '#F59E0B'},
    {'name': 'Tagihan & Rutin', 'type': 'expense', 'icon': 'receipt', 'color': '#D97706'},
    {'name': 'Transfer & Kirim Uang', 'type': 'expense', 'icon': 'send', 'color': '#B45309'},
    {'name': 'Lainnya (Keluar)', 'type': 'expense', 'icon': 'minus-circle', 'color': '#92400E'},
]


class Command(BaseCommand):
    help = 'Seed default categories for all users'

    def handle(self, *args, **options):
        created_count = 0
        for cat_data in DEFAULT_CATEGORIES:
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                type=cat_data['type'],
                is_default=True,
                defaults={
                    'icon': cat_data['icon'],
                    'color': cat_data['color'],
                    'user': None,  # System default categories have no user
                }
            )
            if created:
                created_count += 1
                self.stdout.write(f'Created: {category.name} ({category.get_type_display()})')
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully seeded {created_count} default categories')
        )
