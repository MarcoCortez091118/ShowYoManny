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

    const { orderId, filePath, borderStyle, planId } = await req.json();

    console.log(`Processing content for order: ${orderId}`);

    // Get order details
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

    // Download the original file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('billboard-content')
      .download(filePath);

    if (downloadError) {
      console.error('File download error:', downloadError);
      return new Response(
        JSON.stringify({ error: 'Failed to download file' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    let processedFileName = `processed-${Date.now()}-${order.file_name}`;
    let processedFileData = fileData;
    let finalFileType = order.file_type;
    let converted = false;

    // Keep original file type; no in-function transcoding
    if (order.file_type === 'video/quicktime' || order.file_name.toLowerCase().endsWith('.mov')) {
      console.log('.mov file detected - keeping original MIME type (video/quicktime)');
      finalFileType = order.file_type;
    }

    const processedPath = `processed/${processedFileName}`;

    // Upload the processed file
    const { error: uploadError } = await supabase.storage
      .from('billboard-content')
      .upload(processedPath, processedFileData, {
        contentType: finalFileType,
        upsert: false
      });

    if (uploadError) {
      console.error('Processed file upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload processed file' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Update order with processed file path and corrected file type
    // Note: moderation_status remains 'pending' - will be set by ai-moderator
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        file_path: processedPath,
        file_type: finalFileType,
        status: 'completed'
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Order update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update order' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Queue insertion is handled by ai-moderator after approval
    console.log('Content processed - waiting for AI moderation');

    console.log(`Content processed successfully for order: ${orderId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processedPath,
        fileType: finalFileType,
        message: `Content processed with border: ${borderStyle}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Content processing error:', error);
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