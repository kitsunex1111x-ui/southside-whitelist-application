import { createClient } from "@supabase/supabase-js";

// Get environment variables with fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ebcgyxvtdfourghinppu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViY2d5eHZ0ZGZvdXJnaGlucHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NzYzODgsImV4cCI6MjA5MTA1MjM4OH0.e8FaicZYXnc5yqeME8svteQbqiTSC33Zr9bS76RZn20';

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
