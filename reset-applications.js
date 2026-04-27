// Reset all applications script
// Run this in browser console while logged in as admin/owner

const SUPABASE_URL = "https://sxvfmmqrgqlinxzuvjgv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dmZtbXFyZ3FsaW54enV2amd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5ODAxNzAsImV4cCI6MjA5MTU1NjE3MH0.ElJ8dTUs7b75lFuKchErbCbYpziCZPI_VwbYCGgjq_c";

function getAuthHeader() {
  try {
    const projectRef = SUPABASE_URL.replace("https://", "").split(".")[0];
    const storageKey = `sb-${projectRef}-auth-token`;
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      const token = parsed?.access_token || parsed?.session?.access_token;
      if (token) return `Bearer ${token}`;
    }
  } catch {
    // Fallback
  }
  return `Bearer ${SUPABASE_ANON_KEY}`;
}

async function deleteApplicationsByType(type) {
  try {
    const authHeader = getAuthHeader();
    // Get all IDs for this type
    const res = await fetch(`${SUPABASE_URL}/rest/v1/applications?type=eq.${type}&select=id`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: authHeader,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    
    if (!res.ok) {
      console.error(`Failed to fetch ${type} applications:`, await res.text());
      return { error: true };
    }
    
    const data = await res.json();
    console.log(`Found ${data.length} ${type} applications`);
    
    if (data.length === 0) {
      return { deleted: 0 };
    }
    
    // Delete all records of this type
    const deleteRes = await fetch(`${SUPABASE_URL}/rest/v1/applications?type=eq.${type}`, {
      method: "DELETE",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: authHeader,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
    });
    
    if (!deleteRes.ok) {
      console.error(`Failed to delete ${type} applications:`, await deleteRes.text());
      return { error: true };
    }
    
    return { deleted: data.length };
  } catch (e) {
    console.error(`Error with ${type}:`, e);
    return { error: true };
  }
}

async function resetAllApplications() {
  console.log("🗑️ Resetting all applications...\n");
  
  const types = ["whitelist", "gang", "staff"];
  
  for (const type of types) {
    console.log(`Processing ${type} applications...`);
    const result = await deleteApplicationsByType(type);
    if (result.error) {
      console.log(`❌ ${type}: Error`);
    } else {
      console.log(`✅ ${type}: Deleted ${result.deleted || 0} records`);
    }
  }
  
  console.log("\n✨ Done! Refresh the page to see changes.");
}

// Run it
resetAllApplications();
