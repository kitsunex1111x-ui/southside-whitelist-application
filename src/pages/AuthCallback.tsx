import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 20;
    
    const checkSession = async () => {
      if (cancelled || attempts >= maxAttempts) {
        if (!cancelled) navigate("/auth", { replace: true });
        return;
      }
      
      attempts++;
      
      try {
        // Check for OAuth errors
        const search = window.location.search;
        const hash = window.location.hash;
        const error = new URLSearchParams(search).get("error") || 
                     new URLSearchParams(hash.substring(1)).get("error");
        
        if (error) {
          if (!cancelled) navigate("/auth");
          return;
        }
        
        // Check if session exists (detectSessionInUrl auto-handles hash tokens)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Clean URL and redirect
          window.history.replaceState({}, document.title, window.location.pathname);
          if (!cancelled) navigate("/dashboard", { replace: true });
          return;
        }
        
        // No session yet, retry in 500ms
        setTimeout(checkSession, 500);
      } catch {
        setTimeout(checkSession, 500);
      }
    };
    
    // Start checking
    checkSession();
    
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
