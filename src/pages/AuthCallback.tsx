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
        // Handle the OAuth callback - check URL hash for access_token
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
        
        if (session) {
          console.log("SUCCESS: Got session, cleaning URL and redirecting");
          console.log("Session user:", session.user);
          
          // Clean the URL hash to remove access_token
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Navigate to dashboard
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
