-- ─────────────────────────────────────────────────────────────────
--  FleetFlow — Initial Database Migration
--  Snake_case columns throughout (Prisma @map decorators align TS
--  camelCase field names to these snake_case PostgreSQL columns).
--  Includes:
--    • CHECK constraints for all business-rule validations
--    • fn_set_updated_at() trigger for automatic updated_at stamping
--    • Partial indexes for soft-delete dispatch pool queries
-- ─────────────────────────────────────────────────────────────────

-- ── Enums ─────────────────────────────────────────────────────────
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCE_ANALYST');
CREATE TYPE "VehicleType" AS ENUM ('TRUCK', 'VAN', 'BIKE', 'PLANE');
CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED');
CREATE TYPE "DriverStatus" AS ENUM ('ON_DUTY', 'OFF_DUTY', 'ON_TRIP', 'SUSPENDED');
CREATE TYPE "TripStatus" AS ENUM ('DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ExpenseCategory" AS ENUM ('TOLL', 'LODGING', 'MAINTENANCE_EN_ROUTE', 'MISC');
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- ── updated_at trigger function ───────────────────────────────────
-- Applied to all mutable tables so the DB itself keeps updated_at
-- current even if Prisma's @updatedAt behaviour is bypassed (e.g.
-- raw SQL migrations or direct DB operations).
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- ── Table: users ──────────────────────────────────────────────────
CREATE TABLE "users" (
    "id"            BIGSERIAL       NOT NULL,
    "email"         TEXT            NOT NULL,
    "password_hash" TEXT            NOT NULL,
    "full_name"     TEXT            NOT NULL,
    "role"          "UserRole"      NOT NULL DEFAULT 'DISPATCHER',
    "is_active"     BOOLEAN         NOT NULL DEFAULT true,
    "created_at"    TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chk_users_email_format"
        CHECK ("email" ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT "chk_users_password_hash_len"
        CHECK (char_length("password_hash") >= 60),
    CONSTRAINT "chk_users_full_name_nonempty"
        CHECK (char_length(trim("full_name")) > 0)
);

CREATE TRIGGER "trg_users_updated_at"
    BEFORE UPDATE ON "users"
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ── Table: vehicle_types ──────────────────────────────────────────
CREATE TABLE "vehicle_types" (
    "id"          BIGSERIAL       NOT NULL,
    "name"        "VehicleType"   NOT NULL,
    "description" TEXT,
    "created_at"  TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_types_pkey" PRIMARY KEY ("id")
);

CREATE TRIGGER "trg_vehicle_types_updated_at"
    BEFORE UPDATE ON "vehicle_types"
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ── Table: vehicles ───────────────────────────────────────────────
CREATE TABLE "vehicles" (
    "id"               BIGSERIAL       NOT NULL,
    "license_plate"    TEXT            NOT NULL,
    "make"             TEXT            NOT NULL,
    "model"            TEXT            NOT NULL,
    "year"             INTEGER         NOT NULL,
    "color"            TEXT,
    "vin"              TEXT,
    "vehicle_type_id"  BIGINT          NOT NULL,
    "status"           "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE',
    "current_odometer" DECIMAL(15,2)   NOT NULL DEFAULT 0,
    "capacity_weight"  DECIMAL(10,2),
    "capacity_volume"  DECIMAL(10,2),
    "is_deleted"       BOOLEAN         NOT NULL DEFAULT false,
    "deleted_at"       TIMESTAMPTZ,
    "created_at"       TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"       TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chk_vehicles_year_range"
        CHECK ("year" BETWEEN 1900 AND 2100),
    CONSTRAINT "chk_vehicles_odometer_non_negative"
        CHECK ("current_odometer" >= 0),
    CONSTRAINT "chk_vehicles_capacity_weight_pos"
        CHECK ("capacity_weight" IS NULL OR "capacity_weight" > 0),
    CONSTRAINT "chk_vehicles_capacity_volume_pos"
        CHECK ("capacity_volume" IS NULL OR "capacity_volume" > 0),
    CONSTRAINT "chk_vehicles_make_nonempty"
        CHECK (char_length(trim("make")) > 0),
    CONSTRAINT "chk_vehicles_model_nonempty"
        CHECK (char_length(trim("model")) > 0)
);

CREATE TRIGGER "trg_vehicles_updated_at"
    BEFORE UPDATE ON "vehicles"
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ── Table: drivers ────────────────────────────────────────────────
CREATE TABLE "drivers" (
    "id"                  BIGSERIAL       NOT NULL,
    "license_number"      TEXT            NOT NULL,
    "full_name"           TEXT            NOT NULL,
    "phone"               TEXT,
    "email"               TEXT,
    "date_of_birth"       DATE,
    "license_expiry_date" DATE            NOT NULL,
    "license_class"       TEXT,
    "status"              "DriverStatus"  NOT NULL DEFAULT 'OFF_DUTY',
    "safety_score"        DECIMAL(5,2)    NOT NULL DEFAULT 100,
    "is_deleted"          BOOLEAN         NOT NULL DEFAULT false,
    "deleted_at"          TIMESTAMPTZ,
    "created_at"          TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"          TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chk_drivers_safety_score_range"
        CHECK ("safety_score" BETWEEN 0 AND 100),
    CONSTRAINT "chk_drivers_full_name_nonempty"
        CHECK (char_length(trim("full_name")) > 0),
    CONSTRAINT "chk_drivers_license_number_nonempty"
        CHECK (char_length(trim("license_number")) > 0)
);

CREATE TRIGGER "trg_drivers_updated_at"
    BEFORE UPDATE ON "drivers"
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ── Table: trips ──────────────────────────────────────────────────
CREATE TABLE "trips" (
    "id"                 BIGSERIAL       NOT NULL,
    "vehicle_id"         BIGINT          NOT NULL,
    "driver_id"          BIGINT          NOT NULL,
    "origin"             TEXT            NOT NULL,
    "destination"        TEXT            NOT NULL,
    "distance_estimated" DECIMAL(10,2)   NOT NULL,
    "distance_actual"    DECIMAL(10,2),
    "cargo_weight"       DECIMAL(10,2),
    "cargo_description"  TEXT,
    "odometer_start"     DECIMAL(15,2),
    "odometer_end"       DECIMAL(15,2),
    "revenue"            DECIMAL(15,2),
    "client_name"        TEXT,
    "invoice_reference"  TEXT,
    "status"             "TripStatus"    NOT NULL DEFAULT 'DRAFT',
    "dispatch_time"      TIMESTAMPTZ,
    "completion_time"    TIMESTAMPTZ,
    "cancelled_reason"   TEXT,
    "created_at"         TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"         TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chk_trips_distance_estimated_pos"
        CHECK ("distance_estimated" > 0),
    CONSTRAINT "chk_trips_distance_actual_pos"
        CHECK ("distance_actual" IS NULL OR "distance_actual" > 0),
    CONSTRAINT "chk_trips_cargo_weight_pos"
        CHECK ("cargo_weight" IS NULL OR "cargo_weight" > 0),
    CONSTRAINT "chk_trips_revenue_non_negative"
        CHECK ("revenue" IS NULL OR "revenue" >= 0),
    CONSTRAINT "chk_trips_odometer_range"
        CHECK ("odometer_end" IS NULL OR "odometer_start" IS NULL OR "odometer_end" >= "odometer_start"),
    CONSTRAINT "chk_trips_origin_nonempty"
        CHECK (char_length(trim("origin")) > 0),
    CONSTRAINT "chk_trips_destination_nonempty"
        CHECK (char_length(trim("destination")) > 0),
    -- Cross-column temporal integrity: completion must be after dispatch
    CONSTRAINT "chk_trips_completion_after_dispatch"
        CHECK ("completion_time" IS NULL OR "dispatch_time" IS NULL OR "completion_time" >= "dispatch_time")
);

CREATE TRIGGER "trg_trips_updated_at"
    BEFORE UPDATE ON "trips"
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ── Table: fuel_logs ──────────────────────────────────────────────
CREATE TABLE "fuel_logs" (
    "id"               BIGSERIAL       NOT NULL,
    "vehicle_id"       BIGINT          NOT NULL,
    "trip_id"          BIGINT,
    "liters"           DECIMAL(10,2)   NOT NULL,
    "cost_per_liter"   DECIMAL(10,4)   NOT NULL,
    "total_cost"       DECIMAL(15,2)   NOT NULL,
    "odometer_at_fill" DECIMAL(15,2)   NOT NULL,
    "fuel_station"     TEXT,
    "logged_at"        TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at"       TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"       TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fuel_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chk_fuel_logs_liters_pos"
        CHECK ("liters" > 0),
    CONSTRAINT "chk_fuel_logs_cost_per_liter_pos"
        CHECK ("cost_per_liter" > 0),
    CONSTRAINT "chk_fuel_logs_total_cost_pos"
        CHECK ("total_cost" > 0),
    CONSTRAINT "chk_fuel_logs_odometer_non_negative"
        CHECK ("odometer_at_fill" >= 0)
);

CREATE TRIGGER "trg_fuel_logs_updated_at"
    BEFORE UPDATE ON "fuel_logs"
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ── Table: maintenance_logs ───────────────────────────────────────
CREATE TABLE "maintenance_logs" (
    "id"                  BIGSERIAL       NOT NULL,
    "vehicle_id"          BIGINT          NOT NULL,
    "service_type"        TEXT            NOT NULL,
    "description"         TEXT,
    "cost"                DECIMAL(15,2)   NOT NULL,
    "odometer_at_service" DECIMAL(15,2)   NOT NULL,
    "technician_name"     TEXT,
    "shop_name"           TEXT,
    "service_date"        TIMESTAMPTZ     NOT NULL,
    "next_service_due"    TIMESTAMPTZ,
    "created_at"          TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"          TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chk_maintenance_cost_non_negative"
        CHECK ("cost" >= 0),
    CONSTRAINT "chk_maintenance_odometer_non_negative"
        CHECK ("odometer_at_service" >= 0),
    CONSTRAINT "chk_maintenance_service_type_nonempty"
        CHECK (char_length(trim("service_type")) > 0),
    -- Cross-column temporal integrity: next service must be after service date
    CONSTRAINT "chk_maintenance_next_due_after_service"
        CHECK ("next_service_due" IS NULL OR "next_service_due" > "service_date")
);

CREATE TRIGGER "trg_maintenance_logs_updated_at"
    BEFORE UPDATE ON "maintenance_logs"
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ── Table: expenses ───────────────────────────────────────────────
CREATE TABLE "expenses" (
    "id"                BIGSERIAL           NOT NULL,
    "vehicle_id"        BIGINT              NOT NULL,
    "trip_id"           BIGINT,
    "amount"            DECIMAL(15,2)       NOT NULL,
    "category"          "ExpenseCategory"   NOT NULL,
    "description"       TEXT,
    "logged_by_user_id" BIGINT,
    "date_logged"       TIMESTAMPTZ         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at"        TIMESTAMPTZ         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"        TIMESTAMPTZ         NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chk_expenses_amount_non_negative"
        CHECK ("amount" >= 0)
);

CREATE TRIGGER "trg_expenses_updated_at"
    BEFORE UPDATE ON "expenses"
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ── Table: vehicle_locations ──────────────────────────────────────
CREATE TABLE "vehicle_locations" (
    "id"          BIGSERIAL       NOT NULL,
    "vehicle_id"  BIGINT          NOT NULL,
    "latitude"    DECIMAL(10,7)   NOT NULL,
    "longitude"   DECIMAL(11,7)   NOT NULL,
    "speed"       DECIMAL(6,2),
    "heading"     DECIMAL(5,2),
    "accuracy"    DECIMAL(6,2),
    "recorded_at" TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_locations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chk_vehicle_locations_latitude_range"
        CHECK ("latitude" BETWEEN -90 AND 90),
    CONSTRAINT "chk_vehicle_locations_longitude_range"
        CHECK ("longitude" BETWEEN -180 AND 180),
    CONSTRAINT "chk_vehicle_locations_speed_non_negative"
        CHECK ("speed" IS NULL OR "speed" >= 0),
    CONSTRAINT "chk_vehicle_locations_heading_range"
        CHECK ("heading" IS NULL OR "heading" BETWEEN 0 AND 360),
    CONSTRAINT "chk_vehicle_locations_accuracy_non_negative"
        CHECK ("accuracy" IS NULL OR "accuracy" >= 0)
);

-- ── Table: audit_logs ─────────────────────────────────────────────
CREATE TABLE "audit_logs" (
    "id"          BIGSERIAL       NOT NULL,
    "user_id"     BIGINT,
    "entity"      TEXT            NOT NULL,
    "entity_id"   BIGINT          NOT NULL,
    "action"      "AuditAction"   NOT NULL,
    "old_values"  JSONB,
    "new_values"  JSONB,
    "reason"      TEXT,
    "ip_address"  TEXT,
    "user_agent"  TEXT,
    "timestamp"   TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chk_audit_logs_entity_nonempty"
        CHECK (char_length(trim("entity")) > 0)
);

-- ─────────────────────────────────────────────────────────────────
--  Unique indexes
-- ─────────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX "users_email_key"              ON "users"("email");
CREATE UNIQUE INDEX "vehicle_types_name_key"       ON "vehicle_types"("name");
CREATE UNIQUE INDEX "vehicles_license_plate_key"   ON "vehicles"("license_plate");
CREATE UNIQUE INDEX "vehicles_vin_key"             ON "vehicles"("vin");
CREATE UNIQUE INDEX "drivers_license_number_key"   ON "drivers"("license_number");
CREATE UNIQUE INDEX "drivers_email_key"            ON "drivers"("email");
CREATE UNIQUE INDEX "trips_invoice_reference_key"  ON "trips"("invoice_reference");

-- ─────────────────────────────────────────────────────────────────
--  Standard indexes (hot query paths)
-- ─────────────────────────────────────────────────────────────────
CREATE INDEX "users_email_idx"       ON "users"("email");
CREATE INDEX "users_role_idx"        ON "users"("role");
CREATE INDEX "users_is_active_idx"   ON "users"("is_active");

CREATE INDEX "vehicles_status_idx"            ON "vehicles"("status");
CREATE INDEX "vehicles_is_deleted_idx"        ON "vehicles"("is_deleted");
CREATE INDEX "vehicles_vehicle_type_id_idx"   ON "vehicles"("vehicle_type_id");
CREATE INDEX "vehicles_status_is_deleted_idx" ON "vehicles"("status", "is_deleted");

CREATE INDEX "drivers_status_idx"              ON "drivers"("status");
CREATE INDEX "drivers_is_deleted_idx"          ON "drivers"("is_deleted");
CREATE INDEX "drivers_license_expiry_date_idx" ON "drivers"("license_expiry_date");
CREATE INDEX "drivers_status_is_deleted_idx"   ON "drivers"("status", "is_deleted");

CREATE INDEX "trips_vehicle_id_status_idx" ON "trips"("vehicle_id", "status");
CREATE INDEX "trips_driver_id_status_idx"  ON "trips"("driver_id", "status");
CREATE INDEX "trips_status_idx"            ON "trips"("status");
CREATE INDEX "trips_created_at_idx"        ON "trips"("created_at");
CREATE INDEX "trips_dispatch_time_idx"     ON "trips"("dispatch_time");

CREATE INDEX "fuel_logs_vehicle_id_idx" ON "fuel_logs"("vehicle_id");
CREATE INDEX "fuel_logs_trip_id_idx"    ON "fuel_logs"("trip_id");
CREATE INDEX "fuel_logs_logged_at_idx"  ON "fuel_logs"("logged_at");

CREATE INDEX "maintenance_logs_vehicle_id_idx"   ON "maintenance_logs"("vehicle_id");
CREATE INDEX "maintenance_logs_service_date_idx" ON "maintenance_logs"("service_date");

CREATE INDEX "expenses_vehicle_id_idx"        ON "expenses"("vehicle_id");
CREATE INDEX "expenses_trip_id_idx"           ON "expenses"("trip_id");
CREATE INDEX "expenses_category_idx"          ON "expenses"("category");
CREATE INDEX "expenses_date_logged_idx"       ON "expenses"("date_logged");
-- logged_by_user_id is a denormalized FK (no join needed for audit speed)
-- but must be indexed per agent rule: "never define FK without @@index on the column"
CREATE INDEX "expenses_logged_by_user_id_idx" ON "expenses"("logged_by_user_id");

-- vehicle_locations: composite B-Tree for primary "latest ping per vehicle" query
CREATE INDEX "vehicle_locations_vehicle_id_recorded_at_idx"
    ON "vehicle_locations"("vehicle_id", "recorded_at" DESC);
-- vehicle_locations: BRIN for time-range scans — append-only, naturally ordered table.
-- BRIN stores min/max per 128-page block range. Orders of magnitude smaller than B-Tree.
-- Ideal for "all pings in the last hour" without caring about vehicle_id.
CREATE INDEX "vehicle_locations_recorded_at_brin_idx"
    ON "vehicle_locations" USING BRIN ("recorded_at");

CREATE INDEX "audit_logs_user_id_idx"          ON "audit_logs"("user_id");
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");
CREATE INDEX "audit_logs_entity_idx"           ON "audit_logs"("entity");
-- audit_logs: BRIN for timestamp-range audit lookups — immutable append-only table,
-- records always inserted in timestamp order. BRIN << B-Tree in size at 10M+ rows.
CREATE INDEX "audit_logs_timestamp_brin_idx"   ON "audit_logs" USING BRIN ("timestamp");

-- ─────────────────────────────────────────────────────────────────
--  Partial indexes — Dispatcher hot paths
--  Filters out soft-deleted rows at the index level so the planner
--  never touches deleted records when building dispatch pools.
-- ─────────────────────────────────────────────────────────────────
CREATE INDEX "vehicles_active_dispatch_pool_idx"
    ON "vehicles"("status")
    WHERE "is_deleted" = false;

CREATE INDEX "vehicles_available_pool_idx"
    ON "vehicles"("id")
    WHERE "is_deleted" = false AND "status" = 'AVAILABLE';

CREATE INDEX "drivers_active_dispatch_pool_idx"
    ON "drivers"("status")
    WHERE "is_deleted" = false;

CREATE INDEX "drivers_on_duty_pool_idx"
    ON "drivers"("id")
    WHERE "is_deleted" = false AND "status" = 'ON_DUTY';

-- ─────────────────────────────────────────────────────────────────
--  Covering indexes — enable index-only scans (no heap access)
--  Agent spec: "INCLUDE extra columns to enable index-only scans"
-- ─────────────────────────────────────────────────────────────────

-- Dispatch board loads all DRAFT/DISPATCHED trips; INCLUDE avoids heap fetch
-- for the most common dashboard read: status filter + vehicle/driver/route display.
CREATE INDEX "trips_dispatch_board_covering_idx"
    ON "trips"("status") INCLUDE ("vehicle_id", "driver_id", "origin", "destination", "revenue")
    WHERE "status" IN ('DRAFT', 'DISPATCHED');

-- ─────────────────────────────────────────────────────────────────
--  Foreign Keys
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "vehicles"
    ADD CONSTRAINT "vehicles_vehicle_type_id_fkey"
    FOREIGN KEY ("vehicle_type_id") REFERENCES "vehicle_types"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "trips"
    ADD CONSTRAINT "trips_vehicle_id_fkey"
    FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "trips"
    ADD CONSTRAINT "trips_driver_id_fkey"
    FOREIGN KEY ("driver_id") REFERENCES "drivers"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "fuel_logs"
    ADD CONSTRAINT "fuel_logs_vehicle_id_fkey"
    FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "fuel_logs"
    ADD CONSTRAINT "fuel_logs_trip_id_fkey"
    FOREIGN KEY ("trip_id") REFERENCES "trips"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "maintenance_logs"
    ADD CONSTRAINT "maintenance_logs_vehicle_id_fkey"
    FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "expenses"
    ADD CONSTRAINT "expenses_vehicle_id_fkey"
    FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "expenses"
    ADD CONSTRAINT "expenses_trip_id_fkey"
    FOREIGN KEY ("trip_id") REFERENCES "trips"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "vehicle_locations"
    ADD CONSTRAINT "vehicle_locations_vehicle_id_fkey"
    FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- expenses.logged_by_user_id is denormalized (no Prisma @relation, kept for audit speed)
-- but still requires a FK constraint for referential integrity at DB level.
-- ON DELETE SET NULL: expense record preserved; auditor field nulled if user deactivated.
ALTER TABLE "expenses"
    ADD CONSTRAINT "expenses_logged_by_user_id_fkey"
    FOREIGN KEY ("logged_by_user_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
