-- ─────────────────────────────────────────────────────────────────
--  Migration: Remove SUPER_ADMIN role, add password reset token fields
--
--  Context: FleetFlow is now a single-organization system.
--           MANAGER is the highest role. SUPER_ADMIN is removed.
--           Password reset token fields added to users table.
-- ─────────────────────────────────────────────────────────────────

-- Step 1: Promote any existing SUPER_ADMIN users → MANAGER
--         (safe no-op if no SUPER_ADMIN users exist)
UPDATE "users" SET "role" = 'MANAGER' WHERE "role" = 'SUPER_ADMIN';

-- Step 2: Recreate UserRole enum without SUPER_ADMIN
--         PostgreSQL does not support DROP VALUE from an existing enum.
--         Strategy: drop default → create new type → alter column → drop old type → rename.
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;

CREATE TYPE "UserRole_v2" AS ENUM ('MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCE_ANALYST');

ALTER TABLE "users"
    ALTER COLUMN "role" TYPE "UserRole_v2"
    USING "role"::text::"UserRole_v2";

DROP TYPE "UserRole";
ALTER TYPE "UserRole_v2" RENAME TO "UserRole";

-- Restore default (cast to renamed type)
ALTER TABLE "users"
    ALTER COLUMN "role" SET DEFAULT 'DISPATCHER'::"UserRole";

-- Step 3: Add password reset token columns
ALTER TABLE "users"
    ADD COLUMN "reset_token"        TEXT,
    ADD COLUMN "reset_token_expiry" TIMESTAMPTZ;

-- Step 4: Partial index for fast reset token lookups
--         WHERE filter keeps the index tiny (only tokens in-flight)
CREATE INDEX "users_reset_token_idx"
    ON "users" ("reset_token")
    WHERE "reset_token" IS NOT NULL;
