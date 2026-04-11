import iyedImg from "@/assets/iyed.jpg";
import gar9niImg from "@/assets/9ar9ni.jpg";

const founders = [
  { name: "Iyed", role: "Founder & Lead Developer", avatar: iyedImg },
  { name: "9ar9ni", role: "Co-Founder & Community Lead", avatar: gar9niImg },
];

const FoundersSection = () => {
  return (
    <section id="founders" className="py-24">
      <div className="container mx-auto px-4">
        <h2 className="font-heading text-4xl md:text-5xl font-bold text-center mb-4 uppercase tracking-wider">
          The <span className="text-primary text-glow-red">Founders</span>
        </h2>
        <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto">
          The minds behind the streets.
        </p>
        <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
          {founders.map((f, i) => (
            <div
              key={f.name}
              className="group relative bg-card border border-border rounded-xl p-8 w-72 text-center hover:border-primary/50 transition-all duration-500 hover:box-glow-red opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${i * 200}ms` }}
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
          ))}
        </div>
      </div>
    </section>
  );
};

export default FoundersSection;
