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
    }, 10000); // 10 second timeout

    const handleCallback = async () => {
      try {
        const hash = window.location.hash;
        const search = window.location.search;

        // Check for OAuth error in hash or query string
        const hashParams = new URLSearchParams(hash.substring(1));
        const queryParams = new URLSearchParams(search);
        const error = hashParams.get("error") || queryParams.get("error");

        if (error) {
          const desc = hashParams.get("error_description") || queryParams.get("error_description") || error;
          if (!cancelled) navigate("/auth");
          return;
        }

        // Path 1: Implicit flow — tokens in URL hash
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken) {
          const { data: { session }, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          });

          if (sessionError) {
            if (!cancelled) navigate("/auth");
            return;
          }

          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);

          if (session && !cancelled) {
            navigate("/dashboard", { replace: true });
          } else if (!cancelled) {
            navigate("/auth");
          }
          return;
        }

        // Path 2: PKCE / code flow — code in query string
        const code = queryParams.get("code");
        if (code) {
          const { data: { session }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            if (!cancelled) navigate("/auth");
            return;
          }

          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);

          if (session && !cancelled) {
            navigate("/dashboard", { replace: true });
          } else if (!cancelled) {
            navigate("/auth");
          }
          return;
        }

        // Path 3: Session may already exist (e.g. email confirmation redirect)
        const { data: { session } } = await supabase.auth.getSession();
        if (session && !cancelled) {
          navigate("/dashboard", { replace: true });
          return;
        }

        if (!cancelled) navigate("/auth");
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
