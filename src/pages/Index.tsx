import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Camera, Video, Sparkles, Zap, Eye, Shield } from "lucide-react";
import showYoLogo from "@/assets/showyo-logo-color.png";
import { planService } from "@/domain/services/planService";

const Index = () => {
  const navigate = useNavigate();

  const pricingOptions = useMemo(() => {
    return planService.getAllPlans().map((plan) => {
      const Icon = plan.type === "photo" ? Camera : Video;
      const highlightIcon = plan.includesBorder ? Sparkles : Icon;
      const features = [
        `${plan.displayDurationSeconds} seconds display`,
        ...(plan.includesBorder ? ["Custom border"] : []),
        plan.includesLogo ? "ShowYo logo overlay" : "No logo overlay",
        "Plays once",
      ];

      return {
        id: plan.id,
        title: plan.title,
        price: plan.price,
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
            <Button variant="ghost" onClick={() => navigate('/kiosk')} className="text-accent hover:text-accent/80">
              Live Display
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-navy/20 to-transparent" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/15 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/15 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-accent/10 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="text-center space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Your Content in{" "}
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Times Square, New York
              </span>
              {" "}for 10 Seconds
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Make your image, video, or message appear on the iconic digital screen in Times Square. Upload your content, and we'll display it live on Broadway (1604, New York). Fast, secure, and AI-moderated.
            </p>
            <p className="text-lg md:text-xl text-accent font-semibold max-w-2xl mx-auto pt-2">
              Impact the world in just 10 seconds. Ideal for artists, entrepreneurs, brands, and launches.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Button
                size="lg"
                onClick={() => navigate('/upload')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-8 py-6 electric-glow transition-all hover:scale-105"
              >
                Start Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/kiosk')}
                className="border-secondary text-secondary hover:bg-secondary/10 font-bold text-lg px-8 py-6 neon-glow transition-all hover:scale-105"
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
