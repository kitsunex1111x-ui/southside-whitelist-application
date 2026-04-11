// Verify Discord user has owner role and Activity Log access
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDiscordOwner() {
    console.log('=== VERIFYING DISCORD OWNER ACCESS ===');
    
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
        
        // Check if this user has owner role
        const { data: rolesData, error: rolesError } = await supabase
            .from("user_roles")
            .select("*")
            .eq("user_id", session.user.id)
            .eq("role", "owner");
        
        if (rolesError) {
            console.error('Error checking user_roles:', rolesError);
            console.log('This might indicate RLS is blocking access to user_roles table');
            return;
        }
        
        if (!rolesData || rolesData.length === 0) {
            console.log('NO OWNER ROLE: User does not have owner role');
            console.log('Running add-owner.sql to assign owner role...');
            
            // Add owner role for this user
            const { error: insertError } = await supabase
                .from("user_roles")
                .insert({
                    user_id: session.user.id,
                    role: "owner"
                });
            
            if (insertError) {
                console.error('Error adding owner role:', insertError);
                if (insertError.message.includes('duplicate')) {
                    console.log('User already has a role, updating to owner...');
                    const { error: updateError } = await supabase
                        .from("user_roles")
                        .update({ role: "owner" })
                        .eq("user_id", session.user.id);
                    
                    if (updateError) {
                        console.error('Error updating to owner role:', updateError);
                    } else {
                        console.log('SUCCESS: Updated to owner role');
                    }
                }
            } else {
                console.log('SUCCESS: Added owner role');
            }
        } else {
            console.log('SUCCESS: User already has owner role');
        }
        
        // Test Activity Log access
        console.log('\n=== TESTING ACTIVITY LOG ACCESS ===');
        const { data: logsData, error: logsError } = await supabase
            .from("admin_logs_with_discord")
            .select("*")
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (logsError) {
            console.log('Activity Log access error:', logsError);
            console.log('Error code:', logsError.code);
            console.log('Error message:', logsError.message);
            
            if (logsError.code === 'PGRST301') {
                console.log('RLS issue: User needs owner role to access admin_logs');
            }
        } else {
            console.log('SUCCESS: Activity Log access granted');
            console.log(`Found ${logsData?.length || 0} log entries`);
            
            if (logsData && logsData.length > 0) {
                console.log('Sample log entry:');
                console.log(`- ${logsData[0].admin_name || 'Unknown'}: ${logsData[0].action} at ${new Date(logsData[0].created_at).toLocaleString()}`);
            }
        }
        
        // Check all user_roles
        console.log('\n=== ALL USER_ROLES ===');
        const { data: allRoles, error: allRolesError } = await supabase
            .from("user_roles")
            .select("*");
        
        if (allRolesError) {
            console.log('Error fetching all user_roles (expected if not owner):', allRolesError.code);
        } else {
            console.log('All user roles:');
            allRoles?.forEach(role => {
                console.log(`- User ${role.user_id.slice(0, 8)}... has role: ${role.role}`);
            });
        }
        
    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

verifyDiscordOwner();
