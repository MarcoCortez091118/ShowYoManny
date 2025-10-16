import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { updateAdminPassword } from "@/utils/updateAdminPassword";
import { useToast } from "@/hooks/use-toast";
import { useDisplaySettings, DisplaySettings } from "@/hooks/use-display-settings";

const AdminSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings, updateSettings } = useDisplaySettings();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [draft, setDraft] = useState<DisplaySettings>(settings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const aspectRatio = useMemo(() => {
    if (draft.screenHeight === 0) return "--";
    return (draft.screenWidth / draft.screenHeight).toFixed(2);
  }, [draft.screenWidth, draft.screenHeight]);

  const handleNumberChange = (field: keyof DisplaySettings) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    setDraft((prev) => ({
      ...prev,
      [field]: Number.isFinite(value) ? value : prev[field],
    }));
  };

  const handleTextChange = (field: keyof DisplaySettings) => (event: ChangeEvent<HTMLInputElement>) => {
    setDraft((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSaveSettings = async () => {
    if (draft.screenWidth <= 0 || draft.screenHeight <= 0) {
      toast({
        title: "Invalid dimensions",
        description: "Screen width and height must be greater than zero.",
        variant: "destructive",
      });
      return;
    }

    if (draft.photoDisplayDurationSeconds <= 0) {
      toast({
        title: "Invalid duration",
        description: "Photo display duration must be greater than zero.",
        variant: "destructive",
      });
      return;
    }

    if (draft.minVideoDurationSeconds <= 0 || draft.maxVideoDurationSeconds <= 0) {
      toast({
        title: "Invalid video duration",
        description: "Video duration limits must be greater than zero.",
        variant: "destructive",
      });
      return;
    }

    if (draft.minVideoDurationSeconds >= draft.maxVideoDurationSeconds) {
      toast({
        title: "Duration mismatch",
        description: "Minimum video duration must be less than the maximum.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingSettings(true);
    try {
      await updateSettings(draft);
      toast({
        title: "Display settings saved",
        description: "New constraints will apply to future uploads immediately.",
      });
    } catch (error) {
      console.error('Error saving display settings:', error);
      toast({
        title: "Error saving settings",
        description: "Failed to save display settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in both password fields",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    const result = await updateAdminPassword(newPassword);
    setIsUpdating(false);

    if (result.success) {
      toast({
        title: "Success",
        description: "Admin password updated successfully",
      });
      setNewPassword("");
      setConfirmPassword("");
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update password",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 px-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Display Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="screen-width">Canvas Width (px)</Label>
                  <Input
                    id="screen-width"
                    type="number"
                    min={1}
                    value={draft.screenWidth}
                    onChange={handleNumberChange("screenWidth")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="screen-height">Canvas Height (px)</Label>
                  <Input
                    id="screen-height"
                    type="number"
                    min={1}
                    value={draft.screenHeight}
                    onChange={handleNumberChange("screenHeight")}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Aspect ratio: <span className="font-semibold text-foreground">{aspectRatio}:1</span> — used across previews and content validation.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Media Constraints</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="photo-duration">Photo Duration (seconds)</Label>
                  <Input
                    id="photo-duration"
                    type="number"
                    min={1}
                    value={draft.photoDisplayDurationSeconds}
                    onChange={handleNumberChange("photoDisplayDurationSeconds")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video-min">Video Min Duration (seconds)</Label>
                  <Input
                    id="video-min"
                    type="number"
                    min={1}
                    value={draft.minVideoDurationSeconds}
                    onChange={handleNumberChange("minVideoDurationSeconds")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video-max">Video Max Duration (seconds)</Label>
                  <Input
                    id="video-max"
                    type="number"
                    min={1}
                    value={draft.maxVideoDurationSeconds}
                    onChange={handleNumberChange("maxVideoDurationSeconds")}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="max-image-size">Max Image Size (MB)</Label>
                  <Input
                    id="max-image-size"
                    type="number"
                    min={1}
                    value={draft.maxImageFileSizeMB}
                    onChange={handleNumberChange("maxImageFileSizeMB")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-video-size">Max Video Size (MB)</Label>
                  <Input
                    id="max-video-size"
                    type="number"
                    min={1}
                    value={draft.maxVideoFileSizeMB}
                    onChange={handleNumberChange("maxVideoFileSizeMB")}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="image-format">Recommended Image Format</Label>
                  <Input
                    id="image-format"
                    value={draft.recommendedImageFormat}
                    onChange={handleTextChange("recommendedImageFormat")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video-format">Recommended Video Format</Label>
                  <Input
                    id="video-format"
                    value={draft.recommendedVideoFormat}
                    onChange={handleTextChange("recommendedVideoFormat")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Moderation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Confidence Threshold (%)</Label>
                <Input type="number" defaultValue="80" />
                <p className="text-sm text-muted-foreground">
                  Higher values require more confidence from AI moderation
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Admin Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input 
                  id="new-password"
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input 
                  id="confirm-password"
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
              <Button 
                onClick={handlePasswordChange}
                disabled={isUpdating}
              >
                {isUpdating ? "Updating..." : "Update Password"}
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isSavingSettings}>
              {isSavingSettings ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
