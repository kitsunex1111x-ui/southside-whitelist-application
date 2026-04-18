import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Trash2, Plus, Loader2, UserCog, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface RoleEntry {
  id: string;
  user_id: string;
  role: AppRole;
  displayName?: string;
}

interface LogEntry {
  id: string;
  actor_user_id: string;
  action: string;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  actorName?: string;
  actorAvatar?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const getActionLabel = (log: LogEntry): string => {
  const d = log.details as any;
  switch (log.action) {
    case "accept_application":
      return `Accepted application${d?.new?.discord ? ` for ${d.new.discord}` : d?.new?.char_name ? ` for ${d.new.char_name}` : ""}`;
    case "reject_application":
      return `Rejected application${d?.new?.discord ? ` for ${d.new.discord}` : d?.new?.char_name ? ` for ${d.new.char_name}` : ""}`;
    case "add_role":
      return `Assigned ${d?.role ?? "role"}${d?.discord ? ` to ${d.discord}` : ""}`;
    case "remove_role":
      return `Removed ${d?.role ?? "role"}`;
    case "add_notes":
      return "Added admin notes";
    default:
      return log.action.replace(/_/g, " ");
  }
};

const actionColor = (action: string) => {
  if (action.includes("accept")) return "text-green-400";
  if (action.includes("reject")) return "text-red-400";
  if (action.includes("role")) return "text-yellow-400";
  return "text-blue-400";
};

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

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      // ── Roles ──────────────────────────────────────────────────────────────
      // Fetch via Edge Function (secure — only owners can call it)
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Session expired. Please log in again.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const { data: rolesResp, error: rolesErr } = await supabase.functions.invoke(
        "get-user-roles",
        { method: "POST", body: {}, headers: { Authorization: `Bearer ${session.access_token}` } }
      );

      if (rolesErr || !rolesResp?.data) {
        // Fallback: direct query (still RLS-protected)
        const { data: directRoles } = await supabase
          .from("user_roles")
          .select("id, user_id, role, created_at")
          .order("created_at", { ascending: false });

        if (directRoles) {
          const uids = directRoles.map((r) => r.user_id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, username, display_name")
            .in("user_id", uids);
          const pm = new Map(profiles?.map((p) => [p.user_id, p.display_name || p.username]) ?? []);
          setRoles(directRoles.map((r) => ({ ...r, displayName: pm.get(r.user_id) ?? `…${r.user_id.slice(-6)}` })));
        }
      } else {
        const uids = rolesResp.data.map((r: any) => r.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, display_name")
          .in("user_id", uids);
        const pm = new Map(profiles?.map((p) => [p.user_id, p.display_name || p.username]) ?? []);
        setRoles(rolesResp.data.map((r: any) => ({ ...r, displayName: pm.get(r.user_id) ?? `…${r.user_id.slice(-6)}` })));
      }

      // ── Activity logs ──────────────────────────────────────────────────────
      // Use LEFT JOIN so logs appear even when actor has no profile
      const { data: rawLogs, error: logsErr } = await supabase
        .from("admin_logs")
        .select(`
          id,
          actor_user_id,
          action,
          target_id,
          details,
          created_at,
          profiles (
            username,
            display_name
          )
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (logsErr) {
        toast.error("Could not load activity log.");
        setLogs([]);
      } else {
        // Enrich logs with actor Discord avatar from auth metadata if available
        const enriched: LogEntry[] = (rawLogs ?? []).map((l: any) => {
          const profile = Array.isArray(l.profiles) ? l.profiles[0] : l.profiles;
          const actorName =
            profile?.display_name?.trim() ||
            profile?.username?.trim() ||
            `User …${l.actor_user_id?.slice(-6) ?? "?"}`;
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
    } catch (err: any) {
      toast.error("Failed to load data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  // ── Add role ───────────────────────────────────────────────────────────────
  const addRole = async () => {
    const discordId = newDiscordId.trim();
    if (!discordId) { toast.error("Enter a Discord ID"); return; }
    if (!/^\d{17,19}$/.test(discordId)) { toast.error("Discord ID must be 17–19 digits"); return; }
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
      await supabase.from("admin_logs").insert({
        actor_user_id: user!.id,
        action: "add_role",
        target_id: app.user_id,
        details: { role: newRole, discord: discordId },
      });
      toast.success(`${newRole} assigned to ${discordId}`);
      setNewDiscordId("");
      fetchData(true);
    }
    setAdding(false);
  };

  // ── Remove role ────────────────────────────────────────────────────────────
  const removeRole = async (r: RoleEntry) => {
    if (r.user_id === user!.id && r.role === "owner") {
      toast.error("You can't remove your own owner role.");
      return;
    }
    const { error } = await supabase.from("user_roles").delete().eq("id", r.id);
    if (!error) {
      await supabase.from("admin_logs").insert({
        actor_user_id: user!.id,
        action: "remove_role",
        target_id: r.user_id,
        details: { role: r.role },
      });
      toast.success("Role removed.");
      fetchData(true);
    } else {
      toast.error(error.message);
    }
  };

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
              className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground transition-all"
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
                      <div>
                        <p className="font-medium text-sm">{r.displayName}</p>
                        <span className={`text-xs font-heading uppercase tracking-wide ${r.role === "owner" ? "text-primary" : "text-yellow-400"}`}>
                          {r.role}
                        </span>
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
              <span className="text-xs text-muted-foreground">{logs.length} entries</span>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
                <Loader2 size={14} className="animate-spin" /> Loading activity…
              </div>
            ) : logs.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">No activity recorded yet.</p>
            ) : (
              <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 bg-secondary rounded-lg px-4 py-3">
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0 mt-0.5">
                      {log.actorName?.[0]?.toUpperCase() ?? "?"}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="font-semibold text-sm text-foreground">{log.actorName}</span>
                        <span className={`text-xs font-medium ${actionColor(log.action)}`}>
                          {getActionLabel(log)}
                        </span>
                      </div>
                      {/* Extra detail row */}
                      {log.details && (() => {
                        const d = log.details as any;
                        const parts: string[] = [];
                        if (d?.new?.discord) parts.push(`Discord: ${d.new.discord}`);
                        if (d?.new?.char_name) parts.push(`Char: ${d.new.char_name}`);
                        if (d?.notes) parts.push(`"${String(d.notes).slice(0, 60)}${d.notes.length > 60 ? "…" : ""}"`);
                        if (log.target_id && !d?.new?.discord) parts.push(`ID: ${log.target_id.slice(0, 8)}…`);
                        return parts.length > 0 ? (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{parts.join(" · ")}</p>
                        ) : null;
                      })()}
                    </div>

                    {/* Timestamp */}
                    <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 mt-0.5">
                      {new Date(log.created_at).toLocaleString(undefined, {
                        month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
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
