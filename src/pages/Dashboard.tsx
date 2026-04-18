import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Clock, CheckCircle, XCircle, FileText } from "lucide-react";
type Application = {
  id: string;
  user_id: string;
  char_name: string;
  discord: string;
  age: string;
  real_name: string;
  backstory: string;
  traits: string;
  metagaming: string;
  powergaming: string;
  rdm: string;
  vdm: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  updated_at: string;
};

const statusConfig = {
  pending: { color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30", icon: Clock, label: "Pending Review" },
  accepted: { color: "text-green-400", bg: "bg-green-400/10 border-green-400/30", icon: CheckCircle, label: "Accepted" },
  rejected: { color: "text-red-400", bg: "bg-red-400/10 border-red-400/30", icon: XCircle, label: "Rejected" },
};

const Dashboard = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    const fetchApplications = async () => {
      try {
        const { data, error } = await supabase
          .from("applications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
          
        if (error) {
          setApplications([]);
        } else {
          setApplications(data ?? []);
        }
      } catch {
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchApplications();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Discord Profile Section */}
          <div className="bg-gradient-to-r from-[#5865F2] to-[#4752C3] rounded-xl p-6 mb-8 text-white">
            <div className="flex items-center gap-6">
              {/* Discord Avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                  {user?.user_metadata?.avatar_url ? (
                    <img 
                      src={user.user_metadata.avatar_url} 
                      alt="Discord Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center">
                      <span className="text-2xl font-bold">
                        {user?.user_metadata?.full_name?.[0]?.toUpperCase() || 
                         user?.user_metadata?.user_name?.[0]?.toUpperCase() || 
                         user?.email?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              
              {/* Discord User Info */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">
                  {user?.user_metadata?.full_name || 
                   user?.user_metadata?.user_name || 
                   'Discord User'}
                </h2>
                <div className="flex items-center gap-4 text-white/80">
                  <span className="flex items-center gap-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 1 0-.008.128 10.2 10.2 0 0 0 .372.292.074.074 0 0 1 .077.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078-.01c.12-.098.246-.198.373-.292a.077.077 0 1 0-.006-.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418z"/>
                    </svg>
                    Discord
                  </span>
                  <span className="flex items-center gap-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 6v6l4 2"/>
                    </svg>
                    {user?.user_metadata?.provider_id ? `ID: ${user.user_metadata.provider_id}` : 'Connected'}
                  </span>
                </div>
                <div className="mt-2 text-sm text-white/60">
                  {user?.email || 'No email provided'}
                </div>
              </div>
              
              {/* Status Badge */}
              <div className="text-right">
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
                  {user?.user_metadata?.provider_name === 'discord' ? 'Discord Authenticated' : 'Connected'}
                </div>
              </div>
            </div>
          </div>

          <h1 className="font-heading text-4xl font-bold uppercase tracking-wider mb-2">
            Your <span className="text-primary text-glow-red">Dashboard</span>
          </h1>
          <p className="text-muted-foreground mb-10">Track your whitelist applications.</p>

          {loading ? (
            <div className="text-center text-muted-foreground py-20">Loading...</div>
          ) : applications.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-heading text-2xl font-semibold mb-2">No Applications Yet</h2>
              <p className="text-muted-foreground mb-6">You haven't submitted a whitelist application.</p>
              <Link
                to="/apply"
                className="gradient-red text-primary-foreground px-8 py-3 rounded-md font-heading uppercase tracking-wider hover:box-glow-red transition-all inline-block"
              >
                Apply Now
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {applications.map((app) => {
                const sc = statusConfig[app.status] || statusConfig.pending;
                const Icon = sc.icon;
                return (
                  <div key={app.id} className="bg-card border border-border rounded-xl p-6 animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full gradient-red flex items-center justify-center font-heading text-lg font-bold text-primary-foreground">
                          {app.char_name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <h3 className="font-heading text-lg font-semibold">{app.char_name || "Unknown Character"}</h3>
                          <p className="text-sm text-muted-foreground">{app.discord || "No Discord"}</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${sc.bg}`}>
                        <Icon size={16} className={sc.color} />
                        <span className={`text-sm font-heading uppercase tracking-wide ${sc.color}`}>{sc.label}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <InfoBlock label="Age" value={app.age} />
                      <InfoBlock label="Submitted" value={new Date(app.created_at).toLocaleDateString()} />
                    </div>

                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Backstory</p>
                      <p className="text-sm text-muted-foreground line-clamp-3">{app.backstory}</p>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

const InfoBlock = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-secondary rounded-lg p-3">
    <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
    <p className="text-sm font-medium">{value}</p>
  </div>
);

export default Dashboard;
