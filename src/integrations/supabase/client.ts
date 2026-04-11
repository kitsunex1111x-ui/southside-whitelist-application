import { createClient } from "@supabase/supabase-js";

// Debug environment variables
console.log("SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("SUPABASE_ANON_KEY exists:", !!import.meta.env.VITE_SUPABASE_ANON_KEY);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Handle both old and new Supabase key formats
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  });
  throw new Error('Supabase URL and Anon Key are required. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
