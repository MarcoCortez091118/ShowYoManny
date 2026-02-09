import { Button } from "@/components/ui/button";
import { Monitor, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md">
      <div className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Monitor className="h-8 w-8 text-primary animate-electric-pulse" />
            <Zap className="h-4 w-4 text-accent absolute -top-1 -right-1 animate-neon-flicker" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            ShowYo
          </span>
        </div>

        <nav className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-2 py-2 border border-border/50 shadow-lg">
          <a
            href="#features"
            className="px-5 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors rounded-full hover:bg-accent/10"
          >
            FEATURES
          </a>
          <a
            href="#pricing"
            className="px-5 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors rounded-full hover:bg-accent/10"
          >
            PRICING
          </a>
          <button
            onClick={() => navigate("/business-plans")}
            className="px-5 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors rounded-full hover:bg-accent/10"
          >
            BUSINESS
          </button>
          <a
            href="#kiosk"
            className="px-5 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors rounded-full hover:bg-accent/10"
          >
            KIOSK DEMO
          </a>
          <Button
            onClick={() => navigate("/content-upload")}
            className="ml-2 px-6 py-2 text-sm font-bold bg-foreground text-background hover:bg-foreground/90 rounded-full shadow-md transition-all hover:shadow-lg"
          >
            GET STARTED
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;