// Run this in browser console on https://localhost:3000 or any page
// This will generate the diagnostic report in the exact format you requested

(async function generateDiagnosticReport() {
    console.log('=== GENERATING DIAGNOSTIC REPORT ===');
    
    // Initialize Supabase
    const supabaseUrl = 'https://xylaoshplmsevlxzizrd.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5bGFvc2hwbG1zZXZseHppenJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDQyMzYsImV4cCI6MjA1MTQyMDIzNn0.p1yL8kQx_8hKjN8q2Y3X4w5z6t7u8v9w0x1y2z3a4b';
    const { createClient } = window.supabase;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    let report = '[1] OAuth/session:\n';
    
    // OAuth/Session section
    const url = window.location.href;
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    report += `- callback URL in browser: ${url}\n`;
    report += `- debug message: `;
    
    if (error) {
        report += `OAuth error: ${error}`;
        if (errorDescription) report += ` - ${errorDescription}`;
        report += '\n';
    } else if (code) {
        report += `OAuth code received successfully\n`;
    } else {
        report += `No OAuth callback parameters\n`;
    }
    
    // Session check
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            report += `- console errors: Session error - ${sessionError.message}\n`;
        } else if (session) {
            report += `- console errors: None - Session created successfully\n`;
        } else {
            report += `- console errors: No session created despite OAuth callback\n`;
        }
    } catch (err) {
        report += `- console errors: Session check failed - ${err.message}\n`;
    }
    
    report += '\n[2] Admin/roles:\n';
    
    // Admin/Roles section
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
            report += `- user id: null\n`;
            report += `- admin check: no\n`;
            report += `- roles query result/error: No user session\n`;
        } else {
            report += `- user id: ${session.user.id}\n`;
            
            const { data: rolesData, error: rolesError } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", session.user.id);
            
            const userRoles = rolesData?.map(r => r.role) ?? [];
            const hasAdminAccess = userRoles.includes('admin') || userRoles.includes('owner');
            
            report += `- admin check: ${hasAdminAccess ? 'yes' : 'no'}\n`;
            
            if (rolesError) {
                report += `- roles query result/error: ${rolesError.message}\n`;
            } else {
                report += `- roles query result/error: ${JSON.stringify(userRoles)}\n`;
            }
        }
    } catch (err) {
        report += `- user id: Error checking session\n`;
        report += `- admin check: no\n`;
        report += `- roles query result/error: ${err.message}\n`;
    }
    
    report += '\n[3] Applications:\n';
    
    // Applications section
    try {
        const { data, error } = await supabase
            .from("applications")
            .select("*")
            .order("created_at", { ascending: false });
        
        if (error) {
            report += `- applications query/table: Failed to query applications table\n`;
            report += `- query error (if any): ${error.message}\n`;
            report += `- returned rows count: 0\n`;
        } else {
            report += `- applications query/table: Successfully queried applications table\n`;
            report += `- query error (if any): None\n`;
            report += `- returned rows count: ${data.length}\n`;
        }
    } catch (err) {
        report += `- applications query/table: Exception during query\n`;
        report += `- query error (if any): ${err.message}\n`;
        report += `- returned rows count: 0\n`;
    }
    
    console.log('=== DIAGNOSTIC REPORT ===');
    console.log(report);
    console.log('=== END REPORT ===');
    
    return report;
})();
