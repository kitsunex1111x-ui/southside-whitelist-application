import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ArrowRight, FileText, Users, Shield,
  CheckCircle, Clock, XCircle, Lock, Loader2,
} from "lucide-react";

type WLStatus = "loading" | "none" | "pending" | "accepted" | "rejected";

/* ── tiny sub-components ─────────────────────────────── */

const DISCORD_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 1 0-.008.128 10.2 10.2 0 0 0 .372.292.074.074 0 0 1 .077.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078-.01c.12-.098.246-.198.373-.292a.077.077 0 1 0-.006-.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418z" />
  </svg>
);


/* ── main component ─────────────────────────────────── */

const ApplicationsHub = () => {
  const { user } = useAuth();
  const [wlStatus, setWlStatus] = useState<WLStatus>("loading");

  useEffect(() => {
    if (!user?.id) return;

    const check = async () => {
      const { data } = await supabase
        .from("applications")
        .select("status")
        .eq("user_id", user.id)
        .in("type", ["whitelist", null as any])   // default type is 'whitelist'
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setWlStatus((data?.status as WLStatus) ?? "none");
    };

    check();
  }, [user?.id]);

  /* ── accepted: unlock Gang + Staff ────────────────── */
  if (wlStatus === "accepted") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-5xl">

            {/* header */}
            <div className="text-center mb-4">
              <h1 className="font-heading text-5xl font-bold uppercase tracking-wider mb-3">
                Choose Your <span className="text-primary text-glow-red">Path</span>
              </h1>
              <p className="text-muted-foreground text-lg">You're whitelisted — pick your next adventure.</p>
            </div>

            {/* accepted banner */}
            <div className="flex items-center justify-center gap-3 bg-green-500/10 border border-green-500/30 rounded-xl px-6 py-4 mb-10 max-w-lg mx-auto">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span className="text-green-300 font-heading uppercase tracking-wide text-sm">
                Whitelist Accepted — Gang &amp; Staff applications unlocked
              </span>
            </div>

            {/* cards */}
            <div className="grid md:grid-cols-2 gap-8 mb-10">
              <HubCard
                id="gang"
                title="Gang Application"
                description="Create or join an official gang faction. Build your empire, control territory, and rise through the ranks."
                icon={<Users className="w-8 h-8" />}
                color="from-red-600 to-red-800"
                requirements={[
                  "Minimum 3 active whitelisted members",
                  "Unique gang concept & backstory",
                  "Understanding of gang RP rules",
                  "Discord for communication",
                ]}
                to="/apply/gang"
                locked={false}
              />
              <HubCard
                id="staff"
                title="Staff Application"
                description="Join our team as admin, moderator, or support staff. Help maintain the server and assist players."
                icon={<Shield className="w-8 h-8" />}
                color="from-blue-600 to-blue-800"
                requirements={[
                  "Mature & professional attitude",
                  "Experience with FiveM/server moderation",
                  "Available time commitment",
                  "Good communication skills",
                ]}
                to="/apply/staff"
                locked={false}
              />
            </div>

            <div className="text-center">
              <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
                <ArrowRight className="w-4 h-4 rotate-180" /> Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }


  /* ── not accepted: show whitelist gate ──────────────── */
  const statusBanner = {
    loading: null,
    none: null,
    pending: {
      icon: <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0" />,
      text: "Your whitelist application is under review — we'll notify you soon.",
      cls: "bg-yellow-500/10 border-yellow-500/30 text-yellow-300",
    },
    rejected: {
      icon: <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />,
      text: "Your application was rejected. You can re-apply below.",
      cls: "bg-red-500/10 border-red-500/30 text-red-300",
    },
    accepted: null,
  }[wlStatus];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">

          {/* header */}
          <div className="text-center mb-4">
            <h1 className="font-heading text-5xl font-bold uppercase tracking-wider mb-3">
              {wlStatus === "none" || wlStatus === "loading"
                ? <>Start Your <span className="text-primary text-glow-red">Journey</span></>
                : <>Your <span className="text-primary text-glow-red">Applications</span></>}
            </h1>
            <p className="text-muted-foreground text-lg">
              {wlStatus === "none"
                ? "Apply for the whitelist to get started on SouthsideRP."
                : wlStatus === "pending"
                ? "Your whitelist application is being reviewed by our staff."
                : wlStatus === "rejected"
                ? "You can re-apply for the whitelist below."
                : ""}
            </p>
          </div>

          {/* status banner */}
          {statusBanner && (
            <div className={`flex items-center gap-3 border rounded-xl px-6 py-4 mb-10 max-w-lg mx-auto ${statusBanner.cls}`}>
              {statusBanner.icon}
              <span className="font-heading uppercase tracking-wide text-sm">{statusBanner.text}</span>
            </div>
          )}

          {/* loading state */}
          {wlStatus === "loading" ? (
            <div className="flex justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-8 mb-10">

              {/* whitelist card */}
              <HubCard
                id="whitelist"
                title="Whitelist Application"
                description="Apply to join SouthsideRP. Write your character, prove you know the rules, and get accepted to unlock everything."
                icon={<FileText className="w-8 h-8" />}
                color="from-primary to-red-800"
                requirements={[
                  "Detailed character backstory",
                  "Understanding of RP rules (RDM, VDM, metagaming)",
                  "Valid character name & age",
                  "Active Discord account",
                ]}
                to="/apply/whitelist"
                locked={wlStatus === "pending"}
                lockedLabel="Application Under Review"
                featured
              />

              {/* locked gang + staff preview */}
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <Lock className="w-3 h-3" /> Unlocks after acceptance
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <HubCard
                    id="gang"
                    title="Gang Application"
                    description="Create or join an official gang faction. Control territory and build your criminal empire."
                    icon={<Users className="w-8 h-8" />}
                    color="from-red-600 to-red-800"
                    requirements={["Get whitelisted first"]}
                    to="/apply/gang"
                    locked
                    lockedLabel="Get Whitelisted First"
                  />
                  <HubCard
                    id="staff"
                    title="Staff Application"
                    description="Join our moderation team. Help keep the server fair and the community thriving."
                    icon={<Shield className="w-8 h-8" />}
                    color="from-blue-600 to-blue-800"
                    requirements={["Get whitelisted first"]}
                    to="/apply/staff"
                    locked
                    lockedLabel="Get Whitelisted First"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="text-center">
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
              <ArrowRight className="w-4 h-4 rotate-180" /> Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};


/* ── HubCard ─────────────────────────────────────────── */

interface HubCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  requirements: string[];
  to: string;
  locked: boolean;
  lockedLabel?: string;
  featured?: boolean;
}

const HubCard = ({
  title, description, icon, color, requirements, to, locked, lockedLabel, featured,
}: HubCardProps) => {
  const inner = (
    <div
      className={`group relative bg-card border rounded-2xl overflow-hidden transition-all duration-300
        ${locked
          ? "border-border opacity-60 cursor-not-allowed"
          : featured
          ? "border-primary/40 hover:border-primary hover:scale-[1.01] cursor-pointer"
          : "border-border hover:border-primary/50 hover:scale-[1.01] cursor-pointer"
        }`}
    >
      {/* gradient overlay on hover */}
      {!locked && (
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-[0.07] transition-opacity duration-300 pointer-events-none`} />
      )}

      <div className={`relative p-7 ${featured ? "md:flex md:gap-6 md:items-start" : ""}`}>
        {/* icon */}
        <div className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-br ${color} mb-5 flex-shrink-0
          ${featured ? "w-16 h-16 md:mb-0" : "w-14 h-14"}`}>
          {locked ? <Lock className="w-6 h-6 text-white/70" /> : icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h2 className={`font-heading font-bold uppercase tracking-wide ${featured ? "text-2xl" : "text-xl"}`}>
              {title}
            </h2>
            {featured && !locked && (
              <span className="text-[10px] font-heading uppercase tracking-widest bg-primary/20 text-primary border border-primary/30 rounded-full px-2.5 py-0.5">
                Start Here
              </span>
            )}
          </div>

          <p className="text-muted-foreground mb-5 leading-relaxed text-sm">{description}</p>

          {/* requirements */}
          {!locked && (
            <ul className="space-y-1 mb-5">
              {requirements.map((r, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          )}

          {/* CTA */}
          {locked ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm font-heading uppercase tracking-wide">
              <Lock className="w-3.5 h-3.5" />
              {lockedLabel ?? "Locked"}
            </div>
          ) : (
            <div className={`flex items-center gap-2 font-heading uppercase tracking-wider text-sm
              group-hover:gap-4 transition-all ${featured ? "text-primary" : "text-primary"}`}>
              Apply Now <ArrowRight className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return locked ? <div>{inner}</div> : <Link to={to}>{inner}</Link>;
};

export default ApplicationsHub;
