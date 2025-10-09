import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { transformImageToResolution } from "@/utils/imageProcessing";
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
  }) => void;
}

export const ImageEditor = ({ file, settings, onChange }: ImageEditorProps) => {
  const [zoom, setZoom] = useState(1);
  const [horizontal, setHorizontal] = useState(0);
  const [vertical, setVertical] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const { screenWidth, screenHeight } = settings;
  const aspectRatioStyle = useMemo(
    () => ({ aspectRatio: `${screenWidth} / ${screenHeight}` }),
    [screenWidth, screenHeight]
  );

  const objectUrl = useMemo(() => URL.createObjectURL(file), [file]);

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
      });
    } finally {
      setIsProcessing(false);
    }
  }, [file, screenWidth, screenHeight, zoom, horizontal, vertical, onChange, previewUrl]);

  useEffect(() => {
    if (!hasInitialized) {
      setHasInitialized(true);
      void applyChanges();
    }
  }, [applyChanges, hasInitialized]);

  return (
    <div className="space-y-4">
      <div
        className="w-full bg-muted/40 border border-dashed rounded-lg overflow-hidden relative"
        style={aspectRatioStyle}
      >
        <img
          src={objectUrl}
          alt="Editable preview"
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            transform: `scale(${zoom}) translate(${horizontal * 50}%, ${vertical * 50}%)`,
            transition: "transform 150ms ease",
          }}
        />
      </div>

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
          {isProcessing ? "Processing..." : "Apply Crop & Resize"}
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
