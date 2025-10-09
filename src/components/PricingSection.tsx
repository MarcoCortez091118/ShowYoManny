import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Video, Star, CheckCircle } from "lucide-react";
import { planService } from "@/domain/services/planService";
import { borderService } from "@/domain/services/borderService";

const PricingSection = () => {
  const photoPlans = useMemo(() => planService.getPlanSummariesByType("photo"), []);
  const videoPlans = useMemo(() => planService.getPlanSummariesByType("video"), []);
  const borderHighlights = useMemo(
    () => borderService.getCategories().map((category) => ({
      id: category,
      label:
        {
          Holiday: "🎄 Holiday Borders",
          "Special Occasions": "🎓 Special Occasions",
          Futuristic: "🚀 Futuristic Borders",
          Seasonal: "🌤️ Seasonal Borders",
        }[category] ?? category,
    })),
    []
  );

  return (
    <section id="pricing" className="py-24 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Simple Pricing
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect display option for your content with instant pricing and real-time preview
          </p>
        </div>

        {/* Photo Plans */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2">
            <Camera className="h-6 w-6 text-primary" />
            Photo Display Options
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {photoPlans.map((plan) => (
              <Card key={plan.id} className={`relative ${plan.isPopular ? 'electric-glow border-primary' : ''}`}>
                {plan.isPopular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 gradient-electric text-white">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <Camera className="h-12 w-12 mx-auto text-primary mb-2" />
                  <CardTitle className="text-xl">{plan.title}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="text-3xl font-bold text-primary">${plan.price}</div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-accent" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.isPopular ? "electric" : "billboard"}
                    className="w-full"
                    onClick={() => window.location.href = '/upload'}
                  >
                    Select Plan
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Video Plans */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2">
            <Video className="h-6 w-6 text-secondary" />
            Video Display Options
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {videoPlans.map((plan) => (
              <Card key={plan.id} className={`relative ${plan.isPopular ? 'electric-glow border-secondary' : ''}`}>
                {plan.isPopular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 gradient-electric text-white">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <Video className="h-12 w-12 mx-auto text-secondary mb-2" />
                  <CardTitle className="text-xl">{plan.title}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="text-3xl font-bold text-secondary">${plan.price}</div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-accent" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.isPopular ? "electric" : "billboard"}
                    className="w-full"
                    onClick={() => window.location.href = '/upload'}
                  >
                    Select Plan
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Border Options */}
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-6">Available Border Themes</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {borderHighlights.map((option) => (
              <div key={option.id} className="p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors">
                <span className="text-sm font-medium">{option.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;