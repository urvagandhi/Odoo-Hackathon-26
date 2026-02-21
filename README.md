# 🚛 FleetFlow — Fleet Management System

**Odoo Hackathon 2026** · **React 19 + TypeScript + Vite** · **Express.js + Prisma + PostgreSQL**

> A comprehensive fleet management platform for vehicle tracking, driver management, trip dispatching, maintenance scheduling, and financial analytics.

---

## ✨ Features

- **Vehicle Registry** — Full CRUD for fleet vehicles with status tracking (Active, Maintenance, Retired)
- **Driver Management** — Driver profiles, license tracking, status management
- **Trip Dispatcher** — Create, assign, and track trips with real-time status updates
- **Maintenance & Finance** — Fuel logs, maintenance records, expense tracking
- **Dashboard & Analytics** — KPIs, monthly trends, driver performance, fuel efficiency charts
- **Role-Based Access Control** — Manager, Dispatcher, Safety Officer, Finance Analyst
- **Dark Mode** — Full dark theme support across all pages
- **Responsive Design** — Mobile-friendly layout with Tailwind CSS

---

## 📁 Project Structure

```
project-root/
├── backend/
│   ├── src/
│   │   ├── app.ts                # Express app setup
│   │   ├── server.ts             # Server entry point
│   │   ├── prisma.ts             # Prisma client singleton
│   │   ├── config/env.ts         # Environment config
│   │   ├── middleware/           # Auth, RBAC, audit logging, error handler
│   │   └── modules/
│   │       ├── auth/             # JWT authentication & password management
│   │       ├── fleet/            # Vehicle CRUD
│   │       ├── hr/               # Driver management
│   │       ├── dispatch/         # Trip management
│   │       ├── finance/          # Fuel, maintenance, expenses
│   │       └── locations/        # Vehicle locations & analytics
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema
│   │   ├── seed.ts               # Comprehensive seed data
│   │   └── migrations/           # Migration history
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/                # Dashboard, Fleet, Drivers, Trips, Finance, etc.
│   │   ├── components/           # Reusable UI (DataTable, PageHeader, Charts, etc.)
│   │   ├── layouts/              # Dashboard, CRUD, Settings, Profile layouts
│   │   ├── api/client.ts         # Typed Axios API clients
│   │   ├── context/              # Auth, Theme, Toast providers
│   │   ├── hooks/                # Custom React hooks
│   │   └── routes/router.tsx     # React Router configuration
│   └── package.json
│
├── docker-compose.yml
└── docs/                          # Architecture & planning docs
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **PostgreSQL** 16+ (or Docker)

### 1. Database

```bash
# Via Docker
docker compose up -d db

# Or use an existing PostgreSQL instance
```

### 2. Backend

```bash
cd backend
npm install
npx prisma migrate dev
npx prisma db seed          # Load demo data
npm run dev                 # Starts on http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                 # Starts on http://localhost:5175
```

### Demo Credentials

| Role             | Email                        | Password         |
|------------------|------------------------------|-------------------|
| Fleet Manager    | manager@fleetflow.io         | FleetFlow@2025   |
| Dispatcher       | dispatcher@fleetflow.io      | FleetFlow@2025   |
| Safety Officer   | safety@fleetflow.io          | FleetFlow@2025   |
| Finance Analyst  | finance@fleetflow.io         | FleetFlow@2025   |

---

## 📋 API Endpoints

| Method | Endpoint                        | Description              |
|--------|---------------------------------|--------------------------|
| POST   | /api/v1/auth/login              | Login                    |
| POST   | /api/v1/auth/register           | Register                 |
| PUT    | /api/v1/auth/change-password    | Change password          |
| GET    | /api/v1/fleet                   | List vehicles            |
| POST   | /api/v1/fleet                   | Create vehicle           |
| GET    | /api/v1/hr/drivers              | List drivers             |
| POST   | /api/v1/hr/drivers              | Create driver            |
| GET    | /api/v1/dispatch/trips          | List trips               |
| POST   | /api/v1/dispatch/trips          | Create trip              |
| GET    | /api/v1/finance/fuel-logs       | List fuel logs           |
| GET    | /api/v1/finance/expenses        | List expenses            |
| GET    | /api/v1/locations/analytics/kpi | Dashboard KPIs           |

---

## 🛠️ Tech Stack

| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Frontend   | React 19, TypeScript, Vite, Tailwind CSS 4    |
| Backend    | Express.js, TypeScript, Prisma ORM            |
| Database   | PostgreSQL 18                                 |
| Auth       | JWT + bcrypt, Role-Based Access Control       |
| Validation | Zod (shared schemas)                          |
| Charts     | Recharts                                      |
| Animations | Framer Motion                                 |

---

## 👥 Team

Built for **Odoo Hackathon 2026** 🏆
