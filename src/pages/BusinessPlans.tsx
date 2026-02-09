import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Monitor, Zap, MapPin, Maximize2, Clock, Repeat, DollarSign, Gift, CheckCircle2, Crown, Star, TrendingUp, ArrowLeft, MessageCircle, Send, Mail, Phone, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

interface PackageDetails {
  name: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  duration: string;
  frequency: number;
  dailyRate: number;
  monthlyTotal: number;
  features: string[];
  description: string;
  icon: typeof Crown;
}

const BusinessPlans = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<"monthly" | "extended" | "weekly">("monthly");
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("https://n8n.srv991322.hstgr.cloud/webhook/b1304d04-3c9b-4bfe-9062-f3d767cbe921", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contactForm),
      });

      if (response.ok) {
        toast.success("Message sent successfully! We'll get back to you soon.");
        setContactForm({ name: "", email: "", phone: "", message: "" });
      } else {
        toast.error("Failed to send message. Please try WhatsApp instead.");
      }
    } catch (error) {
      toast.error("Failed to send message. Please try WhatsApp instead.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppClick = () => {
    const whatsappUrl = "https://wa.me/19297421127";
    window.open(whatsappUrl, "_blank");
  };

  const packages: Record<string, PackageDetails[]> = {
    monthly: [
      {
        name: "Bronze Package",
        tier: "bronze",
        duration: "1 Month",
        frequency: 40,
        dailyRate: 69,
        monthlyTotal: 2070,
        description: "Perfect for small businesses starting their Times Square journey",
        icon: Star,
        features: [
          "40 displays per day",
          "10 seconds per display",
          "Social media promotion on ShowYo official pages",
          "Prime Times Square location",
          "Multiple format support"
        ]
      },
      {
        name: "Silver Package",
        tier: "silver",
        duration: "1 Month",
        frequency: 90,
        dailyRate: 135,
        monthlyTotal: 4050,
        description: "Enhanced exposure for growing brands",
        icon: TrendingUp,
        features: [
          "90 displays per day",
          "10 seconds per display",
          "Social media promotion on ShowYo official pages",
          "Premium Times Square location",
          "Multiple format support"
        ]
      },
      {
        name: "Gold Package",
        tier: "gold",
        duration: "1 Month",
        frequency: 105,
        dailyRate: 500,
        monthlyTotal: 15000,
        description: "Premium package for maximum visibility",
        icon: Crown,
        features: [
          "105 displays per day",
          "10 seconds per display",
          "Social media promotion on ShowYo official pages",
          "Premium billboard location",
          "Priority content approval"
        ]
      },
      {
        name: "Platinum Package",
        tier: "platinum",
        duration: "1 Month",
        frequency: 300,
        dailyRate: 1000,
        monthlyTotal: 30000,
        description: "Ultimate exposure in the heart of Times Square",
        icon: Zap,
        features: [
          "300 displays per day",
          "10 seconds per display",
          "Social media promotion on ShowYo official pages",
          "Premium billboard placement",
          "VIP content approval"
        ]
      }
    ],
    extended: [
      {
        name: "Gold Package",
        tier: "gold",
        duration: "6 Months - 1 Year",
        frequency: 105,
        dailyRate: 366.66,
        monthlyTotal: 11000,
        description: "Long-term premium exposure with significant savings",
        icon: Crown,
        features: [
          "105 displays per day",
          "10 seconds per display",
          "Extended contract benefits",
          "Social media promotion included",
          "Priority support"
        ]
      },
      {
        name: "Platinum Package",
        tier: "platinum",
        duration: "6 Months - 1 Year",
        frequency: 300,
        dailyRate: 833.33,
        monthlyTotal: 25000,
        description: "Maximum long-term impact with best value",
        icon: Zap,
        features: [
          "300 displays per day",
          "10 seconds per display",
          "Extended premium contract",
          "Enhanced social media coverage",
          "Dedicated account manager"
        ]
      }
    ],
    weekly: [
      {
        name: "Bronze Weekly",
        tier: "bronze",
        duration: "1 Week",
        frequency: 48,
        dailyRate: 71.43,
        monthlyTotal: 500,
        description: "Display every 30 minutes",
        icon: Star,
        features: [
          "10 seconds every 30 minutes",
          "Perfect for short campaigns",
          "Flexible scheduling",
          "Quick setup"
        ]
      },
      {
        name: "Silver Weekly",
        tier: "silver",
        duration: "1 Week",
        frequency: 96,
        dailyRate: 142.86,
        monthlyTotal: 1000,
        description: "Display every 15 minutes",
        icon: TrendingUp,
        features: [
          "10 seconds every 15 minutes",
          "Increased visibility",
          "Premium time slots",
          "Social media boost"
        ]
      },
      {
        name: "Gold Weekly",
        tier: "gold",
        duration: "1 Week",
        frequency: 180,
        dailyRate: 214.29,
        monthlyTotal: 1500,
        description: "Display every 8 minutes",
        icon: Crown,
        features: [
          "10 seconds every 8 minutes",
          "High-frequency exposure",
          "Prime visibility",
          "Featured promotion"
        ]
      },
      {
        name: "Platinum Weekly",
        tier: "platinum",
        duration: "1 Week",
        frequency: 360,
        dailyRate: 285.71,
        monthlyTotal: 2000,
        description: "Display every 4 minutes",
        icon: Zap,
        features: [
          "10 seconds every 4 minutes",
          "Maximum weekly exposure",
          "VIP treatment",
          "Premium support"
        ]
      }
    ]
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "bronze": return "from-orange-600 to-amber-600";
      case "silver": return "from-slate-400 to-slate-600";
      case "gold": return "from-yellow-500 to-amber-600";
      case "platinum": return "from-cyan-400 to-blue-600";
      default: return "from-primary to-secondary";
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "bronze": return "bg-orange-500";
      case "silver": return "bg-slate-500";
      case "gold": return "bg-yellow-500";
      case "platinum": return "bg-cyan-500";
      default: return "bg-primary";
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <header className="border-b border-border bg-white/90 dark:bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Monitor className="h-8 w-8 text-primary animate-electric-pulse" />
                <Zap className="h-4 w-4 text-accent absolute -top-1 -right-1 animate-neon-flicker" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                ShowYo
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-gray-700 dark:text-accent hover:text-accent/80"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-500 to-secondary bg-clip-text text-transparent">
            Business Advertising Plans
          </h1>
          <p className="text-xl text-gray-600 dark:text-muted-foreground max-w-3xl mx-auto mb-8">
            Showcase your brand on the world's most iconic digital billboard in Times Square, New York
          </p>

          <Card className="max-w-2xl mx-auto bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-center text-gray-900 dark:text-white">
                <MapPin className="h-5 w-5 text-primary" />
                Premium Location Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-muted-foreground">Location:</span>
                <span className="font-semibold text-gray-900 dark:text-white">1604 Broadway, Times Square, New York</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-muted-foreground">Billboard Size:</span>
                <span className="font-semibold text-gray-900 dark:text-white">26'2.96" W × 31'2.02" H</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-muted-foreground">Resolution:</span>
                <span className="font-semibold text-gray-900 dark:text-white">2048 × 2432 pixels</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-muted-foreground">Supported Formats:</span>
                <span className="font-semibold text-gray-900 dark:text-white">JPG, JPEG, PNG, GIF, MP4, MOV, AVI, WMV</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-12">
            <TabsTrigger value="monthly">1 Month</TabsTrigger>
            <TabsTrigger value="extended">6M - 1Y</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
          </TabsList>

          {Object.entries(packages).map(([category, categoryPackages]) => (
            <TabsContent key={category} value={category} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {categoryPackages.map((pkg) => {
                  const Icon = pkg.icon;
                  return (
                    <Card
                      key={pkg.name}
                      className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${getTierColor(pkg.tier)} opacity-5`} />

                      <CardHeader className="relative">
                        <div className="flex justify-between items-start mb-2">
                          <Badge className={`${getTierBadgeColor(pkg.tier)} text-white`}>
                            {pkg.tier.toUpperCase()}
                          </Badge>
                          <Icon className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                        <CardDescription className="text-base">{pkg.description}</CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-4 relative">
                        <div className="space-y-2 pb-4 border-b">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Duration:</span>
                            <span className="font-semibold">{pkg.duration}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Repeat className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Frequency:</span>
                            <span className="font-semibold">{pkg.frequency} times/day</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Maximize2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Display Time:</span>
                            <span className="font-semibold">10 seconds</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <DollarSign className="h-5 w-5 text-primary" />
                              <span className="text-sm text-muted-foreground">Investment</span>
                            </div>
                            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                              ${pkg.monthlyTotal.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              ${pkg.dailyRate.toFixed(2)}/day
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-semibold">
                              <Gift className="h-4 w-4 text-primary" />
                              Key Benefits
                            </div>
                            {pkg.features.map((feature, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-muted-foreground">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Button
                          className="w-full mt-4"
                          variant={pkg.tier === "platinum" ? "default" : "outline"}
                          onClick={() => navigate("/")}
                        >
                          Get Started
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <Card className="mt-16 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="text-2xl">Contract Terms & Conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Payment Terms
                </h3>
                <ul className="space-y-1 text-muted-foreground ml-7">
                  <li>• Payment required in advance</li>
                  <li>• Secure payment processing</li>
                  <li>• Multiple payment options available</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Content Requirements
                </h3>
                <ul className="space-y-1 text-muted-foreground ml-7">
                  <li>• Client provides advertising material</li>
                  <li>• Must be in compatible format</li>
                  <li>• ShowYo reserves right to approve content</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Social Media Bonus
                </h3>
                <ul className="space-y-1 text-muted-foreground ml-7">
                  <li>• Posted on ShowYo official pages</li>
                  <li>• Additional digital reach</li>
                  <li>• Extended brand exposure</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Guaranteed Benefits
                </h3>
                <ul className="space-y-1 text-muted-foreground ml-7">
                  <li>• High-traffic tourist location</li>
                  <li>• Guaranteed visual impact</li>
                  <li>• Strategic repetition schedule</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <section className="mt-20 py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                Get in Touch
              </h2>
              <p className="text-xl text-gray-600 dark:text-muted-foreground">
                Ready to showcase your brand? Contact us for custom packages and enterprise solutions
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Contact Form */}
              <Card className="bg-white/80 dark:bg-card/80 backdrop-blur border border-primary/30 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    Send us a Message
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Name</label>
                      <Input
                        type="text"
                        placeholder="Your name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        required
                        className="bg-background/50"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Email</label>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        required
                        className="bg-background/50"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Phone (optional)</label>
                      <Input
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        className="bg-background/50"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Message</label>
                      <Textarea
                        placeholder="Tell us about your advertising needs..."
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        required
                        className="bg-background/50 min-h-[120px]"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                    >
                      {isSubmitting ? (
                        "Sending..."
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Contact Options */}
              <div className="space-y-6">
                <Card className="bg-white/80 dark:bg-card/80 backdrop-blur border border-secondary/30 hover:border-secondary/60 transition-all shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-secondary/10 rounded-lg">
                        <MessageCircle className="w-6 h-6 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">WhatsApp</h3>
                        <p className="text-gray-600 dark:text-muted-foreground mb-4">
                          Get instant responses to your questions via WhatsApp
                        </p>
                        <Button
                          onClick={handleWhatsAppClick}
                          className="bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold w-full"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Chat on WhatsApp
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 dark:bg-card/80 backdrop-blur border border-accent/30 shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-accent/10 rounded-lg">
                        <Phone className="w-6 h-6 text-accent" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Phone Number</h3>
                        <p className="text-xl text-accent font-semibold">
                          +1 (929) 742-1127
                        </p>
                        <p className="text-sm text-gray-600 dark:text-muted-foreground mt-2">
                          Available for calls and text messages
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 dark:bg-card/80 backdrop-blur border border-primary/30 shadow-sm">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Enterprise Solutions</h3>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-muted-foreground">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                          Custom long-term contracts
                        </li>
                        <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-muted-foreground">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                          Volume discounts for multiple campaigns
                        </li>
                        <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-muted-foreground">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                          Dedicated account manager
                        </li>
                        <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-muted-foreground">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                          Strategic partnership opportunities
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default BusinessPlans;
