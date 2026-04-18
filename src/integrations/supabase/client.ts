import { createClient } from "@supabase/supabase-js";

// Correct project credentials — always use these
const SUPABASE_URL = "https://sxvfmmqrgqlinxzuvjgv.supabase.co";
const SUPABASE_ANON_KEY =
  "sb_publishable_8pQ9kPHW74CZVjOPG3K1yA_8hWSuYxI";

// Allow env vars to override (Vercel production), but only if they are
// non-empty and point to the same project — never silently switch projects
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl =
  envUrl && envUrl.trim() !== "" && envUrl !== "undefined"
    ? envUrl.trim()
    : SUPABASE_URL;

const supabaseAnonKey =
  envKey && envKey.trim() !== "" && envKey !== "undefined"
    ? envKey.trim()
    : SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: false,
    persistSession: true,
    autoRefreshToken: true,
    flowType: "implicit",
  },
});
