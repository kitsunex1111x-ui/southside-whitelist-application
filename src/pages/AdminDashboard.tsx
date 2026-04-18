import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, MessageSquare, Filter, Loader2, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Application = Database["public"]["Tables"]["applications"]["Row"];
type Status = Database["public"]["Enums"]["application_status"];

const AdminDashboard = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [notesModal, setNotesModal] = useState<{ id: string; notes: string } | null>(null);
  const [saving, setSaving] = useState(false);
  // Tracks which app ID is being confirmed for accept/reject
  const [confirmAction, setConfirmAction] = useState<{ id: string; status: Status } | null>(null);

  const fetchApps = useCallback(async () => {
    if (!user || !isAdmin) { setApps([]); setLoading(false); return; }
    setLoading(true);

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        let q = supabase
          .from("applications")
          .select("*")
          .order("created_at", { ascending: false });
        if (filter !== "all") q = q.eq("status", filter);

        const { data, error } = await q;

        if (!error) {
          setApps(data ?? []);
          setLoading(false);
          return;
        }

        if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 1000));
      } catch {
        if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 1000));
      }
    }

    toast.error("Failed to load applications. Please refresh.");
    setApps([]);
    setLoading(false);
  }, [user, isAdmin, filter]);

  useEffect(() => {
    if (isAdmin) fetchApps();
  }, [isAdmin, filter, fetchApps]);

  // Show spinner instead of null to avoid black flash
  if (authLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const updateStatus = async (id: string, status: Status) => {
    setSaving(true);
    setConfirmAction(null);

    try {
      const { error } = await supabase
        .from("applications")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        toast.error(`Failed to update: ${error.message}`);
      } else {
        // Fetch application data to get user_id and display name
        const { data: appData } = await supabase
          .from("applications")
          .select("user_id, discord, char_name")
          .eq("id", id)
          .single();
        
        // If application was accepted, assign 'accepted' role and sync Discord
        if (status === "accepted" && appData?.user_id) {
          // Check if user already has 'accepted' role
          const { data: existingRoles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", appData.user_id)
            .eq("role", "accepted");
          
          // Sync Discord role
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              const { error: syncError } = await supabase.functions.invoke(
                "sync-discord-roles",
                {
                  method: 'POST',
                  body: { userId: appData.user_id, action: 'accepted' },
                }
              );
              if (syncError) toast.error("Discord sync failed: " + syncError.message);
            }
          } catch {
            // Discord sync failed silently — main operation succeeded
          }
          
          // Only assign role in database if they don't already have it
          if (!existingRoles || existingRoles.length === 0) {
            const { error: roleError } = await supabase
              .from("user_roles")
              .insert({ user_id: appData.user_id, role: "accepted" });
            if (roleError) {
              toast.error("Application accepted but failed to assign role");
            }
          }
        }

        // If application was rejected, sync Discord role in one call
        if (status === "rejected" && appData?.user_id) {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              const { error: syncError } = await supabase.functions.invoke(
                "sync-discord-roles",
                { method: 'POST', body: { userId: appData.user_id, action: 'rejected' } }
              );
              if (syncError) toast.error("Discord sync failed: " + syncError.message);
            }
          } catch {
            // Discord sync failed silently — main operation succeeded
          }
        }
        
        // Add to admin logs — include actor_name so OwnerDashboard can display it
        const actorName =
          user.user_metadata?.full_name ||
          user.user_metadata?.user_name ||
          user.email ||
          user.id.slice(-8);
        await supabase.from("admin_logs").insert({
          actor_user_id: user.id,
          action: status === "accepted" ? "accept_application" : "reject_application",
          target_id: id,
          details: {
            actor_name: actorName,
            status,
            application_id: id,
            new: {
              status,
              discord: appData?.discord || "Unknown User",
              char_name: appData?.char_name || null,
            },
          },
        });
        
        toast.success(`Application ${status} successfully!`);
        fetchApps();
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    if (!notesModal) return;
    setSaving(true);
    
    try {
      if (!user || !isAdmin) {
        toast.error("Admin access required");
        setSaving(false);
        return;
      }
      
      const { error } = await supabase
        .from("applications")
        .update({ 
          admin_notes: notesModal.notes,
          updated_at: new Date().toISOString()
        })
        .eq("id", notesModal.id);

      if (error) {
        toast.error(`Failed to save notes: ${error.message}`);
      } else {
        // Add to admin logs — include actor_name so OwnerDashboard can display it
        const actorNameForNotes =
          user.user_metadata?.full_name ||
          user.user_metadata?.user_name ||
          user.email ||
          user.id.slice(-8);
        await supabase.from("admin_logs").insert({
          actor_user_id: user.id,
          action: "add_notes",
          target_id: notesModal.id,
          details: {
            actor_name: actorNameForNotes,
            notes: notesModal.notes,
            application_id: notesModal.id,
          },
        });
        
        toast.success("Notes saved successfully!");
        setNotesModal(null);
        fetchApps();
      }
    } catch (err) {
      toast.error("An unexpected error occurred while saving notes");
    } finally {
      setSaving(false);
    }
  };

  const stats = {
    total: apps.length,
    accepted: apps.filter((a) => a.status === "accepted").length,
    pending: apps.filter((a) => a.status === "pending").length,
    rejected: apps.filter((a) => a.status === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-heading text-4xl font-bold uppercase tracking-wider">
              Admin <span className="text-primary text-glow-red">Panel</span>
            </h1>
            <button
              onClick={() => fetchApps()}
              disabled={loading}
              className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
          <p className="text-muted-foreground mb-8">Manage whitelist applications.</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total" value={stats.total} />
            <StatCard label="Pending" value={stats.pending} color="text-yellow-400" />
            <StatCard label="Accepted" value={stats.accepted} color="text-green-400" />
            <StatCard label="Rejected" value={stats.rejected} color="text-red-400" />
          </div>

          <div className="flex items-center gap-2 mb-6">
            <Filter size={16} className="text-muted-foreground" />
            {(["all", "pending", "accepted", "rejected"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-md font-heading text-xs uppercase tracking-wider transition-all ${
                  filter === f ? "gradient-red text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-secondary" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-secondary rounded w-1/4" />
                      <div className="h-3 bg-secondary rounded w-1/3" />
                    </div>
                    <div className="h-8 w-24 bg-secondary rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : apps.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">No applications found.</div>
          ) : (
            <div className="space-y-4">
              {apps.map((app) => (
                <div key={app.id} className="bg-card border border-border rounded-xl p-6 animate-fade-in">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full gradient-red flex items-center justify-center font-heading text-lg font-bold text-primary-foreground flex-shrink-0">
                        {app.char_name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-heading text-lg font-semibold">{app.char_name}</h3>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground">{app.discord} · {app.age}y</p>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(app.discord);
                              toast.success("Discord copied!");
                            }}
                            className="p-1 rounded text-muted-foreground hover:text-primary transition-colors"
                            title="Copy Discord"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={app.status} />
                      <button
                        onClick={() => setConfirmAction({ id: app.id, status: "accepted" })}
                        disabled={saving || app.status === "accepted"}
                        className="p-2 rounded-md bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all disabled:opacity-30"
                        title="Accept application"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => setConfirmAction({ id: app.id, status: "rejected" })}
                        disabled={saving || app.status === "rejected"}
                        className="p-2 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-30"
                        title="Reject application"
                      >
                        <X size={18} />
                      </button>
                      <button
                        onClick={() => setNotesModal({ id: app.id, notes: app.admin_notes ?? "" })}
                        className="p-2 rounded-md bg-secondary text-muted-foreground hover:text-foreground transition-all"
                        title="Add notes"
                      >
                        <MessageSquare size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <RPAnswer label="RDM" value={app.rdm} />
                    <RPAnswer label="VDM" value={app.vdm} />
                    <RPAnswer label="MetaGaming" value={app.metagaming} />
                    <RPAnswer label="PowerGaming" value={app.powergaming} />
                  </div>

                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Backstory</p>
                    <p className="text-sm text-muted-foreground">{app.backstory}</p>
                  </div>

                  {app.admin_notes && (
                    <div className="mt-3 p-3 bg-secondary rounded-lg text-sm">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Notes: </span>
                      {app.admin_notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirm accept/reject dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-heading text-xl font-semibold uppercase tracking-wide mb-3">
              Confirm {confirmAction.status === "accepted" ? "Accept" : "Reject"}
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              Are you sure you want to{" "}
              <span className={confirmAction.status === "accepted" ? "text-green-400 font-semibold" : "text-red-400 font-semibold"}>
                {confirmAction.status === "accepted" ? "accept" : "reject"}
              </span>{" "}
              this application? This will update the applicant's status.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-md bg-secondary text-muted-foreground hover:text-foreground font-heading text-sm uppercase tracking-wide"
              >
                Cancel
              </button>
              <button
                onClick={() => updateStatus(confirmAction.id, confirmAction.status)}
                disabled={saving}
                className={`flex items-center gap-2 px-6 py-2 rounded-md font-heading text-sm uppercase tracking-wide transition-all disabled:opacity-70 text-white ${
                  confirmAction.status === "accepted"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : null}
                {confirmAction.status === "accepted" ? "Accept" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes modal */}
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md animate-fade-in-up">
            <h3 className="font-heading text-xl font-semibold uppercase tracking-wide mb-4">Admin Notes</h3>
            <textarea
              value={notesModal.notes}
              onChange={(e) => setNotesModal({ ...notesModal, notes: e.target.value })}
              rows={4}
              className="w-full bg-secondary border border-border rounded-md px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none mb-4"
              placeholder="Add notes about this application..."
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setNotesModal(null)} className="px-4 py-2 rounded-md bg-secondary text-muted-foreground hover:text-foreground font-heading text-sm uppercase tracking-wide">
                Cancel
              </button>
              <button onClick={saveNotes} disabled={saving} className="flex items-center gap-2 gradient-red text-primary-foreground px-6 py-2 rounded-md font-heading text-sm uppercase tracking-wide hover:box-glow-red transition-all disabled:opacity-70">
                {saving ? <Loader2 className="animate-spin" size={16} /> : null} Save
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

const StatCard = ({ label, value, color }: { label: string; value: number; color?: string }) => (
  <div className="bg-card border border-border rounded-xl p-5 text-center">
    <p className={`font-heading text-3xl font-bold ${color ?? "text-foreground"}`}>{value}</p>
    <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">{label}</p>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const c = status === "accepted" ? "text-green-400 bg-green-400/10" : status === "rejected" ? "text-red-400 bg-red-400/10" : "text-yellow-400 bg-yellow-400/10";
  return <span className={`px-3 py-1 rounded-full text-xs font-heading uppercase tracking-wide ${c}`}>{status}</span>;
};

const RPAnswer = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-secondary rounded-lg p-3">
    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
    <p className="text-sm">{value}</p>
  </div>
);

export default AdminDashboard;
