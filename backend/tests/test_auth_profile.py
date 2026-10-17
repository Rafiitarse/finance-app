"""
Phase 3 backend tests:
- A-02: PATCH /api/auth/me/ updates the real profile
- A-03: POST /api/auth/change-password/ really changes the password
- A-04: DELETE /api/auth/me/ really deletes the account (password required)
- A-06: emails are stored lowercase and unique case-insensitively; login is case-insensitive
"""
import pytest

from django.contrib.auth import get_user_model

from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from tests.factories import CategoryFactory, DefaultCategoryFactory, TransactionFactory
from transactions.models import Category, Transaction

User = get_user_model()

USER_PASSWORD = 'testpass123'  # password set by UserFactory
NEW_PASSWORD = 'Xq7#tRz2Lm9v'


@pytest.mark.django_db
class TestProfileUpdate:
    """A-02 — PATCH /api/auth/me/"""

    def test_patch_updates_first_last_username_email(self, auth_client, user):
        response = auth_client.patch(
            '/api/auth/me/',
            {
                'first_name': 'Budi',
                'last_name': 'Santoso',
                'username': 'budisantoso',
                'email': 'Budi.Santoso@Example.com',
            },
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['first_name'] == 'Budi'
        assert response.data['last_name'] == 'Santoso'
        assert response.data['username'] == 'budisantoso'
        assert response.data['email'] == 'budi.santoso@example.com'
        user.refresh_from_db()
        assert user.first_name == 'Budi'
        assert user.last_name == 'Santoso'
        assert user.username == 'budisantoso'
        assert user.email == 'budi.santoso@example.com'

    def test_patch_username_clash_with_other_user_returns_400(self, auth_client, user, other_user):
        original_username = user.username
        response = auth_client.patch(
            '/api/auth/me/',
            {'username': other_user.username},
            format='json',
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'username' in response.data
        user.refresh_from_db()
        assert user.username == original_username

    def test_patch_email_clash_case_insensitive_returns_400(self, auth_client, user, other_user):
        response = auth_client.patch(
            '/api/auth/me/',
            {'email': other_user.email.upper()},
            format='json',
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'email' in response.data
        user.refresh_from_db()
        assert user.email != other_user.email.upper()

    def test_patch_keeping_own_email_uppercased_succeeds(self, auth_client, user):
        original_email = user.email
        response = auth_client.patch(
            '/api/auth/me/',
            {'email': original_email.upper()},
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == original_email.lower()
        user.refresh_from_db()
        assert user.email == original_email.lower()

    def test_patch_requires_authentication(self, api_client):
        response = api_client.patch(
            '/api/auth/me/',
            {'first_name': 'NoToken'},
            format='json',
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_patch_cannot_assume_other_users_identity(self, auth_client, user, other_user_client, other_user):
        original_username = user.username
        original_email = user.email
        response = other_user_client.patch(
            '/api/auth/me/',
            {'username': original_username, 'email': original_email},
            format='json',
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'username' in response.data
        assert 'email' in response.data
        user.refresh_from_db()
        assert user.username == original_username
        assert user.email == original_email
        other_user.refresh_from_db()
        assert other_user.username != original_username
        assert other_user.email != original_email


@pytest.mark.django_db
class TestChangePassword:
    """A-03 — POST /api/auth/change-password/"""

    url = '/api/auth/change-password/'

    def test_wrong_current_password_returns_400(self, auth_client, user):
        response = auth_client.post(
            self.url,
            {'current_password': 'not-my-password', 'new_password': NEW_PASSWORD},
            format='json',
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'current_password' in response.data
        user.refresh_from_db()
        assert user.check_password(USER_PASSWORD)

    def test_weak_new_password_returns_400_on_new_password(self, auth_client, user):
        response = auth_client.post(
            self.url,
            {'current_password': USER_PASSWORD, 'new_password': 'abc'},
            format='json',
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'new_password' in response.data
        user.refresh_from_db()
        assert user.check_password(USER_PASSWORD)

    def test_success_blacklists_all_old_refresh_tokens_and_new_pair_works(self, auth_client, user, api_client):
        old_refresh_1 = str(RefreshToken.for_user(user))
        old_refresh_2 = str(RefreshToken.for_user(user))

        response = auth_client.post(
            self.url,
            {'current_password': USER_PASSWORD, 'new_password': NEW_PASSWORD},
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK
        new_access = response.data['access']
        new_refresh = response.data['refresh']
        assert new_access
        assert new_refresh

        # Every old refresh token is blacklisted now.
        for old_refresh in (old_refresh_1, old_refresh_2):
            refresh_response = api_client.post(
                '/api/auth/refresh/',
                {'refresh': old_refresh},
                format='json',
            )
            assert refresh_response.status_code == status.HTTP_401_UNAUTHORIZED

        # The new pair works.
        me_response = api_client.get(
            '/api/auth/me/',
            HTTP_AUTHORIZATION=f'Bearer {new_access}',
        )
        assert me_response.status_code == status.HTTP_200_OK
        refresh_response = api_client.post(
            '/api/auth/refresh/',
            {'refresh': new_refresh},
            format='json',
        )
        assert refresh_response.status_code == status.HTTP_200_OK

        # Login works with the new password and fails with the old one.
        login_new = api_client.post(
            '/api/auth/login/',
            {'email': user.email, 'password': NEW_PASSWORD},
            format='json',
        )
        assert login_new.status_code == status.HTTP_200_OK
        login_old = api_client.post(
            '/api/auth/login/',
            {'email': user.email, 'password': USER_PASSWORD},
            format='json',
        )
        assert login_old.status_code == status.HTTP_401_UNAUTHORIZED

    def test_requires_authentication(self, api_client):
        response = api_client.post(
            self.url,
            {'current_password': USER_PASSWORD, 'new_password': NEW_PASSWORD},
            format='json',
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestDeleteAccount:
    """A-04 — DELETE /api/auth/me/"""

    def test_user_with_custom_category_and_transactions_is_deleted(self, auth_client, user, other_user_client, other_user):
        custom_category = CategoryFactory(user=user, name='Groceries', type='expense')
        default_category = DefaultCategoryFactory()
        tx_custom = TransactionFactory(user=user, category=custom_category)
        tx_default = TransactionFactory(user=user, category=default_category)
        other_category = CategoryFactory(user=other_user, name='Other stuff', type='expense')
        other_tx = TransactionFactory(user=other_user, category=other_category)

        response = auth_client.delete(
            '/api/auth/me/',
            {'password': USER_PASSWORD},
            format='json',
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT

        # The user and all their own data are gone.
        assert not User.objects.filter(pk=user.pk).exists()
        assert not Transaction.objects.filter(pk=tx_custom.pk).exists()
        assert not Transaction.objects.filter(pk=tx_default.pk).exists()
        assert not Category.objects.filter(pk=custom_category.pk).exists()

        # Other users' data is untouched.
        assert User.objects.filter(pk=other_user.pk).exists()
        assert Transaction.objects.filter(pk=other_tx.pk).exists()
        assert Category.objects.filter(pk=other_category.pk).exists()

        # System default categories (user=NULL) are untouched.
        assert Category.objects.filter(pk=default_category.pk).exists()

    def test_wrong_password_returns_400_and_deletes_nothing(self, auth_client, user):
        custom_category = CategoryFactory(user=user, name='Groceries', type='expense')
        tx = TransactionFactory(user=user, category=custom_category)

        response = auth_client.delete(
            '/api/auth/me/',
            {'password': 'wrong-password'},
            format='json',
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'password' in response.data
        assert User.objects.filter(pk=user.pk).exists()
        assert Transaction.objects.filter(pk=tx.pk).exists()
        assert Category.objects.filter(pk=custom_category.pk).exists()

    def test_requires_authentication(self, api_client):
        response = api_client.delete(
            '/api/auth/me/',
            {'password': USER_PASSWORD},
            format='json',
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestEmailNormalization:
    """A-06 — lowercase emails, case-insensitive uniqueness and login."""

    def _register(self, client, username, email):
        return client.post(
            '/api/auth/register/',
            {
                'username': username,
                'email': email,
                'password': NEW_PASSWORD,
                'password_confirm': NEW_PASSWORD,
                'first_name': 'Test',
                'last_name': 'User',
            },
            format='json',
        )

    def test_register_stores_email_lowercase_and_rejects_case_variant(self, api_client):
        first = self._register(api_client, 'alice', 'A@x.com')
        assert first.status_code == status.HTTP_201_CREATED
        assert User.objects.get(username='alice').email == 'a@x.com'

        second = self._register(api_client, 'alice2', 'a@x.com')
        assert second.status_code == status.HTTP_400_BAD_REQUEST
        assert 'email' in second.data
        assert User.objects.filter(email__iexact='a@x.com').count() == 1

    def test_login_with_mixed_case_email_succeeds(self, api_client):
        assert self._register(api_client, 'bob', 'B@x.com').status_code == status.HTTP_201_CREATED
        response = api_client.post(
            '/api/auth/login/',
            {'email': 'B@X.COM', 'password': NEW_PASSWORD},
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['access']
        assert response.data['user']['email'] == 'b@x.com'
