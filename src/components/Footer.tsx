import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border relative overflow-hidden">
      {/* Top red accent */}
      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

          {/* Brand column */}
          <div className="md:col-span-2">
            <p className="font-heading text-3xl tracking-wider mb-3">
              <span className="text-primary text-glow-red">SOUTHSIDE</span>
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mb-6">
              Serious roleplay. Real stories. Your city. Tunisia's premier whitelisted FiveM GTA V server.
            </p>
            {/* Discord CTA */}
            <a
              href="https://discord.gg/5UJwUzPpk8"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#5865F2]/15 border border-[#5865F2]/30 hover:bg-[#5865F2]/25 text-white px-4 py-2.5 rounded-lg text-sm transition-all duration-300 font-heading uppercase tracking-wide"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" clipRule="evenodd">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372.292.074.074 0 0 0 .077.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 0 .078-.01c.12-.098.246-.198.373-.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418z"/>
              </svg>
              Join Discord
            </a>
          </div>

          {/* Navigation */}
          <div>
            <p className="font-heading text-xs uppercase tracking-widest text-primary mb-4">Navigation</p>
            <ul className="space-y-2.5">
              {[
                { label: "Features",   href: "/#features" },
                { label: "Store",      href: "/#store" },
                { label: "Founders",   href: "/#founders" },
                { label: "How to Join",href: "/#join" },
                { label: "Streamers",  href: "/#streamers" },
              ].map(l => (
                <li key={l.label}>
                  <a href={l.href} className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-200 hover:translate-x-1 inline-block">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <p className="font-heading text-xs uppercase tracking-widest text-primary mb-4">Quick Links</p>
            <ul className="space-y-2.5">
              {[
                { label: "Apply Now",    to: "/apply" },
                { label: "Dashboard",   to: "/dashboard" },
                { label: "Visit Store", href: "https://store-site-khaki.vercel.app" },
                { label: "Login",       to: "/auth" },
              ].map(l => (
                <li key={l.label}>
                  {l.to ? (
                    <Link to={l.to} className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-200 hover:translate-x-1 inline-block">
                      {l.label}
                    </Link>
                  ) : (
                    <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-200 hover:translate-x-1 inline-block">
                      {l.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-muted-foreground text-xs">
            © 2026 Southside RP. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground font-heading uppercase tracking-widest">Server Online</span>
          </div>
          <p className="text-muted-foreground text-xs">
            Made with ❤️ for the Tunisian RP community
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
