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

    const { action, fileName, fileType, filePath, borderStyle, displayDuration = 10, scheduled_start, scheduled_end, repeatEnabled, repeatInterval, maxRepeats, timer_loop_enabled, timer_loop_minutes, userEmail } = await req.json();

    console.log(`Content upload action: ${action}`);

    switch (action) {
      case 'create_order':
        // Determine if this is an admin upload using auth + roles (fallback to email check)
        const authHeader = req.headers.get('Authorization');
        let currentUserEmail = userEmail || 'guest@showyo.app';
        let currentUserId: string | null = null;
        if (authHeader) {
          try {
            const token = authHeader.replace('Bearer ', '');
            const { data: userData } = await supabase.auth.getUser(token);
            if (userData?.user) {
              currentUserEmail = userData.user.email ?? currentUserEmail;
              currentUserId = userData.user.id;
            }
          } catch (_) {
            // ignore auth errors, we'll fall back to email check
          }
        }

        let isAdminUpload = false;
        if (currentUserId) {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', currentUserId)
            .eq('role', 'admin');
          isAdminUpload = !!roles && roles.length > 0;
        } else {
          // Fallback legacy check
          isAdminUpload = currentUserEmail === 'admin@showyo.app';
        }
        
        // Process file path and type
        let processedFilePath = filePath;
        let processedFileType = fileType;
        let processedFileName = fileName;

        console.log('Processing content upload:', { fileName, fileType, filePath, isAdminUpload });

        // Create a new order for uploaded content
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_email: currentUserEmail,
            pricing_option_id: processedFileType?.includes('video') ? 'video-admin' : 'photo-admin',
            price_cents: 0, // Free for admin uploads
            file_name: processedFileName,
            file_type: processedFileType,
            file_path: processedFilePath,
            border_id: borderStyle || 'none',
            duration_seconds: displayDuration,
            status: 'pending',
            moderation_status: isAdminUpload ? 'approved' : 'pending', // Admin auto-approved
            display_status: isAdminUpload ? 'queued' : 'pending', // Scheduled items use queued status
            paid_at: new Date().toISOString(),
            scheduled_start: scheduled_start || null,
            scheduled_end: scheduled_end || null,
            repeat_enabled: repeatEnabled || false,
            repeat_interval_minutes: repeatInterval || null,
            max_repeats: maxRepeats || null,
            timer_loop_enabled: timer_loop_enabled || false,
            timer_loop_minutes: timer_loop_minutes || null,
            is_admin_content: isAdminUpload
          })
          .select()
          .single();

        if (orderError) {
          console.error('Order creation error:', orderError);
          return new Response(
            JSON.stringify({ error: orderError.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        // For admin content, skip AI moderation and add directly to queue
        if (isAdminUpload) {
          console.log('Admin content - skipping moderation, adding to queue');
          
          // Add to content queue immediately (admin content is always active)
          const { error: queueError } = await supabase
            .from('content_queue')
            .insert({
              order_id: orderData.id,
              queue_position: await getNextQueuePosition(supabase),
              is_active: true
            });

          if (queueError) {
            console.error('Queue insertion error:', queueError);
            return new Response(
              JSON.stringify({ error: 'Failed to add to queue' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            );
          }

          console.log(`Admin content added to queue: ${processedFileName} (now playing)`);
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              orderId: orderData.id,
              message: 'Admin content uploaded and now playing (no moderation required)'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // For paid user content, do NOT add to queue here - ai-moderator will handle it after approval
        console.log(`Paid user content uploaded: ${processedFileName} - awaiting AI moderation`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            orderId: orderData.id,
            message: 'Content uploaded successfully - awaiting moderation'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'get_queue':
        const { data: queueData, error: queueFetchError } = await supabase
          .from('content_queue')
          .select(`
            *,
            orders (
              id,
              file_name,
              file_type,
              file_path,
              border_id,
              duration_seconds,
              display_status,
              created_at
            )
          `)
          .order('queue_position', { ascending: true });

        if (queueFetchError) {
          console.error('Queue fetch error:', queueFetchError);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch queue' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }

        return new Response(
          JSON.stringify({ queue: queueData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }

  } catch (error) {
    console.error('Content upload function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function getNextQueuePosition(supabase: any): Promise<number> {
  const { data, error } = await supabase
    .from('content_queue')
    .select('queue_position')
    .order('queue_position', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return 1;
  }

  return data[0].queue_position + 1;
}