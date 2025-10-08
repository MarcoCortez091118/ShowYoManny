import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, email, password, userId, newPassword } = await req.json();

    console.log(`Admin auth action: ${action}`);

    switch (action) {
      case 'update_password':
        if (!email || !newPassword) {
          return new Response(
            JSON.stringify({ error: 'Email and new password required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        // Get user by email
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        
        if (listError) {
          console.error('Error listing users:', listError);
          return new Response(
            JSON.stringify({ error: 'Failed to find user' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }

        const user = users.find(u => u.email === email);
        
        if (!user) {
          return new Response(
            JSON.stringify({ error: 'User not found' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          );
        }

        // Update password
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          user.id,
          { password: newPassword }
        );

        if (updateError) {
          console.error('Password update error:', updateError);
          return new Response(
            JSON.stringify({ error: updateError.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        console.log(`Password updated for user: ${email}`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Password updated successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'check_admin':
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'User ID required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .single();

        if (roleError) {
          console.error('Role check error:', roleError);
          return new Response(
            JSON.stringify({ isAdmin: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ isAdmin: !!roleData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'create_admin':
        if (!email || !password) {
          return new Response(
            JSON.stringify({ error: 'Email and password required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        // Create user
        const { data: userData, error: userError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true
        });

        if (userError) {
          console.error('User creation error:', userError);
          return new Response(
            JSON.stringify({ error: userError.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        // Assign admin role
        const { error: roleInsertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userData.user.id,
            role: 'admin'
          });

        if (roleInsertError) {
          console.error('Role assignment error:', roleInsertError);
          return new Response(
            JSON.stringify({ error: 'Failed to assign admin role' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }

        console.log(`Admin user created: ${email}`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Admin user created successfully',
            userId: userData.user.id 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }

  } catch (error) {
    console.error('Admin auth function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});