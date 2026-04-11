// ONE-CLICK OWNER SETUP
// 1. Copy this entire script
// 2. Go to https://localhost:3000/dashboard (make sure you're logged in)
// 3. Press F12 to open DevTools
// 4. Go to Console tab
// 5. Paste this script and press Enter
// 6. Refresh the page - you'll see "Owner" in the navbar!

(async function() {
    console.log('=== AUTOMATIC OWNER SETUP ===');
    console.log('Setting up owner access...');
    
    try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
            console.error('ERROR: You must be logged in first!');
            console.log('Please go to https://localhost:3000/auth and log in, then try again.');
            return;
        }
        
        console.log(`Found user: ${session.user.email}`);
        console.log(`User ID: ${session.user.id}`);
        
        // Add owner role
        console.log('Adding owner role...');
        const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .upsert({
                user_id: session.user.id,
                role: 'owner'
            })
            .select();
        
        if (roleError) {
            console.error('ERROR adding owner role:', roleError);
            return;
        }
        
        console.log('SUCCESS! Owner role added! ');
        console.log('User:', session.user.email);
        console.log('Role:', roleData);
        
        // Verify
        const { data: verifyData } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', session.user.id);
        
        console.log('Your roles:', verifyData);
        console.log('');
        console.log('=== NEXT STEPS ===');
        console.log('1. REFRESH this page (F5)');
        console.log('2. Look for "Owner" link in the navigation bar');
        console.log('3. Click "Owner" to access your owner dashboard!');
        console.log('=== DONE! ===');
        
    } catch (error) {
        console.error('ERROR:', error);
    }
})();
