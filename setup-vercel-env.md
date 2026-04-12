# Vercel Environment Setup Guide

## Step 1: Disconnect Supabase Integration
1. Go to https://vercel.com/dashboard
2. Select your project: `southside-whitelist-application`
3. Click on **Integrations** tab
4. Find **Supabase** integration
5. Click **Disconnect** or **Remove**

## Step 2: Add Environment Variables Manually
Go to Project → Settings → Environment Variables

Add these EXACT variables:

### Required Variables:
```
Name: VITE_SUPABASE_URL
Value: https://ebcgyxvtdfourghinppu.supabase.co
```

```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViY2d5eHZ0ZGZvdXJnaGlucHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NzYzODgsImV4cCI6MjA5MTA1MjM4OH0.e8FaicZYXnc5yqeME8svteQbqiTSC33Zr9bS76RZn20
```

## Step 3: Redeploy
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **Redeploy** button
4. Check **"Use existing Build Cache"** → UNCHECK THIS (force fresh build)
5. Click **Redeploy**

## Step 4: Test
1. Wait for deployment to finish (2-3 minutes)
2. Go to: https://southside-whitelist-application.vercel.app
3. Open DevTools → Network tab
4. Click **Discord login**
5. Check the Network request for `authorize`
6. Look for `redirect_to` parameter - it should show vercel.app URL, NOT localhost

## Expected Result:
The Discord OAuth URL should show:
```
redirect_to=https%3A%2F%2Fsouthside-whitelist-application.vercel.app%2Fauth%2Fcallback
```

If it still shows localhost, the issue is deployment caching - repeat Step 3 with cache clearing.
