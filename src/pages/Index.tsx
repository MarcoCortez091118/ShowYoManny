import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { Camera, Video, Zap, Eye, Shield, MessageCircle, Send, Mail, Phone, Moon, Sun, ArrowRight, Clock, DollarSign, Globe } from "lucide-react";
import showYoLogo from "@/assets/showyo-logo-color.png";
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

  useEffect(() => {
    const handleScroll = () => {
      if (scrollerRef.current) {
        const element = scrollerRef.current;
        const rect = element.getBoundingClientRect();
        const elementHeight = element.offsetHeight;
        const viewportHeight = window.innerHeight;

        // If we're at the very top of the page, always show slide 0
        if (window.scrollY < 10) {
          setScrollProgress(0);
          setCurrentSlide(0);
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
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
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
    const handleHeaderScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        setShowHeader(true);
      } else if (currentScrollY > lastScrollY.current) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleHeaderScroll);
    return () => window.removeEventListener('scroll', handleHeaderScroll);
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
      <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-sm transition-transform duration-300 ${
        showHeader ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="container mx-auto px-6 lg:px-12 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src={showYoLogo} alt="ShowYo" className="h-8 w-auto" />
            </div>
            <nav className="hidden md:flex items-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-full pl-6 pr-2 py-2 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
              <button
                onClick={() => navigate('/business-plans')}
                className="px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                BUSINESS PLANS
              </button>
              <button
                onClick={() => navigate('/kiosk')}
                className="px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                WATCH LIVE
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
                className="ml-2 px-6 py-2.5 text-sm font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-full shadow-sm transition-all"
              >
                GET STARTED
              </Button>
            </nav>
            <div className="md:hidden flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
              >
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
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
            <div className="absolute top-8 left-8 lg:left-16 z-20 transition-opacity duration-500">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/80 backdrop-blur-sm bg-white/10 px-3 py-2 rounded-full border border-white/20">
                <div className="w-2 h-2 bg-white rounded-sm" />
                What we do
              </div>
            </div>
          )}

          {/* Slide Counter - Bottom Left */}
          <div className="absolute bottom-8 left-8 lg:left-16 z-20">
            <div className="px-4 py-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-md shadow-xl">
              <span className="text-sm font-medium text-white">
                0{currentSlide + 1}
              </span>
              <span className="text-sm text-white/60 mx-1">/</span>
              <span className="text-sm text-white/60">04</span>
            </div>
          </div>

          {/* Progress Line */}
          <div className="absolute left-8 lg:left-16 top-20 bottom-20 w-px bg-white/20 z-20">
            <div
              className="w-full bg-gradient-to-b from-white via-cyan-200 to-white transition-all duration-300 ease-out shadow-lg"
              style={{ height: `${(scrollProgress % (1/4)) * 400}%` }}
            />
          </div>

          {/* Main Content - Center */}
          <div className="relative z-10 container mx-auto px-8 lg:px-16 max-w-6xl">
            <div className="text-center">
              {/* Slide 0: Hero */}
              <div
                className={`transition-all duration-700 ease-out ${
                  currentSlide === 0
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 -translate-y-8 absolute inset-0 pointer-events-none'
                }`}
              >
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-8 leading-tight drop-shadow-lg">
                  Display your content on Times Square's iconic billboard
                </h1>
                <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
                  Upload your image or video and broadcast it on a real digital billboard at 1604 Broadway, NYC. Affordable, fast, and accessible to everyone.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    onClick={() => navigate('/upload')}
                    className="bg-white text-gray-900 hover:bg-gray-100 text-lg px-8 py-6 h-auto group shadow-xl"
                  >
                    Start Now
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate('/business-plans')}
                    className="text-lg px-8 py-6 h-auto border-2 border-cyan-400 text-black bg-cyan-400/20 hover:bg-cyan-400/30 backdrop-blur-sm shadow-xl"
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

          {/* Scroll Indicator */}
          <div
            className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/70 transition-opacity duration-500 z-20 ${
              scrollProgress > 0.05 ? 'opacity-0' : 'opacity-100 animate-bounce'
            }`}
          >
            <span className="text-xs uppercase tracking-wider drop-shadow-lg">Scroll</span>
            <div className="w-px h-8 bg-gradient-to-b from-white/70 to-transparent" />
          </div>
        </div>
      </section>

      {/* Platform Section */}
      <section className="bg-gray-50 dark:bg-gray-900 py-20 lg:py-32 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-[200px_1fr] gap-12 lg:gap-16">
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
                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 mt-6"
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
        <div className="grid md:grid-cols-3 gap-0">
            {/* Card 1 - Instant Upload */}
            <div className="bg-[#D4F4A6] p-12 md:p-16 min-h-[420px] flex flex-col relative group hover:shadow-2xl transition-shadow">
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
            <div className="bg-[#2C3E3F] p-12 md:p-16 min-h-[420px] flex flex-col relative group hover:shadow-2xl transition-shadow">
              <div className="text-sm text-gray-400 absolute top-8 right-8">02.</div>
              <div className="mb-auto pt-8">
                <svg className="w-20 h-20 mb-12" viewBox="0 0 100 100" fill="none" stroke="white" strokeWidth="1.5">
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
                <h3 className="text-3xl md:text-4xl font-semibold mb-4 text-white">Affordable Pricing</h3>
                <p className="text-gray-300 text-lg leading-relaxed">
                  Starting at just $22. The most accessible Times Square billboard rates available.
                </p>
              </div>
            </div>

            {/* Card 3 - Global Reach */}
            <div className="bg-[#E5E5E5] p-12 md:p-16 min-h-[420px] flex flex-col relative group hover:shadow-2xl transition-shadow">
              <div className="text-sm text-gray-600 absolute top-8 right-8">03.</div>
              <div className="mb-auto pt-8">
                <svg className="w-20 h-20 mb-12" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
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
                <h3 className="text-3xl md:text-4xl font-semibold mb-4 text-gray-900">Global Reach</h3>
                <p className="text-gray-700 text-lg leading-relaxed">
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
        <div className="flex whitespace-nowrap animate-marquee">
          <div className="flex items-center">
            {Array(10).fill(null).map((_, i) => (
              <span key={i} className="text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-gray-900 px-8">
                ShowYoNy – Affordable Times Square Billboard Advertising from $22
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 lg:py-32 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <img
                src="https://instagram.fpbc2-2.fna.fbcdn.net/v/t39.30808-6/608425265_122140637702962233_4738224972353000105_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=103&ig_cache_key=Mzc5OTk0NzA3NzYxNTc5NzQ3OQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6InhwaWRzLjk2MHgxMjAwLnNkci5DMyJ9&_nc_ohc=QksMm53zfikQ7kNvwH2B249&_nc_oc=AdlGEpAFw3tsdeGqd9GteK5cLx6bkcxaeN4IO-7BKRHdQCDYeh5IguDc1A7Lt8bRAQUVWcp2ayptw__UZ-1iAih9&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fpbc2-2.fna&_nc_gid=XU6vzKDGA8ondtOrUTJGgg&oh=00_AfuUBW8crXYBnyCD4BmZCALEPRN71Uc-5qQLdl3XC2JLLA&oe=699013AA"
                alt="Times Square Billboard"
                className="rounded-2xl shadow-2xl w-full"
              />
            </div>

            <div className="order-1 lg:order-2 space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                Democratizing premium outdoor advertising for the digital age.
              </h2>

              <div className="grid md:grid-cols-2 gap-6 text-gray-600 dark:text-gray-400">
                <div>
                  <p className="leading-relaxed">
                    ShowYo was built to make Times Square billboard advertising accessible to creators, entrepreneurs, and businesses of all sizes.
                  </p>
                </div>
                <div>
                  <p className="leading-relaxed">
                    Our automated platform handles content moderation, payment processing, and scheduling—eliminating traditional barriers and putting the power of iconic advertising in your hands.
                  </p>
                </div>
              </div>

              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/business-plans')}
                className="border-2 mt-4"
              >
                Explore Business Solutions
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
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

          <div className="grid md:grid-cols-3 gap-8">
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
              className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 text-lg px-8"
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 lg:py-32 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Get in Touch
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Ready to showcase your brand? Contact us for custom packages
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-6">
                  <Mail className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Send us a Message</h3>
                </div>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <Input
                      type="text"
                      placeholder="Name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      required
                      className="bg-gray-50 dark:bg-gray-900"
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="Email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      required
                      className="bg-gray-50 dark:bg-gray-900"
                    />
                  </div>
                  <div>
                    <Input
                      type="tel"
                      placeholder="Phone (optional)"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      className="bg-gray-50 dark:bg-gray-900"
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="Message"
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      required
                      className="bg-gray-50 dark:bg-gray-900 min-h-[120px]"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                  >
                    {isSubmitting ? "Sending..." : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-[#25D366]/10 to-[#25D366]/5 border-[#25D366]/20 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-[#25D366]/10 rounded-xl">
                      <MessageCircle className="w-6 h-6 text-[#25D366]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">WhatsApp</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                        Get instant responses via WhatsApp
                      </p>
                      <Button
                        onClick={handleWhatsAppClick}
                        className="bg-[#25D366] hover:bg-[#20BA5A] text-white w-full"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Chat on WhatsApp
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-accent/10 rounded-xl">
                      <Phone className="w-6 h-6 text-accent" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Phone</h3>
                      <p className="text-2xl font-bold text-accent mb-1">
                        +1 (929) 742-1127
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Available for calls and messages
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            <div>
              <img src={showYoLogo} alt="ShowYo" className="h-8 w-auto mb-4 brightness-0 invert" />
              <p className="text-gray-400 text-sm">
                Making Times Square billboard advertising accessible to everyone.
              </p>
            </div>

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
                  <a href="mailto:hello@showyo.com" className="hover:text-white transition-colors">
                    hello@showyo.com
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

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © 2025 ShowYo. All rights reserved.
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
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Index;
