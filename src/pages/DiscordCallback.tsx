import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DiscordCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const handleDiscordCallback = async () => {
      try {
        const code = searchParams.get("code");
        const error = searchParams.get("error");
        const userId = localStorage.getItem('discordAuthUserId');
        const timestamp = localStorage.getItem('discordAuthTimestamp');

        if (error) {
          setStatus("Authorization failed");
          toast.error("Discord authorization failed");
          setLoading(false);
          return;
        }

        if (!code) {
          setStatus("No authorization code received");
          toast.error("No authorization code received");
          setLoading(false);
          return;
        }

        if (!userId || !timestamp) {
          setStatus("Session expired");
          toast.error("Please try logging in again");
          setLoading(false);
          return;
        }

        // Check if session is recent (5 minutes)
        const sessionAge = Date.now() - parseInt(timestamp);
        if (sessionAge > 5 * 60 * 1000) {
          setStatus("Session expired");
          toast.error("Session expired, please try again");
          localStorage.removeItem('discordAuthUserId');
          localStorage.removeItem('discordAuthTimestamp');
          setLoading(false);
          return;
        }

        setStatus("Exchanging code for access token...");
        
        // Exchange code for access token
        const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: process.env.VITE_DISCORD_CLIENT_ID!,
            client_secret: process.env.VITE_DISCORD_CLIENT_SECRET!,
            grant_type: "authorization_code",
            code,
            redirect_uri: `${window.location.origin}/auth/discord/callback`,
          }),
        });

        if (!tokenResponse.ok) {
          const error = await tokenResponse.text();
          throw new Error(`Token exchange failed: ${error}`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        setStatus("Joining server...");
        
        // Get user info
        const userResponse = await fetch("https://discord.com/api/v10/users/@me", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!userResponse.ok) {
          throw new Error("Failed to get user info");
        }

        const discordUser = await userResponse.json();

        // Join server using guilds.join
        const guildId = process.env.VITE_DISCORD_GUILD_ID!;
        const joinResponse = await fetch(
          `https://discord.com/api/v10/guilds/${guildId}/members/${discordUser.id}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bot ${process.env.VITE_DISCORD_BOT_TOKEN!}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              access_token: accessToken,
            }),
          }
        );

        if (!joinResponse.ok) {
          const error = await joinResponse.text();
          throw new Error(`Failed to join server: ${error}`);
        }

        // Update user's Discord ID in applications table
        const { error: updateError } = await supabase
          .from("applications")
          .update({ discord: discordUser.id })
          .eq("user_id", userId);

        if (updateError) {
          console.error("Failed to update Discord ID:", updateError);
        }

        // Clean up
        localStorage.removeItem('discordAuthUserId');
        localStorage.removeItem('discordAuthTimestamp');

        setStatus("Success! 🎉");
        toast.success("Successfully joined Discord server!");
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);

      } catch (error) {
        console.error("Discord callback error:", error);
        setStatus("An error occurred");
        toast.error("Failed to complete Discord authorization");
        setLoading(false);
      }
    };

    handleDiscordCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        {loading ? (
          <>
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Discord Authorization</h2>
            <p className="text-muted-foreground">{status || "Processing..."}</p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4">
              {status.includes("Success") ? "🎉 Success!" : "❌ Error"}
            </h2>
            <p className="text-muted-foreground mb-4">{status}</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Return to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default DiscordCallback;
