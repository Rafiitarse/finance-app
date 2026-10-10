"""
Test factories using factory_boy.
"""
import factory
from factory.django import DjangoModelFactory

from core.models import User
from transactions.models import Category, Transaction


class UserFactory(DjangoModelFactory):
    """Factory for User model."""

    class Meta:
        model = User
        django_get_or_create = ('email',)

    username = factory.Sequence(lambda n: f'user{n}')
    email = factory.Sequence(lambda n: f'user{n}@example.com')
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    password = factory.PostGenerationMethodCall('set_password', 'testpass123')

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """Use create_user to properly hash password."""
        manager = model_class._default_manager
        return manager.create_user(*args, **kwargs)


class CategoryFactory(DjangoModelFactory):
    """Factory for Category model."""

    class Meta:
        model = Category

    user = factory.SubFactory(UserFactory)
    name = factory.Sequence(lambda n: f'Category {n}')
    type = factory.Iterator(['income', 'expense'])
    icon = 'tag'
    color = '#3B82F6'
    is_default = False


class DefaultCategoryFactory(DjangoModelFactory):
    """Factory for default (system) Category model."""

    class Meta:
        model = Category

    name = factory.Sequence(lambda n: f'Default Category {n}')
    type = factory.Iterator(['income', 'expense'])
    icon = 'tag'
    color = '#3B82F6'
    is_default = True
    user = None


class TransactionFactory(DjangoModelFactory):
    """Factory for Transaction model."""

    class Meta:
        model = Transaction

    user = factory.SubFactory(UserFactory)
    category = factory.SubFactory(CategoryFactory)
    amount = factory.Faker('pydecimal', left_digits=5, right_digits=2, positive=True)
    description = factory.Faker('sentence')
    date = factory.Faker('date_between', start_date='-30d', end_date='today')