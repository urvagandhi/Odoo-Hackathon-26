# 🗺️ FleetFlow — Phase-Wise Execution Plan

> **Goal:** Take the app from "login works" → "full end-to-end demo-ready"
> Every task is sequenced so each phase builds on the last. No phase depends on a later one.

---

## Current State Summary

| Layer | Status | What Works |
|-------|--------|------------|
| Database | ✅ 95% | 10 models, all enums, indexes, FKs, state machines |
| Backend APIs | ✅ 85% | Auth, Fleet CRUD, Trip dispatch (transactional), HR, Finance, Locations |
| Frontend Auth | ✅ 100% | Login, forgot/reset password, JWT, RBAC, theme toggle |
| Frontend Shell | ✅ 90% | Sidebar, header, nav tabs, user dropdown, dark/light |
| Frontend Pages | ❌ 10% | Only Dashboard exists (hardcoded mock data) |
| Demo Flow | ❌ 0% | Can login, but can't do Vehicle → Driver → Trip → Complete → Analytics |

---

## Phase Overview (7 Phases)

```
Phase 0: Cleanup & Foundation       (~30 min)  — Remove boilerplate, fix routes, dark mode primitives
Phase 1: Vehicle Registry           (~45 min)  — First real CRUD page, the template for all others
Phase 2: Driver Management          (~40 min)  — Second CRUD page + license expiry logic
Phase 3: Trip Dispatcher            (~60 min)  — The star feature — filtered dropdowns, capacity check, state machine
Phase 4: Maintenance & Finance      (~45 min)  — Service logs (auto IN_SHOP), fuel logs, expenses
Phase 5: Dashboard & Analytics      (~45 min)  — Backend analytics API + real KPI dashboard + analytics page
Phase 6: Polish & Demo Prep         (~30 min)  — Profile, Settings, branding, seed data, integration test
                                    ─────────
                                    ~4.5 hours total
```

---

---

## Phase 0: Cleanup & Foundation

> **Why first?** Every page we build after this will reuse these fixes. Doing it later means rework.

### Task 0.1 — Remove Legacy Boilerplate Files

**Problem:** The codebase has leftover "items" CRUD from the hackathon starter template. These files reference `/api/items` endpoints that don't exist in our backend, pollute the project, and confuse navigation.

**Files to delete:**
- `frontend/src/pages/ItemsList.tsx`
- `frontend/src/pages/CreateItem.tsx`
- `frontend/src/components/ItemCard.tsx`
- `frontend/src/components/ItemForm.tsx`
- `frontend/src/validators/item.ts`
- `frontend/src/hooks/useItems.ts`

**Files to edit:**
- `frontend/src/api/client.ts` — Remove the entire `itemsApi` object (the `getAll`, `getById`, `create`, `update`, `delete` block that calls `/api/items`). Keep `authApi` untouched.

**Verification:** `npx tsc --noEmit` should pass after removing imports.

---

### Task 0.2 — Fix Router with FleetFlow Routes

**Problem:** The router still has `/items` and `/items/new` routes. It's missing `/fleet`, `/trips`, `/drivers`, `/maintenance`, `/expenses`, `/analytics`. The Layout sidebar nav links to these paths, but they all 404.

**Changes to `frontend/src/routes/router.tsx`:**

```
Remove:
  /items        → ItemsList
  /items/new    → CreateItem

Add (as children of the Layout route):
  /fleet        → VehicleRegistry     (placeholder until Phase 1)
  /trips        → TripDispatcher      (placeholder until Phase 3)
  /drivers      → DriverManagement    (placeholder until Phase 2)
  /maintenance  → Maintenance         (placeholder until Phase 4)
  /expenses     → Expenses            (placeholder until Phase 4)
  /analytics    → Analytics           (placeholder until Phase 5)

Keep:
  /             → Dashboard
  /profile      → Profile
  /settings     → Settings
  /demo         → UIDemo
```

**Create placeholder page:** `frontend/src/pages/ComingSoon.tsx` — A simple themed page that says "Under Construction" with the page name. Use `useTheme()` for dark mode. This lets all nav links work immediately without crashing.

---

### Task 0.3 — Dark Mode for UI Primitives

**Problem:** All shared UI components (`DataTable`, `StatCard`, `AlertDialog`, `DropdownMenu`, `Breadcrumb`, `PageHeader`, `SectionCard`) use hardcoded light colors (`bg-white`, `text-slate-900`). When the user toggles dark mode, these components look broken — white cards on dark backgrounds.

**Strategy:** Each component needs `isDark` from `useTheme()` and conditional classes. This is a mechanical find-and-replace for each component.

**Components to update (7 files):**

| Component | Key Changes |
|-----------|-------------|
| `DataTable.tsx` | Card bg, header text, row hover, border, skeleton colors |
| `StatCard.tsx` | Card bg, icon bg, value text, label text, trend colors |
| `PageHeader.tsx` | Title text, subtitle text, icon badge bg |
| `AlertDialog.tsx` | Overlay opacity, dialog bg, title/desc text, button colors |
| `DropdownMenu.tsx` | Menu bg, item hover, separator color, text colors |
| `Breadcrumb.tsx` | Link text, separator color, current page text |
| `SectionCard.tsx` | Card bg, border, title text, description text |

**Pattern for each component:**
```tsx
import { useTheme } from '../../context/ThemeContext'; // adjust path

// Inside component:
const { isDark } = useTheme();

// Replace hardcoded:  bg-white → isDark ? 'bg-neutral-800' : 'bg-white'
// Replace hardcoded:  text-slate-900 → isDark ? 'text-white' : 'text-neutral-900'
// Replace hardcoded:  border-slate-200 → isDark ? 'border-neutral-700' : 'border-neutral-200'
```

**Also update:**
- `Toast.tsx` — Toast cards are `bg-white`, need dark variant
- `NotFoundIllustration.tsx` — Hardcoded light backgrounds
- `LoadingSpinner.tsx` — Hardcoded `text-slate-500`

**Verification:** Toggle theme on any page — no white flashes, no unreadable text.

---

### Task 0.4 — Fix Branding Leftovers

**Problem:** "HackStack" still appears in the app.

**Files to fix:**
- `frontend/src/pages/NotFound.tsx` — Footer says "© 2026 HackStack" → change to "© 2026 FleetFlow"
- `frontend/src/pages/Profile.tsx` — Sidebar says "Member of HackStack" → will be fully rebuilt in Phase 6
- `frontend/src/pages/Settings.tsx` — Has hardcoded "Urva Gandhi" → will be fully rebuilt in Phase 6

**For now:** Just fix NotFound.tsx branding + add dark mode to it.

---

### Task 0.5 — Add Fleet API Functions to Client

**Problem:** `frontend/src/api/client.ts` only has `authApi`. We need API wrapper functions for vehicles, drivers, trips, finance, and locations to use in all the domain pages.

**Add to `client.ts`:**

```typescript
// ── Fleet (Vehicles) ──
export const fleetApi = {
  listVehicles: (params?) => api.get('/api/v1/fleet/vehicles', { params }),
  getVehicle: (id) => api.get(`/api/v1/fleet/vehicles/${id}`),
  createVehicle: (data) => api.post('/api/v1/fleet/vehicles', data),
  updateVehicle: (id, data) => api.patch(`/api/v1/fleet/vehicles/${id}`, data),
  updateVehicleStatus: (id, data) => api.patch(`/api/v1/fleet/vehicles/${id}/status`, data),
  deleteVehicle: (id) => api.delete(`/api/v1/fleet/vehicles/${id}`),
  listVehicleTypes: () => api.get('/api/v1/fleet/types'),
  getVehicleMaintenanceLogs: (id) => api.get(`/api/v1/fleet/vehicles/${id}/maintenance`),
};

// ── Drivers (HR) ──
export const driversApi = {
  listDrivers: (params?) => api.get('/api/v1/drivers', { params }),
  getDriver: (id) => api.get(`/api/v1/drivers/${id}`),
  createDriver: (data) => api.post('/api/v1/drivers', data),
  updateDriver: (id, data) => api.patch(`/api/v1/drivers/${id}`, data),
  updateDriverStatus: (id, data) => api.patch(`/api/v1/drivers/${id}/status`, data),
  adjustSafetyScore: (id, data) => api.patch(`/api/v1/drivers/${id}/safety-score`, data),
  deleteDriver: (id) => api.delete(`/api/v1/drivers/${id}`),
  getExpiringLicenses: () => api.get('/api/v1/drivers/expiring'),
};

// ── Trips (Dispatch) ──
export const tripsApi = {
  listTrips: (params?) => api.get('/api/v1/trips', { params }),
  getTrip: (id) => api.get(`/api/v1/trips/${id}`),
  createTrip: (data) => api.post('/api/v1/trips', data),
  updateTrip: (id, data) => api.patch(`/api/v1/trips/${id}`, data),
  transitionTrip: (id, data) => api.patch(`/api/v1/trips/${id}/status`, data),
  getTripLedger: (id) => api.get(`/api/v1/trips/${id}/ledger`),
};

// ── Finance ──
export const financeApi = {
  createFuelLog: (data) => api.post('/api/v1/finance/fuel', data),
  listFuelLogs: (params?) => api.get('/api/v1/finance/fuel', { params }),
  createExpense: (data) => api.post('/api/v1/finance/expenses', data),
  listExpenses: (params?) => api.get('/api/v1/finance/expenses', { params }),
  createMaintenanceLog: (data) => api.post('/api/v1/finance/maintenance', data),
};
```

---

### Phase 0 Checklist

- [ ] Delete 6 legacy boilerplate files
- [ ] Remove `itemsApi` from `client.ts`
- [ ] Add `fleetApi`, `driversApi`, `tripsApi`, `financeApi` to `client.ts`
- [ ] Create `ComingSoon.tsx` placeholder page
- [ ] Update router — remove `/items/*`, add 6 new routes
- [ ] Dark mode on 10 UI components (DataTable, StatCard, PageHeader, AlertDialog, DropdownMenu, Breadcrumb, SectionCard, Toast, NotFoundIllustration, LoadingSpinner)
- [ ] Fix "HackStack" → "FleetFlow" in NotFound.tsx
- [ ] Add dark mode to NotFound.tsx
- [ ] `npx tsc --noEmit` passes
- [ ] Toggle dark mode — no white flashes anywhere in the app

---

---

## Phase 1: Vehicle Registry Page

> **Why first real page?** Vehicles are a prerequisite for Trips. Plus it establishes the CRUD page pattern that Drivers, Maintenance, and Expenses will all follow.

### Task 1.1 — Vehicle Registry Page (List View)

**File:** `frontend/src/pages/VehicleRegistry.tsx`

**Layout:** Uses `CrudLayout` wrapper (already exists)

**Page structure:**
```
┌─────────────────────────────────────────────────────────────┐
│ PageHeader: "Vehicle Registry" / "Manage your fleet assets" │
│ Icon: Truck                           [+ New Vehicle] button│
├─────────────────────────────────────────────────────────────┤
│ Status Summary Cards (4):                                   │
│  Available (count)  On Trip (count)  In Shop (count)  Retired│
├─────────────────────────────────────────────────────────────┤
│ Toolbar: [Search] [Status Filter dropdown] [Type Filter]    │
├─────────────────────────────────────────────────────────────┤
│ DataTable:                                                  │
│  # | Plate | Make/Model | Type | Capacity | Odometer | Status│
│  Each row has: StatusPill, Edit button, Retire button       │
├─────────────────────────────────────────────────────────────┤
│ Pagination: Page 1 of N  [Prev] [1] [2] [3] [Next]        │
└─────────────────────────────────────────────────────────────┘
```

**Data flow:**
1. On mount: `fleetApi.listVehicles({ page: 1, limit: 10 })` + `fleetApi.listVehicleTypes()`
2. Status filter → re-fetch with `?status=AVAILABLE`
3. Search → client-side filter on plate/make/model (or server-side if supported)

**Status pills (reusable `StatusPill` component):**
- AVAILABLE → emerald (bg-emerald-100 text-emerald-700 / dark: bg-emerald-900/30 text-emerald-400)
- ON_TRIP → blue
- IN_SHOP → amber
- RETIRED → slate/gray

**Key considerations:**
- BigInt IDs come as strings from API — handle in display and form submissions
- Pagination: backend returns `{ data: [], meta: { page, limit, total } }`
- All must support dark mode via `useTheme()`

---

### Task 1.2 — StatusPill Component (Shared)

**File:** `frontend/src/components/ui/StatusPill.tsx`

**Purpose:** Reusable colored badge used by Vehicle, Driver, and Trip tables. Takes `status` string and `type` prop ('vehicle' | 'driver' | 'trip') to determine color mapping.

**Color maps (from Appendix A of master plan):**
```
Vehicle: AVAILABLE=emerald, ON_TRIP=blue, IN_SHOP=amber, RETIRED=slate
Driver:  ON_DUTY=emerald, ON_TRIP=blue, OFF_DUTY=slate, SUSPENDED=red
Trip:    DRAFT=slate, DISPATCHED=blue, COMPLETED=emerald, CANCELLED=red
```

Must support both light and dark theme variants.

---

### Task 1.3 — Vehicle Form (Create / Edit)

**File:** `frontend/src/components/forms/VehicleForm.tsx`

**Triggered by:** "+ New Vehicle" button (create mode) or row Edit button (edit mode, pre-filled)

**UI:** Slide-over panel or modal

**Fields:**
| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| Registration Plate | text | required, 2-20 chars | Unique (backend enforces) |
| Make | text | required, 1-50 chars | e.g. "Peterbilt" |
| Model | text | required, 1-50 chars | e.g. "579" |
| Year | number | 1900 – current+1 | |
| Color | text | optional | |
| VIN | text | optional, max 17 | |
| Vehicle Type | dropdown | required | Populate from `fleetApi.listVehicleTypes()` |
| Max Capacity (kg) | number | > 0 | |
| Capacity Volume (m³) | number | optional | |
| Initial Odometer | number | ≥ 0 | Only on create |

**Zod schema:** Create frontend validator `frontend/src/validators/vehicle.ts`

**On submit:**
- Create mode: `fleetApi.createVehicle(data)` → toast success → close panel → refetch list
- Edit mode: `fleetApi.updateVehicle(id, data)` → toast success → close panel → refetch list

**Error handling:** Show field-level errors from Zod. Show server error toast (e.g. "Duplicate plate").

---

### Task 1.4 — Vehicle Actions (Retire / Delete)

**Retire action:**
- Row button "Retire" → AlertDialog confirmation ("This is permanent. Vehicle will be decommissioned.")
- Calls `fleetApi.updateVehicleStatus(id, { status: 'RETIRED', reason: '...' })`
- Toast success → refetch list

**Soft delete (SUPER_ADMIN only):**
- Row button "Delete" (only visible for SUPER_ADMIN role)
- AlertDialog → `fleetApi.deleteVehicle(id)` → toast → refetch

---

### Phase 1 Checklist

- [ ] Create `StatusPill.tsx` — reusable, themed, 3 type maps
- [ ] Create `frontend/src/validators/vehicle.ts` — Zod schemas
- [ ] Create `VehicleRegistry.tsx` — full CRUD page
- [ ] Create `VehicleForm.tsx` — slide-over create/edit form
- [ ] Update router: `/fleet` → `VehicleRegistry`
- [ ] Test: Create vehicle → appears in table with correct status pill
- [ ] Test: Edit vehicle → values update
- [ ] Test: Retire vehicle → status changes to RETIRED, grayed out
- [ ] Test: Dark mode — all elements readable
- [ ] Test: Pagination — page through results

---

---

## Phase 2: Driver Management Page

> **Why before Trips?** The trip dispatch form needs a driver dropdown. Drivers must exist and be manageable first.

### Task 2.1 — Driver Management Page (List View)

**File:** `frontend/src/pages/DriverManagement.tsx`

**Layout:** Same pattern as Vehicle Registry (CrudLayout)

**Page structure:**
```
┌─────────────────────────────────────────────────────────────┐
│ PageHeader: "Driver Performance & Safety" / "Monitor..."    │
│ Icon: Users                             [+ Add Driver] btn  │
├─────────────────────────────────────────────────────────────┤
│ Status Summary Cards (4):                                   │
│  On Duty (count)  On Trip (count)  Off Duty (count)  Suspended│
├─────────────────────────────────────────────────────────────┤
│ Toolbar: [Search] [Status Filter] [License Expiry Filter]   │
├─────────────────────────────────────────────────────────────┤
│ DataTable:                                                  │
│  # | Name | License# | Expiry | Safety Score | Status | Act │
│  Expiry column uses LicenseExpiryBadge (green/amber/red)    │
│  Safety score uses progress bar (green > 80, amber 50-80, red < 50)│
├─────────────────────────────────────────────────────────────┤
│ Pagination                                                  │
└─────────────────────────────────────────────────────────────┘
```

**Special components:**

**LicenseExpiryBadge:**
- > 90 days → green text + date
- 30–90 days → amber text + "Expiring in X days"
- < 30 days → red text + "Expires in X days!"
- Expired → red bg + "EXPIRED"

**Safety Score Bar:**
- Visual horizontal bar (0–100)
- Green ≥ 80, amber 50–79, red < 50

---

### Task 2.2 — Driver Form (Create / Edit)

**File:** `frontend/src/components/forms/DriverForm.tsx`

**Fields:**
| Field | Type | Validation |
|-------|------|-----------|
| Full Name | text | required, 2-100 chars |
| License Number | text | required, 3-30 chars |
| License Expiry | date picker | required, must be in the future |
| License Class | text | optional (e.g. "CDL-A") |
| Phone | text | optional |
| Email | email | optional |
| Date of Birth | date picker | optional |

**Zod schema:** `frontend/src/validators/driver.ts`

---

### Task 2.3 — Driver Actions

**Toggle Duty Status:**
- Row buttons: "Clock In" (→ ON_DUTY) / "Clock Out" (→ OFF_DUTY)
- Calls `driversApi.updateDriverStatus(id, { status: 'ON_DUTY' | 'OFF_DUTY' })`
- Blocked if driver is ON_TRIP (button disabled with tooltip)

**Suspend:**
- Only SUPER_ADMIN / SAFETY_OFFICER
- AlertDialog with reason input → `driversApi.updateDriverStatus(id, { status: 'SUSPENDED', reason })`

**Adjust Safety Score:**
- SUPER_ADMIN / SAFETY_OFFICER only
- Small modal: adjustment slider (-20 to +20) + reason (required, min 5 chars)
- `driversApi.adjustSafetyScore(id, { adjustment, reason })`

**Soft Delete:**
- SUPER_ADMIN only, AlertDialog confirmation

---

### Task 2.4 — Expiring Licenses Alert Panel

**Optional sidebar panel or top alert bar on the Driver page:**
- Calls `driversApi.getExpiringLicenses()`
- Shows drivers with licenses expiring within 30 days
- Red badges for < 7 days, amber for 7–30 days
- This same data will also be used on the Dashboard in Phase 5

---

### Phase 2 Checklist

- [ ] Create `frontend/src/validators/driver.ts`
- [ ] Create `LicenseExpiryBadge.tsx` component
- [ ] Create `DriverManagement.tsx` — full CRUD page
- [ ] Create `DriverForm.tsx` — create/edit form
- [ ] Update router: `/drivers` → `DriverManagement`
- [ ] Test: Create driver → appears with OFF_DUTY status
- [ ] Test: Clock In → ON_DUTY, Clock Out → OFF_DUTY
- [ ] Test: License expiry colors correct (> 90d green, 30-90d amber, < 30d red)
- [ ] Test: Safety score visual correct
- [ ] Test: Suspend driver with reason
- [ ] Test: Dark mode — all elements readable

---

---

## Phase 3: Trip Dispatcher Page ⭐ (Star Feature)

> **This is THE feature that impresses judges.** The transactional dispatch with capacity validation, filtered dropdowns, and state machine visualization. Spend the most care here.

### Task 3.1 — Trip Dispatcher Page (List View)

**File:** `frontend/src/pages/TripDispatcher.tsx`

**Page structure:**
```
┌─────────────────────────────────────────────────────────────┐
│ PageHeader: "Trip Dispatcher" / "Plan, dispatch, and track" │
│ Icon: Navigation                        [+ New Trip] button │
├─────────────────────────────────────────────────────────────┤
│ Status Summary Cards (4):                                   │
│  📝 Drafts (count)  🚀 Active (count)  ✅ Done (count)  ❌ Cancelled│
├─────────────────────────────────────────────────────────────┤
│ Toolbar: [Search] [Status Filter tabs/dropdown]             │
├─────────────────────────────────────────────────────────────┤
│ DataTable:                                                  │
│  # | Vehicle | Driver | Origin → Dest | Cargo | Status | Actions│
│  Actions vary by status:                                    │
│    DRAFT     → [Dispatch ▶] [Cancel ✕]                      │
│    DISPATCHED → [Complete ✅] [Cancel ✕]                     │
│    COMPLETED  → [View Ledger 📊] (no mutations)             │
│    CANCELLED  → (no actions, show reason on hover)          │
├─────────────────────────────────────────────────────────────┤
│ Pagination                                                  │
└─────────────────────────────────────────────────────────────┘
```

---

### Task 3.2 — Trip Form (Create) ⭐⭐ Key Demo Moment

**File:** `frontend/src/components/forms/TripForm.tsx`

**This form must showcase:**
1. Vehicle dropdown → **only AVAILABLE vehicles** (fetched with `?status=AVAILABLE`)
2. Driver dropdown → **only ON_DUTY drivers** with valid licenses
3. Capacity validation → real-time visual feedback
4. These restrictions ARE the business logic that impresses judges

**Fields:**
| Field | Type | Validation | Special Behavior |
|-------|------|-----------|-----------------|
| Vehicle | dropdown | required | Fetch `fleetApi.listVehicles({ status: 'AVAILABLE' })`. Show plate + model + capacity in each option |
| Driver | dropdown | required | Fetch `driversApi.listDrivers({ status: 'ON_DUTY' })`. Filter out expired licenses client-side. Show name + license in each option |
| Origin | text | required, 2-200 | |
| Destination | text | required, 2-200 | |
| Cargo Weight (kg) | number | ≥ 0 | **Capacity check: compare to selected vehicle's capacityWeight** |
| Est. Distance (km) | number | > 0 | |
| Cargo Description | text | optional | |
| Client Name | text | optional | |
| Revenue (₹) | number | optional, ≥ 0 | |

**Capacity validation visual (CapacityBar component):**
```
When vehicle is selected and cargo weight is entered:

  Cargo: 450 kg  │████████████████████░░░│ 500 kg capacity
                  └── 90% utilized ──────────┘     ✅ OK

  Cargo: 600 kg  │████████████████████████│███ OVER
                  └── 120% — EXCEEDS CAPACITY ✕ ──┘
```

- Green bar + ✅ when cargo ≤ capacity
- Red bar + ❌ + error message when cargo > capacity
- Submit button disabled when over capacity

**On submit:** `tripsApi.createTrip(data)` → creates as DRAFT → toast → close → refetch

---

### Task 3.3 — Trip Actions

**Dispatch (DRAFT → DISPATCHED):**
- Click "Dispatch ▶" → AlertDialog: "This will lock the vehicle and driver. Proceed?"
- Calls `tripsApi.transitionTrip(id, { status: 'DISPATCHED' })`
- Backend runs full validation (vehicle available, driver on duty, license valid, capacity)
- On success → toast "Trip dispatched! Vehicle & Driver assigned." → refetch
- On failure → toast with specific error (VEHICLE_NOT_AVAILABLE, LICENSE_EXPIRED, etc.)

**Complete (DISPATCHED → COMPLETED):**
- Click "Complete ✅" → Modal with `distanceActual` input (required, > 0)
- Optional `odometerEnd` input
- Calls `tripsApi.transitionTrip(id, { status: 'COMPLETED', distanceActual, odometerEnd })`
- Toast: "Trip completed! Vehicle & Driver released."

**Cancel (DRAFT | DISPATCHED → CANCELLED):**
- Click "Cancel ✕" → AlertDialog with reason textarea (required, min 5 chars)
- Calls `tripsApi.transitionTrip(id, { status: 'CANCELLED', cancelledReason })`
- If was DISPATCHED → vehicle + driver auto-released
- Toast: "Trip cancelled."

**View Ledger (COMPLETED trips):**
- Click "Ledger 📊" → Modal/drawer showing:
  - Fuel costs (sum of fuel logs)
  - Expenses (itemized)
  - Revenue
  - Profit = Revenue - (Fuel + Expenses)
  - ROI = Profit / Costs × 100
- Fetched via `tripsApi.getTripLedger(id)`

---

### Task 3.4 — Zod Validators for Trips

**File:** `frontend/src/validators/trip.ts`

```
createTripSchema: vehicleId, driverId, origin, destination, cargoWeight, distanceEstimated, cargoDescription?, clientName?, revenue?
completeTripSchema: distanceActual (> 0), odometerEnd?
cancelTripSchema: cancelledReason (min 5 chars)
```

---

### Phase 3 Checklist

- [ ] Create `frontend/src/validators/trip.ts`
- [ ] Create `CapacityBar.tsx` component (cargo vs capacity visual)
- [ ] Create `TripDispatcher.tsx` — full page with status cards + table
- [ ] Create `TripForm.tsx` — filtered dropdowns + capacity check
- [ ] Create `TripCompleteModal.tsx` — distanceActual input
- [ ] Create `TripCancelDialog.tsx` — reason textarea
- [ ] Create `TripLedgerDrawer.tsx` — financial summary view
- [ ] Update router: `/trips` → `TripDispatcher`
- [ ] Test: Only AVAILABLE vehicles in dropdown
- [ ] Test: Only ON_DUTY drivers with valid licenses in dropdown
- [ ] Test: Cargo 450 ≤ 500 → green bar + submit enabled
- [ ] Test: Cargo 600 > 500 → red bar + submit disabled
- [ ] Test: Dispatch → vehicle disappears from dropdown on new trip
- [ ] Test: Complete → vehicle reappears, driver reappears
- [ ] Test: Cancel dispatched trip → vehicle + driver released
- [ ] Test: Dark mode throughout

---

---

## Phase 4: Maintenance & Finance Pages

> **Two pages, one phase** — they're simpler than Vehicles/Trips and follow the same CRUD pattern.

### Task 4.1 — Backend: Maintenance Close Endpoint

**Problem:** The backend has `POST /finance/maintenance` to CREATE a maintenance log, but there's no endpoint to CLOSE one (which should auto-set vehicle → AVAILABLE). The plan requires `PATCH /service-logs/:id/close`.

**Changes needed in backend:**
1. `finance.service.ts` — Add `closeMaintenanceLog(id)` method:
   - Find maintenance log by ID
   - Check it's not already closed (prevent double-close)
   - Within a Prisma transaction:
     - Update maintenance log status/closedAt (add a `closedAt DateTime?` field or use a status approach)
     - Update vehicle status → AVAILABLE
   - Write audit log
2. `finance.controller.ts` — Add `closeMaintenanceLog` handler
3. `finance.routes.ts` — Add `PATCH /maintenance/:id/close`
4. `finance.validator.ts` — Add close validation schema if needed
5. Consider: The schema doesn't have a `status` field on `MaintenanceLog`. Add `status String @default("OPEN")` or use `closedAt DateTime?` to track open/closed.

**Alternative approach (simpler):** Since the maintenance log doesn't have a status field, we can use the presence of a `closedAt` timestamp. If `closedAt IS NULL` → OPEN. If `closedAt IS NOT NULL` → CLOSED. This avoids a schema migration.

Actually, looking at the schema more carefully — the MaintenanceLog model doesn't have status or closedAt. We need to add one. **Let's add `closedAt DateTime?`** to the schema and run `prisma db push`.

Also add `financeApi.closeMaintenanceLog: (id) => api.patch('/api/v1/finance/maintenance/${id}/close')` to `client.ts`.

---

### Task 4.2 — Maintenance Page

**File:** `frontend/src/pages/Maintenance.tsx`

**Page structure:**
```
┌─────────────────────────────────────────────────────────────┐
│ PageHeader: "Maintenance & Service Logs" / "Track vehicle health"│
│ Icon: Wrench                        [+ Create New Service]  │
├─────────────────────────────────────────────────────────────┤
│ Toolbar: [Search] [Status: Open/Closed/All] [Vehicle filter]│
├─────────────────────────────────────────────────────────────┤
│ DataTable:                                                  │
│  # | Vehicle | Service Type | Description | Date | Cost | Status | Act│
│  Open  → 🟠 with [Close Service] button                    │
│  Closed → ✅ no actions                                     │
├─────────────────────────────────────────────────────────────┤
│ Pagination                                                  │
└─────────────────────────────────────────────────────────────┘
```

**⚠️ Warning banner in create form:**
> "Creating this log will set the vehicle to IN_SHOP and remove it from the dispatcher's available pool."

**Create form fields:**
| Field | Type | Validation |
|-------|------|-----------|
| Vehicle | dropdown | required, non-retired vehicles |
| Service Type | dropdown | OIL_CHANGE, BRAKE_INSPECTION, TIRE_ROTATION, ENGINE_REPAIR, OTHER |
| Description | textarea | optional |
| Cost (₹) | number | ≥ 0 |
| Odometer at Service | number | ≥ 0 |
| Technician Name | text | optional |
| Shop Name | text | optional |
| Service Date | date | required |
| Next Service Due | date | optional |

**Close action:** AlertDialog → "This will set the vehicle back to AVAILABLE." → `financeApi.closeMaintenanceLog(id)` → toast

---

### Task 4.3 — Expenses & Fuel Page

**File:** `frontend/src/pages/Expenses.tsx`

**Page structure:**
```
┌─────────────────────────────────────────────────────────────┐
│ PageHeader: "Trip Expenses & Fuel Logs" / "Track costs per trip"│
│ Icon: Receipt                            [+ Add Expense]    │
├─────────────────────────────────────────────────────────────┤
│ Tabs: [🛢️ Fuel Logs]  [💳 Expenses]                         │
├─────────────────────────────────────────────────────────────┤
│ (Tab 1 — Fuel Logs table)                                   │
│  # | Vehicle | Trip | Liters | ₹/L | Total | Odometer | Date│
│                                                             │
│ (Tab 2 — Expenses table)                                    │
│  # | Vehicle | Trip | Category | Amount | Description | Date │
├─────────────────────────────────────────────────────────────┤
│ Pagination                                                  │
└─────────────────────────────────────────────────────────────┘
```

**Add Expense form — tabbed:**

**Fuel Log tab:**
| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| Vehicle | dropdown | required | |
| Trip | dropdown | optional | Only DISPATCHED/COMPLETED trips |
| Liters | number | > 0 | |
| Cost per Liter (₹) | number | > 0 | |
| Total Cost | computed | read-only | = liters × costPerLiter (auto-calc, shown live) |
| Odometer at Fill | number | ≥ 0 | Must be ≥ vehicle's current odometer |
| Fuel Station | text | optional | |

**Misc Expense tab:**
| Field | Type | Validation |
|-------|------|-----------|
| Vehicle | dropdown | required |
| Trip | dropdown | optional |
| Category | dropdown | TOLL / LODGING / MAINTENANCE_EN_ROUTE / MISC |
| Amount (₹) | number | ≥ 0 |
| Description | text | optional |

---

### Phase 4 Checklist

- [ ] Backend: Add `closedAt DateTime?` to MaintenanceLog schema + `prisma db push`
- [ ] Backend: Add `closeMaintenanceLog` service method + controller + route
- [ ] Frontend: Add `financeApi.closeMaintenanceLog` to client.ts
- [ ] Create `frontend/src/validators/finance.ts` — fuel log + expense + maintenance schemas
- [ ] Create `Maintenance.tsx` — CRUD page with close action
- [ ] Create `MaintenanceForm.tsx` — with warning banner
- [ ] Create `Expenses.tsx` — tabbed page (fuel logs / expenses)
- [ ] Create `ExpenseForm.tsx` — tabbed form (fuel / misc)
- [ ] Update router: `/maintenance` → `Maintenance`, `/expenses` → `Expenses`
- [ ] Test: Create maintenance → vehicle goes IN_SHOP
- [ ] Test: Close maintenance → vehicle goes AVAILABLE
- [ ] Test: Vehicle in shop → NOT in trip dispatcher dropdown
- [ ] Test: Fuel log auto-calculates total
- [ ] Test: Dark mode throughout

---

---

## Phase 5: Dashboard & Analytics

> **Now that all domain data exists**, the dashboard and analytics can show real numbers.

### Task 5.1 — Backend: Analytics Endpoints

**File:** `backend/src/modules/analytics/` — new module

**Create 4 new files:**
- `analytics.service.ts`
- `analytics.controller.ts`
- `analytics.routes.ts`
- `analytics.validator.ts` (minimal — mostly query params)

**Endpoints:**

**GET `/api/v1/analytics/dashboard`** (all roles):
```json
{
  "activeFleet": 3,        // COUNT(vehicles WHERE status = ON_TRIP)
  "inShop": 1,             // COUNT(vehicles WHERE status = IN_SHOP)
  "utilizationRate": 75.0, // (ON_TRIP / (total - RETIRED)) × 100
  "pendingCargo": 2,       // COUNT(trips WHERE status = DRAFT)
  "totalVehicles": 5,
  "totalDrivers": 4,
  "completedTrips": 12,
  "recentTrips": [...],    // Last 5 trips with vehicle + driver info
  "expiringLicenses": [...] // Drivers with license expiring in < 30 days
}
```

**GET `/api/v1/analytics/fleet-summary`** (ADMIN, FINANCE):
```json
{
  "totalFuelCost": 43160,
  "totalExpenses": 2500,
  "totalRevenue": 125000,
  "roi": 12.5,
  "avgFuelEfficiency": 8.7  // total distance / total liters
}
```

**GET `/api/v1/analytics/monthly-financial`** (ADMIN, FINANCE):
```json
{
  "months": [
    { "month": "2026-01", "revenue": 50000, "fuelCost": 15000, "maintenance": 5000, "expenses": 2000, "netProfit": 28000 },
    { "month": "2026-02", "revenue": 45000, "fuelCost": 12000, "maintenance": 3000, "expenses": 1500, "netProfit": 28500 }
  ]
}
```

**Register in `app.ts`:**
```typescript
import { analyticsRouter } from './modules/analytics/analytics.routes';
app.use(`${v1}/analytics`, analyticsRouter);
```

---

### Task 5.2 — Dashboard Page (Replace Mock Data)

**File:** `frontend/src/pages/Dashboard.tsx` — rewrite

**Replace ALL hardcoded data with real API calls.**

**New Dashboard structure:**
```
┌─────────────────────────────────────────────────────────────┐
│ "Command Center" / "Real-time fleet operations overview"    │
│                              [+ New Trip] [+ Vehicle] btns  │
├─────────────────────────────────────────────────────────────┤
│ KPI StatCards (4):                                          │
│  🟢 Active Fleet (ON_TRIP count)                            │
│  🟠 Maintenance Alerts (IN_SHOP count)                      │
│  📊 Utilization Rate (%)                                    │
│  📦 Pending Cargo (DRAFT trips count)                       │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────┐ ┌─────────────────────────────┐ │
│ │ Recent Trips (5)        │ │ Quick Actions               │ │
│ │ DataTable: # Vehicle    │ │ 🚛 Register Vehicle → /fleet│ │
│ │ Driver Status           │ │ 👤 Add Driver → /drivers    │ │
│ │                         │ │ 📋 Create Trip → /trips     │ │
│ │ [View All Trips →]      │ │ 🔧 Log Service → /maint    │ │
│ ├─────────────────────────┤ ├─────────────────────────────┤ │
│ │ ⚠️ Expiring Licenses    │ │                             │ │
│ │ Alex - 15 days (red)    │ │                             │ │
│ │ Jane - 30 days (amber)  │ │                             │ │
│ └─────────────────────────┘ └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**API call on mount:** `GET /api/v1/analytics/dashboard`

**Quick Action buttons:** `useNavigate()` to the respective page

---

### Task 5.3 — Analytics Page

**File:** `frontend/src/pages/Analytics.tsx`

**Page structure:**
```
┌─────────────────────────────────────────────────────────────┐
│ PageHeader: "Operational Analytics" / "Data-driven fleet..."│
│ Icon: BarChart3                          [Export CSV] button │
├─────────────────────────────────────────────────────────────┤
│ KPI StatCards (3):                                          │
│  💰 Total Fuel Cost    📈 Fleet ROI    📊 Utilization Rate  │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────┐ ┌──────────────────────────┐  │
│ │ Fuel Efficiency Trend    │ │ Monthly Financial Table   │  │
│ │ (simple bar chart)       │ │ Month | Rev | Fuel | Net  │  │
│ │                          │ │ Jan   | 50K | 15K  | 28K  │  │
│ │                          │ │ Feb   | 45K | 12K  | 28K  │  │
│ └──────────────────────────┘ └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Charts:** Use simple CSS/SVG bar charts (no external chart library needed). Same pattern as the current Dashboard's fulfillment chart — just with real data.

**API calls on mount:**
- `GET /api/v1/analytics/fleet-summary`
- `GET /api/v1/analytics/monthly-financial`

---

### Phase 5 Checklist

- [ ] Backend: Create `analytics` module (service, controller, routes)
- [ ] Backend: Implement `/dashboard`, `/fleet-summary`, `/monthly-financial` endpoints
- [ ] Backend: Register analytics router in `app.ts`
- [ ] Frontend: Add `analyticsApi` to `client.ts`
- [ ] Rewrite `Dashboard.tsx` with real API data + Quick Actions + Expiring Licenses
- [ ] Create `Analytics.tsx` with KPIs + financial table + simple chart
- [ ] Update router: `/analytics` → `Analytics`
- [ ] Test: Dashboard KPIs match database state
- [ ] Test: Create trip → Dashboard pending count increases
- [ ] Test: Complete trip → utilization rate changes
- [ ] Test: Analytics monthly table shows correct aggregations
- [ ] Test: Dark mode on both pages

---

---

## Phase 6: Polish & Demo Prep

> **Everything functional is done. Now make it presentable.**

### Task 6.1 — Profile Page (Connect to Auth)

**Problem:** Profile page shows hardcoded "Urva Gandhi" and "HackStack" everywhere. Needs to pull real user data from `useAuth()`.

**Changes:**
- Replace hardcoded name/email with `user.fullName` / `user.email` from auth context
- Replace "HackStack" with "FleetFlow"
- Show actual role with nice formatting: SUPER_ADMIN → "Super Administrator", DISPATCHER → "Dispatcher", etc.
- Remove fake stats (Projects/Contributions/Hackathons) or replace with relevant fleet stats
- Remove mock activity timeline or populate with real audit log data (stretch goal)
- Add dark mode support

---

### Task 6.2 — Settings Page (Make Functional)

**Changes:**
- **Account tab:** Pre-fill from `useAuth()` user data. Wire Save button to a `PUT /api/v1/auth/profile` endpoint (or skip if not in backend). At minimum, display correct data.
- **Security tab:** Wire Change Password form to `authApi.changePassword()`. This endpoint already exists!
- **Appearance tab:** Connect theme picker to `useTheme().setTheme()` instead of local state. The ThemeContext already supports this.
- **Notifications tab:** Can remain decorative (no backend support) but should look correct in dark mode
- Add dark mode support throughout

---

### Task 6.3 — Enrich Seed Data

**Problem:** Current seed has only 4 vehicles and 2 drivers. The plan calls for richer demo data to make the app feel alive.

**Update `backend/prisma/seed.ts` to add:**
- 5 vehicles (1 already IN_SHOP for demo)
- 4 drivers (1 SUSPENDED with expired license for demo)
- 6 trips (mix of DRAFT, DISPATCHED, COMPLETED, CANCELLED)
- 2 service logs (1 OPEN → shows vehicle IN_SHOP, 1 CLOSED)
- 4 fuel logs (linked to completed trips)
- 3 expenses (TOLL, LODGING linked to trips)

This makes the dashboard show real numbers on first load, tables have data to browse, and analytics has something to aggregate.

---

### Task 6.4 — Integration Test (Manual Demo Run)

**The full demo flow (must work end-to-end):**

```
1. Login as superadmin@fleetflow.io / FleetFlow@2025
   ✓ Lands on Dashboard with real KPIs

2. Dashboard → Quick Action "Register Vehicle"
   ✓ Navigate to /fleet
   ✓ Click "+ New Vehicle"
   ✓ Fill: Plate "MH-99-ZZ", Make "Tata", Model "Ace", Type Truck, Capacity 500
   ✓ Save → appears in table as 🟢 Available

3. Navigate to /drivers → "+ Add Driver"
   ✓ Fill: "Alex Test", License "DL-9999", Expiry 2027
   ✓ Save → appears as ⚫ Off Duty
   ✓ Click "Clock In" → 🟢 On Duty

4. Navigate to /trips → "+ New Trip"
   ✓ Vehicle dropdown → MH-99-ZZ shows (it's AVAILABLE)
   ✓ Driver dropdown → Alex Test shows (ON_DUTY, license valid)
   ✓ Cargo: 450 → green bar "90% utilized ✅"
   ✓ ❌ DEMO: Change to 600 → red bar "Exceeds 500kg ✕"
   ✓ Fix to 450, Origin "Mumbai", Dest "Pune", Est 150km
   ✓ Save as Draft

5. Click "Dispatch ▶" on the draft trip
   ✓ Vehicle → 🔵 On Trip
   ✓ Driver → 🔵 On Trip
   ✓ Go to /fleet → MH-99-ZZ now shows 🔵 On Trip
   ✓ Create another trip → MH-99-ZZ NOT in dropdown (assigned)

6. Navigate to /maintenance → "+ Create Service" on another vehicle
   ✓ Vehicle → 🟠 In Shop
   ✓ Go to /trips → that vehicle NOT in dropdown
   ✓ Close service → vehicle back to 🟢 Available

7. Back to /trips → "Complete ✅" the dispatched trip
   ✓ Enter distance: 285 km
   ✓ Vehicle → 🟢 Available, Driver → 🟢 On Duty

8. Navigate to /expenses → "+ Add Expense"
   ✓ Fuel Log: Trip, 50L @ ₹96/L = ₹4,800 (auto-calc)
   ✓ Expense: TOLL, ₹500

9. Navigate to /analytics
   ✓ KPIs updated with real numbers
   ✓ Monthly financial table shows aggregated data

10. Toggle dark mode → everything looks good 🌙
    Toggle back to light → clean ☀️
```

---

### Task 6.5 — Final Branding Pass

- Verify all pages say "FleetFlow" not "HackStack"
- Verify all pages support dark/light theme
- Remove `/demo` route from router (UIDemo is dev-only)
- Ensure no `console.log` statements left in production code
- Run `npx tsc --noEmit` on both frontend and backend — 0 errors

---

### Phase 6 Checklist

- [ ] Profile page → real user data from auth context + dark mode
- [ ] Settings → wire Change Password, connect theme picker, dark mode
- [ ] Seed data enriched (5 vehicles, 4 drivers, 6 trips, etc.)
- [ ] Full integration test passes (10-step demo flow above)
- [ ] All "HackStack" → "FleetFlow"
- [ ] Dark mode consistent across every page
- [ ] TypeScript clean (0 errors)
- [ ] No stray console.logs

---

---

## Appendix: File Creation Summary

### New files to create (by phase)

| Phase | File | Type |
|-------|------|------|
| 0 | `frontend/src/pages/ComingSoon.tsx` | Page |
| 1 | `frontend/src/components/ui/StatusPill.tsx` | Component |
| 1 | `frontend/src/validators/vehicle.ts` | Validator |
| 1 | `frontend/src/pages/VehicleRegistry.tsx` | Page |
| 1 | `frontend/src/components/forms/VehicleForm.tsx` | Form |
| 2 | `frontend/src/components/ui/LicenseExpiryBadge.tsx` | Component |
| 2 | `frontend/src/validators/driver.ts` | Validator |
| 2 | `frontend/src/pages/DriverManagement.tsx` | Page |
| 2 | `frontend/src/components/forms/DriverForm.tsx` | Form |
| 3 | `frontend/src/validators/trip.ts` | Validator |
| 3 | `frontend/src/components/ui/CapacityBar.tsx` | Component |
| 3 | `frontend/src/pages/TripDispatcher.tsx` | Page |
| 3 | `frontend/src/components/forms/TripForm.tsx` | Form |
| 3 | `frontend/src/components/forms/TripCompleteModal.tsx` | Modal |
| 3 | `frontend/src/components/forms/TripCancelDialog.tsx` | Dialog |
| 3 | `frontend/src/components/forms/TripLedgerDrawer.tsx` | Drawer |
| 4 | `frontend/src/validators/finance.ts` | Validator |
| 4 | `frontend/src/pages/Maintenance.tsx` | Page |
| 4 | `frontend/src/components/forms/MaintenanceForm.tsx` | Form |
| 4 | `frontend/src/pages/Expenses.tsx` | Page |
| 4 | `frontend/src/components/forms/ExpenseForm.tsx` | Form |
| 5 | `backend/src/modules/analytics/analytics.service.ts` | Service |
| 5 | `backend/src/modules/analytics/analytics.controller.ts` | Controller |
| 5 | `backend/src/modules/analytics/analytics.routes.ts` | Routes |
| 5 | `backend/src/modules/analytics/analytics.validator.ts` | Validator |
| 5 | `frontend/src/pages/Analytics.tsx` | Page |

### Files to modify

| Phase | File | Changes |
|-------|------|---------|
| 0 | `frontend/src/api/client.ts` | Remove itemsApi, add fleet/drivers/trips/finance APIs |
| 0 | `frontend/src/routes/router.tsx` | Remove /items, add 6 domain routes |
| 0 | 10 UI components | Add dark mode support |
| 0 | `frontend/src/pages/NotFound.tsx` | HackStack → FleetFlow + dark mode |
| 4 | `backend/prisma/schema.prisma` | Add closedAt to MaintenanceLog |
| 4 | `backend/src/modules/finance/*` | Add closeMaintenanceLog endpoint |
| 5 | `backend/src/app.ts` | Register analytics router |
| 5 | `frontend/src/pages/Dashboard.tsx` | Replace mock → real API |
| 6 | `frontend/src/pages/Profile.tsx` | Connect to auth + dark mode |
| 6 | `frontend/src/pages/Settings.tsx` | Wire change-password + theme + dark mode |
| 6 | `backend/prisma/seed.ts` | Enrich with full demo dataset |

### Files to delete

| Phase | File |
|-------|------|
| 0 | `frontend/src/pages/ItemsList.tsx` |
| 0 | `frontend/src/pages/CreateItem.tsx` |
| 0 | `frontend/src/components/ItemCard.tsx` |
| 0 | `frontend/src/components/ItemForm.tsx` |
| 0 | `frontend/src/validators/item.ts` |
| 0 | `frontend/src/hooks/useItems.ts` |

---

## Execution Order Rule

> **Never skip a phase.** Each phase depends on the previous:
> - Phase 1 (Vehicles) creates assets for Phase 3 (Trips)
> - Phase 2 (Drivers) creates operators for Phase 3 (Trips)
> - Phase 3 (Trips) creates the data that Phase 4 (Finance) logs against
> - Phase 4 (Finance) creates the data that Phase 5 (Analytics) aggregates
> - Phase 6 (Polish) cleans up everything built in 0–5

**Say "start phase 0" when you're ready to begin.**
