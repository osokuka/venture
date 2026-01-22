import { AuthProvider, useAuth } from "./components/AuthContext";
import { HeroSection } from "./components/HeroSection";
import { FeaturesSection } from "./components/FeaturesSection";
import { ServicesSection } from "./components/ServicesSection";
import { AboutSection } from "./components/AboutSection";
import { SuccessStoriesSection } from "./components/SuccessStoriesSection";
import { FAQSection } from "./components/FAQSection";
import { ContactSection } from "./components/ContactSection";
import { VentureRegistration } from "./components/VentureRegistration";
import { InvestorRegistration } from "./components/InvestorRegistration";
import { MentorRegistration } from "./components/MentorRegistration";
import { VentureDashboard } from "./components/VentureDashboard";
import { InvestorDashboard } from "./components/InvestorDashboard";
import { MentorDashboard } from "./components/MentorDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { LoginForm } from "./components/LoginForm";
import { ModernDashboardLayout } from "./components/ModernDashboardLayout";
import { Button } from "./components/ui/button";
import { Target, Menu, X, Sparkles, ArrowUp } from "lucide-react";
import { useState, useEffect } from "react";
import logoImage from './assets/logos/ventureuplink.webp';

// Dashboard wrapper component that receives props from ModernDashboardLayout
function DashboardContent({ user, activeView, onViewChange, onProfileUpdate }: any) {
  switch (user.role) {
    case 'venture':
      return (
        <VentureDashboard 
          user={user} 
          activeView={activeView}
          onViewChange={onViewChange}
          onProfileUpdate={onProfileUpdate}
        />
      );
    case 'investor':
      return (
        <InvestorDashboard 
          user={user} 
          activeView={activeView}
          onViewChange={onViewChange}
          onProfileUpdate={onProfileUpdate}
        />
      );
    case 'mentor':
      return (
        <MentorDashboard 
          user={user} 
          activeView={activeView}
          onViewChange={onViewChange}
          onProfileUpdate={onProfileUpdate}
        />
      );
    case 'admin':
      return (
        <AdminDashboard 
          user={user} 
          activeView={activeView}
          onViewChange={onViewChange}
          onProfileUpdate={onProfileUpdate}
        />
      );
    default:
      return <div>Unknown user role: {user.role}</div>;
  }
}

function AppContent() {
  const { user, currentView, registrationRole, logout, setView, startRegistration } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Show scroll to top button when scrolled down
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRegisterClick = (role: 'venture' | 'investor' | 'mentor') => {
    startRegistration(role);
  };

  const handleLogoClick = () => {
    if (user) {
      setView('dashboard');
    } else {
      setView('landing');
    }
  };

  // Login Flow
  if (currentView === 'login') {
    return <LoginForm />;
  }

  // Registration Flow
  if (currentView === 'register') {
    if (registrationRole === 'venture') {
      return <VentureRegistration />;
    } else if (registrationRole === 'investor') {
      return <InvestorRegistration />;
    } else if (registrationRole === 'mentor') {
      return <MentorRegistration />;
    }
  }

  // Dashboard Views
  if (currentView === 'dashboard' && user) {
    return (
      <ModernDashboardLayout user={user}>
        <DashboardContent user={user} />
      </ModernDashboardLayout>
    );
  }

  // Landing Page
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-b border-gray-200 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button onClick={handleLogoClick} className="flex items-center space-x-3 group">
              <img 
                src={logoImage} 
                alt="VentureLink" 
                className="w-19 h-19 object-contain group-hover:scale-105 transition-transform"
                style={{ maxWidth: '75px', maxHeight: '75px' }}
              />
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold text-gray-900">
                  VentureLink
                </span>
                <Sparkles className="w-4 h-4 text-gray-600" />
              </div>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('about')}
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium relative group"
              >
                About
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-800 transition-all group-hover:w-full"></span>
              </button>
              <button 
                onClick={() => scrollToSection('features')}
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium relative group"
              >
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-800 transition-all group-hover:w-full"></span>
              </button>
              <button 
                onClick={() => scrollToSection('services')}
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium relative group"
              >
                Services
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-800 transition-all group-hover:w-full"></span>
              </button>
              <button 
                onClick={() => scrollToSection('success-stories')}
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium relative group"
              >
                Success Stories
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-800 transition-all group-hover:w-full"></span>
              </button>
              <button 
                onClick={() => scrollToSection('faq')}
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium relative group"
              >
                FAQ
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-800 transition-all group-hover:w-full"></span>
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium relative group"
              >
                Contact
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-800 transition-all group-hover:w-full"></span>
              </button>
              <div className="flex items-center space-x-3 ml-6">
                <button 
                  className="btn-chrome-secondary text-sm px-4 py-2"
                  onClick={() => setView('login')}
                >
                  Sign In
                </button>
                <button 
                  className="btn-chrome-primary text-sm px-4 py-2"
                  onClick={() => handleRegisterClick('venture')}
                >
                  Get Started
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-200 py-4 space-y-4 shadow-lg">
              <button 
                onClick={() => scrollToSection('about')}
                className="block w-full text-left px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors font-medium"
              >
                About
              </button>
              <button 
                onClick={() => scrollToSection('features')}
                className="block w-full text-left px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors font-medium"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('services')}
                className="block w-full text-left px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors font-medium"
              >
                Services
              </button>
              <button 
                onClick={() => scrollToSection('success-stories')}
                className="block w-full text-left px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors font-medium"
              >
                Success Stories
              </button>
              <button 
                onClick={() => scrollToSection('faq')}
                className="block w-full text-left px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors font-medium"
              >
                FAQ
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="block w-full text-left px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors font-medium"
              >
                Contact
              </button>
              <div className="px-4 space-y-3 pt-4 border-t border-gray-200">
                <button 
                  className="btn-chrome-secondary w-full text-sm py-2"
                  onClick={() => setView('login')}
                >
                  Sign In
                </button>
                <button 
                  className="btn-chrome-primary w-full text-sm py-2"
                  onClick={() => handleRegisterClick('venture')}
                >
                  Get Started
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <HeroSection onRegister={handleRegisterClick} />
        
        <div id="about">
          <AboutSection />
        </div>
        
        <div id="features">
          <FeaturesSection />
        </div>

        <div id="services">
          <ServicesSection onRegister={handleRegisterClick} />
        </div>

        <div id="success-stories">
          <SuccessStoriesSection />
        </div>

        <div id="faq">
          <FAQSection />
        </div>

        <div id="contact">
          <ContactSection />
        </div>
      </main>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 w-12 h-12 bg-gray-800 hover:bg-gray-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 flex items-center justify-center group hover:scale-110"
        >
          <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
        </button>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-16 h-16 flex items-center justify-center bg-blue-600 rounded">
                <span className="text-white text-2xl font-bold">VU</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold">VentureLink</span>
                <Sparkles className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            <div className="text-sm text-gray-400 text-center md:text-right">
              <p className="mb-2">© 2025 VentureLink. All rights reserved.</p>
              <p>
                Provided by{' '}
                <a 
                  href="https://scardustech.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors underline"
                >
                  ScardusTech L.L.C
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}