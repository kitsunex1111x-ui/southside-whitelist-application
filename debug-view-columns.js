// Debug the VIEW columns to see what's missing
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugViewColumns() {
    console.log('=== DEBUGGING VIEW COLUMNS ===');
    
    try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
            console.error('ERROR: No user logged in. Please login first!');
            return;
        }
        
        console.log('Current user ID:', session.user.id);
        
        // Test the VIEW with explicit column selection
        const { data: logsData, error: logsError } = await supabase
            .from("admin_logs_with_discord")
            .select("id, action, created_at, actor_user_id, provider, admin_name, admin_avatar")
            .limit(1);
        
        if (logsError) {
            console.error('VIEW error:', logsError);
            return;
        }
        
        console.log('VIEW columns test result:');
        console.log(logsData?.[0]);
        
        // Check if the user has Discord identity
        const { data: identitiesData, error: identitiesError } = await supabase
            .from("auth.identities")
            .select("provider, identity_data")
            .eq("user_id", session.user.id)
            .eq("provider", "discord");
        
        if (identitiesError) {
            console.log('Cannot check auth.identities (expected - auth schema)');
        } else {
            console.log('Discord identity check:', identitiesData);
        }
        
        // Test direct admin_logs query
        const { data: directData, error: directError } = await supabase
            .from("admin_logs")
            .select("*")
            .eq("actor_user_id", session.user.id)
            .limit(1);
        
        if (directError) {
            console.log('Direct admin_logs error:', directError);
        } else {
            console.log('Direct admin_logs test:', directData?.[0]);
        }
        
    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

debugViewColumns();
