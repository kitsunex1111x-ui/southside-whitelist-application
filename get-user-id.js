// Get current user ID for RLS debugging
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function getCurrentUserId() {
    console.log('=== GETTING CURRENT USER ID ===');
    
    try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
            console.error('ERROR: No user logged in. Please login first!');
            return;
        }
        
        console.log('Current user ID:', session.user.id);
        console.log('Current user email:', session.user.email);
        console.log('Current user provider:', session.user.app_metadata?.provider || 'unknown');
        
        // Generate SQL to check user role
        console.log('\n=== SQL TO CHECK USER ROLE ===');
        console.log('Run this in Supabase SQL editor:');
        console.log(`SELECT user_id, role, created_at FROM public.user_roles WHERE user_id = '${session.user.id}';`);
        
        // Generate SQL to add owner role if needed
        console.log('\n=== SQL TO ADD OWNER ROLE ===');
        console.log('Run this in Supabase SQL editor if role is missing:');
        console.log(`INSERT INTO public.user_roles (user_id, role, created_at) VALUES ('${session.user.id}', 'owner', NOW()) ON CONFLICT (user_id) DO UPDATE SET role = excluded.role;`);
        
    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

getCurrentUserId();
