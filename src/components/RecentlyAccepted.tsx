import { useEffect, useState } from "react";
import { rawSelect } from "@/integrations/supabase/client";

interface AcceptedEntry {
  id: string;
  char_name: string | null;
  real_name: string | null;
  updated_at: string;
}

const RecentlyAccepted = () => {
  const [players, setPlayers] = useState<AcceptedEntry[]>([]);

  useEffect(() => {
    rawSelect<AcceptedEntry[]>("applications", {
      status: "eq.accepted",
      type: "eq.whitelist",
      select: "id,char_name,real_name,updated_at",
      order: "updated_at.desc",
      limit: "20",
    }).then(({ data }) => {
      if (Array.isArray(data) && data.length > 0) setPlayers(data);
    });
  }, []);

  if (players.length === 0) return null;

  // Duplicate for seamless loop
  const doubled = [...players, ...players];

  return (
    <section className="py-16 overflow-hidden border-y border-border">
      <div className="container mx-auto px-4 mb-8 text-center">
        <p className="text-primary font-heading text-xs uppercase tracking-widest mb-2">Live updates</p>
        <h2 className="font-heading text-2xl font-bold uppercase tracking-wider">
          Recently <span className="text-primary text-glow-red">Accepted</span>
        </h2>
      </div>

      {/* Scrolling ticker */}
      <div className="relative">
        {/* fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <div className="flex gap-4 animate-scroll-left">
          {doubled.map((p, i) => {
            const displayName = p.char_name || p.real_name || "Unknown";
            const initial = displayName[0]?.toUpperCase() ?? "?";
            const timeAgo = (() => {
              const diff = Date.now() - new Date(p.updated_at).getTime();
              const h = Math.floor(diff / 3600000);
              const d = Math.floor(diff / 86400000);
              if (d > 0) return `${d}d ago`;
              if (h > 0) return `${h}h ago`;
              return "recently";
            })();

            return (
              <div key={`${p.id}-${i}`}
                className="flex-shrink-0 bg-card border border-border rounded-xl px-5 py-3 flex items-center gap-3 hover:border-primary/40 transition-colors">
                {/* avatar */}
                <div className="w-9 h-9 rounded-full gradient-red flex items-center justify-center text-primary-foreground font-heading text-sm font-bold flex-shrink-0">
                  {initial}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight truncate max-w-[120px]">{displayName}</p>
                  <p className="text-[10px] text-muted-foreground">{timeAgo}</p>
                </div>
                {/* accepted badge */}
                <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 rounded-full px-2.5 py-1 flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-[10px] text-green-400 font-heading uppercase tracking-wide font-semibold">Accepted</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default RecentlyAccepted;
