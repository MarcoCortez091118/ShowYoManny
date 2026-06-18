import { useState, useEffect, useRef, useCallback } from 'react';
import { Monitor } from "lucide-react";
import { supabase } from '@/lib/supabase';
import showYoLogo from "@/assets/showyo-logo-overlay.png";
import { useDisplaySettings } from "@/hooks/use-display-settings";
import { supabaseBorderThemeService, type BorderTheme as UploadedBorderTheme } from '@/services/supabaseBorderThemeService';
import { mediaCacheService } from '@/services/mediaCacheService';

const KioskDisplay = () => {
  const { settings } = useDisplaySettings();
  const SCREEN_WIDTH = settings.screenWidth;
  const SCREEN_HEIGHT = settings.screenHeight;

  const [items, setItems] = useState<any[]>([]);
  const [cachedUrls, setCachedUrls] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [uploadedBorderThemes, setUploadedBorderThemes] = useState<UploadedBorderTheme[]>([]);
  const autoAdvanceTimer = useRef<NodeJS.Timeout | null>(null);
  const countdownTimer = useRef<NodeJS.Timeout | null>(null);
  const isFetching = useRef(false);
  const isProcessingNotifications = useRef(false);
  const lastPlayedAt = useRef<Record<string, number>>({});
  const lastFetchHash = useRef<string>('');

  const processPendingNotifications = useCallback(async () => {
    if (isProcessingNotifications.current) return;
    isProcessingNotifications.current = true;
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      await fetch(`${supabaseUrl}/functions/v1/process-pending-notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
        },
      });
    } catch { /* silent */ } finally {
      isProcessingNotifications.current = false;
    }
  }, []);

  const isItemReadyToShow = useCallback((item: any, allItems: any[]): boolean => {
    if (!item.timer_loop_enabled) return true;

    let intervalMs: number;
    if (item.timer_loop_automatic) {
      const totalCycleDuration = allItems.reduce((sum: number, i: any) => sum + (i.duration || 10), 0);
      intervalMs = totalCycleDuration * 1000;
    } else if (item.timer_loop_minutes && item.timer_loop_minutes > 0) {
      intervalMs = item.timer_loop_minutes * 60 * 1000;
    } else {
      return true;
    }

    const lastPlayed = lastPlayedAt.current[item.id];
    if (!lastPlayed) return true;
    return (Date.now() - lastPlayed) >= intervalMs;
  }, []);

  const getNextPlayableIndex = useCallback((startIndex: number, itemsList: any[]): number => {
    if (itemsList.length === 0) return 0;
    for (let i = 0; i < itemsList.length; i++) {
      const idx = (startIndex + i) % itemsList.length;
      if (isItemReadyToShow(itemsList[idx], itemsList)) return idx;
    }
    return startIndex % itemsList.length;
  }, [isItemReadyToShow]);

  const computeVisibility = useCallback((item: any): boolean => {
    const now = new Date();
    const scheduledStart = item.scheduled_start ? new Date(item.scheduled_start) : null;
    const scheduledEnd = item.scheduled_end ? new Date(item.scheduled_end) : null;
    const isAdminContent = item.metadata?.is_admin_content === true;
    const isPaidContent = item.metadata?.is_user_paid_content === true || item.metadata?.is_user_paid_content === 'true';
    const isPaymentConfirmed = item.metadata?.payment_status === 'confirmed';
    const displayStatus = item.metadata?.display_status;

    if (displayStatus === 'pending' && !isAdminContent) return false;
    if (isPaidContent && !isPaymentConfirmed) return false;
    if (item.status === 'pending' && !isAdminContent) return false;
    if (scheduledEnd && now > scheduledEnd) return false;
    if (scheduledStart && now < scheduledStart) return false;
    return true;
  }, []);

  const fetchContent = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      const result = await supabase
        .from('queue_items')
        .select('id, media_url, media_type, title, duration, order_index, status, scheduled_start, scheduled_end, border_id, metadata, timer_loop_enabled, timer_loop_minutes, timer_loop_automatic')
        .order('order_index', { ascending: true });

      if (result.error) {
        setIsLoading(false);
        isFetching.current = false;
        return;
      }

      const allItems = result.data || [];
      const visibleItems = allItems.filter(computeVisibility);

      const newHash = visibleItems.map(i => `${i.id}:${i.order_index}:${i.media_url}`).join('|');
      if (newHash === lastFetchHash.current && items.length > 0) {
        isFetching.current = false;
        return;
      }
      lastFetchHash.current = newHash;

      // Pre-cache all media URLs
      const mediaUrls = visibleItems.map(i => i.media_url).filter(Boolean);
      await mediaCacheService.preloadItems(mediaUrls);

      // Build cached URL map
      const urlMap: Record<string, string> = {};
      for (const item of visibleItems) {
        if (item.media_url) {
          urlMap[item.id] = await mediaCacheService.getCachedUrl(item.media_url);
        }
      }
      setCachedUrls(urlMap);

      // Evict media no longer in the queue
      const activeUrls = new Set(mediaUrls);
      mediaCacheService.evictAllExcept(activeUrls);

      setItems(prev => {
        if (visibleItems.length === 0) return [];
        return visibleItems;
      });

      setIsLoading(false);
    } catch {
      setIsLoading(false);
    } finally {
      isFetching.current = false;
    }
  }, [computeVisibility, items.length]);

  useEffect(() => {
    fetchContent();
    loadBorderThemes();

    const channel = supabase
      .channel('kiosk-queue')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'queue_items' },
        () => fetchContent()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'queue_items' },
        () => fetchContent()
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'queue_items' },
        () => fetchContent()
      )
      .subscribe();

    // Reduced polling: every 5 minutes instead of 60s
    const refreshInterval = setInterval(fetchContent, 300000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(refreshInterval);
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
  }, []);

  const loadBorderThemes = async () => {
    try {
      const themes = await supabaseBorderThemeService.getActive();
      setUploadedBorderThemes(themes);
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (items.length === 0) return;

    const currentItem = items[currentIndex];
    if (!currentItem) return;

    // If the current item has a timer loop and is NOT ready to show, skip it immediately
    if (!isItemReadyToShow(currentItem, items)) {
      const rawNextIndex = (currentIndex + 1) % items.length;
      const nextIndex = getNextPlayableIndex(rawNextIndex, items);
      if (nextIndex !== currentIndex) {
        setCurrentIndex(nextIndex);
      } else {
        // All items are on cooldown - show this one as fallback (avoid blank screen)
      }
      return;
    }

    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);

    const duration = (currentItem.duration || 10) * 1000;

    localStorage.setItem('kiosk-current-index', currentIndex.toString());
    localStorage.setItem('kiosk-current-item-id', currentItem.id);
    localStorage.setItem('kiosk-total-items', items.length.toString());

    lastPlayedAt.current[currentItem.id] = Date.now();

    setTimeRemaining(currentItem.duration || 10);
    countdownTimer.current = setInterval(() => {
      setTimeRemaining(prev => {
        const newValue = Math.max(0, prev - 1);
        localStorage.setItem('kiosk-time-remaining', newValue.toString());
        return newValue;
      });
    }, 1000);

    autoAdvanceTimer.current = setTimeout(async () => {
      const isPaidContent = currentItem.metadata?.is_user_paid_content === true;
      const isImmediateSlot = currentItem.metadata?.slot_type === 'immediate';
      const hasNoSchedule = !currentItem.scheduled_start && !currentItem.scheduled_end;
      const autoComplete = currentItem.metadata?.auto_complete_after_play === true;
      const maxPlays = currentItem.metadata?.max_plays || 0;
      const playCount = currentItem.metadata?.play_count || 0;
      const newPlayCount = playCount + 1;

      const shouldDelete = isPaidContent && (
        isImmediateSlot ||
        hasNoSchedule ||
        (autoComplete && maxPlays > 0 && newPlayCount >= maxPlays)
      );

      if (shouldDelete) {
        const hasBeenPlayed = currentItem.metadata?.has_been_played === true;
        if (!hasBeenPlayed) {
          try {
            await supabase
              .from('queue_items')
              .update({
                metadata: {
                  ...currentItem.metadata,
                  play_count: newPlayCount,
                  has_been_played: true,
                  played_at: new Date().toISOString(),
                }
              })
              .eq('id', currentItem.id);

            await supabase
              .from('queue_items')
              .delete()
              .eq('id', currentItem.id);

            mediaCacheService.evict(currentItem.media_url);

            setIsVisible(false);
            setTimeout(async () => {
              await fetchContent();
              setTimeout(() => {
                setCurrentIndex(prevIndex => {
                  const newLength = items.length - 1;
                  if (newLength <= 0) return 0;
                  return prevIndex >= newLength ? 0 : prevIndex;
                });
                setIsVisible(true);
              }, 300);
            }, 500);
            return;
          } catch { /* silent */ }
        }
      }

      setIsVisible(false);
      setTimeout(() => {
        const rawNextIndex = (currentIndex + 1) % items.length;
        const nextIndex = getNextPlayableIndex(rawNextIndex, items);
        const isLooping = nextIndex <= currentIndex && rawNextIndex !== 0 || (rawNextIndex === 0 && items.length > 0);

        if (nextIndex === 0 && currentIndex === items.length - 1) {
          processPendingNotifications();
        }

        setCurrentIndex(nextIndex);
        setIsVisible(true);
      }, 500);
    }, duration);

    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
  }, [currentIndex, items, getNextPlayableIndex, isItemReadyToShow, processPendingNotifications, fetchContent]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white/40">
          <Monitor className="h-32 w-32 mx-auto mb-6 opacity-30" />
          <p className="text-xl">Waiting for content...</p>
        </div>
      </div>
    );
  }

  const currentItem = items[currentIndex];
  if (!currentItem) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white/40">
          <Monitor className="h-32 w-32 mx-auto mb-6 opacity-30" />
          <p className="text-xl">Waiting for content...</p>
        </div>
      </div>
    );
  }

  const displayUrl = cachedUrls[currentItem.id] || currentItem.media_url || '';

  const uploadedBorder = currentItem.border_id && currentItem.border_id !== 'none'
    ? uploadedBorderThemes.find(b => b.id === currentItem.border_id)
    : null;

  const mediaStyle = currentItem.metadata ? {
    transform: `translate(${(currentItem.metadata.positionX || 50) - 50}%, ${(currentItem.metadata.positionY || 50) - 50}%) scale(${(currentItem.metadata.zoom || 100) / 100}) rotate(${currentItem.metadata.rotation || 0}deg)`,
    objectFit: (currentItem.metadata.fitMode || 'contain') as any,
  } : { objectFit: 'contain' as any };

  return (
    <div
      className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden"
      style={{ width: '100vw', height: '100vh' }}
    >
      <div
        className={`transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
      >
        <div className="relative w-full h-full bg-black">
          {currentItem.media_type === 'video' ? (
            <video
              key={currentItem.id}
              src={displayUrl}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-contain"
              style={mediaStyle}
            />
          ) : (
            <img
              key={currentItem.id}
              src={displayUrl}
              alt={currentItem.title || 'Content'}
              className="w-full h-full object-contain"
              style={mediaStyle}
            />
          )}

          {uploadedBorder && (
            <div className="absolute inset-0 pointer-events-none z-10">
              <img
                src={uploadedBorder.image_url}
                alt={uploadedBorder.name}
                className="w-full h-full object-fill"
                style={{ width: `${SCREEN_WIDTH}px`, height: `${SCREEN_HEIGHT}px` }}
              />
            </div>
          )}

          <div className="absolute top-8 left-8 z-20 bg-black/50 rounded-lg px-4 py-2">
            <div className="text-white text-2xl font-bold">
              {currentIndex + 1} / {items.length}
            </div>
          </div>

          <div className="absolute top-8 right-8 z-20 bg-black/50 rounded-lg px-4 py-2">
            <div className="text-white text-2xl font-bold">
              {timeRemaining}s
            </div>
          </div>

          <div className="absolute bottom-8 right-8 z-50">
            <img
              src={showYoLogo}
              alt="ShowYo"
              className="h-20 w-auto opacity-80 drop-shadow-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default KioskDisplay;
