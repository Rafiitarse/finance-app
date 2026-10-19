"""H-05: API docs are gated behind DEBUG or ENABLE_API_DOCS."""
import os
import subprocess
import sys
import tempfile

import pytest

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _url_names(env_overrides):
    env = dict(os.environ)
    for key in ('SECRET_KEY', 'DEBUG', 'ALLOWED_HOSTS', 'ENABLE_API_DOCS'):
        env.pop(key, None)
    env['DJANGO_SETTINGS_MODULE'] = 'config.settings'
    env['PYTHONPATH'] = BACKEND_DIR
    env.update(env_overrides)
    result = subprocess.run(
        [
            sys.executable, '-c',
            'import django; django.setup(); '
            'from config.urls import urlpatterns; '
            'print(",".join(u.name for u in urlpatterns if getattr(u, "name", None)))',
        ],
        cwd=tempfile.gettempdir(),
        env=env,
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, result.stderr
    return set(result.stdout.strip().split(','))


class TestApiDocsGating:
    def test_docs_hidden_in_production_without_flag(self):
        names = _url_names({
            'DEBUG': '0',
            'SECRET_KEY': 'x' * 60,
            'ALLOWED_HOSTS': 'example.com',
        })
        assert 'swagger-ui' not in names
        assert 'schema' not in names

    def test_docs_visible_with_flag(self):
        names = _url_names({
            'DEBUG': '0',
            'SECRET_KEY': 'x' * 60,
            'ALLOWED_HOSTS': 'example.com',
            'ENABLE_API_DOCS': '1',
        })
        assert 'swagger-ui' in names
        assert 'schema' in names

    def test_docs_visible_in_debug(self):
        names = _url_names({'DEBUG': '1'})
        assert 'swagger-ui' in names
