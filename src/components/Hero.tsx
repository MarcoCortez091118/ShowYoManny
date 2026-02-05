import { Button } from "@/components/ui/button";
import { Play, Upload, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-billboard.jpg";

const Hero = () => {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-billboard"></div>
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      ></div>

      {/* Electric Grid Overlay */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(hsl(182 96% 41% / 0.3) 1px, transparent 1px),
            linear-gradient(90deg, hsl(182 96% 41% / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}>
      </div>
      
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-4xl mx-auto space-y-8 animate-slide-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/30 text-secondary neon-glow">
            <Zap className="h-4 w-4 animate-neon-flicker" />
            <span className="text-sm font-medium">Digital Billboard Platform</span>
          </div>
          
          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            <span className="text-foreground">
              Times Square Billboard Advertising from $22 – Show Your Content on a Digital Billboard
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl font-semibold text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Advertise in Times Square, New York for 10 Seconds on a High-Impact Digital Billboard
          </p>

          {/* Description */}
          <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Upload your image or video and get featured on a real digital billboard at 1604 Broadway, Times Square, NYC. Affordable, fast, secure, and AI-moderated
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 electric-glow transition-all hover:scale-105"
              onClick={() => navigate('/upload')}
            >
              <Upload className="h-5 w-5 mr-2" />
              Start Displaying
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-accent text-accent hover:bg-accent/10 text-lg px-8 py-6 accent-glow transition-all hover:scale-105"
              onClick={() => document.getElementById('kiosk-demo')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Play className="h-5 w-5 mr-2" />
              View Demo
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16">
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">10,000+</div>
              <div className="text-muted-foreground">Content Displays</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary">24/7</div>
              <div className="text-muted-foreground">Live Streaming</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">5 Min</div>
              <div className="text-muted-foreground">Setup Time</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-3 h-3 bg-primary rounded-full animate-electric-pulse electric-glow"></div>
      <div className="absolute top-40 right-20 w-2 h-2 bg-accent rounded-full animate-neon-flicker accent-glow"></div>
      <div className="absolute bottom-32 left-20 w-4 h-4 bg-secondary rounded-full animate-electric-pulse neon-glow"></div>
    </section>
  );
};

export default Hero;