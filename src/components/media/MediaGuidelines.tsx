import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DisplaySettings } from "@/domain/services/displaySettingsService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface MediaGuidelinesProps {
  settings: DisplaySettings;
}

export const MediaGuidelines = ({ settings }: MediaGuidelinesProps) => {
  const resolution = `${settings.screenWidth} × ${settings.screenHeight}`;
  const videoDurationCopy = `${settings.minVideoDurationSeconds} - ${settings.maxVideoDurationSeconds} seconds`;
  const aspectRatio = (settings.screenWidth / settings.screenHeight).toFixed(2);

  return (
    <Card className="bg-muted/40 border-dashed">
      <CardHeader>
        <CardTitle>Upload Requirements</CardTitle>
        <CardDescription>
          Optimize your creatives to look crisp on the ShowYo billboard wall.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <Alert variant="default" className="bg-background/80 border-muted">
          <Info className="h-4 w-4" />
          <AlertTitle>Billboard Canvas</AlertTitle>
          <AlertDescription>
            Target resolution <span className="font-medium text-foreground">{resolution}</span> with a {aspectRatio}:1 aspect ratio.
            Images are auto-cropped and videos scale to fill the canvas.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <h4 className="font-semibold text-foreground">Images</h4>
            <ul className="space-y-1">
              <li>• Max file size: {settings.maxImageFileSizeMB} MB</li>
              <li>• Recommended format: {settings.recommendedImageFormat}</li>
              <li>• Minimum resolution: {resolution}</li>
            </ul>
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-foreground">Videos</h4>
            <ul className="space-y-1">
              <li>• Max file size: {settings.maxVideoFileSizeMB} MB</li>
              <li>• Recommended format: {settings.recommendedVideoFormat}</li>
              <li>• Trim duration between {videoDurationCopy}</li>
            </ul>
          </div>
        </div>

        <Separator />
        <p>
          Tips: keep essential text within the safe zone, avoid low-contrast edges, and ensure any motion graphics stay readable
          within the configured play time.
        </p>
      </CardContent>
    </Card>
  );
};
