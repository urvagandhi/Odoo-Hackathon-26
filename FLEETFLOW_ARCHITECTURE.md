# FleetFlow – Modular Fleet & Logistics Management System
## Master Architecture and Functional Blueprint

---

## 1. Executive System Overview

**System Purpose**
FleetFlow is designed as a centralized, highly-available digital hub explicitly constructed to eliminate manual logbooks and fragmented spreadsheet tracking. Its primary purpose: full-spectrum lifecycle optimization and real-time oversight. FleetFlow ensures maximal asset utilization, automates highly-constrained trip dispatch workflows, enforces legal and operational driver compliance, delivers granular operational cost tracking, and computes real-time financial ROI and fuel efficiency metrics via a unified analytics dashboard.

**Core Philosophy**
The guiding philosophy of FleetFlow is **Immutable Transparency and Rule-First Enforcement**. 
Data must be reliable at the source and transparent globally. From the moment a trip begins until the final expense is logged, every mutation is intercepted and validated by a rigorous business engine, leaving an immutable, tamper-proof audit trail. No user, regardless of role, can bypass constraints such as expired licenses or negative cost inputs. This design guarantees both immediate operational speed and indisputable financial accuracy during audits.

**Architectural Pattern**
The software is architected utilizing a **Modular Monolith** pattern. 
- **Why?** It runs inside a single Node.js deployment unit (Express), ensuring ultra-low latency, straightforward atomic transactions (since all modules share the exact same database connection), and rapid development velocity. 
- **Modularity:** Despite being a monolith, it maintains strict internal domain boundaries (Dispatch, Maintenance, Finance, HR). Service layers never bypass one another; the `TripService` must computationally ask the `VehicleService` for availability, strictly enforcing the open/closed principle. This approach lowers CI/CD and operational overhead while charting a straight path toward a microservices architecture if the company needs to scale domains (e.g., IoT telemetry) independently in the future.

**How Modules Interact (High-Level Data Flow)**
1. **Client Tier:** A React/Vite SPA caches data heavily via `React Query` pushing stateful HTTP/REST requests to the backend.
2. **API Gateway / Routing:** Express endpoints intercept traffic, apply JWT authentication, verify RBAC permissions, and sanitize JSON payloads against strict `Zod` schemas.
3. **Module Interoperability:**
   - The *Trip Dispatcher* domain interrogates the *Vehicle Registry* (availability, capacity) and *Driver Performance* (license status, duty state) before it permits a dispatch transition.
   - An incoming *FuelLog* or *Expense* updates the *Operational Analytics* cache synchronously via EventEmitter hooks bridging the domains.
   - Completing a *Maintenance Log* transitions a vehicle in the *Vehicle Registry* state machine automatically, releasing it back to the dispatch pool.
4. **Data Access Layer:** Prisma ORM translates domain requests into highly optimized SQL, hitting a PostgreSQL 16 database where constraints (CHECK, UNIQUE, FK) serve as the absolute final line of defense against race conditions and bad data.

---

## 2. Complete Domain Model

The database is built strictly in 3NF (Third Normal Form) and enforces integrity through indexes and DB-level constraints, avoiding application-layer-only validation.

### `User`
* **Table Name:** `users`
* **Fields:** 
  * `id` (BigInt, PK, Auto-increment)
  * `email` (String, UQ, Not Null)
  * `passwordHash` (String, Not Null)
  * `fullName` (String, Not Null)
  * `isActive` (Boolean, Default: true)
  * `createdAt`, `updatedAt` (Timestamptz)
* **Constraints:** `email` CHECK format regex; `passwordHash` length >= 60 (bcrypt).
* **Indexes:** B-Tree unique index on `email`.
* **Relationships:** 1:1 with `Role`, 1:N with `AuditLog`.

### `Role`
* **Table Name:** `roles`
* **Fields:** 
  * `id` (BigInt, PK)
  * `name` (String, UQ) - e.g., 'ADMIN', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCE'
  * `permissions` (JSONB) - granular RBAC map (e.g., `{"trips": ["create", "read", "update"]}`)
* **Unique Rules:** `name` must be unique.

### `Vehicle`
* **Table Name:** `vehicles`
* **Fields:** 
  * `id` (BigInt, PK)
  * `registrationNumber` (String, UQ, Not Null)
  * `make` (String)
  * `model` (String)
  * `year` (Int)
  * `capacityVolume` (Decimal 10,2)
  * `capacityWeight` (Decimal 10,2)
  * `status` (String/Enum: `AVAILABLE`, `ON_TRIP`, `IN_SHOP`, `RETIRED`)
  * `currentOdometer` (Decimal 15,2)
  * `createdAt`, `updatedAt` (Timestamptz)
* **Constraints:** `capacityVolume` >= 0; `capacityWeight` >= 0; `currentOdometer` >= 0. Odometer must never decrease (enforced by DB Trigger).
* **Indexes:** B-Tree on `status` (to rapidly query available vehicles). Unique on `registrationNumber`.
* **Relationships:** 1:N with `Trip`, `ServiceLog`, `FuelLog`. `onDelete: Restrict` for all.

### `Driver`
* **Table Name:** `drivers`
* **Fields:** 
  * `id` (BigInt, PK)
  * `licenseNumber` (String, UQ, Not Null)
  * `fullName` (String, Not Null)
  * `status` (String/Enum: `ON_DUTY`, `ON_TRIP`, `OFF_DUTY`, `SUSPENDED`)
  * `licenseExpiryDate` (DateTime)
  * `createdAt`, `updatedAt` (Timestamptz)
* **Constraints:** `licenseExpiryDate` > `createdAt`.
* **Derived Fields (App Layer):** `isLicenseValid` (boolean calculated on read: `licenseExpiryDate` > `NOW()`).
* **Indexes:** Partial index on `status = 'ON_DUTY'` for rapid dispatch assignment.
* **Relationships:** 1:N with `Trip`. `onDelete: Restrict`.

### `Trip`
* **Table Name:** `trips`
* **Fields:** 
  * `id` (BigInt, PK)
  * `vehicleId` (BigInt, FK)
  * `driverId` (BigInt, FK)
  * `origin` (String, Not Null)
  * `destination` (String, Not Null)
  * `distanceEstimated` (Decimal 10,2)
  * `distanceActual` (Decimal 10,2, Nullable)
  * `status` (String/Enum: `DRAFT`, `DISPATCHED`, `COMPLETED`, `CANCELLED`)
  * `dispatchTime` (Timestamptz, Nullable)
  * `completionTime` (Timestamptz, Nullable)
  * `createdAt`, `updatedAt` (Timestamptz)
* **Constraints:** `distanceEstimated` > 0.
* **Indexes:** Composite Index on `(driverId, status)`, `(vehicleId, status)`. Index on `createdAt`.
* **Relationships:** M:1 with `Vehicle`, M:1 with `Driver`, 1:N with `Expense`, 1:N with `Revenue`. Cascade child financial logs if Trip is deleted (though soft delete is preferred).

### `FuelLog`
* **Table Name:** `fuel_logs`
* **Fields:** 
  * `id` (BigInt, PK)
  * `vehicleId` (BigInt, FK)
  * `tripId` (BigInt, FK, Nullable)
  * `gallons` (Decimal 10,2)
  * `costPerGallon` (Decimal 10,2)
  * `totalCost` (Decimal 15,2)
  * `odometerAtFill` (Decimal 15,2)
  * `loggedAt` (Timestamptz)
* **Constraints:** `totalCost` = (`gallons` * `costPerGallon`). `gallons` > 0. `costPerGallon` > 0. `odometerAtFill` >= 0.
* **Relationships:** M:1 with `Vehicle`, M:1 with `Trip`.

### `ServiceLog`
* **Table Name:** `service_logs`
* **Fields:** 
  * `id` (BigInt, PK)
  * `vehicleId` (BigInt, FK)
  * `serviceType` (String)
  * `cost` (Decimal 15,2)
  * `description` (Text)
  * `serviceDate` (Timestamptz)
  * `odometerAtService` (Decimal 15,2)
* **Constraints:** `cost` >= 0.
* **Relationships:** M:1 with `Vehicle`.

### `Expense`
* **Table Name:** `expenses`
* **Fields:** 
  * `id` (BigInt, PK)
  * `tripId` (BigInt, FK)
  * `amount` (Decimal 15,2)
  * `category` (String/Enum: `TOLL`, `LODGING`, `MAINTENANCE_EN_ROUTE`, `MISC`)
  * `description` (String)
  * `dateLogged` (Timestamptz)
* **Constraints:** `amount` >= 0.
* **Relationships:** M:1 with `Trip`.

### `Revenue`
* **Table Name:** `revenues`
* **Fields:** 
  * `id` (BigInt, PK)
  * `tripId` (BigInt, FK)
  * `amount` (Decimal 15,2)
  * `clientName` (String)
  * `invoiceReference` (String, UQ)
  * `loggedAt` (Timestamptz)
* **Constraints:** `amount` >= 0.
* **Relationships:** M:1 with `Trip`.

### `AuditLog`
* **Table Name:** `audit_logs`
* **Fields:** 
  * `id` (BigInt, PK)
  * `userId` (BigInt, FK)
  * `entity` (String) - e.g., 'Trip', 'Vehicle'
  * `entityId` (BigInt)
  * `action` (String/Enum: `CREATE`, `UPDATE`, `DELETE`)
  * `oldValues` (JSONB)
  * `newValues` (JSONB)
  * `reason` (Text, Nullable)
  * `timestamp` (Timestamptz)
* **Behavior:** Append-only table. Updates bypass this table (it is immutable). Populated via Prisma extension hooks or DB triggers.

---

## 3. State Machines (Very Detailed)

The system relies heavily on explicit state machines to prevent impossible operational statuses (e.g., dispatching a broken truck).

### Vehicle State Machine
* **States:** `AVAILABLE`, `ON_TRIP`, `IN_SHOP`, `RETIRED`
* **Valid Transitions & Triggers:**
  * `AVAILABLE` -> `ON_TRIP`: Triggered when associated `Trip` status shifts to `DISPATCHED`. **Rule Engine:** Rejects if `Vehicle` is `IN_SHOP` or `RETIRED`.
  * `ON_TRIP` -> `AVAILABLE`: Triggered when associated `Trip` shifts to `COMPLETED` or `CANCELLED`.
  * `AVAILABLE` -> `IN_SHOP`: Triggered by Safety Officer creating an active `Maintenance Ticket` or flagging an issue.
  * `ON_TRIP` -> `IN_SHOP`: Edge case. Triggered if a mid-trip breakdown occurs. Automatically forces active `Trip` to `CANCELLED` (or `INCOMPLETE`).
  * `IN_SHOP` -> `AVAILABLE`: Triggered when a `ServiceLog` closing out the maintenance issue is recorded.
  * `*` -> `RETIRED`: Triggered explicitly by Fleet Manager. Irreversible terminal state.

### Driver State Machine
* **States:** `ON_DUTY`, `ON_TRIP`, `OFF_DUTY`, `SUSPENDED`
* **Valid Transitions & Triggers:**
  * `OFF_DUTY` -> `ON_DUTY`: Triggered by driver "Clock In" via API/mobile client.
  * `ON_DUTY` -> `ON_TRIP`: Triggered when assigned `Trip` shifts to `DISPATCHED`.
  * `ON_TRIP` -> `ON_DUTY`: Triggered when `Trip` is marked `COMPLETED` or `CANCELLED`.
  * `ON_DUTY` | `OFF_DUTY` -> `SUSPENDED`: Triggered automatically by a Node-Cron worker scanning `licenseExpiryDate` < `NOW()`, or manually by a Safety Officer logging an infraction. Transition universally blocks future dispatch.

### Trip State Machine
* **States:** `DRAFT`, `DISPATCHED`, `COMPLETED`, `CANCELLED`
* **Valid Transitions & Triggers:**
  * `[Creation]` -> `DRAFT`: Initial state for logistical planning. Vehicle and Driver variables can be altered.
  * `DRAFT` -> `DISPATCHED`: Triggered by "Launch Trip" API call. 
    - **Locks:** Obtains DB pessimistic lock on `Vehicle` and `Driver` rows. 
    - **Validations:** Ensures Driver is `ON_DUTY` and Vehicle is `AVAILABLE`. Fails otherwise.
    - **Side-effects:** Sets `dispatchTime = NOW()`, updates Driver to `ON_TRIP`, updates Vehicle to `ON_TRIP`.
  * `DISPATCHED` -> `COMPLETED`: Triggered by Dispatcher or Driver confirming arrival.
    - **Side-effects:** Sets `completionTime = NOW()`. Requires input for `distanceActual`. Frees up Vehicle and Driver back to baseline available states.
  * `DRAFT` | `DISPATCHED` -> `CANCELLED`: Triggered manually by Dispatcher. Must include a `reason` payload for audit logs. Rollbacks assignees. Terminal state.

---

## 4. Complete Project Workflow (Step-by-Step)

This describes the entire operational lifecycle through the system, noting what modules are engaged.

1. **Asset Intake (Vehicle Module):** Fleet Manager logs a new Peterbilt truck. `VehicleService` validates the payload (VIN uniqueness, capacity parameters). Database commits. State initializes to `AVAILABLE`. `AuditLog` captures creation.
2. **Driver Onboarding (HR/Safety Module):** Safety Officer registers "Jane Doe", scanning her CDL. Expiry date is 14 months future. State initializes to `OFF_DUTY`.
3. **Duty Toggle:** Jane logs into the portal/app and clocks in. Driver status -> `ON_DUTY`.
4. **Trip Planning (Dispatch Module):** A Dispatcher begins structuring a delivery from Chicago to Detroit. They create a new `Trip`. It lands in `DRAFT`. They select Jane and the Peterbilt.
5. **Validation & Pre-Flight Checks:** The Dispatcher clicks "Dispatch". The `TripService`:
   - Checks `DriverService`: Is Jane `ON_DUTY`? Is her license valid? (Yes/Yes).
   - Checks `VehicleService`: Is Peterbilt `AVAILABLE`? (Yes).
6. **Execution (Dispatch Module):** The transaction commits. 
   - `Trip` -> `DISPATCHED`
   - `Driver` -> `ON_TRIP`
   - `Vehicle` -> `ON_TRIP`
7. **Fuel Logging (Expense Module):** Mid-way, Jane refills the tank. She logs 100 gallons at $3.50/gal at an odometer reading of 45,100.
   - `FuelLog` row inserted. `totalCost` calculated.
   - `Vehicle.currentOdometer` updated to 45,100.
8. **Trip Completion (Dispatch Module):** Jane arrives in Detroit. She or the dispatcher inputs an actual distance of 285 miles. 
   - `Trip` -> `COMPLETED`.
   - `Driver` -> `ON_DUTY`.
   - `Vehicle` -> `AVAILABLE`.
9. **Financial Reconciliation (Finance Module):** Finance inputs a $15 `TOLL` Expense and an $800 Client `Revenue` entry referencing the Trip ID.
10. **Analytics Engine (Reporting Module):** A background worker or real-time query aggregates the `$350` fuel cost + `$15` toll. It computes `$365` total cost versus `$800` revenue. The `$435` raw profit, `Cost per KM`, and `Fuel Efficiency` are instantly visible on the Manager's dashboard.
11. **Maintenance Trigger (Maintenance Module):** The new odometer mark crosses a 10,000-mile service threshold. The system flags the Peterbilt, alerting the Safety Officer, and temporarily transitions the truck to `IN_SHOP` pending an oil change entry.

---

## 5. Business Rules & Validation Engine

The engine intercepts logic at both the Zod (Input) and Prisma (Service/DB) tiers.

**Strict Rules:**
- **Capacity Validation:** If a trip specifies cargo weight, `Trip.requestedWeight <= Vehicle.capacityWeight`. Fails at `422 Unprocessable Entity`.
- **Temporal Odometer Integrity:** A submitted `FuelLog` or `ServiceLog` `odometer` reading MUST be `>= Vehicle.currentOdometer`. Drivers cannot log fuel for past mileages. Prevents fraud. Fails at `409 Conflict`.
- **License Blocking:** An assigning attempt or dispatch attempt fails immediately if `driver.licenseExpiryDate < NOW() + 72 hours` (providing a buffer for long trips).
- **Concurrency / Duplicate Dispatch:** Express utilizes route-specific mutexes or Prisma `$transaction` locking. If two dispatchers attempt to assign the same `AVAILABLE` vehicle to different trips simultaneously, the second fails with `409 Conflict`.
- **Revenue/Cost Mutation Closure:** Once a trip is `COMPLETED`, appending further `Expense` or `Revenue` logs triggers a secondary re-audit review flag, potentially requiring `Finance` role overrides.
- **Soft Deletes:** Core entities (`Vehicle`, `Driver`) are never genuinely `DELETE`d to maintain historical `Trip` referential integrity. They simply enter `isDeleted = true` boolean states and are filtered out of global `findMany` queries.
- **Failure Response Behavior:** All failures return a standardized JSON structure with `success: false` and specific, actionable `details` array mapping to the UI fields.

---

## 6. Derived Metrics & Calculations

These metrics power the Dashboard/Command Center. To maintain speed, they are either computed via optimized Postgres aggregate queries (`GROUP BY`) or cached.

- **Utilization Rate:** 
  - *Formula:* `(Sum hours of vehicles ON_TRIP / Total potential operational hours in range) * 100`
  - *Data Source:* `Trip.dispatchTime` and `Trip.completionTime` diffs over window.
- **Fuel Efficiency (MPG / L/100km):**
  - *Formula:* `SUM(Trip.distanceActual) / SUM(FuelLog.gallons)`
  - *Scope:* Resolvable per-vehicle, per-driver, or fleet-wide.
- **Total Operational Cost:**
  - *Formula:* `SUM(FuelLog.totalCost) + SUM(ServiceLog.cost) + SUM(Expense.amount)`
- **Cost per Unit Distance (CPM / CPKM):**
  - *Formula:* `Total Operational Cost / SUM(distanceActual)`
  - *Crucial for dynamic pricing of future bids.*
- **Return on Investment (ROI):**
  - *Formula:* `((SUM(Revenue.amount) - Total Operational Cost) / Total Operational Cost) * 100`
- **Driver Completion Rate:**
  - *Formula:* `(Trips COMPLETED / Trips DISPATCHED + CANCELLED) * 100`
- **Safety / Incident Score:**
  - *Formula:* Start at 100 points. Subtract parameterized values for late completions, mid-trip breakdowns (ServiceLogs tied to active trips), or manual infractions logged.

**Recalculation Triggers:** Heavy aggregations invalidate caches specifically when a `Trip` hits `COMPLETED` or when a financial row (Fuel, Revenue, Expense) is inserted. Dashboard data is fetched heavily via SQL Views holding pre-aggregated totals.

---

## 7. Backend Architecture Design

**Service Separation (Modular Monolith)**
Folders map to business capabilities, not technical types alone.
```
src/
  dispatch/      (trips, assignments, state transitions)
  fleet/         (vehicles, telemetry, maintenance)
  hr/            (drivers, safety, credentials)
  finance/       (revenues, expenses, fuel)
```
Each folder contains its routes, validators, and domain services. They communicate via injected service calls (e.g., `dispatchService` calls `fleetService.verifyAvailability()`).

**Transactions and Boundaries**
State changes strictly use Prisma Interactive Transactions (`prisma.$transaction(async (tx) => { ... })`). If a trip is dispatched, the `trip` update, `driver` update, and `vehicle` update live in one transaction. Any exception rolls the entire schema block back, leaving no orphaned states.

**Real-Time Capabilities**
State synchronization is prepped for WebSockets (`socket.io`). When a vehicle changes from `AVAILABLE` to `ON_TRIP`, the API emits an event. The React dashboard subscribes to `fleet_updates` and turns the vehicle's visual pill blue automatically, without polling.

**Caching & Performance**
- Queries joining large ranges of `expenses` and `revenues` utilize PostgreSQL materialized views.  
- High-read lists (dropdowns for "Available Drivers") implement `ETag` caching and Indexed queries.

---

## 8. API Design

Endpoints adhere Strictly to REST.
All APIs sit behind `express-rate-limit` and `helmet`.

**Authentication & Role Restrictions**
JWT-based Bearer tokens. Middleware `requireRole(['DISPATCHER', 'ADMIN'])` intercepts and aborts unauthorized requests with `403 Forbidden`.

**Core Route Maps**
- **Vehicles:**
  - `GET /api/v1/vehicles` (Supports `?status=AVAILABLE` & standard pagination)
  - `POST /api/v1/vehicles` (Admin only)
  - `GET /api/v1/vehicles/:id/maintenance`
- **Trips:**
  - `POST /api/v1/trips` (Creates `DRAFT`)
  - `PATCH /api/v1/trips/:id/status` (Transitions state. Payload: `{ status: 'DISPATCHED' }`)
  - `GET /api/v1/trips/:id/ledger` (Returns aggregated Revenue/Expense for trip)
- **Finance:**
  - `POST /api/v1/finance/fuel`
  - `POST /api/v1/finance/revenue`

**Example Request/Response (Dispatching a Trip)**
*Request:*
`PATCH /api/v1/trips/845/status`
Headers: `Authorization: Bearer <token>`
```json
{
  "status": "DISPATCHED"
}
```
*Successful Response (200 OK):*
```json
{
  "success": true,
  "data": {
    "id": 845,
    "status": "DISPATCHED",
    "dispatchTime": "2026-10-15T08:30:00Z",
    "driver": { "id": 12, "status": "ON_TRIP" },
    "vehicle": { "id": 4, "status": "ON_TRIP" }
  },
  "meta": {
    "messages": ["Trip dispatched. Assets marked unavailable."]
  }
}
```

---

## 9. Frontend Architecture

**Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, custom ShadCN-style headless UI.

**State Management & Reactivity**
- Uses `TanStack React Query` for Server State. This caches API responses, deduplicates requests, and handles background polling.
- UI relies on **Optimistic Updates**. When clicking "Mark Complete" on a trip row, `React Query` immediately mutates the local cache to show a success state. If the network call crashes, it automatically rolls the row back to the previous state and throws an error toast.

**Loading Psychology**
- **Zero blocking spinners.** The application uses highly-tailored Skeleton Loaders. When navigating to the Vehicle Registry, users instantly see the page shell and pulsing gray bars that exactly mimic the data grid shape.
- `framer-motion` applies micro-animations (e.g., buttons depress visually; rows slide down on expansion) to create a physically engaging "app-like" feel.

**Command Center Dashboard**
The command center utilizes grid layouts. Top widgets show aggregate metrics (Utilization, Cost per Mile). The lower section is split between active warnings (Drivers expiring in < 30 days) and an active trip timeline.

**Filters and Data-Table Architecture**
Tables use a headless structure (e.g., React Table or TanStack Table). Pagination (cursor-based), sorting, and search state are synchronized directly to the URL parameters (`?sort=cost&dir=asc`), ensuring deep-links to specific data views work perfectly out-of-the-box.

---

## 10. Reporting & Export Layer

Data extraction is a critical enterprise requirement.

**Export Modes:**
- **CSV Streams:** A dedicated endpoint `GET /api/v1/reports/ledger/export?format=csv` triggers a `Fast-CSV` stream that pipes database cursor results directly to the HTTP response, avoiding Node memory crashes on massive exports.
- **PDF Generation:** Fleet managers need monthly P&L. Using highly structured HTML templates compiled by `Puppeteer / Playwright Core` to spit out heavily branded, print-ready PDF invoices and compliance audits.

**Views:**
- "Driver Time Audits" (Required for legal DOT compliance)
- "Vehicle Lifetime Cost" (Summation of all fuel, maintenance, minus allocated revenue)

---

## 11. Edge Cases & Failure Scenarios

Handling reality is what separates student projects from production systems.

- **Driver Suspended Mid-Trip:** Scenario: Safety officer manually suspends a driver while they are driving.
  * *System behavior:* Current trip remains in `DISPATCHED` (you cannot warp the truck back), but the system generates a high-priority flagged alert on the dashboard. Upon `COMPLETED`, the driver cannot be placed back `ON_DUTY` or assigned to subsequent trips.
- **Simultaneous Dispatch Attempt:** Scenario: Two dispatchers in different offices hit "Dispatch" for the same truck at the same millisecond.
  * *System behavior:* Database isolation levels trap the race condition. One saves first; the second queries the new state, realizes `Vehicle.status != AVAILABLE`, throws an exception, and the Express layer returns a `409 Conflict`.
- **Fuel Entered Without Odometer:** Scenario: Driver forgets dashboard reading.
  * *System behavior:* Reject payload at Zod validation. The odometer is non-negotiable for analytics integrity.
- **Network Failure During Dispatch Submission:** Scenario: App sends request, user goes into a tunnel.
  * *System behavior:* Idempotency keys or React Query cache diffs ensure when they refresh, they see the precise state the server ultimately settled on.

---

## 12. Security & Compliance

- **SQL Injection:** Impossible. Prisma utilizes parameterized queries exclusively. No raw string interpolation exists.
- **Authentication & Cryptography:** Passwords utilize `bcrypt` with salt rounds = 12. JWTs are signed with `HS256`, utilizing heavy asymmetric keys stored in Environment closures.
- **Role Separation (AuthZ):** A middleware wrapper intercepts REST routes. `GET /trips` is accessible to `DISPATCHER`. `DELETE /vehicles` is strictly `ADMIN`.
- **Audit Trails:** Everything leaves a footprint. The `AuditLog` captures exactly *Who* changed a record, *When* they changed it, and the absolute JSON diff between `oldValues` and `newValues`. Malicious internal changes can be entirely reconstructed by the CTO.

---

## 13. Scalability & Future Enhancements

The architecture is built to support scale beyond the hackathon proof-of-concept.

- **Read Replicas:** The Prisma schema allows configuring different connection URIs for intense reporting views, shifting Analytics queries away from the primary transactional Dispatch database.
- **Real-Time Tracking (IoT Strategy):** Establishing a Kafka / Redis pub-sub queue in the future to ingest raw GPS coordinates pinging every 5 seconds, offloading that traffic entirely from the REST API to prevent choking the event loop.
- **Multi-Region Sharding:** Logical mapping of entities to specific warehouse region codes.
- **Predictive Maintenance:** Feeding historical `ServiceLog` text data and mileage breakdown points into a regression model to alert Safety Officers roughly 500 miles *before* a catastrophic truck failure is statistically probable.

---

## 14. Deployment Strategy

- **Development Environment:** Entirely orchestrated via `docker-compose.yml`. One command spins up Postgres 16, pgAdmin, and an isolated Redis cache, matching production parity instantly for new developers.
- **Database Migrations:** Schema morphing is strictly linear. `npx prisma migrate deploy` runs asynchronously inside GitHub Actions / CI pipeline before code is deployed. Local structural changes are committed as timestamped `.sql` atomic migrations.
- **Production Paradigm:**
  - *Frontend:* Statically compiled via Vite and pushed to an edge network (Vercel, AWS CloudFront, Cloudflare Pages) ensuring sub-50ms Time To First Byte (TTFB).
  - *Backend API:* Dockerized Node.js Alpine container pushed to a managed service (AWS ECS Fargate, Heroku, or Render), auto-scaling based on CPU utilization limits.
  - *Database:* Managed AWS RDS PostgreSQL instance with automated daily point-in-time recovery snapshots encompassing full Write-Ahead Logging.
