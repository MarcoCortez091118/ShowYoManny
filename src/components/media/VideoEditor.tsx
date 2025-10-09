import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DisplaySettings } from "@/domain/services/displaySettingsService";
import { Slider } from "@/components/ui/slider";

interface VideoEditorProps {
  file: File;
  settings: DisplaySettings;
  onChange: (result: {
    file: File;
    previewUrl: string;
    trimStartSeconds: number;
    trimEndSeconds: number;
    durationSeconds: number;
  }) => void;
}

export const VideoEditor = ({ file, settings, onChange }: VideoEditorProps) => {
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const notifyChange = useCallback(
    (nextStart: number, nextEnd: number) => {
      const trimmed = Math.max(nextEnd - nextStart, 0);
      onChange({
        file,
        previewUrl: videoUrl,
        trimStartSeconds: Number(nextStart.toFixed(2)),
        trimEndSeconds: Number(nextEnd.toFixed(2)),
        durationSeconds: Number(trimmed.toFixed(2)),
      });
    },
    [file, onChange, videoUrl]
  );

  const handleLoaded = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const total = video.duration || 0;
    setDuration(total);
    setStart(0);
    setEnd(total);
    notifyChange(0, total);
  }, [notifyChange]);

  const handleStartChange = (value: number) => {
    const clamped = Math.max(0, Math.min(value, end - 0.1));
    setStart(clamped);
    notifyChange(clamped, end);
    if (videoRef.current) {
      videoRef.current.currentTime = clamped;
    }
  };

  const handleEndChange = (value: number) => {
    const clamped = Math.min(duration, Math.max(value, start + 0.1));
    setEnd(clamped);
    notifyChange(start, clamped);
  };

  const handlePreview = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = start;
    setIsPreviewing(true);
    void video.play();
  };

  const onTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.currentTime >= end && isPreviewing) {
      video.pause();
      video.currentTime = end;
      setIsPreviewing(false);
    }
  };

  const durationCopy = useMemo(
    () => `${settings.minVideoDurationSeconds} - ${settings.maxVideoDurationSeconds} seconds`,
    [settings.minVideoDurationSeconds, settings.maxVideoDurationSeconds]
  );

  return (
    <div className="space-y-4">
      <div className="w-full bg-black rounded-lg overflow-hidden">
        {videoUrl && (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            className="w-full"
            onLoadedMetadata={handleLoaded}
            onTimeUpdate={onTimeUpdate}
          />
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-foreground flex items-center justify-between">
            Start Time
            <span className="text-xs text-muted-foreground">{start.toFixed(1)}s</span>
          </label>
          <Slider
            value={[start]}
            min={0}
            max={Math.max(duration - 0.1, 0.1)}
            step={0.1}
            onValueChange={([value]) => handleStartChange(value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground flex items-center justify-between">
            End Time
            <span className="text-xs text-muted-foreground">{end.toFixed(1)}s</span>
          </label>
          <Slider
            value={[end]}
            min={start + 0.1}
            max={duration}
            step={0.1}
            onValueChange={([value]) => handleEndChange(value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span>
          Trimmed duration: <span className="font-semibold text-foreground">{Math.max(end - start, 0).toFixed(1)}s</span>
        </span>
        <span>Allowed range: {durationCopy}</span>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" onClick={handlePreview} disabled={duration === 0}>
          Preview Trim
        </Button>
      </div>
    </div>
  );
};
