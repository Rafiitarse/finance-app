"""H-01: settings must fail fast on insecure production configuration."""
import os
import subprocess
import sys
import tempfile

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _import_settings(env_overrides):
    env = dict(os.environ)
    for key in ('SECRET_KEY', 'DEBUG', 'ALLOWED_HOSTS'):
        env.pop(key, None)
    env['DJANGO_SETTINGS_MODULE'] = 'config.settings'
    # Run from a neutral cwd so load_dotenv() cannot pick up backend/.env —
    # the point of these tests is the settings module in isolation.
    env['PYTHONPATH'] = BACKEND_DIR
    env.update(env_overrides)
    return subprocess.run(
        [sys.executable, '-c', 'import config.settings'],
        cwd=tempfile.gettempdir(),
        env=env,
        capture_output=True,
        text=True,
    )


class TestSettingsFailFast:
    def test_missing_secret_key_with_debug_off_fails(self):
        result = _import_settings({'DEBUG': '0', 'ALLOWED_HOSTS': 'example.com'})
        assert result.returncode != 0
        assert 'SECRET_KEY' in result.stderr

    def test_insecure_secret_key_with_debug_off_fails(self):
        result = _import_settings({
            'DEBUG': '0',
            'SECRET_KEY': 'django-insecure-something',
            'ALLOWED_HOSTS': 'example.com',
        })
        assert result.returncode != 0
        assert 'SECRET_KEY' in result.stderr

    def test_missing_allowed_hosts_with_debug_off_fails(self):
        result = _import_settings({'DEBUG': '0', 'SECRET_KEY': 'x' * 60})
        assert result.returncode != 0
        assert 'ALLOWED_HOSTS' in result.stderr

    def test_debug_on_without_secret_key_still_works(self):
        result = _import_settings({'DEBUG': '1'})
        assert result.returncode == 0
