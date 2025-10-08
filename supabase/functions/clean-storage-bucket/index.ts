import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('clean-storage-bucket: Starting cleanup');

    // List all files in the billboard-content bucket
    const { data: files, error: listError } = await supabase
      .storage
      .from('billboard-content')
      .list('', {
        limit: 1000,
        offset: 0,
      });

    if (listError) {
      console.error('clean-storage-bucket: Error listing files:', listError);
      throw listError;
    }

    console.log('clean-storage-bucket: Found', files?.length || 0, 'files');

    let deletedCount = 0;
    
    if (files && files.length > 0) {
      // Get all file paths recursively
      const allFilePaths: string[] = [];
      
      for (const file of files) {
        if (file.name) {
          // List files in subdirectories
          const { data: subFiles } = await supabase
            .storage
            .from('billboard-content')
            .list(file.name, {
              limit: 1000,
            });
          
          if (subFiles && subFiles.length > 0) {
            subFiles.forEach(subFile => {
              allFilePaths.push(`${file.name}/${subFile.name}`);
            });
          }
        }
      }

      console.log('clean-storage-bucket: Total files to delete:', allFilePaths.length);

      // Delete all files
      if (allFilePaths.length > 0) {
        const { error: deleteError } = await supabase
          .storage
          .from('billboard-content')
          .remove(allFilePaths);

        if (deleteError) {
          console.error('clean-storage-bucket: Error deleting files:', deleteError);
        } else {
          deletedCount = allFilePaths.length;
          console.log('clean-storage-bucket: Deleted', deletedCount, 'files');
        }
      }
    }

    // Clean up database tables
    await supabase.from('content_queue').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('storage_cleanup_queue').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('clean-storage-bucket: Database tables cleaned');

    return new Response(
      JSON.stringify({ 
        success: true, 
        deleted: deletedCount,
        message: `Cleaned up ${deletedCount} files and all database entries`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('clean-storage-bucket: Error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
