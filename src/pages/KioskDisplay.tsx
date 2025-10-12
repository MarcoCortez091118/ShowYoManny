import { useState, useEffect, useRef } from 'react';
import { Monitor } from "lucide-react";
import { supabaseQueueService, type EnrichedQueueItem } from "@/services/supabaseQueueService";
import { supabase } from '@/lib/supabase';
import { BORDER_THEMES } from '../../shared/border-themes';
import showYoLogo from "@/assets/showyo-logo-overlay.png";
import { useDisplaySettings } from "@/hooks/use-display-settings";

const KioskDisplay = () => {
  const { settings } = useDisplaySettings();
  const SCREEN_WIDTH = settings.screenWidth;
  const SCREEN_HEIGHT = settings.screenHeight;

  const [items, setItems] = useState<EnrichedQueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const autoAdvanceTimer = useRef<NodeJS.Timeout | null>(null);
  const countdownTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchContent();

    const channel = supabase
      .channel('queue-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queue_items',
        },
        () => {
          console.log('KioskDisplay: Queue changed, refetching...');
          fetchContent();
        }
      )
      .subscribe();

    const refreshInterval = setInterval(fetchContent, 60000);

    return () => {
      channel.unsubscribe();
      clearInterval(refreshInterval);
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
  }, []);

  const fetchContent = async () => {
    try {
      const result = await supabase
        .from('queue_items')
        .select('*')
        .order('order_index', { ascending: true });

      if (result.error) {
        console.error('Error fetching content:', result.error);
        setIsLoading(false);
        return;
      }

      const allItems = result.data || [];
      const enrichedItems = allItems.map(item => {
        const now = new Date();
        const scheduledStart = item.scheduled_start ? new Date(item.scheduled_start) : null;
        const scheduledEnd = item.scheduled_end ? new Date(item.scheduled_end) : null;

        let computed_status: 'scheduled' | 'published' | 'expired' | 'active' | 'pending' = 'active';
        let is_visible = true;

        if (scheduledEnd && now > scheduledEnd) {
          computed_status = 'expired';
          is_visible = false;
        } else if (scheduledStart && now < scheduledStart) {
          computed_status = 'scheduled';
          is_visible = false;
        } else if (scheduledStart && now >= scheduledStart) {
          computed_status = 'published';
          is_visible = true;
        } else {
          computed_status = 'active';
          is_visible = true;
        }

        return {
          ...item,
          computed_status,
          is_visible,
        };
      });

      const visibleItems = enrichedItems.filter(item => item.is_visible);

      console.log('KioskDisplay: Loaded', visibleItems.length, 'visible items');

      setItems(prevItems => {
        if (visibleItems.length === 0) return [];

        const prevIds = prevItems.map(i => i.id).sort().join(',');
        const newIds = visibleItems.map(i => i.id).sort().join(',');
        const prevOrders = prevItems.map(i => `${i.id}:${i.order_index}`).join(',');
        const newOrders = visibleItems.map(i => `${i.id}:${i.order_index}`).join(',');

        if (prevIds !== newIds) {
          console.log('KioskDisplay: Items changed (different IDs), updating...');
          if (currentIndex >= visibleItems.length) {
            setCurrentIndex(0);
          }
          return visibleItems;
        }

        if (prevOrders !== newOrders) {
          console.log('KioskDisplay: Order changed, updating...');
          return visibleItems;
        }

        console.log('KioskDisplay: No significant changes, keeping current items');
        return prevItems;
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching content:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (items.length === 0) return;

    const currentItem = items[currentIndex];
    if (!currentItem) return;

    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);

    const duration = (currentItem.duration || 10) * 1000;
    console.log(`KioskDisplay: Playing ${currentItem.title} for ${currentItem.duration}s`);

    localStorage.setItem('kiosk-current-index', currentIndex.toString());
    localStorage.setItem('kiosk-current-item-id', currentItem.id);
    localStorage.setItem('kiosk-total-items', items.length.toString());

    setTimeRemaining(currentItem.duration || 10);
    countdownTimer.current = setInterval(() => {
      setTimeRemaining(prev => {
        const newValue = Math.max(0, prev - 1);
        localStorage.setItem('kiosk-time-remaining', newValue.toString());
        return newValue;
      });
    }, 1000);

    autoAdvanceTimer.current = setTimeout(() => {
      console.log(`KioskDisplay: Duration ${currentItem.duration}s completed for ${currentItem.title}`);
      setIsVisible(false);

      setTimeout(() => {
        const nextIndex = (currentIndex + 1) % items.length;
        const isLooping = nextIndex === 0 && currentIndex === items.length - 1;

        console.log(`KioskDisplay: Advancing from ${currentIndex + 1} to ${nextIndex + 1} of ${items.length}${isLooping ? ' (LOOPING BACK TO START)' : ''}`);

        setCurrentIndex(nextIndex);
        setIsVisible(true);
      }, 500);
    }, duration);

    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
  }, [currentIndex, items]);

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

  const border = currentItem.border_style && currentItem.border_style !== 'none'
    ? BORDER_THEMES.find(b => b.id === currentItem.border_style)
    : null;

  const renderBorderOverlay = () => {
    if (!border) return null;

    return (
      <div className="absolute inset-0 pointer-events-none z-10">
        {border.message && (
          <>
            <div className="absolute inset-x-0 top-0 py-12 bg-gradient-to-b from-black/90 via-black/80 to-transparent text-white flex items-center justify-center">
              <div className="text-6xl font-bold tracking-wide drop-shadow-lg">
                {border.message}
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 py-12 bg-gradient-to-t from-black/90 via-black/80 to-transparent text-white flex items-center justify-center">
              <div className="text-6xl font-bold tracking-wide drop-shadow-lg">
                {border.message}
              </div>
            </div>
          </>
        )}

        {border.category === 'Holiday' && (
          <>
            <div className="absolute top-12 left-12 text-8xl drop-shadow-xl">🎄</div>
            <div className="absolute top-12 right-12 text-8xl drop-shadow-xl">🎄</div>
            <div className="absolute bottom-12 left-12 text-8xl drop-shadow-xl">🎁</div>
            <div className="absolute bottom-12 right-12 text-8xl drop-shadow-xl">⭐</div>
          </>
        )}

        {border.category === 'Special Occasions' && (
          <>
            <div className="absolute top-12 left-12 text-8xl drop-shadow-xl">✨</div>
            <div className="absolute top-12 right-12 text-8xl drop-shadow-xl">✨</div>
            <div className="absolute bottom-12 left-12 text-8xl drop-shadow-xl">🎉</div>
            <div className="absolute bottom-12 right-12 text-8xl drop-shadow-xl">🎊</div>
          </>
        )}

        {border.category === 'Futuristic' && (
          <>
            <div className="absolute top-12 left-12 text-7xl drop-shadow-xl">⚡</div>
            <div className="absolute top-12 right-12 text-7xl drop-shadow-xl">⚡</div>
            <div className="absolute bottom-12 left-12 text-7xl drop-shadow-xl">🔮</div>
            <div className="absolute bottom-12 right-12 text-7xl drop-shadow-xl">🔮</div>
          </>
        )}

        {border.category === 'Seasonal' && (
          <>
            <div className="absolute top-12 left-12 text-8xl drop-shadow-xl">
              {border.name.match(/[\u{1F300}-\u{1F9FF}]/u)?.[0] || '✨'}
            </div>
            <div className="absolute top-12 right-12 text-8xl drop-shadow-xl">
              {border.name.match(/[\u{1F300}-\u{1F9FF}]/u)?.[0] || '✨'}
            </div>
            <div className="absolute bottom-12 left-12 text-8xl drop-shadow-xl">
              {border.name.match(/[\u{1F300}-\u{1F9FF}]/u)?.[0] || '✨'}
            </div>
            <div className="absolute bottom-12 right-12 text-8xl drop-shadow-xl">
              {border.name.match(/[\u{1F300}-\u{1F9FF}]/u)?.[0] || '✨'}
            </div>
          </>
        )}
      </div>
    );
  };

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
              key={`${currentItem.id}-${currentIndex}`}
              src={currentItem.media_url || ''}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-contain"
              style={{
                transform: currentItem.metadata
                  ? `translate(${(currentItem.metadata.positionX || 50) - 50}%, ${(currentItem.metadata.positionY || 50) - 50}%) scale(${(currentItem.metadata.zoom || 100) / 100}) rotate(${currentItem.metadata.rotation || 0}deg)`
                  : 'none',
                objectFit: currentItem.metadata?.fitMode || 'contain',
              }}
            />
          ) : (
            <img
              key={`${currentItem.id}-${currentIndex}`}
              src={currentItem.media_url || ''}
              alt={currentItem.title || 'Content'}
              className="w-full h-full object-contain"
              style={{
                transform: currentItem.metadata
                  ? `translate(${(currentItem.metadata.positionX || 50) - 50}%, ${(currentItem.metadata.positionY || 50) - 50}%) scale(${(currentItem.metadata.zoom || 100) / 100}) rotate(${currentItem.metadata.rotation || 0}deg)`
                  : 'none',
                objectFit: currentItem.metadata?.fitMode || 'contain',
              }}
            />
          )}

          {renderBorderOverlay()}

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
