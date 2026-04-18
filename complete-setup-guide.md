# 🚀 COMPLETE SETUP GUIDE - I'LL DO IT FOR YOU

## STEP 1: GET DISCORD SERVER ID
1. Open Discord
2. Right-click your Southside Roleplay server
3. Click "Copy Server ID"
4. Save: `GUILD_ID`

## STEP 2: GET SUPABASE SERVICE KEY
1. Go to: https://supabase.com/dashboard/project/sxvfmmqrgqlinxzuvjgv
2. Click Settings → API
3. Find "service_role" key
4. Click "Copy" 
5. Save: `SUPABASE_SERVICE_KEY`

## STEP 3: GET DISCORD ROLE IDs
1. In Discord, enable Developer Mode:
   - User Settings → Advanced → Developer Mode
2. Go to Server Settings → Roles
3. Right-click "Accepted" role → "Copy Role ID"
4. Right-click "Admin" role → "Copy Role ID" 
5. Right-click "Owner" role → "Copy Role ID"
6. Save: `ACCEPTED_ROLE_ID`, `ADMIN_ROLE_ID`, `OWNER_ROLE_ID`

## STEP 4: UPDATE BOT CONFIGURATION
I'll update `your-complete-bot.js` with these values:
```javascript
const GUILD_ID = 'YOUR_DISCORD_SERVER_ID';           // Replace with server ID
const SUPABASE_SERVICE_KEY = 'YOUR_SUPABASE_SERVICE_KEY'; // Replace with service key
const DISCORD_ROLES = {
    accepted: 'YOUR_ACCEPTED_ROLE_ID',   // Replace with accepted role ID
    admin: 'YOUR_ADMIN_ROLE_ID',         // Replace with admin role ID
    owner: 'YOUR_OWNER_ROLE_ID'          // Replace with owner role ID
};
```

## STEP 5: INSTALL DEPENDENCIES
```bash
cd your-bot-folder
npm install @supabase/supabase-js discord.js
```

## STEP 6: RUN BOT
```bash
node your-complete-bot.js
```

## ✅ WHAT WILL HAPPEN:
- Bot comes online
- Syncs all existing roles from database
- Auto-syncs every 5 minutes
- Assigns roles when applications are accepted
- Commands: `!syncroles`, `!botstatus`

## 🎯 FINAL RESULT:
Users will get Discord roles automatically when their whitelist applications are accepted!
