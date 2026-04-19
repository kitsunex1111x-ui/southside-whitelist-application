import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import {
  Shield, Trash2, Plus, Loader2, UserCog,
  Clock, RefreshCw, CheckCircle, XCircle,
  UserPlus, UserMinus, FileText, Activity,
} from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface RoleEntry {
  id: string;
  user_id: string;
  role: AppRole;
  displayName: string;
}

interface LogEntry {
  id: string;
  actor_user_id: string;
  action: string;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  actorName: string;
}

// ── Action config ─────────────────────────────────────────────────────────────
const ACTION_CONFIG: Record<string, {
  label: (d: any) => string;
  color: string;
  bg: string;
  Icon: React.ElementType;
}> = {
  accept_application: {
    label: (d) => {
      const who = d?.new?.discord || d?.new?.char_name || d?.discord || null;
      return who ? `Accepted application for ${who}` : "Accepted application";
    },
    color: "text-green-400",
    bg: "bg-green-400/10 border-green-400/20",
    Icon: CheckCircle,
  },
  reject_application: {
    label: (d) => {
      const who = d?.new?.discord || d?.new?.char_name || d?.discord || null;
      return who ? `Rejected application for ${who}` : "Rejected application";
    },
    color: "text-red-400",
    bg: "bg-red-400/10 border-red-400/20",
    Icon: XCircle,
  },
  add_role: {
    label: (d) => `Assigned ${d?.role ?? "role"}${d?.discord ? ` to ${d.discord}` : ""}`,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10 border-yellow-400/20",
    Icon: UserPlus,
  },
  remove_role: {
    label: (d) => `Removed ${d?.role ?? "role"}`,
    color: "text-orange-400",
    bg: "bg-orange-400/10 border-orange-400/20",
    Icon: UserMinus,
  },
  add_notes: {
    label: () => "Added admin notes",
    color: "text-blue-400",
    bg: "bg-blue-400/10 border-blue-400/20",
    Icon: FileText,
  },
};

const getActionCfg = (action: string) =>
  ACTION_CONFIG[action] ?? {
    label: () => action.replace(/_/g, " "),
    color: "text-muted-foreground",
    bg: "bg-secondary border-border",
    Icon: Activity,
  };

const formatTs = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

// ── Component ─────────────────────────────────────────────────────────────────
const OwnerDashboard = () => {
  const { user, isOwner, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<RoleEntry[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [newDiscordId, setNewDiscordId] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("admin");
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    // Timeout safety - force stop loading after 5s
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setRefreshing(false);
    }, 5000);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        clearTimeout(timeoutId);
        toast.error("Session expired — please log in again.");
        setLoading(false);
        return;
      }

      // ── Roles ────────────────────────────────────────────────────────────
      // Use direct RLS query (Edge Function removed - was causing 401 delays)
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("id, user_id, role, created_at")
        .order("created_at", { ascending: false });
      const rawRoles = rolesData ?? [];

      // Fetch profiles for roles in a SEPARATE query (no FK join needed)
      const roleUids = [...new Set(rawRoles.map((r) => r.user_id))];
      const profileMap = new Map<string, string>();
      if (roleUids.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, username, display_name")
          .in("user_id", roleUids);
        (profs ?? []).forEach((p) =>
          profileMap.set(p.user_id, (p.display_name || p.username || "").trim())
        );
      }

      setRoles(
        rawRoles.map((r) => ({
          ...r,
          displayName: profileMap.get(r.user_id) || `…${r.user_id.slice(-8)}`,
        }))
      );

      // ── Logs — two-step: fetch logs then profiles separately ─────────────
      // Supabase only resolves FK joins automatically; admin_logs.actor_user_id
      // has no declared FK to profiles, so we fetch them independently.
      const { data: rawLogs, error: logsErr } = await supabase
        .from("admin_logs")
        .select("id, actor_user_id, action, target_id, details, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (logsErr || !rawLogs) {
        toast.error("Could not load activity log.");
        setLogs([]);
      } else {
        // Collect all unique actor IDs
        const actorIds = [...new Set(rawLogs.map((l) => l.actor_user_id).filter(Boolean))];

        // Fetch their profiles in one query
        const actorMap = new Map<string, string>();
        if (actorIds.length > 0) {
          const { data: actorProfs } = await supabase
            .from("profiles")
            .select("user_id, username, display_name")
            .in("user_id", actorIds);
          (actorProfs ?? []).forEach((p) => {
            const name = (p.display_name || p.username || "").trim();
            if (name) actorMap.set(p.user_id, name);
          });
        }

        const enriched: LogEntry[] = rawLogs.map((l) => {
          const d = l.details as any;
          // Resolution priority:
          // 1. actor_name embedded at write time (new logs)
          // 2. profile display_name / username from profiles table
          // 3. current user's own metadata (if they are the actor)
          // 4. short user ID fallback
          let actorName =
            d?.actor_name?.trim() ||
            actorMap.get(l.actor_user_id) ||
            null;

          if (!actorName && session?.user?.id === l.actor_user_id) {
            actorName =
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.user_name ||
              session.user.email ||
              null;
          }

          actorName = actorName || `User …${l.actor_user_id?.slice(-6) ?? "?"}`;

          return {
            id: l.id,
            actor_user_id: l.actor_user_id,
            action: l.action,
            target_id: l.target_id,
            details: l.details,
            created_at: l.created_at,
            actorName,
          };
        });

        setLogs(enriched);
      }
    } catch (e) {
      clearTimeout(timeoutId);
      toast.error("Failed to load owner data.");
      if (!silent) setLoading(false);
      else setRefreshing(false);
    } finally {
      clearTimeout(timeoutId);
      if (!silent) setLoading(false);
      else setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isOwner) fetchData();
  }, [isOwner, fetchData]);

  if (authLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!isOwner) return <Navigate to="/dashboard" replace />;

  // ── Mutations ──────────────────────────────────────────────────────────────
  const addRole = async () => {
    const discordId = newDiscordId.trim();
    if (!discordId) return toast.error("Enter a Discord ID");
    if (!/^\d{17,19}$/.test(discordId)) return toast.error("Discord ID must be 17–19 digits");
    setAdding(true);

    const { data: app } = await supabase
      .from("applications")
      .select("user_id, discord")
      .eq("discord", discordId)
      .maybeSingle();

    if (!app) {
      toast.error("No application found for that Discord ID.");
      setAdding(false);
      return;
    }

    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: app.user_id, role: newRole });

    if (error) {
      toast.error(error.message.includes("duplicate") ? "User already has that role." : error.message);
    } else {
      const actorName =
        user!.user_metadata?.full_name ||
        user!.user_metadata?.user_name ||
        user!.email ||
        user!.id.slice(-8);
      await supabase.from("admin_logs").insert({
        actor_user_id: user!.id,
        action: "add_role",
        target_id: app.user_id,
        details: { actor_name: actorName, role: newRole, discord: discordId },
      });
      toast.success(`${newRole} assigned to ${discordId}`);
      setNewDiscordId("");
      fetchData(true);
    }
    setAdding(false);
  };

  const removeRole = async (r: RoleEntry) => {
    if (r.user_id === user!.id && r.role === "owner")
      return toast.error("You can't remove your own owner role.");

    const { error } = await supabase.from("user_roles").delete().eq("id", r.id);
    if (!error) {
      const actorName =
        user!.user_metadata?.full_name ||
        user!.user_metadata?.user_name ||
        user!.email ||
        user!.id.slice(-8);
      await supabase.from("admin_logs").insert({
        actor_user_id: user!.id,
        action: "remove_role",
        target_id: r.user_id,
        details: { actor_name: actorName, role: r.role },
      });
      toast.success("Role removed.");
      fetchData(true);
    } else {
      toast.error(error.message);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">

          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="font-heading text-4xl font-bold uppercase tracking-wider">
                Owner <span className="text-primary text-glow-red">Panel</span>
              </h1>
              <p className="text-muted-foreground mt-1">Manage admins, roles, and activity.</p>
            </div>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {/* Roles grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

            {/* Add Role */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-heading text-xl font-semibold uppercase tracking-wide mb-6 flex items-center gap-2">
                <Plus size={20} className="text-primary" /> Add Role
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 uppercase tracking-wide">Discord ID</label>
                  <input
                    type="text"
                    value={newDiscordId}
                    onChange={(e) => setNewDiscordId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addRole()}
                    placeholder="e.g. 123456789012345678"
                    className="w-full bg-secondary border border-border rounded-md px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 uppercase tracking-wide">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as AppRole)}
                    className="w-full bg-secondary border border-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  >
                    <option value="admin">Admin</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>
                <button
                  onClick={addRole}
                  disabled={adding}
                  className="w-full gradient-red text-primary-foreground py-3 rounded-md font-heading uppercase tracking-wider text-sm hover:box-glow-red transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {adding ? <Loader2 className="animate-spin" size={16} /> : <Shield size={16} />}
                  Assign Role
                </button>
              </div>
            </div>

            {/* Current Roles */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-heading text-xl font-semibold uppercase tracking-wide mb-6 flex items-center gap-2">
                <UserCog size={20} className="text-primary" /> Current Roles
                {!loading && <span className="ml-auto text-xs text-muted-foreground font-normal normal-case">{roles.length} members</span>}
              </h2>
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 size={14} className="animate-spin" /> Loading…
                </div>
              ) : roles.length === 0 ? (
                <p className="text-muted-foreground text-sm">No roles assigned yet.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {roles.map((r) => (
                    <div key={r.id} className="flex items-center justify-between bg-secondary rounded-lg px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-bold">
                          {r.displayName[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{r.displayName}</p>
                          <span className={`text-xs font-heading uppercase tracking-wide ${r.role === "owner" ? "text-primary" : r.role === "admin" ? "text-yellow-400" : "text-green-400"}`}>
                            {r.role}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeRole(r)}
                        className="p-2 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all"
                        title="Remove role"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-semibold uppercase tracking-wide flex items-center gap-2">
                <Clock size={20} className="text-primary" /> Activity Log
              </h2>
              <span className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                {logs.length} entries
              </span>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-6">
                <Loader2 size={14} className="animate-spin" /> Loading activity…
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <Activity size={32} className="text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-muted-foreground text-sm">No activity recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[36rem] overflow-y-auto pr-1">
                {logs.map((log) => {
                  const d = log.details as any;
                  const cfg = getActionCfg(log.action);
                  const IconComp = cfg.Icon;
                  const label = cfg.label(d);

                  // Build detail chips
                  const chips: { label: string; value: string }[] = [];
                  if (d?.new?.discord || d?.discord) chips.push({ label: "Discord", value: d?.new?.discord || d?.discord });
                  if (d?.new?.char_name) chips.push({ label: "Character", value: d.new.char_name });
                  if (d?.role) chips.push({ label: "Role", value: d.role });
                  if (d?.notes) chips.push({ label: "Note", value: String(d.notes).slice(0, 60) + (String(d.notes).length > 60 ? "…" : "") });

                  return (
                    <div key={log.id} className="flex items-start gap-3 rounded-xl border border-border/50 bg-secondary/50 px-4 py-3 hover:bg-secondary transition-colors">

                      {/* Action icon */}
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
                        <IconComp size={14} className={cfg.color} />
                      </div>

                      {/* Body */}
                      <div className="flex-1 min-w-0">

                        {/* Actor + action line */}
                        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                          <span className="font-semibold text-sm text-foreground">{log.actorName}</span>
                          <span className={`text-xs font-medium ${cfg.color}`}>{label}</span>
                        </div>

                        {/* Detail chips */}
                        {chips.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {chips.map((chip) => (
                              <span
                                key={chip.label}
                                className="inline-flex items-center gap-1 text-xs bg-background border border-border rounded-md px-2 py-0.5 text-muted-foreground"
                              >
                                <span className="font-medium text-foreground/60">{chip.label}:</span>
                                {chip.value}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Timestamp */}
                      <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 mt-0.5 tabular-nums">
                        {formatTs(log.created_at)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
};

export default OwnerDashboard;
