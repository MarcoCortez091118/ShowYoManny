import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Video, Star, CheckCircle } from "lucide-react";

const PricingSection = () => {
  const photoPlans = [
    {
      title: "Photo with Logo",
      price: "$10",
      description: "10 seconds display",
      icon: Camera,
      features: ["Branded watermark", "Content protection", "Professional look"],
      popular: false,
    },
    {
      title: "Photo with Border + Logo",
      price: "$15",
      description: "10 seconds display",
      icon: Camera,
      features: ["Custom border design", "Logo watermark", "Enhanced visibility"],
      popular: true,
    },
    {
      title: "Clean Photo",
      price: "$15",
      description: "10 seconds display",
      icon: Camera,
      features: ["No watermarks", "Editing-friendly", "Full flexibility"],
      popular: false,
    },
  ];

  const videoPlans = [
    {
      title: "Video with Logo",
      price: "$20",
      description: "10 seconds display",
      icon: Video,
      features: ["Video watermark", "Brand protection", "Professional quality"],
      popular: false,
    },
    {
      title: "Video with Border + Logo",
      price: "$25",
      description: "10 seconds display", 
      icon: Video,
      features: ["Professional edge", "Custom borders", "Maximum impact"],
      popular: true,
    },
    {
      title: "Clean Video",
      price: "$30",
      description: "10 seconds display",
      icon: Video,
      features: ["Premium quality", "Resale-ready", "No restrictions"],
      popular: false,
    },
  ];

  const borderOptions = [
    "🎄 Holiday Borders",
    "🎓 Special Occasions", 
    "🖌️ Custom Editable Borders",
    "😂 Funny Quote Borders"
  ];

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
            {photoPlans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'electric-glow border-primary' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 gradient-electric text-white">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <plan.icon className="h-12 w-12 mx-auto text-primary mb-2" />
                  <CardTitle className="text-xl">{plan.title}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="text-3xl font-bold text-primary">{plan.price}</div>
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
                    variant={plan.popular ? "electric" : "billboard"} 
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
            {videoPlans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'electric-glow border-secondary' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 gradient-electric text-white">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <plan.icon className="h-12 w-12 mx-auto text-secondary mb-2" />
                  <CardTitle className="text-xl">{plan.title}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="text-3xl font-bold text-secondary">{plan.price}</div>
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
                    variant={plan.popular ? "electric" : "billboard"} 
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
            {borderOptions.map((option, index) => (
              <div key={index} className="p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors">
                <span className="text-sm font-medium">{option}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;