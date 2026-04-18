import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

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
          console.error("OAuth error:", desc);
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
            console.error("setSession error:", sessionError);
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
            console.error("Code exchange error:", exchangeError);
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

        console.warn("No tokens, code, or existing session found in callback URL");
        if (!cancelled) navigate("/auth");
      } catch (e) {
        console.error("Auth callback error:", e);
        if (!cancelled) navigate("/auth");
      }
    };

    handleCallback();
    return () => { cancelled = true; };
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
