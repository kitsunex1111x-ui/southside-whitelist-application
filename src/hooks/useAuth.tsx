import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface AuthContextType {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  loading: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = useCallback(async (userId: string): Promise<AppRole[]> => {
    try {
      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) return [];

      const userRoles: AppRole[] = roleData?.map((r) => r.role) ?? [];

      if (userRoles.length === 0) {
        const { error: insertError } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "user" });
        if (!insertError) userRoles.push("user");
      }

      return userRoles;
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Timeout failsafe — if getSession hangs, force stop loading
    const timeoutId = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 3000);

    // Initial session load — runs once on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(timeoutId);
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const userRoles = await fetchRoles(session.user.id);
        if (mounted) setRoles(userRoles);
      }
      if (mounted) setLoading(false);
    }).catch((err) => {
      clearTimeout(timeoutId);
      console.error("[Auth] getSession failed:", err);
      if (mounted) setLoading(false);
    });

    // Listen for auth events (login, logout, token refresh, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (event === "SIGNED_OUT" || !session) {
        setRoles([]);
        setLoading(false);
        return;
      }

      if (session?.user) {
        const userRoles = await fetchRoles(session.user.id);
        if (mounted) setRoles(userRoles);
      }

      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchRoles]);

  const signOut = useCallback(async () => {
    try {
      // Clear local state immediately so UI responds at once
      setUser(null);
      setSession(null);
      setRoles([]);
      // Then tell Supabase to invalidate the server session
      await supabase.auth.signOut();
    } catch {
      // State is already cleared — safe to ignore
    }
    // Hard redirect — clears any in-memory route state
    window.location.href = "/auth";
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        roles,
        loading,
        isAdmin: roles.includes("admin") || roles.includes("owner"),
        isOwner: roles.includes("owner"),
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
