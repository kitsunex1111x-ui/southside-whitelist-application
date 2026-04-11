import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, MessageSquare, Filter, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Application = Database["public"]["Tables"]["applications"]["Row"];
type Status = Database["public"]["Enums"]["application_status"];

const AdminDashboard = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Convert action names to descriptive messages
  const getActionDescription = (action: string) => {
    switch (action) {
      case 'accept_application':
        return 'Accepted application';
      case 'reject_application':
        return 'Rejected application';
      case 'add_role':
        return 'Added role';
      case 'remove_role':
        return 'Removed role';
      case 'add_notes':
        return 'Added notes';
      case 'UPDATE applications':
        return 'Updated application';
      default:
        return action.replace(/_/g, " ");
    }
  };

  const [filter, setFilter] = useState<Status | "all">("all");
  const [notesModal, setNotesModal] = useState<{ id: string; notes: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchApps = async () => {
    console.log("=== Fetching applications ===");
    console.log("Filter:", filter);
    console.log("Is admin:", isAdmin);
    console.log("User:", user?.email);
    
    try {
      if (!user || !isAdmin) {
        console.error("No admin access for fetchApps");
        setApps([]);
        setLoading(false);
        return;
      }
      
      let q = supabase.from("applications").select("*").order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      
      const { data, error } = await q;
      
      console.log("FetchApps result:", { data, error });
      
      if (error) {
        console.error("FetchApps error:", error);
        toast.error(`Failed to fetch applications: ${error.message}`);
        setApps([]);
      } else {
        console.log(`Successfully fetched ${data?.length || 0} applications`);
        setApps(data ?? []);
      }
    } catch (err) {
      console.error("Unexpected error in fetchApps:", err);
      toast.error("An unexpected error occurred while fetching applications");
      setApps([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchApps();
  }, [isAdmin, filter]);

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/dashboard" />;

  const updateStatus = async (id: string, status: Status) => {
    console.log(`=== Updating application ${id} to ${status} ===`);
    setSaving(true);
    
    try {
      // First verify admin access
      if (!user || !isAdmin) {
        console.error("No admin access for update");
        toast.error("Admin access required");
        setSaving(false);
        return;
      }
      
      console.log("User ID:", user.id);
      console.log("Application ID:", id);
      console.log("New status:", status);
      
      const { data, error } = await supabase
        .from("applications")
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select();

      console.log("Update result:", { data, error });

      if (error) {
        console.error("Update error:", error);
        toast.error(`Failed to update: ${error.message}`);
      } else {
        console.log("Update successful, adding to admin logs...");
        
        // Fetch application data to get display name
        const { data: appData } = await supabase
          .from("applications")
          .select("discord, char_name")
          .eq("id", id)
          .single();
        
        // Add to admin logs with proper display name
        const { error: logError } = await supabase.from("admin_logs").insert({
          actor_user_id: user.id,
          action: status === "accepted" ? "accept_application" : "reject_application",
          target_id: id,
          details: { 
            status, 
            application_id: id,
            new: {
              status,
              discord: appData?.discord || 'Unknown User',
              char_name: appData?.char_name || null
            }
          },
        });
        
        if (logError) {
          console.error("Log error:", logError);
        } else {
          console.log("Admin log added successfully");
        }
        
        toast.success(`Application ${status} successfully!`);
        fetchApps();
      }
    } catch (err) {
      console.error("Unexpected error in updateStatus:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    console.log("=== Saving admin notes ===");
    if (!notesModal) return;
    setSaving(true);
    
    try {
      // First verify admin access
      if (!user || !isAdmin) {
        console.error("No admin access for notes");
        toast.error("Admin access required");
        setSaving(false);
        return;
      }
      
      console.log("Saving notes for application:", notesModal.id);
      console.log("Notes content:", notesModal.notes);
      
      const { data, error } = await supabase
        .from("applications")
        .update({ 
          admin_notes: notesModal.notes,
          updated_at: new Date().toISOString()
        })
        .eq("id", notesModal.id);

      console.log("Notes update result:", { data, error });

      if (error) {
        console.error("Notes update error:", error);
        toast.error(`Failed to save notes: ${error.message}`);
      } else {
        console.log("Notes update successful, adding to admin logs...");
        
        // Add to admin logs
        const { error: logError } = await supabase.from("admin_logs").insert({
          actor_user_id: user.id,
          action: "add_notes",
          target_id: notesModal.id,
          details: { notes: notesModal.notes, application_id: notesModal.id },
        });
        
        if (logError) {
          console.error("Notes log error:", logError);
        } else {
          console.log("Notes admin log added successfully");
        }
        
        toast.success("Notes saved successfully!");
        setNotesModal(null);
        fetchApps();
      }
    } catch (err) {
      console.error("Unexpected error in saveNotes:", err);
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
          <h1 className="font-heading text-4xl font-bold uppercase tracking-wider mb-2">
            Admin <span className="text-primary text-glow-red">Panel</span>
          </h1>
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
            <div className="text-center py-20 text-muted-foreground">Loading...</div>
          ) : apps.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">No applications found.</div>
          ) : (
            <div className="space-y-4">
              {apps.map((app) => (
                <div key={app.id} className="bg-card border border-border rounded-xl p-6 animate-fade-in">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full gradient-red flex items-center justify-center font-heading text-lg font-bold text-primary-foreground">
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

                    <div className="flex items-center gap-2">
                      <StatusBadge status={app.status} />
                      <button
                        onClick={() => updateStatus(app.id, "accepted")}
                        disabled={saving || app.status === "accepted"}
                        className="p-2 rounded-md bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all disabled:opacity-30"
                        title="Accept"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => updateStatus(app.id, "rejected")}
                        disabled={saving || app.status === "rejected"}
                        className="p-2 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-30"
                        title="Reject"
                      >
                        <X size={18} />
                      </button>
                      <button
                        onClick={() => setNotesModal({ id: app.id, notes: app.admin_notes ?? "" })}
                        className="p-2 rounded-md bg-secondary text-muted-foreground hover:text-foreground transition-all"
                        title="Add Notes"
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

      {notesModal && (
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
