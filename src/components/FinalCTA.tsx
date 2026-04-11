import { Link } from "react-router-dom";

const FinalCTA = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      <div className="container mx-auto px-4 relative z-10 text-center">
        <h2 className="font-heading text-4xl md:text-6xl font-bold uppercase tracking-wider mb-4 opacity-0 animate-fade-in-up">
          Ready to <span className="text-primary text-glow-red">Join</span>?
        </h2>
        <p className="text-muted-foreground text-lg mb-10 max-w-lg mx-auto opacity-0 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
          Limited whitelist access. Apply now before spots fill up.
        </p>
        <Link
          to="/apply"
          className="inline-block gradient-red text-primary-foreground px-12 py-5 rounded-md font-heading text-xl uppercase tracking-wider hover:box-glow-red transition-all duration-300 animate-pulse-glow opacity-0 animate-fade-in-up"
          style={{ animationDelay: "300ms" }}
        >
          Apply Now
        </Link>
      </div>
    </section>
  );
};

export default FinalCTA;
