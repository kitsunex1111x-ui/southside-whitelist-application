import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase, rawSelect, rawInsert } from "@/integrations/supabase/client";
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
      const { data: roleData, error } = await rawSelect<{ role: string }[]>(
        "user_roles",
        { user_id: `eq.${userId}`, select: "role" }
      );

      if (error || !roleData) return [];

      const userRoles: AppRole[] = roleData.map((r) => r.role as AppRole);

      if (userRoles.length === 0) {
        await rawInsert("user_roles", { user_id: userId, role: "user" });
        userRoles.push("user" as AppRole);
      }

      return userRoles;
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Hard timeout — guarantees loading never hangs forever on slow connections
    const timeoutId = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 3000);

    // Initial session load on mount
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        clearTimeout(timeoutId);
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          const userRoles = await fetchRoles(session.user.id);
          if (mounted) setRoles(userRoles);
        }
        if (mounted) setLoading(false);
      })
      .catch(() => {
        clearTimeout(timeoutId);
        if (mounted) setLoading(false);
      });

    // React to all auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [fetchRoles]);

  // Hard redirect ensures all in-memory state is fully reset
  const signOut = useCallback(async () => {
    setUser(null);
    setSession(null);
    setRoles([]);
    try {
      await supabase.auth.signOut();
    } catch {
      // State is already cleared — safe to ignore
    }
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
