import { createClient } from "@supabase/supabase-js";

// Get environment variables with fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xylaoshplmsevlxzizrd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_p1y618_iSDWyTg5g75o_Pg_efLkfqIC';

// Debug environment variables
console.log("SUPABASE_URL:", supabaseUrl);
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
