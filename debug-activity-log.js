// Debug script to check Activity Log issues
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugActivityLog() {
    console.log('=== DEBUGGING ACTIVITY LOG ===');
    
    try {
        // Step 1: Check if admin_logs table exists
        console.log('1. Checking admin_logs table...');
        const { data: tableData, error: tableError } = await supabase
            .from('admin_logs')
            .select('count');
        
        if (tableError) {
            console.error('Table access error:', tableError);
            return;
        }
        console.log('admin_logs table accessible:', tableData);
        
        // Step 2: Check current logs
        console.log('2. Checking current admin_logs...');
        const { data: logsData, error: logsError } = await supabase
            .from('admin_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (logsError) {
            console.error('Error fetching logs:', logsError);
        } else {
            console.log(`Found ${logsData?.length || 0} existing log entries`);
            logsData?.forEach(log => {
                console.log(`- ${log.action} by ${log.admin_id} at ${log.created_at}`);
            });
        }
        
        // Step 3: Check auth.identities for Discord users
        console.log('3. Checking auth.identities for Discord users...');
        const { data: identitiesData, error: identitiesError } = await supabase
            .from('auth.identities')
            .select('user_id, provider, identity_data')
            .eq('provider', 'discord')
            .limit(5);
        
        if (identitiesError) {
            console.error('Error fetching identities:', identitiesError);
        } else {
            console.log(`Found ${identitiesData?.length || 0} Discord identities`);
            identitiesData?.forEach(identity => {
                const name = identity.identity_data?.name || 'Unknown';
                const avatar = identity.identity_data?.avatar_url || 'No avatar';
                console.log(`- User ${identity.user_id}: ${name} (${avatar ? 'has avatar' : 'no avatar'})`);
            });
        }
        
        // Step 4: Test the join query
        console.log('4. Testing the join query...');
        const { data: joinData, error: joinError } = await supabase
            .from('admin_logs')
            .select(`
                *,
                auth_identities!inner (
                    provider,
                    identity_data->>'name' as admin_name,
                    identity_data->>'avatar_url' as admin_avatar
                )
            `)
            .eq('auth_identities.provider', 'discord')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (joinError) {
            console.error('Error with join query:', joinError);
        } else {
            console.log(`Join query successful: ${joinData?.length || 0} results`);
            joinData?.forEach(log => {
                console.log(`- ${log.auth_identities?.[0]?.admin_name || 'Unknown'}: ${log.action}`);
            });
        }
        
        // Step 5: Add test log entry if needed
        if (!logsData || logsData.length === 0) {
            console.log('5. Adding test log entry...');
            
            // Get a Discord user ID from identities
            const discordUserId = identitiesData?.[0]?.user_id;
            
            if (discordUserId) {
                const { error: insertError } = await supabase
                    .from('admin_logs')
                    .insert({
                        admin_id: discordUserId,
                        action: 'test_activity',
                        target_id: discordUserId,
                        details: { message: 'Test activity log entry' }
                    });
                
                if (insertError) {
                    console.error('Error inserting test log:', insertError);
                } else {
                    console.log('Test log entry added successfully');
                }
            } else {
                console.log('No Discord users found to create test log');
            }
        }
        
        console.log('=== DEBUG COMPLETE ===');
        
    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

debugActivityLog();
