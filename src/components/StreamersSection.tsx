import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Users, Radio, ExternalLink } from "lucide-react";

// Correct Kick.com logo — angular K shape matching their brand
const KickLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 50 50" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 8h8v12.5L27.5 8H38L25.5 22.5 38 42H27.5L18 29.5V42h-8V8z"/>
  </svg>
);

interface Streamer {
  name: string;
  kickUrl: string;
  description: string;
  isLive?: boolean;
  viewers?: number;
}

const streamers: Streamer[] = [
  {
    name: "Featured Streamer",
    kickUrl: "#",
    description: "Top Southside RP content creator",
    isLive: false,
  },
  // Add your streamers here:
  // { name: "StreamerName", kickUrl: "https://kick.com/name", description: "RP veteran", isLive: true, viewers: 234 },
];

const StreamerCard = ({ streamer, index }: { streamer: Streamer; index: number }) => {
  const ref = useScrollReveal(index * 150);
  
  return (
    <div
      ref={ref}
      className="group bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00E701]/20 to-[#00E701]/5 flex items-center justify-center border border-[#00E701]/30">
          <KickLogo className="w-7 h-7 text-[#00E701]" />
        </div>
        {streamer.isLive ? (
          <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 rounded-full px-3 py-1">
            <Radio className="w-3 h-3 text-red-500 animate-pulse" />
            <span className="text-red-500 text-xs font-heading uppercase">LIVE</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-muted/50 rounded-full px-3 py-1">
            <span className="text-muted-foreground text-xs font-heading uppercase">Offline</span>
          </div>
        )}
      </div>

      <h3 className="font-heading text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
        {streamer.name}
      </h3>
      <p className="text-muted-foreground text-sm mb-4">{streamer.description}</p>

      {streamer.isLive && streamer.viewers && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Users className="w-4 h-4" />
          <span>{streamer.viewers.toLocaleString()} viewers</span>
        </div>
      )}

      <a
        href={streamer.kickUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-[#00E701] hover:text-[#00b800] text-sm font-medium transition-colors"
      >
        Watch on Kick
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
};

const StreamersSection = () => {
  const headerRef = useScrollReveal(0);
  const lineRef = useScrollReveal(200);

  return (
    <section id="streamers" className="py-24 bg-background relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00E701]/30 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div ref={headerRef} className="text-center mb-16">
          <p className="text-[#00E701] font-heading text-sm uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
            <KickLogo className="w-4 h-4" />
            Live Content
          </p>
          <h2 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-wider mb-4">
            Featured <span className="text-[#00E701]">Streamers</span>
          </h2>
          <div ref={lineRef} className="section-line" />
          <p className="text-muted-foreground max-w-xl mx-auto mt-4">
            Watch Southside RP live on Kick. See the stories unfold in real-time.
          </p>
        </div>

        {streamers.length > 0 && streamers[0].kickUrl !== "#" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {streamers.map((streamer, index) => (
              <StreamerCard key={streamer.name} streamer={streamer} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center max-w-2xl mx-auto">
            <div className="bg-card border border-border rounded-xl p-8">
              <KickLogo className="w-16 h-16 text-[#00E701]/50 mx-auto mb-4" />
              <h3 className="font-heading text-xl font-semibold mb-2">Streamers Coming Soon</h3>
              <p className="text-muted-foreground mb-6">
                We're partnering with content creators to showcase Southside RP. 
                Contact support to get help or assistance with streaming here.
              </p>
              <a
                href="https://discord.gg/5UJwUzPpk8"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#00E701]/10 border border-[#00E701]/30 hover:bg-[#00E701]/20 text-[#00E701] px-6 py-3 rounded-md font-heading uppercase tracking-wider text-sm transition-all"
              >
                Contact Support
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground text-sm">
            Are you a streamer?{" "}
            <a
              href="https://discord.gg/5UJwUzPpk8"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00E701] hover:underline"
            >
              Apply to be featured
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default StreamersSection;
