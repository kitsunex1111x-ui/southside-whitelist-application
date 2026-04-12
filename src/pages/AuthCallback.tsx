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
      
      // Debug: Check for multiple Supabase clients
      console.log("Supabase client instance:", supabase);
      console.log("Supabase URL in callback:", (supabase as any).supabaseUrl);
      
      // Debug: Check URL parameters and hash
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      console.log("URL search params:", Object.fromEntries(urlParams.entries()));
      console.log("URL hash params:", Object.fromEntries(hashParams.entries()));
      console.log("Expected redirectTo:", `${window.location.origin}/auth/callback`);
      
      try {
        const { data, error } = await (supabase.auth as any).getSessionFromUrl();
        
        console.log("getSessionFromUrl data:", data);
        console.log("getSessionFromUrl error:", error);
        
        if (error) {
          console.error('getSessionFromUrl error:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          navigate("/auth");
          return;
        }
        
        // Clean URL (removes #access_token=... if present)
        window.history.replaceState({}, document.title, window.location.pathname);
        
        if (data.session) {
          console.log("SUCCESS: Got session, redirecting to dashboard");
          console.log("Session user:", data.session.user);
          console.log("Session expires at:", data.session.expires_at);
          
          // Add debug check for session persistence
          const { data: sessionCheck } = await supabase.auth.getSession();
          console.log('session after callback', sessionCheck.session);
          
          // Debug: Check if session matches
          if (sessionCheck.session?.user?.id === data.session?.user?.id) {
            console.log("Session persistence: MATCHING");
          } else {
            console.error("Session persistence: MISMATCH!");
          }
          
          navigate("/dashboard", { replace: true });
        } else {
          console.warn('No session returned from callback.');
          console.warn('This usually indicates:');
          console.warn('1. Multiple Supabase client instances');
          console.warn('2. Callback URL mismatch');
          console.warn('3. Session storage issues');
          navigate("/auth");
        }
      } catch (e) {
        console.error("Auth callback error:", e);
        console.error("Error stack:", e.stack);
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
