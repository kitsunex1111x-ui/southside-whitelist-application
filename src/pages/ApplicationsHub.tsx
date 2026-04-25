import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { rawSelect } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ArrowRight, FileText, Users, Shield,
  CheckCircle, Clock, XCircle, Lock, Loader2,
  MessageSquare, Timer, RefreshCw,
} from "lucide-react";

type WLStatus = "loading" | "none" | "pending" | "accepted" | "rejected";

// ── helpers ──────────────────────────────────────────────────────
const COOLDOWN_MS = 12 * 60 * 60 * 1000;

function getCooldown(updatedAt: string | null) {
  if (!updatedAt) return null;
  const remaining = COOLDOWN_MS - (Date.now() - new Date(updatedAt).getTime());
  if (remaining <= 0) return null;
  return {
    hours:   Math.floor(remaining / 3600000),
    minutes: Math.floor((remaining % 3600000) / 60000),
    ms:      remaining,
  };
}

// ── main component ────────────────────────────────────────────────
const ApplicationsHub = () => {
  const { user } = useAuth();
  const [wlStatus,    setWlStatus]    = useState<WLStatus>("loading");
  const [updatedAt,   setUpdatedAt]   = useState<string | null>(null);
  const [wlEnabled,   setWlEnabled]   = useState<boolean | null>(null);
  // tick every minute so the cooldown countdown updates live
  const [, setTick] = useState(0);

  useEffect(() => {
    rawSelect<{ whitelist_enabled: boolean }[]>(
      "server_settings", { id: "eq.1", select: "whitelist_enabled" }
    ).then(({ data }) => {
      const row = Array.isArray(data) ? data[0] : null;
      setWlEnabled(row?.whitelist_enabled ?? true);
    }).catch(() => setWlEnabled(true));

    if (user?.id) {
      rawSelect<{ status: string; updated_at: string }[]>("applications", {
        user_id: `eq.${user.id}`,
        type:    "eq.whitelist",
        select:  "status,updated_at",
        order:   "created_at.desc",
        limit:   "1",
      }).then(({ data }) => {
        const latest = Array.isArray(data) ? data[0] : null;
        setWlStatus((latest?.status as WLStatus) ?? "none");
        setUpdatedAt(latest?.updated_at ?? null);
      }).catch(() => setWlStatus("none"));
    } else {
      setWlStatus("none");
    }
  }, [user?.id]);

  // Live countdown ticker — only runs while on cooldown
  useEffect(() => {
    if (wlStatus !== "rejected") return;
    const id = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(id);
  }, [wlStatus]);

  // loading
  if (wlEnabled === null || wlStatus === "loading") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  // ── WHITELIST DISABLED ────────────────────────────────────────
  if (!wlEnabled) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-4">
              <h1 className="font-heading text-5xl font-bold uppercase tracking-wider mb-3">
                Choose Your <span className="text-primary text-glow-red">Path</span>
              </h1>
              <p className="text-muted-foreground text-lg">Select the application that fits your goals.</p>
            </div>
            <div className="flex items-center justify-center gap-3 bg-primary/10 border border-primary/30 rounded-xl px-6 py-4 mb-10 max-w-xl mx-auto">
              <MessageSquare className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-primary/90 font-heading uppercase tracking-wide text-sm">
                Whitelist is currently invite-only — join our Discord to get interviewed
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-8 mb-10">
              <HubCard title="Gang Application"
                description="Create or join an official gang faction. Build your empire, control territory, and rise through the ranks."
                icon={<Users className="w-8 h-8" />} color="from-red-600 to-red-800"
                requirements={["Unique gang concept & backstory","Active Discord for communication","Understanding of gang RP rules"]}
                to="/apply/gang" locked={false} />
              <HubCard title="Staff Application"
                description="Join our team as support staff, whitelister, or administrator. Help maintain the server."
                icon={<Shield className="w-8 h-8" />} color="from-blue-600 to-blue-800"
                requirements={["Mature & professional attitude","Available time commitment","Good communication skills"]}
                to="/apply/staff" locked={false} />
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

  // ── ACCEPTED ─────────────────────────────────────────────────
  if (wlStatus === "accepted") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-4">
              <h1 className="font-heading text-5xl font-bold uppercase tracking-wider mb-3">
                Choose Your <span className="text-primary text-glow-red">Path</span>
              </h1>
              <p className="text-muted-foreground text-lg">You're whitelisted — pick your next adventure.</p>
            </div>
            <div className="flex items-center justify-center gap-3 bg-green-500/10 border border-green-500/30 rounded-xl px-6 py-4 mb-10 max-w-lg mx-auto">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span className="text-green-300 font-heading uppercase tracking-wide text-sm">
                Whitelist Accepted — Gang &amp; Staff applications unlocked
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-8 mb-10">
              <HubCard title="Gang Application"
                description="Create or join an official gang faction. Build your empire, control territory, and rise through the ranks."
                icon={<Users className="w-8 h-8" />} color="from-red-600 to-red-800"
                requirements={["Unique gang concept & backstory","Active Discord for communication","Understanding of gang RP rules"]}
                to="/apply/gang" locked={false} />
              <HubCard title="Staff Application"
                description="Join our team as support staff, whitelister, or administrator. Help maintain the server."
                icon={<Shield className="w-8 h-8" />} color="from-blue-600 to-blue-800"
                requirements={["Mature & professional attitude","Available time commitment","Good communication skills"]}
                to="/apply/staff" locked={false} />
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

  // ── NOT ACCEPTED (none / pending / rejected) ──────────────────
  const cooldown = wlStatus === "rejected" ? getCooldown(updatedAt) : null;
  const onCooldown = !!cooldown;

  const banner = (() => {
    if (wlStatus === "pending") return {
      icon: <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0" />,
      text: "Your whitelist application is under review — we'll notify you soon.",
      cls: "bg-yellow-500/10 border-yellow-500/30 text-yellow-300",
    };
    if (wlStatus === "rejected" && onCooldown) return {
      icon: <Timer className="w-5 h-5 text-red-400 flex-shrink-0" />,
      text: null, // rendered separately below for the timer
      cls: "bg-red-500/10 border-red-500/30 text-red-300",
    };
    if (wlStatus === "rejected" && !onCooldown) return {
      icon: <RefreshCw className="w-5 h-5 text-green-400 flex-shrink-0" />,
      text: "Cooldown expired — you can re-apply now.",
      cls: "bg-green-500/10 border-green-500/30 text-green-300",
    };
    return null;
  })();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-4">
            <h1 className="font-heading text-5xl font-bold uppercase tracking-wider mb-3">
              {wlStatus === "none"
                ? <>Start Your <span className="text-primary text-glow-red">Journey</span></>
                : <>Your <span className="text-primary text-glow-red">Applications</span></>}
            </h1>
            <p className="text-muted-foreground text-lg">
              {wlStatus === "none"    ? "Apply for the whitelist to get started on SouthsideRP."
               : wlStatus === "pending" ? "Your application is being reviewed by our staff."
               : onCooldown            ? "Your application was rejected. Please wait before re-applying."
               : "Your cooldown has expired — you can submit a new application."}
            </p>
          </div>

          {/* Status banner */}
          {banner && (
            <div className={`flex items-center gap-3 border rounded-xl px-6 py-4 mb-10 max-w-lg mx-auto ${banner.cls}`}>
              {banner.icon}
              {banner.text ? (
                <span className="font-heading uppercase tracking-wide text-sm">{banner.text}</span>
              ) : (
                /* Cooldown live timer */
                <div className="flex-1">
                  <p className="font-heading uppercase tracking-wide text-sm text-red-300 mb-0.5">
                    Application Rejected — Under Cooldown
                  </p>
                  <p className="text-xs text-red-400/80">
                    You can re-apply in{" "}
                    <span className="font-bold text-red-300">
                      {cooldown!.hours}h {cooldown!.minutes}m
                    </span>
                    {" "}— check your Dashboard for details.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-8 mb-10">
            {/* Whitelist card — locked if pending OR on cooldown */}
            <HubCard
              title="Whitelist Application"
              description="Apply to join SouthsideRP. Write your character, prove you know the rules, and get accepted to unlock everything."
              icon={<FileText className="w-8 h-8" />}
              color="from-primary to-red-800"
              requirements={["Detailed character backstory","Understanding of RP rules (RDM, VDM)","Valid character name & age","Active Discord account"]}
              to="/apply/whitelist"
              locked={wlStatus === "pending" || onCooldown}
              lockedLabel={
                wlStatus === "pending"
                  ? "Application Under Review"
                  : onCooldown
                  ? `Cooldown: ${cooldown!.hours}h ${cooldown!.minutes}m remaining`
                  : undefined
              }
              featured
            />

            {/* Gang + Staff locked behind whitelist */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <Lock className="w-3 h-3" /> Unlocks after acceptance
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <HubCard title="Gang Application"
                  description="Create or join an official gang faction. Control territory and build your empire."
                  icon={<Users className="w-8 h-8" />} color="from-red-600 to-red-800"
                  requirements={["Get whitelisted first"]} to="/apply/gang"
                  locked lockedLabel="Get Whitelisted First" />
                <HubCard title="Staff Application"
                  description="Join our moderation team. Help keep the server fair and the community thriving."
                  icon={<Shield className="w-8 h-8" />} color="from-blue-600 to-blue-800"
                  requirements={["Get whitelisted first"]} to="/apply/staff"
                  locked lockedLabel="Get Whitelisted First" />
              </div>
            </div>
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
};

// ── HubCard ───────────────────────────────────────────────────────
interface HubCardProps {
  title: string; description: string; icon: React.ReactNode;
  color: string; requirements: string[]; to: string;
  locked: boolean; lockedLabel?: string; featured?: boolean;
}
const HubCard = ({ title, description, icon, color, requirements, to, locked, lockedLabel, featured }: HubCardProps) => {
  const isCooldown = lockedLabel?.toLowerCase().includes("cooldown");
  const inner = (
    <div className={`group relative bg-card border rounded-2xl overflow-hidden transition-all duration-300
      ${locked
        ? isCooldown
          ? "border-red-500/30 opacity-80 cursor-not-allowed"
          : "border-border opacity-55 cursor-not-allowed"
        : featured
        ? "border-primary/40 hover:border-primary hover:scale-[1.01] cursor-pointer"
        : "border-border hover:border-primary/50 hover:scale-[1.01] cursor-pointer"}`}>
      {!locked && <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-[0.07] transition-opacity duration-300 pointer-events-none`} />}
      <div className={`relative p-7 ${featured ? "md:flex md:gap-6 md:items-start" : ""}`}>
        <div className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-br ${color} mb-5 flex-shrink-0 ${featured ? "w-16 h-16 md:mb-0" : "w-14 h-14"}`}>
          {locked
            ? isCooldown
              ? <Timer className="w-6 h-6 text-white/80" />
              : <Lock className="w-6 h-6 text-white/70" />
            : icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h2 className={`font-heading font-bold uppercase tracking-wide ${featured ? "text-2xl" : "text-xl"}`}>{title}</h2>
            {featured && !locked && (
              <span className="text-[10px] font-heading uppercase tracking-widest bg-primary/20 text-primary border border-primary/30 rounded-full px-2.5 py-0.5">Start Here</span>
            )}
            {isCooldown && (
              <span className="text-[10px] font-heading uppercase tracking-widest bg-red-500/15 text-red-400 border border-red-500/30 rounded-full px-2.5 py-0.5">On Cooldown</span>
            )}
          </div>
          <p className="text-muted-foreground mb-5 leading-relaxed text-sm">{description}</p>
          {!locked && (
            <ul className="space-y-1 mb-5">
              {requirements.map((r, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />{r}
                </li>
              ))}
            </ul>
          )}
          {locked ? (
            <div className={`flex items-center gap-2 text-sm font-heading uppercase tracking-wide ${isCooldown ? "text-red-400" : "text-muted-foreground"}`}>
              {isCooldown ? <Timer className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              {lockedLabel ?? "Locked"}
            </div>
          ) : (
            <div className="flex items-center gap-2 font-heading uppercase tracking-wider text-sm text-primary group-hover:gap-4 transition-all">
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
