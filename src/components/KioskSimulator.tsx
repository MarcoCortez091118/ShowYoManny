import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Monitor, Maximize2, Play, Pause, SkipForward, SkipBack, RefreshCw } from 'lucide-react';
import { BORDER_THEMES } from '../../shared/border-themes';
import type { EnrichedQueueItem } from '@/services/supabaseQueueService';

interface KioskSimulatorProps {
  queueItems: EnrichedQueueItem[];
}

const SCREEN_WIDTH = 2048;
const SCREEN_HEIGHT = 2432;
const PREVIEW_SCALE = 0.25; // Escala para que quepa en la UI

export const KioskSimulator = ({ queueItems }: KioskSimulatorProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);

  const currentItem = queueItems[currentIndex];

  useEffect(() => {
    if (currentItem) {
      setTimeLeft(currentItem.duration || 10);
    }
  }, [currentItem]);

  useEffect(() => {
    if (!isPlaying || !currentItem) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleNext();
          return currentItem.duration || 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, currentItem, currentIndex]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(queueItems.length, 1));
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + queueItems.length) % Math.max(queueItems.length, 1));
  };

  const handleOpenFullscreen = () => {
    const kioskUrl = '/kiosk';
    window.open(kioskUrl, '_blank', 'fullscreen=yes');
  };

  const renderBorderOverlay = () => {
    if (!currentItem?.border_style || currentItem.border_style === 'none') return null;

    const border = BORDER_THEMES.find(b => b.id === currentItem.border_style);
    if (!border) return null;

    return (
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* Top Banner */}
        {border.message && (
          <div className="absolute inset-x-0 top-0 py-8 bg-gradient-to-b from-black/90 via-black/80 to-transparent text-white flex items-center justify-center">
            <div className="text-4xl font-bold tracking-wide drop-shadow-lg">
              {border.message}
            </div>
          </div>
        )}

        {/* Bottom Banner */}
        {border.message && (
          <div className="absolute inset-x-0 bottom-0 py-8 bg-gradient-to-t from-black/90 via-black/80 to-transparent text-white flex items-center justify-center">
            <div className="text-4xl font-bold tracking-wide drop-shadow-lg">
              {border.message}
            </div>
          </div>
        )}

        {/* Corner Decorations */}
        {border.category === 'Holiday' && (
          <>
            <div className="absolute top-8 left-8 text-6xl drop-shadow-xl">🎄</div>
            <div className="absolute top-8 right-8 text-6xl drop-shadow-xl">🎄</div>
            <div className="absolute bottom-8 left-8 text-6xl drop-shadow-xl">🎁</div>
            <div className="absolute bottom-8 right-8 text-6xl drop-shadow-xl">⭐</div>
          </>
        )}

        {border.category === 'Special Occasions' && (
          <>
            <div className="absolute top-8 left-8 text-6xl drop-shadow-xl">✨</div>
            <div className="absolute top-8 right-8 text-6xl drop-shadow-xl">✨</div>
            <div className="absolute bottom-8 left-8 text-6xl drop-shadow-xl">🎉</div>
            <div className="absolute bottom-8 right-8 text-6xl drop-shadow-xl">🎊</div>
          </>
        )}

        {border.category === 'Futuristic' && (
          <>
            <div className="absolute top-8 left-8 text-5xl drop-shadow-xl">⚡</div>
            <div className="absolute top-8 right-8 text-5xl drop-shadow-xl">⚡</div>
            <div className="absolute bottom-8 left-8 text-5xl drop-shadow-xl">🔮</div>
            <div className="absolute bottom-8 right-8 text-5xl drop-shadow-xl">🔮</div>
          </>
        )}

        {border.category === 'Seasonal' && (
          <>
            <div className="absolute top-8 left-8 text-6xl drop-shadow-xl">
              {border.name.match(/[\u{1F300}-\u{1F9FF}]/u)?.[0] || '✨'}
            </div>
            <div className="absolute top-8 right-8 text-6xl drop-shadow-xl">
              {border.name.match(/[\u{1F300}-\u{1F9FF}]/u)?.[0] || '✨'}
            </div>
            <div className="absolute bottom-8 left-8 text-6xl drop-shadow-xl">
              {border.name.match(/[\u{1F300}-\u{1F9FF}]/u)?.[0] || '✨'}
            </div>
            <div className="absolute bottom-8 right-8 text-6xl drop-shadow-xl">
              {border.name.match(/[\u{1F300}-\u{1F9FF}]/u)?.[0] || '✨'}
            </div>
          </>
        )}
      </div>
    );
  };

  if (!currentItem) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            Simulador de Pantalla Kiosk
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No hay contenido en la cola
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            Simulador de Pantalla Kiosk
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Vista exacta: 2048x2432px • Escala: {(PREVIEW_SCALE * 100).toFixed(0)}%
          </p>
        </div>
        <Button
          onClick={handleOpenFullscreen}
          variant="default"
          size="sm"
          className="gap-2"
        >
          <Maximize2 className="h-4 w-4" />
          Abrir Reproductor
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Kiosk Screen Simulator */}
        <div className="relative mx-auto bg-black rounded-lg overflow-hidden shadow-2xl border-4 border-gray-800"
          style={{
            width: `${SCREEN_WIDTH * PREVIEW_SCALE}px`,
            height: `${SCREEN_HEIGHT * PREVIEW_SCALE}px`,
          }}
        >
          {/* Media Content */}
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            {currentItem.media_url ? (
              currentItem.media_type === 'video' ? (
                <video
                  key={currentItem.id}
                  src={currentItem.media_url}
                  autoPlay
                  muted
                  loop
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  key={currentItem.id}
                  src={currentItem.media_url}
                  alt={currentItem.title || 'Content'}
                  className="w-full h-full object-contain"
                />
              )
            ) : (
              <div className="text-white text-center p-8">
                <Monitor className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No media preview</p>
                <p className="text-sm opacity-70">{currentItem.title}</p>
              </div>
            )}
          </div>

          {/* Border Overlay */}
          {renderBorderOverlay()}

          {/* Status Badge */}
          <div className="absolute top-4 left-4 z-20">
            <Badge variant="secondary" className="text-xs">
              {currentIndex + 1} / {queueItems.length}
            </Badge>
          </div>

          {/* Timer Badge */}
          <div className="absolute top-4 right-4 z-20">
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              <Play className="h-3 w-3" />
              {timeLeft}s
            </Badge>
          </div>
        </div>

        {/* Current Item Info */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-base">{currentItem.title || 'Sin título'}</h4>
            <Badge className={
              currentItem.computed_status === 'published' ? 'bg-green-500' :
              currentItem.computed_status === 'active' ? 'bg-green-500' :
              currentItem.computed_status === 'scheduled' ? 'bg-blue-500' :
              currentItem.computed_status === 'expired' ? 'bg-red-500' :
              currentItem.computed_status === 'pending' ? 'bg-yellow-500' :
              'bg-gray-500'
            }>
              {currentItem.computed_status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Tipo:</span>
              <span className="ml-2 font-medium">{currentItem.media_type}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Duración:</span>
              <span className="ml-2 font-medium">{currentItem.duration}s</span>
            </div>
            <div>
              <span className="text-muted-foreground">Borde:</span>
              <span className="ml-2 font-medium">
                {currentItem.border_style === 'none' ? 'Sin borde' : currentItem.border_style}
              </span>
            </div>
            {currentItem.scheduled_start && (
              <div>
                <span className="text-muted-foreground">Programado:</span>
                <span className="ml-2 font-medium">
                  {new Date(currentItem.scheduled_start).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={queueItems.length <= 1}
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={queueItems.length <= 1}
          >
            <SkipForward className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentIndex(0);
              setTimeLeft(queueItems[0]?.duration || 10);
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
