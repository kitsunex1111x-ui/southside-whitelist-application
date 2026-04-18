# Discord Developer Portal Update Checklist

## 🚀 **REQUIRED UPDATES AFTER DEPLOYMENT**

### **Discord Developer Portal**
1. **Go to:** https://discord.com/developers/applications
2. **Select your application:** `southside roleplay`
3. **Navigate to:** OAuth2 → Redirects
4. **ADD/UPDATE redirect URL:**
   ```
   https://southside-whitelist-application.vercel.app/auth/callback
   ```
5. **Save changes**

### **Supabase Auth Settings**
1. **Go to:** Your Supabase Dashboard
2. **Navigate to:** Authentication → URL Configuration  
3. **ADD/UPDATE redirect URLs:**
   ```
   https://southside-whitelist-application.vercel.app/*
   https://southside-whitelist-application.vercel.app/auth/callback
   ```
4. **Keep localhost for testing:**
   ```
   http://localhost:3000/*
   http://localhost:3000/auth/callback
   ```

## ✅ **DEPLOYMENT COMMAND**

```bash
vercel --prod
```

## 🎯 **AFTER DEPLOYMENT**

1. **Deploy to Vercel** with latest changes
2. **Update Discord Portal** with new redirect URL
3. **Update Supabase Auth** with new URLs
4. **Test Discord OAuth** on your live site
5. **Verify Activity Log** shows correct admin names

## 🔍 **VERIFICATION**

- ✅ Discord login redirects to correct Vercel URL
- ✅ No "Domains, protocols and ports must match" error
- ✅ Activity Log displays proper admin names
- ✅ All Discord role management works correctly

---

## 📋 **SUMMARY**

**Old URL:** `https://southside-whitelist-application-ovr51gee9.vercel.app`
**New URL:** `https://southside-whitelist-application.vercel.app`

**Action Required:** Update both Discord Developer Portal AND Supabase Auth Settings with the new URL.

Your system will work perfectly after these updates! 🚀
