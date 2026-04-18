#!/bin/bash
echo "Deploying Discord role function..."
npx supabase functions deploy sync-discord-roles
echo "Function deployed!"
echo "Now set these environment variables in Supabase Dashboard:"
echo "- DISCORD_BOT_TOKEN"
echo "- DISCORD_GUILD_ID"
echo "- DISCORD_ACCEPTED_ROLE_ID"
