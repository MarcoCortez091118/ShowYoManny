import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, Clock, Users } from "lucide-react";
import { firebaseOrderService } from "@/domain/services/firebase/orderService";
import { firebaseStorageService } from "@/domain/services/firebase/storageService";

const KioskDemo = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [realContent, setRealContent] = useState<any[]>([]);
  
  // Fallback demo content if no real content exists
  const demoContent = [
    {
      type: "image",
      title: "Happy Birthday Sarah!",
      border: "🎂 Birthday Special",
      duration: 10,
      author: "John D.",
      file_name: "Happy Birthday Sarah!"
    },
    {
      type: "video", 
      title: "Grand Opening Sale",
      border: "🖌️ Custom Business",
      duration: 10,
      author: "Store Owner",
      file_name: "Grand Opening Sale"
    },
    {
      type: "image",
      title: "Merry Christmas Everyone!",
      border: "🎄 Holiday Border",
      duration: 10,
      author: "Community",
      file_name: "Merry Christmas Everyone!"
    },
    {
      type: "image",
      title: "Congrats Graduate!",
      border: "🎓 Graduation",
      duration: 10,
      author: "Proud Parent",
      file_name: "Congrats Graduate!"
    }
  ];

  useEffect(() => {
    fetchRealContent();
  }, []);

  const getPublicUrl = async (path: string | null) => {
    if (!path) return null;
    try {
      return await firebaseStorageService.getPublicUrl(path);
    } catch (error) {
      console.error('KioskDemo: Failed to resolve public URL for', path, error);
      return null;
    }
  };

  const fetchRealContent = async () => {
    try {
      const data = await firebaseOrderService.listApprovedOrders();

      const filteredOrders = data
        .filter((order) => ['queued', 'active', 'playing'].includes(order.display_status))
        .slice(0, 4);

      console.log('KioskDemo: Fetched real content:', filteredOrders.length, 'items');

      if (filteredOrders.length > 0) {
        const formatted = filteredOrders.map(item => ({
          type: item.file_type?.startsWith('video/') ? 'video' : 'image',
          title: item.file_name?.replace(/\.[^/.]+$/, '') || 'Content',
          border: item.border_id?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'No Border',
          duration: item.duration_seconds || 10,
          author: item.user_email?.split('@')[0] || 'Anonymous',
          file_name: item.file_name,
          file_path: item.file_path,
          file_type: item.file_type
        }));
        const filtered = formatted.filter(item => item.file_path && !item.file_path.startsWith('admin-uploads/'));
        console.log('KioskDemo: Formatted content:', formatted);
        console.log('KioskDemo: Filtered content (excluding legacy admin-uploads):', filtered);

        const withUrls = await Promise.all(
          filtered.map(async (item) => ({
            ...item,
            cachedUrl: await getPublicUrl(item.file_path),
          }))
        );

        setRealContent(withUrls.filter(item => item.cachedUrl));
      }
    } catch (error) {
      console.error('Error fetching real content:', error);
    }
  };
  
  // Use real content if available, otherwise fallback to demo
  const contentToShow = realContent.length > 0 ? realContent : demoContent;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % contentToShow.length);
    }, 3000);
    
    return () => clearInterval(timer);
  }, [contentToShow.length]);

  const current = contentToShow[currentSlide];

  return (
    <section id="kiosk-demo" className="py-24 bg-muted/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Live Kiosk Preview
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See how your content appears on the digital billboard display in real-time
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Kiosk Display */}
          <Card className="relative overflow-hidden electric-glow border-primary/50">
            <div className="aspect-video bg-gradient-to-br from-background to-muted/50 relative">
              {/* Display Header */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                <Badge variant="outline" className="bg-background/90 backdrop-blur-sm">
                  <Monitor className="h-3 w-3 mr-1" />
                  Live Display
                </Badge>
                <Badge variant="outline" className="bg-background/90 backdrop-blur-sm">
                  <Clock className="h-3 w-3 mr-1" />
                  {current.duration}s
                </Badge>
              </div>

              {/* Main Content Area */}
              <CardContent className="h-full flex items-center justify-center p-8 relative">
                <div className="text-center space-y-6 animate-slide-up">
                  
                  {/* Actual Content Display - Show real images if available */}
                  {realContent.length > 0 && current.file_path && (
                    <div className="mb-4">
                      {current.type === 'image' ? (
                        <img
                          src={current.cachedUrl || ''}
                          alt={current.file_name}
                          className="max-w-full max-h-48 mx-auto rounded-lg shadow-lg"
                          onError={(e) => {
                            console.error('KioskDemo: Image failed to load:', current.file_path);
                            e.currentTarget.style.display = 'none';
                          }}
                          onLoad={() => {
                            console.log('KioskDemo: Image loaded successfully:', current.file_path);
                          }}
                        />
                      ) : (
                        <video
                          src={current.cachedUrl || ''}
                          autoPlay
                          muted
                          loop
                          className="max-w-full max-h-48 mx-auto rounded-lg shadow-lg"
                          onError={(e) => {
                            console.error('KioskDemo: Video failed to load:', current.file_path);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                  )}
                  
                  {/* Content Type Icon - Fallback when no real content */}
                  {realContent.length === 0 && (
                    <div className={`w-24 h-24 mx-auto rounded-lg flex items-center justify-center text-4xl ${
                      current.type === 'video' ? 'bg-secondary/20 border border-secondary/50' : 'bg-primary/20 border border-primary/50'
                    }`}>
                      {current.type === 'video' ? '▶️' : '📸'}
                    </div>
                  )}
                  
                  {/* Content Title */}
                  <h3 className="text-3xl md:text-4xl font-bold text-foreground">
                    {current.title}
                  </h3>
                  
                  {/* Border Preview */}
                  <div className="px-6 py-3 bg-accent/10 border border-accent/30 rounded-lg">
                    <span className="text-accent font-medium">{current.border}</span>
                  </div>
                </div>

              </CardContent>

              {/* Display Footer */}
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                <Badge variant="outline" className="bg-background/90 backdrop-blur-sm">
                  <Users className="h-3 w-3 mr-1" />
                  {current.author}
                </Badge>
                <div className="flex gap-1">
                  {contentToShow.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentSlide 
                          ? 'bg-primary w-6' 
                          : 'bg-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Queue Preview */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <h3 className="md:col-span-4 text-xl font-semibold text-center mb-4">
              {realContent.length > 0 ? 'Live Content Queue' : 'Demo Content Queue'}
            </h3>
            {contentToShow.map((content, index) => (
              <Card 
                key={index} 
                className={`transition-all ${
                  index === currentSlide 
                    ? 'ring-2 ring-primary electric-glow' 
                    : 'opacity-60'
                }`}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">
                    {content.type === 'video' ? '🎥' : '📷'}
                  </div>
                  <div className="text-sm font-medium truncate">{content.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{content.border}</div>
                  {realContent.length > 0 && (
                    <div className="text-xs text-green-600 mt-1">● Live</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default KioskDemo;