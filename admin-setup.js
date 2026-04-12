// Admin Setup Script - Run this in browser console on https://localhost:3000
// This will assign admin role to the current user and test admin functions

(async function adminSetup() {
    console.log('=== ADMIN SETUP SCRIPT ===');
    
    // Initialize Supabase
    const supabaseUrl = 'https://ebcgyxvtdfourghinppu.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5bGFvc2hwbG1zZXZseHppenJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDQyMzYsImV4cCI6MjA1MTQyMDIzNn0.p1yL8kQx_8hKjN8q2Y3X4w5z6t7u8v9w0x1y2z3a4b';
    const { createClient } = window.supabase;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    try {
        // Step 1: Check current user
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
            console.error('No user session found. Please login first.');
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
            console.error('Error checking roles:', rolesError);
        } else {
            const currentRoles = rolesData?.map(r => r.role) ?? [];
            console.log('Current roles:', currentRoles);
            
            if (currentRoles.includes('admin') || currentRoles.includes('owner')) {
                console.log('User already has admin access!');
            } else {
                console.log('User does not have admin access yet.');
            }
        }
        
        // Step 3: Assign admin role (uncomment to use)
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
                console.error('Error assigning admin role:', insertError);
            }
        } else {
            console.log('Admin role assigned successfully!');
        }
        
        // Step 4: Test admin functions
        console.log('Testing admin functions...');
        
        // Test fetching applications
        const { data: appsData, error: appsError } = await supabase
            .from("applications")
            .select("*")
            .order("created_at", { ascending: false });
        
        if (appsError) {
            console.error('Error fetching applications:', appsError);
        } else {
            console.log(`Found ${appsData.length} applications`);
            if (appsData.length > 0) {
                const testApp = appsData[0];
                console.log('Test application:', testApp.char_name, '-', testApp.status);
                
                // Test updating application status
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
                    console.error('Error updating application:', updateError);
                } else {
                    console.log('Application update successful!');
                }
                
                // Test adding admin notes
                console.log('Testing admin notes...');
                const { data: notesData, error: notesError } = await supabase
                    .from("applications")
                    .update({ 
                        admin_notes: "Test admin note - " + new Date().toLocaleString()
                    })
                    .eq("id", testApp.id)
                    .select();
                
                if (notesError) {
                    console.error('Error adding notes:', notesError);
                } else {
                    console.log('Admin notes added successfully!');
                }
            } else {
                console.log('No applications found to test with');
            }
        }
        
        // Step 5: Test admin logs
        const { data: logsData, error: logsError } = await supabase
            .from("admin_logs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5);
        
        if (logsError) {
            console.error('Error fetching admin logs:', logsError);
        } else {
            console.log(`Found ${logsData.length} admin log entries`);
        }
        
        console.log('=== ADMIN SETUP COMPLETE ===');
        console.log('Refresh the page and try the admin dashboard again.');
        
    } catch (error) {
        console.error('Admin setup error:', error);
    }
})();
