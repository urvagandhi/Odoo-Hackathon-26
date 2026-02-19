# ⚡ HackStack — Full-Stack Hackathon Boilerplate

**React 18 + TypeScript + Vite** · **FastAPI + PostgreSQL** · **Docker Ready**

---

## 📁 Project Structure

```
project-root/
│
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI entry point
│   │   ├── config.py          # Pydantic settings
│   │   ├── database.py        # SQLAlchemy engine & session
│   │   ├── models/            # ORM models
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   ├── routes/            # API route handlers
│   │   ├── services/          # Business logic layer
│   │   └── core/              # Exceptions, middleware, utils
│   ├── tests/                 # PyTest test suite
│   ├── alembic/               # Database migrations
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── pages/             # Route-level page components
│   │   ├── components/        # Reusable UI components
│   │   ├── api/               # Axios client & API functions
│   │   ├── hooks/             # Custom React hooks
│   │   ├── routes/            # React Router configuration
│   │   ├── validators/        # Zod validation schemas
│   │   └── main.tsx           # App entry point
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── .github/agents/            # AI agent configurations
```

---

## 🚀 Quick Start

### Option 1: Docker (recommended)

```bash
cp .env.example .env
docker compose up --build
```

| Service    | URL                          |
|------------|------------------------------|
| Frontend   | http://localhost:3000         |
| Backend    | http://localhost:8000         |
| Swagger    | http://localhost:8000/docs    |
| PostgreSQL | localhost:5432               |

### Option 2: Local Development

**Backend:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Database:**
```bash
# Start PostgreSQL (e.g., via Docker)
docker run -d --name hackathon-db \
  -e POSTGRES_DB=hackathon_db \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 postgres:16-alpine

# Run migrations
cd backend && alembic upgrade head
```

---

## 🧪 Testing

```bash
# Backend
cd backend && pytest

# Frontend
cd frontend && npm test
```

---

## 📋 API Endpoints

| Method | Endpoint        | Description        |
|--------|-----------------|--------------------|
| GET    | /               | Health check       |
| POST   | /items          | Create item        |
| GET    | /items          | List all items     |
| GET    | /items/{id}     | Get single item    |
| PUT    | /items/{id}     | Update item        |
| DELETE | /items/{id}     | Delete item        |

---

## 🏗️ Scalability Guide

**Adding a new entity** (e.g., `User`):

1. **Model** → `backend/app/models/user.py`
2. **Schema** → `backend/app/schemas/user.py`
3. **Service** → `backend/app/services/user_service.py`
4. **Route** → `backend/app/routes/users.py`
5. **Register** → Add router in `main.py`
6. **Migration** → `alembic revision --autogenerate -m "add users"`
7. **Frontend API** → `frontend/src/api/client.ts`
8. **Validator** → `frontend/src/validators/user.ts`
9. **Hook** → `frontend/src/hooks/useUsers.ts`
10. **Pages** → `frontend/src/pages/UsersList.tsx`, etc.

---

## 📖 More

- [Git Workflow](./GIT_WORKFLOW.md)
- [Swagger Docs](http://localhost:8000/docs) (when running)
