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
        // Let Supabase detect session from URL automatically
        // detectSessionInUrl: true in client config handles this
        console.log("Waiting for Supabase to detect session from URL...");
        
        // Wait a moment for Supabase to process the URL
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if session was established
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log("Session after detectSessionInUrl:", session);
        console.log("Session error:", error);
        
        // Clean URL (removes hash/params)
        window.history.replaceState({}, document.title, window.location.pathname);
        
        if (error) {
          console.error('Session detection error:', error);
          navigate("/auth");
          return;
        }
        
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
          console.warn('No session detected from URL.');
          console.warn('This usually indicates:');
          console.warn('1. detectSessionInUrl not working');
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
