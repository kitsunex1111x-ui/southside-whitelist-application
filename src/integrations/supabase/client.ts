import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export const SUPABASE_URL = "https://sxvfmmqrgqlinxzuvjgv.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dmZtbXFyZ3FsaW54enV2amd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5ODAxNzAsImV4cCI6MjA5MTU1NjE3MH0.ElJ8dTUs7b75lFuKchErbCbYpziCZPI_VwbYCGgjq_c";

// Supabase JS client — used ONLY for auth (login, session, OAuth)
// All database queries go through rawQuery() below to avoid the
// v2.101.x session-lock bug that causes every query to hang forever.
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
    flowType: "implicit",
  },
  // Disable realtime so it doesn't interfere with auth lock
  realtime: { params: { eventsPerSecond: -1 } },
});

// ── Raw REST helper (bypasses the supabase-js session lock) ──────────────
// Uses the PostgREST API directly via fetch.
// Returns { data, error } to match supabase-js API shape.

type RawResult<T> = Promise<{ data: T | null; error: { message: string } | null }>;

function getAuthHeader(): string {
  // Bypass supabase.auth.getSession() to avoid the session-lock deadlock.
  // Get token directly from localStorage where Supabase stores it.
  // Storage key format: sb-<project-ref>-auth-token
  try {
    const projectRef = SUPABASE_URL.replace("https://", "").split(".")[0]; // sxvfmmqrgqlinxzuvjgv
    const storageKey = `sb-${projectRef}-auth-token`;
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      const token = parsed?.access_token || parsed?.session?.access_token;
      if (token) return `Bearer ${token}`;
    }
  } catch {
    // Fallback to anon key if anything fails
  }
  return `Bearer ${SUPABASE_ANON_KEY}`;
}

// Get auth header from active Supabase session (for critical RLS-gated operations)
export async function getAuthHeaderFromSession(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return `Bearer ${session.access_token}`;
    }
  } catch {
    // Fall through to localStorage method
  }
  return getAuthHeader();
}

export async function rawSelect<T = any>(
  table: string,
  params: Record<string, string> = {},
  options: { single?: boolean } = {}
): RawResult<T> {
  try {
    const authHeader = getAuthHeader();
    const qs = new URLSearchParams(params).toString();
    const url = `${SUPABASE_URL}/rest/v1/${table}${qs ? "?" + qs : ""}`;

    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: authHeader,
        "Content-Type": "application/json",
        Accept: options.single ? "application/vnd.pgrst.object+json" : "application/json",
        Prefer: options.single ? "return=representation" : "",
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
      return { data: null, error: { message: err.message ?? err.hint ?? `HTTP ${res.status}` } };
    }

    const data = await res.json();
    return { data: data as T, error: null };
  } catch (e: any) {
    return { data: null, error: { message: e?.message ?? "Network error" } };
  }
}

export async function rawInsert<T = any>(
  table: string,
  body: Record<string, any>
): RawResult<T> {
  try {
    const authHeader = getAuthHeader();
    const url = `${SUPABASE_URL}/rest/v1/${table}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: authHeader,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
      return { data: null, error: { message: err.message ?? err.hint ?? `HTTP ${res.status}`, ...err } };
    }

    const data = await res.json();
    return { data: data as T, error: null };
  } catch (e: any) {
    return { data: null, error: { message: e?.message ?? "Network error" } };
  }
}

// Session-aware insert for RLS-critical operations (uses actual Supabase session token)
export async function rawInsertWithAuth<T = any>(
  table: string,
  body: Record<string, any>
): RawResult<T> {
  try {
    const authHeader = await getAuthHeaderFromSession();
    const url = `${SUPABASE_URL}/rest/v1/${table}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: authHeader,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
      return { data: null, error: { message: err.message ?? err.hint ?? `HTTP ${res.status}`, ...err } };
    }

    const data = await res.json();
    return { data: data as T, error: null };
  } catch (e: any) {
    return { data: null, error: { message: e?.message ?? "Network error" } };
  }
}

export async function rawUpdate(
  table: string,
  filter: Record<string, string>,
  body: Record<string, any>
): RawResult<any> {
  try {
    const authHeader = getAuthHeader();
    const qs = new URLSearchParams(filter).toString();
    const url = `${SUPABASE_URL}/rest/v1/${table}?${qs}`;

    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: authHeader,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
      return { data: null, error: { message: err.message ?? `HTTP ${res.status}` } };
    }

    const data = await res.json();
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: { message: e?.message ?? "Network error" } };
  }
}

export async function rawDelete(
  table: string,
  filter: Record<string, string>
): RawResult<any> {
  try {
    const authHeader = getAuthHeader();
    const qs = new URLSearchParams(filter).toString();
    const url = `${SUPABASE_URL}/rest/v1/${table}?${qs}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: authHeader,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
      return { data: null, error: { message: err.message ?? `HTTP ${res.status}` } };
    }
    const data = await res.json().catch(() => null);
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: { message: e?.message ?? "Network error" } };
  }
}

export async function rawRpc<T = any>(
  fn: string,
  params: Record<string, any> = {}
): RawResult<T> {
  try {
    const authHeader = getAuthHeader();
    const url = `${SUPABASE_URL}/rest/v1/rpc/${fn}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: authHeader,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
      return { data: null, error: { message: err.message ?? err.hint ?? `HTTP ${res.status}` } };
    }
    const data = await res.json();
    return { data: data as T, error: null };
  } catch (e: any) {
    return { data: null, error: { message: e?.message ?? "Network error" } };
  }
}
