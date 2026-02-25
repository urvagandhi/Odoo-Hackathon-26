<div align="center">

# 🚛 FleetFlow

### Modular Fleet & Logistics Management System

**Odoo Hackathon 2026 · 8-Hour Sprint · Team FleetFlow**

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?logo=prisma&logoColor=white)](https://prisma.io)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

[Frontend Docs](./frontend/README.md) · [Backend Docs](./backend/README.md) · [System Blueprint](./docs/FLEETFLOW_MASTER_PLAN.md) · [Live Demo](#) · [API Docs](http://localhost:5000/api/docs)

</div>

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Folder Structure](#3-folder-structure)
4. [Application Workflow](#4-application-workflow)
5. [UML Diagrams](#5-uml-diagrams)
6. [Tech Stack Explanation](#6-tech-stack-explanation)
7. [Environment Setup](#7-environment-setup)
8. [API Documentation](#8-api-documentation)
9. [Database Design](#9-database-design)
10. [Security Architecture](#10-security-architecture)
11. [DevOps & Deployment](#11-devops--deployment)
12. [Testing Strategy](#12-testing-strategy)
13. [Coding Standards](#13-coding-standards)
14. [Contribution Guidelines](#14-contribution-guidelines)
15. [Roadmap](#15-roadmap)
16. [Known Issues & Limitations](#16-known-issues--limitations)
17. [FAQ](#17-faq)
18. [License](#18-license)
19. [Maintainers](#19-maintainers)
20. [Appendix](#20-appendix)

---

## 1. Project Overview

### Executive Summary

FleetFlow is a **production-grade, full-stack fleet and logistics management platform** built to digitally transform how organizations manage their vehicle fleets, dispatch operations, driver compliance, fuel consumption, and financial reporting. It replaces fragmented paper logbooks and Excel spreadsheets with a unified, automated, role-aware system.

### Business Problem

Fleet operations in mid-to-large enterprises suffer from:

| Problem | Impact |
|---|---|
| Paper-based logbooks & manual spreadsheets | Error-prone data, no real-time visibility |
| No capacity validation at dispatch | Overburdened vehicles, safety risks |
| No centralized driver compliance tracking | License expiry goes unnoticed, legal exposure |
| Fuel cost tracked ad hoc | Leakage, waste, inability to compute true trip cost |
| Zero incident management workflow | Safety events go untracked, patterns missed |
| No KPI dashboard for management | Decisions made on stale or absent data |

### Solution Approach

FleetFlow provides a **modular, API-first** solution with:

- **State machines** enforced server-side (vehicle: `AVAILABLE → ON_TRIP → IN_SHOP → RETIRED`, trip: `DRAFT → DISPATCHED → COMPLETED`)
- **Role-based access control** (Manager, Dispatcher, Safety Officer, Finance Analyst)
- **Real-time updates** via Socket.IO on live trips and GPS location events
- **Automated compliance cron jobs** (license expiry, document expiry alerts)
- **Immutable audit trail** on every state-mutating operation
- **Analytics engine** with cost-per-km, ROI, fuel efficiency, and utilization rate

### Key Features

| Module | Features |
|---|---|
| 🚗 **Fleet Registry** | Vehicle CRUD, state machine, soft delete, compliance docs |
| 🧑‍✈️ **HR / Drivers** | Driver profiles, license class & expiry, safety score, duty status |
| 📦 **Dispatch** | Trip lifecycle, vehicle+driver validation, waypoints, cargo weight check |
| ⛽ **Finance** | Fuel logs, operational expenses, revenue tracking per trip |
| 🔧 **Maintenance** | Service log, shop tracking, next-service scheduler |
| 🛡️ **Incidents** | Safety event filing, status lifecycle, damage estimates |
| 📍 **Locations** | Real-time GPS telemetry, per-vehicle history |
| 📊 **Analytics** | Command center KPIs, fuel efficiency, ROI, utilization, PDF/CSV export |
| 🔐 **Auth** | JWT access tokens, bcrypt passwords, password reset, rate limiting |

### High-Level Architecture

FleetFlow follows a **three-tier architecture**:

```
┌────────────────────────────────────────────────────────────────┐
│  PRESENTATION TIER  │  React 19 SPA · Vite · Tailwind CSS     │
│  (Browser Client)   │  Recharts · Leaflet · Framer Motion      │
├────────────────────────────────────────────────────────────────┤
│  APPLICATION TIER   │  Express.js · TypeScript · Prisma ORM   │
│  (REST API + WSS)   │  Socket.IO · Zod · JWT · Swagger         │
├────────────────────────────────────────────────────────────────┤
│  DATA TIER          │  PostgreSQL 16 · Prisma Migrations       │
│  (Persistence)      │  3NF Normalized · State-Machine Indexes  │
└────────────────────────────────────────────────────────────────┘
```

---

## 2. System Architecture

### Logical Architecture

```mermaid
graph TB
    subgraph Client["Browser Client"]
        UI[React 19 SPA]
        Router[React Router v7]
        Context[Auth + Theme Context]
        Charts[Recharts + Leaflet]
    end

    subgraph Gateway["API Gateway Layer"]
        Helmet[Helmet Security Headers]
        CORS[CORS Policy]
        RateLimit[Rate Limiter]
        Logger[Morgan Logger]
    end

    subgraph API["Business Modules - Express.js"]
        Auth["/api/v1/auth"]
        Fleet["/api/v1/vehicles"]
        Dispatch["/api/v1/trips"]
        HR["/api/v1/drivers"]
        Finance["/api/v1/finance"]
        Analytics["/api/v1/analytics"]
        Incidents["/api/v1/incidents"]
        Locations["/api/v1/locations"]
        Me["/api/v1/me"]
    end

    subgraph Services["Service Layer"]
        AuthSvc[Auth Service]
        FleetSvc[Fleet Service]
        DispatchSvc[Dispatch Service]
        StateMachine[State Machine Enforcer]
        AuditSvc[Audit Log Service]
        CronJobs[Cron Jobs]
    end

    subgraph Data["Data Layer"]
        Prisma[Prisma ORM]
        PG[(PostgreSQL 16)]
    end

    subgraph Realtime["Real-time"]
        SocketIO[Socket.IO Server]
    end

    UI --> Gateway
    Gateway --> API
    API --> Services
    Services --> Prisma
    Prisma --> PG
    SocketIO <--> UI
    SocketIO <--> API
```

### Component Interactions

```mermaid
graph LR
    subgraph Frontend
        Page[Page Component]
        Hook[Custom Hook]
        ApiClient[Axios API Client]
    end

    subgraph Backend
        Router[Express Router]
        Middleware[Auth + Validation Middleware]
        Service[Service Layer]
        ORM[Prisma Client]
    end

    DB[(PostgreSQL)]

    Page --> Hook --> ApiClient
    ApiClient -->|HTTP + JWT| Router
    Router --> Middleware --> Service --> ORM --> DB
    ORM --> Service --> Router -->|JSON Response| ApiClient
    ApiClient --> Hook --> Page
```

### Deployment Architecture

```mermaid
graph TB
    subgraph DockerCompose["docker-compose.yml"]
        subgraph Frontend["frontend:3000"]
            ViteApp[Vite Dev Server / Nginx]
        end
        subgraph Backend["backend:5000"]
            ExpressApp[Express.js App]
        end
        subgraph Database["postgres:5432"]
            PGContainer[PostgreSQL 16 Alpine]
        end
    end

    Browser[Browser] -->|HTTP :3000| ViteApp
    ViteApp -->|Proxy /api/*| ExpressApp
    ExpressApp -->|TCP :5432| PGContainer

    subgraph Volumes
        PGData[(pg_data volume)]
    end

    PGContainer --- PGData
```

---

## 3. Folder Structure

```
Odoo-Hackathon-2026/
│
├── 📁 backend/                     # Express.js API server
│   ├── 📁 src/
│   │   ├── app.ts                  # Express app factory (middleware + routes)
│   │   ├── server.ts               # HTTP server entry point + Socket.IO bootstrap
│   │   ├── prisma.ts               # Singleton Prisma client
│   │   ├── 📁 config/
│   │   │   ├── env.ts              # Zod-validated environment config
│   │   │   └── swagger.ts          # Swagger/OpenAPI spec builder
│   │   ├── 📁 middleware/
│   │   │   ├── authenticate.ts     # JWT verification middleware
│   │   │   ├── authorize.ts        # Role-based authorization guard
│   │   │   ├── errorHandler.ts     # Global error handler
│   │   │   ├── validate.ts         # Zod schema request validator
│   │   │   └── auditLogger.ts      # Audit trail middleware
│   │   ├── 📁 modules/             # Feature-first module structure
│   │   │   ├── 📁 auth/            # Login, register, password reset
│   │   │   ├── 📁 fleet/           # Vehicle CRUD + state machine
│   │   │   ├── 📁 dispatch/        # Trip creation, dispatch, completion
│   │   │   ├── 📁 hr/              # Driver management
│   │   │   ├── 📁 finance/         # Fuel logs, expenses
│   │   │   ├── 📁 analytics/       # KPI aggregations
│   │   │   ├── 📁 incidents/       # Safety incident reporting
│   │   │   ├── 📁 locations/       # GPS telemetry
│   │   │   └── 📁 me/              # Authenticated user profile
│   │   ├── 📁 services/            # Cross-cutting services (email, etc.)
│   │   ├── 📁 sockets/             # Socket.IO event handlers
│   │   └── 📁 jobs/                # node-cron scheduled jobs
│   ├── 📁 prisma/
│   │   ├── schema.prisma           # Database schema — source of truth
│   │   ├── seed.ts                 # Demo data seeder
│   │   └── 📁 migrations/          # Prisma migration history
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── 📁 frontend/                    # React 19 SPA
│   ├── 📁 src/
│   │   ├── main.tsx                # React entry point
│   │   ├── index.css               # Global Tailwind CSS base
│   │   ├── 📁 api/                 # Axios client + typed API wrappers
│   │   ├── 📁 components/
│   │   │   ├── Layout.tsx          # Root shell (sidebar + outlet)
│   │   │   ├── Navbar.tsx          # Top navigation bar
│   │   │   ├── ProtectedRoute.tsx  # Auth guard wrapper
│   │   │   ├── 📁 ui/              # Reusable primitive components
│   │   │   ├── 📁 forms/           # Domain-specific form components
│   │   │   ├── 📁 navigation/      # Sidebar, breadcrumbs
│   │   │   └── 📁 feedback/        # Toasts, modals, empty states
│   │   ├── 📁 context/             # React Context providers
│   │   ├── 📁 hooks/               # Custom React hooks
│   │   ├── 📁 layouts/             # Page layout wrappers
│   │   ├── 📁 pages/               # Route-level page components
│   │   ├── 📁 routes/              # React Router v7 config
│   │   └── 📁 validators/          # Zod frontend schemas
│   ├── vite.config.ts
│   ├── tsconfig.app.json
│   ├── package.json
│   └── Dockerfile
│
├── 📁 docs/
│   ├── FLEETFLOW_MASTER_PLAN.md    # Complete system design blueprint
│   └── PHASE_EXECUTION_PLAN.md     # Sprint execution plan
│
├── 📁 .github/
│   └── 📁 agents/                  # AI agent configuration files
│
├── docker-compose.yml              # Multi-service container orchestration
├── .env.example                    # Environment variable template
├── .gitignore
├── GIT_WORKFLOW.md                 # Git branching & commit standards
└── README.md                       # ← This file
```

Each module inside `backend/src/modules/` follows the same structure:
```
modules/fleet/
├── fleet.routes.ts     # Express router + Swagger JSDoc annotations
├── fleet.controller.ts # Request parsing, response shaping
├── fleet.service.ts    # Business logic + state machine
└── fleet.validator.ts  # Zod schemas for request/response
```

---

## 4. Application Workflow

### User Journey (Happy Path)

```mermaid
sequenceDiagram
    actor User
    participant Browser as React SPA
    participant API as Express API
    participant DB as PostgreSQL

    User->>Browser: Open FleetFlow / Login
    Browser->>API: POST /api/v1/auth/login
    API->>DB: SELECT user WHERE email=?
    DB-->>API: User row + hashed password
    API->>API: bcrypt.compare(plain, hash)
    API-->>Browser: { accessToken, user }
    Browser->>Browser: Store token, redirect to /dashboard

    User->>Browser: Create new Trip
    Browser->>API: POST /api/v1/trips (+ Bearer token)
    API->>API: authenticate() — verify JWT
    API->>API: authorize([MANAGER, DISPATCHER])
    API->>API: validate(CreateTripSchema)
    API->>DB: Check vehicle.status = AVAILABLE
    API->>DB: Check driver.status = ON_DUTY
    API->>DB: INSERT trip (status=DRAFT)
    API->>DB: UPDATE vehicle SET status=ON_TRIP
    API->>DB: UPDATE driver SET status=ON_TRIP
    API->>DB: INSERT audit_log (entity=Trip, action=CREATE)
    API-->>Browser: { trip: { id, status: "DRAFT" } }
    Browser-->>User: Trip card visible on Dispatch Board
```

### Authentication Flow

```mermaid
flowchart TD
    A[Client sends request] --> B{Has Authorization header?}
    B -- No --> C[401 Unauthorized]
    B -- Yes --> D[Extract Bearer token]
    D --> E{JWT.verify signature valid?}
    E -- Invalid / Expired --> F[401 Token invalid or expired]
    E -- Valid --> G[Decode payload: userId, role]
    G --> H{Route requires specific role?}
    H -- No role required --> I[Attach user to req.user, proceed]
    H -- Yes --> J{req.user.role in allowedRoles?}
    J -- No --> K[403 Forbidden]
    J -- Yes --> I
```

### Error Handling Flow

```mermaid
flowchart LR
    A[Request hits route] --> B[Controller]
    B --> C{Service throws?}
    C -- BusinessError --> D[Structured error with status code]
    C -- PrismaError --> E[Mapped to 409 / 404]
    C -- ZodError --> F[400 Validation error]
    C -- Unexpected --> G[500 Internal Server Error]
    D & E & F & G --> H[Global errorHandler middleware]
    H --> I["{ success: false, message, errors? }"]
```

---

## 5. UML Diagrams

### Use Case Diagram

```mermaid
graph LR
    subgraph Actors
        FM["🧑‍💼 Fleet Manager"]
        DP["🚚 Dispatcher"]
        SO["🛡️ Safety Officer"]
        FA["💰 Finance Analyst"]
    end

    subgraph Authentication
        UC1["Login / Logout"]
        UC2["Reset Password"]
    end

    subgraph FleetManagement["Fleet Management"]
        UC3["Register Vehicle"]
        UC4["Update Vehicle Status"]
        UC5["Manage Compliance Docs"]
    end

    subgraph TripDispatch["Trip Dispatch"]
        UC6["Create Trip"]
        UC7["Dispatch Trip"]
        UC8["Complete / Cancel Trip"]
        UC9["Add Waypoints"]
    end

    subgraph DriverOps["Driver Operations"]
        UC10["Register Driver"]
        UC11["Update Driver Status"]
        UC12["View Safety Score"]
    end

    subgraph SafetyOps["Safety Operations"]
        UC13["File Incident Report"]
        UC14["Update Incident Status"]
        UC15["Schedule Maintenance"]
    end

    subgraph FinanceOps["Finance Operations"]
        UC16["Log Fuel Consumption"]
        UC17["Log Expenses"]
        UC18["View Financial Reports"]
        UC19["Export PDF / CSV"]
    end

    subgraph Analytics
        UC20["View Command Center KPIs"]
        UC21["View Utilization Rate"]
        UC22["View Cost-per-km"]
    end

    FM --> UC1
    FM --> UC2
    FM --> UC3
    FM --> UC4
    FM --> UC5
    FM --> UC10
    FM --> UC20
    FM --> UC21
    FM --> UC22
    DP --> UC1
    DP --> UC6
    DP --> UC7
    DP --> UC8
    DP --> UC9
    DP --> UC16
    DP --> UC17
    SO --> UC1
    SO --> UC2
    SO --> UC11
    SO --> UC12
    SO --> UC13
    SO --> UC14
    SO --> UC15
    FA --> UC1
    FA --> UC16
    FA --> UC17
    FA --> UC18
    FA --> UC19
    FA --> UC22
```

### Activity Diagram — Trip Lifecycle

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Dispatcher creates trip
    DRAFT --> DISPATCHED : Vehicle AVAILABLE + Driver ON_DUTY
    DRAFT --> CANCELLED : Dispatcher cancels before dispatch
    DISPATCHED --> COMPLETED : Trip finished, odometer updated
    DISPATCHED --> CANCELLED : Emergency cancellation
    COMPLETED --> [*]
    CANCELLED --> [*]
```

### Class Diagram (Core Domain)

```mermaid
classDiagram
    class User {
        +BigInt id
        +String email
        +String fullName
        +UserRole role
        +Boolean isActive
        +login()
        +resetPassword()
    }

    class Vehicle {
        +BigInt id
        +String licensePlate
        +VehicleStatus status
        +Decimal currentOdometer
        +transition(newStatus)
        +softDelete()
    }

    class Driver {
        +BigInt id
        +String licenseNumber
        +DriverStatus status
        +Decimal safetyScore
        +DateTime licenseExpiryDate
        +updateStatus()
    }

    class Trip {
        +BigInt id
        +TripStatus status
        +String origin
        +String destination
        +Decimal revenue
        +dispatch()
        +complete()
        +cancel(reason)
    }

    class FuelLog {
        +BigInt id
        +Decimal liters
        +Decimal costPerLiter
        +Decimal totalCost
        +Decimal odometerAtFill
    }

    class IncidentReport {
        +BigInt id
        +IncidentType incidentType
        +IncidentStatus status
        +Decimal damageEstimate
        +resolve()
    }

    class AuditLog {
        +BigInt id
        +String entity
        +AuditAction action
        +Json oldValues
        +Json newValues
    }

    Trip "1" --> "1" Vehicle : assigned to
    Trip "1" --> "1" Driver : driven by
    Trip "1" *-- "n" FuelLog : has
    Trip "1" *-- "n" IncidentReport : involved in
    User "1" --> "n" AuditLog : creates
```

---

## 6. Tech Stack Explanation

### Frontend

| Technology | Version | Why Chosen | Alternatives |
|---|---|---|---|
| **React** | 19 | Industry standard, concurrent features, huge ecosystem | Vue 3, Svelte |
| **TypeScript** | 5.x | Type safety, refactoring confidence, IDE support | Plain JS |
| **Vite** | 7.x | Sub-second HMR, ES module native, fastest build tool available | CRA, Webpack |
| **Tailwind CSS** | 4.x | Utility-first, no CSS drift, fast iteration | CSS Modules, Styled Components |
| **Recharts** | 3.x | React-native chart library, composable API | Chart.js, D3 |
| **React Router** | 7.x | De-facto routing standard for React SPAs | TanStack Router |
| **Framer Motion** | 12.x | Declarative animation API, GPU-accelerated | CSS animations, GSAP |
| **Zod** | 4.x | Runtime validation + TypeScript type inference | Yup, Joi |
| **Axios** | 1.x | Interceptor support, instance config, better than fetch for APIs | SWR, React Query |

### Backend

| Technology | Version | Why Chosen | Alternatives |
|---|---|---|---|
| **Express.js** | 4.x | Minimal, battle-tested, massive middleware ecosystem | Fastify, Hono, NestJS |
| **TypeScript** | 5.x | Type-safe service layer and Prisma generated types | Plain Node.js |
| **Prisma ORM** | 5.x | Type-safe DB queries, migration management, Prisma Studio | TypeORM, Drizzle, Sequelize |
| **Socket.IO** | 4.x | Real-time bidirectional events, fallback support | WebSocket (raw), Ably |
| **Zod** | 3.x | Shared validation with frontend, automatic TypeScript types | Joi, yup |
| **Helmet** | 7.x | Security headers in one middleware | Manual header setting |
| **express-rate-limit** | 7.x | API abuse prevention | custom Redis-backed limiters |

### Database

| Technology | Why Chosen |
|---|---|
| **PostgreSQL 16** | ACID compliance, JSONB support for audit logs, robust indexing, Prisma first-class support |

### Infrastructure

| Technology | Why Chosen |
|---|---|
| **Docker + docker-compose** | Reproducible dev environment, one-command startup, parity with production |

---

## 7. Environment Setup

### Prerequisites

| Tool | Minimum Version | Install |
|---|---|---|
| Node.js | 20 LTS | [nodejs.org](https://nodejs.org) |
| npm | 10+ | Bundled with Node.js |
| PostgreSQL | 16 | [postgresql.org](https://postgresql.org) or Docker |
| Docker | 24+ | [docker.com](https://docker.com) |
| Git | 2.x | [git-scm.com](https://git-scm.com) |

### Clone the Repository

```bash
git clone https://github.com/<your-org>/Odoo-Hackathon-2026.git
cd Odoo-Hackathon-2026
```

### Environment Variables

Copy the template and configure all values:

```bash
cp .env.example .env
```

Open `.env` and fill in:

```env
# ── Database ─────────────────────────────────────────
POSTGRES_DB=fleetflow_db
POSTGRES_USER=fleetflow
POSTGRES_PASSWORD=your_secure_password
DATABASE_URL=postgresql://fleetflow:your_secure_password@localhost:5432/fleetflow_db

# ── Backend ──────────────────────────────────────────
PORT=5000
NODE_ENV=development
JWT_SECRET=your-minimum-32-char-random-secret
JWT_EXPIRES_IN=15m
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ── Frontend ─────────────────────────────────────────
VITE_API_BASE_URL=http://localhost:5000
```

> **⚠️ Security:** Never commit `.env` to version control. The `.gitignore` excludes it by default. Use a secrets manager (Vault, AWS Secrets Manager) in production.

### Option 1: Docker (Recommended)

```bash
# Start all services (PostgreSQL, Backend, Frontend)
docker compose up --build

# Stop all services
docker compose down

# Wipe volumes (full reset)
docker compose down -v
```

Services will be available at:

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| API Docs | http://localhost:5000/api/docs |
| Health Check | http://localhost:5000/health |

### Option 2: Local Development

**Step 1 — Start PostgreSQL**
```bash
docker run -d --name fleetflow-db \
  -e POSTGRES_DB=fleetflow_db \
  -e POSTGRES_USER=fleetflow \
  -e POSTGRES_PASSWORD=yourpassword \
  -p 5432:5432 postgres:16-alpine
```

**Step 2 — Backend**
```bash
cd backend
npm install
npx prisma migrate dev      # Apply all migrations
npm run prisma:seed          # Seed with demo data (optional)
npm run dev                  # Start on :5000
```

**Step 3 — Frontend**
```bash
cd frontend
npm install
npm run dev                  # Start on :5173
```

### Production Build

```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build
# Serve ./dist with nginx or any static host
```

---

## 8. API Documentation

Interactive docs are at **[http://localhost:5000/api/docs](http://localhost:5000/api/docs)** (Swagger UI).

All endpoints are prefixed with `/api/v1`. Protected routes require:
```
Authorization: Bearer <access_token>
```

### Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/auth/login` | Log in, returns JWT | — |
| `POST` | `/auth/register` | Create new user account | — |
| `POST` | `/auth/forgot-password` | Send reset email | — |
| `POST` | `/auth/reset-password` | Reset with token | — |

**POST /auth/login — Request**
```json
{ "email": "manager@fleet.com", "password": "Secure@123" }
```
**Response 200**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "id": "1", "email": "manager@fleet.com", "role": "MANAGER" }
  }
}
```

### Vehicles

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `GET` | `/vehicles` | List all vehicles (filterable) | All |
| `POST` | `/vehicles` | Register new vehicle | MANAGER |
| `GET` | `/vehicles/:id` | Get vehicle detail + docs | All |
| `PUT` | `/vehicles/:id` | Update vehicle info | MANAGER |
| `DELETE` | `/vehicles/:id` | Soft-delete vehicle | MANAGER |
| `PATCH` | `/vehicles/:id/status` | Update vehicle status | MANAGER, DISPATCHER |

### Trips (Dispatch)

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `GET` | `/trips` | List trips (filter by status, date) | All |
| `POST` | `/trips` | Create trip (status: DRAFT) | MANAGER, DISPATCHER |
| `GET` | `/trips/:id` | Get trip with fuel logs + expenses | All |
| `POST` | `/trips/:id/dispatch` | Dispatch trip (DRAFT → DISPATCHED) | MANAGER, DISPATCHER |
| `POST` | `/trips/:id/complete` | Complete trip (DISPATCHED → COMPLETED) | MANAGER, DISPATCHER |
| `POST` | `/trips/:id/cancel` | Cancel trip | MANAGER, DISPATCHER |

### Drivers

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `GET` | `/drivers` | List drivers | All |
| `POST` | `/drivers` | Register driver | MANAGER |
| `GET` | `/drivers/:id` | Get driver + trips | All |
| `PUT` | `/drivers/:id` | Update driver profile | MANAGER |
| `PATCH` | `/drivers/:id/status` | Change duty status | MANAGER, DISPATCHER |

### Finance (Fuel & Expenses)

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `GET` | `/finance/fuel` | List fuel logs | All |
| `POST` | `/finance/fuel` | Log fuel fill | MANAGER, DISPATCHER |
| `GET` | `/finance/expenses` | List expenses | All |
| `POST` | `/finance/expenses` | Log expense | MANAGER, DISPATCHER |

### Analytics

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `GET` | `/analytics/dashboard` | Command center KPIs | All |
| `GET` | `/analytics/fleet` | Fleet utilization stats | MANAGER |
| `GET` | `/analytics/finance` | Revenue / cost breakdown | MANAGER, FINANCE_ANALYST |

### Error Response Format

All errors follow a consistent envelope:

```json
{
  "success": false,
  "message": "Vehicle is not AVAILABLE for dispatch",
  "errors": [
    { "field": "vehicleId", "message": "Vehicle status is ON_TRIP" }
  ]
}
```

| HTTP Code | Meaning |
|---|---|
| `400` | Validation error (Zod) |
| `401` | Missing or invalid JWT |
| `403` | Insufficient role permissions |
| `404` | Resource not found |
| `409` | State machine conflict (e.g. vehicle already ON_TRIP) |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

---

## 9. Database Design

### Entity Relationship Diagram

```mermaid
erDiagram
    users {
        int id PK
        string email UK
        string password_hash
        string full_name
        string role
        boolean is_active
    }
    vehicles {
        int id PK
        string registration_number UK
        int vehicle_type_id FK
        string status
        decimal current_odometer
        boolean is_deleted
    }
    vehicle_types {
        int id PK
        string name UK
    }
    drivers {
        int id PK
        string license_number UK
        string status
        decimal safety_score
        timestamp license_expiry_date
        int user_id FK
        boolean is_deleted
    }
    trips {
        int id PK
        int vehicle_id FK
        int driver_id FK
        string status
        string origin
        string destination
        decimal cargo_weight
        timestamp dispatch_time
        timestamp completion_time
    }
    fuel_logs {
        int id PK
        int vehicle_id FK
        int trip_id FK
        decimal liters
        decimal total_cost
        decimal odometer_at_fill
    }
    expenses {
        int id PK
        int vehicle_id FK
        int trip_id FK
        decimal amount
        string category
    }
    maintenance_logs {
        int id PK
        int vehicle_id FK
        string service_type
        decimal cost
        timestamp next_service_due
        timestamp closed_at
    }
    vehicle_locations {
        int id PK
        int vehicle_id FK
        decimal latitude
        decimal longitude
        timestamp recorded_at
    }
    incident_reports {
        int id PK
        int vehicle_id FK
        int driver_id FK
        int trip_id FK
        string incident_type
        string status
    }
    vehicle_documents {
        int id PK
        int vehicle_id FK
        string document_type
        timestamp expires_at
        boolean is_verified
    }
    audit_logs {
        int id PK
        int user_id FK
        string entity
        string action
        string old_values
        string new_values
    }
    trip_waypoints {
        int id PK
        int trip_id FK
        int sequence_order
        string location
    }

    vehicles ||--o{ trips : "assigned to"
    drivers ||--o{ trips : "drives"
    vehicles ||--o{ fuel_logs : "has"
    trips ||--o{ fuel_logs : "contains"
    vehicles ||--o{ expenses : "incurs"
    trips ||--o{ expenses : "contains"
    vehicles ||--o{ maintenance_logs : "has"
    vehicles ||--o{ vehicle_locations : "pings"
    vehicles ||--o{ incident_reports : "involved in"
    drivers ||--o{ incident_reports : "involved in"
    trips ||--o{ incident_reports : "during"
    vehicles ||--o{ vehicle_documents : "has"
    trips ||--o{ trip_waypoints : "has"
    users ||--o{ audit_logs : "creates"
    vehicle_types ||--o{ vehicles : "categorizes"
    users ||--o| drivers : "linked to"
```

### Table Index Strategy

| Table | Key Indexes | Justification |
|---|---|---|
| `users` | `email`, `role`, `is_active` | Login lookup, role filter, active user queries |
| `vehicles` | `status`, `is_deleted`, `(status, is_deleted)` | Dispatch pool: AVAILABLE + not deleted |
| `drivers` | `status`, `is_deleted`, `license_expiry_date` | Dispatch pool; cron license expiry scan |
| `trips` | `(vehicle_id, status)`, `(driver_id, status)`, `status` | Current trip of a vehicle/driver; active board |
| `fuel_logs` | `vehicle_id`, `trip_id`, `logged_at` | Per-vehicle aggregation; time-range cost reports |
| `vehicle_locations` | `(vehicle_id, recorded_at DESC)` | "Latest location" O(log n) query |
| `audit_logs` | `(entity, entity_id)`, `timestamp` | "All changes to Vehicle #42"; time-range forensics |

---

## 10. Security Architecture

### Authentication

- **JWT (JSON Web Tokens)** are issued on login and verified on every protected request.
- Tokens are **short-lived** (`JWT_EXPIRES_IN=15m` by default). Refresh token support is on the roadmap.
- Tokens are verified using `jsonwebtoken.verify()` with the `JWT_SECRET` environment variable. Invalid or expired tokens return `401`.

### Authorization (RBAC)

```
MANAGER          → Full system access
DISPATCHER       → Trip lifecycle, fuel logs, expenses
SAFETY_OFFICER   → Incident reports, maintenance, driver safety score
FINANCE_ANALYST  → Fuel logs, expenses (read), financial reports
```

Authorization is enforced via the `authorize(roles[])` middleware applied per-route. Role mismatch returns `403 Forbidden`.

### Password Security

- Passwords are hashed with **bcryptjs** (minimum 10 salt rounds).
- Plain-text passwords are **never stored** or logged.
- Password reset tokens are hashed before DB storage and expire in 15 minutes.

### Input Validation

Every request body is validated with **Zod schemas** before reaching the service layer. Invalid payloads return structured `400` errors with field-level messages.

### Rate Limiting

Global rate limiter via `express-rate-limit`:
- Window: 15 minutes (`RATE_LIMIT_WINDOW_MS`)
- Max requests: 100 per window per IP (`RATE_LIMIT_MAX_REQUESTS`)
- Auth endpoints may have stricter per-route limiters.

### Security Headers

**Helmet** is applied globally, setting:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy`
- `X-XSS-Protection`

### CORS

`cors` middleware is configured to whitelist only origins listed in `CORS_ORIGINS`. Requests from unlisted origins are rejected with a CORS error.

### Secrets Management

- All secrets (JWT_SECRET, DB credentials) live exclusively in `.env`.
- `.env` is `.gitignore`'d and never committed.
- In production, use a secrets manager (AWS Secrets Manager, HashiCorp Vault, or Docker secrets).

---

## 11. DevOps & Deployment

### Branch Strategy (GitHub Flow)

```
main            ← production-ready, protected
  └── feature/  ← all feature work
  └── fix/      ← bug fixes
  └── chore/    ← tooling, dependencies
```

### Docker Setup

```yaml
# docker-compose.yml — three services
services:
  postgres:  # PostgreSQL 16 Alpine
  backend:   # Express.js API on :5000
  frontend:  # Vite dev server on :3000
```

All services share an internal Docker network. Backend accesses DB via service name `postgres:5432`.

### CI/CD Pipeline (Recommended)

```mermaid
flowchart LR
    A[Push to branch] --> B[GitHub Actions trigger]
    B --> C[Install deps]
    C --> D[Lint: eslint]
    D --> E[Type check: tsc --noEmit]
    E --> F[Tests: npm test]
    F --> G{Branch = main?}
    G -- Yes --> H[Build Docker images]
    H --> I[Push to Registry]
    I --> J[Deploy to Production]
    G -- No --> K[PR ready for review]
```

### Monitoring & Logging

- **Request logging**: Morgan logs all HTTP requests (`combined` format in production).
- **Error logging**: Global error handler logs stack traces to stdout.
- **Cron jobs**: License and document expiry jobs run on configurable schedules.
- **Production monitoring**: Integrate with [Sentry](https://sentry.io) or [Datadog](https://datadoghq.com).

---

## 12. Testing Strategy

### Backend

| Level | Tool | Target |
|---|---|---|
| Unit | Jest | Service-layer business logic |
| Integration | Supertest + Jest | API endpoint behavior |
| DB | Prisma test DB | Migration correctness |

```bash
cd backend && npm test
```

### Frontend

| Level | Tool | Target |
|---|---|---|
| Unit | Vitest | Utility functions, validators |
| Component | React Testing Library | UI behavior |
| E2E | Playwright / Cypress | Full user journeys |

```bash
cd frontend && npm test
```

### Coverage Targets

| Layer | Target |
|---|---|
| Service layer | ≥ 80% |
| API controllers | ≥ 70% |
| Frontend components | ≥ 60% |

---

## 13. Coding Standards

### Naming Conventions

| Entity | Convention | Example |
|---|---|---|
| Files | `kebab-case` | `fleet.service.ts` |
| Variables | `camelCase` | `vehicleStatus` |
| Classes | `PascalCase` | `VehicleService` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| DB columns | `snake_case` | `license_plate` |
| Prisma fields | `camelCase` | `licensePlate` |

### Commit Message Format (Conventional Commits)

```
<type>(<scope>): <short description>

Types: feat | fix | docs | style | refactor | test | chore

Examples:
feat(dispatch): add cargo weight validation against vehicle capacity
fix(auth): correct JWT expiry check using Date.now()
docs(readme): update environment setup section
chore(deps): upgrade Prisma to 5.11.0
```

### Linting

- **ESLint** with TypeScript ESLint rules (`npm run lint`)
- **Prettier** for formatting (configure in `.prettierrc`)
- Pre-commit hooks via **Husky** + **lint-staged** (recommended)

---

## 14. Contribution Guidelines

### Branch Naming

```
feature/<ticket-id>-short-description
fix/<ticket-id>-short-description
chore/update-dependencies
```

### Pull Request Flow

1. Fork/branch from `main`
2. Implement changes with tests
3. Run `npm run lint` and `npm test` locally — both must pass
4. Open PR against `main` with a clear description
5. At least **1 reviewer approval** required
6. Squash and merge

### Code Review Checklist

- [ ] Business logic belongs in the service layer, not the controller
- [ ] New endpoints have Zod validation middleware
- [ ] State machine transitions are enforced in service, not controller
- [ ] Audit log inserted for every write operation
- [ ] No raw SQL; all DB access through Prisma
- [ ] Sensitive data is not logged

---

## 15. Roadmap

### Short Term (Weeks 1–4)
- [ ] Refresh token support (sliding session)
- [ ] Email notifications on license/document expiry
- [ ] Driver mobile self-service login
- [ ] Enhanced Swagger documentation (request/response examples)

### Mid Term (Months 1–3)
- [ ] Real-time GPS map tracking with live Leaflet updates
- [ ] Multi-file document upload for vehicle compliance docs
- [ ] Automated fuel efficiency alerts (below threshold)
- [ ] Mobile app (React Native) for drivers

### Long Term (Months 3–12)
- [ ] Multi-tenant (multi-organization) support
- [ ] AI-powered route optimization
- [ ] IoT device integration for live odometer + fuel telemetry
- [ ] Predictive maintenance alerts based on service history

---

## 16. Known Issues & Limitations

| Issue | Impact | Workaround / Status |
|---|---|---|
| No refresh tokens | Users must re-login every 15 minutes | On the roadmap |
| No file storage (S3 etc.) | Vehicle documents are metadata only, no actual file upload | Planned |
| GPS location via manual API | No live IoT push; location must be posted by mobile client | Architecture ready, integration pending |
| Single-organization | No multi-tenant support | Roadmap item |
| No email service configured | Password reset email is a stub unless SMTP configured | Add SMTP env vars |

---

## 17. FAQ

**Q: Can multiple dispatchers work simultaneously?**
A: Yes. The server-side state machine checks vehicle and driver availability atomically before committing a trip, preventing double-assignment.

**Q: What happens if a driver's license expires?**
A: A cron job scans for licenses expiring within 30 days and flags the driver. Expired drivers can be administratively suspended (`SUSPENDED` status), blocking dispatch.

**Q: Is there an undo for a completed trip?**
A: No. Completed and Cancelled are terminal states. This is by design to preserve financial and audit integrity.

**Q: How are odometer readings validated?**
A: The service layer enforces that `odometerAtFill` and `odometerAtService` must be ≥ `vehicle.current_odometer`, preventing backdated fraud.

**Q: How do I seed the database with demo data?**
A: Run `cd backend && npm run prisma:seed`. This creates default users for each role, sample vehicles, drivers, and a few trips.

---

## 18. License

This project is licensed under the **MIT License**.

```
MIT License — Copyright (c) 2026 FleetFlow Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files, to deal in the Software
without restriction, including without limitation the rights to use, copy,
modify, merge, publish, distribute, sublicense, and/or sell copies.
```

See [LICENSE](./LICENSE) for the full text.

---

## 19. Maintainers

| Name | Role | GitHub |
|---|---|---|
| **Urva Gandhi** | Full-Stack Lead | [@urvagandhi](https://github.com/urvagandhi) |

---

## 20. Appendix

### Glossary

| Term | Definition |
|---|---|
| **State Machine** | A model enforcing that an entity can only transition between explicitly defined states (e.g., Trip: DRAFT → DISPATCHED → COMPLETED) |
| **Soft Delete** | Marking a record as `is_deleted = true` rather than physically removing it, preserving referential integrity for historical data |
| **Audit Log** | Immutable append-only record of every state-changing operation, including actor, entity, old values, and new values |
| **Odometer Fraud Guard** | Service-layer check ensuring odometer readings are always monotonically increasing |
| **RBAC** | Role-Based Access Control — permissions are granted based on user role, not individual identity |
| **3NF** | Third Normal Form — database normalization level ensuring no transitive dependencies |
| **Cron Job** | Scheduled background task (node-cron) running on a fixed schedule, e.g., license expiry scanner |

### References

- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com/en/guide)
- [React 19 Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Socket.IO Documentation](https://socket.io/docs)
- [Conventional Commits](https://www.conventionalcommits.org)
- [Zod Documentation](https://zod.dev)
