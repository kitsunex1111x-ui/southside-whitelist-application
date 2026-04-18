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
    const { userId, action } = body as { userId?: string; action?: string };

    if (!userId || !action) {
      return new Response(JSON.stringify({ error: "userId and action required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user's Discord ID from applications
    const { data: application, error: appError } = await supabaseAdmin
      .from("applications")
      .select("discord")
      .eq("user_id", userId)
      .single();

    if (appError || !application) {
      return new Response(JSON.stringify({ error: "User not found in applications" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const discordId = application.discord;
    
    // Validate Discord ID format (must be numeric snowflake)
    if (!/^\d{17,19}$/.test(discordId)) {
      return new Response(JSON.stringify({ 
        error: `Invalid Discord ID format: ${discordId}. Expected 17-19 digit snowflake.` 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    console.log(`Processing role assignment: userId=${userId}, discordId=${discordId}, action=${action}`);

    // Call Discord API to assign role
    const discordResponse = await assignDiscordRole(discordId, action);

    return new Response(JSON.stringify({ 
      success: true, 
      discordId, 
      action,
      discordResponse 
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

async function assignDiscordRole(discordId: string, action: string) {
  const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");
  const GUILD_ID = Deno.env.get("DISCORD_GUILD_ID");
  
  if (!DISCORD_BOT_TOKEN || !GUILD_ID) {
    return { error: "Discord credentials not configured" };
  }

  // Map database actions to Discord role IDs
  const roleMap: Record<string, string | undefined> = {
    accepted: Deno.env.get("DISCORD_ACCEPTED_ROLE_ID"),
    admin: Deno.env.get("DISCORD_ADMIN_ROLE_ID"),
    owner: Deno.env.get("DISCORD_OWNER_ROLE_ID"),
    rejected: Deno.env.get("DISCORD_REJECTED_ROLE_ID")
  };

  // 'remove' action: remove 'accepted' role from user
  if (action === 'remove') {
    const removeRoleId = Deno.env.get("DISCORD_ACCEPTED_ROLE_ID");
    if (!removeRoleId) {
      return { error: "DISCORD_ACCEPTED_ROLE_ID not configured" };
    }
    
    try {
      // Check if member exists
      const memberResponse = await fetch(
        `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}`,
        { headers: { 'Authorization': `Bot ${DISCORD_BOT_TOKEN}` } }
      );

      if (!memberResponse.ok) {
        const error = await memberResponse.text();
        return { error: `Member not found (${memberResponse.status}): ${error}` };
      }

      const member = await memberResponse.json();

      // Remove accepted role if present
      if (member.roles?.includes(removeRoleId)) {
        const response = await fetch(
          `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}/roles/${removeRoleId}`,
          { method: 'DELETE', headers: { 'Authorization': `Bot ${DISCORD_BOT_TOKEN}`, 'Content-Type': 'application/json' } }
        );
        if (!response.ok) {
          const error = await response.text();
          return { error: `Discord API error (${response.status}): ${error}` };
        }
        return { success: true, message: `Role removed from ${discordId}` };
      }
      return { success: true, message: "User doesn't have role to remove" };
    } catch (error) {
      return { error: `Failed to call Discord API: ${error}` };
    }
  }

  // All other actions (accepted, admin, owner, rejected): assign the role
  const roleId = roleMap[action];
  if (!roleId) {
    return { error: `No Discord role configured for action: ${action}` };
  }

  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}/roles/${roleId}`,
      { method: 'PUT', headers: { 'Authorization': `Bot ${DISCORD_BOT_TOKEN}`, 'Content-Type': 'application/json' } }
    );

    if (response.ok) {
      return { success: true, message: `Role ${action} assigned to ${discordId}` };
    }
    
    const error = await response.text();
    return { error: `Discord API error (${response.status}): ${error}` };
  } catch (error) {
    return { error: `Failed to call Discord API: ${error}` };
  }
}
