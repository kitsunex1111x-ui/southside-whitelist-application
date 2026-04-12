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
        // For implicit flow, check URL hash for access_token
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const error = hashParams.get('error');
        
        console.log("Access token from hash:", !!accessToken);
        console.log("Error from hash:", error);
        
        if (error) {
          console.error('OAuth error from hash:', error);
          navigate("/auth");
          return;
        }
        
        let session = null;
        
        if (accessToken) {
          // Set the session using the tokens from URL hash
          const { data: { session: sessionData }, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });
          
          console.log("Session after setSession:", sessionData);
          console.log("Session error:", sessionError);
          
          if (sessionError) {
            console.error('setSession error:', sessionError);
            navigate("/auth");
            return;
          }
          
          session = sessionData;
        } else {
          // Fallback: check for existing session
          const { data: { session: existingSession } } = await supabase.auth.getSession();
          session = existingSession;
        }
        
        console.log("Final session:", session);
        
        // Clean URL (removes #access_token=... if present)
        window.history.replaceState({}, document.title, window.location.pathname);
        
        if (session) {
          console.log("SUCCESS: Got session, redirecting to dashboard");
          console.log("Session user:", session.user);
          console.log("Session expires at:", session.expires_at);
          
          // Add debug check for session persistence
          const { data: sessionCheck } = await supabase.auth.getSession();
          console.log('session after callback', sessionCheck.session);
          
          // Debug: Check if session matches
          if (sessionCheck.session?.user?.id === session?.user?.id) {
            console.log("Session persistence: MATCHING");
          } else {
            console.error("Session persistence: MISMATCH!");
          }
          
          navigate("/dashboard", { replace: true });
        } else {
          console.warn('No session found after callback.');
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
