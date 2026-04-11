import { Link } from "react-router-dom";

const StickyApply = () => {
  return (
    <div className="fixed bottom-6 right-6 z-50 md:hidden">
      <Link
        to="/apply"
        className="gradient-red text-primary-foreground px-6 py-3 rounded-full font-heading text-sm uppercase tracking-wider shadow-lg animate-pulse-glow"
      >
        Apply Now
      </Link>
    </div>
  );
};

export default StickyApply;
