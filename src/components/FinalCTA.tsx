import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const FinalCTA = () => {
  const titleRef = useScrollReveal(0);
  const subRef   = useScrollReveal(150);
  const btnRef   = useScrollReveal(300);

  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      <div className="container mx-auto px-4 relative z-10 text-center">
        <h2 ref={titleRef} className="font-heading text-4xl md:text-6xl font-bold uppercase tracking-wider mb-4">
          Ready to <span className="text-primary text-glow-red">Join</span>?
        </h2>
        <p ref={subRef} className="text-muted-foreground text-lg mb-10 max-w-lg mx-auto">
          Limited whitelist access. Apply now before spots fill up.
        </p>
        <div ref={btnRef}>
          <Link
            to="/apply"
            className="inline-block gradient-red text-primary-foreground px-12 py-5 rounded-md font-heading text-xl uppercase tracking-wider hover:box-glow-red transition-all duration-300 animate-pulse-glow"
          >
            Apply Now
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
