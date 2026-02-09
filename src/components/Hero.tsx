import { Button } from "@/components/ui/button";
import { Zap, Users, Briefcase, Link as LinkIcon, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import WarpShaderHero from "@/components/ui/wrap-shader";

const Hero = () => {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-900">
      <WarpShaderHero />

      <div className="relative z-20 min-h-screen flex items-center justify-center px-8 w-full">
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Digital Billboard Platform</span>
            </div>

            <h1 className="text-white text-4xl md:text-6xl font-bold leading-tight">
              Times Square Billboard Advertising from $22 – Show Your Content on a Digital Billboard
            </h1>

            <p className="text-white/80 text-base md:text-lg leading-relaxed">
              Upload your image or video and get featured on a real digital billboard at 1604 Broadway, Times Square, NYC. Affordable, fast, secure, and AI-moderated.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                size="lg"
                className="px-12 py-6 bg-white rounded-full text-black text-lg font-medium hover:scale-105 transition-all duration-300 flex items-center gap-2"
                onClick={() => navigate('/upload')}
              >
                Start Now
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="px-12 py-6 bg-transparent border-2 border-cyan-400 rounded-full text-black text-lg font-medium hover:scale-105 hover:bg-cyan-400/10 transition-all duration-300"
                onClick={() => navigate('/business-plans')}
              >
                Business Plans
              </Button>
            </div>

            <div className="flex flex-wrap gap-8 pt-8">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-white/70" />
                <div>
                  <div className="text-2xl font-bold text-white">15.2K</div>
                  <div className="text-sm text-white/70">Active customers</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase className="h-6 w-6 text-white/70" />
                <div>
                  <div className="text-2xl font-bold text-white">4.5K</div>
                  <div className="text-sm text-white/70">Displays</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <LinkIcon className="h-6 w-6 text-white/70" />
                <div>
                  <div className="text-xl font-bold text-white">Resources</div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl transform translate-y-8">
                  <img
                    src="https://images.pexels.com/photos/3184298/pexels-photo-3184298.jpeg?auto=compress&cs=tinysrgb&w=600"
                    alt="Billboard display"
                    className="w-full h-64 object-cover"
                  />
                </div>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src="https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=600"
                    alt="Digital content"
                    className="w-full h-64 object-cover"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src="https://images.pexels.com/photos/3184287/pexels-photo-3184287.jpeg?auto=compress&cs=tinysrgb&w=600"
                    alt="Times Square"
                    className="w-full h-64 object-cover"
                  />
                </div>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl transform translate-y-8">
                  <img
                    src="https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=600"
                    alt="Advertising"
                    className="w-full h-64 object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
