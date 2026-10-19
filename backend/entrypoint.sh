#!/bin/bash
set -e

echo "Waiting for database..."
python manage.py wait_for_db

if [ "$RUN_MIGRATIONS" != "0" ]; then
  echo "Running migrations..."
  python manage.py migrate
fi

echo "Seeding default categories..."
python manage.py seed_default_categories

if [ "$DEBUG" = "1" ]; then
  echo "Starting dev server..."
  exec python manage.py runserver 0.0.0.0:8000
else
  echo "Collecting static files..."
  python manage.py collectstatic --noinput
  echo "Starting gunicorn..."
  exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers ${WEB_CONCURRENCY:-3}
fi
