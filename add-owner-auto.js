// Auto-add current user as owner
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addCurrentUserAsOwner() {
  console.log('Finding current user and adding as owner...');
  
  try {
    // Get the most recent user from auth.users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error finding user:', usersError);
      return;
    }
    
    if (!users || users.users.length === 0) {
      console.log('No users found. Make sure you are logged in first.');
      return;
    }
    
    // Get the most recent user
    const currentUser = users.users.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    )[0];
    
    console.log('Found current user:', currentUser.email, 'ID:', currentUser.id);
    
    // Add owner role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: currentUser.id,
        role: 'owner'
      })
      .select();
    
    if (roleError) {
      console.error('Error adding owner role:', roleError);
    } else {
      console.log('Successfully added owner role for:', currentUser.email);
      console.log('User ID:', currentUser.id);
      console.log('Refresh your browser to see the Owner link in the navbar!');
    }
    
    // Verify the role was added
    const { data: verifyData } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', currentUser.id);
    
    console.log('Current user roles:', verifyData);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

addCurrentUserAsOwner();
