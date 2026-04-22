import { createClient } from "@supabase/supabase-js";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Use POST" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { userId, eventType, username } = body as { 
      userId?: string; 
      eventType?: 'join' | 'rejoin';
      username?: string;
    };

    if (!userId || !eventType) {
      return new Response(JSON.stringify({ error: "userId and eventType required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user info from applications table
    const { data: application, error: appError } = await supabaseAdmin
      .from("applications")
      .select("discord, char_name, status")
      .eq("user_id", userId)
      .single();

    if (appError) {
      console.log("User not found in applications:", userId);
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const discordId = application.discord;
    const charName = application.char_name || username || 'Unknown';

    // Send welcome message to Discord channel
    const welcomeMessage = await sendWelcomeMessage(discordId, charName, eventType);

    return new Response(JSON.stringify({ 
      success: true, 
      discordId, 
      charName,
      eventType,
      welcomeMessage 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

async function sendWelcomeMessage(discordId: string, charName: string, eventType: string) {
  const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");
  const WELCOME_CHANNEL_ID = Deno.env.get("DISCORD_WELCOME_CHANNEL_ID");
  
  if (!DISCORD_BOT_TOKEN || !WELCOME_CHANNEL_ID) {
    return { error: "Discord credentials not configured" };
  }

  try {
    // Get user info for welcome message
    const userResponse = await fetch(
      `https://discord.com/api/v10/users/${discordId}`,
      {
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`
        }
      }
    );

    if (!userResponse.ok) {
      const error = await userResponse.text();
      console.log(`Failed to get user info: ${error}`);
      return { error: `Failed to get user info: ${error}` };
    }

    const user = await userResponse.json();
    const username = user.username || user.global_name || charName;

    let message = '';
    
    if (eventType === 'rejoin') {
      message = `👋 **Welcome back to 𝙊𝙢𝙚𝙧𝙩𝙖 𝙍𝙤𝙡𝙚𝙋𝙡𝙖𝙮 [𝙁𝙞𝙫𝙚]!**\n\n`;
      message += `**${username}** (${charName}) has rejoined the server!\n\n`;
      message += `We're glad to have you back! 🎉`;
    } else if (eventType === 'join') {
      message = `🎉 **Welcome to 𝙊𝙢𝙚𝙧𝙩𝙖 𝙍𝙤𝙡𝙚𝙋𝙡𝙖𝙮 [𝙁𝙞𝙫𝙚]!**\n\n`;
      message += `**${username}** (${charName}) has joined the server!\n\n`;
      message += `Please check your application status and follow server rules.`;
    }

    // Send message to welcome channel
    const response = await fetch(
      `https://discord.com/api/v10/channels/${WELCOME_CHANNEL_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: message,
          allowed_mentions: {
            parse: ['users']
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.log(`Failed to send welcome message: ${error}`);
      return { error: `Failed to send welcome message: ${error}` };
    }

    console.log(`Welcome message sent for ${username} (${eventType})`);
    return { success: true, message: "Welcome message sent successfully" };

  } catch (error) {
    console.log(`Welcome message error: ${error}`);
    return { error: `Failed to send welcome message: ${error}` };
  }
}
