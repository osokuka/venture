import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { authService, type UserResponse } from '../services/authService';
import { type Venture, type Investor, type Mentor } from './MockData';

export type UserRole = 'venture' | 'investor' | 'mentor' | 'admin';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type User = Venture | Investor | Mentor;

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

      // TODO: Create profile based on role
      // For now, set user and show pending status
      setUser({
        id: registeredUser.id,
        email: registeredUser.email,
        role: registrationRole!,
        profile: {
          ...userData,
          approvalStatus: 'pending' as const
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