// Check current user's role in user_roles table
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserRole() {
    console.log('=== CHECKING USER ROLE ===');
    
    try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
            console.error('ERROR: No user logged in. Please login first!');
            return;
        }
        
        console.log('Current user ID:', session.user.id);
        console.log('Current user email:', session.user.email);
        
        // Check user_roles for this user
        const { data: rolesData, error: rolesError } = await supabase
            .from("user_roles")
            .select("*")
            .eq("user_id", session.user.id);
        
        if (rolesError) {
            console.error('Error checking user_roles:', rolesError);
            return;
        }
        
        if (!rolesData || rolesData.length === 0) {
            console.log('NO ROLE FOUND: User has no role in user_roles table');
            console.log('This explains why Activity Log shows "No activity yet"');
            console.log('RLS policies require user to have owner role to see admin logs');
            return;
        }
        
        console.log('User roles found:');
        rolesData.forEach(role => {
            console.log(`- Role: ${role.role} (created: ${role.created_at})`);
        });
        
        const hasOwnerRole = rolesData.some(r => r.role === 'owner');
        const hasAdminRole = rolesData.some(r => r.role === 'admin');
        
        console.log(`\nRole Summary:`);
        console.log(`- Owner: ${hasOwnerRole ? 'YES' : 'NO'}`);
        console.log(`- Admin: ${hasAdminRole ? 'YES' : 'NO'}`);
        
        if (!hasOwnerRole) {
            console.log('\nRECOMMENDATION: User needs owner role to see Activity Log');
            console.log('Run this SQL to add owner role:');
            console.log(`INSERT INTO user_roles (user_id, role, created_at) VALUES ('${session.user.id}', 'owner', NOW());`);
        }
        
        // Test admin_logs access
        console.log('\n=== TESTING ADMIN_LOGS ACCESS ===');
        const { data: logsData, error: logsError } = await supabase
            .from("admin_logs_with_discord")
            .select("*")
            .limit(1);
        
        if (logsError) {
            console.log('admin_logs_with_discord access error:', logsError);
            console.log('Error code:', logsError.code);
            console.log('Error message:', logsError.message);
        } else {
            console.log('admin_logs_with_discord access: SUCCESS');
            console.log('Sample log entry:', logsData?.[0]);
        }
        
    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

checkUserRole();
