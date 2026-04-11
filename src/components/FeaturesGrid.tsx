import { Shield, DollarSign, Users, Swords, Mic } from "lucide-react";

const features = [
  { icon: Shield, title: "Custom Scripts", desc: "Unique scripts and mechanics built from scratch for an immersive experience.", span: "md:col-span-2" },
  { icon: DollarSign, title: "Realistic Economy", desc: "A balanced, player-driven economy with real consequences.", span: "" },
  { icon: Users, title: "Active Staff", desc: "24/7 moderation team keeping the streets clean.", span: "" },
  { icon: Swords, title: "Gangs & Factions", desc: "Deep faction system with territories, rivalries, and alliances.", span: "md:col-span-2" },
  { icon: Mic, title: "Voice RP", desc: "Full voice roleplay for maximum immersion and storytelling.", span: "" },
];

const FeaturesGrid = () => {
  return (
    <section id="features" className="py-24 gradient-dark">
      <div className="container mx-auto px-4">
        <h2 className="font-heading text-4xl md:text-5xl font-bold text-center mb-4 uppercase tracking-wider">
          Why <span className="text-primary text-glow-red">Southside</span>?
        </h2>
        <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto">
          We don't just run a server — we build a world.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`${f.span} group bg-card border border-border rounded-lg p-6 hover:border-primary/50 hover:border-glow-red transition-all duration-500 opacity-0 animate-fade-in-up`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <f.icon className="w-8 h-8 text-primary mb-4 group-hover:drop-shadow-[0_0_8px_hsl(0,100%,50%)] transition-all" />
              <h3 className="font-heading text-xl font-semibold mb-2 uppercase tracking-wide">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
