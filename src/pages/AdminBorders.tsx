import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BorderPreview } from "@/components/BorderPreview";

const AdminBorders = () => {
  const navigate = useNavigate();

  const borderLibrary = [
    // 🎄 Holiday Borders
    { 
      id: "merry-christmas", 
      name: "🎄 Merry Christmas",
      category: "Holiday",
      preview: "border-4 border-red-600 bg-gradient-to-r from-red-100 via-green-100 to-red-100",
      description: "Festive Christmas celebration",
      message: "Merry Christmas"
    },
    { 
      id: "happy-new-year", 
      name: "🎊 Happy New Year",
      category: "Holiday",
      preview: "border-4 border-yellow-500 bg-gradient-to-r from-yellow-100 via-orange-100 to-yellow-100",
      description: "New Year celebration",
      message: "Happy New Year"
    },
    { 
      id: "happy-valentines", 
      name: "💝 Happy Valentine's Day",
      category: "Holiday",
      preview: "border-4 border-pink-500 bg-gradient-to-r from-pink-100 via-red-100 to-pink-100",
      description: "Love and romance celebration",
      message: "Happy Valentine's Day"
    },
    { 
      id: "happy-halloween", 
      name: "🎃 Happy Halloween",
      category: "Holiday",
      preview: "border-4 border-orange-600 bg-gradient-to-r from-orange-100 via-black/10 to-orange-100",
      description: "Spooky Halloween fun",
      message: "Happy Halloween"
    },
    { 
      id: "happy-easter", 
      name: "🐰 Happy Easter",
      category: "Holiday",
      preview: "border-4 border-purple-500 bg-gradient-to-r from-purple-100 via-yellow-100 to-purple-100",
      description: "Easter celebration",
      message: "Happy Easter"
    },
    { 
      id: "happy-thanksgiving", 
      name: "🦃 Happy Thanksgiving",
      category: "Holiday",
      preview: "border-4 border-amber-600 bg-gradient-to-r from-amber-100 via-orange-100 to-amber-100",
      description: "Thanksgiving gratitude",
      message: "Happy Thanksgiving"
    },
    // 🎓 Special Occasions
    { 
      id: "happy-birthday", 
      name: "🎂 Happy Birthday",
      category: "Special Occasions",
      preview: "border-4 border-blue-500 bg-gradient-to-r from-blue-100 via-pink-100 to-blue-100",
      description: "Birthday celebration",
      message: "Happy Birthday"
    },
    { 
      id: "congrats-graduate", 
      name: "🎓 Congrats Graduate",
      category: "Special Occasions",
      preview: "border-4 border-indigo-600 bg-gradient-to-r from-indigo-100 via-yellow-100 to-indigo-100",
      description: "Graduation achievement",
      message: "Congrats Graduate"
    },
    { 
      id: "happy-anniversary", 
      name: "💍 Happy Anniversary",
      category: "Special Occasions",
      preview: "border-4 border-rose-500 bg-gradient-to-r from-rose-100 via-gold-100 to-rose-100",
      description: "Anniversary celebration",
      message: "Happy Anniversary"
    },
    { 
      id: "wedding-day", 
      name: "👰 Wedding Day",
      category: "Special Occasions",
      preview: "border-4 border-white bg-gradient-to-r from-white via-pink-50 to-white",
      description: "Wedding celebration",
      message: "Wedding Day"
    },
    // 🚀 Futuristic Borders
    { 
      id: "neon-glow", 
      name: "🌐 Neon Glow",
      category: "Futuristic",
      preview: "border-4 border-cyan-400 bg-gradient-to-r from-cyan-100 via-purple-100 to-cyan-100",
      description: "Neon glow effects",
      message: "Neon Glow"
    },
    { 
      id: "tech-circuit", 
      name: "⚡ Tech Circuit",
      category: "Futuristic",
      preview: "border-4 border-blue-600 bg-gradient-to-r from-blue-100 via-cyan-100 to-blue-100",
      description: "Tech circuit pattern",
      message: "Tech Circuit"
    },
    { 
      id: "galaxy", 
      name: "🌌 Galaxy",
      category: "Futuristic",
      preview: "border-4 border-indigo-600 bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100",
      description: "Stars and space",
      message: "Galaxy"
    },
    { 
      id: "cyberpunk", 
      name: "💠 Cyberpunk",
      category: "Futuristic",
      preview: "border-4 border-fuchsia-500 bg-gradient-to-r from-fuchsia-100 via-cyan-100 to-fuchsia-100",
      description: "Cyberpunk neon grid",
      message: "Cyberpunk"
    },
    // 🌤️ Seasonal Borders
    { 
      id: "summer", 
      name: "☀️ Summer",
      category: "Seasonal",
      preview: "border-4 border-yellow-400 bg-gradient-to-r from-yellow-100 via-orange-100 to-yellow-100",
      description: "Summer vibes",
      message: "Summer"
    },
    { 
      id: "winter", 
      name: "❄️ Winter",
      category: "Seasonal",
      preview: "border-4 border-blue-300 bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50",
      description: "Winter wonderland",
      message: "Winter"
    },
    { 
      id: "autumn", 
      name: "🍂 Autumn",
      category: "Seasonal",
      preview: "border-4 border-orange-500 bg-gradient-to-r from-orange-100 via-red-100 to-orange-100",
      description: "Fall leaves",
      message: "Autumn"
    },
  ];

  const categories = ["Basic", "Holiday", "Special Occasions", "Futuristic", "Seasonal"];

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 px-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>ShowYo Border Library</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Complete collection of borders and overlays available for content
            </p>
          </CardHeader>
          <CardContent className="space-y-8">
            {categories.map((category) => {
              const categoryBorders = borderLibrary.filter(border => border.category === category);
              if (categoryBorders.length === 0) return null;

              return (
                <div key={category} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-primary">{category}</h3>
                    <span className="text-sm text-muted-foreground font-semibold">({categoryBorders.length} borders)</span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categoryBorders.map((border) => (
                      <BorderPreview
                        key={border.id}
                        border={border}
                        isSelected={false}
                        onClick={() => {}}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
            
            <div className="mt-8 p-6 bg-muted/50 rounded-lg border-2 border-dashed">
              <h4 className="font-semibold mb-2">Logo Overlay Options</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>With Logo:</strong> ShowYo logo appears at bottom-right corner</li>
                <li>• <strong>With Border + Logo:</strong> Both border frame and logo overlay applied</li>
                <li>• <strong>Without Logo:</strong> Clean content display (plain or border only)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminBorders;
