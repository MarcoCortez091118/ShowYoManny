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
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId, fileName, fileType, isAdminUpload } = await req.json();

    console.log(`AI Moderation started for order: ${orderId}, isAdmin: ${isAdminUpload}`);

    // Admin uploads bypass moderation entirely
    if (isAdminUpload) {
      console.log('Admin upload detected - auto-approving without moderation');
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          moderation_status: 'approved',
          display_status: 'queued'
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Order update error:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update order status' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          moderation_status: 'approved',
          message: 'Admin content auto-approved' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get order details to access file path
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order fetch error:', orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Get public URL for the file
    const { data: { publicUrl } } = supabase.storage
      .from('billboard-content')
      .getPublicUrl(order.file_path);

    console.log('Analyzing content at:', publicUrl);

    // Call AI service for content moderation with vision
    const isVideo = fileType.startsWith('video/');
    const isImage = fileType.startsWith('image/');

    let moderationMessages: any[] = [
      { 
        role: 'system', 
        content: `You are a strict content moderator for a public digital billboard. Analyze the ${isVideo ? 'video' : 'image'} and respond with ONLY "APPROVED" or "REJECTED: [reason]".

🚫 MUST REJECT if content contains:
- Nudity, sexual content, or suggestive poses
- Hate speech, racism, discrimination, or offensive symbols
- Violence, gore, or disturbing imagery
- Illegal activities (drugs, weapons, terrorism)
- Harassment, threats, or intimidating messages
- Self-harm or suicide-related content

✅ APPROVE if content shows:
- Fun, creative, celebratory posts
- Holiday & special occasions (birthdays, graduations, Valentine's, Christmas, etc.)
- Logos, borders, captions (as long as they don't violate rules above)
- Business/brand content without inappropriate elements

Be strict but fair. When in doubt, REJECT with a clear reason.`
      }
    ];

    // For images and videos, include the visual content
    if (isImage || isVideo) {
      moderationMessages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this ${isVideo ? 'video thumbnail' : 'image'} for a public billboard. File: ${fileName}`
          },
          {
            type: 'image_url',
            image_url: {
              url: publicUrl
            }
          }
        ]
      });
    } else {
      moderationMessages.push({
        role: 'user',
        content: `File name: ${fileName}, Type: ${fileType}. Analyze for billboard display.`
      });
    }

    const moderationResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: moderationMessages,
      }),
    });

    if (!moderationResponse.ok) {
      const errorText = await moderationResponse.text();
      console.error('AI moderation API error:', moderationResponse.status, errorText);
      
      // Handle rate limits
      if (moderationResponse.status === 429) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Rate limit exceeded. Please try again in a moment.',
            moderation_status: 'pending'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }
      
      // Default to manual review if AI fails
      await supabase
        .from('orders')
        .update({
          moderation_status: 'pending',
          moderation_reason: 'AI moderation unavailable - requires manual review'
        })
        .eq('id', orderId);

      return new Response(
        JSON.stringify({ 
          success: true, 
          moderation_status: 'pending',
          message: 'AI moderation unavailable, queued for manual review' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const moderationData = await moderationResponse.json();
    const aiDecision = moderationData.choices[0].message.content;
    
    console.log(`AI Moderation result: ${aiDecision}`);

    // Determine moderation status
    let moderationStatus = 'pending';
    let moderationReason = null;

    if (aiDecision.toUpperCase().includes('APPROVED')) {
      moderationStatus = 'approved';
    } else if (aiDecision.toUpperCase().includes('REJECTED')) {
      moderationStatus = 'rejected';
      // Extract reason from "REJECTED: reason" format
      const reasonMatch = aiDecision.match(/REJECTED:\s*(.+)/i);
      moderationReason = reasonMatch ? reasonMatch[1].trim() : 'Content violates community guidelines';
    } else {
      // If unclear response, default to manual review
      moderationStatus = 'pending';
      moderationReason = 'Unclear AI response - requires manual review';
    }

    // Update order with moderation result
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        moderation_status: moderationStatus,
        moderation_reason: moderationReason,
        display_status: moderationStatus === 'approved' ? 'queued' : moderationStatus
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Order update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update order status' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // If approved, add to content queue
    if (moderationStatus === 'approved') {
      // Get next queue position
      const { data: queueData } = await supabase
        .from('content_queue')
        .select('queue_position')
        .order('queue_position', { ascending: false })
        .limit(1);

      const nextPosition = queueData && queueData.length > 0 ? queueData[0].queue_position + 1 : 1;

      await supabase
        .from('content_queue')
        .insert({
          order_id: orderId,
          queue_position: nextPosition,
          is_active: false
        });

      console.log(`Order ${orderId} approved and added to queue at position ${nextPosition}`);
    } else {
      console.log(`Order ${orderId} ${moderationStatus}: ${moderationReason}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        moderation_status: moderationStatus,
        moderation_reason: moderationReason,
        ai_decision: aiDecision,
        message: `Content ${moderationStatus}${moderationReason ? ': ' + moderationReason : ''}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI moderation function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});