import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, LogOut, User, Shield, Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAdmin, isOwner, signOut, loading: authLoading } = useAuth();
  
  // Don't show role-based links until auth is fully loaded (prevents flickering)
  const showAdmin = !authLoading && isAdmin;
  const showOwner = !authLoading && isOwner;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/90 backdrop-blur-md border-b border-border" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between py-4 px-4">
        <Link to="/" className="font-heading text-2xl font-bold tracking-wider">
          <span className="text-primary">SOUTHSIDE</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <a href="/#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm uppercase tracking-wide">Features</a>
          <a href="/#store" className="text-muted-foreground hover:text-foreground transition-colors text-sm uppercase tracking-wide">Store</a>
          <a href="/#founders" className="text-muted-foreground hover:text-foreground transition-colors text-sm uppercase tracking-wide">Founders</a>
          <a href="/#join" className="text-muted-foreground hover:text-foreground transition-colors text-sm uppercase tracking-wide">How to Join</a>
          <a href="/#streamers" className="text-muted-foreground hover:text-foreground transition-colors text-sm uppercase tracking-wide">Streamers</a>

          {user ? (
            <> 
              <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors text-sm uppercase tracking-wide flex items-center gap-1">
                <User size={14} /> Dashboard
              </Link>
              {showAdmin && (
                <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors text-sm uppercase tracking-wide flex items-center gap-1">
                  <Shield size={14} /> Admin
                </Link>
              )}
              {showOwner && (
                <Link to="/owner" className="text-muted-foreground hover:text-foreground transition-colors text-sm uppercase tracking-wide flex items-center gap-1">
                  <Crown size={14} /> Owner
                </Link>
              )}
              <button
                onClick={signOut}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm uppercase tracking-wide flex items-center gap-1"
              >
                <LogOut size={14} /> Logout
              </button>
            </>
          ) : (
            <Link to="/auth" className="text-muted-foreground hover:text-foreground transition-colors text-sm uppercase tracking-wide">Login</Link>
          )}

          <Link
            to="/apply"
            className="gradient-red text-primary-foreground px-6 py-2 rounded-md font-heading text-sm uppercase tracking-wider hover:box-glow-red transition-all duration-300"
          >
            Apply Now
          </Link>
        </div>

        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-md border-b border-border px-4 pb-4 animate-fade-in">
          <div className="flex flex-col gap-4">
            <a href="/#features" onClick={() => setMobileOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors text-sm uppercase tracking-wide">Features</a>
            <a href="/#store" onClick={() => setMobileOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors text-sm uppercase tracking-wide">Store</a>
            <a href="/#founders" onClick={() => setMobileOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors text-sm uppercase tracking-wide">Founders</a>
            <a href="/#join" onClick={() => setMobileOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors text-sm uppercase tracking-wide">How to Join</a>
            <a href="/#streamers" onClick={() => setMobileOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors text-sm uppercase tracking-wide">Streamers</a>
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors text-sm uppercase tracking-wide">Dashboard</Link>
                {showAdmin && <Link to="/admin" onClick={() => setMobileOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors text-sm uppercase tracking-wide">Admin</Link>}
                {showOwner && <Link to="/owner" onClick={() => setMobileOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors text-sm uppercase tracking-wide">Owner</Link>}
                <button onClick={() => { signOut(); setMobileOpen(false); }} className="text-muted-foreground hover:text-foreground transition-colors text-sm uppercase tracking-wide text-left">Logout</button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setMobileOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors text-sm uppercase tracking-wide">Login</Link>
            )}
            <Link to="/apply" onClick={() => setMobileOpen(false)} className="gradient-red text-primary-foreground px-6 py-2 rounded-full font-heading text-sm uppercase tracking-wider text-center">
              Apply Now
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
