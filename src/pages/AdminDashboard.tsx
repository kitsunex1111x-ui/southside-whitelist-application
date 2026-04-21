import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { rawSelect, rawInsert, rawUpdate } from "@/integrations/supabase/client";
import { Check, X, MessageSquare, Loader2, Copy, RefreshCw, FileText, Users } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Application = Database["public"]["Tables"]["applications"]["Row"];
type Status = Database["public"]["Enums"]["application_status"];
type TypeTab = "whitelist" | "gang";
type StatusFilter = Status | "all";

/* ── tiny sub-components ──────────────────────────────────────────── */
const StatCard = ({ label, value, color }: { label: string; value: number; color?: string }) => (
  <div className="bg-card border border-border rounded-xl p-5 text-center">
    <p className={`font-heading text-3xl font-bold ${color ?? "text-foreground"}`}>{value}</p>
    <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">{label}</p>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const c = status === "accepted" ? "text-green-400 bg-green-400/10 border-green-400/20"
    : status === "rejected" ? "text-red-400 bg-red-400/10 border-red-400/20"
    : "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
  return <span className={`px-3 py-1 rounded-full text-xs font-heading uppercase tracking-wide border ${c}`}>{status}</span>;
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-secondary rounded-lg p-3">
    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
    <p className="text-sm leading-relaxed">{value || "—"}</p>
  </div>
);

const Skeleton = () => (
  <div className="bg-card border border-border rounded-xl p-6 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-secondary flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-secondary rounded w-1/4" />
        <div className="h-3 bg-secondary rounded w-1/3" />
      </div>
      <div className="h-8 w-24 bg-secondary rounded-full" />
    </div>
  </div>
);

/* ── main component ───────────────────────────────────────────────── */
const AdminDashboard = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [apps, setApps]           = useState<Application[]>([]);
  const [loading, setLoading]     = useState(true);
  const [typeTab, setTypeTab]     = useState<TypeTab>("whitelist");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [saving, setSaving]       = useState(false);
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [notesModal, setNotesModal]   = useState<{ id: string; notes: string } | null>(null);
  const [confirm, setConfirm]     = useState<{ id: string; status: Status } | null>(null);

  const fetchApps = useCallback(async () => {
    if (!user || !isAdmin) { setApps([]); setLoading(false); return; }
    setLoading(true);
    // Only fetch whitelist + gang — staff goes to Owner Panel
    const params: Record<string, string> = {
      select: "*",
      order: "created_at.desc",
      type: `eq.${typeTab}`,
    };
    if (statusFilter !== "all") params.status = `eq.${statusFilter}`;
    const { data, error } = await rawSelect<Application[]>("applications", params);
    if (error) { toast.error("Failed to load applications."); setApps([]); }
    else setApps(data ?? []);
    setLoading(false);
  }, [user, isAdmin, typeTab, statusFilter]);

  useEffect(() => { if (isAdmin) fetchApps(); }, [isAdmin, fetchApps]);

  if (authLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const actorName = () =>
    user!.user_metadata?.full_name || user!.user_metadata?.name ||
    user!.user_metadata?.user_name || user!.email || user!.id.slice(-8);

  /* ── mutations ─────────────────────────────────────────────────── */
  const updateStatus = async (id: string, status: Status) => {
    setSaving(true); setConfirm(null);
    try {
      const { error } = await rawUpdate("applications", { id: `eq.${id}` },
        { status, updated_at: new Date().toISOString() });
      if (error) { toast.error(`Failed: ${error.message}`); return; }

      const { data: arr } = await rawSelect<{ user_id: string; discord: string; char_name: string }[]>(
        "applications", { id: `eq.${id}`, select: "user_id,discord,char_name" });
      const app = Array.isArray(arr) ? arr[0] : null;

      if (status === "accepted" && app?.user_id) {
        const { data: ex } = await rawSelect<{ role: string }[]>(
          "user_roles", { user_id: `eq.${app.user_id}`, role: "eq.accepted", select: "role" });
        if (!Array.isArray(ex) || ex.length === 0)
          await rawInsert("user_roles", { user_id: app.user_id, role: "accepted" });
      }
      await rawInsert("admin_logs", {
        actor_user_id: user!.id,
        action: status === "accepted" ? "accept_application" : "reject_application",
        target_id: id,
        details: { actor_name: actorName(), status, application_id: id,
          new: { status, discord: app?.discord ?? "Unknown", char_name: app?.char_name ?? null } },
      });
      toast.success(`Application ${status}!`); fetchApps();
    } catch { toast.error("Unexpected error."); }
    finally { setSaving(false); }
  };

  const saveNotes = async () => {
    if (!notesModal) return;
    setSaving(true);
    try {
      const { error } = await rawUpdate("applications", { id: `eq.${notesModal.id}` },
        { admin_notes: notesModal.notes, updated_at: new Date().toISOString() });
      if (error) { toast.error(`Failed: ${error.message}`); return; }
      await rawInsert("admin_logs", { actor_user_id: user!.id, action: "add_notes",
        target_id: notesModal.id, details: { actor_name: actorName(), notes: notesModal.notes } });
      toast.success("Notes saved!"); setNotesModal(null); fetchApps();
    } catch { toast.error("Unexpected error."); }
    finally { setSaving(false); }
  };

  const stats = {
    total:    apps.length,
    pending:  apps.filter(a => a.status === "pending").length,
    accepted: apps.filter(a => a.status === "accepted").length,
    rejected: apps.filter(a => a.status === "rejected").length,
  };

  /* ── render ────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">

          {/* header */}
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-heading text-4xl font-bold uppercase tracking-wider">
              Admin <span className="text-primary text-glow-red">Panel</span>
            </h1>
            <button onClick={fetchApps} disabled={loading}
              className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground transition-all disabled:opacity-50">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
          <p className="text-muted-foreground mb-8">Review whitelist and gang applications.</p>

          {/* type tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-secondary rounded-xl w-fit">
            {([
              { key: "whitelist", label: "Whitelist", icon: <FileText size={15} /> },
              { key: "gang",      label: "Gang",      icon: <Users size={15} /> },
            ] as const).map(t => (
              <button key={t.key} onClick={() => { setTypeTab(t.key); setStatusFilter("all"); setExpanded(null); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-heading text-sm uppercase tracking-wider transition-all ${
                  typeTab === t.key
                    ? "bg-card text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total"    value={stats.total} />
            <StatCard label="Pending"  value={stats.pending}  color="text-yellow-400" />
            <StatCard label="Accepted" value={stats.accepted} color="text-green-400" />
            <StatCard label="Rejected" value={stats.rejected} color="text-red-400" />
          </div>

          {/* status filter */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {(["all", "pending", "accepted", "rejected"] as const).map(f => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={`px-4 py-1.5 rounded-md font-heading text-xs uppercase tracking-wider transition-all ${
                  statusFilter === f ? "gradient-red text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                {f}
              </button>
            ))}
          </div>

          {/* list */}
          {loading ? (
            <div className="space-y-4"><Skeleton /><Skeleton /><Skeleton /></div>
          ) : apps.length === 0 ? (
            <div className="text-center py-20">
              {typeTab === "whitelist"
                ? <FileText size={40} className="text-muted-foreground mx-auto mb-3 opacity-30" />
                : <Users size={40} className="text-muted-foreground mx-auto mb-3 opacity-30" />}
              <p className="text-muted-foreground">No {typeTab} applications{statusFilter !== "all" ? ` with status "${statusFilter}"` : ""}.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {apps.map(app => {
                const isOpen = expanded === app.id;
                return (
                  <div key={app.id} className="bg-card border border-border rounded-xl overflow-hidden transition-all">
                    {/* collapsed row */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 cursor-pointer"
                      onClick={() => setExpanded(isOpen ? null : app.id)}>
                      <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center font-heading text-base font-bold text-white flex-shrink-0 ${
                          typeTab === "gang" ? "bg-gradient-to-br from-red-600 to-red-800" : "gradient-red"}`}>
                          {app.char_name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-heading font-semibold text-base leading-tight">{app.char_name || "—"}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <p className="text-sm text-muted-foreground truncate">{app.discord}</p>
                            <button onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(app.discord ?? ""); toast.success("Copied!"); }}
                              className="p-1 rounded text-muted-foreground hover:text-primary transition-colors flex-shrink-0">
                              <Copy size={12} />
                            </button>
                            <span className="text-muted-foreground text-xs">· {app.age}y</span>
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

                    {/* expanded detail */}
                    {isOpen && (
                      <div className="border-t border-border px-5 pb-5 pt-4 space-y-4 animate-in fade-in duration-150">
                        {typeTab === "whitelist" ? (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <Field label="RDM"         value={app.rdm ?? ""} />
                              <Field label="VDM"         value={app.vdm ?? ""} />
                              <Field label="MetaGaming"  value={app.metagaming ?? ""} />
                              <Field label="PowerGaming" value={app.powergaming ?? ""} />
                            </div>
                            <Field label="Backstory" value={app.backstory ?? ""} />
                            <Field label="Character Traits" value={app.traits ?? ""} />
                          </>
                        ) : (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <Field label="Gang Type"        value={app.rdm ?? ""} />
                              <Field label="Territory"        value={app.vdm ?? ""} />
                              <Field label="Rules Understanding" value={app.metagaming ?? ""} />
                              <Field label="RP Experience"    value={app.powergaming ?? ""} />
                            </div>
                            <Field label="Members" value={app.char_name ?? ""} />
                            <Field label="Gang Backstory" value={app.backstory ?? ""} />
                            <Field label="Why Accept" value={app.traits ?? ""} />
                          </>
                        )}
                        {app.admin_notes && (
                          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                            <p className="text-xs text-primary uppercase tracking-wide mb-1 font-medium">Admin Note</p>
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
      </div>

      {/* confirm modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-heading text-xl font-semibold uppercase tracking-wide mb-3">
              Confirm {confirm.status === "accepted" ? "Accept" : "Reject"}
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              Are you sure you want to <span className={confirm.status === "accepted" ? "text-green-400 font-semibold" : "text-red-400 font-semibold"}>{confirm.status}</span> this application?
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirm(null)} className="px-4 py-2 rounded-md bg-secondary text-muted-foreground hover:text-foreground font-heading text-sm uppercase">Cancel</button>
              <button onClick={() => updateStatus(confirm.id, confirm.status)} disabled={saving}
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
            <h3 className="font-heading text-xl font-semibold uppercase tracking-wide mb-4">Admin Notes</h3>
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

export default AdminDashboard;
