import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { authService, type UserResponse } from '../services/authService';
import { investorService, type InvestorProfileCreatePayload } from '../services/investorService';
import { mentorService, type MentorProfileCreatePayload } from '../services/mentorService';
import { type FrontendUser } from '../types';

export type UserRole = 'venture' | 'investor' | 'mentor' | 'admin';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type User = FrontendUser;

interface AuthContextType {
  user: User | null;
  currentView: 'landing' | 'register' | 'dashboard' | 'login';
  registrationRole: UserRole | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  startRegistration: (role: UserRole) => void;
  completeRegistration: (userData: any) => Promise<void>;
  updateProfile: (updates: Partial<User['profile']>) => Promise<void>;
  setView: (view: 'landing' | 'register' | 'dashboard' | 'login') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'landing' | 'register' | 'dashboard' | 'login'>('landing');
  const [registrationRole, setRegistrationRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const userData = await authService.getCurrentUser();
          // Map backend role to frontend role
          const backendRole = userData.role.toUpperCase();
          let frontendRole: UserRole;
          
          if (backendRole === 'VENTURE') {
            frontendRole = 'venture';
          } else if (backendRole === 'INVESTOR') {
            frontendRole = 'investor';
          } else if (backendRole === 'MENTOR') {
            frontendRole = 'mentor';
          } else if (backendRole === 'ADMIN') {
            frontendRole = 'admin';
          } else {
            frontendRole = 'venture';
          }
          
          // Create user object with proper structure
          const userObject: any = {
            id: userData.id,
            email: userData.email,
            role: frontendRole,
            full_name: userData.full_name || userData.email,
            profile: {
              approvalStatus: 'approved' as const,
            }
          };
          
          setUser(userObject as User);
          setCurrentView('dashboard');
        } catch (error) {
          // Token invalid, clear it
          authService.logout();
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await authService.login({ email, password });
      const userData = await authService.getCurrentUser();
      // TODO: Map UserResponse to User type and fetch profile based on role
      // For now, set a basic user object
      // Map backend role to frontend role
      // Backend returns: 'VENTURE' | 'INVESTOR' | 'MENTOR' | 'ADMIN'
      // Frontend expects: 'venture' | 'investor' | 'mentor' | 'admin'
      const backendRole = userData.role.toUpperCase();
      let frontendRole: UserRole;
      
      if (backendRole === 'VENTURE') {
        frontendRole = 'venture';
      } else if (backendRole === 'INVESTOR') {
        frontendRole = 'investor';
      } else if (backendRole === 'MENTOR') {
        frontendRole = 'mentor';
      } else if (backendRole === 'ADMIN') {
        frontendRole = 'admin';
      } else {
        // Fallback to venture if unknown role
        frontendRole = 'venture';
      }
      
      // Create user object with proper structure
      const userObject: any = {
        id: userData.id,
        email: userData.email,
        role: frontendRole,
        full_name: userData.full_name || userData.email,
        profile: {
          approvalStatus: 'approved' as const, // TODO: Get from profile API
        }
      };
      
      setUser(userObject as User);
      setCurrentView('dashboard');
      // Navigate will be handled by React Router in AppWithRouter
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setCurrentView('landing');
    setRegistrationRole(null);
  };

  const startRegistration = (role: UserRole) => {
    setRegistrationRole(role);
    setCurrentView('register');
  };

  const completeRegistration = async (userData: any) => {
    try {
      // Map frontend role to backend role
      const backendRole = registrationRole?.toUpperCase() as 'VENTURE' | 'INVESTOR' | 'MENTOR';
      
      // Register user
      const registeredUser = await authService.register({
        email: userData.email,
        password: userData.password,
        password_confirm: userData.confirmPassword || userData.password,
        full_name: userData.full_name || userData.founderName || userData.name || '',
        role: backendRole,
      });

      // Automatically log in the user after registration so they can create profiles
      // This allows profile creation to work (requires authentication)
      try {
        await authService.login({
          email: userData.email,
          password: userData.password,
        });
      } catch (loginError) {
        console.warn('Auto-login after registration failed:', loginError);
        // Continue anyway - user can log in manually
      }

      // After successful registration and login, try to create profile based on role
      // Note: This happens before email verification, but user is authenticated
      let profileCreated = false;
      let profileError: Error | null = null;

      try {
        if (registrationRole === 'investor' && userData.organizationName) {
          // Map investor registration form data to API payload
          // Note: Investor form doesn't collect experience_years or deals_count, so we use defaults
          const investorPayload: InvestorProfileCreatePayload = {
            full_name: userData.name || registeredUser.full_name || '',
            organization_name: userData.organizationName || '',
            linkedin_or_website: userData.linkedinUrl || userData.website || '',
            email: userData.email,
            phone: userData.phone || undefined,
            investment_experience_years: 0, // Default - user can update later
            deals_count: undefined, // Not collected in registration form
            stage_preferences: userData.investmentStages || [],
            industry_preferences: userData.industries || [],
            average_ticket_size: userData.ticketSize || `${userData.minInvestment || '0'}-${userData.maxInvestment || '0'}`,
            visible_to_ventures: userData.isVisible !== false, // Default to true
          };
          
          await investorService.createProfile(investorPayload);
          profileCreated = true;
        } else if (registrationRole === 'mentor' && userData.jobTitle) {
          // Map mentor registration form data to API payload
          // Determine engagement type from form data
          let engagementType: 'PAID' | 'PRO_BONO' | 'BOTH' = 'PRO_BONO';
          if (userData.availabilityType && Array.isArray(userData.availabilityType)) {
            const hasPaid = userData.availabilityType.some((type: string) => 
              type.toLowerCase().includes('paid')
            );
            const hasProBono = userData.availabilityType.some((type: string) => 
              type.toLowerCase().includes('pro-bono') || type.toLowerCase().includes('pro bono')
            );
            
            if (hasPaid && hasProBono) {
              engagementType = 'BOTH';
            } else if (hasPaid) {
              engagementType = 'PAID';
            }
          } else if (userData.isProBono === false && userData.hourlyRate) {
            engagementType = 'PAID';
          }

          // Determine preferred engagement from sessionFormat
          // Form uses: "Virtual/Video Call", "In-Person", "Phone Call", "Email/Async"
          let preferredEngagement: 'VIRTUAL' | 'IN_PERSON' | 'BOTH' = 'BOTH';
          if (userData.sessionFormat && Array.isArray(userData.sessionFormat)) {
            const hasVirtual = userData.sessionFormat.some((format: string) => 
              format.toLowerCase().includes('virtual') || format.toLowerCase().includes('video')
            );
            const hasInPerson = userData.sessionFormat.some((format: string) => 
              format.toLowerCase().includes('in-person') || format.toLowerCase().includes('in person')
            );
            
            if (hasVirtual && hasInPerson) {
              preferredEngagement = 'BOTH';
            } else if (hasVirtual) {
              preferredEngagement = 'VIRTUAL';
            } else if (hasInPerson) {
              preferredEngagement = 'IN_PERSON';
            }
          }

          const mentorPayload: MentorProfileCreatePayload = {
            full_name: userData.name || registeredUser.full_name || '',
            job_title: userData.jobTitle || '',
            company: userData.company || '',
            linkedin_or_website: userData.linkedinUrl || '',
            contact_email: userData.email,
            phone: userData.phone || undefined,
            expertise_fields: userData.expertise || [],
            experience_overview: userData.bio || '',
            industries_of_interest: userData.industries || [],
            engagement_type: engagementType,
            paid_rate_type: userData.hourlyRate ? 'HOURLY' : undefined,
            paid_rate_amount: userData.hourlyRate ? userData.hourlyRate.toString() : undefined,
            availability_types: userData.availabilityType || [],
            preferred_engagement: preferredEngagement,
            visible_to_ventures: userData.isVisible !== false, // Default to true
          };
          
          await mentorService.createProfile(mentorPayload);
          profileCreated = true;
        }
        // Note: Ventures don't create products during registration
        // They only create account, then create products from dashboard after email verification
      } catch (error: any) {
        // Profile creation failed - log but don't block registration
        // User can create profile manually after email verification
        console.warn('Profile creation failed during registration:', error);
        profileError = error;
        profileCreated = false;
      }

      // Fetch current user to get full user data (including email verification status)
      let currentUserData = registeredUser;
      try {
        currentUserData = await authService.getCurrentUser();
      } catch (error) {
        // If getCurrentUser fails, use registeredUser data
        console.warn('Failed to fetch current user after registration:', error);
      }

      // Set user state
      setUser({
        id: currentUserData.id,
        email: currentUserData.email,
        role: registrationRole!,
        profile: {
          ...userData,
          approvalStatus: 'pending' as const,
          profileCreated, // Track if profile was created
          profileError: profileError?.message, // Store error message if any
        }
      } as User);
      
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<User['profile']>) => {
    if (!user) return;
    
    try {
      // TODO: Call appropriate profile update API based on user role
      // For now, update local state
      const updatedUser = {
        ...user,
        profile: {
          ...user.profile,
          ...updates
        }
      };
      
      setUser(updatedUser);
      console.log('Profile updated successfully:', updatedUser);
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const setView = (view: 'landing' | 'register' | 'dashboard' | 'login') => {
    setCurrentView(view);
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      user,
      currentView,
      registrationRole,
      isLoading,
      login,
      logout,
      startRegistration,
      completeRegistration,
      updateProfile,
      setView
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}