# ⚡ HackStack — Full-Stack Hackathon Boilerplate

**React 19 + TypeScript + Vite** · **Express.js + Prisma + PostgreSQL** · **Docker Ready**

---

## 📁 Project Structure

```
project-root/
│
├── backend/
│   ├── src/
│   │   ├── index.ts           # Express entry point
│   │   ├── config.ts          # Environment config + Prisma client
│   │   ├── routes/            # Express route handlers
│   │   ├── services/          # Business logic layer
│   │   ├── middleware/        # Auth, error handling, validation
│   │   ├── validators/        # Zod request/response schemas
│   │   └── utils/             # Password hashing, JWT, custom errors
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema (source of truth)
│   │   └── migrations/        # Prisma migration history
│   ├── tests/                 # Jest + Supertest test suite
│   ├── package.json
│   ├── tsconfig.json
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
| Backend    | http://localhost:5000         |
| Health     | http://localhost:5000/api/v1/health |
| PostgreSQL | localhost:5432               |

### Option 2: Local Development

**Backend:**
```bash
cd backend
npm install
cp ../.env.example .env    # or create backend/.env
npx prisma migrate dev
npm run dev
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
```

---

## 🧪 Testing

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

---

## 📋 API Endpoints

| Method | Endpoint             | Description        |
|--------|----------------------|--------------------|
| GET    | /api/v1/health       | Health check       |
| POST   | /api/v1/items        | Create item        |
| GET    | /api/v1/items        | List all items     |
| GET    | /api/v1/items/:id    | Get single item    |
| PUT    | /api/v1/items/:id    | Update item        |
| DELETE | /api/v1/items/:id    | Delete item        |

---

## 🏗️ Scalability Guide

**Adding a new entity** (e.g., `User`):

1. **Prisma Model** → `backend/prisma/schema.prisma`
2. **Migration** → `npx prisma migrate dev --name add_users`
3. **Validator** → `backend/src/validators/user.ts` (Zod schemas)
4. **Service** → `backend/src/services/user.service.ts`
5. **Route** → `backend/src/routes/users.ts`
6. **Register** → Add router in `src/index.ts`
7. **Frontend API** → `frontend/src/api/client.ts`
8. **Validator** → `frontend/src/validators/user.ts`
9. **Hook** → `frontend/src/hooks/useUsers.ts`
10. **Pages** → `frontend/src/pages/UsersList.tsx`, etc.

---

## 🛠️ Useful Commands

```bash
# Prisma
npx prisma migrate dev       # Create + apply migration
npx prisma migrate deploy    # Apply in production
npx prisma studio            # Visual DB browser
npx prisma generate          # Regenerate Prisma Client

# Backend
npm run dev                  # Start dev server (hot reload)
npm run build                # Compile TypeScript
npm test                     # Run tests
npx tsc --noEmit             # Type check
```

---

## 📖 More

- [Git Workflow](./GIT_WORKFLOW.md)
- [Health Check](http://localhost:5000/api/v1/health) (when running)
# Odoo-Hackathon-26
