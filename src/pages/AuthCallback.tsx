import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log("=== AuthCallback Started ===");
      console.log("CALLBACK ROUTE loaded", window.location.href);
      console.log("Current origin:", window.location.origin);
      
      try {
        // Extract code from URL and exchange for session
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
        
        if (!code) {
          console.log("No auth code found");
          navigate("/auth");
          return;
        }
        
        // Exchange the code for a session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        const session = data.session;
        
        console.log("Session after exchange:", session);
        console.log("Exchange error:", exchangeError);
        
        if (exchangeError) {
          console.error('exchangeCodeForSession error:', exchangeError);
          navigate("/auth");
          return;
        }
        
        if (session) {
          console.log("SUCCESS: Got session, redirecting to dashboard");
          console.log("Session user:", session.user);
          navigate("/dashboard");
        } else {
          console.log("NO SESSION: Redirecting to auth");
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
