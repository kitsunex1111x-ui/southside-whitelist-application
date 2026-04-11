// Create test admin log entries
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestLogs() {
    console.log('=== CREATING TEST ADMIN LOGS ===');
    
    try {
        // Use a known user ID for test logs (from the add-owner.sql file)
        const testUserId = '1266017433010045059';
        console.log('Using test user ID:', testUserId);
        
        // Create test log entries
        const testLogs = [
            {
                admin_id: testUserId,
                action: 'accept_application',
                target_id: 'test-app-1',
                details: { 
                    status: 'accepted', 
                    application_id: 'test-app-1',
                    applicant_name: 'Test User 1'
                }
            },
            {
                admin_id: testUserId,
                action: 'reject_application',
                target_id: 'test-app-2',
                details: { 
                    status: 'rejected', 
                    application_id: 'test-app-2',
                    applicant_name: 'Test User 2'
                }
            },
            {
                admin_id: testUserId,
                action: 'add_role',
                target_id: testUserId,
                details: { 
                    role: 'admin', 
                    discord: '123456789012345678'
                }
            },
            {
                admin_id: testUserId,
                action: 'add_notes',
                target_id: 'test-app-3',
                details: { 
                    notes: 'This applicant shows great potential', 
                    application_id: 'test-app-3'
                }
            },
            {
                admin_id: testUserId,
                action: 'remove_role',
                target_id: 'test-user-id',
                details: { 
                    role: 'admin',
                    reason: 'User request'
                }
            }
        ];
        
        console.log('Adding test log entries...');
        
        for (const log of testLogs) {
            const { data, error } = await supabase
                .from('admin_logs')
                .insert(log)
                .select();
            
            if (error) {
                console.error('Error inserting log:', error);
            } else {
                console.log('Test log added:', log.action);
            }
        }
        
        // Verify the logs were added
        const { data: logsData, error: logsError } = await supabase
            .from('admin_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (logsError) {
            console.error('Error fetching logs:', logsError);
        } else {
            console.log(`\nSUCCESS: Created ${logsData?.length || 0} admin log entries`);
            logsData?.forEach(log => {
                console.log(`- ${log.action} at ${new Date(log.created_at).toLocaleString()}`);
            });
        }
        
        console.log('\n=== TEST LOGS CREATED ===');
        console.log('Now go to the Owner Dashboard (/owner) to see the Activity Log!');
        
    } catch (error) {
        console.error('Error creating test logs:', error);
    }
}

createTestLogs();
