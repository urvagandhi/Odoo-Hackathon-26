<div align="center">

# 🚛 FleetFlow — Backend

### Express.js · TypeScript · Prisma ORM · PostgreSQL 16

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?logo=prisma&logoColor=white)](https://prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://postgresql.org)

[← Root README](../README.md) · [Frontend README →](../frontend/README.md) · [API Docs](http://localhost:5000/api/docs)

</div>

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Folder Structure](#3-folder-structure)
4. [Module System](#4-module-system)
5. [Middleware Pipeline](#5-middleware-pipeline)
6. [Database Design](#6-database-design)
7. [State Machines](#7-state-machines)
8. [Tech Stack](#8-tech-stack)
9. [Environment Setup](#9-environment-setup)
10. [Available Scripts](#10-available-scripts)
11. [API Reference](#11-api-reference)
12. [Security](#12-security)
13. [Cron Jobs](#13-cron-jobs)
14. [Real-Time Events](#14-real-time-events)
15. [Audit Trail](#15-audit-trail)
16. [Testing](#16-testing)
17. [Coding Standards](#17-coding-standards)

---

## 1. Overview

The FleetFlow backend is a **production-grade REST API** server built with Express.js and TypeScript. It implements all business logic for the FleetFlow platform using a **modular, feature-first architecture** where each operational domain (fleet, dispatch, HR, finance, analytics, etc.) is fully encapsulated in its own module.

Key architectural principles:
- **State machines enforced server-side** — vehicle and trip state transitions are validated in the service layer, not the client.
- **Audit-first design** — every state-mutating operation writes an immutable `AuditLog` record.
- **Zod-validated inputs** — all request bodies are validated before reaching business logic.
- **Prisma ORM** — all database access is through the type-safe Prisma client; no raw SQL.

---

## 2. Architecture

### Request Lifecycle

```mermaid
sequenceDiagram
    participant Client as Frontend / Client
    participant Express as Express App
    participant Security as Security Layer
    participant Route as Module Router
    participant MW as Middleware
    participant Service as Service Layer
    participant Prisma as Prisma ORM
    participant DB as PostgreSQL

    Client->>Express: HTTP Request
    Express->>Security: Helmet + CORS + Rate Limiter
    Security->>Route: Route match
    Route->>MW: authenticate() — verify JWT
    MW->>MW: authorize(roles[]) — check role
    MW->>MW: validate(zodSchema) — validate body
    MW->>Service: Controller calls service
    Service->>Prisma: Database query
    Prisma->>DB: SQL query
    DB-->>Prisma: Result set
    Prisma-->>Service: Typed Prisma result
    Service->>Service: Write AuditLog
    Service-->>MW: Return DTO
    MW-->>Client: JSON Response
```

### Module Architecture

```mermaid
graph LR
    subgraph Modules
        A[auth]
        B[fleet]
        C[dispatch]
        D[hr]
        E[finance]
        F[analytics]
        G[incidents]
        H[locations]
        I[me]
    end
    subgraph Infrastructure
        J[middleware/authenticate]
        K[middleware/authorize]
        L[middleware/validate]
        M[middleware/errorHandler]
        N[middleware/auditLogger]
        O[config/env]
        P[config/swagger]
    end
    subgraph DataLayer
        Q[Prisma Client]
        R[(PostgreSQL)]
    end
    subgraph External
        S[Socket.IO]
        T[node-cron Jobs]
    end

    Modules --> Infrastructure
    Modules --> DataLayer
    Q --> R
    S --> Modules
    T --> DataLayer
```

---

## 3. Folder Structure

```
backend/
├── 📁 src/
│   ├── 📄 server.ts             # Entry point — bootstraps HTTP server + Socket.IO
│   ├── 📄 app.ts                # Express factory — registers middleware + all routers
│   ├── 📄 prisma.ts             # Singleton Prisma Client instance
│   │
│   ├── 📁 config/
│   │   ├── env.ts               # Zod-validated env config (type-safe process.env)
│   │   └── swagger.ts           # OpenAPI/Swagger spec builder (JSDoc-based)
│   │
│   ├── 📁 middleware/
│   │   ├── authenticate.ts      # JWT verification → attaches req.user
│   │   ├── authorize.ts         # Role guard factory → authorize(['MANAGER'])
│   │   ├── validate.ts          # Zod validation middleware factory
│   │   ├── errorHandler.ts      # Global error handler — maps errors to HTTP codes
│   │   └── auditLogger.ts       # Middleware that writes to audit_logs table
│   │
│   ├── 📁 modules/              # Feature-first domain modules
│   │   ├── 📁 auth/             # Login, register, password reset
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.validator.ts
│   │   ├── 📁 fleet/            # Vehicle CRUD + state machine
│   │   ├── 📁 dispatch/         # Trip lifecycle — create, dispatch, complete, cancel
│   │   ├── 📁 hr/               # Driver management
│   │   ├── 📁 finance/          # Fuel logs + expenses
│   │   ├── 📁 analytics/        # KPI aggregation queries
│   │   ├── 📁 incidents/        # Safety incident reports
│   │   ├── 📁 locations/        # GPS telemetry
│   │   └── 📁 me/               # Authenticated user profile
│   │
│   ├── 📁 services/             # Cross-cutting shared services
│   │   └── email.service.ts     # Nodemailer wrapper for password reset emails
│   │
│   ├── 📁 sockets/              # Socket.IO event definitions + room management
│   │   └── socketHandler.ts
│   │
│   └── 📁 jobs/                 # node-cron scheduled background jobs
│       └── complianceJobs.ts    # License expiry + document expiry scanner
│
├── 📁 prisma/
│   ├── schema.prisma            # Database schema — single source of truth
│   ├── seed.ts                  # Comprehensive demo data seeder
│   └── 📁 migrations/           # Prisma migration history (auto-generated)
│
├── 📄 package.json
├── 📄 tsconfig.json
└── 📄 Dockerfile
```

---

## 4. Module System

Each feature domain is a self-contained module with four files:

```
modules/<domain>/
├── <domain>.routes.ts      # Express Router + Swagger JSDoc annotations
├── <domain>.controller.ts  # Request parsing, DTO shaping, response
├── <domain>.service.ts     # Business logic + state machines + DB calls
└── <domain>.validator.ts   # Zod schemas for request/response types
```

### Module Conventions

**Routes** — wire middleware and call controller methods:
```typescript
// fleet.routes.ts
fleetRouter.post(
  '/',
  authenticate,
  authorize(['MANAGER']),
  validate(CreateVehicleSchema),
  fleetController.create
);
```

**Controllers** — extract request data, call service, return response:
```typescript
// fleet.controller.ts
create: async (req: Request, res: Response) => {
  const vehicle = await fleetService.createVehicle(req.body, req.user);
  res.status(201).json({ success: true, data: vehicle });
}
```

**Services** — all business logic and DB access:
```typescript
// fleet.service.ts
async createVehicle(input: CreateVehicleInput, actor: AuthUser): Promise<Vehicle> {
  const vehicle = await prisma.vehicle.create({ data: input });
  await auditService.log({ userId: actor.id, entity: 'Vehicle', entityId: vehicle.id, action: 'CREATE', newValues: vehicle });
  return vehicle;
}
```

---

## 5. Middleware Pipeline

All requests flow through this pipeline in order:

```
┌────────────────────────────────────────────────────────┐
│ 1. helmet()           — Security headers               │
│ 2. cors()             — Origin whitelist               │
│ 3. morgan()           — HTTP request logging           │
│ 4. express.json()     — Body parsing                   │
│ 5. rateLimit()        — 100 req / 15 min per IP        │
├────────────────────────────────────────────────────────┤
│ 6. authenticate()     — Verify JWT, attach req.user    │ ← Per route
│ 7. authorize(roles)   — Check req.user.role            │ ← Per route
│ 8. validate(schema)   — Zod body/params validation     │ ← Per route
├────────────────────────────────────────────────────────┤
│ 9. Controller + Service — Business logic               │
├────────────────────────────────────────────────────────┤
│ 10. errorHandler()    — Global error → HTTP response   │
└────────────────────────────────────────────────────────┘
```

### Error Handler

The global `errorHandler` middleware maps errors to HTTP status codes:

| Error Type | HTTP Status |
|---|---|
| `ZodError` | `400 Bad Request` |
| `UnauthorizedError` | `401 Unauthorized` |
| `ForbiddenError` | `403 Forbidden` |
| `NotFoundError` | `404 Not Found` |
| `ConflictError` (state machine) | `409 Conflict` |
| `PrismaClientKnownRequestError P2025` | `404 Not Found` |
| `PrismaClientKnownRequestError P2002` | `409 Conflict` (unique violation) |
| Unknown errors | `500 Internal Server Error` |

---

## 6. Database Design

### Models Overview

| Model | Table | Description |
|---|---|---|
| `User` | `users` | Auth principals with roles |
| `VehicleTypeRecord` | `vehicle_types` | Lookup — TRUCK, VAN, BIKE, PLANE |
| `Vehicle` | `vehicles` | Fleet assets, soft-deleted |
| `Driver` | `drivers` | Operational personnel, soft-deleted |
| `Trip` | `trips` | Core dispatch entity |
| `FuelLog` | `fuel_logs` | Per-fill fuel tracking |
| `MaintenanceLog` | `maintenance_logs` | Vehicle service records |
| `Expense` | `expenses` | Trip operational expenses |
| `VehicleLocation` | `vehicle_locations` | GPS telemetry pings |
| `VehicleDocument` | `vehicle_documents` | Compliance documents |
| `TripWaypoint` | `trip_waypoints` | Ordered multi-leg stops |
| `IncidentReport` | `incident_reports` | Safety events |
| `AuditLog` | `audit_logs` | Immutable change history |

### Key Database Conventions

- **All primary keys** are `BigInt @db.BigInt @default(autoincrement())` — 64-bit integers for large datasets.
- **All timestamps** use `@db.Timestamptz()` — timezone-aware storage.
- **Soft delete** (`is_deleted`, `deleted_at`) on `Vehicle` and `Driver` — preserves referential integrity for historical trips.
- **Prisma naming**: camelCase Prisma fields map to `snake_case` PostgreSQL columns via `@map()`.

### Critical Integrity Rules

```
Vehicle deletion  → Blocked if ACTIVE trips exist (onDelete: Restrict)
Driver deletion   → Blocked if ACTIVE trips exist (onDelete: Restrict)
Trip deletion     → Cascades FuelLogs, Expenses, Waypoints
User deactivation → AuditLogs preserved (onDelete: SetNull → userId = null)
Odometer         → Monotonically increasing (enforced in service layer)
FuelLog cost     → totalCost = liters × costPerLiter (enforced in service)
```

---

## 7. State Machines

All entity state transitions are validated **exclusively in the service layer** before any database write.

### Vehicle Status

```mermaid
stateDiagram-v2
    [*] --> AVAILABLE : Vehicle registered
    AVAILABLE --> ON_TRIP : Trip dispatched
    ON_TRIP --> AVAILABLE : Trip completed / cancelled
    AVAILABLE --> IN_SHOP : Maintenance scheduled
    IN_SHOP --> AVAILABLE : Maintenance log closed
    AVAILABLE --> RETIRED : Fleet manager retires vehicle
    ON_TRIP --> RETIRED : Emergency retirement
    RETIRED --> [*]
```

### Trip Status

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Dispatcher creates trip
    DRAFT --> DISPATCHED : Vehicle AVAILABLE + Driver ON_DUTY ✓
    DRAFT --> CANCELLED : Pre-dispatch cancellation
    DISPATCHED --> COMPLETED : Trip finished, odometer recorded
    DISPATCHED --> CANCELLED : Emergency cancellation
    COMPLETED --> [*]
    CANCELLED --> [*]
```

**Side Effects on Dispatch:**
- `Vehicle.status` → `ON_TRIP`
- `Driver.status` → `ON_TRIP`
- `Trip.dispatchTime` → `now()`

**Side Effects on Completion:**
- `Vehicle.status` → `AVAILABLE`, `currentOdometer` updated
- `Driver.status` → `ON_DUTY`
- `Trip.completionTime` → `now()`, `distanceActual` calculated

### Driver Status

```mermaid
stateDiagram-v2
    [*] --> OFF_DUTY : Driver registered
    OFF_DUTY --> ON_DUTY : Manager activates
    ON_DUTY --> ON_TRIP : Trip dispatched
    ON_TRIP --> ON_DUTY : Trip completed
    ON_DUTY --> SUSPENDED : Safety violation
    OFF_DUTY --> SUSPENDED : Safety violation
    SUSPENDED --> ON_DUTY : Manager lifts suspension
```

---

## 8. Tech Stack

| Technology | Version | Why Chosen |
|---|---|---|
| **Express.js** | 4.x | Minimal, battle-tested, huge middleware ecosystem |
| **TypeScript** | 5.x | Type-safe service layer + Prisma generated types |
| **Prisma ORM** | 5.x | Type-safe DB access, migration system, Prisma Studio |
| **PostgreSQL** | 16 | ACID, JSONB (audit logs), robust indexing |
| **Socket.IO** | 4.x | Bidirectional real-time events with fallback |
| **Zod** | 3.x | Runtime validation with auto-inferred TypeScript types |
| **JWT + bcryptjs** | 9.x / 3.x | Industry-standard auth + password hashing |
| **Helmet** | 7.x | Security headers in a single middleware |
| **express-rate-limit** | 7.x | API abuse prevention, configurable per route |
| **Morgan** | 1.x | HTTP request logging (dev + combined formats) |
| **node-cron** | 4.x | Scheduled background jobs (license expiry scanner) |
| **Nodemailer** | 8.x | Transactional email (password reset) |
| **Swagger UI Express** | 5.x | Auto-generated interactive API documentation |

---

## 9. Environment Setup

### Prerequisites

| Tool | Minimum Version |
|---|---|
| Node.js | 20 LTS |
| npm | 10+ |
| PostgreSQL | 16 (or Docker) |

### Step-by-Step Setup

**1. Install dependencies**
```bash
cd backend
npm install
```

**2. Configure environment**
```bash
cp ../.env.example .env
# Edit .env with your values
```

Required variables:

```env
# Database
POSTGRES_DB=fleetflow_db
POSTGRES_USER=fleetflow
POSTGRES_PASSWORD=your_secure_password
DATABASE_URL=postgresql://fleetflow:your_secure_password@localhost:5432/fleetflow_db

# Server
PORT=5000
NODE_ENV=development

# Auth
JWT_SECRET=your-minimum-32-char-random-string
JWT_EXPIRES_IN=15m

# CORS (comma-separated origins)
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**3. Apply migrations**
```bash
npx prisma migrate dev
```

**4. Seed demo data (optional)**
```bash
npm run prisma:seed
```

Default seed users:

| Email | Role | Password |
|---|---|---|
| `manager@fleetflow.com` | MANAGER | `Manager@123` |
| `dispatcher@fleetflow.com` | DISPATCHER | `Dispatcher@123` |
| `safety@fleetflow.com` | SAFETY_OFFICER | `Safety@123` |
| `finance@fleetflow.com` | FINANCE_ANALYST | `Finance@123` |

**5. Start dev server**
```bash
npm run dev
# API available at http://localhost:5000
# Swagger UI at http://localhost:5000/api/docs
# Health check at http://localhost:5000/health
```

---

## 10. Available Scripts

| Script | Command | Description |
|---|---|---|
| **Dev server** | `npm run dev` | Start with hot reload (`ts-node-dev`) |
| **Production build** | `npm run build` | Compile TypeScript to `dist/` |
| **Start production** | `npm start` | Run compiled JS from `dist/` |
| **Lint** | `npm run lint` | ESLint on `src/` |
| **Migrate** | `npm run prisma:migrate` | Create + apply migration |
| **Deploy migrations** | `npm run prisma:deploy` | Apply migrations in production (no dev prompts) |
| **Prisma Studio** | `npm run prisma:studio` | Visual database browser at :5555 |
| **Generate client** | `npm run prisma:generate` | Regenerate Prisma Client after schema changes |
| **Seed** | `npm run prisma:seed` | Seed demo data |
| **Reset DB** | `npm run prisma:reset` | Full reset — wipes and re-migrates (⚠️ dev only) |

---

## 11. API Reference

Base URL: `http://localhost:5000/api/v1`

Interactive docs: `http://localhost:5000/api/docs`

All protected routes require:
```
Authorization: Bearer <access_token>
```

### Authentication Endpoints

| Method | Endpoint | Body | Auth | Description |
|---|---|---|---|---|
| `POST` | `/auth/login` | `{ email, password }` | — | Returns JWT access token |
| `POST` | `/auth/register` | `{ fullName, email, password, role }` | — | Creates new user account |
| `POST` | `/auth/forgot-password` | `{ email }` | — | Sends password reset email |
| `POST` | `/auth/reset-password` | `{ token, newPassword }` | — | Resets password with token |

### Vehicle Endpoints

| Method | Endpoint | Auth | Roles |
|---|---|---|---|
| `GET` | `/vehicles` | ✅ | All |
| `POST` | `/vehicles` | ✅ | MANAGER |
| `GET` | `/vehicles/:id` | ✅ | All |
| `PUT` | `/vehicles/:id` | ✅ | MANAGER |
| `DELETE` | `/vehicles/:id` | ✅ | MANAGER |
| `PATCH` | `/vehicles/:id/status` | ✅ | MANAGER, DISPATCHER |
| `GET` | `/vehicles/:id/documents` | ✅ | All |
| `POST` | `/vehicles/:id/documents` | ✅ | MANAGER |

### Trip Endpoints

| Method | Endpoint | Auth | Roles |
|---|---|---|---|
| `GET` | `/trips` | ✅ | All |
| `POST` | `/trips` | ✅ | MANAGER, DISPATCHER |
| `GET` | `/trips/:id` | ✅ | All |
| `PUT` | `/trips/:id` | ✅ | MANAGER, DISPATCHER |
| `POST` | `/trips/:id/dispatch` | ✅ | MANAGER, DISPATCHER |
| `POST` | `/trips/:id/complete` | ✅ | MANAGER, DISPATCHER |
| `POST` | `/trips/:id/cancel` | ✅ | MANAGER, DISPATCHER |
| `GET` | `/trips/:id/waypoints` | ✅ | All |
| `POST` | `/trips/:id/waypoints` | ✅ | MANAGER, DISPATCHER |

### Driver Endpoints

| Method | Endpoint | Auth | Roles |
|---|---|---|---|
| `GET` | `/drivers` | ✅ | All |
| `POST` | `/drivers` | ✅ | MANAGER |
| `GET` | `/drivers/:id` | ✅ | All |
| `PUT` | `/drivers/:id` | ✅ | MANAGER |
| `DELETE` | `/drivers/:id` | ✅ | MANAGER |
| `PATCH` | `/drivers/:id/status` | ✅ | MANAGER, DISPATCHER |

### Finance Endpoints

| Method | Endpoint | Auth | Roles |
|---|---|---|---|
| `GET` | `/finance/fuel` | ✅ | All |
| `POST` | `/finance/fuel` | ✅ | MANAGER, DISPATCHER |
| `GET` | `/finance/fuel/:id` | ✅ | All |
| `DELETE` | `/finance/fuel/:id` | ✅ | MANAGER |
| `GET` | `/finance/expenses` | ✅ | All |
| `POST` | `/finance/expenses` | ✅ | MANAGER, DISPATCHER |
| `DELETE` | `/finance/expenses/:id` | ✅ | MANAGER |

### Analytics Endpoints

| Method | Endpoint | Auth | Roles |
|---|---|---|---|
| `GET` | `/analytics/dashboard` | ✅ | All |
| `GET` | `/analytics/fleet` | ✅ | MANAGER |
| `GET` | `/analytics/finance` | ✅ | MANAGER, FINANCE_ANALYST |
| `GET` | `/analytics/drivers` | ✅ | MANAGER, SAFETY_OFFICER |

### Other Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | — | Server health check |
| `GET` | `/incidents` | ✅ | List incident reports |
| `POST` | `/incidents` | ✅ | File a new incident |
| `PATCH` | `/incidents/:id/status` | ✅ | Update incident status |
| `GET` | `/locations/:vehicleId` | ✅ | Latest GPS location for vehicle |
| `POST` | `/locations` | ✅ | Post GPS telemetry ping |
| `GET` | `/me` | ✅ | Get authenticated user profile |
| `PUT` | `/me` | ✅ | Update own profile |

### Standard Response Envelope

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "total": 42, "limit": 20 }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Vehicle is currently ON_TRIP and cannot be dispatched again",
  "errors": [
    { "field": "vehicleId", "message": "Status must be AVAILABLE" }
  ]
}
```

---

## 12. Security

### Authentication

- `POST /api/v1/auth/login` issues a **JWT access token** signed with `JWT_SECRET`.
- Tokens expire per `JWT_EXPIRES_IN` (default: 15 minutes).
- The `authenticate` middleware verifies the token and attaches `req.user = { id, email, role }`.

### Authorization

The `authorize(roles)` factory produces middleware that checks `req.user.role`:

```typescript
// Only MANAGER and DISPATCHER can create trips
dispatchRouter.post('/', authenticate, authorize(['MANAGER', 'DISPATCHER']), ...)
```

### Password Security

- Passwords hashed with **bcryptjs** (10+ rounds).
- Password reset tokens are hashed (SHA-256) before storage and expire in 15 minutes.
- Brute-force protection via rate limiting on auth routes.

### Rate Limiting

```typescript
// Global: 100 req / 15 min per IP
app.use('/api/', globalLimiter);

// Auth routes: stricter (e.g., 10 req / 15 min)
authRouter.use(authLimiter);
```

### Input Validation

Every request body/params is validated with a Zod schema via the `validate()` middleware. Invalid payloads return `400` with field-level error messages before reaching the service layer.

### CORS

Allowed origins are configured via `CORS_ORIGINS` environment variable. Requests from unlisted origins are rejected with a CORS error response.

---

## 13. Cron Jobs

Scheduled background jobs run via `node-cron` in `src/jobs/`:

| Job | Schedule | Action |
|---|---|---|
| License Expiry Scanner | Daily at 8:00 AM | Finds drivers with licenses expiring in ≤ 30 days; can flag/notify |
| Document Expiry Scanner | Daily at 8:00 AM | Finds vehicle documents expiring in ≤ 30 days |

These jobs query indexed columns (`license_expiry_date`, `expires_at`) for O(log n) lookups.

---

## 14. Real-Time Events

Socket.IO events are emitted to connected clients when key state changes occur:

| Event | Trigger | Payload |
|---|---|---|
| `trip:dispatched` | Trip status → DISPATCHED | `{ tripId, vehicleId, driverId }` |
| `trip:completed` | Trip status → COMPLETED | `{ tripId }` |
| `trip:cancelled` | Trip status → CANCELLED | `{ tripId, reason }` |
| `vehicle:location` | New GPS ping received | `{ vehicleId, lat, lng, speed }` |
| `incident:filed` | New incident report created | `{ incidentId, type }` |

Clients subscribe to events via the `SocketContext` in the frontend.

---

## 15. Audit Trail

Every state-mutating operation (CREATE, UPDATE, DELETE) writes an immutable `AuditLog` record:

```typescript
await prisma.auditLog.create({
  data: {
    userId:    actor.id,
    entity:    'Trip',
    entityId:  trip.id,
    action:    'UPDATE',
    oldValues: { status: 'DRAFT' },
    newValues: { status: 'DISPATCHED' },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    reason:    'Dispatcher triggered dispatch',
  }
});
```

Audit logs are **never updated or deleted** — they serve as a forensic replay log. Queries support filtering by:
- `(entity, entityId)` — "Show all changes to Vehicle #42"
- `userId` — "Who changed what?"
- `timestamp` — "What happened between 10am and 11am?"

---

## 16. Testing

### Unit Tests (Jest)

```bash
npm test
# Watch mode: npm test -- --watch
# Coverage: npm test -- --coverage
```

Tests are co-located or in `__tests__/` directories within each module:

```
modules/dispatch/__tests__/
├── dispatch.service.test.ts   # State machine transition tests
└── dispatch.controller.test.ts
```

### Integration Tests (Supertest)

```typescript
import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();

test('POST /api/v1/auth/login returns token', async () => {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'manager@test.com', password: 'Test@123' });

  expect(res.status).toBe(200);
  expect(res.body.data.accessToken).toBeDefined();
});
```

### Coverage Targets

| Layer | Target |
|---|---|
| Service layer | ≥ 80% |
| Controllers | ≥ 70% |
| Validators | ≥ 90% |
| State machine transitions | 100% |

---

## 17. Coding Standards

### Module Structure Rules

1. **Business logic belongs in `*.service.ts`** — never in controllers.
2. **Controllers** only parse `req` and shape `res`. No Prisma calls.
3. **All DB access through Prisma** — no raw SQL.
4. **Audit log** on every write operation (enforced by service convention).
5. **Zod schema** for every request body via `validate()` middleware.

### Naming Conventions

| Entity | Convention | Example |
|---|---|---|
| Files | `kebab-case.ts` | `fleet.service.ts` |
| Functions / variables | `camelCase` | `createVehicle()` |
| Classes | `PascalCase` | `FleetService` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_RETRIES` |
| DB table names | `snake_case` | `fuel_logs` |
| Prisma field names | `camelCase` | `costPerLiter` |

### Commit Messages (Conventional Commits)

```
feat(dispatch): validate cargo weight against vehicle capacity
fix(auth): correct bcrypt comparison for special characters
refactor(fleet): extract odometer guard into shared utility
chore(deps): upgrade prisma to 5.11.0
test(hr): add driver status transition test cases
docs(api): add Swagger annotations for /finance/fuel endpoints
```
