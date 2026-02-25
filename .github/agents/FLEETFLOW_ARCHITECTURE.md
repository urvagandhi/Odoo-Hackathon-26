# FleetFlow – Modular Fleet & Logistics Management System

## Master Architecture Reference (Single Source of Truth for All Agents)

> This document is the canonical reference for all AI agents. Use this instead of guessing.
> Last Updated: 2026-02-25

---

## 1. System Overview

**FleetFlow** is a single-organization fleet management platform built as a **Modular Monolith**. It eliminates paper logbooks and spreadsheet tracking with automated state machines, an immutable audit trail, and a real-time KPI dashboard.

**Core Philosophy:** Immutable Transparency + Rule-First Enforcement.  
Every state mutation is validated server-side and logged in an append-only `audit_logs` table. No client-side code can bypass these rules.

---

## 2. Tech Stack (HARDCODED — Do Not Deviate)

| Layer       | Technology                                  | Version        |
| ----------- | ------------------------------------------- | -------------- |
| Backend     | Node.js + Express.js                        | 20 LTS / 4.x   |
| Language    | TypeScript (strict mode)                    | 5.x            |
| ORM         | Prisma ORM (Prisma Client + Prisma Migrate) | 5.x            |
| Validation  | Zod (backend request validation)            | 3.x            |
| Database    | PostgreSQL                                  | 16             |
| Frontend    | React + TypeScript + Vite                   | 19 / 5.x / 7.x |
| Styling     | Tailwind CSS                                | 4.x            |
| Routing     | React Router DOM                            | 7.x            |
| HTTP Client | Axios                                       | 1.x            |
| Auth        | JWT (jsonwebtoken) + bcryptjs               | —              |
| Real-time   | Socket.IO                                   | 4.x            |
| Cron Jobs   | node-cron                                   | 4.x            |
| Email       | Nodemailer                                  | 8.x            |
| API Docs    | Swagger UI Express                          | 5.x            |
| Security    | Helmet + express-rate-limit                 | 7.x / 7.x      |
| Logging     | Morgan                                      | 1.x            |
| Infra       | Docker Compose                              | —              |

---

## 3. Roles & Permissions

The system has **4 roles**. No SuperAdmin. `MANAGER` is the highest authority.

| Role              | Key Permissions                                                                       |
| ----------------- | ------------------------------------------------------------------------------------- |
| `MANAGER`         | Full access — vehicles, drivers, trips, finance, analytics, settings, user management |
| `DISPATCHER`      | Create/dispatch/complete/cancel trips; log fuel & expenses; view all data             |
| `SAFETY_OFFICER`  | Manage drivers; create maintenance logs; view incidents; read analytics               |
| `FINANCE_ANALYST` | View/export financial reports; read-only on vehicles/drivers/trips                    |

---

## 4. Backend Folder Structure (ACTUAL — not generic template)

```
backend/
├── src/
│   ├── server.ts              → HTTP server + Socket.IO bootstrap
│   ├── app.ts                 → Express factory: middleware + all routers
│   ├── prisma.ts              → Prisma Client singleton
│   │
│   ├── config/
│   │   ├── env.ts             → Zod-validated env loading
│   │   └── swagger.ts         → OpenAPI spec builder
│   │
│   ├── middleware/
│   │   ├── authenticate.ts    → JWT verify → attaches req.user
│   │   ├── authorize.ts       → Role guard factory: authorize(['MANAGER'])
│   │   ├── validate.ts        → Zod validation middleware factory
│   │   ├── errorHandler.ts    → Global error → HTTP code map
│   │   └── auditLogger.ts     → Writes to audit_logs table
│   │
│   ├── modules/               ← FEATURE-FIRST MODULES (not routes/services/)
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.validator.ts
│   │   ├── fleet/             → Vehicle CRUD + status machine
│   │   │   ├── fleet.routes.ts
│   │   │   ├── fleet.controller.ts
│   │   │   ├── fleet.service.ts
│   │   │   └── fleet.validator.ts
│   │   ├── dispatch/          → Trip lifecycle (create, dispatch, complete, cancel)
│   │   ├── hr/                → Driver management
│   │   ├── finance/           → Fuel logs + expenses
│   │   ├── analytics/         → KPI aggregation
│   │   ├── incidents/         → Safety incident reports
│   │   ├── locations/         → GPS telemetry
│   │   └── me/                → Authenticated user profile
│   │
│   ├── services/
│   │   └── email.service.ts   → Nodemailer wrapper
│   │
│   ├── sockets/
│   │   └── socketHandler.ts   → Socket.IO event definitions
│   │
│   └── jobs/
│       └── complianceJobs.ts  → node-cron jobs (license expiry scanner)
│
├── prisma/
│   ├── schema.prisma          → Database schema (SINGLE SOURCE OF TRUTH)
│   ├── seed.ts                → Comprehensive demo data seeder
│   └── migrations/            → Prisma migration history
│
├── package.json
├── tsconfig.json
└── Dockerfile
```

> ⚠️ **CRITICAL**: The backend uses `modules/<domain>/<domain>.routes.ts` pattern, NOT a flat `routes/` directory. Do NOT create files in `backend/src/routes/` — they belong inside the relevant module folder.

---

## 5. API Routes (All Registered in app.ts)

Base path: `/api/v1`

| Module           | Router File                             | Mount Path          |
| ---------------- | --------------------------------------- | ------------------- |
| Auth             | `modules/auth/auth.routes.ts`           | `/api/v1/auth`      |
| Fleet (Vehicles) | `modules/fleet/fleet.routes.ts`         | `/api/v1/vehicles`  |
| Dispatch (Trips) | `modules/dispatch/dispatch.routes.ts`   | `/api/v1/trips`     |
| HR (Drivers)     | `modules/hr/hr.routes.ts`               | `/api/v1/drivers`   |
| Finance          | `modules/finance/finance.routes.ts`     | `/api/v1/finance`   |
| Analytics        | `modules/analytics/analytics.routes.ts` | `/api/v1/analytics` |
| Incidents        | `modules/incidents/incidents.routes.ts` | `/api/v1/incidents` |
| Locations        | `modules/locations/locations.routes.ts` | `/api/v1/locations` |
| Me (Profile)     | `modules/me/me.routes.ts`               | `/api/v1/me`        |
| Health           | (inline in app.ts)                      | `/health`           |
| API Docs         | Swagger UI                              | `/api/docs`         |

---

## 6. Frontend Folder Structure (ACTUAL)

```
frontend/src/
├── main.tsx                   → React DOM root, Router, context providers
├── index.css                  → Tailwind base + CSS design tokens
│
├── api/
│   └── client.ts              → Axios instance + request/response interceptors
│
├── components/
│   ├── Layout.tsx             → App shell (sidebar + <Outlet>)
│   ├── Navbar.tsx             → Top bar (user menu, role badge, theme toggle)
│   ├── ProtectedRoute.tsx     → Auth guard + role guard
│   ├── LoadingSpinner.tsx
│   ├── ui/                    → Atomic UI primitives
│   │   ├── Badge.tsx, Button.tsx, Card.tsx, Modal.tsx
│   │   ├── Table.tsx, StatCard.tsx, EmptyState.tsx
│   │   ├── Pagination.tsx, SearchFilter.tsx, StatusBadge.tsx
│   │   └── Tooltip.tsx
│   ├── forms/                 → Domain-specific form components
│   │   ├── VehicleForm.tsx, DriverForm.tsx, TripForm.tsx
│   │   ├── FuelLogForm.tsx, ExpenseForm.tsx, MaintenanceForm.tsx
│   │   ├── IncidentForm.tsx, UserForm.tsx
│   ├── navigation/
│   └── feedback/              → Toast, error boundaries
│
├── context/
│   ├── AuthContext.tsx        → User session (login, logout, token)
│   ├── ThemeContext.tsx       → Light/dark mode + persistence
│   └── SocketContext.tsx      → Socket.IO client connection
│
├── hooks/
│   ├── useAuth.ts
│   └── useSocket.ts
│
├── layouts/
│   ├── DashboardLayout.tsx
│   ├── AuthLayout.tsx
│   └── PrintLayout.tsx
│
├── pages/                     → 25+ route-level page components
│   ├── Landing.tsx, Login.tsx, ForgotPassword.tsx, ResetPassword.tsx
│   ├── CommandCenter.tsx      → Main KPI dashboard
│   ├── VehicleRegistry.tsx, Fleet.tsx
│   ├── Drivers.tsx, DriverManagement.tsx, DriverPerformance.tsx
│   ├── DriverDashboard.tsx    → Driver self-service
│   ├── Dispatch.tsx, TripDispatcher.tsx
│   ├── FuelExpenses.tsx, Expenses.tsx
│   ├── Maintenance.tsx
│   ├── Incidents.tsx
│   ├── Analytics.tsx, FinancialReports.tsx, FleetDashboard.tsx
│   ├── Settings.tsx, Profile.tsx
│   ├── NotFound.tsx, ComingSoon.tsx
│   └── dashboards/            → Role-specific dashboard views
│
├── routes/
│   └── index.tsx              → React Router v7 route tree
│
└── validators/                → Zod schemas for form validation
    ├── vehicle.ts, driver.ts, trip.ts, fuelLog.ts, auth.ts
```

---

## 7. Database Models (Actual Prisma Schema)

| Prisma Model        | Table               | Key Fields                                                                                                                                                                               |
| ------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `User`              | `users`             | id, email (UNIQUE), passwordHash, fullName, role (enum), isActive, resetToken, resetTokenExpiry                                                                                          |
| `VehicleTypeRecord` | `vehicle_types`     | id, name (TRUCK/VAN/BIKE/PLANE/etc.)                                                                                                                                                     |
| `Vehicle`           | `vehicles`          | id, registrationNumber (UNIQUE), make, model, year, typeId, capacityWeight, capacityVolume, currentOdometer, status (enum), isDeleted, deletedAt                                         |
| `Driver`            | `drivers`           | id, licenseNumber (UNIQUE), fullName, licenseExpiryDate, licenseClass, phone, email, status (enum), safetyScore, isDeleted, deletedAt                                                    |
| `Trip`              | `trips`             | id, vehicleId, driverId, origin, destination, cargoWeight, cargoDescription, distanceEstimated, distanceActual, status (enum), dispatchTime, completionTime, cancelledReason, clientName |
| `FuelLog`           | `fuel_logs`         | id, vehicleId, tripId (nullable), liters, costPerLiter, totalCost, odometerAtFill, loggedAt, stationName                                                                                 |
| `MaintenanceLog`    | `maintenance_logs`  | id, vehicleId, serviceType (enum), cost, description, serviceDate, odometerAtService, nextServiceDue, technicianName, shopName, closedAt                                                 |
| `Expense`           | `expenses`          | id, tripId, vehicleId (nullable), category (enum: TOLL/LODGING/MAINTENANCE_EN_ROUTE/MISC), amount, description, dateLogged                                                               |
| `VehicleLocation`   | `vehicle_locations` | id, vehicleId, latitude, longitude, speed, heading, timestamp                                                                                                                            |
| `VehicleDocument`   | `vehicle_documents` | id, vehicleId, documentType, expiresAt, fileUrl, isVerified                                                                                                                              |
| `TripWaypoint`      | `trip_waypoints`    | id, tripId, sequenceOrder, location, arrivedAt (nullable)                                                                                                                                |
| `IncidentReport`    | `incident_reports`  | id, vehicleId, driverId, tripId (nullable), type (enum), severity (enum), description, status (enum), reportedAt, resolvedAt                                                             |
| `AuditLog`          | `audit_logs`        | id, userId (nullable), entity, entityId, action (enum), oldValues (JSON), newValues (JSON), ipAddress, userAgent, reason, timestamp                                                      |

### Enums (exact values — use these, not variations)

```
UserRole:            MANAGER | DISPATCHER | SAFETY_OFFICER | FINANCE_ANALYST
VehicleStatus:       AVAILABLE | ON_TRIP | IN_SHOP | RETIRED
DriverStatus:        ON_DUTY | ON_TRIP | OFF_DUTY | SUSPENDED
TripStatus:          DRAFT | DISPATCHED | COMPLETED | CANCELLED
MaintenanceType:     OIL_CHANGE | BRAKE_INSPECTION | TIRE_ROTATION | ENGINE_REPAIR | TRANSMISSION | AC_SERVICE | ELECTRICAL | BODY_WORK | ANNUAL_INSPECTION | OTHER
ExpenseCategory:     TOLL | LODGING | MAINTENANCE_EN_ROUTE | MISC
IncidentType:        ACCIDENT | BREAKDOWN | TRAFFIC_VIOLATION | CARGO_DAMAGE | NEAR_MISS | OTHER
IncidentSeverity:    LOW | MEDIUM | HIGH | CRITICAL
IncidentStatus:      OPEN | UNDER_REVIEW | RESOLVED | CLOSED
AuditAction:         CREATE | UPDATE | DELETE | STATE_CHANGE | LOGIN | LOGOUT
```

---

## 8. State Machines (Enforced Server-Side in Service Layer)

### Vehicle Status Transitions

```
AVAILABLE → ON_TRIP      (Trip dispatched)
AVAILABLE → IN_SHOP      (Maintenance log created)
AVAILABLE → RETIRED      (Manager retires vehicle)
ON_TRIP   → AVAILABLE    (Trip completed or cancelled)
IN_SHOP   → AVAILABLE    (Maintenance log closed)
* → RETIRED              (Terminal — irreversible)
```

### Driver Status Transitions

```
OFF_DUTY  → ON_DUTY      (Manager or driver activates)
ON_DUTY   → OFF_DUTY     (Clock out)
ON_DUTY   → ON_TRIP      (Trip dispatched)
ON_TRIP   → ON_DUTY      (Trip completed or cancelled)
ON_DUTY   → SUSPENDED    (License expired or safety violation)
OFF_DUTY  → SUSPENDED    (License expired or safety violation)
SUSPENDED → OFF_DUTY     (Manager lifts suspension)
```

### Trip Status Transitions (with Side Effects)

```
[Create]      → DRAFT
DRAFT         → DISPATCHED   (Vehicle must be AVAILABLE; Driver must be ON_DUTY)
              Side effects: Vehicle → ON_TRIP, Driver → ON_TRIP, trip.dispatchTime = NOW()

DISPATCHED    → COMPLETED    (distanceActual required)
              Side effects: Vehicle → AVAILABLE, Driver → ON_DUTY, currentOdometer updated,
                            trip.completionTime = NOW()

DRAFT         → CANCELLED    (reason required)
DISPATCHED    → CANCELLED    (reason required)
              Side effects (if was DISPATCHED): Vehicle → AVAILABLE, Driver → ON_DUTY
```

---

## 9. Request Middleware Pipeline

Every request flows through this pipeline in order:

```
1. helmet()           → Security headers
2. cors()             → Origin whitelist from CORS_ORIGINS env
3. morgan()           → HTTP request logging
4. express.json()     → Body parsing
5. rateLimit()        → 100 req/15 min per IP (global)
──────────────────────────────────────────────── Per-route middleware:
6. authenticate()     → Verify JWT, attach req.user = { id, email, role }
7. authorize(roles[]) → Check req.user.role against allowed list
8. validate(schema)   → Zod body/params validation — returns 400 on failure
──────────────────────────────────────────────── Business logic:
9. Controller → Service → Prisma Client
10. errorHandler()    → Global error → HTTP code mapping
```

### Error Code → HTTP Status Mapping

| Error                  | HTTP                      |
| ---------------------- | ------------------------- |
| ZodError               | 400 Bad Request           |
| Unauthenticated        | 401 Unauthorized          |
| Forbidden (role)       | 403 Forbidden             |
| Not found              | 404 Not Found             |
| State machine conflict | 409 Conflict              |
| Prisma P2025           | 404 Not Found             |
| Prisma P2002 (unique)  | 409 Conflict              |
| Unknown                | 500 Internal Server Error |

---

## 10. Audit Trail Design

Every write operation (CREATE, UPDATE, DELETE, STATE_CHANGE) MUST write an `AuditLog` record:

```typescript
await prisma.auditLog.create({
  data: {
    userId: actor.id, // null if system job
    entity: "Trip",
    entityId: trip.id,
    action: "STATE_CHANGE",
    oldValues: { status: "DRAFT" },
    newValues: { status: "DISPATCHED" },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    reason: "Dispatcher triggered dispatch",
  },
});
```

Audit logs are **append-only** — never updated or deleted. This is the forensic replay log.

---

## 11. Real-Time Events (Socket.IO)

| Event              | Trigger              | Payload                           |
| ------------------ | -------------------- | --------------------------------- |
| `trip:dispatched`  | Trip → DISPATCHED    | `{ tripId, vehicleId, driverId }` |
| `trip:completed`   | Trip → COMPLETED     | `{ tripId }`                      |
| `trip:cancelled`   | Trip → CANCELLED     | `{ tripId, reason }`              |
| `vehicle:location` | GPS ping received    | `{ vehicleId, lat, lng, speed }`  |
| `incident:filed`   | New incident created | `{ incidentId, type }`            |

---

## 12. Key Business Rules

1. **Odometer monotonically increasing** — FuelLog `odometerAtFill` must be ≥ `Vehicle.currentOdometer`. Enforced in service layer.
2. **FuelLog cost consistency** — `totalCost = liters × costPerLiter`. Calculated and stored at write time.
3. **Capacity check** — `Trip.cargoWeight ≤ Vehicle.capacityWeight`. Validated in dispatch service.
4. **License validity** — Driver must have `licenseExpiryDate > NOW()` to be dispatched.
5. **Soft deletes** — `Vehicle` and `Driver` use `isDeleted` + `deletedAt`. Never physically deleted while historical trips exist.
6. **Concurrent dispatch** — Prisma `$transaction` with `FOR UPDATE` locks prevent race conditions.
7. **Password reset** — Token hashed (SHA-256) before storage; expires in 15 minutes.
8. **Cron: License expiry** — Daily scan flags drivers with `licenseExpiryDate ≤ NOW() + 30 days`.

---

## 13. Environment Variables

```env
# Database
POSTGRES_DB=fleetflow_db
POSTGRES_USER=fleetflow
POSTGRES_PASSWORD=<secure>
DATABASE_URL=postgresql://fleetflow:<pw>@localhost:5432/fleetflow_db

# Server
PORT=5000
NODE_ENV=development

# Auth
JWT_SECRET=<min 32 chars>
JWT_EXPIRES_IN=15m

# CORS
CORS_ORIGINS=["http://localhost:5173"]

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<email>
SMTP_PASS=<password>
EMAIL_FROM=noreply@fleetflow.com
```

Frontend (in `frontend/.env`):

```env
VITE_API_BASE_URL=http://localhost:5000
```

---

## 14. Seed Users (from prisma/seed.ts)

| Email                      | Password         | Role            |
| -------------------------- | ---------------- | --------------- |
| `manager@fleetflow.com`    | `Manager@123`    | MANAGER         |
| `dispatcher@fleetflow.com` | `Dispatcher@123` | DISPATCHER      |
| `safety@fleetflow.com`     | `Safety@123`     | SAFETY_OFFICER  |
| `finance@fleetflow.com`    | `Finance@123`    | FINANCE_ANALYST |

---

## 15. Deployment

### Local Development (Recommended)

```bash
# One command — starts PostgreSQL + pgAdmin + API + Frontend
docker-compose up -d

# API: http://localhost:5000
# Frontend: http://localhost:5173
# Swagger: http://localhost:5000/api/docs
# pgAdmin: http://localhost:5050
```

### Manual Setup

```bash
# Backend
cd backend && npm install
cp ../.env.example .env  # edit values
npx prisma migrate dev
npm run prisma:seed
npm run dev

# Frontend (new terminal)
cd frontend && npm install
npm run dev
```

### Production Build

```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build
# Serve dist/ with nginx, Vercel, or Netlify
```
