// Debug OAuth redirect issue
// Run this in browser console on your Vercel site to debug the OAuth flow

console.log("=== OAuth Debug Info ===");
console.log("Current URL:", window.location.href);
console.log("Origin:", window.location.origin);

// Check if we're on the correct domain
if (window.location.origin === "https://southside-whitelist-application.vercel.app") {
  console.log("✅ Correct domain detected");
} else {
  console.log("❌ Wrong domain detected:", window.location.origin);
}

// Check Supabase client configuration
if (window.supabase) {
  console.log("Supabase client found");
  console.log("Supabase URL:", window.supabase.supabaseUrl);
} else {
  console.log("❌ Supabase client not found");
}

// Test Discord OAuth manually
const discordClientId = "1492197009950769262";
const redirectUri = "https://southside-whitelist-application.vercel.app/auth/callback";
const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email%20identify`;

console.log("Manual Discord OAuth URL:", discordAuthUrl);
console.log("Expected redirect URI:", redirectUri);
