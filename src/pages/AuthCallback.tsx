import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log("=== AuthCallback Started ===");
      console.log("CALLBACK ROUTE v2 loaded", window.location.href);
      console.log("Current origin:", window.location.origin);
      
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        
        console.log("Auth code:", code);
        console.log("Auth error:", error);
        
        if (error) {
          console.error("OAuth error from URL:", error);
          navigate("/auth");
          return;
        }
        
        if (code) {
          console.log("Found auth code, exchanging for session...");
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error("exchangeCodeForSession error:", exchangeError);
            navigate("/auth");
            return;
          }
          
          const session = data.session;
          console.log("Session after exchange:", session);
          
          if (session) navigate("/dashboard");
          else navigate("/auth");
          
          return;
        }
        
        // No code: just check existing session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log("Already have session:", session.user.email);
          navigate("/dashboard");
        } else {
          console.log("No auth code or session");
          navigate("/auth");
        }
      } catch (e) {
        console.error("Auth callback error:", e);
        navigate("/auth");
      }
    };

    handleAuthCallback();
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
