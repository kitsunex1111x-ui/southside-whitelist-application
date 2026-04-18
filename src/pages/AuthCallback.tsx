import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const handleCallback = async () => {
      try {
        // Check for OAuth error params first
        const search = new URLSearchParams(window.location.search);
        const hash = new URLSearchParams(window.location.hash.substring(1));
        const oauthError = search.get("error") || hash.get("error");
        const oauthErrorDesc = search.get("error_description") || hash.get("error_description");

        if (oauthError) {
          if (!cancelled) setError(oauthErrorDesc || oauthError);
          return;
        }

        // With detectSessionInUrl: true, Supabase auto-processes the hash tokens.
        // We just need to wait for the session to appear — check once immediately,
        // then rely on the auth state change event.
        const { data: { session } } = await supabase.auth.getSession();

        if (session && !cancelled) {
          window.history.replaceState({}, document.title, window.location.pathname);
          navigate("/dashboard", { replace: true });
          return;
        }

        // Session not ready yet — wait for the SIGNED_IN event (fires once Supabase
        // parses the hash tokens from the URL, typically within 1-2 seconds)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (cancelled) return;
            if (event === "SIGNED_IN" && session) {
              subscription.unsubscribe();
              window.history.replaceState({}, document.title, window.location.pathname);
              navigate("/dashboard", { replace: true });
            }
          }
        );

        // Hard timeout — if nothing happens in 10 seconds, give up gracefully
        setTimeout(() => {
          if (!cancelled) {
            subscription.unsubscribe();
            navigate("/auth", { replace: true });
          }
        }, 10_000);
      } catch {
        if (!cancelled) navigate("/auth", { replace: true });
      }
    };

    handleCallback();
    return () => { cancelled = true; };
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="font-heading text-xl font-bold uppercase tracking-wide mb-2">
            Login Failed
          </h2>
          <p className="text-muted-foreground text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate("/auth")}
            className="gradient-red text-primary-foreground px-6 py-2.5 rounded-md font-heading uppercase tracking-wider text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="animate-spin mx-auto mb-4 text-primary" size={36} />
        <p className="text-muted-foreground font-heading uppercase tracking-wider text-sm">
          Completing authentication…
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
