import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { Camera, Video, Sparkles, Zap, Eye, Shield, MessageCircle, Send, Mail, Phone } from "lucide-react";
import showYoLogo from "@/assets/showyo-logo-color.png";
import { planService } from "@/domain/services/planService";
import { toast } from "sonner";
import { WrapShader } from "@/components/ui/wrap-shader";

const Index = () => {
  const navigate = useNavigate();
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  const pricingOptions = useMemo(() => {
    return planService.getAllPlans().map((plan) => {
      const Icon = plan.type === "photo" ? Camera : Video;
      const highlightIcon = plan.includesBorder ? Sparkles : Icon;

      const baseCost = plan.price - 2;
      const platformFee = 2;

      const features = [
        `${plan.displayDurationSeconds} seconds display`,
        "Displayed 3 times in 24 hours",
        ...(plan.includesBorder ? ["Custom border"] : []),
        plan.includesLogo ? "ShowYo logo overlay" : "No logo overlay",
        `$${baseCost} + $${platformFee} platform fee`,
      ];

      return {
        id: plan.id,
        title: plan.title,
        price: plan.price,
        baseCost,
        platformFee,
        icon: plan.includesBorder ? highlightIcon : Icon,
        features,
        popular: Boolean(plan.isPopular),
      };
    });
  }, []);

  const howItWorksSteps = [
    {
      icon: Camera,
      title: "Upload Your Content",
      description: "Image (2048 × 2432 px) or MP4 video. Promote your brand, event, product, or personal message."
    },
    {
      icon: Shield,
      title: "AI Review",
      description: "We validate that your content is safe and complies with our policies."
    },
    {
      icon: Eye,
      title: "See It Live",
      description: "Once approved, you'll see it displayed on our LED screen in Times Square. A digital preview is provided before final publication."
    },
  ];

  const whyAdvertiseFeatures = [
    "High international visibility",
    "Perfect for viral campaigns and product launches",
    "Suitable for artists, influencers, startups, and established brands",
    "Daily, weekly, monthly, semi-annual, or annual packages available",
    "You don't need to be in New York to be displayed on the screen"
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="border-b border-border bg-navy/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={showYoLogo} alt="ShowYo" className="h-10 w-auto" />
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => navigate('/business-plans')} className="text-accent hover:text-accent/80">
              Business Plans
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden min-h-[600px] flex items-center">
        {isMounted && (
          <div className="absolute inset-0 pointer-events-none">
            <WrapShader
              color1="#f10a94"
              color2="#00d4ff"
              speed={1.5}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                opacity: 0.8
              }}
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-transparent" />

        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              Times Square Billboard Advertising from $22 – Show Your Content on a Digital Billboard
            </h1>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-white/95 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] max-w-4xl mx-auto">
              Advertise in Times Square, New York for 10 Seconds on a High-Impact Digital Billboard
            </h2>
            <p className="text-lg md:text-xl lg:text-2xl text-white/90 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] max-w-3xl mx-auto leading-relaxed">
              Upload your image or video and get featured on a real digital billboard at 1604 Broadway, Times Square, NYC. Affordable, fast, secure, and AI-moderated.
            </p>
            <div className="flex gap-4 justify-center pt-6">
              <Button
                size="lg"
                onClick={() => navigate('/upload')}
                className="bg-[#f10a94] hover:bg-[#f10a94]/90 text-white font-bold text-lg px-8 py-6 shadow-[0_0_20px_rgba(241,10,148,0.5)] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(241,10,148,0.7)]"
              >
                Start Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/kiosk')}
                className="border-2 border-[#00d4ff] bg-[#00d4ff]/10 text-white hover:bg-[#00d4ff]/20 font-bold text-lg px-8 py-6 shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,212,255,0.5)]"
              >
                Watch Live
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* What is ShowYoNy */}
      <section className="py-16 px-4 bg-gradient-to-b from-transparent via-navy/30 to-transparent">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">
            What is ShowYoNy?
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground text-center max-w-4xl mx-auto mb-8">
            ShowYoNy is the platform that allows anyone—individuals or businesses—to appear on one of the most visible digital billboards in the world. Simply upload your file, and our system will automatically validate it to be broadcasted in Times Square, NYC.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="bg-card/60 backdrop-blur border border-primary/30 rounded-lg p-4">
              <p className="text-sm font-semibold text-primary mb-1">Location</p>
              <p className="text-muted-foreground">1604 Broadway, New York</p>
            </div>
            <div className="bg-card/60 backdrop-blur border border-secondary/30 rounded-lg p-4">
              <p className="text-sm font-semibold text-secondary mb-1">Ad Duration</p>
              <p className="text-muted-foreground">10 seconds</p>
            </div>
            <div className="bg-card/60 backdrop-blur border border-accent/30 rounded-lg p-4">
              <p className="text-sm font-semibold text-accent mb-1">Formats</p>
              <p className="text-muted-foreground">PNG, MP4 (Full HD / 4K)</p>
            </div>
            <div className="bg-card/60 backdrop-blur border border-primary/30 rounded-lg p-4">
              <p className="text-sm font-semibold text-primary mb-1">Moderation</p>
              <p className="text-muted-foreground">Automatic AI moderation</p>
            </div>
            <div className="bg-card/60 backdrop-blur border border-secondary/30 rounded-lg p-4">
              <p className="text-sm font-semibold text-secondary mb-1">Availability</p>
              <p className="text-muted-foreground">Available from any country</p>
            </div>
            <div className="bg-card/60 backdrop-blur border border-accent/30 rounded-lg p-4">
              <p className="text-sm font-semibold text-accent mb-1">Status</p>
              <p className="text-muted-foreground">Live streaming 24/7</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            How Does ShowYoNy Work?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorksSteps.map((step, idx) => {
              const colors = [
                { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },
                { bg: 'bg-secondary/10', text: 'text-secondary', border: 'border-secondary/30' },
                { bg: 'bg-accent/10', text: 'text-accent', border: 'border-accent/30' }
              ];
              const color = colors[idx % 3];
              return (
                <Card key={idx} className={`bg-card/80 backdrop-blur border ${color.border} hover:border-opacity-60 transition-all hover:scale-105`}>
                  <CardContent className="pt-6">
                    <div className={`mx-auto w-16 h-16 ${color.bg} rounded-full flex items-center justify-center mb-4`}>
                      <step.icon className={`w-8 h-8 ${color.text}`} />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-center">Step {idx + 1}: {step.title}</h3>
                    <p className="text-muted-foreground text-center">{step.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="flex gap-4 justify-center pt-8">
            <Button
              size="lg"
              onClick={() => navigate('/upload')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 electric-glow"
            >
              Start Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/kiosk')}
              className="border-secondary text-secondary hover:bg-secondary/10 font-bold px-8 neon-glow"
            >
              Watch Live
            </Button>
          </div>
        </div>
      </section>

      {/* Why Advertise */}
      <section className="py-16 px-4 bg-gradient-to-b from-transparent via-navy/30 to-transparent">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            Why Advertise with ShowYoNy?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {whyAdvertiseFeatures.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-card/60 backdrop-blur border border-accent/20 rounded-lg p-4">
                <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                <p className="text-muted-foreground">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Available Packages
            </h2>
            <p className="text-xl text-muted-foreground">
              Choose your display option and upload instantly to Times Square
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pricingOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Card
                  key={option.id}
                  className={`relative bg-card/80 backdrop-blur border transition-all hover:scale-105 ${
                    option.popular
                      ? 'border-primary/50 shadow-lg shadow-primary/20'
                      : 'border-border hover:border-secondary/40'
                  }`}
                >
                  {option.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold electric-glow">
                      Most Popular
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-secondary/10 rounded-lg">
                        <Icon className="w-6 h-6 text-secondary" />
                      </div>
                      <CardTitle className="text-xl">{option.title}</CardTitle>
                    </div>
                    <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      ${option.price}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {option.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground font-bold transition-all"
                      onClick={() => navigate('/upload', { state: { selectedPlan: option.id } })}
                    >
                      Select Plan
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent via-navy/30 to-transparent">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Get in Touch
            </h2>
            <p className="text-xl text-muted-foreground">
              Have questions or need a custom package? Contact us directly
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <Card className="bg-card/80 backdrop-blur border border-primary/30">
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
                      placeholder="Tell us about your project or inquiry..."
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      required
                      className="bg-background/50 min-h-[120px]"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold electric-glow"
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
              <Card className="bg-card/80 backdrop-blur border border-secondary/30 hover:border-secondary/60 transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-secondary/10 rounded-lg">
                      <MessageCircle className="w-6 h-6 text-secondary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-2">WhatsApp</h3>
                      <p className="text-muted-foreground mb-4">
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

              <Card className="bg-card/80 backdrop-blur border border-accent/30">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-accent/10 rounded-lg">
                      <Phone className="w-6 h-6 text-accent" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-2">Phone Number</h3>
                      <p className="text-xl text-accent font-semibold">
                        +1 (929) 742-1127
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Available for calls and text messages
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/80 backdrop-blur border border-primary/30">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold">Why Contact Us?</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                        Custom packages for businesses
                      </li>
                      <li className="flex items-start gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                        Volume discounts available
                      </li>
                      <li className="flex items-start gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                        Technical support and guidance
                      </li>
                      <li className="flex items-start gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                        Partnership opportunities
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 mt-20 bg-navy/50">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; 2025 ShowYo. All content moderated for safety and appropriateness.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
