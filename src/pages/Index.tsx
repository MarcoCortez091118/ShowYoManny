import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Camera, Video, Sparkles, Zap, Eye, Shield } from "lucide-react";
import showYoLogo from "@/assets/showyo-logo-color.png";

const Index = () => {
  const navigate = useNavigate();

  const pricingOptions = [
    { id: "photo-logo", title: "Photo with Logo", price: 10, icon: Camera, features: ["10 seconds display", "ShowYo logo overlay", "Plays once"] },
    { id: "photo-border", title: "Photo with Border", price: 15, icon: Sparkles, features: ["10 seconds display", "Custom border", "Plays once"], popular: true },
    { id: "photo-clean", title: "Photo without Logo", price: 15, icon: Camera, features: ["10 seconds display", "No logo overlay", "Plays once"] },
    { id: "video-logo", title: "Video with Logo", price: 20, icon: Video, features: ["10 seconds display", "ShowYo logo overlay", "Plays once"] },
    { id: "video-border", title: "Video with Border", price: 25, icon: Sparkles, features: ["10 seconds display", "Custom border", "Plays once"], popular: true },
    { id: "video-clean", title: "Video without Logo", price: 30, icon: Video, features: ["10 seconds display", "No logo overlay", "Plays once"] },
  ];

  const features = [
    { icon: Zap, title: "Instant Upload", description: "Fast and easy content submission" },
    { icon: Shield, title: "AI Moderation", description: "Safe and appropriate content guaranteed" },
    { icon: Eye, title: "Live Display", description: "See your content on the billboard" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="border-b border-primary/20 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={showYoLogo} alt="ShowYo" className="h-10 w-auto" />
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => navigate('/admin-login')} className="text-primary hover:text-primary/80">
              Admin
            </Button>
            <Button variant="ghost" onClick={() => navigate('/kiosk')} className="text-primary hover:text-primary/80">
              Live Display
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="text-center space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Put your photo or video on the{" "}
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-pulse">
                billboard
              </span>
              {" "}for 10 seconds
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto">
              Upload your content and see it displayed on our digital billboard. Safe, fast, and powered by AI moderation.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                onClick={() => navigate('/upload')}
                className="bg-primary hover:bg-primary/90 text-black font-bold text-lg px-8 py-6 electric-glow"
              >
                Start Now
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/kiosk')}
                className="border-primary text-primary hover:bg-primary/10 font-bold text-lg px-8 py-6"
              >
                Watch Live
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-gradient-to-b from-transparent to-primary/5">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <Card key={idx} className="bg-card/50 backdrop-blur border-primary/20 hover:border-primary/40 transition-colors">
                <CardContent className="pt-6 text-center">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <feature.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple Pricing
            </h2>
            <p className="text-xl text-gray-400">
              Choose your display option and upload instantly
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pricingOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Card 
                  key={option.id}
                  className={`relative bg-card/50 backdrop-blur border-primary/20 hover:border-primary/40 transition-all hover:scale-105 ${
                    option.popular ? 'border-primary/40 shadow-lg shadow-primary/20' : ''
                  }`}
                >
                  {option.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-black px-4 py-1 rounded-full text-sm font-bold">
                      Most Popular
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{option.title}</CardTitle>
                    </div>
                    <div className="text-4xl font-bold text-primary">
                      ${option.price}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {option.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 text-black font-bold"
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
      <footer className="border-t border-primary/20 py-8 px-4 mt-20">
        <div className="container mx-auto text-center text-sm text-gray-500">
          <p>&copy; 2025 ShowYo. All content moderated for safety and appropriateness.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
