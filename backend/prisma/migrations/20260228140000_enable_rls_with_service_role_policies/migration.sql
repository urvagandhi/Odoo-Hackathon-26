-- Enable RLS on all tables and grant full access to postgres + service_role.
-- Supabase exposes the public schema via PostgREST (anon/authenticated roles).
-- RLS must be ON to block direct PostgREST access, while our Express/Prisma
-- backend connects as postgres/service_role and bypasses RLS via these policies.

-- ── 1. Enable RLS ──────────────────────────────────────────────────

ALTER TABLE IF EXISTS public._prisma_migrations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.vehicle_types        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.vehicles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.vehicle_documents    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.vehicle_locations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.drivers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.trips                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.trip_waypoints       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fuel_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.maintenance_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.expenses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.incident_reports     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs           ENABLE ROW LEVEL SECURITY;

-- ── 2. Service-role full-access policies ───────────────────────────
-- Prisma connects via the service_role (or postgres superuser).
-- These policies grant unrestricted CRUD to those roles only.

DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN
        SELECT unnest(ARRAY[
            '_prisma_migrations', 'users', 'vehicle_types', 'vehicles',
            'vehicle_documents', 'vehicle_locations', 'drivers', 'trips',
            'trip_waypoints', 'fuel_logs', 'maintenance_logs', 'expenses',
            'incident_reports', 'audit_logs'
        ])
    LOOP
        -- Drop policy if it already exists (idempotent)
        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON public.%I',
            'allow_service_role_all_' || tbl, tbl
        );
        -- Create permissive policy for service_role and postgres
        EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR ALL TO postgres, service_role USING (true) WITH CHECK (true)',
            'allow_service_role_all_' || tbl, tbl
        );
    END LOOP;
END
$$;
