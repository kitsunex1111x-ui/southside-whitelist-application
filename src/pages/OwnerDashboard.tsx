import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { rawSelect, rawInsert, rawDelete } from "@/integrations/supabase/client";
import { Shield, Trash2, Plus, Loader2, UserCog, Clock, RefreshCw,
  CheckCircle, XCircle, UserPlus, UserMinus, FileText, Activity } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
interface RoleEntry { id: string; user_id: string; role: AppRole; displayName: string; }
interface LogEntry { id: string; actor_user_id: string; action: string;
  target_id: string | null; details: Record<string, unknown> | null;
  created_at: string; actorName: string; }

const ACTION_CONFIG: Record<string, { label: (d: any) => string; color: string; bg: string; Icon: React.ElementType }> = {
  accept_application: { label: d => `Accepted application${d?.new?.discord ? ` for ${d.new.discord}` : ""}`,
    color: "text-green-400", bg: "bg-green-400/10 border-green-400/20", Icon: CheckCircle },
  reject_application: { label: d => `Rejected application${d?.new?.discord ? ` for ${d.new.discord}` : ""}`,
    color: "text-red-400", bg: "bg-red-400/10 border-red-400/20", Icon: XCircle },
  add_role: { label: d => `Assigned ${d?.role ?? "role"}${d?.discord ? ` to ${d.discord}` : ""}`,
    color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20", Icon: UserPlus },
  remove_role: { label: d => `Removed ${d?.role ?? "role"}`,
    color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/20", Icon: UserMinus },
  add_notes: { label: () => "Added admin notes",
    color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20", Icon: FileText },
};
const getActionCfg = (a: string) => ACTION_CONFIG[a] ?? {
  label: () => a.replace(/_/g, " "), color: "text-muted-foreground",
  bg: "bg-secondary border-border", Icon: Activity };
const fmtTs = (iso: string) => new Date(iso).toLocaleString(undefined,
  { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const OwnerDashboard = () => {
  const { user, isOwner, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<RoleEntry[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [newDiscordId, setNewDiscordId] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("admin");
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const actorName = () =>
    user!.user_metadata?.full_name || user!.user_metadata?.user_name ||
    user!.user_metadata?.name || user!.email || user!.id.slice(-8);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      // Roles
      const { data: rolesData } = await rawSelect<{ id: string; user_id: string; role: string; created_at: string }[]>(
        "user_roles", { select: "id,user_id,role,created_at", order: "created_at.desc" }
      );
      const rawRoles = rolesData ?? [];

      // Profiles for roles
      const roleUids = [...new Set(rawRoles.map(r => r.user_id))];
      const profileMap = new Map<string, string>();
      if (roleUids.length > 0) {
        const { data: profs } = await rawSelect<{ user_id: string; username: string; display_name: string }[]>(
          "profiles", { user_id: `in.(${roleUids.join(",")})`, select: "user_id,username,display_name" }
        );
        (profs ?? []).forEach(p => profileMap.set(p.user_id, (p.display_name || p.username || "").trim()));
      }
      setRoles(rawRoles.map(r => ({
        ...r, role: r.role as AppRole,
        displayName: profileMap.get(r.user_id) || `…${r.user_id.slice(-8)}`,
      })));

      // Logs
      const { data: rawLogs } = await rawSelect<{ id: string; actor_user_id: string; action: string;
        target_id: string | null; details: any; created_at: string }[]>(
        "admin_logs", { select: "id,actor_user_id,action,target_id,details,created_at",
          order: "created_at.desc", limit: "100" }
      );
      if (rawLogs) {
        const actorIds = [...new Set(rawLogs.map(l => l.actor_user_id).filter(Boolean))];
        const actorMap = new Map<string, string>();
        if (actorIds.length > 0) {
          const { data: ap } = await rawSelect<{ user_id: string; username: string; display_name: string }[]>(
            "profiles", { user_id: `in.(${actorIds.join(",")})`, select: "user_id,username,display_name" }
          );
          (ap ?? []).forEach(p => { const n = (p.display_name || p.username || "").trim(); if (n) actorMap.set(p.user_id, n); });
        }
        setLogs(rawLogs.map(l => {
          const d = l.details as any;
          const name = d?.actor_name?.trim() || actorMap.get(l.actor_user_id)
            || (user?.id === l.actor_user_id ? actorName() : null)
            || `User …${l.actor_user_id?.slice(-6) ?? "?"}`;
          return { ...l, actorName: name };
        }));
      }
    } catch { toast.error("Failed to load owner data."); }
    finally { if (!silent) setLoading(false); else setRefreshing(false); }
  }, [user]);

  useEffect(() => { if (isOwner) fetchData(); }, [isOwner, fetchData]);

  if (authLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!isOwner) return <Navigate to="/dashboard" replace />;

  const addRole = async () => {
    const input = newDiscordId.trim();
    if (!input) return toast.error("Enter a Discord ID or username");
    
    setAdding(true);
    let targetUserId: string | null = null;
    let identifier = input;

    // Try to find by Discord ID (numeric 17-19 digits)
    if (/^\d{17,19}$/.test(input)) {
      const { data: apps } = await rawSelect<{ user_id: string; discord: string }[]>(
        "applications", { discord: `eq.${input}`, select: "user_id,discord", limit: "1" }
      );
      const app = Array.isArray(apps) ? apps[0] : null;
      if (app) {
        targetUserId = app.user_id;
      } else {
        // Try profiles by username
        const { data: profs } = await rawSelect<{ user_id: string; username: string }[]>(
          "profiles", { username: `eq.${input}`, select: "user_id,username", limit: "1" }
        );
        const prof = Array.isArray(profs) ? profs[0] : null;
        if (prof) targetUserId = prof.user_id;
      }
    } else {
      // Try to find by username
      const { data: profs } = await rawSelect<{ user_id: string; username: string }[]>(
        "profiles", { username: `eq.${input}`, select: "user_id,username", limit: "1" }
      );
      const prof = Array.isArray(profs) ? profs[0] : null;
      if (prof) {
        targetUserId = prof.user_id;
        identifier = prof.username;
      }
    }

    if (!targetUserId) { 
      toast.error("No user found. They must login once to create a profile."); 
      setAdding(false); 
      return; 
    }
    
    const { error } = await rawInsert("user_roles", { user_id: targetUserId, role: newRole });
    if (error) { 
      toast.error(error.message.includes("duplicate") ? "User already has that role." : error.message); 
    } else {
      await rawInsert("admin_logs", { actor_user_id: user!.id, action: "add_role", target_id: targetUserId,
        details: { actor_name: actorName(), role: newRole, identifier } });
      toast.success(`${newRole} assigned to ${identifier}`);
      setNewDiscordId(""); fetchData(true);
    }
    setAdding(false);
  };

  const removeRole = async (r: RoleEntry) => {
    if (r.user_id === user!.id && r.role === "owner") return toast.error("Can't remove your own owner role.");
    const { error } = await rawDelete("user_roles", { id: `eq.${r.id}` });
    if (!error) {
      await rawInsert("admin_logs", { actor_user_id: user!.id, action: "remove_role", target_id: r.user_id,
        details: { actor_name: actorName(), role: r.role } });
      toast.success("Role removed."); fetchData(true);
    } else toast.error(error.message);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="font-heading text-4xl font-bold uppercase tracking-wider">
                Owner <span className="text-primary text-glow-red">Panel</span>
              </h1>
              <p className="text-muted-foreground mt-1">Manage admins, roles, and activity.</p>
            </div>
            <button onClick={() => fetchData(true)} disabled={refreshing}
              className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground transition-all disabled:opacity-50">
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Add Role */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-heading text-xl font-semibold uppercase tracking-wide mb-6 flex items-center gap-2">
                <Plus size={20} className="text-primary" /> Add Role
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 uppercase tracking-wide">Discord ID or Username</label>
                  <input type="text" value={newDiscordId} onChange={e => setNewDiscordId(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addRole()} placeholder="e.g. 123456789012345678 or username"
                    className="w-full bg-secondary border border-border rounded-md px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                  <p className="text-xs text-muted-foreground mt-1">User must login once to create their profile first.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 uppercase tracking-wide">Role</label>
                  <select value={newRole} onChange={e => setNewRole(e.target.value as AppRole)}
                    className="w-full bg-secondary border border-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all">
                    <option value="admin">Admin</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>
                {/* Role Permissions Info */}
                <div className="bg-secondary/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1 border border-border">
                  <p className="font-medium text-foreground flex items-center gap-1"><Shield size={12} className="text-primary"/> <strong>Admin:</strong></p>
                  <ul className="ml-4 list-disc space-y-0.5">
                    <li>Review whitelist applications</li>
                    <li>Accept/reject applicants</li>
                    <li>Add admin notes</li>
                    <li>Access Admin Dashboard</li>
                  </ul>
                  <p className="font-medium text-foreground flex items-center gap-1 mt-2"><Shield size={12} className="text-primary"/> <strong>Owner:</strong></p>
                  <ul className="ml-4 list-disc space-y-0.5">
                    <li>Everything Admin can do</li>
                    <li>Assign/remove roles</li>
                    <li>View activity logs</li>
                    <li>Full Owner Panel access</li>
                  </ul>
                </div>
                <button onClick={addRole} disabled={adding}
                  className="w-full gradient-red text-primary-foreground py-3 rounded-md font-heading uppercase tracking-wider text-sm hover:box-glow-red transition-all disabled:opacity-70 flex items-center justify-center gap-2">
                  {adding ? <Loader2 className="animate-spin" size={16} /> : <Shield size={16} />} Assign Role
                </button>
              </div>
            </div>

            {/* Current Roles */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-heading text-xl font-semibold uppercase tracking-wide mb-6 flex items-center gap-2">
                <UserCog size={20} className="text-primary" /> Current Roles
                {!loading && <span className="ml-auto text-xs text-muted-foreground font-normal normal-case">{roles.length} members</span>}
              </h2>
              {loading ? <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 size={14} className="animate-spin" /> Loading…</div>
               : roles.length === 0 ? <p className="text-muted-foreground text-sm">No roles assigned yet.</p>
               : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {roles.map(r => (
                    <div key={r.id} className="flex items-center justify-between bg-secondary rounded-lg px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-bold">
                          {r.displayName[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{r.displayName}</p>
                          <span className={`text-xs font-heading uppercase tracking-wide ${r.role === "owner" ? "text-primary" : r.role === "admin" ? "text-yellow-400" : "text-green-400"}`}>{r.role}</span>
                        </div>
                      </div>
                      <button onClick={() => removeRole(r)} title="Remove"
                        className="p-2 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all">
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
              <span className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full">{logs.length} entries</span>
            </div>
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-6"><Loader2 size={14} className="animate-spin" /> Loading activity…</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <Activity size={32} className="text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-muted-foreground text-sm">No activity recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[36rem] overflow-y-auto pr-1">
                {logs.map(log => {
                  const d = log.details as any;
                  const cfg = getActionCfg(log.action);
                  const IconComp = cfg.Icon;
                  const chips: { label: string; value: string }[] = [];
                  if (d?.new?.discord || d?.discord) chips.push({ label: "Discord", value: d?.new?.discord || d?.discord });
                  if (d?.new?.char_name) chips.push({ label: "Character", value: d.new.char_name });
                  if (d?.role) chips.push({ label: "Role", value: d.role });
                  if (d?.notes) chips.push({ label: "Note", value: String(d.notes).slice(0, 60) + (String(d.notes).length > 60 ? "…" : "") });
                  return (
                    <div key={log.id} className="flex items-start gap-3 rounded-xl border border-border/50 bg-secondary/50 px-4 py-3 hover:bg-secondary transition-colors">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
                        <IconComp size={14} className={cfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                          <span className="font-semibold text-sm text-foreground">{log.actorName}</span>
                          <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label(d)}</span>
                        </div>
                        {chips.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {chips.map(chip => (
                              <span key={chip.label} className="inline-flex items-center gap-1 text-xs bg-background border border-border rounded-md px-2 py-0.5 text-muted-foreground">
                                <span className="font-medium text-foreground/60">{chip.label}:</span> {chip.value}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 mt-0.5 tabular-nums">{fmtTs(log.created_at)}</span>
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
