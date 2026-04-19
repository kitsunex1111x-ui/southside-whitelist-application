# 🔧 Claude AI Fix Prompt - Southside Whitelist App

## Current Status
We've applied fixes to prevent "hanging skeletons" but need your help with remaining issues.

## Your Mission
Use Supabase MCP to diagnose and fix these remaining problems:

---

## Issue 1: Verify RLS Policies Are Clean

Run this to check for duplicate/conflicting policies:

```sql
SELECT policyname, tablename, cmd, qual
FROM pg_policies
WHERE tablename IN ('user_roles','applications')
ORDER BY tablename, policyname;
```

**Goal:** Ensure only these policies exist (drop any others):
- `user_roles_select_own` - Users see their own role
- `user_roles_select_admin` - Admins see all roles  
- `applications_select_own` - Users see their apps
- `applications_select_admin` - Admins see all apps
- `applications_insert_own` - Users insert their apps

If you find policies with names like:
- "Users can view their own role"
- "Admins can view all roles"
- Any duplicates

**Drop them:**
```sql
DROP POLICY IF EXISTS "old policy name" ON user_roles;
```

---

## Issue 2: Test Dashboard Query Performance

Run this EXPLAIN for my user:
```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, user_id, status, created_at, type
FROM public.applications
WHERE user_id = '9563d276-b714-42c9-84d7-678577ab9b3d'
ORDER BY created_at DESC;
```

**Expected:** Execution time < 1ms (we saw 0.095ms earlier)

If slow, check:
1. Are indexes being used? (should see "Index Scan" not "Seq Scan")
2. Row count in applications table: `SELECT COUNT(*) FROM applications;`

---

## Issue 3: Verify applications.type Column

Check if column exists:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'applications' AND column_name = 'type';
```

If missing, add it:
```sql
ALTER TABLE applications ADD COLUMN type VARCHAR(20) DEFAULT 'whitelist';
CREATE INDEX idx_applications_type ON applications(type);
UPDATE applications SET type = 'whitelist' WHERE type IS NULL;
```

---

## Issue 4: Verify My Owner Role

Confirm I have owner role:
```sql
SELECT * FROM user_roles WHERE user_id = '9563d276-b714-42c9-84d7-678577ab9b3d';
```

If missing:
```sql
INSERT INTO user_roles (user_id, role) 
VALUES ('9563d276-b714-42c9-84d7-678577ab9b3d', 'owner');
```

---

## Issue 5: Check For Database Errors

Look for recent errors in logs:
```sql
-- Check if any errors in recent queries
-- (If you have access to postgres logs, look for RLS errors)

-- Alternative: test the exact query the frontend makes
SELECT 
  id, 
  user_id, 
  char_name, 
  discord, 
  status, 
  created_at,
  type,
  admin_notes
FROM applications 
WHERE user_id = '9563d276-b714-42c9-84d7-678577ab9b3d'
ORDER BY created_at DESC
LIMIT 50;
```

---

## Issue 6: Test With Fresh Session

1. Get a fresh anon key test (simulates new user):
```sql
-- Verify simple query works
SELECT id FROM applications LIMIT 1;
```

2. Check if auth.uid() works in RLS context:
```sql
-- Set up test (run as admin)
SET LOCAL ROLE authenticated;
SET request.jwt.claim.sub = '9563d276-b714-42c9-84d7-678577ab9b3d';

-- This should work if RLS is correct:
SELECT * FROM applications WHERE user_id = '9563d276-b714-42c9-84d7-678577ab9b3d';
```

---

## Frontend Context (What I Need From Backend)

**Current Dashboard fetch code (post-fix):**
```typescript
useEffect(() => {
  if (!user) return;
  
  let cancelled = false;
  setLoading(true);
  setError(null);

  const timeoutMs = 4000;
  const hardUiMs = 3000;

  const hardTimeout = setTimeout(() => {
    if (cancelled) return;
    setLoading(false);
    setError("Loading applications timed out. Please refresh.");
  }, hardUiMs);

  const controller = new AbortController();
  const requestTimeout = setTimeout(() => controller.abort(), timeoutMs);

  const fetchOnce = async () => {
    try {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .abortSignal(controller.signal);

      if (cancelled) return;

      if (error) {
        setError("Failed to load applications. Please try again.");
        setApplications([]);
        return;
      }
      setApplications(data ?? []);
      setError(null);
    } catch (err: any) {
      if (cancelled) return;
      if (err?.name === "AbortError") {
        setError("Loading applications timed out. Please refresh.");
      } else {
        setError("Network error. Please check your connection and try again.");
      }
      setApplications([]);
    } finally {
      if (!cancelled) setLoading(false);
      clearTimeout(requestTimeout);
      clearTimeout(hardTimeout);
    }
  };
  fetchOnce();

  return () => {
    cancelled = true;
    controller.abort();
    clearTimeout(requestTimeout);
    clearTimeout(hardTimeout);
  };
}, [user]);
```

**What the frontend needs:**
1. Fast query response (< 500ms)
2. No 500 errors from RLS
3. Data returned for `user_id = '9563d276-b714-42c9-84d7-678577ab9b3d'`

---

## Success Criteria

Tell me if:
- ✅ Policies are clean (no duplicates)
- ✅ Query is fast (< 1ms)
- ✅ `type` column exists
- ✅ Owner role is assigned
- ✅ No database errors

Or if you find:
- ❌ Broken RLS policy (show me which one)
- ❌ Missing column
- ❌ Missing role
- ❌ Slow query (show EXPLAIN)

---

## Output Format

```
## Findings
1. Policies: [clean/needs fix - which ones]
2. Query speed: [Xms - fast/slow]
3. Column 'type': [exists/missing]
4. Owner role: [present/missing]
5. Errors found: [none/list them]

## SQL to Run (if any)
```sql
-- Your fix SQL here
```

## Verdict
[Ready for testing / Still blocked by X]
```
