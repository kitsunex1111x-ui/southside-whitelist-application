import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Trash2, Plus, Loader2, UserCog, Clock } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface RoleEntry {
  id: string;
  user_id: string;
  role: AppRole;
  email?: string;
}

interface LogEntry {
  id: string;
  actor_user_id: string;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
  admin_name?: string;
  admin_avatar?: string;
  admin_provider?: string;
}

const OwnerDashboard = () => {
  const { user, isOwner, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<RoleEntry[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

// Debug function to track logs state changes
const debugSetLogs = (newLogs: LogEntry[]) => {
  console.log('setLogs called with:', newLogs.length, 'entries');
  setLogs(newLogs);
};
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("admin");
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  // Extract target information consistently
  const getTargetInfo = (log: any) => {
    const actionLower = log?.action?.toLowerCase();
    if (actionLower === "UPDATE applications".toLowerCase() || 
        actionLower === "accept_application" || 
        actionLower === "reject_application") {
      return log?.details?.new?.discord || log?.details?.new?.char_name || "Unknown User";
    }
    return null;
  };

  // Convert action names to descriptive messages
  const getActionDescription = (log: any) => {
    if (log?.action?.toLowerCase() === "accept_application") {
      const targetName = getTargetInfo(log);
      return `Accepted application for ${targetName}`;
    }
    
    if (log?.action?.toLowerCase() === "reject_application") {
      const targetName = getTargetInfo(log);
      return `Rejected application for ${targetName}`;
    }
    
    if (log?.action?.toLowerCase() === "UPDATE applications".toLowerCase()) {
      const next = log?.details?.new?.status;
      const targetName = getTargetInfo(log);
      
      if (next === "accepted") return `Accepted application for ${targetName}`;
      if (next === "rejected") return `Rejected application for ${targetName}`;
      
      return `Updated application for ${targetName}`;
    }
    
    switch (log?.action) {
      case 'add_role': return 'Added role';
      case 'remove_role': return 'Removed role';
      case 'add_notes': return 'Added notes';
      default: return String(log?.action ?? "").replace(/_/g, " ");
    }
  };

  const fetchData = async () => {
    console.log("=== Fetching Owner Dashboard Data ===");
    
    try {
      // Fetch roles
      console.log("Fetching user roles...");
      const { data: rolesData, error: rolesError } = await supabase.from("user_roles").select("*");
      
      if (rolesError) {
        console.error("Error fetching roles:", rolesError);
        toast.error(`Failed to fetch roles: ${rolesError.message}`);
      } else if (rolesData) {
        console.log(`Found ${rolesData.length} role entries`);
        
        const userIds = rolesData.map((r) => r.user_id);
        const { data: profiles, error: profilesError } = await supabase.from("profiles").select("user_id, username").in("user_id", userIds);
        
        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
        }
        
        const profileMap = new Map(profiles?.map((p) => [p.user_id, p.username]) ?? []);
        setRoles(rolesData.map((r) => ({ ...r, email: profileMap.get(r.user_id) ?? r.user_id.slice(0, 8) })));
      }

      // Fetch admin logs (Activity Log) with Discord info using VIEW
      console.log("Fetching admin logs with Discord info...");
      const { data: logsData, error: logsError } = await supabase
        .from("admin_logs_with_discord")
        .select("*")
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (logsError) {
        console.error("Error fetching admin logs:", logsError);
        if (logsError.code === 'PGRST204') {
          // Table doesn't exist
          toast.error("admin_logs_with_discord view not found. Please run SQL setup script.");
          setLogs([]);
        } else {
          toast.error(`Failed to fetch activity log: ${logsError.message}`);
          setLogs([]);
        }
      } else {
        console.log(`Found ${logsData?.length || 0} admin log entries`);
        
        // The VIEW already provides flattened data, so just set logs directly
        console.log('Setting logs state with data:', logsData);
        console.log('Sample log entry:', logsData?.[0]);
        console.log('logsData length:', logsData?.length);
        debugSetLogs((logsData ?? []) as LogEntry[]);
        
        // Debug logs state after setting
        setTimeout(() => {
            console.log('logs state after setLogs:', logs);
        }, 100);
      }
      
    } catch (error) {
      console.error("Unexpected error in fetchData:", error);
      toast.error("An unexpected error occurred while fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOwner) fetchData();
  }, [isOwner]);

  if (authLoading) return null;
  if (!isOwner) return <Navigate to="/dashboard" />;

  const addAdmin = async () => {
    if (!newEmail.trim()) return;
    setAdding(true);

    // Look up user by Discord ID from applications
    const { data: applications } = await supabase
      .from("applications")
      .select("user_id, discord")
      .eq("discord", newEmail.trim())
      .maybeSingle();

    if (!applications) {
      toast.error("User not found. They must have submitted an application with this Discord ID.");
      setAdding(false);
      return;
    }

    const { error } = await supabase.from("user_roles").insert({
      user_id: applications.user_id,
      role: newRole,
    });

    if (error) {
      toast.error(error.message.includes("duplicate") ? "User already has this role" : error.message);
    } else {
      await supabase.from("admin_logs").insert({
        actor_user_id: user!.id,
        action: getActionDescription("add_role"),
        target_id: applications.user_id,
        details: { role: newRole, discord: newEmail },
      });
      toast.success(`${newRole} role assigned to Discord ID: ${newEmail}`);
      setNewEmail("");
      fetchData();
    }
    setAdding(false);
  };

  const removeRole = async (roleEntry: RoleEntry) => {
    if (roleEntry.user_id === user!.id && roleEntry.role === "owner") {
      toast.error("Can't remove your own owner role");
      return;
    }

    const { error } = await supabase.from("user_roles").delete().eq("id", roleEntry.id);
    if (!error) {
      await supabase.from("admin_logs").insert({
        actor_user_id: user!.id,
        action: getActionDescription("remove_role"),
        target_id: roleEntry.user_id,
        details: { role: roleEntry.role },
      });
      toast.success("Role removed");
      fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <h1 className="font-heading text-4xl font-bold uppercase tracking-wider mb-2">
            Owner <span className="text-primary text-glow-red">Panel</span>
          </h1>
          <p className="text-muted-foreground mb-10">Manage admins, roles, and view activity.</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-heading text-xl font-semibold uppercase tracking-wide mb-6 flex items-center gap-2">
                <Plus size={20} className="text-primary" /> Add Role
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 uppercase tracking-wide">Discord ID</label>
                  <input
                    type="text"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter Discord ID (e.g. 123456789012345678)"
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
                  onClick={addAdmin}
                  disabled={adding}
                  className="w-full gradient-red text-primary-foreground py-3 rounded-md font-heading uppercase tracking-wider text-sm hover:box-glow-red transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {adding ? <Loader2 className="animate-spin" size={16} /> : <Shield size={16} />} Assign Role
                </button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-heading text-xl font-semibold uppercase tracking-wide mb-6 flex items-center gap-2">
                <UserCog size={20} className="text-primary" /> Current Roles
              </h2>
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : roles.length === 0 ? (
                <p className="text-muted-foreground">No roles assigned yet.</p>
              ) : (
                <div className="space-y-3">
                  {roles.map((r) => (
                    <div key={r.id} className="flex items-center justify-between bg-secondary rounded-lg p-3">
                      <div>
                        <p className="font-medium text-sm">{r.email}</p>
                        <span className={`text-xs font-heading uppercase tracking-wide ${r.role === "owner" ? "text-primary" : "text-yellow-400"}`}>
                          {r.role}
                        </span>
                      </div>
                      <button
                        onClick={() => removeRole(r)}
                        className="p-2 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all"
                        title="Remove role"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 bg-card border border-border rounded-xl p-6">
            <h2 className="font-heading text-xl font-semibold uppercase tracking-wide mb-6 flex items-center gap-2">
              <Clock size={20} className="text-primary" /> Activity Log
            </h2>
            {logs.length === 0 ? (
              <p className="text-muted-foreground">No activity yet.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 bg-secondary rounded-lg p-3 text-sm">
                    {log.admin_avatar ? (
                      <img 
                        src={log.admin_avatar} 
                        alt={log.admin_name || 'Admin'} 
                        className="w-8 h-8 rounded-full flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
                        {(typeof log.admin_name === 'string' && log.admin_name.length > 0) ? log.admin_name[0].toUpperCase() : '?'}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {log.admin_name || 'Unknown Admin'}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {getActionDescription(log)}
                        </span>
                      </div>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {(log.action?.toLowerCase() === 'UPDATE applications'.toLowerCase() || 
                            log.action?.toLowerCase() === 'accept_application' || 
                            log.action?.toLowerCase() === 'reject_application') && (
                            <>
                              {(log.details as any)?.new?.discord && `Discord: ${(log.details as any).new.discord}`}
                              {(log.details as any)?.new?.char_name && `  Character: ${(log.details as any).new.char_name}`}
                            </>
                          )}
                          {log.action === 'add_role' && (log.details as any)?.role && `Role: ${(log.details as any).role}`}
                          {log.action === 'remove_role' && (log.details as any)?.role && `Role: ${(log.details as any).role}`}
                          {log.action === 'add_notes' && (log.details as any)?.notes && `Notes: ${(log.details as any).notes}`}
                          {(log.details as any)?.application_id && typeof (log.details as any).application_id === 'string' && `  App: ${(log.details as any).application_id.slice(0, 8)}...`}
                        </div>
                      )}
                    </div>
                    <span className="text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
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
