"""H-03: auth endpoints are rate-limited via ScopedRateThrottle."""
from unittest.mock import patch

import pytest
from rest_framework import status
from rest_framework.throttling import ScopedRateThrottle


@pytest.mark.django_db
class TestAuthThrottle:
    def test_login_throttled_after_limit(self, api_client, user):
        with patch.object(ScopedRateThrottle, 'THROTTLE_RATES', {'auth': '2/min'}):
            codes = []
            for _ in range(3):
                response = api_client.post(
                    '/api/auth/login/',
                    {'email': user.email, 'password': 'wrongpassword'},
                    format='json',
                )
                codes.append(response.status_code)
        # First two requests pass the throttle (401 = wrong password), the
        # third is rejected by the throttle before reaching the view.
        assert codes[0] == status.HTTP_401_UNAUTHORIZED
        assert codes[1] == status.HTTP_401_UNAUTHORIZED
        assert codes[2] == status.HTTP_429_TOO_MANY_REQUESTS

    def test_register_throttled_after_limit(self, api_client):
        with patch.object(ScopedRateThrottle, 'THROTTLE_RATES', {'auth': '2/min'}):
            codes = []
            for i in range(3):
                response = api_client.post(
                    '/api/auth/register/',
                    {
                        'username': f'throttleuser{i}',
                        'email': f'throttle{i}@example.com',
                        'password': 'Xq7#tRz2Lm9v',
                        'password_confirm': 'Xq7#tRz2Lm9v',
                    },
                    format='json',
                )
                codes.append(response.status_code)
        assert codes[2] == status.HTTP_429_TOO_MANY_REQUESTS
