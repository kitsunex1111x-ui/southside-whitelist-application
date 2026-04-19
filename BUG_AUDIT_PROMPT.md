# 🔥 COMPREHENSIVE BUG AUDIT - SouthsideRP Whitelist App

## CURRENT CRITICAL ISSUES:

### 1. DASHBOARD STUCK LOADING (HIGHEST PRIORITY)
**Symptom:** Skeleton loaders show forever, no applications load
**Console:** Network requests timing out or 500 errors
**Root Cause:** RLS policies still broken in Supabase

**Files to Check:**
- `src/pages/Dashboard.tsx` - applications fetch logic
- `src/hooks/useAuth.tsx` - user session handling
- Supabase RLS policies on `applications`, `user_roles` tables

**What to Verify:**
- Does `fetchApplications()` ever resolve?
- Are `user_roles` and `applications` RLS policies using `auth.uid()` correctly?
- Is there still infinite recursion in user_roles policy?

### 2. 500 ERRORS ON API CALLS
**Symptom:** All Supabase API calls return 500
**Affected Endpoints:**
- `/rest/v1/user_roles?select=role&user_id=eq.XXX`
- `/rest/v1/applications?select=*&user_id=eq.XXX`

**Root Cause:** PostgreSQL RLS infinite recursion or broken policies

### 3. ADMIN/OWNER PANELS NOT SHOWING
**Symptom:** User has owner role in DB but no navigation links
**Files:**
- `src/hooks/useAuth.tsx` - `isAdmin`, `isOwner` detection
- `src/components/Navbar.tsx` - conditional nav links

### 4. EDGE FUNCTION 401 ERRORS (Secondary)
**Symptom:** `get-user-roles` Edge Function returns 401
**File:** `supabase/functions/get-user-roles/index.ts`

### 5. TYPE ERRORS (Minor)
**Symptom:** `valueAsNumber` null error in console

## COMPREHENSIVE AUDIT CHECKLIST:

### Backend (Supabase SQL)
- [ ] Check `user_roles` table - verify no recursive policies
- [ ] Check `applications` table RLS policies
- [ ] Verify `is_admin_or_owner()` function works correctly
- [ ] Check if user `9563d276-b714-42c9-84d7-678577ab9b3d` has owner role
- [ ] Test direct SQL queries with RLS enabled

### Frontend Auth
- [ ] `useAuth.tsx` - session initialization
- [ ] `useAuth.tsx` - role fetching with proper error handling
- [ ] `useAuth.tsx` - isAdmin/isOwner boolean logic
- [ ] `AuthCallback.tsx` - OAuth flow completion

### Frontend Pages
- [ ] `Dashboard.tsx` - applications fetch with timeout/retry
- [ ] `Dashboard.tsx` - loading state handling
- [ ] `Dashboard.tsx` - error display (not just skeleton)
- [ ] `Apply.tsx` - form submission logic
- [ ] `Apply.tsx` - duplicate application check
- [ ] `ApplicationsHub.tsx` - new hub page (just created)
- [ ] `GangApplication.tsx` - new form (just created)
- [ ] `StaffApplication.tsx` - new form (just created)
- [ ] `AdminDashboard.tsx` - admin verification
- [ ] `OwnerDashboard.tsx` - owner verification
- [ ] `Navbar.tsx` - conditional links based on roles

### Routes
- [ ] `App.tsx` - route definitions
- [ ] `App.tsx` - ProtectedRoute/AdminRoute/OwnerRoute guards

### Database Schema
- [ ] `applications` table has `type` column
- [ ] All foreign keys indexed
- [ ] No conflicting RLS policies

## REQUIRED FIXES:

### Immediate (Critical)
1. **Fix RLS in Supabase** - run the anti-recursion SQL
2. **Add error handling to Dashboard** - show error message if fetch fails
3. **Verify role detection** - ensure owner sees admin links

### Code Improvements
4. **Add logging** - console.error when API calls fail
5. **Better error messages** - user-friendly errors, not just spinners
6. **Fallback states** - what to show when everything fails

## SQL FIXES NEEDED:

```sql
-- 1. Fix user_roles RLS (NO RECURSION)
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;

CREATE POLICY "Users can view their own role" ON user_roles
FOR SELECT TO authenticated 
USING (user_id = auth.uid());

-- Admin view uses direct check, not nested query
CREATE POLICY "Admins can view all roles" ON user_roles
FOR SELECT TO authenticated
USING (auth.uid() IN (
  SELECT user_id FROM user_roles WHERE role IN ('admin', 'owner') AND user_id = auth.uid()
));

-- 2. Verify applications RLS
DROP POLICY IF EXISTS "Users can view their own applications" ON applications;
DROP POLICY IF EXISTS "Users can insert their own applications" ON applications;

CREATE POLICY "Users can view their own applications" ON applications
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own applications" ON applications
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 3. Add type column for multi-application system
ALTER TABLE applications ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'whitelist';

-- 4. Verify owner role exists
SELECT * FROM user_roles WHERE user_id = '9563d276-b714-42c9-84d7-678577ab9b3d';

-- If not found, insert it:
INSERT INTO user_roles (user_id, role) VALUES ('9563d276-b714-42c9-84d7-678577ab9b3d', 'owner');
```

## TESTING CHECKLIST:

After all fixes:
- [ ] Dashboard loads in < 3 seconds
- [ ] Applications appear (or "no applications" message)
- [ ] Can submit whitelist application
- [ ] Can submit gang application
- [ ] Can submit staff application
- [ ] Admin link appears in navbar
- [ ] Owner link appears in navbar
- [ ] Admin panel loads
- [ ] Owner panel loads
- [ ] No 500 errors in console
- [ ] No infinite loading states

## SUCCESS CRITERIA:
- Zero console errors
- All API calls return 200
- User with owner role sees admin+owner navigation
- All 3 application types work
- Professional UX throughout
