import { createClient } from "@supabase/supabase-js";

// HARDCODED CORRECT SUPABASE PROJECT - sxvfmmqrgqlinxzuvjgv
const supabaseUrl = 'https://sxvfmmqrgqlinxzuvjgv.supabase.co';
const supabaseAnonKey = 'YOUR_NEW_ANON_KEY_HERE'; // Get this from new Supabase project

// Debug environment variables
console.log("=== SUPABASE CLIENT INIT ===");
console.log("VITE_SUPABASE_URL env var:", import.meta.env.VITE_SUPABASE_URL);
console.log("Using supabaseUrl:", supabaseUrl);
console.log("SUPABASE_ANON_KEY exists:", !!supabaseAnonKey);
console.log("SUPABASE_ANON_KEY length:", supabaseAnonKey?.length);

// Handle both old and new Supabase key formats
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  });
  throw new Error('Supabase URL and Anon Key are required. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
