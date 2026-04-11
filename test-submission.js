// Test script to debug Submit Application issues
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testApplicationSubmission() {
    console.log('Testing application submission...');
    
    try {
        // Test 1: Check if applications table exists and is accessible
        console.log('1. Testing applications table access...');
        const { data: tableData, error: tableError } = await supabase
            .from('applications')
            .select('count');
        
        if (tableError) {
            console.error('Table access error:', tableError);
            return;
        }
        console.log('Applications table accessible:', tableData);
        
        // Test 2: Check user authentication
        console.log('2. Testing authentication...');
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
            console.error('Auth error:', authError);
            return;
        }
        
        if (!session) {
            console.log('No active session - user needs to login first');
            return;
        }
        
        console.log('User authenticated:', session.user.email);
        
        // Test 3: Try a sample submission
        console.log('3. Testing sample submission...');
        const sampleData = {
            user_id: session.user.id,
            real_name: 'Test User',
            discord: '123456789012345678',
            age: '25',
            rdm: 'Random Deathmatch explanation',
            vdm: 'Vehicle Deathmatch explanation',
            metagaming: 'MetaGaming explanation',
            powergaming: 'PowerGaming explanation',
            char_name: 'Test Character',
            backstory: 'Test backstory',
            traits: 'Test traits',
            status: 'pending'
        };
        
        const { data: insertData, error: insertError } = await supabase
            .from('applications')
            .insert(sampleData)
            .select();
        
        if (insertError) {
            console.error('Insert error:', insertError);
            console.error('Error details:', JSON.stringify(insertError, null, 2));
            return;
        }
        
        console.log('Sample submission successful:', insertData);
        
        // Test 4: Clean up the test submission
        console.log('4. Cleaning up test submission...');
        if (insertData && insertData.length > 0) {
            const { error: deleteError } = await supabase
                .from('applications')
                .delete()
                .eq('id', insertData[0].id);
            
            if (deleteError) {
                console.error('Cleanup error:', deleteError);
            } else {
                console.log('Test submission cleaned up successfully');
            }
        }
        
        console.log('All tests completed successfully!');
        
    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

testApplicationSubmission();
