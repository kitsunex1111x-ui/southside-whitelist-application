const steps = [
  { num: "01", title: "Join Discord", desc: "Connect with the community and get all the info you need." },
  { num: "02", title: "Read the Rules", desc: "Understand our standards for serious roleplay." },
  { num: "03", title: "Apply for Whitelist", desc: "Fill out the application and show us your RP skills." },
  { num: "04", title: "Get Accepted", desc: "Once approved, you're in. Welcome to the Southside." },
];

const HowToJoin = () => {
  return (
    <section id="join" className="py-24 gradient-dark">
      <div className="container mx-auto px-4">
        <h2 className="font-heading text-4xl md:text-5xl font-bold text-center mb-4 uppercase tracking-wider">
          How to <span className="text-primary text-glow-red">Join</span>
        </h2>
        <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto">
          Four steps to the streets.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {steps.map((s, i) => (
            <div
              key={s.num}
              className="relative text-center opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="font-heading text-6xl font-bold text-primary/20 mb-2">{s.num}</div>
              <h3 className="font-heading text-lg font-semibold uppercase tracking-wide mb-2">{s.title}</h3>
              <p className="text-muted-foreground text-sm">{s.desc}</p>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 -right-3 w-6 h-px bg-primary/30" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowToJoin;
