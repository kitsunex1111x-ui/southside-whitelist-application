import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sxvfmmqrgqlinxzuvjgv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dmZtbXFyZ3FsaW54enV2amd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NjI0MDAsImV4cCI6MjA1MjIzODQwMH0.p1yL8kQx_8hKjN8q2Y3X4w5z6t7u8v9w0x1y2z3a4b';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: false,
    persistSession: true,
    autoRefreshToken: true,
    flowType: "implicit",
  },
});
