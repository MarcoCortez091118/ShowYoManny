import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Monitor } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import showYoLogo from "@/assets/showyo-logo-overlay.png";

interface PlaylistItem {
  id: string;
  type: "photo" | "video";
  src: string;
  duration_sec: number;
  fit_mode: "fit" | "fill";
  overlay: {
    border_id: string;
    z: number;
  } | null;
  priority: "paid" | "admin" | "house";
  window: {
    start_at: string | null;
    end_at: string | null;
  };
  repeat: {
    mode: "once" | "interval" | "unlimited";
    n: number | null;
    interval_minutes: number | null;
  };
  caps: {
    max_plays_per_day: number;
    current_plays: number;
  };
  delete_after_play: boolean;
  pricing_option_id?: string;
  file_name: string;
  user_email: string;
}

interface Playlist {
  version: number;
  generated_at: string;
  timezone: string;
  canvas: { width: number; height: number };
  items: PlaylistItem[];
}

const KioskDisplay = () => {
  const [searchParams] = useSearchParams();
  const previewId = searchParams.get('preview');
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const autoAdvanceTimer = useRef<NodeJS.Timeout | null>(null);
  const countdownTimer = useRef<NodeJS.Timeout | null>(null);
  const playStartTime = useRef<Date | null>(null);

  // Fetch playlist on mount and set up real-time subscriptions
  useEffect(() => {
    fetchPlaylist();
    
    // Set up real-time subscriptions for content changes
    const contentChannel = supabase
      .channel('content-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content_queue'
        },
        (payload) => {
          console.log('KioskDisplay: Content queue changed, refetching playlist');
          fetchPlaylist();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('KioskDisplay: Order updated, refetching playlist');
          fetchPlaylist();
        }
      )
      .subscribe();
    
    // Also poll every 30 seconds as backup
    const interval = setInterval(fetchPlaylist, 30000);
    
    return () => {
      supabase.removeChannel(contentChannel);
      clearInterval(interval);
    };
  }, []);

  const fetchPlaylist = async () => {
    try {
      console.log('KioskDisplay: Fetching playlist...');
      const { data, error } = await supabase.functions.invoke('generate-playlist', {
        method: 'GET',
      });
      
      if (error) throw error;
      
      console.log('KioskDisplay: Playlist loaded with', data.items.length, 'items');
      
      // Reset index if current index is out of bounds
      setCurrentIndex(prevIndex => {
        if (!data.items || data.items.length === 0) return 0;
        if (prevIndex >= data.items.length) {
          console.log('KioskDisplay: Resetting index from', prevIndex, 'to 0 (playlist changed)');
          return 0;
        }
        return prevIndex;
      });
      
      setPlaylist(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching playlist:', error);
      setIsLoading(false);
    }
  };

  // Auto-advance to next item
  useEffect(() => {
    if (!playlist || playlist.items.length === 0 || previewId) return;

    const currentItem = playlist.items[currentIndex];
    if (!currentItem) return;

    // Clear existing timers
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);

    const duration = currentItem.duration_sec * 1000;
    console.log(`KioskDisplay: Playing ${currentItem.file_name} for ${currentItem.duration_sec}s`);
    
    // Record play start time
    playStartTime.current = new Date();
    
    // Set countdown
    setTimeRemaining(currentItem.duration_sec);
    countdownTimer.current = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    // Auto-advance after duration
    autoAdvanceTimer.current = setTimeout(async () => {
      try {
        // Report play completion
        await supabase.functions.invoke('report-play', {
          body: {
            item_id: currentItem.id,
            started_at: playStartTime.current?.toISOString(),
            completed_at: new Date().toISOString(),
            success: true
          }
        });
        
        console.log('KioskDisplay: Play reported for', currentItem.file_name);
      } catch (e) {
        console.error('Error reporting play:', e);
      }

      // Fade out
      setIsVisible(false);
      
      // Advance to next item
      setTimeout(() => {
        const nextIndex = (currentIndex + 1) % playlist.items.length;
        console.log(`KioskDisplay: Advancing to item ${nextIndex + 1} of ${playlist.items.length}`);
        setCurrentIndex(nextIndex);
        setIsVisible(true);
        
        // If we've looped, refresh playlist to get updated caps
        if (nextIndex === 0) {
          fetchPlaylist();
        }
      }, 500);
    }, duration);

    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
  }, [currentIndex, playlist, previewId]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
      </div>
    );
  }

  if (!playlist || playlist.items.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white/40">
          <Monitor className="h-32 w-32 mx-auto mb-6 opacity-30" />
          <p className="text-xl">Waiting for content...</p>
        </div>
      </div>
    );
  }

  const currentItem = playlist.items[currentIndex];
  const getImageUrl = (filePath: string) => {
    if (!filePath) return null;
    return supabase.storage.from('billboard-content').getPublicUrl(filePath).data.publicUrl;
  };

  const getBorderClass = (borderId: string) => {
    const borderStyles: Record<string, string> = {
      'none': '',
      // Holiday Borders
      'merry-christmas': 'border-8 border-red-600 bg-gradient-to-br from-red-100 via-green-100 to-red-100',
      'happy-new-year': 'border-8 border-yellow-500 bg-gradient-to-br from-yellow-100 via-purple-100 to-blue-100',
      'happy-valentines': 'border-8 border-pink-500 bg-gradient-to-br from-pink-100 via-red-100 to-pink-100',
      'happy-halloween': 'border-8 border-orange-600 bg-gradient-to-br from-orange-100 via-black/20 to-orange-100',
      'happy-easter': 'border-8 border-green-500 bg-gradient-to-br from-green-100 via-yellow-100 to-pink-100',
      'happy-thanksgiving': 'border-8 border-amber-600 bg-gradient-to-br from-amber-100 via-orange-100 to-red-100',
      // Special Occasions
      'happy-birthday': 'border-8 border-purple-500 bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100',
      'congrats-graduate': 'border-8 border-blue-600 bg-gradient-to-br from-blue-100 via-white to-yellow-100',
      'happy-anniversary': 'border-8 border-rose-500 bg-gradient-to-br from-rose-100 via-pink-100 to-red-100',
      'wedding-day': 'border-8 border-white bg-gradient-to-br from-white via-pink-50 to-white',
      // Futuristic Borders
      'neon-glow': 'border-8 border-cyan-400 bg-gradient-to-br from-cyan-100 via-purple-100 to-cyan-100',
      'tech-circuit': 'border-8 border-blue-600 bg-gradient-to-br from-blue-100 via-cyan-100 to-blue-100',
      'galaxy': 'border-8 border-indigo-600 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100',
      'cyberpunk': 'border-8 border-fuchsia-500 bg-gradient-to-br from-fuchsia-100 via-cyan-100 to-fuchsia-100',
      // Seasonal Borders
      'summer': 'border-8 border-yellow-400 bg-gradient-to-br from-yellow-100 via-orange-100 to-yellow-100',
      'winter': 'border-8 border-blue-300 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50',
      'autumn': 'border-8 border-orange-500 bg-gradient-to-br from-orange-100 via-red-100 to-orange-100',
      // Funny Quote Borders
      'calories-dont-count': 'border-8 border-pink-400 bg-gradient-to-br from-pink-100 via-yellow-100 to-pink-100',
      'work-hard-party': 'border-8 border-blue-500 bg-gradient-to-br from-blue-100 via-indigo-100 to-blue-100',
      'reboot-friday': 'border-8 border-green-500 bg-gradient-to-br from-green-100 via-yellow-100 to-green-100',
      'dance-watching': 'border-8 border-purple-600 bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100',
    };
    return borderStyles[borderId] || '';
  };

  const getBorderText = (borderId: string) => {
    const texts: Record<string, string> = {
      'merry-christmas': 'Merry Christmas',
      'happy-new-year': 'Happy New Year',
      "happy-valentines": "Happy Valentine's Day",
      'happy-halloween': 'Happy Halloween',
      'happy-easter': 'Happy Easter',
      'happy-thanksgiving': 'Happy Thanksgiving',
      'happy-birthday': 'Happy Birthday',
      'congrats-graduate': 'Congrats Graduate',
      'happy-anniversary': 'Happy Anniversary',
      'wedding-day': 'Wedding Day',
      'neon-glow': 'Neon Glow',
      'tech-circuit': 'Tech Circuit',
      'galaxy': 'Galaxy',
      'cyberpunk': 'Cyberpunk',
      'summer': 'Summer',
      'winter': 'Winter',
      'autumn': 'Autumn',
      // Funny Quotes
      'calories-dont-count': "Calories Don't Count Tonight",
      'work-hard-party': 'Work Hard, Party Harder',
      'reboot-friday': "Reboot Yourself, It's Friday",
      'dance-watching': "Dance Like Nobody's Watching",
    };
    return texts[borderId] || '';
  };

  // Resolve border info
  const borderId = currentItem.overlay?.border_id || 'none';
  const borderClass = borderId !== 'none' ? getBorderClass(borderId) : '';
  const borderText = getBorderText(borderId);
  const hasBorder = borderId !== 'none';
  
  // Determine fit mode (default to 'fit' per spec - no cropping)
  const fitClass = currentItem.fit_mode === 'fill' ? 'object-cover' : 'object-contain';

  // Check if logo should be displayed based on pricing option
  const shouldShowLogo = currentItem.pricing_option_id?.includes('logo');

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
      <div 
        className={`w-full h-full transition-opacity duration-500 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {hasBorder ? (
          // With Border: Outer frame with gradient + inner content area
          <div className={`relative w-full h-full ${borderClass} flex items-center justify-center p-6`}>
            {/* Inner content area - black background to show content clearly */}
            <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
              {currentItem.type === 'photo' && (
                <img
                  key={currentItem.id}
                  src={getImageUrl(currentItem.src)}
                  alt={currentItem.file_name}
                  className={`absolute inset-0 w-full h-full ${fitClass}`}
                />
              )}
              
              {currentItem.type === 'video' && (
                <video
                  key={currentItem.id}
                  src={getImageUrl(currentItem.src)}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className={`absolute inset-0 w-full h-full ${fitClass}`}
                />
              )}

              {/* Bottom banner for border text - 100% bigger */}
              {borderText && (
                <div className="absolute inset-x-0 bottom-0 py-8 bg-gradient-to-t from-black/95 via-black/80 to-transparent">
                  <div className="text-white text-6xl font-extrabold tracking-widest text-center drop-shadow-2xl animate-pulse">
                    {borderText}
                  </div>
                </div>
              )}

              {/* Thematic corner decorations */}
              {hasBorder && (
                <>
                  {/* Top Left Corner */}
                  <div className="absolute top-4 left-4 text-6xl opacity-80 animate-bounce">
                    {borderId.includes('christmas') && '🎄'}
                    {borderId.includes('new-year') && '🎉'}
                    {borderId.includes('valentine') && '💕'}
                    {borderId.includes('halloween') && '🎃'}
                    {borderId.includes('easter') && '🐰'}
                    {borderId.includes('thanksgiving') && '🦃'}
                    {borderId.includes('birthday') && '🎂'}
                    {borderId.includes('graduate') && '🎓'}
                    {borderId.includes('anniversary') && '💐'}
                    {borderId.includes('wedding') && '💍'}
                    {borderId.includes('neon') && '✨'}
                    {borderId.includes('tech') && '⚡'}
                    {borderId.includes('galaxy') && '🌟'}
                    {borderId.includes('cyberpunk') && '🔮'}
                    {borderId.includes('summer') && '☀️'}
                    {borderId.includes('winter') && '❄️'}
                    {borderId.includes('autumn') && '🍂'}
                    {borderId.includes('calories') && '🍰'}
                    {borderId.includes('party') && '🎊'}
                    {borderId.includes('friday') && '🌈'}
                    {borderId.includes('dance') && '💃'}
                  </div>

                  {/* Top Right Corner */}
                  <div className="absolute top-4 right-4 text-6xl opacity-80 animate-bounce" style={{ animationDelay: '0.2s' }}>
                    {borderId.includes('christmas') && '⛄'}
                    {borderId.includes('new-year') && '🎆'}
                    {borderId.includes('valentine') && '💝'}
                    {borderId.includes('halloween') && '👻'}
                    {borderId.includes('easter') && '🥚'}
                    {borderId.includes('thanksgiving') && '🍁'}
                    {borderId.includes('birthday') && '🎈'}
                    {borderId.includes('graduate') && '📚'}
                    {borderId.includes('anniversary') && '❤️'}
                    {borderId.includes('wedding') && '👰'}
                    {borderId.includes('neon') && '💫'}
                    {borderId.includes('tech') && '🔌'}
                    {borderId.includes('galaxy') && '🌌'}
                    {borderId.includes('cyberpunk') && '🎮'}
                    {borderId.includes('summer') && '🏖️'}
                    {borderId.includes('winter') && '⛸️'}
                    {borderId.includes('autumn') && '🍄'}
                    {borderId.includes('calories') && '🍕'}
                    {borderId.includes('party') && '🎵'}
                    {borderId.includes('friday') && '🎪'}
                    {borderId.includes('dance') && '🕺'}
                  </div>

                  {/* Bottom Left Corner */}
                  <div className="absolute bottom-24 left-4 text-6xl opacity-80 animate-bounce" style={{ animationDelay: '0.4s' }}>
                    {borderId.includes('christmas') && '🎁'}
                    {borderId.includes('new-year') && '🥂'}
                    {borderId.includes('valentine') && '🌹'}
                    {borderId.includes('halloween') && '🕷️'}
                    {borderId.includes('easter') && '🌷'}
                    {borderId.includes('thanksgiving') && '🌽'}
                    {borderId.includes('birthday') && '🎁'}
                    {borderId.includes('graduate') && '🏆'}
                    {borderId.includes('anniversary') && '💝'}
                    {borderId.includes('wedding') && '🥂'}
                    {borderId.includes('neon') && '⚡'}
                    {borderId.includes('tech') && '💻'}
                    {borderId.includes('galaxy') && '🪐'}
                    {borderId.includes('cyberpunk') && '🤖'}
                    {borderId.includes('summer') && '🍉'}
                    {borderId.includes('winter') && '⛷️'}
                    {borderId.includes('autumn') && '🎃'}
                    {borderId.includes('calories') && '🍔'}
                    {borderId.includes('party') && '🎸'}
                    {borderId.includes('friday') && '🎭'}
                    {borderId.includes('dance') && '🎶'}
                  </div>

                  {/* Bottom Right Corner */}
                  <div className="absolute bottom-24 right-4 text-6xl opacity-80 animate-bounce" style={{ animationDelay: '0.6s' }}>
                    {borderId.includes('christmas') && '🔔'}
                    {borderId.includes('new-year') && '🎇'}
                    {borderId.includes('valentine') && '💖'}
                    {borderId.includes('halloween') && '🦇'}
                    {borderId.includes('easter') && '🐣'}
                    {borderId.includes('thanksgiving') && '🥧'}
                    {borderId.includes('birthday') && '🎉'}
                    {borderId.includes('graduate') && '🎊'}
                    {borderId.includes('anniversary') && '💗'}
                    {borderId.includes('wedding') && '💐'}
                    {borderId.includes('neon') && '🌠'}
                    {borderId.includes('tech') && '🖥️'}
                    {borderId.includes('galaxy') && '🚀'}
                    {borderId.includes('cyberpunk') && '👾'}
                    {borderId.includes('summer') && '🌴'}
                    {borderId.includes('winter') && '☃️'}
                    {borderId.includes('autumn') && '🍎'}
                    {borderId.includes('calories') && '🍩'}
                    {borderId.includes('party') && '🎤'}
                    {borderId.includes('friday') && '🎨'}
                    {borderId.includes('dance') && '🎼'}
                  </div>
                </>
              )}

              {/* ShowYo Logo Overlay - bottom right corner */}
              {shouldShowLogo && (
                <div className="absolute bottom-8 right-8 z-50">
                  <img 
                    src={showYoLogo} 
                    alt="ShowYo" 
                    className="h-16 w-auto opacity-90 drop-shadow-lg"
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          // Without Border: Full screen content
          <div className="relative w-full h-full">
            {currentItem.type === 'photo' && (
              <img
                key={currentItem.id}
                src={getImageUrl(currentItem.src)}
                alt={currentItem.file_name}
                className={`w-full h-full ${fitClass}`}
              />
            )}
            
            {currentItem.type === 'video' && (
              <video
                key={currentItem.id}
                src={getImageUrl(currentItem.src)}
                autoPlay
                muted
                loop
                playsInline
                className={`w-full h-full ${fitClass}`}
              />
            )}

            {/* ShowYo Logo Overlay - bottom right corner */}
            {shouldShowLogo && (
              <div className="absolute bottom-8 right-8 z-50">
                <img 
                  src={showYoLogo} 
                  alt="ShowYo" 
                  className="h-16 w-auto opacity-90 drop-shadow-lg"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default KioskDisplay;
