import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DiscordLogin = () => {
  const [loading, setLoading] = useState(false);

  const handleDiscordLogin = async () => {
    setLoading(true);
    
    try {
      // Discord OAuth2 configuration
      const clientId = process.env.VITE_DISCORD_CLIENT_ID;
      const redirectUri = `${window.location.origin}/auth/discord/callback`;
      const scope = 'identify guilds.join';
      
      // Generate Discord OAuth2 URL
      const discordAuthUrl = `https://discord.com/oauth2/authorize?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scope)}`;
      
      // Store user info for auto-join after callback
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        localStorage.setItem('discordAuthUserId', user.id);
        localStorage.setItem('discordAuthTimestamp', Date.now().toString());
      }
      
      // Redirect to Discord OAuth2
      window.location.href = discordAuthUrl;
      
    } catch (error) {
      console.error('Discord login error:', error);
      toast.error('Failed to start Discord login');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDiscordLogin}
      disabled={loading}
      className="flex items-center gap-2 px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
    >
      {loading ? (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.3804.1998-.7369.471-1.0698.8099a16.5466 16.5466 0 00-4.6539 1.909.0741.0741 0 00-.0823.0272 12.041 12.041 0 011.8227 1.5162c-.3661-.6254-.816-1.1742-1.338-1.6178a.0741.0741 0 00-.0843-.0272 19.7383 19.7383 0 00-5.4146 1.8794.0699.0699 0 00.0412.0875 12.34 12.34 0 003.4976 2.4441.0741.0741 0 00.0843-.0272 19.738 19.738 0 005.4146-1.8794.0699.0699 0 00-.0412-.0875 12.341 12.341 0 00-3.4976-2.4441.0699.0699 0 00-.0843.0272 19.739 19.739 0 00-5.4146 1.8794A19.7913 19.7913 0 0020.317 4.37zM8.3342 15.0693a1.2799 1.2799 0 10-2.5598.002 1.2799 1.2799 0 002.5598-.002zm-2.9357-4.2831a1.2799 1.2799 0 10-2.5598.002 1.2799 1.2799 0 002.5598-.002zm9.8724 4.2831a1.2799 1.2799 0 10-2.5598.002 1.2799 1.2799 0 002.5598-.002zm2.9357-4.2831a1.2799 1.2799 0 10-2.5598.002 1.2799 1.2799 0 002.5598-.002z"/>
          </svg>
          Login with Discord
        </>
      )}
    </button>
  );
};

export default DiscordLogin;
