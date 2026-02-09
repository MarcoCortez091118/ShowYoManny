import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import WarpShaderHero from "@/components/ui/wrap-shader";

const Hero = () => {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-900">
      <WarpShaderHero />

      <div className="relative z-20 min-h-screen flex items-center justify-center px-8 w-full">
        <div className="max-w-4xl w-full text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-medium">Digital Billboard Platform</span>
          </div>

          <h1 className="text-white text-4xl md:text-6xl font-bold leading-tight text-balance">
            Times Square Billboard Advertising from $22 – Show Your Content on a Digital Billboard
          </h1>

          <h2 className="text-white/90 text-2xl md:text-3xl font-semibold leading-relaxed max-w-3xl mx-auto">
            Advertise in Times Square, New York for 10 Seconds on a High-Impact Digital Billboard
          </h2>

          <p className="text-white/80 text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
            Upload your image or video and get featured on a real digital billboard at 1604 Broadway, Times Square, NYC. Affordable, fast, secure, and AI-moderated.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              size="lg"
              className="px-12 py-6 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-white text-lg font-medium hover:bg-white/30 transition-all duration-300 hover:scale-105"
              onClick={() => navigate('/upload')}
            >
              Start Now
            </Button>
            <Button
              size="lg"
              className="px-12 py-6 bg-white rounded-full text-gray-800 text-lg font-medium hover:scale-105 transition-transform duration-300"
              onClick={() => document.getElementById('kiosk-demo')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Watch Live
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">10,000+</div>
              <div className="text-white/70">Content Displays</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">24/7</div>
              <div className="text-white/70">Live Streaming</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">5 Min</div>
              <div className="text-white/70">Setup Time</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
