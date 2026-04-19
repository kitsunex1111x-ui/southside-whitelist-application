import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Preload hero image for faster LCP */}
      <link rel="preload" as="image" href={heroBg} />
      
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt=""
          className="w-full h-full object-cover"
          width={1920}
          height={1080}
          fetchPriority="high"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10" />
      </div>

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1 className="font-heading text-6xl md:text-8xl lg:text-9xl font-bold uppercase tracking-wider mb-4 animate-fade-in-up">
          <span className="text-primary text-glow-red">Southside</span>
          <br />
          <span className="text-foreground">WH App</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-10 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          Apply for Whitelist Access. Serious RP. Real Stories. Your City.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: "400ms" }}>
          <Link
            to="/apply"
            className="gradient-red text-primary-foreground px-10 py-4 rounded-md font-heading text-lg uppercase tracking-wider hover:box-glow-red transition-all duration-300 animate-pulse-glow"
          >
            Apply for Whitelist
          </Link>
          <a
            href="https://discord.gg/jHCcgUuKGK"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-secondary text-secondary-foreground px-10 py-4 rounded-md font-heading text-lg uppercase tracking-wider hover:bg-muted transition-all duration-300 border border-border"
          >
            Join Discord
          </a>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-fade-in" style={{ animationDelay: "1s" }}>
        <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex items-start justify-center pt-2">
          <div className="w-1 h-3 bg-primary rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
