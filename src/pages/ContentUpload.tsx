import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Upload, Camera, Video, CreditCard, Image, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BorderPreview } from "@/components/BorderPreview";
import showYoLogo from "@/assets/showyo-logo-color.png";
import { planService } from "@/domain/services/planService";
import { borderService } from "@/domain/services/borderService";
import { firebaseStorageService } from "@/domain/services/firebase/storageService";
import { firebaseOrderService } from "@/domain/services/firebase/orderService";
import { firebasePaymentService } from "@/domain/services/firebase/paymentService";
import { MediaEditor } from "@/components/media/MediaEditor";
import { MediaGuidelines } from "@/components/media/MediaGuidelines";
import { useDisplaySettings } from "@/hooks/use-display-settings";

const ContentUpload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings } = useDisplaySettings();
  const [isUploading, setIsUploading] = useState(false);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [processedFile, setProcessedFile] = useState<File | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [borderStyle, setBorderStyle] = useState("none");
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploadMetadata, setUploadMetadata] = useState<Record<string, string | number | boolean>>({});
  const [videoTrim, setVideoTrim] = useState<{ start: number; end: number; duration: number } | null>(null);

  const plans = useMemo(() => planService.getAllPlans(), []);
  const borderThemes = useMemo(() => borderService.getAll(), []);
  const borderCategories = useMemo(() => borderService.getCategories(), []);
  const borderCategoryLabels = useMemo(
    () => ({
      Holiday: "🎄 Holiday Borders",
      "Special Occasions": "🎓 Special Occasions",
      Futuristic: "🚀 Futuristic Borders",
      Seasonal: "🌤️ Seasonal Borders",
    }),
    []
  );

  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Reset border when switching to/from clean plans
  React.useEffect(() => {
    if (!selectedPlan) {
      setBorderStyle("none");
      return;
    }

    if (!planService.planSupportsBorderSelection(selectedPlan)) {
      setBorderStyle("none");
    }
  }, [selectedPlan]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    const isVideo = selectedFile.type.startsWith("video/");
    const maxBytes = (isVideo ? settings.maxVideoFileSizeMB : settings.maxImageFileSizeMB) * 1024 * 1024;

    if (selectedFile.size > maxBytes) {
      toast({
        title: "File too large",
        description: `Maximum allowed size is ${isVideo ? settings.maxVideoFileSizeMB : settings.maxImageFileSizeMB} MB. Please optimize and try again.`,
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }
      return url;
    });

    setSourceFile(selectedFile);
    setProcessedFile(selectedFile);
    setUploadMetadata({
      originalFileSizeBytes: selectedFile.size,
      originalMimeType: selectedFile.type,
    });
    setVideoTrim(null);

    if (selectedFile.type.startsWith("video/")) {
      setSelectedPlan("video-logo");
    } else if (selectedFile.type.startsWith("image/")) {
      setSelectedPlan("photo-logo");
    }
  };

  const handleImageAdjustments = React.useCallback(
    (result: {
      file: File;
      previewUrl: string;
      width: number;
      height: number;
      zoom: number;
      offsetXPercent: number;
      offsetYPercent: number;
    }) => {
      setProcessedFile(result.file);
      setPreviewUrl((previous) => {
        if (previous && previous !== result.previewUrl) {
          URL.revokeObjectURL(previous);
        }
        return result.previewUrl;
      });
      setUploadMetadata((prev) => ({
        ...prev,
        processedWidth: result.width,
        processedHeight: result.height,
        imageZoom: Number(result.zoom.toFixed(2)),
        imageOffsetXPercent: Number(result.offsetXPercent.toFixed(2)),
        imageOffsetYPercent: Number(result.offsetYPercent.toFixed(2)),
      }));
      setVideoTrim(null);
    },
    []
  );

  const handleVideoAdjustments = React.useCallback(
    (result: {
      file: File;
      previewUrl: string;
      trimStartSeconds: number;
      trimEndSeconds: number;
      durationSeconds: number;
    }) => {
      setProcessedFile(result.file);
      setPreviewUrl((previous) => {
        if (previous && previous !== result.previewUrl) {
          URL.revokeObjectURL(previous);
        }
        return result.previewUrl;
      });
      setVideoTrim({
        start: result.trimStartSeconds,
        end: result.trimEndSeconds,
        duration: result.durationSeconds,
      });
      setUploadMetadata((prev) => ({
        ...prev,
        trimStartSeconds: Number(result.trimStartSeconds.toFixed(2)),
        trimEndSeconds: Number(result.trimEndSeconds.toFixed(2)),
        processedDurationSeconds: Number(result.durationSeconds.toFixed(2)),
      }));
    },
    []
  );

  const handlePaymentAndUpload = async () => {
    if (!processedFile || !selectedPlan) {
      toast({
        title: "Missing Information",
        description: "Please select a file and pricing plan",
        variant: "destructive",
      });
      return;
    }

    const isVideo = processedFile.type.startsWith("video/");
    const maxBytes =
      (isVideo ? settings.maxVideoFileSizeMB : settings.maxImageFileSizeMB) * 1024 * 1024;

    if (processedFile.size > maxBytes) {
      toast({
        title: "File too large",
        description: `Maximum allowed size is ${isVideo ? settings.maxVideoFileSizeMB : settings.maxImageFileSizeMB} MB. Please optimize and try again.`,
        variant: "destructive",
      });
      return;
    }

    if (isVideo) {
      if (!videoTrim) {
        toast({
          title: "Trim Required",
          description: "Please confirm the start and end times for your clip.",
          variant: "destructive",
        });
        return;
      }

      if (videoTrim.duration < settings.minVideoDurationSeconds) {
        toast({
          title: "Clip Too Short",
          description: `Videos must be at least ${settings.minVideoDurationSeconds} seconds.`,
          variant: "destructive",
        });
        return;
      }

      if (videoTrim.duration > settings.maxVideoDurationSeconds) {
        toast({
          title: "Clip Too Long",
          description: `Videos must be ${settings.maxVideoDurationSeconds} seconds or less. Trim your clip before uploading.`,
          variant: "destructive",
        });
        return;
      }
    }

    if (planService.planRequiresBorder(selectedPlan) && borderStyle === "none") {
      toast({
        title: "Border Required",
        description: "Please select a border style for your border plan",
        variant: "destructive",
      });
      return;
    }

    const finalBorderStyle = planService.planSupportsBorderSelection(selectedPlan) ? borderStyle : "none";

    setIsUploading(true);

    try {
      const selectedPlanData = planService.getPlan(selectedPlan);
      const durationSeconds =
        selectedPlanData?.type === "video"
          ? videoTrim?.duration ?? settings.minVideoDurationSeconds
          : selectedPlanData?.displayDurationSeconds ?? settings.photoDisplayDurationSeconds;

      const metadata: Record<string, string | number | boolean> = {
        plan: selectedPlan,
        border: finalBorderStyle,
        source: "public-upload",
        screenWidth: settings.screenWidth,
        screenHeight: settings.screenHeight,
        ...uploadMetadata,
      };

      if (selectedPlanData?.type === "video" && videoTrim) {
        metadata.trimStartSeconds = Number(videoTrim.start.toFixed(2));
        metadata.trimEndSeconds = Number(videoTrim.end.toFixed(2));
        metadata.processedDurationSeconds = Number(videoTrim.duration.toFixed(2));
      }

      if (selectedPlanData?.type === "photo") {
        metadata.processedWidth = settings.screenWidth;
        metadata.processedHeight = settings.screenHeight;
      }

      const uploadResult = await firebaseStorageService.uploadBillboardAsset({
        file: processedFile,
        folder: "content",
        metadata,
      });

      const order = await firebaseOrderService.createOrder({
        userEmail: "guest@showyo.app",
        pricingOptionId: selectedPlan,
        priceCents: selectedPlanData!.price * 100,
        fileName: processedFile.name,
        fileType: processedFile.type,
        filePath: uploadResult.filePath,
        borderId: finalBorderStyle,
        durationSeconds,
        isAdminContent: false,
        moderationStatus: "pending",
        status: "pending",
        displayStatus: "pending",
        maxPlays: 1,
        autoCompleteAfterPlay: true,
      });

      const checkoutData = await firebasePaymentService.createCheckoutSession({
        orderId: order.id,
        planId: selectedPlan,
        userEmail: "guest@showyo.app",
      });

      if (!checkoutData?.url) {
        throw new Error("Failed to create checkout session");
      }

      toast({
        title: "Opening Stripe Checkout",
        description: "Please complete your payment to submit your content.",
      });

      window.location.href = checkoutData.url;

      setSourceFile(null);
      setProcessedFile(null);
      setUploadMetadata({});
      setVideoTrim(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl("");
      setSelectedPlan("");
      setBorderStyle("none");
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: "There was an error processing your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const selectedPlanData = selectedPlan ? planService.getPlan(selectedPlan) : undefined;
  const computedDurationSeconds = React.useMemo(() => {
    if (!selectedPlanData) {
      return null;
    }

    if (selectedPlanData.type === 'video') {
      return videoTrim?.duration ?? selectedPlanData.displayDurationSeconds ?? settings.minVideoDurationSeconds;
    }

    return selectedPlanData.displayDurationSeconds ?? settings.photoDisplayDurationSeconds;
  }, [
    selectedPlanData,
    videoTrim?.duration,
    settings.minVideoDurationSeconds,
    settings.photoDisplayDurationSeconds,
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Upload Your Content
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Choose your display option and upload your photo or video to our digital billboard
          </p>
        </div>

        <div className="mb-8">
          <MediaGuidelines settings={settings} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Content
              </CardTitle>
              <CardDescription>
                Images up to {settings.maxImageFileSizeMB} MB and videos up to {settings.maxVideoFileSizeMB} MB.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="file-upload">Choose File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Recommended formats: {settings.recommendedImageFormat} for photos and {settings.recommendedVideoFormat} for videos.
                </p>
              </div>

              {sourceFile && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Adjust &amp; Preview</Label>
                    <MediaEditor
                      file={sourceFile}
                      settings={settings}
                      onImageChange={handleImageAdjustments}
                      onVideoChange={handleVideoAdjustments}
                    />
                  </div>

                  {previewUrl && processedFile && (
                    <div className="space-y-2">
                      <Label>Processed Preview</Label>
                      <div className="relative border-2 border-dashed border-border rounded-lg p-4 bg-background">
                        {processedFile.type.startsWith("image/") ? (
                          <img src={previewUrl} alt="Processed preview" className="max-w-full h-48 object-contain mx-auto" />
                        ) : (
                          <video src={previewUrl} controls className="max-w-full h-48 mx-auto" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Output: {(processedFile.size / 1024 / 1024).toFixed(2)} MB • {processedFile.type}
                      </p>
                      {videoTrim && (
                        <p className="text-xs text-muted-foreground">
                          Trim: {videoTrim.start.toFixed(1)}s → {videoTrim.end.toFixed(1)}s ({videoTrim.duration.toFixed(1)}s)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="duration">Display Duration</Label>
                <div className="mt-2 p-4 bg-muted/50 rounded-lg border-2 border-dashed border-border text-center space-y-1">
                  <div className="text-xl font-bold text-primary">
                    {computedDurationSeconds ? `${computedDurationSeconds.toFixed(1)} Seconds` : "Select a plan"}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedPlanData
                      ? selectedPlanData.type === 'video'
                        ? `Videos must run between ${settings.minVideoDurationSeconds}-${settings.maxVideoDurationSeconds} seconds.`
                        : `Photos display for ${computedDurationSeconds?.toFixed(0)} seconds on the billboard.`
                      : "Pick a plan to see the runtime for your creative."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Plans */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Choose Your Plan
              </CardTitle>
              <CardDescription>
                Select the display option that works best for you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan} className="space-y-4">
                {plans
                  .filter(plan => {
                    // If no file selected, show all plans
                    if (!sourceFile) return true;
                    if (sourceFile.type.startsWith('video/')) return plan.type === 'video';
                    if (sourceFile.type.startsWith('image/')) return plan.type === 'photo';
                    return true;
                  })
                  .map((plan) => (
                  <div key={plan.id} className={`relative p-4 border rounded-lg ${plan.isPopular ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    {plan.isPopular && (
                      <div className="absolute -top-2 left-4 bg-primary text-primary-foreground px-2 py-1 text-xs rounded">
                        Most Popular
                      </div>
                    )}
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem value={plan.id} id={plan.id} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={plan.id} className="font-medium flex items-center gap-2">
                            {plan.type === 'photo' ? <Camera className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                            {plan.title}
                          </Label>
                          <span className="font-bold text-lg">${plan.price}</span>
                        </div>
                        <ul className="text-sm text-muted-foreground mt-1">
                          {planService.getDisplayFeatures(plan).map((feature, idx) => (
                            <li key={idx}>• {feature}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        {/* Border Selection */}
        {selectedPlanData && planService.planSupportsBorderSelection(selectedPlanData.id) && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Choose Your Border Style</CardTitle>
              <CardDescription>
                Select a border style for your content <span className="text-destructive">*Required</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {borderStyle === 'none' && (
                <p className="text-sm text-destructive mb-4">⚠️ Please select a border style for your border plan</p>
              )}
              <div className="space-y-6">
                {borderCategories.map((category) => {
                  const categoryBorders = borderThemes.filter(border => border.category === category);
                  if (categoryBorders.length === 0) return null;

                  return (
                    <div key={category} className="space-y-4">
                      <h4 className="font-semibold text-base text-foreground flex items-center gap-2">
                        <span className="text-primary">{borderCategoryLabels[category] ?? category}</span>
                        <span className="text-sm text-muted-foreground font-normal">({categoryBorders.length})</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categoryBorders.map((border) => (
                          <BorderPreview
                            key={border.id}
                            border={border}
                            isSelected={borderStyle === border.id}
                            onClick={() => setBorderStyle(border.id)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Logo Preview */}
        {selectedPlanData && selectedPlanData.includesLogo && !selectedPlanData.includesBorder && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                ShowYo Logo Preview
              </CardTitle>
              <CardDescription>
                This logo will be added to your content as a watermark
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center p-8 bg-muted/50 rounded-lg border-2 border-dashed border-border">
                <div className="text-center space-y-4">
                  <img src={showYoLogo} alt="ShowYo Logo" className="h-20 w-auto object-contain mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    Logo will be positioned as a watermark on your {selectedPlanData?.type}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Position: Bottom Right</span>
                    <span>•</span>
                    <span>Opacity: 70%</span>
                    <span>•</span>
                    <span>Size: Auto-scaled</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary & Payment */}
        {selectedPlanData && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>{selectedPlanData.title}</span>
                  <span className="font-bold">${selectedPlanData.price}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Display Duration</span>
                  <span>
                    {computedDurationSeconds
                      ? `${computedDurationSeconds.toFixed(1)} seconds`
                      : 'Pending selection'}
                  </span>
                </div>
                {planService.planSupportsBorderSelection(selectedPlanData.id) && (
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Border Style</span>
                    <span>{borderService.getById(borderStyle)?.name ?? 'Not selected'}</span>
                  </div>
                )}
                {selectedPlanData && !selectedPlanData.includesBorder && !selectedPlanData.includesLogo && (
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Style</span>
                    <span className="text-primary font-medium">✨ Clean - No Border, No Logo</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
                  <span>${selectedPlanData.price}</span>
                </div>
                
                <Button
                  onClick={handlePaymentAndUpload}
                  disabled={!processedFile || !selectedPlan || isUploading}
                  className="w-full"
                  variant="electric"
                  size="lg"
                >
                  {isUploading ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay & Upload Content
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ContentUpload;
