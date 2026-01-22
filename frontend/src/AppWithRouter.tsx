import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./components/AuthContext";
import logoImage from './assets/logos/ventureuplink.webp';
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
import { RoleSelection } from "./components/RoleSelection";
import { UnifiedRegistration } from "./components/UnifiedRegistration";
import { VentureDashboard } from "./components/VentureDashboard";
import { InvestorDashboard } from "./components/InvestorDashboard";
import { MentorDashboard } from "./components/MentorDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { PitchDeckDetails } from "./components/PitchDeckDetails";
import { PitchDeckReview } from "./components/PitchDeckReview";
import { AdminProfileReview } from "./components/AdminProfileReview";
import { AdminUserView } from "./components/AdminUserView";
import { PortfolioDetails } from "./components/PortfolioDetails";
import { PortfolioReports } from "./components/PortfolioReports";
import { PortfolioExitPlan } from "./components/PortfolioExitPlan";
import { MeetingScheduler } from "./components/MeetingScheduler";
import CreatePitchDeck from "./components/CreatePitchDeck";
import { LoginForm } from "./components/LoginForm";
import { PasswordResetRequest } from "./components/PasswordResetRequest";
import { PasswordResetConfirm } from "./components/PasswordResetConfirm";
import { VerifyEmail } from "./components/VerifyEmail";
import { ModernDashboardLayout } from "./components/ModernDashboardLayout";
import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/sonner";
import { Target, Menu, X, Sparkles, ArrowUp } from "lucide-react";

// Dashboard wrapper component
function DashboardContent({ user, onRefreshUnreadCount }: { user: any; onRefreshUnreadCount?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract view from URL path
  const pathParts = location.pathname.split('/').filter(Boolean);
  const activeView = pathParts[pathParts.length - 1] || 'overview';
  
  const handleViewChange = (view: string) => {
    const role = user.role;
    navigate(`/dashboard/${role}/${view}`);
  };

  const handleProfileUpdate = (updatedUser: any) => {
    // Handle profile update if needed
  };

  switch (user.role) {
    case 'venture':
      return (
        <VentureDashboard 
          user={user} 
          activeView={activeView}
          onViewChange={handleViewChange}
          onProfileUpdate={handleProfileUpdate}
          onRefreshUnreadCount={onRefreshUnreadCount}
        />
      );
    case 'investor':
      return (
        <InvestorDashboard 
          user={user} 
          activeView={activeView}
          onViewChange={handleViewChange}
          onProfileUpdate={handleProfileUpdate}
          onRefreshUnreadCount={onRefreshUnreadCount}
        />
      );
    case 'mentor':
      return (
        <MentorDashboard 
          user={user} 
          activeView={activeView}
          onViewChange={handleViewChange}
          onProfileUpdate={handleProfileUpdate}
          onRefreshUnreadCount={onRefreshUnreadCount}
        />
      );
    case 'admin':
      return (
        <AdminDashboard 
          user={user} 
          activeView={activeView}
          onViewChange={handleViewChange}
          onProfileUpdate={handleProfileUpdate}
        />
      );
    default:
      return <div>Unknown user role: {user.role}</div>;
  }
}

function LandingPage() {
  const { user, setView, startRegistration } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

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
    navigate(`/register/${role}`);
  };

  const handleLogoClick = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-b border-gray-200 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <button onClick={handleLogoClick} className="flex items-center space-x-3 group">
              <img 
                src={logoImage} 
                alt="VentureLink" 
                className="w-19 h-19 object-contain group-hover:scale-105 transition-transform"
                style={{ maxWidth: '75px', maxHeight: '75px' }}
              />
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold text-gray-900">VentureLink</span>
                <Sparkles className="w-4 h-4 text-gray-600" />
              </div>
            </button>

            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('about')} className="text-gray-600 hover:text-gray-900 transition-colors font-medium relative group">
                About
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-800 transition-all group-hover:w-full"></span>
              </button>
              <button onClick={() => scrollToSection('features')} className="text-gray-600 hover:text-gray-900 transition-colors font-medium relative group">
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-800 transition-all group-hover:w-full"></span>
              </button>
              <button onClick={() => scrollToSection('services')} className="text-gray-600 hover:text-gray-900 transition-colors font-medium relative group">
                Services
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-800 transition-all group-hover:w-full"></span>
              </button>
              <button onClick={() => scrollToSection('success-stories')} className="text-gray-600 hover:text-gray-900 transition-colors font-medium relative group">
                Success Stories
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-800 transition-all group-hover:w-full"></span>
              </button>
              <button onClick={() => scrollToSection('faq')} className="text-gray-600 hover:text-gray-900 transition-colors font-medium relative group">
                FAQ
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-800 transition-all group-hover:w-full"></span>
              </button>
              <button onClick={() => scrollToSection('contact')} className="text-gray-600 hover:text-gray-900 transition-colors font-medium relative group">
                Contact
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-800 transition-all group-hover:w-full"></span>
              </button>
              <div className="flex items-center space-x-3 ml-6">
                <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
                {/* Start at role selection (can't call handleRegisterClick without a role) */}
                <Button size="sm" onClick={() => navigate('/register')}>
                  Get Started
                </Button>
              </div>
            </div>

            <button
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-gray-600" /> : <Menu className="w-6 h-6 text-gray-600" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-200 py-4 space-y-4 shadow-lg">
              <button onClick={() => scrollToSection('about')} className="block w-full text-left px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors font-medium">About</button>
              <button onClick={() => scrollToSection('features')} className="block w-full text-left px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors font-medium">Features</button>
              <button onClick={() => scrollToSection('services')} className="block w-full text-left px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors font-medium">Services</button>
              <button onClick={() => scrollToSection('success-stories')} className="block w-full text-left px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors font-medium">Success Stories</button>
              <button onClick={() => scrollToSection('faq')} className="block w-full text-left px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors font-medium">FAQ</button>
              <button onClick={() => scrollToSection('contact')} className="block w-full text-left px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors font-medium">Contact</button>
              <div className="px-4 space-y-3 pt-4 border-t border-gray-200">
                <Button variant="outline" className="w-full" size="sm" onClick={() => navigate('/login')}>Sign In</Button>
                <Button className="w-full" size="sm" onClick={() => handleRegisterClick('venture')}>Get Started</Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <main>
        <HeroSection onRegister={handleRegisterClick} />
        <div id="about"><AboutSection /></div>
        <div id="features"><FeaturesSection /></div>
        <div id="services"><ServicesSection onRegister={handleRegisterClick} /></div>
        <div id="success-stories"><SuccessStoriesSection /></div>
        <div id="faq"><FAQSection /></div>
        <div id="contact"><ContactSection /></div>
      </main>

      {showScrollTop && (
        <button onClick={scrollToTop} className="fixed bottom-8 right-8 w-12 h-12 bg-gray-800 hover:bg-gray-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 flex items-center justify-center group hover:scale-110">
          <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
        </button>
      )}

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-10 h-10 flex items-center justify-center">
                <img 
                  src="/logos/ventureuplink.webp" 
                  alt="VentureLink" 
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold">VentureLink</span>
                <Sparkles className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            <div className="text-sm text-gray-400 text-center md:text-right">
              <p className="mb-2">© 2025 VentureLink. All rights reserved.</p>
              <p>Provided by <a href="https://scardustech.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors underline">ScardusTech L.L.C</a></p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AppRoutes() {
  const { user, registrationRole, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Redirect to login if user logs out (but wait for auth check to complete)
  useEffect(() => {
    // Don't redirect while auth is still loading
    if (isLoading) {
      return;
    }
    
    // Don't redirect if already on login/register pages
    if (location.pathname === '/login' || location.pathname.startsWith('/register') || 
        location.pathname === '/forgot-password' || location.pathname === '/reset-password' ||
        location.pathname === '/verify-email' || location.pathname === '/') {
      return;
    }
    
    // Only redirect if user is null and trying to access protected route
    if (!user && window.location.pathname.startsWith('/dashboard')) {
      navigate('/login');
    }
  }, [user, navigate, isLoading, location.pathname]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginForm />} />
      <Route path="/reset-password" element={<PasswordResetConfirm />} />
      <Route path="/forgot-password" element={<PasswordResetRequest />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      {/* Registration Routes */}
      <Route path="/register" element={<RoleSelection />} />
      <Route path="/register/:role" element={<UnifiedRegistration />} />

      {/* Protected Dashboard Routes */}
      <Route
        path="/dashboard"
        element={
          user ? (
            <Navigate to={`/dashboard/${user.role}/overview`} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/dashboard/:role"
        element={
          user ? (
            <Navigate to={`/dashboard/${user.role}/overview`} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      {/* Portfolio Routes - Must come before generic :role/:view route */}
      <Route
        path="/dashboard/investor/portfolio/details"
        element={
          user ? (
            <ModernDashboardLayout user={user}>
              <PortfolioDetails />
            </ModernDashboardLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/dashboard/investor/portfolio/reports"
        element={
          user ? (
            <ModernDashboardLayout user={user}>
              <PortfolioReports />
            </ModernDashboardLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/dashboard/investor/portfolio/exit-plan"
        element={
          user ? (
            <ModernDashboardLayout user={user}>
              <PortfolioExitPlan />
            </ModernDashboardLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Pitch Deck Details Route - Investor View */}
      <Route
        path="/dashboard/investor/pitch-deck/:productId/:docId?"
        element={
          user ? (
            <ModernDashboardLayout user={user}>
              <PitchDeckDetails />
            </ModernDashboardLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Pitch Deck Details Route - Venture View */}
      <Route
        path="/dashboard/venture/pitch-deck/:productId/:docId?"
        element={
          user ? (
            <ModernDashboardLayout user={user}>
              <PitchDeckDetails />
            </ModernDashboardLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Pitch Deck Details Route - Admin View */}
      <Route
        path="/dashboard/admin/pitch-deck/:productId/:docId?"
        element={
          user ? (
            <ModernDashboardLayout user={user}>
              <PitchDeckDetails />
            </ModernDashboardLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Meeting Scheduler Route */}
      <Route
        path="/dashboard/investor/schedule"
        element={
          user ? (
            <ModernDashboardLayout user={user}>
              <MeetingScheduler />
            </ModernDashboardLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Create Pitch Deck Route */}
      <Route
        path="/dashboard/venture/pitch-decks/create"
        element={
          user ? (
            <ModernDashboardLayout user={user}>
              <CreatePitchDeck />
            </ModernDashboardLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Admin Pitch Deck Review Route (NO_MODALS_RULE - opens in new tab) */}
      <Route
        path="/dashboard/admin/pitch-deck-review"
        element={
          user ? (
            <PitchDeckReview />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Admin Profile Review Route (NO_MODALS_RULE - opens in new tab) */}
      <Route
        path="/dashboard/admin/profile-review"
        element={
          user ? (
            <AdminProfileReview />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Admin User View Route (NO_MODALS_RULE - opens in new tab) */}
      <Route
        path="/dashboard/admin/user-view"
        element={
          user ? (
            <ModernDashboardLayout user={user}>
              <AdminUserView />
            </ModernDashboardLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Generic Dashboard Route - Must come after specific routes */}
      <Route
        path="/dashboard/:role/:view"
        element={
          user ? (
            <ModernDashboardLayout user={user}>
              <DashboardContent user={user} />
            </ModernDashboardLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}
