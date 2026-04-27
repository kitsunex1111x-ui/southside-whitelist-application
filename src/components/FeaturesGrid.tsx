import { Shield, DollarSign, Users, Swords, Mic, MapPin, Car, Star } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const features = [
  {
    icon: Shield, title: "Custom Scripts",
    desc: "Unique scripts and mechanics built from scratch. Every interaction is designed for maximum immersion.",
    span: "md:col-span-2", accent: "from-primary/20 to-transparent",
  },
  {
    icon: DollarSign, title: "Realistic Economy",
    desc: "A balanced, player-driven economy with real consequences and deep financial systems.",
    span: "", accent: "from-green-500/20 to-transparent",
  },
  {
    icon: Users, title: "Active Staff",
    desc: "Dedicated moderation team keeping the streets fair and the roleplay immersive.",
    span: "", accent: "from-blue-500/20 to-transparent",
  },
  {
    icon: MapPin, title: "Custom Map",
    desc: "Exclusive MLO interiors and custom locations you won't find anywhere else.",
    span: "", accent: "from-yellow-500/20 to-transparent",
  },
  {
    icon: Swords, title: "Gangs & Factions",
    desc: "Deep faction system with territories, rivalries, alliances, and war mechanics.",
    span: "md:col-span-2", accent: "from-red-500/20 to-transparent",
  },
  {
    icon: Car, title: "Custom Vehicles",
    desc: "Hundreds of custom cars, bikes and emergency vehicles with realistic handling.",
    span: "", accent: "from-purple-500/20 to-transparent",
  },
  {
    icon: Mic, title: "Voice RP",
    desc: "Full voice roleplay via proximity chat for maximum immersion and storytelling.",
    span: "", accent: "from-cyan-500/20 to-transparent",
  },
  {
    icon: Star, title: "Whitelisted",
    desc: "Whitelisted server ensuring every player meets our roleplay standards.",
    span: "md:col-span-2", accent: "from-primary/20 to-transparent",
  },
];

const FeaturesGrid = () => {
  const headerRef = useScrollReveal(0);
  const lineRef = useScrollReveal(200);

  return (
    <section id="features" className="py-28 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div ref={headerRef} className="text-center mb-16">
          <p className="text-primary font-heading text-sm uppercase tracking-widest mb-3">What makes us different</p>
          <h2 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-wider mb-4">
            Why <span className="text-primary text-glow-red">Southside</span>?
          </h2>
          <div ref={lineRef} className="section-line" />
          <p className="text-muted-foreground max-w-xl mx-auto mt-4">
            We don't just run a server — we build a world.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <FeatureCard key={f.title} feature={f} delay={i * 80} />
          ))}
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ feature: f, delay }: { feature: typeof features[number]; delay: number }) => {
  const ref = useScrollReveal(delay);
  return (
    <div
      ref={ref}
      className={`${f.span} group relative bg-card border border-border rounded-xl p-6 overflow-hidden
        hover:border-primary/40 transition-all duration-300 hover:-translate-y-1`}
    >
      <div className={`absolute top-0 left-0 w-32 h-32 bg-gradient-to-br ${f.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl pointer-events-none`} />
      <div className="relative z-10">
        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:border-primary/40 group-hover:bg-primary/20 transition-all duration-300">
          <f.icon className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-heading text-lg font-semibold uppercase tracking-wide mb-2">{f.title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
      </div>
    </div>
  );
};

export default FeaturesGrid;
