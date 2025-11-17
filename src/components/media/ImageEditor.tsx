import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ImageFitMode,
  transformImageToResolution,
} from "@/utils/imageProcessing";
import { DisplaySettings } from "@/hooks/use-display-settings";
import { ZoomIn, ZoomOut, Maximize2, Move, RotateCcw } from "lucide-react";
import showYoLogo from "@/assets/showyo-logo-color.png";

interface ImageEditorProps {
  file: File;
  settings: DisplaySettings;
  includesLogo?: boolean;
  onHasUnappliedChanges?: (hasChanges: boolean) => void;
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

export const ImageEditor = ({ file, settings, includesLogo = false, onHasUnappliedChanges, onChange }: ImageEditorProps) => {
  const [zoom, setZoom] = useState(1);
  const [horizontal, setHorizontal] = useState(0);
  const [vertical, setVertical] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fitMode, setFitMode] = useState<ImageFitMode>("cover");
  const [isDragging, setIsDragging] = useState(false);
  const dragOrigin = useRef<{ x: number; y: number; horizontal: number; vertical: number } | null>(null);
  const canvasPreviewRef = useRef<HTMLDivElement | null>(null);
  const [hasAutoProcessed, setHasAutoProcessed] = useState(false);
  const [hasUnappliedChanges, setHasUnappliedChanges] = useState(false);
  const lastAppliedState = useRef({ zoom: 1, horizontal: 0, vertical: 0, fitMode: "cover" as ImageFitMode });

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
    };
  }, [objectUrl]);

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

      onChange({
        ...result,
        zoom,
        offsetXPercent: horizontal,
        offsetYPercent: vertical,
        fitMode,
      });

      lastAppliedState.current = { zoom, horizontal, vertical, fitMode };
      setHasUnappliedChanges(false);
    } catch (error) {
      console.error("Image processing error:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [file, screenWidth, screenHeight, zoom, horizontal, vertical, fitMode, onChange]);

  useEffect(() => {
    if (!hasAutoProcessed) {
      setHasAutoProcessed(true);
      void applyChanges();
    }
  }, [hasAutoProcessed, applyChanges]);

  useEffect(() => {
    if (hasAutoProcessed) {
      const hasChanged =
        zoom !== lastAppliedState.current.zoom ||
        horizontal !== lastAppliedState.current.horizontal ||
        vertical !== lastAppliedState.current.vertical ||
        fitMode !== lastAppliedState.current.fitMode;

      setHasUnappliedChanges(hasChanged);
    }
  }, [zoom, horizontal, vertical, fitMode, hasAutoProcessed]);

  useEffect(() => {
    onHasUnappliedChanges?.(hasUnappliedChanges);
  }, [hasUnappliedChanges, onHasUnappliedChanges]);

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

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 1));
  };

  const toggleFitMode = () => {
    setFitMode((prev) => (prev === "cover" ? "contain" : "cover"));
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-muted/40">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Move className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Image Editor</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={fitMode === "cover" ? "default" : "outline"}>
              {fitMode === "cover" ? "Fill Frame" : "Fit to Screen"}
            </Badge>
            <Badge variant="secondary">
              {zoom.toFixed(2)}x
            </Badge>
          </div>
        </div>

        <div
          ref={canvasPreviewRef}
          className="w-full bg-black border-2 border-border rounded-lg overflow-hidden relative cursor-grab active:cursor-grabbing touch-none"
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
            className="absolute inset-0 h-full w-full pointer-events-none"
            style={{
              transform: `translate(${horizontal * 50}%, ${vertical * 50}%) scale(${fitMode === "cover" ? zoom : Math.max(zoom, 1)})`,
              transformOrigin: "center",
              objectFit: fitMode === "cover" ? "cover" : "contain",
              transition: isDragging ? "none" : "transform 150ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            draggable={false}
          />
          <div className="pointer-events-none absolute inset-0 border-2 border-primary/20 shadow-[inset_0_0_60px_rgba(0,0,0,0.5)]">
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="border border-primary/10" />
              ))}
            </div>
          </div>
          {isDragging && (
            <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
          )}
          {includesLogo && (
            <img
              src={showYoLogo}
              alt="ShowYo Logo"
              className="absolute bottom-4 right-4 w-24 h-auto pointer-events-none opacity-90"
              style={{ zIndex: 10 }}
            />
          )}
        </div>

        <div className="mt-4 text-xs text-muted-foreground text-center">
          <Move className="h-3 w-3 inline mr-1" />
          Drag to reposition • Use controls below to adjust zoom and position
        </div>
      </Card>

      <div className="grid gap-4">
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 1 || fitMode === "contain"}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">Zoom</label>
              <span className="text-xs text-muted-foreground">{zoom.toFixed(2)}x</span>
            </div>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.01}
              onValueChange={([value]) => setZoom(value)}
              disabled={fitMode === "contain"}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 3 || fitMode === "contain"}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">Horizontal Position</label>
              <span className="text-xs text-muted-foreground">{(horizontal * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[horizontal]}
              min={-1}
              max={1}
              step={0.01}
              onValueChange={([value]) => setHorizontal(value)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">Vertical Position</label>
              <span className="text-xs text-muted-foreground">{(vertical * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[vertical]}
              min={-1}
              max={1}
              step={0.01}
              onValueChange={([value]) => setVertical(value)}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => void applyChanges()}
          disabled={isProcessing || !hasUnappliedChanges}
          size="lg"
          className={`flex-1 ${hasUnappliedChanges ? "animate-pulse bg-orange-600 hover:bg-orange-700 ring-2 ring-orange-400 ring-offset-2" : ""}`}
        >
          {isProcessing ? "Processing..." : hasUnappliedChanges ? "⚠️ Apply Changes" : "✓ Changes Applied"}
        </Button>

        <Button
          variant="outline"
          onClick={toggleFitMode}
          disabled={isProcessing}
        >
          <Maximize2 className="h-4 w-4 mr-2" />
          {fitMode === "cover" ? "Fit Mode" : "Fill Mode"}
        </Button>

        <Button
          variant="outline"
          onClick={resetAdjustments}
          disabled={isProcessing}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
