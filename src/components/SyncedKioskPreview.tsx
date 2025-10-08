import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Using RefreshCw instead of Sync as it's a valid lucide-react icon
import { Monitor, Clock, RefreshCw } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

interface ContentItem {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  border_id: string;
  duration_seconds: number;
  user_email: string;
  pricing_option_id?: string;
  is_active?: boolean;
  queue_position?: number;
}

const SyncedKioskPreview = () => {
  const [contentQueue, setContentQueue] = useState<ContentItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [syncState, setSyncState] = useState<any>(null);
  const [lastSyncUpdate, setLastSyncUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchContent();
    const cleanup = setupRealtimeSync();
    
    // Subscribe to content queue changes to detect new uploads
    const contentChannel = supabase
      .channel('content-queue-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'content_queue'
      }, (payload) => {
        console.log('Preview: Content queue changed, refetching content');
        fetchContent();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders'
      }, (payload) => {
        console.log('Preview: Order updated, refetching content');
        fetchContent();
      })
      .subscribe();
    
    return () => {
      cleanup();
      supabase.removeChannel(contentChannel);
    };
  }, []);

  // Real-time synchronization setup
  const setupRealtimeSync = () => {
    // Subscribe to sync state changes
    const syncChannel = supabase
      .channel('kiosk-sync-preview')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'kiosk_sync_state'
      }, (payload) => {
        console.log('Preview sync state changed:', payload);
        if (payload.new && typeof payload.new === 'object') {
          const newSyncState = payload.new as any;
          console.log('New sync state in preview:', newSyncState);
          setSyncState(newSyncState);
          setCurrentIndex(newSyncState.current_index || 0);
          setLastSyncUpdate(new Date());
          
          // Trigger fade transition when index changes
          setIsVisible(false);
          setTimeout(() => setIsVisible(true), 500);
        }
      })
      .subscribe();

    // Get initial sync state
    const getInitialSync = async () => {
      const { data, error } = await supabase
        .from('kiosk_sync_state')
        .select('*')
        .single();
      
      if (data) {
        console.log('Initial sync state in preview:', data);
        setSyncState(data);
        setCurrentIndex(data.current_index || 0);
        setLastSyncUpdate(new Date());
      } else {
        console.log('No sync state found in preview');
      }
    };

    getInitialSync();

    return () => {
      supabase.removeChannel(syncChannel);
    };
  };

  const fetchContent = async () => {
    try {
      // Fetch content via Edge Function to bypass client RLS limits
      const { data: fnData, error: fnError } = await supabase.functions.invoke('get-queue', {
        method: 'GET',
      });
      if (fnError) throw fnError;
      const transformedData = (fnData?.items || []) as any[];
      console.log('Preview content queue loaded (edge fn):', transformedData?.length, 'items');
      setContentQueue(transformedData);
    } catch (error) {
      console.error('Error fetching content:', error);
      setContentQueue([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync timer to show remaining time
  useEffect(() => {
    if (contentQueue.length === 0 || !syncState) return;
    
    const currentContent = contentQueue[currentIndex];
    const duration = (currentContent?.duration_seconds || 10) * 1000;
    
    // Calculate time since last advance
    const timeSinceAdvance = Date.now() - new Date(syncState.last_advance_time).getTime();
    const remainingTime = Math.max(0, duration - timeSinceAdvance);
    
    setTimeRemaining(Math.ceil(remainingTime / 1000));
    
    // Countdown timer
    const countdownInterval = setInterval(() => {
      const timeSinceAdvance = Date.now() - new Date(syncState.last_advance_time).getTime();
      const remainingTime = Math.max(0, duration - timeSinceAdvance);
      setTimeRemaining(Math.ceil(remainingTime / 1000));
    }, 1000);

    return () => {
      clearInterval(countdownInterval);
    };
  }, [currentIndex, contentQueue, syncState]);

  // Fallback auto-advance: if no master advances, preview advances safely
  useEffect(() => {
    if (contentQueue.length === 0 || !syncState) return;

    const currentContent = contentQueue[currentIndex];
    const duration = (currentContent?.duration_seconds || 10) * 1000;
    const timeSinceAdvance = Date.now() - new Date(syncState.last_advance_time).getTime();
    const remainingTime = Math.max(0, duration - timeSinceAdvance);

    const timeout = setTimeout(async () => {
      try {
        // Re-read sync state to avoid double-advance
        const { data: latest, error } = await supabase
          .from('kiosk_sync_state')
          .select('*')
          .single();
        if (error || !latest) return;

        // If someone else already advanced, do nothing
        if (
          new Date(latest.last_advance_time).getTime() !== new Date(syncState.last_advance_time).getTime() ||
          latest.current_index !== syncState.current_index
        ) {
          return;
        }

        const nextIndex = (latest.current_index + 1) % contentQueue.length;
        const nextContent = contentQueue[nextIndex];
        await supabase
          .from('kiosk_sync_state')
          .update({
            current_index: nextIndex,
            current_content_id: nextContent?.id ?? null,
            last_advance_time: new Date().toISOString(),
            sync_timestamp: new Date().toISOString(),
          })
          .eq('id', latest.id);
      } catch (e) {
        console.error('Preview auto-advance fallback error:', e);
      }
    }, remainingTime + 200);

    return () => clearTimeout(timeout);
  }, [contentQueue, currentIndex, syncState]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Live Kiosk Display
          </CardTitle>
          <CardDescription>
            Real-time synchronized view of what's currently showing on the billboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border-2 border-primary/20 flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (contentQueue.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Live Kiosk Display
          </CardTitle>
          <CardDescription>
            Real-time synchronized view of what's currently showing on the billboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border-2 border-primary/20 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Monitor className="h-16 w-16 mx-auto mb-2 opacity-50" />
              <p>No Content Available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentContent = contentQueue[currentIndex] || contentQueue[0];
  const getImageUrl = (filePath: string) => {
    if (!filePath) return null;
    return supabase.storage.from('billboard-content').getPublicUrl(filePath).data.publicUrl;
  };

  const isImage = currentContent.file_type?.startsWith('image/');
  const isVideo = currentContent.file_type?.startsWith('video/');

  // Border styles mapping (simplified for preview) - only apply if plan includes border
  const getBorderStyle = (borderId: string, pricingOptionId?: string) => {
    // Never show borders for logo-only plans (without "border" in the plan ID)
    if (pricingOptionId && !pricingOptionId.includes('border')) {
      return '';
    }
    const borderStyles = {
      'none': '',
      'merry-christmas': 'border-4 border-red-600 bg-gradient-to-br from-red-100 via-green-100 to-red-100',
      'happy-new-year': 'border-4 border-yellow-500 bg-gradient-to-br from-yellow-100 via-purple-100 to-blue-100',
      'happy-valentines': 'border-4 border-pink-500 bg-gradient-to-br from-pink-100 via-red-100 to-pink-100',
      'happy-halloween': 'border-4 border-orange-600 bg-gradient-to-br from-orange-100 via-black/20 to-orange-100',
      'happy-easter': 'border-4 border-green-500 bg-gradient-to-br from-green-100 via-yellow-100 to-pink-100',
      'happy-thanksgiving': 'border-4 border-amber-600 bg-gradient-to-br from-amber-100 via-orange-100 to-red-100',
      'happy-birthday': 'border-4 border-purple-500 bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100',
      'congrats-graduate': 'border-4 border-blue-600 bg-gradient-to-br from-blue-100 via-white to-yellow-100',
      'happy-anniversary': 'border-4 border-rose-500 bg-gradient-to-br from-rose-100 via-pink-100 to-red-100',
      'wedding-day': 'border-4 border-white bg-gradient-to-br from-white via-pink-50 to-white',
    };
    return borderStyles[borderId as keyof typeof borderStyles] || '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Live Kiosk Display
          <RefreshCw className="h-4 w-4 text-green-500" />
        </CardTitle>
        <CardDescription>
          Real-time synchronized view of what's currently showing on the billboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border-2 border-primary/20">
          {/* Timer display */}
          <div className="absolute top-2 right-2 z-10 bg-black/50 text-white px-2 py-1 rounded-lg text-sm flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeRemaining}s
          </div>
          
          {/* Content display */}
          <div className={`w-full h-full transition-opacity duration-500 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}>
            {currentContent.file_path ? (
              <div className={`w-full h-full flex items-center justify-center relative overflow-hidden ${getBorderStyle(currentContent.border_id, currentContent.pricing_option_id)} p-2`}>
                {isImage && (
                  <img
                    src={getImageUrl(currentContent.file_path)}
                    alt={currentContent.file_name}
                    className="w-full h-full object-cover rounded"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                )}
                
                {isVideo && (
                  <video
                    src={getImageUrl(currentContent.file_path)}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover rounded"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-center text-white">
                <div>
                  <Monitor className="h-16 w-16 mx-auto mb-2 opacity-50" />
                  <p className="text-lg opacity-50">No media to display</p>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>Synchronized with main display</span>
          <span>Content {currentIndex + 1} of {contentQueue.length}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default SyncedKioskPreview;