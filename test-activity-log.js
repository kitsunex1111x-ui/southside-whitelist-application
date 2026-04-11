// COPY AND PASTE THIS INTO BROWSER CONSOLE ON https://localhost:3000
// This will test and fix the Activity Log functionality

(async function testActivityLog() {
    console.log('=== TESTING ACTIVITY LOG ===');
    
    const supabaseUrl = 'https://xylaoshplmsevlxzizrd.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5bGFvc2hwbG1zZXZseHppenJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDQyMzYsImV4cCI6MjA1MTQyMDIzNn0.p1yL8kQx_8hKjN8q2Y3X4w5z6t7u8v9w0x1y2z3a4b';
    const { createClient } = window.supabase;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    try {
        // Step 1: Check if user is authenticated and is owner
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
            console.error('ERROR: No user logged in. Please login first!');
            return;
        }
        
        console.log('Current user:', session.user.email);
        
        // Step 2: Check if user has owner role
        const { data: rolesData, error: rolesError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id);
        
        if (rolesError) {
            console.error('Error checking roles:', rolesError);
            return;
        }
        
        const userRoles = rolesData?.map(r => r.role) ?? [];
        console.log('User roles:', userRoles);
        
        if (!userRoles.includes('owner')) {
            console.error('ERROR: User does not have owner role');
            console.log('Assigning owner role...');
            
            const { error: insertError } = await supabase
                .from("user_roles")
                .insert({
                    user_id: session.user.id,
                    role: "owner"
                });
            
            if (insertError) {
                console.error('Error assigning owner role:', insertError);
            } else {
                console.log('Owner role assigned successfully!');
            }
        }
        
        // Step 3: Test admin_logs table access
        console.log('Testing admin_logs table access...');
        
        const { data: logsData, error: logsError } = await supabase
            .from("admin_logs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(10);
        
        if (logsError) {
            console.error('Error accessing admin_logs:', logsError);
            console.log('This might be an RLS policy issue');
        } else {
            console.log(`SUCCESS: Found ${logsData?.length || 0} admin log entries`);
            if (logsData && logsData.length > 0) {
                console.log('Sample log entry:', logsData[0]);
            }
        }
        
        // Step 4: Add test log entries if none exist
        if (!logsData || logsData.length === 0) {
            console.log('No log entries found, adding test data...');
            
            const testLogs = [
                {
                    admin_id: session.user.id,
                    action: "test_activity",
                    target_id: session.user.id,
                    details: { message: "Test activity log entry" }
                },
                {
                    admin_id: session.user.id,
                    action: "system_check",
                    target_id: null,
                    details: { message: "System activity check" }
                }
            ];
            
            for (const log of testLogs) {
                const { error: insertError } = await supabase
                    .from("admin_logs")
                    .insert(log);
                
                if (insertError) {
                    console.error('Error inserting test log:', insertError);
                } else {
                    console.log('Test log entry added successfully');
                }
            }
        }
        
        // Step 5: Test fetching logs again
        console.log('Testing admin_logs fetch after adding test data...');
        
        const { data: newLogsData, error: newLogsError } = await supabase
            .from("admin_logs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(10);
        
        if (newLogsError) {
            console.error('Error fetching updated logs:', newLogsError);
        } else {
            console.log(`SUCCESS: Found ${newLogsData?.length || 0} admin log entries after test`);
        }
        
        console.log('=== ACTIVITY LOG TEST COMPLETE ===');
        console.log('Now go to the Owner Dashboard (/owner) and check the Activity Log section');
        
    } catch (error) {
        console.error('FATAL ERROR:', error);
    }
})();
