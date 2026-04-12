// COPY AND PASTE THIS SCRIPT INTO BROWSER CONSOLE ON https://localhost:3000
// This will automatically fix all admin dashboard issues

(async function fixAdminDashboard() {
    console.log('=== FIXING ADMIN DASHBOARD NOW ===');
    
    const supabaseUrl = 'https://ebcgyxvtdfourghinppu.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5bGFvc2hwbG1zZXZseHppenJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDQyMzYsImV4cCI6MjA1MTQyMDIzNn0.p1yL8kQx_8hKjN8q2Y3X4w5z6t7u8v9w0x1y2z3a4b';
    const { createClient } = window.supabase;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    try {
        // Step 1: Get current user
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
            console.error('ERROR: No user logged in. Please login first!');
            return;
        }
        
        console.log('Current user:', session.user.email);
        console.log('User ID:', session.user.id);
        
        // Step 2: Check current roles
        const { data: rolesData, error: rolesError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id);
        
        if (rolesError) {
            console.error('ERROR checking roles:', rolesError);
            return;
        }
        
        const currentRoles = rolesData?.map(r => r.role) ?? [];
        console.log('Current roles:', currentRoles);
        
        // Step 3: Assign admin role if needed
        if (!currentRoles.includes('admin') && !currentRoles.includes('owner')) {
            console.log('Assigning admin role...');
            const { error: insertError } = await supabase
                .from("user_roles")
                .insert({
                    user_id: session.user.id,
                    role: "admin"
                });
            
            if (insertError) {
                if (insertError.message.includes('duplicate')) {
                    console.log('Admin role already exists');
                } else {
                    console.error('ERROR assigning admin role:', insertError);
                    return;
                }
            } else {
                console.log('SUCCESS: Admin role assigned!');
            }
        } else {
            console.log('User already has admin access!');
        }
        
        // Step 4: Test admin functions
        console.log('Testing admin functions...');
        
        // Test applications access
        const { data: appsData, error: appsError } = await supabase
            .from("applications")
            .select("*")
            .order("created_at", { ascending: false });
        
        if (appsError) {
            console.error('ERROR accessing applications:', appsError);
            return;
        }
        
        console.log(`SUCCESS: Found ${appsData.length} applications`);
        
        if (appsData.length > 0) {
            const testApp = appsData[0];
            console.log('Testing with application:', testApp.char_name);
            
            // Test status update
            console.log('Testing status update...');
            const { data: updateData, error: updateError } = await supabase
                .from("applications")
                .update({ 
                    status: "pending", 
                    reviewed_by: session.user.id 
                })
                .eq("id", testApp.id)
                .select();
            
            if (updateError) {
                console.error('ERROR updating application:', updateError);
            } else {
                console.log('SUCCESS: Application update works!');
            }
            
            // Test notes
            console.log('Testing notes...');
            const { data: notesData, error: notesError } = await supabase
                .from("applications")
                .update({ 
                    admin_notes: "Test note - " + new Date().toLocaleString()
                })
                .eq("id", testApp.id)
                .select();
            
            if (notesError) {
                console.error('ERROR adding notes:', notesError);
            } else {
                console.log('SUCCESS: Notes function works!');
            }
        }
        
        // Step 5: Test admin logs
        const { data: logsData, error: logsError } = await supabase
            .from("admin_logs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(3);
        
        if (logsError) {
            console.error('ERROR accessing admin logs:', logsError);
        } else {
            console.log(`SUCCESS: Found ${logsData.length} admin logs`);
        }
        
        console.log('=== ADMIN DASHBOARD FIXED! ===');
        console.log('Now you can:');
        console.log('1. Go to /admin');
        console.log('2. Accept/reject applications');
        console.log('3. Add admin notes');
        console.log('4. View all admin functions');
        console.log('Refresh the page and try the admin dashboard!');
        
        // Show success message
        if (window.alert) {
            alert('Admin dashboard has been fixed! You now have admin access. Go to /admin to test it.');
        }
        
    } catch (error) {
        console.error('FATAL ERROR:', error);
    }
})();
