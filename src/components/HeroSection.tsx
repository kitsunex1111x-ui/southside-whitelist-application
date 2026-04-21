import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import { Shield, Users, Zap } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <link rel="preload" as="image" href={heroBg} />

      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover"
          width={1920} height={1080} fetchPriority="high" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
      </div>

      {/* Animated red accent lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-0 w-px h-32 bg-gradient-to-b from-transparent via-primary/40 to-transparent animate-pulse" style={{ animationDelay: "0s" }} />
        <div className="absolute top-1/3 right-0 w-px h-48 bg-gradient-to-b from-transparent via-primary/30 to-transparent animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-1/3 left-1/4 w-32 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">

        {/* Server status badge */}
        <div className="inline-flex items-center gap-2 bg-background/60 backdrop-blur-sm border border-green-500/30 rounded-full px-4 py-2 mb-8 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
          <span className="text-green-400 text-xs font-heading uppercase tracking-widest">Server Online</span>
        </div>

        <h1 className="font-heading text-6xl md:text-8xl lg:text-9xl font-bold uppercase tracking-wider mb-6 animate-fade-in-up">
          <span className="text-primary text-glow-red">Southside</span>
          <br />
          <span className="text-foreground">RP</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground mb-4 animate-fade-in-up max-w-2xl mx-auto" style={{ animationDelay: "200ms" }}>
          Serious Roleplay. Real Stories. Your City.
        </p>
        <p className="text-sm text-muted-foreground/60 mb-10 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          Premium FiveM GTA V Roleplay — Whitelisted &amp; Invite-Only
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
          <Link to="/apply"
            className="gradient-red text-primary-foreground px-10 py-4 rounded-md font-heading text-lg uppercase tracking-wider hover:box-glow-red transition-all duration-300 animate-pulse-glow">
            Apply Now
          </Link>
          <a href="https://discord.gg/jHCcgUuKGK" target="_blank" rel="noopener noreferrer"
            className="bg-[#5865F2]/20 text-white border border-[#5865F2]/40 hover:bg-[#5865F2]/30 px-10 py-4 rounded-md font-heading text-lg uppercase tracking-wider transition-all duration-300 flex items-center gap-3 justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372.292.074.074 0 0 0 .077.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 0 .078-.01c.12-.098.246-.198.373-.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
            </svg>
            Join Discord
          </a>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto animate-fade-in-up" style={{ animationDelay: "600ms" }}>
          {[
            { icon: <Users size={18} className="text-primary" />, value: "200+", label: "Active Players" },
            { icon: <Shield size={18} className="text-primary" />, value: "24/7", label: "Active Staff" },
            { icon: <Zap size={18} className="text-primary" />, value: "0ms", label: "Low Ping EU" },
          ].map(s => (
            <div key={s.label} className="bg-background/40 backdrop-blur-sm border border-border/50 rounded-xl p-3 text-center">
              <div className="flex justify-center mb-1">{s.icon}</div>
              <p className="font-heading text-xl font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-fade-in" style={{ animationDelay: "1s" }}>
        <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex items-start justify-center pt-2">
          <div className="w-1 h-3 bg-primary rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
