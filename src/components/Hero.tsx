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
            linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}>
      </div>
      
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-4xl mx-auto space-y-8 animate-slide-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary">
            <Zap className="h-4 w-4 animate-neon-flicker" />
            <span className="text-sm font-medium">Digital Billboard Platform</span>
          </div>
          
          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Electrify
            </span>
            <br />
            <span className="text-foreground">Your Content</span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Upload your photos and videos to digital billboards with stunning borders, 
            professional watermarks, and real-time display management.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button 
              variant="electric" 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={() => navigate('/upload')}
            >
              <Upload className="h-5 w-5 mr-2" />
              Start Displaying
            </Button>
            <Button 
              variant="billboard" 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={() => document.getElementById('kiosk-demo')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Play className="h-5 w-5 mr-2" />
              View Demo
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">10,000+</div>
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
      <div className="absolute top-20 left-10 w-3 h-3 bg-primary rounded-full animate-electric-pulse"></div>
      <div className="absolute top-40 right-20 w-2 h-2 bg-accent rounded-full animate-neon-flicker"></div>
      <div className="absolute bottom-32 left-20 w-4 h-4 bg-secondary rounded-full animate-electric-pulse"></div>
    </section>
  );
};

export default Hero;