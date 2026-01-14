import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { 
  Target,
  Home,
  Search,
  Building,
  MessageSquare,
  Briefcase,
  Users,
  Settings,
  LogOut,
  Bell,
  Edit,
  User,
  TrendingUp,
  Menu,
  X
} from "lucide-react";
import { VentureUPLinkIcon } from "./VentureUPLinkIcon";
import { 
  type User,
  type Investor,
  type Mentor,
  type Venture,
  getUnreadMessagesForUser 
} from './MockData';
import { useAuth } from './AuthContext';

interface ModernDashboardLayoutProps {
  children: React.ReactElement;
  user: User;
}

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
}

export function ModernDashboardLayout({ children, user }: ModernDashboardLayoutProps) {
  const { logout } = useAuth();
  const [activeItem, setActiveItem] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const unreadMessages = getUnreadMessagesForUser(user.id);

  const getUserDisplayName = () => {
    switch (user.role) {
      case 'venture':
        return (user as Venture).profile?.companyName || user.email;
      case 'investor':
        return (user as Investor).profile?.name || user.email;
      case 'mentor':
        return (user as Mentor).profile?.name || user.email;
      case 'admin':
        // For admin, try to get full_name from user object, fallback to email
        return (user as any).full_name || (user as any).email || 'Admin';
      default:
        return user.email || 'User';
    }
  };

  const getUserAvatar = () => {
    if (user.role === 'venture') {
      return (user as Venture).profile?.logo || undefined;
    }
    if (user.role === 'admin') {
      // Admin users don't have profile pictures, return undefined to show initials
      return undefined;
    }
    return (user as Investor | Mentor).profile?.avatar || undefined;
  };

  const getUserSubtitle = () => {
    switch (user.role) {
      case 'venture':
        return (user as Venture).profile?.shortDescription || 'Venture';
      case 'investor':
        return (user as Investor).profile?.organizationName || 'Investor';
      case 'mentor':
        const mentor = user as Mentor;
        if (mentor.profile?.jobTitle && mentor.profile?.company) {
          return `${mentor.profile.jobTitle} at ${mentor.profile.company}`;
        }
        return 'Mentor';
      case 'admin':
        return 'Administrator';
      default:
        return '';
    }
  };

  const getNavItems = (): NavItem[] => {
    const baseItems = [
      { id: 'overview', icon: Home, label: 'Dashboard' },
    ];

    switch (user.role) {
      case 'venture':
        return [
          ...baseItems,
          { id: 'investors', icon: TrendingUp, label: 'Find Investors' },
          { id: 'mentors', icon: Users, label: 'Find Mentors' },
          { id: 'ventures', icon: Building, label: 'Network' },
          { id: 'messages', icon: MessageSquare, label: 'Messages', badge: unreadMessages.length > 0 ? unreadMessages.length : undefined }
        ];
      case 'investor':
        return [
          ...baseItems,
          { id: 'discover', icon: Search, label: 'Discover Startups' },
          { id: 'portfolio', icon: Briefcase, label: 'Portfolio' },
          { id: 'messages', icon: MessageSquare, label: 'Messages', badge: unreadMessages.length > 0 ? unreadMessages.length : undefined }
        ];
      case 'mentor':
        return [
          ...baseItems,
          { id: 'requests', icon: Bell, label: 'Requests' },
          { id: 'mentees', icon: Users, label: 'My Mentees' },
          { id: 'discover', icon: Search, label: 'Discover Startups' },
          { id: 'messages', icon: MessageSquare, label: 'Messages', badge: unreadMessages.length > 0 ? unreadMessages.length : undefined }
        ];
      case 'admin':
        // Admin users don't need navigation items as they use tabs in AdminDashboard
        return baseItems;
      default:
        return baseItems;
    }
  };

  const getPageTitle = () => {
    const item = getNavItems().find(item => item.id === activeItem);
    if (item) return item.label;
    
    // Handle profile and settings pages
    switch (activeItem) {
      case 'profile':
        return 'View Profile';
      case 'edit-profile':
        return 'Edit Profile';
      case 'settings':
        return 'Settings';
      default:
        return 'Dashboard';
    }
  };

  const handleProfileView = () => {
    setActiveItem('profile');
  };

  const handleEditProfile = () => {
    setActiveItem('edit-profile');
  };

  const handleSettings = () => {
    setActiveItem('settings');
  };

  // Clone the children element and pass the activeView prop
  const childrenWithProps = React.cloneElement(children, { 
    activeView: activeItem,
    onViewChange: setActiveItem,
    user: user,
    onProfileUpdate: (updatedUser: User) => {
      // In a real app, this would update the user context
      console.log('Profile updated:', updatedUser);
    }
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-border sticky top-0 z-50 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                  <VentureUPLinkIcon size={20} className="text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-foreground">VentureUP Link</h1>
                  <p className="text-xs text-muted-foreground capitalize">{user.role} Portal</p>
                </div>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-1">
                {getNavItems().map((item) => (
                  <Button
                    key={item.id}
                    variant={activeItem === item.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveItem(item.id)}
                    className="relative h-9 px-3"
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <Badge className="ml-2 h-5 min-w-5 text-xs bg-red-500 text-white">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-4 h-4" />
                {unreadMessages.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                )}
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 px-2 h-9">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={getUserAvatar()} />
                      <AvatarFallback className="text-xs">{getUserDisplayName()[0]}</AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium">{getUserDisplayName()}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-32">{getUserSubtitle()}</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div>
                      <p className="font-medium">{getUserDisplayName()}</p>
                      <p className="text-sm text-muted-foreground">{getUserSubtitle()}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleProfileView}>
                    <User className="w-4 h-4 mr-2" />
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleEditProfile}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSettings}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border py-4 space-y-2">
              {getNavItems().map((item) => (
                <Button
                  key={item.id}
                  variant={activeItem === item.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setActiveItem(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-start h-9"
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <Badge className="ml-auto h-5 min-w-5 text-xs bg-red-500 text-white">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              ))}
              
              <div className="border-t border-border pt-2 mt-2 space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    handleProfileView();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-start h-9"
                >
                  <User className="w-4 h-4 mr-2" />
                  <span>View Profile</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    handleEditProfile();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-start h-9"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  <span>Edit Profile</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    handleSettings();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-start h-9"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  <span>Settings</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Page Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{getPageTitle()}</h1>
              <p className="text-muted-foreground mt-1">
                Welcome back, {getUserDisplayName()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {childrenWithProps}
      </main>
    </div>
  );
}