import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Upload, Camera, Video, CreditCard, Image, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BorderPreview } from "@/components/BorderPreview";
import showYoLogo from "@/assets/showyo-logo-color.png";

const ContentUpload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [borderStyle, setBorderStyle] = useState("none");
  const [displayDuration, setDisplayDuration] = useState(10);
  const [previewUrl, setPreviewUrl] = useState("");

  // Reset border when switching to/from clean plans
  React.useEffect(() => {
    if (selectedPlan && (selectedPlan.includes('clean') || !selectedPlan.includes('border'))) {
      setBorderStyle("none");
    }
  }, [selectedPlan]);

  const plans = [
    { id: "photo-logo", title: "Photo with Logo", price: 10, type: "photo", features: ["ShowYo watermark", "Content protection"] },
    { id: "photo-border-logo", title: "Photo with Border", price: 15, type: "photo", features: ["Custom border", "ShowYo watermark"], popular: true },
    { id: "photo-clean", title: "Clean Photo", price: 15, type: "photo", features: ["No watermarks", "Full flexibility"] },
    { id: "video-logo", title: "Video with Logo", price: 20, type: "video", features: ["ShowYo watermark", "Brand protection"] },
    { id: "video-border-logo", title: "Video with Border", price: 25, type: "video", features: ["Custom border", "ShowYo watermark"], popular: true },
    { id: "video-clean", title: "Clean Video", price: 30, type: "video", features: ["Premium quality", "No restrictions"] },
  ];

  const borderOptions = [
    // 🎄 Holiday Borders
    { 
      id: "merry-christmas", 
      name: "🎄 Merry Christmas",
      category: "Holiday",
      preview: "border-4 border-red-600 bg-gradient-to-r from-red-100 via-green-100 to-red-100",
      description: "Festive Christmas celebration",
      message: "Merry Christmas"
    },
    { 
      id: "happy-new-year", 
      name: "🎊 Happy New Year",
      category: "Holiday",
      preview: "border-4 border-yellow-500 bg-gradient-to-r from-yellow-100 via-orange-100 to-yellow-100",
      description: "New Year celebration",
      message: "Happy New Year"
    },
    { 
      id: "happy-valentines", 
      name: "💝 Happy Valentine's Day",
      category: "Holiday",
      preview: "border-4 border-pink-500 bg-gradient-to-r from-pink-100 via-red-100 to-pink-100",
      description: "Love and romance celebration",
      message: "Happy Valentine's Day"
    },
    { 
      id: "happy-halloween", 
      name: "🎃 Happy Halloween",
      category: "Holiday",
      preview: "border-4 border-orange-600 bg-gradient-to-r from-orange-100 via-black/10 to-orange-100",
      description: "Spooky Halloween fun",
      message: "Happy Halloween"
    },
    { 
      id: "happy-easter", 
      name: "🐰 Happy Easter",
      category: "Holiday",
      preview: "border-4 border-purple-500 bg-gradient-to-r from-purple-100 via-yellow-100 to-purple-100",
      description: "Easter celebration",
      message: "Happy Easter"
    },
    { 
      id: "happy-thanksgiving", 
      name: "🦃 Happy Thanksgiving",
      category: "Holiday",
      preview: "border-4 border-amber-600 bg-gradient-to-r from-amber-100 via-orange-100 to-amber-100",
      description: "Thanksgiving gratitude",
      message: "Happy Thanksgiving"
    },
    // 🎓 Special Occasions
    { 
      id: "happy-birthday", 
      name: "🎂 Happy Birthday",
      category: "Special Occasions",
      preview: "border-4 border-blue-500 bg-gradient-to-r from-blue-100 via-pink-100 to-blue-100",
      description: "Birthday celebration",
      message: "Happy Birthday"
    },
    { 
      id: "congrats-graduate", 
      name: "🎓 Congrats Graduate",
      category: "Special Occasions",
      preview: "border-4 border-indigo-600 bg-gradient-to-r from-indigo-100 via-yellow-100 to-indigo-100",
      description: "Graduation achievement",
      message: "Congrats Graduate"
    },
    { 
      id: "happy-anniversary", 
      name: "💍 Happy Anniversary",
      category: "Special Occasions",
      preview: "border-4 border-rose-500 bg-gradient-to-r from-rose-100 via-gold-100 to-rose-100",
      description: "Anniversary celebration",
      message: "Happy Anniversary"
    },
    { 
      id: "wedding-day", 
      name: "👰 Wedding Day",
      category: "Special Occasions",
      preview: "border-4 border-white bg-gradient-to-r from-white via-pink-50 to-white",
      description: "Wedding celebration",
      message: "Wedding Day"
    },
    // 🚀 Futuristic Borders
    { 
      id: "neon-glow", 
      name: "🌐 Neon Glow",
      category: "Futuristic",
      preview: "border-4 border-cyan-400 bg-gradient-to-r from-cyan-100 via-purple-100 to-cyan-100",
      description: "Neon glow effects",
      message: "Neon Glow"
    },
    { 
      id: "tech-circuit", 
      name: "⚡ Tech Circuit",
      category: "Futuristic",
      preview: "border-4 border-blue-600 bg-gradient-to-r from-blue-100 via-cyan-100 to-blue-100",
      description: "Tech circuit pattern",
      message: "Tech Circuit"
    },
    { 
      id: "galaxy", 
      name: "🌌 Galaxy",
      category: "Futuristic",
      preview: "border-4 border-indigo-600 bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100",
      description: "Stars and space",
      message: "Galaxy"
    },
    { 
      id: "cyberpunk", 
      name: "💠 Cyberpunk",
      category: "Futuristic",
      preview: "border-4 border-fuchsia-500 bg-gradient-to-r from-fuchsia-100 via-cyan-100 to-fuchsia-100",
      description: "Cyberpunk neon grid",
      message: "Cyberpunk"
    },
    // 🌤️ Seasonal Borders
    { 
      id: "summer", 
      name: "☀️ Summer",
      category: "Seasonal",
      preview: "border-4 border-yellow-400 bg-gradient-to-r from-yellow-100 via-orange-100 to-yellow-100",
      description: "Summer vibes",
      message: "Summer"
    },
    { 
      id: "winter", 
      name: "❄️ Winter",
      category: "Seasonal",
      preview: "border-4 border-blue-300 bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50",
      description: "Winter wonderland",
      message: "Winter"
    },
    { 
      id: "autumn", 
      name: "🍂 Autumn",
      category: "Seasonal",
      preview: "border-4 border-orange-500 bg-gradient-to-r from-orange-100 via-red-100 to-orange-100",
      description: "Fall leaves",
      message: "Autumn"
    },
  ];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const MAX_SIZE = 600 * 1024 * 1024; // 600 MB
      if (selectedFile.size > MAX_SIZE) {
        toast({
          title: "File too large",
          description: "Maximum allowed size is 600 MB. Please compress or trim your video.",
          variant: "destructive",
        });
        // Reset the input so the same file can be picked again after changes
        event.target.value = "";
        return;
      }

      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      
      // Auto-select logo-only plan based on file type (without border)
      if (selectedFile.type.startsWith('video/')) {
        setSelectedPlan("video-logo");
      } else if (selectedFile.type.startsWith('image/')) {
        setSelectedPlan("photo-logo");
      }
    }
  };

  const handlePaymentAndUpload = async () => {
    if (!file || !selectedPlan) {
      toast({
        title: "Missing Information",
        description: "Please select a file and pricing plan",
        variant: "destructive",
      });
      return;
    }

    // Size guard for large files
    const MAX_SIZE = 600 * 1024 * 1024; // 600 MB
    if (file.size > MAX_SIZE) {
      toast({
        title: "File too large",
        description: "Maximum allowed size is 600 MB.",
        variant: "destructive",
      });
      return;
    }

    // Validate border selection for border plans
    if (selectedPlan.includes('border') && borderStyle === 'none') {
      toast({
        title: "Border Required",
        description: "Please select a border style for your border plan",
        variant: "destructive",
      });
      return;
    }

    // Ensure clean plans don't have borders
    const finalBorderStyle = selectedPlan.includes('clean') ? 'none' : borderStyle;

    setIsUploading(true);

    try {
      const selectedPlanData = plans.find(p => p.id === selectedPlan);
      
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `content/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('billboard-content')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Create order for paid content
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_email: 'guest@showyo.app',
          pricing_option_id: selectedPlan,
          price_cents: selectedPlanData!.price * 100,
          file_name: file.name,
          file_type: file.type,
          file_path: filePath,
          border_id: selectedPlan.includes('border') ? borderStyle : 'none',
          duration_seconds: 10,
          status: 'pending',
          moderation_status: 'pending',
          is_admin_content: false,
          max_plays: 1,
          auto_complete_after_play: true
        })
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      // Create Stripe checkout session
      const { data: checkoutData, error: checkoutError } = await supabase.functions
        .invoke('create-checkout-session', {
          body: {
            orderId: orderData.id,
            planId: selectedPlan,
            userEmail: 'guest@showyo.app'
          }
        });

      if (checkoutError || !checkoutData?.url) {
        throw new Error('Failed to create checkout session');
      }

      // Redirect to Stripe Checkout (iOS Safari compatible)
      toast({
        title: "Opening Stripe Checkout",
        description: "Please complete your payment to submit your content.",
      });
      
      // Use href for better iOS Safari compatibility
      window.location.href = checkoutData.url;

      // Clear form after opening checkout
      setFile(null);
      setPreviewUrl('');
      setSelectedPlan('');
      setBorderStyle('none');

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "There was an error processing your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Content
              </CardTitle>
              <CardDescription>
                Select your photo or video file (max 600 MB)
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
              </div>

              {previewUrl && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="relative border-2 border-dashed border-border rounded-lg p-4">
                    {file?.type.startsWith('image/') ? (
                      <img src={previewUrl} alt="Preview" className="max-w-full h-48 object-contain mx-auto" />
                    ) : (
                      <video src={previewUrl} controls className="max-w-full h-48 mx-auto" />
                    )}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="duration">Display Duration</Label>
                <div className="mt-2 p-4 bg-muted/50 rounded-lg border-2 border-dashed border-border text-center">
                  <div className="text-xl font-bold text-primary">10 Seconds</div>
                  <p className="text-sm text-muted-foreground mt-1">Fixed duration for all paid content</p>
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
                    if (!file) return true;
                    // If file is selected, only show matching type
                    if (file.type.startsWith('video/')) return plan.type === 'video';
                    if (file.type.startsWith('image/')) return plan.type === 'photo';
                    return true;
                  })
                  .map((plan) => (
                  <div key={plan.id} className={`relative p-4 border rounded-lg ${plan.popular ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    {plan.popular && (
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
                          {plan.features.map((feature, idx) => (
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
        {selectedPlan.includes('border') && (
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
                {["Basic", "Holiday", "Special Occasions", "Futuristic", "Seasonal"].map((category) => {
                  const categoryBorders = borderOptions.filter(border => border.category === category);
                  if (categoryBorders.length === 0) return null;
                  
                  return (
                    <div key={category} className="space-y-4">
                      <h4 className="font-semibold text-base text-foreground flex items-center gap-2">
                        <span className="text-primary">{category}</span>
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
        {selectedPlan && (selectedPlan.includes('logo') && !selectedPlan.includes('border')) && (
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
                  <span>10 seconds (fixed)</span>
                </div>
                {selectedPlan.includes('border') && (
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Border Style</span>
                    <span>{borderOptions.find(b => b.id === borderStyle)?.name}</span>
                  </div>
                )}
                {selectedPlan.includes('clean') && (
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
                  disabled={!file || !selectedPlan || isUploading}
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