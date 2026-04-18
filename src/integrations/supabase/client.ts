import { createClient } from "@supabase/supabase-js";

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = envUrl && envUrl !== 'undefined' && envUrl !== '' 
  ? envUrl 
  : 'https://sxvfmmqrgqlinxzuvjgv.supabase.co';
const supabaseAnonKey = envKey && envKey !== 'undefined' && envKey !== '' 
  ? envKey 
  : 'sb_publishable_8pQ9kPHW74CZVjOPG3K1yA_8hWSuYxI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: false,
    persistSession: true,
    autoRefreshToken: true,
    flowType: "implicit",
  },
});
