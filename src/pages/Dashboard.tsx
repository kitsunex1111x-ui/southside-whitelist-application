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
  admin_notes: string | null;
};

const statusConfig = {
  pending:  { color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30", icon: Clock,        label: "Pending Review" },
  accepted: { color: "text-green-400",  bg: "bg-green-400/10 border-green-400/30",   icon: CheckCircle,  label: "Accepted" },
  rejected: { color: "text-red-400",    bg: "bg-red-400/10 border-red-400/30",       icon: XCircle,      label: "Rejected" },
};

// Skeleton loader for application cards
const AppSkeleton = () => (
  <div className="bg-card border border-border rounded-xl p-6 animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-12 h-12 rounded-full bg-secondary" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-secondary rounded w-1/3" />
        <div className="h-3 bg-secondary rounded w-1/4" />
      </div>
      <div className="h-8 w-28 bg-secondary rounded-full" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="h-12 bg-secondary rounded-lg" />
      <div className="h-12 bg-secondary rounded-lg" />
    </div>
  </div>
);

const DISCORD_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 1 0-.008.128 10.2 10.2 0 0 0 .372.292.074.074 0 0 1 .077.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078-.01c.12-.098.246-.198.373-.292a.077.077 0 1 0-.006-.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418z"/>
  </svg>
);

const Dashboard = () => {
  const { user } = useAuth();
  // Start true so there's no empty-state flash before data arrives
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setLoading(true);

    const fetchApplications = async (attempt = 1): Promise<void> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const { data, error } = await supabase
          .from("applications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);

        if (cancelled) return;

        if (error) {
          console.error("[Dashboard] Applications fetch error:", error);
          // Retry up to 3 times with backoff
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, attempt * 1000));
            return fetchApplications(attempt + 1);
          }
          setError("Failed to load applications. Please refresh or try again later.");
          setApplications([]);
        } else {
          setApplications(data ?? []);
          setError(null);
        }
      } catch (err) {
        console.error("[Dashboard] Fetch exception:", err);
        if (cancelled) return;
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, attempt * 1000));
          return fetchApplications(attempt + 1);
        }
        setError("Network error. Please check your connection and try again.");
        setApplications([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchApplications();
    return () => { cancelled = true; };
  }, [user]);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.user_name ||
    user?.email?.split("@")[0] ||
    "Player";

  const avatarUrl = user?.user_metadata?.avatar_url;
  const initials = displayName[0]?.toUpperCase() ?? "U";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">

          {/* Discord Profile Card — responsive on mobile */}
          <div className="bg-gradient-to-r from-[#5865F2] to-[#4752C3] rounded-xl p-5 mb-8 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 overflow-hidden flex items-center justify-center">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <span className="text-2xl font-bold">{initials}</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-[#5865F2]" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold truncate">{displayName}</h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-white/75 text-sm">
                  <span className="flex items-center gap-1.5">{DISCORD_ICON} Discord</span>
                  <span className="text-white/50 text-xs truncate">{user?.email}</span>
                </div>
              </div>

              {/* Badge */}
              <div className="bg-white/20 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap self-start sm:self-auto">
                {user?.app_metadata?.provider === "discord" ? "Discord Auth" : "Authenticated"}
              </div>
            </div>
          </div>

          <h1 className="font-heading text-4xl font-bold uppercase tracking-wider mb-2">
            Your <span className="text-primary text-glow-red">Dashboard</span>
          </h1>
          <p className="text-muted-foreground mb-10">Track your whitelist applications.</p>

          {/* Error state */}
          {error ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 text-center">
              <div className="text-red-400 mb-4 text-4xl">⚠️</div>
              <h2 className="font-heading text-xl font-semibold text-red-300 mb-2">
                Error Loading Applications
              </h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="gradient-red text-primary-foreground px-6 py-2 rounded-md font-heading uppercase tracking-wider text-sm hover:box-glow-red transition-all"
              >
                Refresh Page
              </button>
            </div>
          ) : loading ? (
            <div className="space-y-4">
              <AppSkeleton />
              <AppSkeleton />
            </div>
          ) : applications.length === 0 ? (
            /* Empty state */
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-40" />
              <h2 className="font-heading text-2xl font-semibold mb-2">No Applications Yet</h2>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                You haven't submitted a whitelist application. Apply now to join the server.
              </p>
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
                const sc = statusConfig[app.status] ?? statusConfig.pending;
                const Icon = sc.icon;
                return (
                  <div key={app.id} className="bg-card border border-border rounded-xl p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full gradient-red flex items-center justify-center font-heading text-lg font-bold text-primary-foreground flex-shrink-0">
                          {app.char_name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-heading text-lg font-semibold truncate">
                            {app.char_name || "Unknown Character"}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {app.discord || "No Discord"}
                          </p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-full border self-start sm:self-auto ${sc.bg}`}>
                        <Icon size={16} className={sc.color} />
                        <span className={`text-sm font-heading uppercase tracking-wide ${sc.color}`}>
                          {sc.label}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <InfoBlock label="Age" value={app.age} />
                      <InfoBlock label="Submitted" value={new Date(app.created_at).toLocaleDateString()} />
                    </div>

                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Backstory</p>
                      <p className="text-sm text-muted-foreground line-clamp-3">{app.backstory}</p>
                    </div>

                    {/* Show admin notes if present */}
                    {app.admin_notes && (
                      <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                        <p className="text-xs text-primary uppercase tracking-wide mb-1 font-medium">
                          Admin Note
                        </p>
                        <p className="text-sm text-muted-foreground">{app.admin_notes}</p>
                      </div>
                    )}
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
