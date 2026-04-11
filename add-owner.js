const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addOwner() {
  console.log('Adding owner role to users...');
  
  // Discord ID: 1266017433010045059
  // Google Email: kitsunex1111x@gmail.com
  
  try {
    // First, let's check if users exist and get their user IDs
    console.log('Looking up users...');
    
    // For Discord user - we need to find them by their Discord ID in user_metadata
    const { data: discordUsers, error: discordError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', '1266017433010045059');
    
    if (discordError) {
      console.log('Discord user lookup error:', discordError);
    }
    
    // For Google user - we need to find them by email
    const { data: googleUsers, error: googleError } = await supabase.auth.admin.listUsers();
    
    if (googleError) {
      console.log('Google user lookup error:', googleError);
    }
    
    // Since we can't easily look up by email without admin access,
    // let's create a manual entry for the owner role
    console.log('Creating owner role entries...');
    
    // Add Discord user as owner
    const { data: discordRole, error: discordRoleError } = await supabase
      .from('user_roles')
      .upsert([
        {
          user_id: '1266017433010045059',
          role: 'owner'
        }
      ])
      .select();
    
    if (discordRoleError) {
      console.error('Error adding Discord owner role:', discordRoleError);
    } else {
      console.log('Discord owner role added successfully:', discordRole);
    }
    
    // For Google, we'll need to get the user ID after they first log in
    console.log('\n=== INSTRUCTIONS ===');
    console.log('1. Discord user (ID: 1266017433010045059) has been added as owner');
    console.log('2. For Google user (kitsunex1111x@gmail.com), you need to:');
    console.log('   - First log in with Google at https://localhost:3000/auth');
    console.log('   - Then run this script again with the actual user ID');
    console.log('3. Or manually add the Google user ID to the user_roles table');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

addOwner();
