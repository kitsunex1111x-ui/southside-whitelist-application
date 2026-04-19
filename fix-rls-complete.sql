-- ============================================================
-- SouthsideRP — Complete RLS Policy Fix
-- Run this ENTIRE script in Supabase SQL Editor
-- Project: sxvfmmqrgqlinxzuvjgv
-- ============================================================

-- ── Step 1: Create a stable, SECURITY DEFINER helper function ──────────────
-- This avoids the subquery-in-RLS anti-pattern that causes 500 errors.
-- Called once per policy evaluation — fast and cached.

CREATE OR REPLACE FUNCTION public.is_admin_or_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'owner'
  );
$$;

-- ── Step 2: APPLICATIONS table ──────────────────────────────────────────────
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start clean
DROP POLICY IF EXISTS "Users can view own applications"     ON public.applications;
DROP POLICY IF EXISTS "Users can insert own applications"   ON public.applications;
DROP POLICY IF EXISTS "Users can update own applications"   ON public.applications;
DROP POLICY IF EXISTS "Admins can view all applications"    ON public.applications;
DROP POLICY IF EXISTS "Admins can update all applications"  ON public.applications;
DROP POLICY IF EXISTS "Allow users to view own"             ON public.applications;
DROP POLICY IF EXISTS "Allow users to insert"               ON public.applications;
DROP POLICY IF EXISTS "Allow admin read"                    ON public.applications;
DROP POLICY IF EXISTS "Allow admin update"                  ON public.applications;
DROP POLICY IF EXISTS "applications_select_own"             ON public.applications;
DROP POLICY IF EXISTS "applications_insert_own"             ON public.applications;
DROP POLICY IF EXISTS "applications_admin_select"           ON public.applications;
DROP POLICY IF EXISTS "applications_admin_update"           ON public.applications;

-- Clean simple policies
CREATE POLICY "applications_select_own"
  ON public.applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "applications_insert_own"
  ON public.applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "applications_admin_select"
  ON public.applications FOR SELECT
  USING (public.is_admin_or_owner());

CREATE POLICY "applications_admin_update"
  ON public.applications FOR UPDATE
  USING (public.is_admin_or_owner());

-- ── Step 3: USER_ROLES table ────────────────────────────────────────────────
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own roles"           ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles"          ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles"            ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles"            ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own role"          ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_own"              ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_admin"            ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_admin"            ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_own"              ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_admin"            ON public.user_roles;

-- Users see their own roles (needed for auth context to work)
CREATE POLICY "user_roles_select_own"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Admins/owners see all roles
CREATE POLICY "user_roles_select_admin"
  ON public.user_roles FOR SELECT
  USING (public.is_admin_or_owner());

-- Anyone can insert their own "user" role (new signup default role)
CREATE POLICY "user_roles_insert_own"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id AND role = 'user');

-- Admins/owners can assign any role
CREATE POLICY "user_roles_insert_admin"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.is_admin_or_owner());

-- Owners can delete roles
CREATE POLICY "user_roles_delete_admin"
  ON public.user_roles FOR DELETE
  USING (public.is_owner());

-- ── Step 4: PROFILES table ──────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile"         ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile"       ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile"       ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles"       ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own"                ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"                ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"                ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin"              ON public.profiles;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins need to read profiles for the OwnerDashboard actor name resolution
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (public.is_admin_or_owner());

-- ── Step 5: ADMIN_LOGS table ────────────────────────────────────────────────
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view logs"               ON public.admin_logs;
DROP POLICY IF EXISTS "Admins can insert logs"             ON public.admin_logs;
DROP POLICY IF EXISTS "admin_logs_select_admin"            ON public.admin_logs;
DROP POLICY IF EXISTS "admin_logs_insert_admin"            ON public.admin_logs;

-- Only admins/owners can read logs
CREATE POLICY "admin_logs_select_admin"
  ON public.admin_logs FOR SELECT
  USING (public.is_admin_or_owner());

-- Any authenticated user can insert a log (needed for self-logging)
-- But only admins/owners actually call this in practice
CREATE POLICY "admin_logs_insert_admin"
  ON public.admin_logs FOR INSERT
  WITH CHECK (auth.uid() = actor_user_id AND public.is_admin_or_owner());

-- ── Step 6: Ensure your owner row exists ────────────────────────────────────
-- Replace with your actual user_id if needed
INSERT INTO public.user_roles (user_id, role)
VALUES ('9563d276-b714-42c9-84d7-678577ab9b3d', 'owner')
ON CONFLICT DO NOTHING;

-- ── Step 7: Verify setup ─────────────────────────────────────────────────────
-- Run this to confirm your role is in DB:
-- SELECT * FROM user_roles WHERE user_id = '9563d276-b714-42c9-84d7-678577ab9b3d';

-- ── Done ─────────────────────────────────────────────────────────────────────
SELECT 'RLS policies applied successfully' AS status;
