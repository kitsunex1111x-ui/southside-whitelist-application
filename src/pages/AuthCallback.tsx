import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        console.error("[AuthCallback] Timeout — redirecting to auth");
        navigate("/auth", { replace: true });
      }
    }, 15000); // 15 second timeout

    const handleCallback = async () => {
      try {
        // Check for OAuth error in URL
        const search = window.location.search;
        const hash = window.location.hash;
        const queryParams = new URLSearchParams(search);
        const hashParams = new URLSearchParams(hash.substring(1));
        const error = queryParams.get("error") || hashParams.get("error");

        if (error) {
          if (!cancelled) navigate("/auth");
          return;
        }

        // With detectSessionInUrl: true, Supabase auto-handles the code
        // Just wait for session to be established
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && !cancelled) {
          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
          navigate("/dashboard", { replace: true });
        } else if (!cancelled) {
          navigate("/auth");
        }
      } catch {
        if (!cancelled) navigate("/auth");
      }
    };

    handleCallback().finally(() => clearTimeout(timeoutId));
    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="animate-spin mx-auto mb-4" size={32} />
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
