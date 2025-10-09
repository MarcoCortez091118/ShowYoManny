import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  ImageFitMode,
  transformImageToResolution,
} from "@/utils/imageProcessing";
import { DisplaySettings } from "@/domain/services/displaySettingsService";

interface ImageEditorProps {
  file: File;
  settings: DisplaySettings;
  onChange: (result: {
    file: File;
    previewUrl: string;
    width: number;
    height: number;
    zoom: number;
    offsetXPercent: number;
    offsetYPercent: number;
    fitMode: ImageFitMode;
  }) => void;
}

export const ImageEditor = ({ file, settings, onChange }: ImageEditorProps) => {
  const [zoom, setZoom] = useState(1);
  const [horizontal, setHorizontal] = useState(0);
  const [vertical, setVertical] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [fitMode, setFitMode] = useState<ImageFitMode>("cover");
  const [isDragging, setIsDragging] = useState(false);
  const dragOrigin = useRef<{ x: number; y: number; horizontal: number; vertical: number } | null>(null);
  const canvasPreviewRef = useRef<HTMLDivElement | null>(null);

  const { screenWidth, screenHeight } = settings;
  const aspectRatioStyle = useMemo(
    () => ({ aspectRatio: `${screenWidth} / ${screenHeight}` }),
    [screenWidth, screenHeight]
  );

  const objectUrl = useMemo(() => URL.createObjectURL(file), [file]);

  const clamp = useCallback((value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), max);
  }, []);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(objectUrl);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [objectUrl, previewUrl]);

  const applyChanges = useCallback(async () => {
    setIsProcessing(true);
    try {
      const result = await transformImageToResolution(file, {
        targetWidth: screenWidth,
        targetHeight: screenHeight,
        zoom,
        offsetXPercent: horizontal,
        offsetYPercent: vertical,
        fitMode,
        backgroundColor: "#000000",
      });

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl(result.previewUrl);
      onChange({
        ...result,
        zoom,
        offsetXPercent: horizontal,
        offsetYPercent: vertical,
        fitMode,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [
    file,
    screenWidth,
    screenHeight,
    zoom,
    horizontal,
    vertical,
    fitMode,
    onChange,
    previewUrl,
  ]);

  useEffect(() => {
    if (!hasInitialized) {
      setHasInitialized(true);
      void applyChanges();
    }
  }, [applyChanges, hasInitialized]);

  useEffect(() => {
    if (!hasInitialized) {
      return;
    }

    const handle = window.setTimeout(() => {
      void applyChanges();
    }, 150);

    return () => window.clearTimeout(handle);
  }, [zoom, horizontal, vertical, fitMode, hasInitialized, applyChanges]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const rect = canvasPreviewRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragOrigin.current = {
      x: event.clientX,
      y: event.clientY,
      horizontal,
      vertical,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragOrigin.current || !canvasPreviewRef.current) {
      return;
    }

    const rect = canvasPreviewRef.current.getBoundingClientRect();
    const deltaX = (event.clientX - dragOrigin.current.x) / rect.width;
    const deltaY = (event.clientY - dragOrigin.current.y) / rect.height;

    setHorizontal(clamp(dragOrigin.current.horizontal + deltaX * 2, -1, 1));
    setVertical(clamp(dragOrigin.current.vertical + deltaY * 2, -1, 1));
  };

  const stopDragging = () => {
    setIsDragging(false);
    dragOrigin.current = null;
  };

  const resetAdjustments = () => {
    setZoom(1);
    setHorizontal(0);
    setVertical(0);
    setFitMode("cover");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Drag the image to reposition it within the screen frame. Use zoom for tighter crops or switch to
            "Fit to screen" to avoid cropping.
          </p>
        </div>
        <ToggleGroup
          type="single"
          value={fitMode}
          onValueChange={(value) => {
            if (!value) return;
            setFitMode(value as ImageFitMode);
          }}
          className="bg-muted/40 rounded-md p-1"
        >
          <ToggleGroupItem value="cover" className="px-3 py-1 text-sm">
            Fill Frame
          </ToggleGroupItem>
          <ToggleGroupItem value="contain" className="px-3 py-1 text-sm">
            Fit to Screen
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div
        ref={canvasPreviewRef}
        className="w-full bg-muted/40 border border-dashed rounded-lg overflow-hidden relative cursor-grab active:cursor-grabbing"
        style={aspectRatioStyle}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerLeave={stopDragging}
        onPointerCancel={stopDragging}
      >
        <img
          src={objectUrl}
          alt="Editable preview"
          className="absolute inset-0 h-full w-full"
          style={{
            transform: `translate(${horizontal * 50}%, ${vertical * 50}%) scale(${fitMode === "cover" ? zoom : Math.max(zoom, 1)})`,
            transformOrigin: "center",
            objectFit: fitMode === "cover" ? "cover" : "contain",
            transition: isDragging ? "none" : "transform 120ms ease",
          }}
        />
        <div className="pointer-events-none absolute inset-0 border border-white/40 shadow-[inset_0_0_60px_rgba(0,0,0,0.35)]" />
      </div>

      {fitMode === "cover" && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Zoom</label>
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.05}
            onValueChange={([value]) => setZoom(value)}
          />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Horizontal Offset</label>
          <Slider
            value={[horizontal]}
            min={-1}
            max={1}
            step={0.05}
            onValueChange={([value]) => setHorizontal(value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Vertical Offset</label>
          <Slider
            value={[vertical]}
            min={-1}
            max={1}
            step={0.05}
            onValueChange={([value]) => setVertical(value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void applyChanges()} disabled={isProcessing}>
          {isProcessing ? "Processing..." : "Update Preview"}
        </Button>
        <Button variant="outline" onClick={resetAdjustments} disabled={isProcessing}>
          Reset
        </Button>
        {previewUrl && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-primary underline"
          >
            Open processed preview
          </a>
        )}
      </div>
    </div>
  );
};
