// Copy this script and paste it into your browser console while logged in
// Open your browser at https://localhost:3000/dashboard
// Press F12 to open developer tools
// Go to Console tab
// Paste this entire script and press Enter

(async function addOwnerRole() {
  console.log('Adding owner role to current user...');
  
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('No active session found. Make sure you are logged in!');
      return;
    }
    
    console.log('Current user:', session.user.email);
    console.log('User ID:', session.user.id);
    
    // Add owner role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: session.user.id,
        role: 'owner'
      })
      .select();
    
    if (roleError) {
      console.error('Error adding owner role:', roleError);
    } else {
      console.log('SUCCESS! Owner role added for:', session.user.email);
      console.log('Role data:', roleData);
      console.log('Refresh the page to see the Owner link in the navbar!');
    }
    
    // Verify the role was added
    const { data: verifyData } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', session.user.id);
    
    console.log('Your current roles:', verifyData);
    
  } catch (error) {
    console.error('Error:', error);
  }
})();
