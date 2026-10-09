# FinanceApp - Personal Finance Management

A full-stack personal finance management application built with Django REST Framework (backend) and Next.js (frontend).

## Tech Stack

### Backend
- **Django 5.x** - Web framework
- **Django REST Framework** - API framework
- **SimpleJWT** - JWT authentication
- **MySQL 8.x** - Database
- **drf-spectacular** - API documentation

### Frontend
- **Next.js 14** - React framework (App Router)
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **TanStack Query** - Server state management
- **Zustand** - Client state management
- **React Hook Form + Zod** - Form validation
- **Recharts** - Data visualization
- **Lucide React** - Icons

### Deployment
- **Vercel** - Frontend hosting
- **Railway/Render** - Backend hosting

## Features (MVP)

- 🔐 **Authentication** - JWT-based auth (register, login, logout, token refresh)
- 💰 **Transactions** - CRUD for income/expense transactions
- 🏷️ **Categories** - Custom categories with icons & colors
- 📊 **Dashboard** - Monthly summary, charts, category breakdown
- 📱 **Responsive** - Mobile-first design

## Project Structure

```
finance-app/
├── backend/                 # Django project
│   ├── config/             # Settings & URLs
│   ├── core/               # User model & auth
│   ├── transactions/       # Category & Transaction models
│   ├── requirements.txt
│   ├── Dockerfile
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
   - API Docs: http://localhost:8000/api/docs/

### Local Development without Docker

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your database settings
python manage.py migrate
python manage.py seed_default_categories
python manage.py runserver
```

#### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your API URL
npm run dev
```

## Environment Variables

### Backend (.env)
```env
DEBUG=1
SECRET_KEY=your-secret-key
DB_HOST=localhost
DB_PORT=3306
DB_NAME=finance_db
DB_USER=root
DB_PASSWORD=root
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login (returns access & refresh tokens)
- `POST /api/auth/refresh/` - Refresh access token
- `GET /api/auth/me/` - Get current user
- `POST /api/auth/logout/` - Logout (blacklist refresh token)

### Categories
- `GET /api/categories/` - List categories (user + defaults)
- `POST /api/categories/` - Create category
- `GET /api/categories/{id}/` - Get category
- `PATCH /api/categories/{id}/` - Update category
- `DELETE /api/categories/{id}/` - Delete category
- `GET /api/categories/summary/` - Category breakdown (current month)

### Transactions
- `GET /api/transactions/` - List transactions (with filters)
- `POST /api/transactions/` - Create transaction
- `GET /api/transactions/{id}/` - Get transaction
- `PATCH /api/transactions/{id}/` - Update transaction
- `DELETE /api/transactions/{id}/` - Delete transaction
- `GET /api/transactions/summary/` - Monthly summary

## Deployment

### Backend (Railway)
1. Connect GitHub repository
2. Add MySQL database
3. Set environment variables
4. Deploy

### Frontend (Vercel)
1. Import GitHub repository
2. Set `NEXT_PUBLIC_API_URL` to production backend URL
3. Deploy

## Future Enhancements

- 📈 **Investments/Tabungan** - Track investments and savings
- 🏠 **Assets** - Manage assets (property, vehicles, etc.)
- 📄 **Reports** - PDF/Excel export
- 💰 **Budgeting** - Monthly budget per category
- 🔄 **Recurring Transactions** - Automatic recurring entries
- 🌍 **Multi-currency** - Support multiple currencies
- 🔔 **Notifications** - Budget alerts, bill reminders

## License

MIT License - feel free to use this project for personal or commercial purposes.
