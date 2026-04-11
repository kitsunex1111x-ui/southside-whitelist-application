// DIRECT OWNER SETUP - Using your actual user info
// Discord ID: 1266017433010045059
// Google Email: kitsunex1111x@gmail.com

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function addDirectOwner() {
    console.log('=== DIRECT OWNER SETUP ===');
    
    try {
        // Method 1: Try Discord user ID
        console.log('Adding Discord user as owner...');
        const { data: discordData, error: discordError } = await supabase
            .from('user_roles')
            .upsert({
                user_id: '1266017433010045059',
                role: 'owner'
            })
            .select();
        
        if (!discordError) {
            console.log('✅ Discord user added as owner successfully!');
            console.log('User ID: 1266017433010045059');
        } else {
            console.log('❌ Error adding Discord user:', discordError);
        }
        
        // Method 2: Try to find Google user by email
        console.log('Looking for Google user...');
        
        // Get all users to find the Google email
        const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
        
        if (usersError) {
            console.log('❌ Error listing users:', usersError);
            return;
        }
        
        const googleUser = users.users.find(u => u.email === 'kitsunex1111x@gmail.com');
        
        if (googleUser) {
            console.log(`Found Google user: ${googleUser.email}, ID: ${googleUser.id}`);
            
            const { data: googleData, error: googleError } = await supabase
                .from('user_roles')
                    .upsert({
                        user_id: googleUser.id,
                        role: 'owner'
                    })
                    .select();
            
            if (!googleError) {
                console.log('✅ Google user added as owner successfully!');
                console.log('User ID:', googleUser.id);
            } else {
                console.log('❌ Error adding Google user:', googleError);
            }
        } else {
            console.log('❌ Google user not found. They need to log in first.');
        }
        
        // Verify both roles
        console.log('Verifying owner roles...');
        const { data: verifyData } = await supabase
            .from('user_roles')
            .select('*')
            .in('user_id', ['1266017433010045059', googleUser?.id]);
        
        console.log('Current owner roles:', verifyData);
        console.log('');
        console.log('=== SETUP COMPLETE ===');
        console.log('✅ Discord user (1266017433010045059) added as owner');
        if (googleUser) {
            console.log('✅ Google user (kitsunex1111x@gmail.com) added as owner');
        }
        console.log('Refresh your dashboard to see Owner links!');
        
    } catch (error) {
        console.error('Error:', error);
    }
}

addDirectOwner();
