import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DisplaySettings } from "@/hooks/use-display-settings";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, Scissors, AlertCircle } from "lucide-react";
import showYoLogo from "@/assets/showyo-logo-color.png";

interface VideoEditorProps {
  file: File;
  settings: DisplaySettings;
  includesLogo?: boolean;
  onHasUnappliedChanges?: (hasChanges: boolean) => void;
  onChange: (result: {
    file: File;
    previewUrl: string;
    trimStartSeconds: number;
    trimEndSeconds: number;
    durationSeconds: number;
  }) => void;
}

export const VideoEditor = ({ file, settings, includesLogo = false, onHasUnappliedChanges, onChange }: VideoEditorProps) => {
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number>();
  const [hasUnappliedChanges, setHasUnappliedChanges] = useState(false);
  const lastAppliedState = useRef({ start: 0, end: 0 });
  const [hasAutoApplied, setHasAutoApplied] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    return () => {
      URL.revokeObjectURL(url);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [file]);

  const applyChanges = useCallback(() => {
    const trimmed = Math.max(end - start, 0);
    onChange({
      file,
      previewUrl: videoUrl,
      trimStartSeconds: Number(start.toFixed(2)),
      trimEndSeconds: Number(end.toFixed(2)),
      durationSeconds: Number(trimmed.toFixed(2)),
    });
    lastAppliedState.current = { start, end };
    setHasUnappliedChanges(false);
  }, [file, onChange, videoUrl, start, end]);

  const handleLoaded = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const total = video.duration || 0;
    setDuration(total);
    setStart(0);
    const initialEnd = Math.min(total, settings.maxVideoDurationSeconds);
    setEnd(initialEnd);
    setCurrentTime(0);
    lastAppliedState.current = { start: 0, end: initialEnd };
  }, [settings.maxVideoDurationSeconds]);

  useEffect(() => {
    if (duration > 0 && !hasAutoApplied) {
      setHasAutoApplied(true);
      applyChanges();
    }
  }, [duration, hasAutoApplied, applyChanges]);

  useEffect(() => {
    if (hasAutoApplied) {
      const hasChanged =
        start !== lastAppliedState.current.start ||
        end !== lastAppliedState.current.end;
      setHasUnappliedChanges(hasChanged);
    }
  }, [start, end, hasAutoApplied]);

  useEffect(() => {
    onHasUnappliedChanges?.(hasUnappliedChanges);
  }, [hasUnappliedChanges, onHasUnappliedChanges]);

  const handleStartChange = (value: number) => {
    const clamped = Math.max(0, Math.min(value, end - 0.1));
    setStart(clamped);
    if (videoRef.current) {
      videoRef.current.currentTime = clamped;
      setCurrentTime(clamped);
    }
  };

  const handleEndChange = (value: number) => {
    const clamped = Math.min(duration, Math.max(value, start + 0.1));
    setEnd(clamped);
  };

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      if (currentTime >= end) {
        video.currentTime = start;
        setCurrentTime(start);
      }
      video.play();
      setIsPlaying(true);
    }
  };

  const handleReset = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = start;
    setCurrentTime(start);
    video.pause();
    setIsPlaying(false);
  };

  const updateTime = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const time = video.currentTime;
    setCurrentTime(time);

    if (time >= end && isPlaying) {
      video.pause();
      video.currentTime = end;
      setCurrentTime(end);
      setIsPlaying(false);
      return;
    }

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateTime);
    }
  }, [end, isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateTime);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, updateTime]);

  const trimDuration = end - start;
  const isValidDuration = trimDuration >= settings.minVideoDurationSeconds &&
                          trimDuration <= settings.maxVideoDurationSeconds;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const progressPercent = duration > 0 ? ((currentTime - start) / (end - start)) * 100 : 0;

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-muted/40">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Scissors className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Video Editor</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isValidDuration ? "default" : "destructive"}>
              {trimDuration.toFixed(1)}s
            </Badge>
            <Badge variant="outline">
              {formatTime(currentTime)}
            </Badge>
          </div>
        </div>

        <div className="w-full bg-black rounded-lg overflow-hidden relative">
          {videoUrl && (
            <>
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full"
                onLoadedMetadata={handleLoaded}
                playsInline
              />
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50">
                <div
                  className="h-full bg-primary transition-all duration-100"
                  style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
                />
              </div>
              {includesLogo && (
                <img
                  src={showYoLogo}
                  alt="ShowYo Logo"
                  className="absolute bottom-6 right-4 w-24 h-auto pointer-events-none opacity-90"
                  style={{ zIndex: 10 }}
                />
              )}
            </>
          )}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={duration === 0}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            size="lg"
            onClick={handlePlayPause}
            disabled={duration === 0}
            className="px-8"
          >
            {isPlaying ? (
              <>
                <Pause className="h-5 w-5 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Preview Trim
              </>
            )}
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground">Start Time</label>
            <span className="text-xs text-muted-foreground">{formatTime(start)}</span>
          </div>
          <Slider
            value={[start]}
            min={0}
            max={Math.max(duration - 0.1, 0.1)}
            step={0.1}
            onValueChange={([value]) => handleStartChange(value)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground">End Time</label>
            <span className="text-xs text-muted-foreground">{formatTime(end)}</span>
          </div>
          <Slider
            value={[end]}
            min={start + 0.1}
            max={duration}
            step={0.1}
            onValueChange={([value]) => handleEndChange(value)}
          />
        </div>
      </div>

      <Button
        onClick={applyChanges}
        disabled={!hasUnappliedChanges}
        size="lg"
        className={`w-full ${hasUnappliedChanges ? "animate-pulse bg-orange-600 hover:bg-orange-700 ring-2 ring-orange-400 ring-offset-2" : ""}`}
      >
        {hasUnappliedChanges ? "⚠️ Apply Changes" : "✓ Changes Applied"}
      </Button>

      <Card className={`p-4 ${isValidDuration ? 'bg-primary/5 border-primary/20' : 'bg-destructive/5 border-destructive/20'}`}>
        <div className="flex items-start gap-3">
          {isValidDuration ? (
            <Scissors className="h-5 w-5 text-primary mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          )}
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Trimmed Duration</span>
              <span className="text-lg font-bold">{trimDuration.toFixed(1)}s</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {isValidDuration ? (
                `Perfect! Video duration is within the allowed range of ${settings.minVideoDurationSeconds}-${settings.maxVideoDurationSeconds} seconds.`
              ) : (
                `Video must be between ${settings.minVideoDurationSeconds}-${settings.maxVideoDurationSeconds} seconds. Current: ${trimDuration.toFixed(1)}s`
              )}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
