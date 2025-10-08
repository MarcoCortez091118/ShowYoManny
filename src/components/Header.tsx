import { Button } from "@/components/ui/button";
import { Monitor, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Monitor className="h-8 w-8 text-primary animate-electric-pulse" />
            <Zap className="h-4 w-4 text-accent absolute -top-1 -right-1 animate-neon-flicker" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            ShowYo
          </span>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </a>
          <a href="#kiosk" className="text-muted-foreground hover:text-foreground transition-colors">
            Kiosk Demo
          </a>
        </nav>
        
        <div className="flex items-center gap-3">
          <Button variant="electric" size="sm" onClick={() => navigate("/admin-login")}>
            Admin Login
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;