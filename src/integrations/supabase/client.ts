import { createClient } from "@supabase/supabase-js";

// Single source of truth — never override from env vars
// (Vercel env vars were pointing to the wrong project)
const SUPABASE_URL = "https://sxvfmmqrgqlinxzuvjgv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_8pQ9kPHW74CZVjOPG3K1yA_8hWSuYxI";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    detectSessionInUrl: false,
    persistSession: true,
    autoRefreshToken: true,
    flowType: "implicit",
  },
});
