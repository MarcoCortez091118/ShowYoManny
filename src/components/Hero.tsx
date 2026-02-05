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
            <span className="text-foreground">Your Content in </span>
            <span className="bg-gradient-to-r from-[#FF1B6D] via-[#45CAFF] to-[#45CAFF] bg-clip-text text-transparent">
              Times Square,
            </span>
            <br />
            <span className="bg-gradient-to-r from-[#00D9A3] via-[#FFD700] to-[#FFD700] bg-clip-text text-transparent">
              New York
            </span>
            <span className="text-foreground"> for 10 Seconds</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Make your image, video, or message appear on the iconic digital screen in Times Square. Upload your content, and we'll display it live on Broadway (1604, New York). Fast, secure, and AI-moderated.
          </p>

          {/* Secondary Headline */}
          <p className="text-xl md:text-2xl font-semibold bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent max-w-3xl mx-auto leading-relaxed">
            Impact the world in just 10 seconds. Ideal for artists, entrepreneurs, brands, and launches.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button
              size="lg"
              className="bg-[#FF1B6D] hover:bg-[#FF1B6D]/90 text-white text-lg px-12 py-6 rounded-xl transition-all hover:scale-105 shadow-lg shadow-[#FF1B6D]/50"
              onClick={() => navigate('/upload')}
            >
              Start Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-[#45CAFF] text-[#45CAFF] hover:bg-[#45CAFF]/10 text-lg px-12 py-6 rounded-xl transition-all hover:scale-105 shadow-lg shadow-[#45CAFF]/30"
              onClick={() => document.getElementById('kiosk-demo')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Watch Live
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