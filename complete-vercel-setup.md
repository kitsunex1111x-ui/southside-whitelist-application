# 🚀 COMPLETE VERCEL SETUP - I'LL HELP YOU

## ✅ YOUR SITE IS RUNNING:
**https://southside-whitelist-application-ovr51gee9.vercel.app**

## 🎯 **WHAT NEEDS TO BE DONE:**

### **STEP 1: DISCORD OAUTH SETUP**
Your Discord Developer Portal needs the correct redirect:

**Current Redirect:**
```
https://sxvfmmqrgqlinxzuvjgv.supabase.co/auth/v1/callback
```

**New Redirect for Vercel:**
```
https://southside-whitelist-application-ovr51gee9.vercel.app/auth/callback
```

### **Step 2: UPDATE DISCORD DEVELOPER PORTAL**
1. Go to: https://discord.com/developers/applications
2. Select your application: `southside roleplay`
3. Go to "OAuth2" → "Redirects"
4. **Add new redirect:**
   ```
   https://southside-whitelist-application-ovr51gee9.vercel.app/auth/callback
   ```
5. Save changes

### **STEP 3: UPDATE YOUR CODE**
I need to update these files:

**1. src/integrations/supabase/client.ts**
```typescript
// Update Supabase URL for production
const supabaseUrl = 'https://sxvfmmqrgqlinxzuvjgv.supabase.co';
const supabaseAnonKey = 'sb_publishable_8pQ9kPHW74CZVjOPG3K1yA_8hWSuYxI';
```

**2. src/pages/Auth.tsx**
```typescript
// Update OAuth redirect URL
const handleDiscordLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
            redirectTo: `${window.location.origin}/auth/callback`, // This will work for both localhost and Vercel
        }
    });
};
```

### **STEP 4: DEPLOY TO VERCEL**
```bash
vercel --prod
```

### **STEP 5: UPDATE DISCORD BOT**
The bot needs to run 24/7 for role sync:
- Deploy to VPS/Railway/Replit
- Use serverless Discord.js hosting

## 🎮 **TESTING:**
1. Deploy updates to Vercel
2. Test Discord OAuth on your site
3. Accept a test application
4. Verify Discord role assignment

## ✅ **RESULT:**
Your site will work perfectly on Vercel with Discord OAuth and automatic role assignment!

**I'll help you with each step - just tell me what you want to do first!**
