import iyedImg from "@/assets/iyed.jpg";
import gar9niImg from "@/assets/9ar9ni.jpg";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const founders = [
  { name: "𝑰𝒚𝒆𝒅", role: "Founder & Lead Developer", avatar: iyedImg },
  { name: "9ar9ni", role: "Founder & Lead of Community", avatar: gar9niImg },
];

const FounderCard = ({ founder: f, index }: { founder: typeof founders[number]; index: number }) => {
  const ref = useScrollReveal(index * 200);
  return (
    <div
      ref={ref}
      className="group relative bg-card border border-border rounded-xl p-8 w-72 text-center hover:border-primary/50 transition-all duration-500 hover:box-glow-red"
    >
      <div className="w-28 h-28 rounded-full mx-auto mb-6 overflow-hidden border-2 border-primary/30 group-hover:border-primary group-hover:scale-110 transition-all duration-300 shadow-lg shadow-primary/20">
        <img
          src={f.avatar}
          alt={f.name}
          className="w-full h-full object-cover"
        />
      </div>
      <h3 className="font-heading text-2xl font-semibold uppercase tracking-wide mb-1">{f.name}</h3>
      <p className="text-muted-foreground text-sm">{f.role}</p>
    </div>
  );
};

const FoundersSection = () => {
  const headerRef = useScrollReveal(0);
  const lineRef = useScrollReveal(200);

  return (
    <section id="founders" className="py-24">
      <div className="container mx-auto px-4">
        <div ref={headerRef} className="text-center mb-16">
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-4 uppercase tracking-wider">
            The <span className="text-primary text-glow-red">Founders</span>
          </h2>
          <div ref={lineRef} className="section-line" />
          <p className="text-muted-foreground max-w-xl mx-auto mt-4">
            The minds behind the streets.
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
          {founders.map((f, i) => (
            <FounderCard key={f.name} founder={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FoundersSection;
