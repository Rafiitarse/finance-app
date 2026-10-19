# FinanceApp - Personal Finance Management

A full-stack personal finance management application built with Django REST Framework (backend) and Next.js (frontend).

## Tech Stack

### Backend
- **Django 5.0.6** - Web framework
- **Django REST Framework 3.15.2** - API framework
- **SimpleJWT 5.3.1** - JWT authentication (with token blacklist)
- **MySQL 8.x** - Database (SQLite in-memory for tests)
- **django-filter 24.2 / drf-spectacular 0.27.2** - Filtering & API docs
- **gunicorn 26.2.0 + whitenoise 6.12.0** - Production server & static files
- **pytest + pytest-django + factory-boy + freezegun** - Tests

### Frontend
- **Next.js 14.2.3** - React framework (App Router)
- **TypeScript 5.5.4** - Type safety
- **Tailwind CSS 3.4.7** - Styling
- **TanStack Query 5.51.15** - Server state management
- **Zustand 4.5.4** - Client state management
- **React Hook Form + Zod** - Form validation
- **Recharts** - Data visualization
- **Vitest 5** - Unit tests (`lib/utils`)

### Deployment
- **Vercel** - Frontend hosting
- **Railway/Render** - Backend hosting (gunicorn + WhiteNoise; MySQL)

## Features

- 🔐 **Authentication** - JWT auth (register, login, logout with real token revocation, refresh, change password, delete account)
- 💰 **Transactions** - CRUD for income/expense transactions with year/month/type filters and a 6-month trend endpoint
- 🏷️ **Categories** - Custom categories with icons & colors; unpaginated list; duplicate names rejected; deleting a category with transactions returns 409
- 📊 **Dashboard** - Monthly summary, 6-month trend chart (real data), category breakdown (per selected month)
- 📱 **Responsive** - Mobile-first design

## Project Structure

```
finance-app/
├── backend/                 # Django project
│   ├── config/             # Settings, settings_test, URLs
│   ├── core/               # User model, auth views (register/login/refresh/logout/me/change-password)
│   ├── transactions/       # Category & Transaction models, filters, trend endpoint
│   ├── assets/             # Empty placeholder package — not in INSTALLED_APPS
│   ├── tests/              # pytest suite (113 tests, SQLite in-memory)
│   ├── requirements.txt    # Runtime dependencies
│   ├── requirements-dev.txt # + pytest, factory-boy, freezegun, pip-audit
│   ├── Dockerfile          # Dev image (runserver via entrypoint)
│   ├── Dockerfile.prod     # Production image (gunicorn, non-root)
│   └── manage.py
├── frontend/               # Next.js project
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # Reusable components
│   │   ├── lib/           # API client, utilities
│   │   ├── hooks/         # Custom React hooks
│   │   └── types/         # TypeScript types
│   ├── package.json
│   ├── tailwind.config.ts
│   └── Dockerfile
├── docker-compose.yml      # Local development
└── README.md
```

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local frontend development)
- Python 3.12+ (for local backend development)

### Local Development with Docker

1. Clone the repository
2. Copy environment files:
   ```bash
   cp backend/.env.example backend/.env
   ```
3. Start all services:
   ```bash
   docker-compose up --build
   ```
4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api
   - API Docs: http://localhost:8000/api/docs/ (DEBUG=1 only)

### Local Development without Docker

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements-dev.txt   # includes runtime + test deps
cp .env.example .env
# Edit .env with your database settings
python manage.py migrate
python manage.py seed_default_categories
python manage.py runserver
```

#### Frontend
```bash
cd frontend
npm ci
cp .env.example .env.local
# Edit .env.local with your API URL
npm run dev
```

## Running Tests

Backend (no MySQL needed — tests use SQLite in-memory):

```bash
cd backend
pytest -q -p no:warnings          # 113 tests
python manage.py makemigrations --check --dry-run --settings=config.settings_test
```

Frontend:

```bash
cd frontend
npm run lint
npm run type-check
npm run test                      # vitest (lib/utils)
npm run build
```

## Environment Variables

### Backend (.env)

| Variable | Default | Notes |
|---|---|---|
| `DEBUG` | `0` | Must be `1` for dev; when `0` the app fails fast without a secure `SECRET_KEY` + `ALLOWED_HOSTS` |
| `SECRET_KEY` | — | Required when `DEBUG=0`; must not start with `django-insecure` |
| `ALLOWED_HOSTS` | — | Comma-separated; required when `DEBUG=0` |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | localhost / 3306 / finance_db / root / root | MySQL connection |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated allowlist |
| `SECURE_SSL_REDIRECT` | `1` when DEBUG=0 | |
| `SESSION_COOKIE_SECURE` / `CSRF_COOKIE_SECURE` | `1` when DEBUG=0 | |
| `SECURE_HSTS_SECONDS` | `0` | Raise to e.g. `31536000` once HTTPS is confirmed |
| `BEHIND_PROXY` | `0` | Set `1` behind a TLS-terminating proxy |
| `ENABLE_API_DOCS` | — | `1` exposes /api/docs even when DEBUG=0 |
| `THROTTLE_ANON_RATE` / `THROTTLE_USER_RATE` / `THROTTLE_AUTH_RATE` | `60/min` / `300/min` / `10/min` | Auth scope covers register/login/refresh/change-password |
| `RUN_MIGRATIONS` | `1` | `0` skips migrations in the entrypoint |
| `WEB_CONCURRENCY` | `3` | Gunicorn worker count |

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## API Endpoints

### Authentication (throttled: 10/min per IP by default)
- `POST /api/auth/register/` - Register new user (returns tokens for auto-login)
- `POST /api/auth/login/` - Login (returns access & refresh tokens + user)
- `POST /api/auth/refresh/` - Refresh access token
- `GET /api/auth/me/` - Get current user
- `PATCH /api/auth/me/` - Update profile (first_name, last_name, username, email — unique, case-insensitive email)
- `POST /api/auth/change-password/` - Change password (blacklists all refresh tokens, returns a new pair)
- `DELETE /api/auth/me/` - Delete account (body: `{ "password": "..." }`)
- `POST /api/auth/logout/` - Logout (blacklists refresh token)

### Categories
- `GET /api/categories/` - List all categories (user + defaults, unpaginated)
- `POST /api/categories/` - Create category (duplicate name+type → 400)
- `GET /api/categories/{id}/` - Get category
- `PATCH /api/categories/{id}/` - Update category (returns the full object)
- `DELETE /api/categories/{id}/` - Delete category (used by transactions → 409)
- `GET /api/categories/summary/` - Category breakdown (`?year=&month=` optional, defaults to Jakarta current month)

### Transactions
- `GET /api/transactions/` - List transactions (filters: `category`, `category__type`, `date`, `search`, `ordering`, `page`, `year`, `month`, `type`)
- `POST /api/transactions/` - Create transaction (amount must be > 0)
- `GET /api/transactions/{id}/` - Get transaction
- `PATCH /api/transactions/{id}/` - Update transaction (returns the full object)
- `DELETE /api/transactions/{id}/` - Delete transaction
- `GET /api/transactions/summary/` - Monthly summary (invalid year/month → 400)
- `GET /api/transactions/trend/` - 6-month trend (`?months=1..24&year=&month=`, zero-filled, Jakarta timezone)

## Deployment

### Backend (Railway/Render)
1. Connect GitHub repository
2. Add MySQL database
3. Set environment variables (`DEBUG=0`, secure `SECRET_KEY`, `ALLOWED_HOSTS`, DB values, `BEHIND_PROXY=1` behind the platform proxy)
4. Deploy — the production image (`Dockerfile.prod`) runs gunicorn with WhiteNoise; migrations and seeding run as release commands

Periodic cleanup: `python manage.py flushexpiredtokens` removes expired blacklisted tokens.

### Frontend (Vercel)
1. Import GitHub repository
2. Set `NEXT_PUBLIC_API_URL` to production backend URL
3. Deploy

## Security Notes

- **Logout semantics**: logout blacklists the refresh token, but the access token stays valid until it expires (at most 60 minutes). This is accepted.
- **Cookies are readable by JavaScript (XSS risk)**: access/refresh tokens are stored in regular cookies (`HttpOnly` not set) so `middleware.ts` can see them. An XSS vulnerability would allow token theft. Recommended next step: HttpOnly cookies via Next.js route handlers (backend-for-frontend pattern).
- **`secure` flag is production-only**: a production build served over plain HTTP (e.g. a LAN IP) will not send cookies — production must use HTTPS.
- **Throttling cache is per-process** (locmem): limits are per worker unless a shared cache (e.g. Redis) is configured.
- **API docs are hidden in production** unless `ENABLE_API_DOCS=1`.

## Future Enhancements

- 📄 **Reports** - PDF/Excel export
- 💰 **Budgeting** - Monthly budget per category
- 🔄 **Recurring Transactions** - Automatic recurring entries
- 🌍 **Multi-currency** - Support multiple currencies
- 🔔 **Notifications** - Budget alerts, bill reminders
- 🍪 **HttpOnly cookies via BFF** - Move token storage server-side

## License

MIT License - feel free to use this project for personal or commercial purposes.
