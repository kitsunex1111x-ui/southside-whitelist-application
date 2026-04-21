import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { rawSelect, rawInsert, rawDelete, rawUpdate, rawRpc } from "@/integrations/supabase/client";
import { Shield, Trash2, Plus, Loader2, UserCog, Clock, RefreshCw,
  CheckCircle, XCircle, UserPlus, UserMinus, FileText, Activity,
  Check, X, MessageSquare, Copy, Settings, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
type Status  = Database["public"]["Enums"]["application_status"];
type Application = Database["public"]["Tables"]["applications"]["Row"];
type OwnerTab = "roles" | "staff" | "logs" | "settings";

interface RoleEntry { id: string; user_id: string; role: AppRole; displayName: string; }
interface LogEntry  { id: string; actor_user_id: string; action: string;
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
const getAct = (a: string) => ACTION_CONFIG[a] ?? {
  label: () => a.replace(/_/g, " "), color: "text-muted-foreground",
  bg: "bg-secondary border-border", Icon: Activity };
const fmtTs = (iso: string) => new Date(iso).toLocaleString(undefined,
  { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const StatusBadge = ({ status }: { status: string }) => {
  const c = status === "accepted" ? "text-green-400 bg-green-400/10 border-green-400/20"
    : status === "rejected" ? "text-red-400 bg-red-400/10 border-red-400/20"
    : "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
  return <span className={`px-3 py-1 rounded-full text-xs font-heading uppercase tracking-wide border ${c}`}>{status}</span>;
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-secondary/60 rounded-lg p-3">
    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
    <p className="text-sm leading-relaxed">{value || "—"}</p>
  </div>
);

const Skel = () => (
  <div className="bg-card border border-border rounded-xl p-5 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-secondary flex-shrink-0" />
      <div className="flex-1 space-y-2"><div className="h-4 bg-secondary rounded w-1/3" /><div className="h-3 bg-secondary rounded w-1/4" /></div>
    </div>
  </div>
);

const OwnerDashboard = () => {
  const { user, isOwner, loading: authLoading } = useAuth();
  const [tab, setTab]             = useState<OwnerTab>("roles");
  const [roles, setRoles]         = useState<RoleEntry[]>([]);
  const [logs, setLogs]           = useState<LogEntry[]>([]);
  const [staffApps, setStaffApps] = useState<Application[]>([]);
  const [newDiscordId, setNewDiscordId] = useState("");
  const [newRole, setNewRole]     = useState<AppRole>("admin");
  const [adding, setAdding]       = useState(false);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [staffFilter, setStaffFilter] = useState<Status | "all">("all");
  const [confirm, setConfirm]     = useState<{ id: string; status: Status } | null>(null);
  const [notesModal, setNotesModal] = useState<{ id: string; notes: string } | null>(null);
  const [wlEnabled, setWlEnabled]   = useState<boolean>(true);
  const [wlLoading, setWlLoading]   = useState(false);
  const [wlConfirm, setWlConfirm]   = useState(false);

  const me = () =>
    user!.user_metadata?.full_name || user!.user_metadata?.name ||
    user!.user_metadata?.user_name || user!.email || user!.id.slice(-8);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Load server settings
      const { data: settingsRaw } = await rawSelect<{ whitelist_enabled: boolean }[]>(
        "server_settings", { id: "eq.1", select: "whitelist_enabled" });
      const settingsRow = Array.isArray(settingsRaw) ? settingsRaw[0] : null;
      if (settingsRow != null) setWlEnabled(settingsRow.whitelist_enabled);
      // Roles
      const { data: rolesRaw } = await rawSelect<{ id: string; user_id: string; role: string; created_at: string }[]>(
        "user_roles", { select: "id,user_id,role,created_at", order: "created_at.desc" });
      const rr = rolesRaw ?? [];
      const uids = [...new Set(rr.map(r => r.user_id))];
      const pMap = new Map<string, string>();
      if (uids.length) {
        const { data: profs } = await rawSelect<{ user_id: string; username: string; display_name: string }[]>(
          "profiles", { user_id: `in.(${uids.join(",")})`, select: "user_id,username,display_name" });
        (profs ?? []).forEach(p => pMap.set(p.user_id, (p.display_name || p.username || "").trim()));
      }
      setRoles(rr.map(r => ({ ...r, role: r.role as AppRole, displayName: pMap.get(r.user_id) || `…${r.user_id.slice(-8)}` })));

      // Staff applications
      const staffParams: Record<string, string> = { select: "*", type: "eq.staff", order: "created_at.desc" };
      if (staffFilter !== "all") staffParams.status = `eq.${staffFilter}`;
      const { data: staffRaw } = await rawSelect<Application[]>("applications", staffParams);
      setStaffApps(staffRaw ?? []);

      // Logs
      const { data: logsRaw } = await rawSelect<{ id: string; actor_user_id: string; action: string;
        target_id: string | null; details: any; created_at: string }[]>(
        "admin_logs", { select: "id,actor_user_id,action,target_id,details,created_at", order: "created_at.desc", limit: "100" });
      if (logsRaw) {
        const aIds = [...new Set(logsRaw.map(l => l.actor_user_id).filter(Boolean))];
        const aMap = new Map<string, string>();
        if (aIds.length) {
          const { data: ap } = await rawSelect<{ user_id: string; username: string; display_name: string }[]>(
            "profiles", { user_id: `in.(${aIds.join(",")})`, select: "user_id,username,display_name" });
          (ap ?? []).forEach(p => { const n = (p.display_name || p.username || "").trim(); if (n) aMap.set(p.user_id, n); });
        }
        setLogs(logsRaw.map(l => {
          const d = l.details as any;
          const name = d?.actor_name?.trim() || aMap.get(l.actor_user_id)
            || (user?.id === l.actor_user_id ? me() : null)
            || `…${l.actor_user_id?.slice(-6) ?? "?"}`;
          return { ...l, actorName: name };
        }));
      }
    } catch { toast.error("Failed to load owner data."); }
    finally { setLoading(false); }
  }, [user, staffFilter]);

  useEffect(() => { if (isOwner) fetchData(); }, [isOwner, fetchData]);

  if (authLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!isOwner) return <Navigate to="/dashboard" replace />;

  /* ── role mutations ──────────────────────────────────────────── */
  const addRole = async () => {
    const did = newDiscordId.trim();
    if (!did) return toast.error("Enter a Discord ID");
    if (!/^\d{17,19}$/.test(did)) return toast.error("Discord ID must be 17–19 digits");
    setAdding(true);

    try {
      // Look up the user in auth.users by their Discord provider_id
      const { data: found, error: rpcErr } = await rawRpc<{ user_id: string; email: string; discord_name: string }[]>(
        "get_user_id_by_discord", { p_discord_id: did }
      );

      if (rpcErr) {
        toast.error("Lookup failed: " + rpcErr.message);
        setAdding(false);
        return;
      }

      const userRow = Array.isArray(found) ? found[0] : null;

      if (!userRow?.user_id) {
        toast.error("This Discord ID hasn't signed into the site yet. They need to log in at least once before you can assign a role.", { duration: 6000 });
        setAdding(false);
        return;
      }

      // Check if they already have this role
      const { data: existing } = await rawSelect<{ id: string }[]>(
        "user_roles",
        { user_id: `eq.${userRow.user_id}`, role: `eq.${newRole}`, select: "id" }
      );
      if (Array.isArray(existing) && existing.length > 0) {
        toast.error(`${userRow.discord_name || did} already has the ${newRole} role.`);
        setAdding(false);
        return;
      }

      const { error } = await rawInsert("user_roles", { user_id: userRow.user_id, role: newRole });
      if (error) {
        toast.error(error.message.includes("duplicate") ? "User already has that role." : error.message);
      } else {
        await rawInsert("admin_logs", {
          actor_user_id: user!.id, action: "add_role", target_id: userRow.user_id,
          details: { actor_name: me(), role: newRole, discord: did, discord_name: userRow.discord_name },
        });
        toast.success(`✓ ${newRole} role assigned to ${userRow.discord_name || did}`, { duration: 5000 });
        setNewDiscordId("");
        fetchData(true);
      }
    } catch (e: any) {
      toast.error("Unexpected error: " + e.message);
    }
    setAdding(false);
  };

  const removeRole = async (r: RoleEntry) => {
    if (r.user_id === user!.id && r.role === "owner") return toast.error("Can't remove your own owner role.");
    const { error } = await rawDelete("user_roles", { id: `eq.${r.id}` });
    if (!error) {
      await rawInsert("admin_logs", { actor_user_id: user!.id, action: "remove_role", target_id: r.user_id,
        details: { actor_name: me(), role: r.role } });
      toast.success("Role removed."); fetchData(true);
    } else toast.error(error.message);
  };

  /* ── staff app mutations ─────────────────────────────────────── */
  const updateStaff = async (id: string, status: Status) => {
    setSaving(true); setConfirm(null);
    try {
      const { error } = await rawUpdate("applications", { id: `eq.${id}` },
        { status, updated_at: new Date().toISOString() });
      if (error) { toast.error(`Failed: ${error.message}`); return; }
      await rawInsert("admin_logs", { actor_user_id: user!.id,
        action: status === "accepted" ? "accept_application" : "reject_application",
        target_id: id, details: { actor_name: me(), status, application_id: id, type: "staff" } });
      toast.success(`Staff application ${status}!`); fetchData(true);
    } catch { toast.error("Unexpected error."); }
    finally { setSaving(false); }
  };

  const toggleWhitelist = async () => {
    setWlLoading(true); setWlConfirm(false);
    const newVal = !wlEnabled;
    const { error } = await rawUpdate(
      "server_settings", { id: "eq.1" },
      { whitelist_enabled: newVal, updated_at: new Date().toISOString(), updated_by: user!.id }
    );
    if (error) {
      toast.error("Failed to update setting: " + error.message);
    } else {
      setWlEnabled(newVal);
      await rawInsert("admin_logs", {
        actor_user_id: user!.id, action: "toggle_whitelist",
        details: { actor_name: me(), whitelist_enabled: newVal }
      });
      toast.success(newVal ? "✓ Whitelist applications enabled" : "✓ Whitelist applications disabled — Gang & Staff now open", { duration: 5000 });
    }
    setWlLoading(false);
  };

  const saveNotes = async () => {
    if (!notesModal) return;
    setSaving(true);
    try {
      const { error } = await rawUpdate("applications", { id: `eq.${notesModal.id}` },
        { admin_notes: notesModal.notes, updated_at: new Date().toISOString() });
      if (error) { toast.error(`Failed: ${error.message}`); return; }
      toast.success("Notes saved!"); setNotesModal(null); fetchData(true);
    } catch { toast.error("Unexpected error."); }
    finally { setSaving(false); }
  };

  const staffStats = {
    total: staffApps.length,
    pending: staffApps.filter(a => a.status === "pending").length,
    accepted: staffApps.filter(a => a.status === "accepted").length,
    rejected: staffApps.filter(a => a.status === "rejected").length,
  };

  const TABS: { key: OwnerTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "roles",    label: "Roles",             icon: <UserCog size={15} /> },
    { key: "staff",    label: "Staff Apps",         icon: <Shield size={15} />, badge: staffStats.pending },
    { key: "logs",     label: "Activity",           icon: <Clock size={15} /> },
    { key: "settings", label: "Settings",           icon: <Settings size={15} /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">

          {/* header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-heading text-4xl font-bold uppercase tracking-wider">
                Owner <span className="text-primary text-glow-red">Panel</span>
              </h1>
              <p className="text-muted-foreground mt-1">Manage staff, roles, and activity.</p>
            </div>
            <button onClick={() => fetchData()} disabled={loading}
              className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground transition-all disabled:opacity-50">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>

          {/* tabs */}
          <div className="flex gap-1 mb-8 p-1 bg-secondary rounded-xl w-fit">
            {TABS.map(t => (
              <button key={t.key} onClick={() => { setTab(t.key); setExpanded(null); }}
                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg font-heading text-sm uppercase tracking-wider transition-all ${
                  tab === t.key ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"}`}>
                {t.icon} {t.label}
                {t.badge != null && t.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── ROLES tab ─────────────────────────────────────────── */}
          {tab === "roles" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Add Role */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="font-heading text-xl font-semibold uppercase tracking-wide mb-6 flex items-center gap-2">
                  <Plus size={20} className="text-primary" /> Add Role
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 uppercase tracking-wide">Discord ID</label>
                    <input type="text" value={newDiscordId} onChange={e => setNewDiscordId(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addRole()} placeholder="e.g. 123456789012345678"
                      className="w-full bg-secondary border border-border rounded-md px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 uppercase tracking-wide">Role</label>
                    <select value={newRole} onChange={e => setNewRole(e.target.value as AppRole)}
                      className="w-full bg-secondary border border-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all">
                      <option value="admin">Admin</option>
                      <option value="owner">Owner</option>
                    </select>
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
                 : roles.length === 0 ? <p className="text-muted-foreground text-sm">No roles assigned.</p>
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
          )}

          {/* ── STAFF APPLICATIONS tab ───────────────────────────── */}
          {tab === "staff" && (
            <div>
              {/* stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[["Total", staffStats.total, ""], ["Pending", staffStats.pending, "text-yellow-400"],
                  ["Accepted", staffStats.accepted, "text-green-400"], ["Rejected", staffStats.rejected, "text-red-400"]]
                  .map(([l, v, c]) => (
                    <div key={l as string} className="bg-card border border-border rounded-xl p-5 text-center">
                      <p className={`font-heading text-3xl font-bold ${c || "text-foreground"}`}>{v as number}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">{l}</p>
                    </div>
                  ))}
              </div>

              {/* filter */}
              <div className="flex items-center gap-2 mb-6 flex-wrap">
                {(["all", "pending", "accepted", "rejected"] as const).map(f => (
                  <button key={f} onClick={() => setStaffFilter(f)}
                    className={`px-4 py-1.5 rounded-md font-heading text-xs uppercase tracking-wider transition-all ${
                      staffFilter === f ? "gradient-red text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                    {f}
                  </button>
                ))}
              </div>

              {loading ? <div className="space-y-3"><Skel /><Skel /><Skel /></div>
               : staffApps.length === 0 ? (
                <div className="text-center py-20">
                  <Shield size={40} className="text-muted-foreground mx-auto mb-3 opacity-30" />
                  <p className="text-muted-foreground">No staff applications{staffFilter !== "all" ? ` with status "${staffFilter}"` : ""}.</p>
                </div>
               ) : (
                <div className="space-y-3">
                  {staffApps.map(app => {
                    const isOpen = expanded === app.id;
                    return (
                      <div key={app.id} className="bg-card border border-border rounded-xl overflow-hidden">
                        {/* collapsed row */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 cursor-pointer"
                          onClick={() => setExpanded(isOpen ? null : app.id)}>
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center font-heading text-base font-bold text-white flex-shrink-0">
                              {app.real_name?.[0]?.toUpperCase() ?? "?"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-heading font-semibold text-base leading-tight">{app.real_name || "—"}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <p className="text-sm text-muted-foreground truncate">{app.discord}</p>
                                <button onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(app.discord ?? ""); toast.success("Copied!"); }}
                                  className="p-1 rounded text-muted-foreground hover:text-primary transition-colors flex-shrink-0">
                                  <Copy size={12} />
                                </button>
                                <span className="text-xs text-muted-foreground">· {app.age}y</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <StatusBadge status={app.status} />
                            <span className="text-xs text-muted-foreground">{new Date(app.created_at).toLocaleDateString()}</span>
                            <div className="ml-2 flex gap-1" onClick={e => e.stopPropagation()}>
                              <button onClick={() => setConfirm({ id: app.id, status: "accepted" })}
                                disabled={saving || app.status === "accepted"}
                                className="p-2 rounded-md bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all disabled:opacity-30" title="Accept">
                                <Check size={16} />
                              </button>
                              <button onClick={() => setConfirm({ id: app.id, status: "rejected" })}
                                disabled={saving || app.status === "rejected"}
                                className="p-2 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-30" title="Reject">
                                <X size={16} />
                              </button>
                              <button onClick={() => setNotesModal({ id: app.id, notes: app.admin_notes ?? "" })}
                                className="p-2 rounded-md bg-secondary text-muted-foreground hover:text-foreground transition-all" title="Notes">
                                <MessageSquare size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                        {/* expanded */}
                        {isOpen && (
                          <div className="border-t border-border px-5 pb-5 pt-4 space-y-3 animate-in fade-in duration-150">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <Field label="Position Applying"   value={
                                app.rdm === "support" ? "Support Staff"
                                : app.rdm === "trial" ? "Trial Staff"
                                : app.rdm === "whitelister" ? "Whitelister"
                                : app.rdm === "administrator" ? "Administrator"
                                : app.rdm === "headadmin" ? "Head Admin"
                                : app.rdm ?? ""} />
                              <Field label="Timezone"           value={app.vdm ?? ""} />
                              <Field label="Weekly Availability" value={app.metagaming ?? ""} />
                              <Field label="Staff Experience"   value={app.powergaming ?? ""} />
                            </div>
                            <Field label="Strengths"         value={app.char_name ?? ""} />
                            <Field label="Why They Want Staff" value={app.backstory ?? ""} />
                            <Field label="Scenario Answers"  value={app.traits ?? ""} />
                            {app.admin_notes && (
                              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                                <p className="text-xs text-primary uppercase tracking-wide mb-1 font-medium">Owner Note</p>
                                <p className="text-sm text-muted-foreground">{app.admin_notes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── ACTIVITY LOG tab ─────────────────────────────────── */}
          {tab === "logs" && (
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-xl font-semibold uppercase tracking-wide flex items-center gap-2">
                  <Clock size={20} className="text-primary" /> Activity Log
                </h2>
                <span className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full">{logs.length} entries</span>
              </div>
              {loading ? <div className="flex items-center gap-2 text-muted-foreground text-sm py-6"><Loader2 size={14} className="animate-spin" /> Loading…</div>
               : logs.length === 0 ? (
                <div className="text-center py-12">
                  <Activity size={32} className="text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-muted-foreground text-sm">No activity recorded yet.</p>
                </div>
               ) : (
                <div className="space-y-2 max-h-[40rem] overflow-y-auto pr-1">
                  {logs.map(log => {
                    const d = log.details as any; const cfg = getAct(log.action); const Ic = cfg.Icon;
                    const chips: { label: string; value: string }[] = [];
                    if (d?.new?.discord || d?.discord) chips.push({ label: "Discord", value: d?.new?.discord || d?.discord });
                    if (d?.new?.char_name) chips.push({ label: "Character", value: d.new.char_name });
                    if (d?.role) chips.push({ label: "Role", value: d.role });
                    if (d?.type) chips.push({ label: "Type", value: d.type });
                    if (d?.notes) chips.push({ label: "Note", value: String(d.notes).slice(0, 60) + (String(d.notes).length > 60 ? "…" : "") });
                    return (
                      <div key={log.id} className="flex items-start gap-3 rounded-xl border border-border/50 bg-secondary/50 px-4 py-3 hover:bg-secondary transition-colors">
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
                          <Ic size={14} className={cfg.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-baseline gap-x-1.5">
                            <span className="font-semibold text-sm">{log.actorName}</span>
                            <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label(d)}</span>
                          </div>
                          {chips.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {chips.map(c => (
                                <span key={c.label} className="inline-flex items-center gap-1 text-xs bg-background border border-border rounded-md px-2 py-0.5 text-muted-foreground">
                                  <span className="font-medium text-foreground/60">{c.label}:</span> {c.value}
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
          )}

          {/* ── SETTINGS tab ─────────────────────────────────────── */}
          {tab === "settings" && (
            <div className="space-y-6 max-w-2xl">
              <h2 className="font-heading text-xl font-semibold uppercase tracking-wide flex items-center gap-2">
                <Settings size={20} className="text-primary" /> Server Settings
              </h2>

              {/* Whitelist toggle card */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-heading text-lg font-semibold uppercase tracking-wide">Whitelist Applications</h3>
                      <span className={`text-[11px] font-heading uppercase tracking-widest px-2.5 py-1 rounded-full border font-bold ${
                        wlEnabled
                          ? "bg-green-500/10 text-green-400 border-green-500/30"
                          : "bg-red-500/10 text-red-400 border-red-500/30"}`}>
                        {wlEnabled ? "ENABLED" : "DISABLED"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {wlEnabled
                        ? "Users can submit whitelist applications. Gang & Staff apps are locked until accepted."
                        : "Whitelist is invite-only (interview mode). Gang & Staff applications are open to all users."}
                    </p>
                    {!wlEnabled && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-primary bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
                        Gang &amp; Staff applications are currently unlocked for all whitelisted users
                      </div>
                    )}
                  </div>

                  {/* toggle button */}
                  <button
                    onClick={() => setWlConfirm(true)}
                    disabled={wlLoading}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-heading text-sm uppercase tracking-wider transition-all disabled:opacity-50 flex-shrink-0 ${
                      wlEnabled
                        ? "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20"
                        : "bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20"}`}>
                    {wlLoading ? <Loader2 size={16} className="animate-spin" />
                      : wlEnabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    {wlEnabled ? "Disable Whitelist" : "Enable Whitelist"}
                  </button>
                </div>

                {/* visual state diagram */}
                <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: "Whitelist Form", active: wlEnabled,  icon: "📋" },
                    { label: "Gang Apps",      active: !wlEnabled || false, icon: "👥" },
                    { label: "Staff Apps",     active: true,        icon: "🛡️" },
                  ].map(item => (
                    <div key={item.label} className={`rounded-lg p-3 border transition-all ${
                      item.active ? "border-green-500/30 bg-green-500/5" : "border-border bg-secondary/50 opacity-50"}`}>
                      <div className="text-xl mb-1">{item.icon}</div>
                      <p className="text-xs font-medium">{item.label}</p>
                      <p className={`text-[10px] font-heading uppercase tracking-wide mt-0.5 ${item.active ? "text-green-400" : "text-muted-foreground"}`}>
                        {item.active ? "Open" : "Locked"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">Changes take effect immediately for all users.</p>
            </div>
          )}

        </div>
      </div>

      {/* whitelist toggle confirmation */}
      {wlConfirm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md">
            <h3 className="font-heading text-xl font-semibold uppercase tracking-wide mb-3">
              {wlEnabled ? "Disable Whitelist Applications?" : "Enable Whitelist Applications?"}
            </h3>
            <p className="text-muted-foreground text-sm mb-2">
              {wlEnabled
                ? "This will hide the whitelist form for all users. The Apply page will only show Gang & Staff applications. Users won't need to be whitelisted first."
                : "This will restore the whitelist application form. Users must apply and get accepted before Gang & Staff apps unlock."}
            </p>
            <p className="text-xs text-muted-foreground mb-6 italic">Changes apply instantly site-wide.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setWlConfirm(false)} className="px-4 py-2 rounded-md bg-secondary text-muted-foreground hover:text-foreground font-heading text-sm uppercase">Cancel</button>
              <button onClick={toggleWhitelist}
                className={`flex items-center gap-2 px-6 py-2 rounded-md font-heading text-sm uppercase text-white ${wlEnabled ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}>
                {wlEnabled ? "Yes, Disable" : "Yes, Enable"}
              </button>
            </div>
          </div>
        </div>
      )}
      {confirm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-heading text-xl font-semibold uppercase tracking-wide mb-3">
              Confirm {confirm.status === "accepted" ? "Accept" : "Reject"}
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              Are you sure you want to <span className={confirm.status === "accepted" ? "text-green-400 font-semibold" : "text-red-400 font-semibold"}>{confirm.status}</span> this staff application?
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirm(null)} className="px-4 py-2 rounded-md bg-secondary text-muted-foreground hover:text-foreground font-heading text-sm uppercase">Cancel</button>
              <button onClick={() => updateStaff(confirm.id, confirm.status)} disabled={saving}
                className={`flex items-center gap-2 px-6 py-2 rounded-md font-heading text-sm uppercase disabled:opacity-70 text-white ${confirm.status === "accepted" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}>
                {saving && <Loader2 className="animate-spin" size={16} />}
                {confirm.status === "accepted" ? "Accept" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* notes modal */}
      {notesModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md">
            <h3 className="font-heading text-xl font-semibold uppercase tracking-wide mb-4">Owner Notes</h3>
            <textarea value={notesModal.notes} onChange={e => setNotesModal({ ...notesModal, notes: e.target.value })}
              rows={4} placeholder="Add notes visible to the applicant..."
              className="w-full bg-secondary border border-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none mb-4" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setNotesModal(null)} className="px-4 py-2 rounded-md bg-secondary text-muted-foreground hover:text-foreground font-heading text-sm uppercase">Cancel</button>
              <button onClick={saveNotes} disabled={saving}
                className="flex items-center gap-2 gradient-red text-primary-foreground px-6 py-2 rounded-md font-heading text-sm uppercase hover:box-glow-red transition-all disabled:opacity-70">
                {saving && <Loader2 className="animate-spin" size={16} />} Save
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default OwnerDashboard;
