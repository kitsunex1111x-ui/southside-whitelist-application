// COPY AND PASTE THIS INTO BROWSER CONSOLE ON https://localhost:3000
// This will add the admin_notes column to the applications table

(async function addAdminNotesColumn() {
    console.log('=== ADDING ADMIN_NOTES COLUMN ===');
    
    const supabaseUrl = 'https://ebcgyxvtdfourghinppu.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5bGFvc2hwbG1zZXZseHppenJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDQyMzYsImV4cCI6MjA1MTQyMDIzNn0.p1yL8kQx_8hKjN8q2Y3X4w5z6t7u8v9w0x1y2z3a4b';
    const { createClient } = window.supabase;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    try {
        // Check if user is authenticated
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
            console.error('ERROR: No user logged in. Please login first!');
            return;
        }
        
        console.log('Adding admin_notes column to applications table...');
        
        // Execute SQL to add the admin_notes column
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: `
                ALTER TABLE public.applications 
                ADD COLUMN IF NOT EXISTS admin_notes TEXT;
                
                -- Update RLS policies to allow admin access to admin_notes
                DROP POLICY IF EXISTS "Admins can update applications" ON public.applications;
                CREATE POLICY "Admins can update applications" ON public.applications 
                FOR UPDATE TO authenticated 
                USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner'))
                WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner'));
                
                -- Allow admins to select admin_notes
                DROP POLICY IF EXISTS "Admins can view all applications" ON public.applications;
                CREATE POLICY "Admins can view all applications" ON public.applications 
                FOR SELECT TO authenticated 
                USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner'));
            `
        });
        
        if (error) {
            console.error('Error adding column:', error);
            console.log('Trying alternative approach...');
            
            // Alternative: Use raw SQL through Supabase SQL Editor
            console.log('Please run this SQL in your Supabase SQL Editor:');
            console.log(`
                ALTER TABLE public.applications 
                ADD COLUMN IF NOT EXISTS admin_notes TEXT;
                
                -- Update RLS policies
                DROP POLICY IF EXISTS "Admins can update applications" ON public.applications;
                CREATE POLICY "Admins can update applications" ON public.applications 
                FOR UPDATE TO authenticated 
                USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner'))
                WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner'));
                
                DROP POLICY IF EXISTS "Admins can view all applications" ON public.applications;
                CREATE POLICY "Admins can view all applications" ON public.applications 
                FOR SELECT TO authenticated 
                USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner'));
            `);
        } else {
            console.log('SUCCESS: admin_notes column added!');
        }
        
        // Test the column by trying to update an application
        console.log('Testing admin_notes functionality...');
        
        const { data: appsData, error: appsError } = await supabase
            .from("applications")
            .select("*")
            .limit(1);
        
        if (appsError) {
            console.error('Error fetching applications:', appsError);
        } else if (appsData && appsData.length > 0) {
            const testApp = appsData[0];
            
            // Test updating admin_notes
            const { data: updateData, error: updateError } = await supabase
                .from("applications")
                .update({ 
                    admin_notes: "Test note - " + new Date().toLocaleString()
                })
                .eq("id", testApp.id)
                .select();
            
            if (updateError) {
                console.error('Error testing admin_notes:', updateError);
            } else {
                console.log('SUCCESS: admin_notes functionality works!');
            }
        }
        
        console.log('=== ADMIN_NOTES COLUMN SETUP COMPLETE ===');
        console.log('Now restore the admin notes functionality in the AdminDashboard component');
        
    } catch (error) {
        console.error('FATAL ERROR:', error);
    }
})();
