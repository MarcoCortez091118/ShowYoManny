import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";
import { Camera, Video, Zap, Eye, Shield, MessageCircle, Send, Mail, Phone, Moon, Sun, ArrowRight, Clock, DollarSign, Globe, Menu, X } from "lucide-react";
const showYoLogo = "https://green-dragonfly-496875.hostingersite.com/wp-content/uploads/2026/02/Diseno-sin-titulo5.png";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import WarpShaderHero from "@/components/ui/wrap-shader";

const Index = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scrollerHeight, setScrollerHeight] = useState(0);
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(0);
  const [marqueeSpeed, setMarqueeSpeed] = useState(15);
  const [marqueeDirection, setMarqueeDirection] = useState(1);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const lastMarqueeScrollY = useRef(0);
  const scrollVelocity = useRef(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAllFaqs, setShowAllFaqs] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (scrollerRef.current) {
            const element = scrollerRef.current;
            const rect = element.getBoundingClientRect();
            const elementHeight = element.offsetHeight;
            const viewportHeight = window.innerHeight;

            // If we're at the very top of the page, always show slide 0
            if (window.scrollY < 10) {
              setScrollProgress(0);
              setCurrentSlide(0);
              ticking = false;
              return;
            }

            // Calculate scroll progress when element is in view
            if (rect.top < viewportHeight && rect.bottom > 0) {
              // Progress from 0 to 1 as we scroll through the element
              const scrolled = Math.max(0, viewportHeight - rect.top);
              const totalScrollDistance = elementHeight + viewportHeight;
              const progress = Math.max(0, Math.min(1, scrolled / totalScrollDistance));

              setScrollProgress(progress);

              // Determine current slide (0, 1, 2, or 3) - 4 slides total
              const slideIndex = Math.min(3, Math.floor(progress * 4));
              setCurrentSlide(slideIndex);
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (scrollerRef.current) {
      // Set height to 4x viewport to allow smooth scrolling through 3 slides
      setScrollerHeight(window.innerHeight * 4);
    }
  }, []);

  useEffect(() => {
    let ticking = false;

    const handleHeaderScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          if (currentScrollY < 10) {
            setShowHeader(true);
          } else if (currentScrollY > lastScrollY.current) {
            setShowHeader(false);
          } else {
            setShowHeader(true);
          }

          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleHeaderScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleHeaderScroll);
  }, []);

  useEffect(() => {
    let ticking = false;
    let velocityTimeout: NodeJS.Timeout;

    const handleMarqueeScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const delta = currentScrollY - lastMarqueeScrollY.current;

          scrollVelocity.current = delta;

          if (Math.abs(delta) > 0.5) {
            const speedAdjustment = Math.min(Math.abs(delta) * 0.1, 3);

            if (delta > 0) {
              setMarqueeDirection(1);
              setMarqueeSpeed(prev => Math.max(10, prev - speedAdjustment * 0.5));
            } else {
              setMarqueeDirection(-1);
              setMarqueeSpeed(prev => Math.max(10, prev - speedAdjustment * 0.5));
            }
          }

          clearTimeout(velocityTimeout);
          velocityTimeout = setTimeout(() => {
            setMarqueeSpeed(15);
            setMarqueeDirection(1);
          }, 300);

          lastMarqueeScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleMarqueeScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleMarqueeScroll);
      clearTimeout(velocityTimeout);
    };
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("https://n8n.srv991322.hstgr.cloud/webhook/b1304d04-3c9b-4bfe-9062-f3d767cbe921", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contactForm),
      });

      if (response.ok) {
        toast.success("Message sent successfully! We'll get back to you soon.");
        setContactForm({ name: "", email: "", phone: "", message: "" });
      } else {
        toast.error("Failed to send message. Please try WhatsApp instead.");
      }
    } catch (error) {
      toast.error("Failed to send message. Please try WhatsApp instead.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppClick = () => {
    window.open("https://wa.me/19297421127", "_blank");
  };

  const scrollSlides = [
    {
      text: "Affordable Times Square advertising for everyone",
      highlight: "Affordable Times Square advertising"
    },
    {
      text: "From upload to display in minutes with automated moderation",
      highlight: "From upload to display"
    },
    {
      text: "Real impact, real visibility in the heart of Times Square",
      highlight: "Real impact, real visibility"
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        showHeader ? 'translate-y-0' : '-translate-y-full'
      }`}>
        {/* Mobile Header Container */}
        <div className="md:hidden px-4 pt-4">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl shadow-lg px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <img src={showYoLogo} alt="ShowYo" className="h-8 w-auto" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="h-10 w-10 text-gray-900 dark:text-white"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop Header Container */}
        <div className="hidden md:block backdrop-blur-sm">
          <div className="container mx-auto px-6 lg:px-12 py-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <img src={showYoLogo} alt="ShowYo" className="h-8 w-auto" />
              </div>

              {/* Desktop Navigation */}
              <nav className="flex items-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-full pl-6 pr-2 py-2 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                <button
                  onClick={() => navigate('/business-plans')}
                  className="px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  BUSINESS PLANS
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="h-8 w-8 text-gray-700 dark:text-gray-300 hover:bg-transparent"
                >
                  {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </Button>
                <Button
                  onClick={() => navigate('/upload')}
                  className="ml-2 px-6 py-2.5 text-sm font-bold bg-[#ff2e63] hover:bg-[#ff2e63]/90 text-white rounded-full shadow-sm transition-all"
                >
                  GET STARTED
                </Button>
              </nav>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pt-2">
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-xl px-4 py-6 space-y-4">
              <button
                onClick={() => {
                  navigate('/business-plans');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                BUSINESS PLANS
              </button>
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">Theme:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleTheme}
                  className="flex items-center gap-2"
                >
                  {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  {theme === 'light' ? 'Dark' : 'Light'}
                </Button>
              </div>
              <Button
                onClick={() => {
                  navigate('/upload');
                  setMobileMenuOpen(false);
                }}
                className="w-full px-6 py-3 text-base font-bold bg-[#ff2e63] hover:bg-[#ff2e63]/90 text-white rounded-lg shadow-sm transition-all"
              >
                GET STARTED
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Hero + Slides Section */}
      <section
        className="relative"
        style={{ height: `${scrollerHeight}px` }}
        ref={scrollerRef}
      >
        <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
          {/* Animated Shader Background */}
          <WarpShaderHero />

          {/* Label - Top Left (only show after first slide) */}
          {currentSlide > 0 && (
            <div className="absolute top-24 md:top-8 left-4 md:left-8 lg:left-16 z-20 transition-opacity duration-500">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/80 backdrop-blur-sm bg-white/10 px-3 py-2 rounded-full border border-white/20">
                <div className="w-2 h-2 bg-white rounded-sm" />
                What we do
              </div>
            </div>
          )}

          {/* Slide Counter - Bottom Left */}
          <div className="absolute bottom-6 md:bottom-8 left-4 md:left-8 lg:left-16 z-20">
            <div className="px-4 py-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-md shadow-xl">
              <span className="text-sm font-medium text-white">
                0{currentSlide + 1}
              </span>
              <span className="text-sm text-white/60 mx-1">/</span>
              <span className="text-sm text-white/60">04</span>
            </div>
          </div>

          {/* Progress Line */}
          <div className="absolute left-8 lg:left-16 top-20 bottom-20 w-px bg-white/20 z-20 hidden md:block">
            <div
              className="w-full bg-gradient-to-b from-white via-cyan-200 to-white transition-all duration-300 ease-out shadow-lg"
              style={{ height: `${(scrollProgress % (1/4)) * 400}%` }}
            />
          </div>

          {/* Main Content - Center */}
          <div className="relative z-10 container mx-auto px-6 md:px-8 lg:px-16 max-w-6xl">
            <div className="text-center">
              {/* Slide 0: Hero */}
              <div
                className={`transition-all duration-700 ease-out ${
                  currentSlide === 0
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 -translate-y-8 absolute inset-0 pointer-events-none'
                }`}
              >
                <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white mb-8 leading-tight drop-shadow-lg">
                  Display your content on Times Square's iconic billboard
                </h1>
                <p className="text-lg md:text-xl lg:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
                  Upload your image or video and broadcast it on a real digital billboard at 1604 Broadway, NYC. Affordable, fast, and accessible to everyone.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    onClick={() => navigate('/upload')}
                    className="bg-white text-gray-900 hover:bg-gray-100 text-base md:text-lg px-6 py-4 md:px-8 md:py-6 h-auto group shadow-xl"
                  >
                    Start Now
                    <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate('/business-plans')}
                    className="text-base md:text-lg px-6 py-4 md:px-8 md:py-6 h-auto border-2 border-cyan-400 text-white bg-cyan-400/20 hover:bg-cyan-400/30 backdrop-blur-sm shadow-xl"
                  >
                    Business Plans
                  </Button>
                </div>
              </div>

              {/* Slides 1-3: What We Do */}
              {scrollSlides.map((slide, slideIndex) => {
                const actualSlideIndex = slideIndex + 1;
                const isActive = currentSlide === actualSlideIndex;
                const slideProgress = Math.max(0, Math.min(1, ((scrollProgress * 4) - actualSlideIndex)));

                return (
                  <div
                    key={slideIndex}
                    className={`transition-all duration-700 ease-out ${
                      isActive
                        ? 'opacity-100 translate-y-0'
                        : currentSlide < actualSlideIndex
                        ? 'opacity-0 translate-y-8 absolute inset-0 pointer-events-none'
                        : 'opacity-0 -translate-y-8 absolute inset-0 pointer-events-none'
                    }`}
                  >
                    <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight drop-shadow-2xl">
                      {slide.text.split(' ').map((word, wordIndex) => {
                        const isHighlightWord = slide.highlight.includes(word);
                        const baseProgress = Math.max(0, Math.min(1, slideProgress * 3 - (wordIndex * 0.05)));
                        const wordProgress = isActive && slideProgress > 0.5 ? 1 : baseProgress;

                        return (
                          <span
                            key={wordIndex}
                            className="transition-all duration-700 ease-out inline-block mr-3 md:mr-4"
                            style={{
                              color: isHighlightWord
                                ? 'rgb(255, 255, 255)'
                                : `rgba(255, 255, 255, ${Math.max(0.3, Math.min(1, 0.3 + (wordProgress * 0.7)))})`,
                              transform: `translateY(${(1 - wordProgress) * 10}px)`,
                              textShadow: isHighlightWord
                                ? '0 4px 20px rgba(0, 0, 0, 0.3), 0 0 40px rgba(255, 255, 255, 0.2)'
                                : '0 2px 10px rgba(0, 0, 0, 0.2)'
                            }}
                          >
                            {word}
                          </span>
                        );
                      })}
                    </h2>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Platform Section */}
      <section className="bg-gray-50 dark:bg-gray-900 py-20 lg:py-32 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-12 lg:gap-16">
            <aside>
              <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 sticky top-32">
                The ShowYo Platform
              </div>
            </aside>

            <div className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                Making Times Square advertising{" "}
                <span className="text-gray-400 dark:text-gray-600">accessible to everyone.</span>
              </h2>

              <div className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl">
                <p className="mb-4">
                  Our platform combines automated content moderation, secure payment processing, and real-time billboard scheduling to deliver your message to millions of daily visitors in the world's most iconic intersection.
                </p>
                <p>
                  From individual creators to global brands, ShowYo democratizes premium outdoor advertising without agencies, contracts, or excessive costs.
                </p>
              </div>

              <Button
                size="lg"
                onClick={() => navigate('/upload')}
                className="bg-[#ff2e63] hover:bg-[#ff2e63]/90 text-white mt-6"
              >
                Start Your Campaign
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* USP Cards */}
      <section className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {/* Card 1 - Instant Upload */}
            <div className="bg-[#ffd23f] p-12 md:p-16 min-h-[420px] flex flex-col relative group hover:shadow-2xl transition-shadow">
              <div className="text-sm text-gray-700 absolute top-8 right-8">01.</div>
              <div className="mb-auto pt-8">
                <svg className="w-20 h-20 mb-12" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <g transform="translate(50, 50)">
                    <line x1="0" y1="-35" x2="0" y2="-15" />
                    <line x1="0" y1="-35" x2="10" y2="-25" transform="rotate(0 0 0)" />
                    <line x1="0" y1="-35" x2="-10" y2="-25" transform="rotate(0 0 0)" />

                    <line x1="0" y1="-35" x2="0" y2="-15" transform="rotate(45 0 0)" />
                    <line x1="0" y1="-35" x2="10" y2="-25" transform="rotate(45 0 0)" />
                    <line x1="0" y1="-35" x2="-10" y2="-25" transform="rotate(45 0 0)" />

                    <line x1="0" y1="-35" x2="0" y2="-15" transform="rotate(90 0 0)" />
                    <line x1="0" y1="-35" x2="10" y2="-25" transform="rotate(90 0 0)" />
                    <line x1="0" y1="-35" x2="-10" y2="-25" transform="rotate(90 0 0)" />

                    <line x1="0" y1="-35" x2="0" y2="-15" transform="rotate(135 0 0)" />
                    <line x1="0" y1="-35" x2="10" y2="-25" transform="rotate(135 0 0)" />
                    <line x1="0" y1="-35" x2="-10" y2="-25" transform="rotate(135 0 0)" />

                    <line x1="0" y1="-35" x2="0" y2="-15" transform="rotate(180 0 0)" />
                    <line x1="0" y1="-35" x2="10" y2="-25" transform="rotate(180 0 0)" />
                    <line x1="0" y1="-35" x2="-10" y2="-25" transform="rotate(180 0 0)" />

                    <line x1="0" y1="-35" x2="0" y2="-15" transform="rotate(225 0 0)" />
                    <line x1="0" y1="-35" x2="10" y2="-25" transform="rotate(225 0 0)" />
                    <line x1="0" y1="-35" x2="-10" y2="-25" transform="rotate(225 0 0)" />

                    <line x1="0" y1="-35" x2="0" y2="-15" transform="rotate(270 0 0)" />
                    <line x1="0" y1="-35" x2="10" y2="-25" transform="rotate(270 0 0)" />
                    <line x1="0" y1="-35" x2="-10" y2="-25" transform="rotate(270 0 0)" />

                    <line x1="0" y1="-35" x2="0" y2="-15" transform="rotate(315 0 0)" />
                    <line x1="0" y1="-35" x2="10" y2="-25" transform="rotate(315 0 0)" />
                    <line x1="0" y1="-35" x2="-10" y2="-25" transform="rotate(315 0 0)" />
                  </g>
                </svg>
              </div>
              <div>
                <h3 className="text-3xl md:text-4xl font-semibold mb-4 text-gray-900">Instant Upload</h3>
                <p className="text-gray-700 text-lg leading-relaxed">
                  From upload to display in minutes. No waiting, no agencies, no complicated processes.
                </p>
              </div>
            </div>

            {/* Card 2 - Affordable Pricing */}
            <div className="bg-[#05c7cc] p-12 md:p-16 min-h-[420px] flex flex-col relative group hover:shadow-2xl transition-shadow">
              <div className="text-sm text-gray-700 absolute top-8 right-8">02.</div>
              <div className="mb-auto pt-8">
                <svg className="w-20 h-20 mb-12" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <g transform="translate(50, 50)">
                    <polygon points="0,-30 26,-15 26,15 0,30 -26,15 -26,-15" fill="none" />
                    <polygon points="0,-24 20,-12 20,12 0,24 -20,12 -20,-12" fill="none" />
                    <polygon points="0,-18 14,-9 14,9 0,18 -14,9 -14,-9" fill="none" />
                    <polygon points="0,-12 8,-6 8,6 0,12 -8,6 -8,-6" fill="none" />
                    <polygon points="0,-6 4,-3 4,3 0,6 -4,3 -4,-3" fill="none" />
                  </g>
                </svg>
              </div>
              <div>
                <h3 className="text-3xl md:text-4xl font-semibold mb-4 text-gray-900">Affordable Pricing</h3>
                <p className="text-gray-700 text-lg leading-relaxed">
                  Starting at just $22. The most accessible Times Square billboard rates available.
                </p>
              </div>
            </div>

            {/* Card 3 - Global Reach */}
            <div className="bg-[#06335b] p-12 md:p-16 min-h-[420px] flex flex-col relative group hover:shadow-2xl transition-shadow">
              <div className="text-sm text-gray-300 absolute top-8 right-8">03.</div>
              <div className="mb-auto pt-8">
                <svg className="w-20 h-20 mb-12" viewBox="0 0 100 100" fill="none" stroke="white" strokeWidth="1.5">
                  <g transform="translate(50, 50)">
                    <polygon points="0,-28 28,-14 28,14 0,28 -28,14 -28,-14" fill="none" />
                    <polygon points="0,-22 22,-11 22,11 0,22 -22,11 -22,-11" fill="none" />
                    <polygon points="0,-16 16,-8 16,8 0,16 -16,8 -16,-8" fill="none" />
                    <polygon points="0,-10 10,-5 10,5 0,10 -10,5 -10,-5" fill="none" />

                    <line x1="-28" y1="-14" x2="-22" y2="-11" />
                    <line x1="-28" y1="14" x2="-22" y2="11" />
                    <line x1="28" y1="-14" x2="22" y2="-11" />
                    <line x1="28" y1="14" x2="22" y2="11" />
                    <line x1="0" y1="-28" x2="0" y2="-22" />
                    <line x1="0" y1="28" x2="0" y2="22" />

                    <line x1="-22" y1="-11" x2="-16" y2="-8" />
                    <line x1="-22" y1="11" x2="-16" y2="8" />
                    <line x1="22" y1="-11" x2="16" y2="-8" />
                    <line x1="22" y1="11" x2="16" y2="8" />
                    <line x1="0" y1="-22" x2="0" y2="-16" />
                    <line x1="0" y1="22" x2="0" y2="16" />

                    <line x1="-16" y1="-8" x2="-10" y2="-5" />
                    <line x1="-16" y1="8" x2="-10" y2="5" />
                    <line x1="16" y1="-8" x2="10" y2="-5" />
                    <line x1="16" y1="8" x2="10" y2="5" />
                    <line x1="0" y1="-16" x2="0" y2="-10" />
                    <line x1="0" y1="16" x2="0" y2="10" />
                  </g>
                </svg>
              </div>
              <div>
                <h3 className="text-3xl md:text-4xl font-semibold mb-4 text-white">Global Reach</h3>
                <p className="text-gray-200 text-lg leading-relaxed">
                  Reach millions of daily visitors from around the world in the heart of Times Square.
                </p>
              </div>
            </div>
        </div>
      </section>

      {/* Marquee Text */}
      <section className="bg-[#f3f3f3] py-16 md:py-24 lg:py-32 overflow-hidden relative">
        <div className="absolute top-8 left-8 md:left-16">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#D4F4A6]" />
            <span className="text-xs uppercase tracking-wider text-gray-600">THE SHOWYO PLATFORM</span>
          </div>
        </div>
        <div
          ref={marqueeRef}
          className="flex whitespace-nowrap"
          style={{
            animation: `marquee-${marqueeDirection > 0 ? 'forward' : 'reverse'} ${marqueeSpeed}s linear infinite`,
            transition: 'animation-duration 0.3s ease-out'
          }}
        >
          <div className="flex items-center">
            {Array(10).fill(null).map((_, i) => (
              <span key={i} className="text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-gray-900 px-8">
                ShowYoNy – Affordable Times Square Billboard Advertising from $22
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 lg:py-32 px-6 bg-white dark:bg-background">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12 lg:gap-16 items-start">
            {/* Left Column - Image */}
            <div className="order-2 lg:order-1 lg:sticky lg:top-32 self-start flex justify-center lg:justify-start">
              <img
                src="https://instagram.fpbc2-2.fna.fbcdn.net/v/t39.30808-6/608425265_122140637702962233_4738224972353000105_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=103&ig_cache_key=Mzc5OTk0NzA3NzYxNTc5NzQ3OQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6InhwaWRzLjk2MHgxMjAwLnNkci5DMyJ9&_nc_ohc=QksMm53zfikQ7kNvwH2B249&_nc_oc=AdlGEpAFw3tsdeGqd9GteK5cLx6bkcxaeN4IO-7BKRHdQCDYeh5IguDc1A7Lt8bRAQUVWcp2ayptw__UZ-1iAih9&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fpbc2-2.fna&_nc_gid=XU6vzKDGA8ondtOrUTJGgg&oh=00_AfuUBW8crXYBnyCD4BmZCALEPRN71Uc-5qQLdl3XC2JLLA&oe=699013AA"
                alt="Times Square Billboard"
                className="rounded-2xl shadow-2xl w-full max-w-sm lg:max-w-none"
              />
            </div>

            {/* Right Column - Pricing Content */}
            <div className="order-1 lg:order-2 space-y-8">
              {/* Header */}
              <div className="text-center lg:text-left">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                  Times Square Billboard Pricing
                </h2>
                <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 mb-4">
                  Affordable digital billboard advertising in Times Square — no hidden fees.
                </p>
                <div className="text-gray-600 dark:text-gray-400 leading-relaxed space-y-2 text-sm md:text-base">
                  <p>
                    Advertise your image or video on a real digital billboard in Times Square starting at just $22.
                    All packages include 10 seconds of display, shown 3 times within 24 hours, on a high-visibility screen at 1604 Broadway, New York.
                  </p>
                  <p className="font-medium">
                    No contracts, no agencies, and no long-term commitments. Upload your content, get approved, and go live.
                  </p>
                </div>
              </div>

              {/* Photo Packages */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center lg:justify-start gap-2">
                  <Camera className="w-5 h-5" />
                  Photo Advertising Packages
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Photo with Logo */}
                  <Card className="bg-white dark:bg-gray-800 border hover:shadow-lg transition-shadow">
                    <CardContent className="pt-4 pb-4 px-4">
                      <div className="text-center mb-3">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Photo with Logo</h4>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">$22</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">$20 + $2 fee</div>
                      </div>
                      <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400 mb-3">
                        <li className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-primary flex-shrink-0" />
                          <span>10 seconds display</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Zap className="w-3 h-3 text-primary flex-shrink-0" />
                          <span>3 times in 24 hours</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Camera className="w-3 h-3 text-primary flex-shrink-0" />
                          <span>ShowYo logo overlay</span>
                        </li>
                      </ul>
                      <Button
                        onClick={() => navigate('/upload')}
                        size="sm"
                        className="w-full bg-[#ff2e63] hover:bg-[#ff2e63]/90 text-white text-xs"
                      >
                        Get Started
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Photo with Border */}
                  <Card className="bg-white dark:bg-gray-800 border hover:shadow-lg transition-shadow">
                    <CardContent className="pt-4 pb-4 px-4">
                      <div className="text-center mb-3">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Photo with Border</h4>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">$27</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">$25 + $2 fee</div>
                      </div>
                      <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400 mb-3">
                        <li className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-primary flex-shrink-0" />
                          <span>10 seconds display</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Zap className="w-3 h-3 text-primary flex-shrink-0" />
                          <span>3 times in 24 hours</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Camera className="w-3 h-3 text-primary flex-shrink-0" />
                          <span>Custom border + logo</span>
                        </li>
                      </ul>
                      <Button
                        onClick={() => navigate('/upload')}
                        size="sm"
                        className="w-full bg-[#ff2e63] hover:bg-[#ff2e63]/90 text-white text-xs"
                      >
                        Get Started
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Clean Photo */}
                  <Card className="bg-white dark:bg-gray-800 border hover:shadow-lg transition-shadow">
                    <CardContent className="pt-4 pb-4 px-4">
                      <div className="text-center mb-3">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Clean Photo</h4>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">$27</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">$25 + $2 fee</div>
                      </div>
                      <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400 mb-3">
                        <li className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-primary flex-shrink-0" />
                          <span>10 seconds display</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Zap className="w-3 h-3 text-primary flex-shrink-0" />
                          <span>3 times in 24 hours</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Camera className="w-3 h-3 text-primary flex-shrink-0" />
                          <span>No logo overlay</span>
                        </li>
                      </ul>
                      <Button
                        onClick={() => navigate('/upload')}
                        size="sm"
                        className="w-full bg-[#ff2e63] hover:bg-[#ff2e63]/90 text-white text-xs"
                      >
                        Get Started
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Video Packages */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center lg:justify-start gap-2">
                  <Video className="w-5 h-5" />
                  Video Advertising Packages
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Video with Logo */}
                  <Card className="bg-white dark:bg-gray-800 border hover:shadow-lg transition-shadow">
                    <CardContent className="pt-4 pb-4 px-4">
                      <div className="text-center mb-3">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Video with Logo</h4>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">$32</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">$30 + $2 fee</div>
                      </div>
                      <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400 mb-3">
                        <li className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-primary flex-shrink-0" />
                          <span>10 seconds display</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Zap className="w-3 h-3 text-primary flex-shrink-0" />
                          <span>3 times in 24 hours</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Video className="w-3 h-3 text-primary flex-shrink-0" />
                          <span>ShowYo logo overlay</span>
                        </li>
                      </ul>
                      <Button
                        onClick={() => navigate('/upload')}
                        size="sm"
                        className="w-full bg-[#ff2e63] hover:bg-[#ff2e63]/90 text-white text-xs"
                      >
                        Get Started
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Video with Border */}
                  <Card className="bg-white dark:bg-gray-800 border hover:shadow-lg transition-shadow">
                    <CardContent className="pt-4 pb-4 px-4">
                      <div className="text-center mb-3">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Video with Border</h4>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">$37</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">$35 + $2 fee</div>
                      </div>
                      <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400 mb-3">
                        <li className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-primary flex-shrink-0" />
                          <span>10 seconds display</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Zap className="w-3 h-3 text-primary flex-shrink-0" />
                          <span>3 times in 24 hours</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Video className="w-3 h-3 text-primary flex-shrink-0" />
                          <span>Custom border + logo</span>
                        </li>
                      </ul>
                      <Button
                        onClick={() => navigate('/upload')}
                        size="sm"
                        className="w-full bg-[#ff2e63] hover:bg-[#ff2e63]/90 text-white text-xs"
                      >
                        Get Started
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Clean Video */}
                  <Card className="bg-white dark:bg-gray-800 border hover:shadow-lg transition-shadow">
                    <CardContent className="pt-4 pb-4 px-4">
                      <div className="text-center mb-3">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Clean Video</h4>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">$37</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">$35 + $2 fee</div>
                      </div>
                      <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400 mb-3">
                        <li className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-primary flex-shrink-0" />
                          <span>10 seconds display</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Zap className="w-3 h-3 text-primary flex-shrink-0" />
                          <span>3 times in 24 hours</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Video className="w-3 h-3 text-primary flex-shrink-0" />
                          <span>No logo overlay</span>
                        </li>
                      </ul>
                      <Button
                        onClick={() => navigate('/upload')}
                        size="sm"
                        className="w-full bg-[#ff2e63] hover:bg-[#ff2e63]/90 text-white text-xs"
                      >
                        Get Started
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Business Plans Link */}
              <div className="pt-4">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/business-plans')}
                  className="border-2 w-full sm:w-auto"
                >
                  Explore Business Solutions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-100 dark:bg-gray-900 rounded-[3rem] py-20 lg:py-32 px-6 mx-6 lg:mx-12">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Three simple steps to Times Square
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <Camera className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Upload Content
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Upload your image (2048 × 2432 px) or video. Choose your display package.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  AI Review
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Automated content moderation ensures your ad meets platform guidelines.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
                  <Eye className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Go Live
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your content displays on our Times Square billboard. Watch it live!
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              onClick={() => navigate('/upload')}
              className="bg-[#ff2e63] hover:bg-[#ff2e63]/90 text-white text-lg px-8"
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-20 lg:py-32 px-6 bg-white dark:bg-gray-950">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              About ShowYoNy Billboard
            </h2>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-2">
            <AccordionItem value="item-1" className="border border-gray-200 dark:border-gray-800 rounded-lg px-6 bg-gray-50 dark:bg-gray-900">
              <AccordionTrigger className="text-left text-base md:text-lg font-semibold text-gray-900 dark:text-white hover:no-underline">
                How much does it cost to advertise on a Times Square billboard?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-400 leading-relaxed space-y-3">
                <p>
                  The cost to advertise on a Times Square billboard with ShowYoNy starts at <strong>$22</strong>.
                  Each ad is displayed for 10 seconds, shown 3 times within 24 hours, on a real digital billboard located at 1604 Broadway, New York.
                </p>
                <p>
                  This makes ShowYoNy one of the most affordable ways to advertise in Times Square.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border border-gray-200 dark:border-gray-800 rounded-lg px-6 bg-gray-50 dark:bg-gray-900">
              <AccordionTrigger className="text-left text-base md:text-lg font-semibold text-gray-900 dark:text-white hover:no-underline">
                Is this a real Times Square billboard?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-400 leading-relaxed space-y-3">
                <p>
                  Yes. Your content is displayed on a <strong>real digital billboard in Times Square</strong>, not a simulation or virtual screen.
                  The exact location is <strong>1604 Broadway, Times Square, NYC</strong>, one of the most visited advertising locations in the world.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border border-gray-200 dark:border-gray-800 rounded-lg px-6 bg-gray-50 dark:bg-gray-900">
              <AccordionTrigger className="text-left text-base md:text-lg font-semibold text-gray-900 dark:text-white hover:no-underline">
                How long does my Times Square billboard ad appear?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-400 leading-relaxed space-y-3">
                <p>
                  Each ad appears for <strong>10 seconds per display</strong>, and is shown <strong>3 times within a 24-hour period</strong>.
                </p>
                <p>
                  This format is ideal for brand awareness, product launches, viral content, and announcements.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border border-gray-200 dark:border-gray-800 rounded-lg px-6 bg-gray-50 dark:bg-gray-900">
              <AccordionTrigger className="text-left text-base md:text-lg font-semibold text-gray-900 dark:text-white hover:no-underline">
                What types of content can I display on a Times Square billboard?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-400 leading-relaxed">
                <p className="mb-3">You can advertise:</p>
                <ul className="list-disc list-inside space-y-1 mb-3 ml-2">
                  <li>Business promotions</li>
                  <li>Brand campaigns</li>
                  <li>Product launches</li>
                  <li>Music releases</li>
                  <li>Events</li>
                  <li>Personal messages</li>
                </ul>
                <p>
                  Accepted formats are <strong>PNG images</strong> and <strong>MP4 videos</strong> (Full HD or 4K).
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border border-gray-200 dark:border-gray-800 rounded-lg px-6 bg-gray-50 dark:bg-gray-900">
              <AccordionTrigger className="text-left text-base md:text-lg font-semibold text-gray-900 dark:text-white hover:no-underline">
                Can businesses advertise in Times Square using ShowYoNy?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-400 leading-relaxed">
                <p className="mb-3">Absolutely. ShowYoNy is designed for:</p>
                <ul className="list-disc list-inside space-y-1 mb-3 ml-2">
                  <li>Small businesses</li>
                  <li>Startups</li>
                  <li>Entrepreneurs</li>
                  <li>Agencies</li>
                  <li>Established brands</li>
                </ul>
                <p>
                  We also offer <strong>custom Times Square advertising packages</strong> for businesses that need recurring or long-term exposure.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className={`border border-gray-200 dark:border-gray-800 rounded-lg px-6 bg-gray-50 dark:bg-gray-900 ${!showAllFaqs ? 'hidden' : ''}`}>
              <AccordionTrigger className="text-left text-base md:text-lg font-semibold text-gray-900 dark:text-white hover:no-underline">
                Is this the cheapest way to advertise in Times Square?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-400 leading-relaxed space-y-3">
                <p>
                  ShowYoNy offers one of the lowest Times Square billboard advertising prices available.
                </p>
                <p>
                  Traditional Times Square billboards can cost thousands of dollars per day, while ShowYoNy allows you to appear on a digital billboard starting at just <strong>$22</strong>.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className={`border border-gray-200 dark:border-gray-800 rounded-lg px-6 bg-gray-50 dark:bg-gray-900 ${!showAllFaqs ? 'hidden' : ''}`}>
              <AccordionTrigger className="text-left text-base md:text-lg font-semibold text-gray-900 dark:text-white hover:no-underline">
                Do I need to be in New York to advertise in Times Square?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-400 leading-relaxed space-y-3">
                <p>
                  <strong>No.</strong> You can advertise in Times Square from anywhere in the world.
                </p>
                <p>
                  Simply upload your content online, get it approved, and your ad will go live on the billboard.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className={`border border-gray-200 dark:border-gray-800 rounded-lg px-6 bg-gray-50 dark:bg-gray-900 ${!showAllFaqs ? 'hidden' : ''}`}>
              <AccordionTrigger className="text-left text-base md:text-lg font-semibold text-gray-900 dark:text-white hover:no-underline">
                How does the approval process work?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-400 leading-relaxed space-y-3">
                <p>
                  All content goes through <strong>automatic AI moderation</strong> to ensure it complies with advertising and safety policies.
                </p>
                <p>
                  Once approved, your content is scheduled and displayed on the Times Square digital screen.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-9" className={`border border-gray-200 dark:border-gray-800 rounded-lg px-6 bg-gray-50 dark:bg-gray-900 ${!showAllFaqs ? 'hidden' : ''}`}>
              <AccordionTrigger className="text-left text-base md:text-lg font-semibold text-gray-900 dark:text-white hover:no-underline">
                Can I preview my Times Square billboard ad before it goes live?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-400 leading-relaxed">
                <p>
                  Yes. You will receive a <strong>digital preview</strong> of how your content will look on the billboard before final publication.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-10" className={`border border-gray-200 dark:border-gray-800 rounded-lg px-6 bg-gray-50 dark:bg-gray-900 ${!showAllFaqs ? 'hidden' : ''}`}>
              <AccordionTrigger className="text-left text-base md:text-lg font-semibold text-gray-900 dark:text-white hover:no-underline">
                Can I book multiple days or recurring Times Square billboard ads?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-400 leading-relaxed">
                <p className="mb-3">Yes. In addition to single-day options, we offer:</p>
                <ul className="list-disc list-inside space-y-1 mb-3 ml-2">
                  <li>Daily packages</li>
                  <li>Weekly packages</li>
                  <li>Monthly packages</li>
                  <li>Semi-annual and annual campaigns</li>
                </ul>
                <p>
                  Contact us to create a custom Times Square billboard advertising plan.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-11" className={`border border-gray-200 dark:border-gray-800 rounded-lg px-6 bg-gray-50 dark:bg-gray-900 ${!showAllFaqs ? 'hidden' : ''}`}>
              <AccordionTrigger className="text-left text-base md:text-lg font-semibold text-gray-900 dark:text-white hover:no-underline">
                What makes digital billboard advertising in Times Square effective?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-400 leading-relaxed">
                <p className="mb-3">
                  Times Square receives <strong>millions of visitors every week</strong>, making it one of the most powerful locations for outdoor advertising.
                </p>
                <p className="mb-2">Digital billboard ads are:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Highly visible</li>
                  <li>Perfect for social media sharing</li>
                  <li>Ideal for global brand exposure</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-12" className={`border border-gray-200 dark:border-gray-800 rounded-lg px-6 bg-gray-50 dark:bg-gray-900 ${!showAllFaqs ? 'hidden' : ''}`}>
              <AccordionTrigger className="text-left text-base md:text-lg font-semibold text-gray-900 dark:text-white hover:no-underline">
                How do I book a Times Square billboard ad?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-400 leading-relaxed">
                <p className="mb-3">Booking is simple:</p>
                <ol className="list-decimal list-inside space-y-1 mb-4 ml-2">
                  <li>Upload your image or video</li>
                  <li>Complete the payment</li>
                  <li>Get approved</li>
                  <li>See your ad live in Times Square</li>
                </ol>
                <p>
                  You can book your Times Square billboard ad online in minutes.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {!showAllFaqs && (
            <div className="text-center mt-8">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowAllFaqs(true)}
                className="border-2"
              >
                Show More Questions
              </Button>
            </div>
          )}

          <div className="text-center mt-12">
            <Button
              size="lg"
              onClick={() => window.open('https://api.whatsapp.com/send/?phone=19297421127&text&type=phone_number&app_absent=0', '_blank')}
              className="bg-[#ff2e63] hover:bg-[#ff2e63]/90 text-white text-lg px-8"
            >
              More Information
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 lg:py-32 px-6 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 dark:from-slate-900 dark:via-black dark:to-slate-900">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
            {/* Left Column - Contact Info */}
            <div className="lg:col-span-2 space-y-12">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Message us
                </h2>
                <p className="text-lg text-slate-300 leading-relaxed">
                  We'd love to hear from you — send us a message and we'll be in touch soon.
                </p>
              </div>

              <div className="space-y-8">
                {/* WhatsApp Contact */}
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-3 font-semibold">
                    WHATSAPP
                  </h3>
                  <Button
                    onClick={handleWhatsAppClick}
                    className="bg-[#25D366] hover:bg-[#20BA5A] text-white h-12 px-6 rounded-lg font-semibold shadow-lg transition-all duration-300 hover:shadow-[#25D366]/20"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat on WhatsApp
                  </Button>
                  <p className="text-slate-400 text-sm mt-2">
                    Get instant responses
                  </p>
                </div>

                {/* Phone Contact */}
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-3 font-semibold">
                    PHONE
                  </h3>
                  <a
                    href="tel:+19297421127"
                    className="text-2xl font-bold text-white hover:text-[#ff2e63] transition-colors duration-300 inline-block"
                  >
                    +1 (929) 742-1127
                  </a>
                  <p className="text-slate-400 text-sm mt-2">
                    Available for calls and messages
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Form */}
            <div className="lg:col-span-3">
              <form onSubmit={handleContactSubmit} className="space-y-6">
                {/* Name and Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-slate-300 mb-3 font-semibold">
                      NAME*
                    </label>
                    <Input
                      type="text"
                      placeholder="Your name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      required
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-[#ff2e63] focus:ring-[#ff2e63] h-14 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-slate-300 mb-3 font-semibold">
                      EMAIL*
                    </label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      required
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-[#ff2e63] focus:ring-[#ff2e63] h-14 rounded-lg"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-300 mb-3 font-semibold">
                    PHONE
                  </label>
                  <Input
                    type="tel"
                    placeholder="Your phone (optional)"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-[#ff2e63] focus:ring-[#ff2e63] h-14 rounded-lg"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-300 mb-3 font-semibold">
                    MESSAGE*
                  </label>
                  <Textarea
                    placeholder="Tell us about your project..."
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    required
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-[#ff2e63] focus:ring-[#ff2e63] min-h-[180px] rounded-lg resize-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-white hover:bg-gray-100 text-slate-900 disabled:opacity-50 h-14 px-8 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
                  >
                    {isSubmitting ? "Sending..." : (
                      <>
                        <span>SUBMIT MESSAGE</span>
                        <Send className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12">
            {/* Logo Section - Full Width on Mobile */}
            <div className="mb-8 md:mb-12">
              <img src={showYoLogo} alt="ShowYo" className="h-8 w-auto mb-4 brightness-0 invert" />
              <p className="text-gray-400 text-sm">
                Making Times Square billboard advertising accessible to everyone.
              </p>
            </div>

            {/* Navigate and Connect - 2 Columns on Mobile, Part of 3 Columns on Desktop */}
            <div className="grid grid-cols-2 md:grid-cols-2 gap-8 md:gap-12">
              <div>
                <h4 className="font-semibold mb-4">Navigate</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li>
                    <button onClick={() => navigate('/upload')} className="hover:text-white transition-colors">
                      Get Started
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/business-plans')} className="hover:text-white transition-colors">
                      Business Plans
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/kiosk')} className="hover:text-white transition-colors">
                      Watch Live
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Connect</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li>
                    <a href="mailto:support@showyony.com" className="hover:text-white transition-colors">
                      support@showyony.com
                    </a>
                  </li>
                  <li>
                    <a href="tel:+19297421127" className="hover:text-white transition-colors">
                      +1 (929) 742-1127
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} ShowYo. All rights reserved. Powered By: <a href="https://neuromarket.io" target="_blank" rel="noopener noreferrer" className="text-[#ff2e63] hover:text-[#ff2e63]/80 transition-colors">NeuroMarket</a>
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Scroll to top
            </button>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes marquee-forward {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @keyframes marquee-reverse {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Index;
