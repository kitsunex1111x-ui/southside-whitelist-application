import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    ;(async () => {
      console.log("=== AuthCallback Started ===");
      console.log("CALLBACK ROUTE loaded", window.location.href);
      console.log("Current origin:", window.location.origin);
      
      try {
        const { data, error } = await (supabase.auth as any).getSessionFromUrl();
        
        console.log("getSessionFromUrl data:", data);
        console.log("getSessionFromUrl error:", error);
        
        if (error) {
          console.error('getSessionFromUrl error:', error);
          navigate("/auth");
          return;
        }
        
        // Clean URL (removes #access_token=... if present)
        window.history.replaceState({}, document.title, window.location.pathname);
        
        if (data.session) {
          console.log("SUCCESS: Got session, redirecting to dashboard");
          console.log("Session user:", data.session.user);
          
          // Add debug check for session persistence
          const { data: sessionCheck } = await supabase.auth.getSession();
          console.log('session after callback', sessionCheck.session);
          
          navigate("/dashboard", { replace: true });
        } else {
          console.warn('No session returned from callback.');
          navigate("/auth");
        }
      } catch (e) {
        console.error("Auth callback error:", e);
        navigate("/auth");
      }
    })();
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
