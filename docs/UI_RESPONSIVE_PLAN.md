# 🎨 FleetFlow UI/UX Responsive Overhaul — Master Plan

> **Branch:** `ui/responsive`  
> **Owner:** UI/UX Team  
> **Created:** February 28, 2026  
> **Scope:** Frontend-only — NO backend, database, API, or map changes  

---

## 📋 Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [Design Principles](#2-design-principles)
3. [Phase 1 — Foundation & Mobile Shell](#phase-1--foundation--mobile-shell)
4. [Phase 2 — Dashboard Responsiveness](#phase-2--dashboard-responsiveness)
5. [Phase 3 — CRUD Pages & Tables](#phase-3--crud-pages--tables)
6. [Phase 4 — Forms & Slide-Overs](#phase-4--forms--slide-overs)
7. [Phase 5 — Vehicle Photo Feature](#phase-5--vehicle-photo-feature)
8. [Phase 6 — Dark Mode Consistency & Polish](#phase-6--dark-mode-consistency--polish)
9. [Phase 7 — Micro-Interactions & Final QA](#phase-7--micro-interactions--final-qa)
10. [File Change Matrix](#file-change-matrix)
11. [Git Workflow](#git-workflow)
12. [Testing Checklist](#testing-checklist)

---

## 1. Current State Assessment

### Audit Summary (65+ files reviewed)

| Severity | Count | Description |
|----------|-------|-------------|
| 🔴 Critical | **7** | App-breaking on mobile — unusable below 768px |
| 🟠 Major | **10** | Degraded experience — overflow, clipping, crushed grids |
| 🟡 Minor | **11** | Polish — hardcoded widths, inconsistent dark mode, spacing |

### Top-Level Problems

| # | Problem | Impact | Root Cause |
|---|---------|--------|------------|
| 1 | **No mobile sidebar** | ALL protected pages unusable on mobile | `DashboardShell.tsx` + `Layout.tsx` use fixed `w-[230px]` sidebar with no collapse/hamburger |
| 2 | **Hardcoded grid columns** | Dashboard cards crush/overlap on small screens | `grid-cols-3`, `grid-cols-4` without `sm:`/`md:` breakpoints |
| 3 | **Map + panel layouts** | Side panels push content off-screen on tablets | `Dispatch.tsx`, `Drivers.tsx` use fixed-width sidepanels (`w-[340px]`, `w-[380px]`) |
| 4 | **Tables without horizontal scroll** | Data tables clip on mobile | Missing `overflow-x-auto` wrapper on 4+ pages |
| 5 | **Form grids non-responsive** | Modal/slide-over forms crush fields on mobile | `grid-cols-2` and `grid-cols-3` without `grid-cols-1` mobile fallback |
| 6 | **Two dark mode patterns** | Inconsistent theming, maintenance burden | ~70% use `isDark` ternary, ~30% use Tailwind `dark:` prefix |
| 7 | **No vehicle type imagery** | Vehicle registration feels bland, no visual identity per type | Only text labels for TRUCK/VAN/BIKE/PLANE — no photos or icons |

### Pages with GOOD Responsiveness (no changes needed)
- ✅ `Login.tsx` — fully responsive with `lg:` split
- ✅ `ForgotPassword.tsx` / `ResetPassword.tsx` — centered card, responsive
- ✅ `NotFound.tsx` — simple centered layout
- ✅ `ComingSoon.tsx` — minimal layout
- ✅ `Analytics.tsx` — proper `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` throughout
- ✅ `VehicleRegistry.tsx` — good breakpoints on stat cards and table
- ✅ `DriverManagement.tsx` — proper responsive grids
- ✅ `DriverPerformance.tsx` — good grid breakpoints
- ✅ `Profile.tsx` — responsive `lg:grid-cols-[1fr_280px]`
- ✅ `SettingsLayout.tsx` — responsive tab navigation

### Pages Needing Work
- 🔴 `DashboardShell.tsx` + `Layout.tsx` + `Sidebar.tsx` (mobile shell)
- 🔴 `CommandCenter.tsx` (AdminDashboard)
- 🔴 `AdminDashboard.tsx` / `DispatcherDashboard.tsx` / `FinanceDashboard.tsx` / `SafetyOfficerDashboard.tsx`
- 🔴 `Dispatch.tsx` / `TripDispatcher.tsx`
- 🔴 `Drivers.tsx` (map side-panel)
- 🟠 `Fleet.tsx` / `FuelExpenses.tsx` / `Maintenance.tsx` / `Expenses.tsx` / `Incidents.tsx`
- 🟠 `FleetDashboard.tsx`
- 🟠 All 5 form slide-overs (`VehicleForm`, `TripForm`, `DriverForm`, `MaintenanceForm`, `FuelLogForm`)

---

## 2. Design Principles

### Breakpoint Strategy (Tailwind CSS v4)
```
Mobile-first approach:
  base (0px+)    → single column, stacked layout, hamburger menu
  sm (640px+)    → 2-column grids, wider cards
  md (768px+)    → sidebar visible (tablet landscape)
  lg (1024px+)   → full sidebar + content, 3-4 column grids
  xl (1280px+)   → spacious layouts, large dashboards
  2xl (1536px+)  → max-width container, centered content
```

### Spacing Scale (8px Grid)
- Tight inline: `gap-1` (4px)
- Compact padding: `p-2` (8px)  
- Standard padding: `p-3` to `p-4` (12–16px)
- Card padding: `p-4` mobile → `p-6` desktop
- Section gaps: `gap-4` mobile → `gap-6` desktop
- Page padding: `p-4` mobile → `p-6 md:p-8` desktop

### Touch Targets
- Minimum 44px height for all interactive elements on mobile
- Buttons: `min-h-[44px]` on mobile, standard on desktop
- Nav items: `py-3` minimum for touch

### Dark Mode Standard
- **Standardize on `isDark` ternary pattern** (since ThemeContext is already used everywhere)
- Gradually migrate the ~30% of files using `dark:` prefix to match majority pattern
- NOT switching to `dark:` because the `isDark` approach allows more granular control

---

## Phase 1 — Foundation & Mobile Shell
> **Priority:** 🔴 CRITICAL — Must be done first  
> **Estimated effort:** 3–4 hours  
> **Files:** 4 core files

### 1.1 Mobile Sidebar (Hamburger + Slide-Over Drawer)

**Current:** `Sidebar.tsx` renders a fixed `w-[230px]` column, always visible. No mobile handling.

**Target:**
- **Mobile (< md):** Sidebar hidden by default. Hamburger button (☰) in top-left of the header bar. Tapping opens a full-height slide-over drawer from the left with backdrop overlay. Swipe-left or tap-backdrop to close.
- **Tablet (md+):** Sidebar always visible as current design.
- Add `aria-label`, focus trap, and Escape-to-close for accessibility.

**Files to modify:**
| File | Changes |
|------|---------|
| `frontend/src/layouts/DashboardShell.tsx` | Add `isSidebarOpen` state, hamburger button (visible `md:hidden`), backdrop overlay, responsive sidebar wrapper |
| `frontend/src/components/Layout.tsx` | Pass `onToggleSidebar` / `isSidebarOpen` props down, update top bar to include hamburger |
| `frontend/src/components/navigation/Sidebar.tsx` | Accept `isOpen` + `onClose` props, add slide-over animation (`translate-x` transition), add close button for mobile, backdrop click handler |
| `frontend/src/index.css` | Add slide-over transition keyframes if needed |

**Behavior:**
```
Mobile:  [Hamburger ☰] [Page Title]  [Notifications] [Avatar]
          ↓ tap
         ┌──────────────┐
         │ Logo          │  ← full-height drawer from left
         │ Navigation    │     with backdrop
         │ ...           │     close on: tap outside, swipe left, Escape, nav item click
         └──────────────┘
         
Desktop: [Sidebar 230px] [Content Area with top bar]
```

### 1.2 Top Bar Header Responsiveness

**Current:** Top bar shows breadcrumb, notification bell, user dropdown. On mobile, elements may overflow.

**Target:**
- Stack or truncate breadcrumbs on mobile
- Compact notification bell + avatar on mobile (icons only, no text labels)
- Page title visible on mobile header (takes space where hamburger is)

### 1.3 Main Content Area Padding

**Target:** Consistent `p-4 md:p-6 lg:p-8` on the main content area across all pages.

---

## Phase 2 — Dashboard Responsiveness
> **Priority:** 🔴 CRITICAL  
> **Estimated effort:** 3–4 hours  
> **Files:** 5 dashboard files

### 2.1 Stat Card Grids

**Problem:** All dashboards use `grid-cols-3` or `grid-cols-4` without mobile breakpoints.

**Fix pattern (apply to ALL dashboards):**
```
Before:  grid grid-cols-4 gap-5
After:   grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5

Before:  grid grid-cols-3 gap-5  
After:   grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5
```

### 2.2 Chart/Table Rows

**Fix pattern:**
```
Before:  grid grid-cols-3 gap-5
After:   grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5

Before:  grid grid-cols-2 gap-5
After:   grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5
```

### 2.3 Tables — Add Horizontal Scroll

**Fix pattern (apply everywhere tables exist):**
```tsx
// Wrap every <table> in:
<div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
  <table className="min-w-[600px] w-full">
    ...
  </table>
</div>
```

### Files & Specific Changes

| File | Issue | Fix |
|------|-------|-----|
| `pages/CommandCenter.tsx` | `grid-cols-4 gap-5` (stat cards), `grid-cols-3 gap-5` (charts) | Add `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` / `lg:grid-cols-3` |
| `pages/dashboards/AdminDashboard.tsx` | `grid-cols-3 gap-5` (3 rows), fleet table `grid-cols-[1fr_2fr_auto]` | Add responsive breakpoints, `overflow-x-auto` on table |
| `pages/dashboards/DispatcherDashboard.tsx` | `grid-cols-3 gap-5` row 3 | Add responsive breakpoints |
| `pages/dashboards/FinanceDashboard.tsx` | `grid-cols-4 gap-5` row 1, `grid-cols-3 gap-5` rows 2+3 | Add responsive breakpoints, `overflow-x-auto` on table |
| `pages/dashboards/SafetyOfficerDashboard.tsx` | `grid-cols-3 gap-5` row 1 | Add responsive breakpoints |

---

## Phase 3 — CRUD Pages & Tables
> **Priority:** 🟠 MAJOR  
> **Estimated effort:** 3–4 hours  
> **Files:** 7+ page files

### 3.1 Map + Side Panel Pages (Dispatch, Drivers)

**Problem:** `Dispatch.tsx` and `TripDispatcher.tsx` use `flex gap-5` with a fixed-width side panel (`w-[340px]`/`w-[380px]`). The map disappears on narrow viewports.

**Solution:**
- **Mobile:** Stack vertically — map on top (fixed height `h-[250px] sm:h-[350px]`), panel below (full width)
- **Tablet+:** Side-by-side layout as current
- Toggle between map/list view on mobile via tab buttons

```
Mobile Layout:
┌────────────────────┐
│   [Map]  [List]    │  ← toggle tabs
├────────────────────┤
│  Map View (250px)  │
├────────────────────┤
│  Trip List / Panel │
│  (scrollable)      │
└────────────────────┘

Desktop Layout (unchanged):
┌───────────────┬──────────┐
│  Map (flex-1) │ Panel    │
│               │ w-[340px]│
└───────────────┴──────────┘
```

**Files:**
| File | Changes |
|------|---------|
| `pages/Dispatch.tsx` | Add mobile tab view (Map/List toggle), responsive flex → stack, map height responsive |
| `pages/TripDispatcher.tsx` | Same pattern as Dispatch.tsx |
| `pages/Drivers.tsx` | Driver map + side panel: stack on mobile, `overflow-x-auto` on table |

### 3.2 Data Table Pages

**Problem:** Several pages have tables without `overflow-x-auto` and filter bars that overflow.

**Fix pattern for all table pages:**
```tsx
{/* Filter bar */}
<div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
  <input className="w-full sm:w-64 ..." />
  <div className="flex items-center gap-2 flex-wrap">
    {/* filter buttons */}
  </div>
</div>

{/* Table */}
<div className="overflow-x-auto rounded-xl border ...">
  <table className="min-w-[700px] w-full">...</table>
</div>
```

**Files:**
| File | Changes |
|------|---------|
| `pages/Fleet.tsx` | `overflow-x-auto` on table, responsive filter bar, fix status dropdown hover → click |
| `pages/FuelExpenses.tsx` | `overflow-x-auto`, responsive filter bar, fix inline `style={{ maxHeight }}` |
| `pages/Maintenance.tsx` | `overflow-x-auto`, responsive filter bar, form grid fix |
| `pages/Expenses.tsx` | Search width `w-64` → `w-full sm:w-64`, `overflow-x-auto` |
| `pages/Incidents.tsx` | Search width fix, `overflow-x-auto` |
| `pages/FleetDashboard.tsx` | Responsive grid, `overflow-x-auto` on fleet detail table, fix inline map height |

### 3.3 Status Dropdown Touch Fix

**Problem:** Vehicle status dropdown in `Fleet.tsx` uses CSS `:hover` which doesn't work on touch devices.

**Fix:** Convert to a click-toggle dropdown with `useState` for open/close, plus click-outside handler.

---

## Phase 4 — Forms & Slide-Overs
> **Priority:** 🟠 MAJOR  
> **Estimated effort:** 2–3 hours  
> **Files:** 5 form components

### Problem
All form slide-overs use `grid-cols-2 gap-3` or `grid-cols-3 gap-3` without mobile fallback. On mobile, form fields are crushed to ~150px width.

### Fix Pattern (apply to ALL forms)
```
Before:  grid grid-cols-2 gap-3
After:   grid grid-cols-1 sm:grid-cols-2 gap-3

Before:  grid grid-cols-3 gap-3
After:   grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3
```

### Slide-Over Panel Width
```
Before:  w-[500px] or w-[480px] (hardcoded)
After:   w-full sm:w-[480px] max-w-full
```
This makes slide-overs full-width on mobile, fixed width on desktop.

### Files

| File | Grid Instances to Fix |
|------|----------------------|
| `components/forms/VehicleForm.tsx` | 3× `grid-cols-2` groups |
| `components/forms/TripForm.tsx` | 2× `grid-cols-2` groups |
| `components/forms/DriverForm.tsx` | 2× `grid-cols-2` groups |
| `components/forms/MaintenanceForm.tsx` | 3× `grid-cols-2` groups |
| `components/forms/FuelLogForm.tsx` | 1× `grid-cols-2` group |

### Additional Form Fixes
- Make select dropdowns full-width on mobile
- Ensure date pickers are usable on mobile (native `<input type="date">`)
- Submit button: `w-full` on mobile, `w-auto` on desktop

---

## Phase 5 — Vehicle Photo Feature
> **Priority:** 🟢 NEW FEATURE  
> **Estimated effort:** 3–4 hours  
> **Files:** New + modified files

### Concept
When a user registers a vehicle and selects the vehicle type (TRUCK, VAN, BIKE, PLANE), a beautiful preview photo of that vehicle type is displayed in the form. The photos come from the `Photos/vehicles/` folder.

### Vehicle Type → Photo Mapping

We have 7 Gemini-generated images in `Photos/vehicles/`. We'll map them to the 4 vehicle types:

| Vehicle Type | Image(s) | Usage |
|-------------|----------|-------|
| 🚛 TRUCK | 2 images (primary + alternate) | Main: registration form, cards, registry |
| 🚐 VAN | 2 images | Same |
| 🏍️ BIKE | 2 images | Same |
| ✈️ PLANE | 1 image | Same |

### Implementation Steps

#### Step 5.1 — Copy & Optimize Images
1. Copy images from `Photos/vehicles/` to `frontend/public/vehicles/`
2. Rename to semantic names: `truck-1.png`, `truck-2.png`, `van-1.png`, `van-2.png`, `bike-1.png`, `bike-2.png`, `plane-1.png`
3. Create optimized WebP versions (compress from ~5-6MB to ~200-400KB each)
4. Keep PNG as fallback

#### Step 5.2 — Vehicle Image Map (New File)
Create `frontend/src/constants/vehicleImages.ts`:
```typescript
export const vehicleImageMap: Record<string, { primary: string; alt: string; label: string; gradient: string }> = {
  TRUCK: {
    primary: "/vehicles/truck-1.webp",
    alt: "/vehicles/truck-2.webp",
    label: "Heavy Truck",
    gradient: "from-amber-500/20 to-orange-500/20",
  },
  VAN: {
    primary: "/vehicles/van-1.webp",
    alt: "/vehicles/van-2.webp",
    label: "Cargo Van",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  BIKE: {
    primary: "/vehicles/bike-1.webp",
    alt: "/vehicles/bike-2.webp",
    label: "Motorcycle",
    gradient: "from-emerald-500/20 to-teal-500/20",
  },
  PLANE: {
    primary: "/vehicles/plane-1.webp",
    alt: "/vehicles/plane-1.webp",
    label: "Aircraft",
    gradient: "from-violet-500/20 to-purple-500/20",
  },
};
```

#### Step 5.3 — VehicleTypePreview Component (New File)
Create `frontend/src/components/ui/VehicleTypePreview.tsx`:

A beautiful card component that:
- Shows the vehicle type photo with a gradient overlay
- Animates in when vehicle type is selected (Framer Motion scale + fade)
- Displays the type label as a badge overlay
- Has a subtle parallax/hover tilt effect on desktop
- Responsive: full-width on mobile, fixed-size in form on desktop
- Supports dark mode

```
┌─────────────────────────────────┐
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │    [Vehicle Photo]        │  │
│  │                           │  │
│  │          ┌──────────┐     │  │
│  │          │ 🚛 TRUCK │     │  │  ← type badge
│  │          └──────────┘     │  │
│  └───────────────────────────┘  │
│  Heavy-duty commercial truck     │  ← description
└─────────────────────────────────┘
```

#### Step 5.4 — Integrate into VehicleForm
Modify `frontend/src/components/forms/VehicleForm.tsx`:
- After the vehicle type `<select>`, render `<VehicleTypePreview type={selectedType} />`
- The preview animates in when type changes
- On mobile: preview appears above the form fields (full width)
- On desktop: preview appears to the right of the form or inline

#### Step 5.5 — Integrate into VehicleRegistry & Fleet Pages
- `VehicleRegistry.tsx`: Show small vehicle type thumbnail in the table/card rows
- `Fleet.tsx`: Show vehicle type thumbnail in the vehicle list/grid view
- `FleetDashboard.tsx`: Vehicle type distribution chart could show vehicle icons

#### Step 5.6 — Image Loading
- Use `loading="lazy"` on all vehicle images
- Show a skeleton placeholder while image loads
- Use `<picture>` element with WebP + PNG fallback:
  ```html
  <picture>
    <source srcSet="/vehicles/truck-1.webp" type="image/webp" />
    <img src="/vehicles/truck-1.png" alt="Truck" loading="lazy" />
  </picture>
  ```

---

## Phase 6 — Dark Mode Consistency & Polish
> **Priority:** 🟡 MINOR  
> **Estimated effort:** 2–3 hours  
> **Files:** 10+ files

### 6.1 Standardize Dark Mode Pattern

**Decision:** Keep `isDark` ternary pattern as the standard (used by 70% of codebase).

**Files to migrate from `dark:` prefix to `isDark` ternary:**
| File | Current Pattern | Action |
|------|----------------|--------|
| `layouts/SettingsLayout.tsx` | `dark:` prefix | Migrate to `isDark` ternary |
| `pages/Profile.tsx` | `dark:` prefix | Migrate to `isDark` ternary |
| `pages/Settings.tsx` | Mixed (both patterns) | Standardize to `isDark` |
| `pages/FleetDashboard.tsx` | Mixed | Standardize to `isDark` |
| `layouts/ServerErrorLayout.tsx` | No dark mode at all | Add `isDark` support |

### 6.2 Consistent Card Styling

Create shared card style constants (some dashboards already have these):
```typescript
// In a shared constants file or per-page:
const cardBase = isDark
  ? "bg-neutral-900 border-neutral-800"
  : "bg-white border-neutral-200";

const cardHover = isDark
  ? "hover:bg-neutral-800/50"
  : "hover:bg-neutral-50";
```

### 6.3 CSS Cleanup
- Remove duplicated `@keyframes shimmer` block in `index.css`
- Verify all `@keyframes` are used
- Ensure no inline styles override Tailwind classes

---

## Phase 7 — Micro-Interactions & Final QA
> **Priority:** 🟡 POLISH  
> **Estimated effort:** 2–3 hours  

### 7.1 Micro-Interactions
- Button press: `active:scale-[0.97]` (150ms)
- Card hover: `hover:-translate-y-0.5 hover:shadow-md` transition
- Sidebar nav item: smooth background transition on hover/active
- Page transitions: Framer Motion fade-up on route change (already partially done)
- Notification badge: subtle pulse animation

### 7.2 Scroll & Viewport
- `scroll-behavior: smooth` on `html` (verify in `index.css`)
- Sticky headers with `backdrop-blur-lg` (verify on all pages with headers)
- No layout shift during scroll
- Test `position: fixed` elements don't overlap mobile bottom nav (if any)

### 7.3 Touch Device Fixes
- Convert all `:hover`-dependent dropdowns to click-toggle
- Ensure all modals/drawers close on backdrop tap
- Test swipe gestures on mobile sidebar

### 7.4 Final QA Checklist
Test on these viewports:
- 📱 iPhone SE (375×667)
- 📱 iPhone 14 Pro (393×852)
- 📱 Samsung Galaxy S21 (360×800)
- 📱 iPad Mini (768×1024)
- 💻 iPad Pro (1024×1366)
- 🖥️ Laptop (1366×768)
- 🖥️ Desktop (1920×1080)
- 🖥️ Ultrawide (2560×1080)

---

## File Change Matrix

### Summary by Phase

| Phase | Files Modified | Files Created | Priority |
|-------|---------------|---------------|----------|
| Phase 1 | 4 | 0 | 🔴 Critical |
| Phase 2 | 5 | 0 | 🔴 Critical |
| Phase 3 | 7 | 0 | 🟠 Major |
| Phase 4 | 5 | 0 | 🟠 Major |
| Phase 5 | 3 modified | 2 new + images | 🟢 Feature |
| Phase 6 | 10+ | 0 | 🟡 Minor |
| Phase 7 | 5+ | 0 | 🟡 Polish |
| **Total** | **~35 files** | **~2 new** | — |

### Complete File List

```
PHASE 1 — Foundation:
  ✏️ frontend/src/layouts/DashboardShell.tsx
  ✏️ frontend/src/components/Layout.tsx
  ✏️ frontend/src/components/navigation/Sidebar.tsx
  ✏️ frontend/src/index.css

PHASE 2 — Dashboards:
  ✏️ frontend/src/pages/CommandCenter.tsx
  ✏️ frontend/src/pages/dashboards/AdminDashboard.tsx
  ✏️ frontend/src/pages/dashboards/DispatcherDashboard.tsx
  ✏️ frontend/src/pages/dashboards/FinanceDashboard.tsx
  ✏️ frontend/src/pages/dashboards/SafetyOfficerDashboard.tsx

PHASE 3 — CRUD Pages:
  ✏️ frontend/src/pages/Dispatch.tsx
  ✏️ frontend/src/pages/TripDispatcher.tsx
  ✏️ frontend/src/pages/Drivers.tsx
  ✏️ frontend/src/pages/Fleet.tsx
  ✏️ frontend/src/pages/FuelExpenses.tsx
  ✏️ frontend/src/pages/Maintenance.tsx
  ✏️ frontend/src/pages/Expenses.tsx
  ✏️ frontend/src/pages/Incidents.tsx
  ✏️ frontend/src/pages/FleetDashboard.tsx

PHASE 4 — Forms:
  ✏️ frontend/src/components/forms/VehicleForm.tsx
  ✏️ frontend/src/components/forms/TripForm.tsx
  ✏️ frontend/src/components/forms/DriverForm.tsx
  ✏️ frontend/src/components/forms/MaintenanceForm.tsx
  ✏️ frontend/src/components/forms/FuelLogForm.tsx

PHASE 5 — Vehicle Photos:
  🆕 frontend/src/constants/vehicleImages.ts
  🆕 frontend/src/components/ui/VehicleTypePreview.tsx
  📁 frontend/public/vehicles/ (optimized images)
  ✏️ frontend/src/components/forms/VehicleForm.tsx (integrate preview)
  ✏️ frontend/src/pages/VehicleRegistry.tsx (thumbnails in table)
  ✏️ frontend/src/pages/Fleet.tsx (thumbnails in list)

PHASE 6 — Dark Mode:
  ✏️ frontend/src/layouts/SettingsLayout.tsx
  ✏️ frontend/src/layouts/ServerErrorLayout.tsx
  ✏️ frontend/src/pages/Profile.tsx
  ✏️ frontend/src/pages/Settings.tsx
  ✏️ frontend/src/pages/FleetDashboard.tsx
  ✏️ frontend/src/index.css (cleanup duplicate keyframes)

PHASE 7 — Polish:
  ✏️ Various files (micro-interactions, scroll, touch fixes)
```

---

## Git Workflow

### Branch Strategy
```
main ← (production, deployed to Vercel/Render)
  └── ui/responsive ← (OUR branch — all UI/UX changes go here)
```

### Commit Convention
```
ui: <description>

Examples:
  ui: add mobile sidebar with hamburger menu and slide-over drawer
  ui: fix dashboard grids for responsive breakpoints
  ui: add overflow-x-auto to all data tables
  ui: make form slide-overs responsive on mobile
  ui: add vehicle type photo preview in registration form
  ui: standardize dark mode pattern across all pages
  ui: add micro-interactions and touch device fixes
```

### Commit per Phase
Each phase should be ONE commit (or 2 if the phase is large). This keeps the PR clean and reviewable.

```
Phase 1 → 1 commit: "ui: add responsive mobile shell with sidebar drawer"
Phase 2 → 1 commit: "ui: fix all dashboard responsive grids and tables"
Phase 3 → 1 commit: "ui: make CRUD pages and tables responsive"
Phase 4 → 1 commit: "ui: make form slide-overs responsive on mobile"
Phase 5 → 1 commit: "ui: add vehicle type photo preview feature"
Phase 6 → 1 commit: "ui: standardize dark mode and cleanup CSS"
Phase 7 → 1 commit: "ui: add micro-interactions and final polish"
```

### Push to Our Branch ONLY
```bash
git push origin ui/responsive
# NEVER push to main or develop directly
```

---

## Testing Checklist

### Per-Phase Testing
After each phase, test on at minimum:
- [ ] Mobile (375px width — Chrome DevTools responsive mode)
- [ ] Tablet (768px width)
- [ ] Desktop (1440px width)
- [ ] Dark mode on all three sizes
- [ ] Touch simulation (Chrome DevTools toggle device)

### Final QA (Phase 7)
- [ ] All 8 viewport sizes from Section 7.4
- [ ] Dark mode on every single page
- [ ] Keyboard navigation through sidebar, forms, modals
- [ ] Screen reader test on sidebar toggle
- [ ] Lighthouse mobile score > 90
- [ ] No horizontal scrolling on any page at any viewport
- [ ] All vehicle type photos load correctly
- [ ] Form slide-overs usable on mobile
- [ ] Tables scrollable horizontally on mobile
- [ ] No Framer Motion layout shifts on page transitions

---

## Timeline Estimate

| Phase | Time | Cumulative |
|-------|------|------------|
| Phase 1 — Mobile Shell | 3–4 hrs | 3–4 hrs |
| Phase 2 — Dashboards | 3–4 hrs | 6–8 hrs |
| Phase 3 — CRUD Pages | 3–4 hrs | 9–12 hrs |
| Phase 4 — Forms | 2–3 hrs | 11–15 hrs |
| Phase 5 — Vehicle Photos | 3–4 hrs | 14–19 hrs |
| Phase 6 — Dark Mode | 2–3 hrs | 16–22 hrs |
| Phase 7 — Polish & QA | 2–3 hrs | 18–25 hrs |
| **Total** | **18–25 hours** | — |

---

> **Remember:** We only modify frontend files. Backend, database, API, maps, and other functionality are handled by other team members on their own branches. All our work stays on `ui/responsive`.
