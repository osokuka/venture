import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ArrowRight, Play, CheckCircle, TrendingUp, Users, Target, Sparkles, Star, Zap, Rocket, Brain } from "lucide-react";
import { useState, useEffect } from "react";

interface HeroSectionProps {
  onRegister: (role?: 'venture' | 'investor' | 'mentor') => void;
}

export function HeroSection({ onRegister }: HeroSectionProps) {
  const [currentText, setCurrentText] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  const texts = ["Connect", "Invest", "Scale Together"];

  // Typewriter effect
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isTyping) {
        if (charIndex < texts[textIndex].length) {
          setCurrentText(texts[textIndex].slice(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        } else {
          setTimeout(() => setIsTyping(false), 2000);
        }
      } else {
        if (charIndex > 0) {
          setCurrentText(texts[textIndex].slice(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        } else {
          setIsTyping(true);
          setTextIndex((textIndex + 1) % texts.length);
        }
      }
    }, isTyping ? 150 : 100);

    return () => clearTimeout(timeout);
  }, [charIndex, textIndex, isTyping, texts]);

  const floatingElements = [
    { icon: Rocket, color: "text-gray-600", delay: "delay-0", position: "top-20 left-20" },
    { icon: Target, color: "text-gray-500", delay: "delay-1000", position: "top-32 right-32" },
    { icon: Brain, color: "text-gray-600", delay: "delay-2000", position: "bottom-40 left-32" },
    { icon: Zap, color: "text-gray-500", delay: "delay-500", position: "bottom-20 right-20" },
    { icon: TrendingUp, color: "text-gray-600", delay: "delay-1500", position: "top-1/2 right-16" },
    { icon: Users, color: "text-gray-500", delay: "delay-700", position: "top-40 left-1/3" },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating geometric shapes */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-gray-100 rounded-full animate-pulse"></div>
        <div className="absolute top-20 right-20 w-16 h-16 bg-gray-50 rounded-lg transform rotate-45 animate-bounce"></div>
        <div className="absolute bottom-20 left-20 w-12 h-12 bg-gray-100 rounded-full animate-ping"></div>
        <div className="absolute bottom-40 right-40 w-24 h-24 bg-gray-50 rounded-lg animate-pulse"></div>
        
        {/* Floating icons */}
        {floatingElements.map((element, index) => (
          <div
            key={index}
            className={`absolute ${element.position} animate-bounce ${element.delay}`}
            style={{ animationDuration: '3s', animationIterationCount: 'infinite' }}
          >
            <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center transform hover:scale-110 transition-transform duration-300 border border-gray-200">
              <element.icon className={`w-6 h-6 ${element.color}`} />
            </div>
          </div>
        ))}

        {/* Animated grid pattern */}
        <div className="absolute inset-0 opacity-3">
          <div className="grid grid-cols-12 gap-4 h-full">
            {Array.from({ length: 144 }, (_, i) => (
              <div
                key={i}
                className="bg-gray-200 rounded animate-pulse"
                style={{ animationDelay: `${i * 50}ms` }}
              ></div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Trust Badge */}
            <div className="flex items-center space-x-4 animate-fade-in-up">
              <Badge className="bg-gray-100 text-gray-700 border-gray-200 px-4 py-2 hover:bg-gray-200 transition-colors">
                <CheckCircle className="w-4 h-4 mr-2" />
                Trusted by 500+ Startups
              </Badge>
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className="w-4 h-4 text-yellow-400 fill-current hover:scale-110 transition-transform cursor-pointer" 
                    style={{ animationDelay: `${i * 100}ms` }}
                  />
                ))}
                <span className="text-sm text-gray-600 ml-2">4.9/5 Rating</span>
              </div>
            </div>

            {/* Main Headline with Typewriter Effect */}
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                <span className="text-gray-900">
                  {currentText}
                </span>
                <span className="animate-pulse text-gray-600">|</span>
                <br />
                <span className="text-gray-700">
                  Build the Future.
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed max-w-lg animate-fade-in-up animation-delay-500" >
                The premier platform connecting innovative startups with strategic investors and expert mentors. 
                Transform your venture into a success story.
              </p>
            </div>

            {/* Value Props */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg group">
                <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Smart Matching</p>
                  <p className="text-sm text-gray-600">AI-powered connections</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg group">
                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Growth Focus</p>
                  <p className="text-sm text-gray-600">Accelerated scaling</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg group">
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Expert Network</p>
                  <p className="text-sm text-gray-600">Vetted professionals</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                className="btn-chrome-primary text-lg px-8 py-4"
                onClick={() => onRegister()}
              >
                Start Your Journey
                <ArrowRight className="w-5 h-5 ml-2 inline transition-transform group-hover:translate-x-1" />
              </button>
              
              <button className="btn-chrome-secondary text-lg px-8 py-4">
                <Play className="w-5 h-5 mr-2 inline transition-transform group-hover:scale-110" />
                Watch Demo
              </button>
            </div>

            {/* Social Proof */}
            <div className="pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-4">Trusted by leading organizations</p>
              <div className="flex items-center space-x-8 opacity-60">
                <div className="text-lg font-bold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">TechStars</div>
                <div className="text-lg font-bold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">Y Combinator</div>
                <div className="text-lg font-bold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">500 Startups</div>
                <div className="text-lg font-bold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">Andreessen</div>
              </div>
            </div>
          </div>

          {/* Right Content - Visual */}
          <div className="relative">
            {/* Main Dashboard Preview */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-500 hover:scale-105">
                <div className="bg-gray-800 h-12 flex items-center px-6">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse animation-delay-200"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse animation-delay-400"></div>
                  </div>
                  <div className="flex-1 text-center text-white font-medium">VentureLink Dashboard</div>
                </div>
                
                <div className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">Welcome back, Sarah</h3>
                    <Badge className="bg-green-100 text-green-700 animate-pulse">Active</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      <p className="text-sm text-gray-600 font-medium">Portfolio Value</p>
                      <p className="text-2xl font-bold text-gray-900">$2.4M</p>
                      <p className="text-xs text-gray-500">+23% this month</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      <p className="text-sm text-gray-600 font-medium">Startups</p>
                      <p className="text-2xl font-bold text-gray-900">12</p>
                      <p className="text-xs text-gray-500">Active investments</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer transform hover:scale-105">
                      <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                        <Target className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">TechFlow AI</p>
                        <p className="text-sm text-gray-500">95% match • $500K raised</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer transform hover:scale-105">
                      <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">GreenSpace</p>
                        <p className="text-sm text-gray-500">88% match • Series A</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Cards */}
              <div className="absolute -top-6 -left-6 bg-white rounded-xl shadow-lg border border-gray-200 p-4 transform -rotate-6 hover:rotate-0 transition-transform duration-300 hover:scale-110 animate-bounce">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Deal Closed</p>
                    <p className="text-sm text-gray-500">$1.2M funding</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-lg border border-gray-200 p-4 transform rotate-6 hover:rotate-0 transition-transform duration-300 hover:scale-110 animate-bounce animation-delay-1000">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">New Match</p>
                    <p className="text-sm text-gray-500">97% compatibility</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}