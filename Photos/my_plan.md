🏗️ Execution Plan — 6-Hour Sprint
PHASE 1: Foundation (Hour 0–1)
1A. Backend Setup (~20 min)

Create the backend/ folder with Express.js 5 + TypeScript + Prisma ORM
Setup: index.ts, config.ts, CORS, helmet, rate limiting, health endpoint
Install deps: express, prisma, bcrypt, jsonwebtoken, zod, cors, helmet
1B. Database Schema (~40 min) — MOST CRITICAL for judging

Design the Prisma schema with all tables from the architecture doc:
User (id, email, passwordHash, fullName, role, isActive)
Vehicle (id, registrationNumber, make, model, year, capacityWeight, status, currentOdometer)
Driver (id, fullName, licenseNumber, licenseExpiryDate, status, safetyScore)
Trip (id, vehicleId, driverId, origin, destination, cargoWeight, status, dispatchTime, completionTime)
FuelLog (id, vehicleId, tripId, liters, costPerLiter, totalCost, odometerAtFill)
ServiceLog (id, vehicleId, serviceType, cost, description, serviceDate)
Expense (id, tripId, category, amount, description)
All with proper FK relations, constraints, indexes, enums
Run prisma migrate dev
PHASE 2: Core Backend APIs (Hour 1–2.5)
2A. Auth System (~30 min)

POST /api/v1/auth/register — bcrypt hash password, create user
POST /api/v1/auth/login — verify credentials, return JWT
Auth middleware: extract JWT from Authorization: Bearer <token>, attach req.user
RBAC middleware: requireRole(['ADMIN', 'DISPATCHER'])
2B. Vehicle CRUD (~20 min)

GET /api/v1/vehicles — list all (with ?status=AVAILABLE filter)
POST /api/v1/vehicles — create new vehicle
PUT /api/v1/vehicles/:id — update vehicle
PATCH /api/v1/vehicles/:id/status — manual status toggle (retire)
2C. Driver CRUD (~20 min)

GET /api/v1/drivers — list (with status filter)
POST /api/v1/drivers — register driver
PUT /api/v1/drivers/:id — update driver
License expiry check: computed field isLicenseValid
2D. Trip Dispatch (~30 min) — The business logic core

POST /api/v1/trips — create DRAFT trip
PATCH /api/v1/trips/:id/dispatch — dispatch (validates: vehicle available, driver on duty, license valid, cargo ≤ capacity). Uses Prisma transaction to atomically update Trip + Vehicle + Driver status
PATCH /api/v1/trips/:id/complete — complete trip (frees vehicle + driver)
PATCH /api/v1/trips/:id/cancel — cancel trip
2E. Finance APIs (~20 min)

POST /api/v1/fuel-logs — log fuel entry
POST /api/v1/expenses — log expense for a trip
GET /api/v1/trips/:id/ledger — aggregated costs for a trip
2F. Maintenance (~15 min)

POST /api/v1/service-logs — create service log (auto-sets vehicle to IN_SHOP)
PATCH /api/v1/service-logs/:id/close — close service (auto-sets vehicle back to AVAILABLE)
PHASE 3: Frontend — Replace Boilerplate with FleetFlow (Hour 2.5–5)
3A. Rebrand + Navigation (~20 min)

Rename "HackStack" → "FleetFlow" everywhere
Update Navbar with sidebar navigation: Dashboard, Vehicle Registry, Trip Dispatcher, Maintenance, Expenses, Drivers, Analytics
Update router with all new routes
Replace mock auth with real JWT auth flow
3B. Login & Registration (~20 min)

Update existing Login page branding to FleetFlow
Add Registration page with role selection
Connect to real POST /auth/login and POST /auth/register
3C. Dashboard / Command Center (~30 min)

KPI StatCards: Active Fleet count, Maintenance Alerts, Utilization Rate %, Pending Cargo
Recent trips table (DataTable component)
Quick action buttons: New Trip, New Vehicle
3D. Vehicle Registry Page (~25 min)

CrudLayout with DataTable showing all vehicles
Columns: #, Plate, Model, Type, Capacity, Odometer, Status (color pill), Actions
"New Vehicle" form (modal/drawer)
Status filtering, search
3E. Trip Dispatcher Page (~30 min)

DataTable of trips with status pills (Draft → Dispatched → Completed → Cancelled)
"New Trip" form: Select Vehicle (dropdown, only AVAILABLE), Select Driver (dropdown, only ON_DUTY + valid license), Cargo Weight, Origin, Destination
Validation: show error if cargo > vehicle capacity
Dispatch / Complete / Cancel action buttons
3F. Maintenance & Service Logs Page (~20 min)

CrudLayout listing service logs
"New Service" form: select vehicle, issue type, date
Auto-display that vehicle goes to "In Shop"
3G. Expense & Fuel Logging Page (~20 min)

Table of trip expenses (fuel + misc)
"Add Expense" form linked to Trip ID
Display calculated Total Operational Cost per trip
3H. Driver Performance Page (~20 min)

Table: Name, License#, Expiry, Completion Rate, Safety Score, Status pill, Complaints
Visual indicators for expiring licenses (red/amber)
3I. Analytics / Reports Page (~25 min)

StatCards: Total Fuel Cost, Fleet ROI, Utilization Rate
Simple charts (bar/line) for Fuel Efficiency trend, Top 5 Costliest Vehicles
Financial Summary table (Month, Revenue, Fuel Cost, Maintenance, Net Profit)
PHASE 4: Polish & Demo Prep (Hour 5–6)
4A. Integration Testing (~20 min)

Full workflow test: Create Vehicle → Create Driver → Create Trip → Dispatch → Complete → Log Fuel → See Analytics
Fix any broken flows
4B. UI Polish (~20 min)

Consistent status pills (green=Available, blue=On Trip, orange=In Shop, gray=Retired)
Loading skeletons on all pages
Toast notifications for all CRUD operations
Empty states for tables
4C. Docker & Demo (~20 min)

Verify docker compose up --build works end-to-end
Seed database with demo data (5 vehicles, 3 drivers, 10 trips)
Prepare demo flow script
🛠️ Tech Stack Summary
Layer	Technology	Why
Frontend	React 19 + TypeScript + Vite 7 + Tailwind v4	Already setup, modern, fast
UI Components	Lucide icons + Framer Motion + custom headless components	Already built in boilerplate
Backend	Node.js + Express.js 5 + TypeScript	Required by project spec
ORM	Prisma ORM	Type-safe, auto-generates client, handles migrations
Database	PostgreSQL 16	Relational, constraints, indexes — highest judge score
Auth	JWT (jsonwebtoken) + bcrypt	Industry standard
Validation	Zod (both frontend + backend)	Same validation library everywhere
Infra	Docker Compose	One command to run everything
🎯 What Impresses Judges (Priority Order)
Database design (3NF, constraints, indexes, FKs) — already documented in architecture doc
Business logic (state machines, capacity validation, license blocking) — must be functional in demo
Working end-to-end flow (register → create vehicle → assign trip → complete → see analytics)
Clean UI (status pills, data tables, loading states, toast feedback)
Code quality (modular services, Zod validation, TypeScript strict)
📋 Priority If Running Low on Time
If you're behind at hour 4, cut Analytics/Reports and Driver Performance. The must-haves are:

✅ Auth (Login/Register)
✅ Vehicle CRUD
✅ Driver CRUD
✅ Trip Dispatch (create → dispatch → complete) with capacity validation
✅ Dashboard with live KPIs
✅ Maintenance (auto status change)
Ready to start coding? Say the word and I'll begin with Phase 1A (backend setup) immediately.