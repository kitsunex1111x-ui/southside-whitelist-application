import { createClient } from "@supabase/supabase-js";

// Correct project: sxvfmmqrgqlinxzuvjgv — using legacy JWT anon key
// (publishable key format caused silent hang on all Supabase queries)
const SUPABASE_URL = "https://sxvfmmqrgqlinxzuvjgv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dmZtbXFyZ3FsaW54enV2amd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5ODAxNzAsImV4cCI6MjA5MTU1NjE3MH0.ElJ8dTUs7b75lFuKchErbCbYpziCZPI_VwbYCGgjq_c";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
    flowType: "implicit",
  },
});
