import React, { useState, useEffect } from 'react';
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
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "./ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
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
  Eye,
  TrendingUp,
  Clock,
  CheckCircle,
  Star,
  Award
} from "lucide-react";
import { type FrontendUser } from '../types';
import { messagingService } from '../services/messagingService';
import { useAuth } from './AuthContext';

interface DashboardLayoutProps {
  children: React.ReactElement;
  user: FrontendUser;
}

interface SidebarItem {
  id: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const { logout } = useAuth();
  const [activeItem, setActiveItem] = useState('overview');
  const [unreadCount, setUnreadCount] = React.useState(0);
  
  React.useEffect(() => {
    let retryDelay = 30000; // Start with 30 seconds
    let isRateLimited = false;
    
    const fetchUnreadCount = async () => {
      // Skip if we're currently rate limited
      if (isRateLimited) {
        return;
      }
      
      try {
        const count = await messagingService.getUnreadCount();
        setUnreadCount(count);
        // Reset retry delay on success
        retryDelay = 30000;
        isRateLimited = false;
      } catch (error: any) {
        // Check if it's a rate limit error (429)
        if (error?.response?.status === 429) {
          console.warn('Rate limited on unread count. Pausing polling for 5 minutes.');
          isRateLimited = true;
          // Stop polling for 5 minutes when rate limited
          setTimeout(() => {
            isRateLimited = false;
            retryDelay = 30000;
          }, 5 * 60 * 1000); // 5 minutes
          return;
        }
        // For other errors, just log but continue polling
        console.error('Failed to fetch unread count:', error);
      }
    };
    
    fetchUnreadCount();
    // Refresh every 30 seconds (or longer if rate limited)
    const interval = setInterval(fetchUnreadCount, retryDelay);
    return () => clearInterval(interval);
  }, []);

  const getUserDisplayName = () => {
    return user.full_name || user.email || 'User';
  };

  const getUserAvatar = () => {
    if (user.role === 'venture') {
      return (user as Venture).profile.logo || undefined;
    }
    return (user as Investor | Mentor).profile.avatar || undefined;
  };

  const getUserSubtitle = () => {
    switch (user.role) {
      case 'venture':
        return (user as Venture).profile.shortDescription;
      case 'investor':
        return (user as Investor).profile.organizationName || 'Angel Investor';
      case 'mentor':
        const mentor = user as Mentor;
        return `${mentor.profile.jobTitle} at ${mentor.profile.company}`;
      default:
        return '';
    }
  };

  const getSidebarItems = (): SidebarItem[] => {
    const baseItems = [
      { id: 'overview', icon: Home, label: 'Overview' },
      { id: 'messages', icon: MessageSquare, label: 'Messages', badge: unreadCount > 0 ? unreadCount : undefined }
    ];

    switch (user.role) {
      case 'venture':
        return [
          ...baseItems.slice(0, 1), // Overview
          { id: 'products', icon: Building, label: 'My Products' },
          { id: 'investors', icon: TrendingUp, label: 'Browse Investors' },
          { id: 'mentors', icon: Users, label: 'Browse Mentors' },
          ...baseItems.slice(1) // Messages
        ];
      case 'investor':
        return [
          ...baseItems.slice(0, 1), // Overview
          { id: 'discover', icon: Search, label: 'Browse Ventures' },
          { id: 'portfolio', icon: Briefcase, label: 'Portfolio' },
          ...baseItems.slice(1) // Messages
        ];
      case 'mentor':
        return [
          ...baseItems.slice(0, 1), // Overview
          { id: 'requests', icon: Bell, label: 'Requests' },
          { id: 'mentees', icon: Users, label: 'My Mentees' },
          { id: 'discover', icon: Search, label: 'Discover Startups' },
          ...baseItems.slice(1) // Messages
        ];
      default:
        return baseItems;
    }
  };

  const getRecentActivity = () => {
    // Mock recent activity based on user role
    switch (user.role) {
      case 'investor':
        return [
          {
            type: 'view',
            icon: Eye,
            title: 'Profile viewed',
            description: 'TechFlow AI viewed your profile',
            time: '2 hours ago',
            color: 'text-blue-600'
          },
          {
            type: 'message',
            icon: MessageSquare,
            title: 'New message',
            description: 'Sarah Chen sent you a message',
            time: '4 hours ago',
            color: 'text-green-600'
          },
          {
            type: 'save',
            icon: Star,
            title: 'Startup saved',
            description: 'GreenSpace added to your watchlist',
            time: '1 day ago',
            color: 'text-yellow-600'
          },
          {
            type: 'deal',
            icon: CheckCircle,
            title: 'Deal milestone',
            description: 'TechFlow AI - Due diligence completed',
            time: '2 days ago',
            color: 'text-purple-600'
          }
        ];
      case 'mentor':
        return [
          {
            type: 'session',
            icon: CheckCircle,
            title: 'Session completed',
            description: 'Mentoring session with HealthBridge',
            time: '1 hour ago',
            color: 'text-green-600'
          },
          {
            type: 'request',
            icon: Bell,
            title: 'New request',
            description: 'TechFlow AI requested mentoring',
            time: '3 hours ago',
            color: 'text-blue-600'
          },
          {
            type: 'rating',
            icon: Award,
            title: '5-star rating',
            description: 'Great feedback from GreenSpace',
            time: '1 day ago',
            color: 'text-yellow-600'
          }
        ];
      case 'venture':
        return [
          {
            type: 'view',
            icon: Eye,
            title: 'Profile viewed',
            description: 'Sarah Chen (TechVentures) viewed your profile',
            time: '1 hour ago',
            color: 'text-blue-600'
          },
          {
            type: 'message',
            icon: MessageSquare,
            title: 'Investor interest',
            description: 'New message from Marcus Rodriguez',
            time: '3 hours ago',
            color: 'text-green-600'
          },
          {
            type: 'bookmark',
            icon: Star,
            title: 'Pitch bookmarked',
            description: 'Your pitch deck was saved by an investor',
            time: '5 hours ago',
            color: 'text-yellow-600'
          }
        ];
      default:
        return [];
    }
  };

  const getPageTitle = () => {
    const item = getSidebarItems().find(item => item.id === activeItem);
    return item ? item.label : 'Dashboard';
  };

  // Clone the children element and pass the activeView prop
  const childrenWithProps = React.cloneElement(children, { 
    activeView: activeItem,
    onViewChange: setActiveItem
  });

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Left Sidebar */}
        <Sidebar variant="inset">
          <SidebarHeader>
            <div className="flex items-center space-x-2 px-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-lg">VentureUP Link</h2>
                <p className="text-xs text-muted-foreground capitalize">{user.role} Portal</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {getSidebarItems().map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveItem(item.id)}
                        isActive={activeItem === item.id}
                        className="w-full"
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                        {item.badge && (
                          <Badge className="ml-auto bg-primary text-primary-foreground">
                            {item.badge}
                          </Badge>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Account</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <div className="flex items-center space-x-3 px-2 py-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={getUserAvatar()} />
                <AvatarFallback>{getUserDisplayName()[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{getUserDisplayName()}</p>
                <p className="text-xs text-muted-foreground truncate">{getUserSubtitle()}</p>
              </div>
            </div>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset className="flex flex-col">
          {/* Top Navigation */}
          <header className="flex h-16 shrink-0 items-center justify-between border-b px-6">
            <div className="flex items-center space-x-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="h-4" />
              <h1 className="text-lg">{getPageTitle()}</h1>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 px-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={getUserAvatar()} />
                      <AvatarFallback>{getUserDisplayName()[0]}</AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block">{getUserDisplayName()}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div>
                      <p>{getUserDisplayName()}</p>
                      <p className="text-sm text-muted-foreground">{getUserSubtitle()}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="w-4 h-4 mr-2" />
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content Area */}
          <div className="flex flex-1 overflow-hidden">
            {/* Main Content */}
            <main className="flex-1 overflow-auto p-6">
              {childrenWithProps}
            </main>

            {/* Right Activity Panel */}
            <aside className="w-80 border-l bg-muted/10 p-6 overflow-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {getRecentActivity().map((activity, index) => (
                        <div key={index} className="flex items-start space-x-3 pb-3 border-b last:border-0">
                          <div className={`p-2 rounded-full bg-muted ${activity.color}`}>
                            <activity.icon className="w-3 h-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{activity.title}</p>
                            <p className="text-xs text-muted-foreground">{activity.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Quick Stats Card */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-sm">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {user.role === 'investor' && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Portfolio Companies</span>
                        <span>{(user as Investor).profile.portfolioCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Invested</span>
                        <span>{(user as Investor).profile.totalInvested}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Active Deals</span>
                        <span>3</span>
                      </div>
                    </>
                  )}
                  
                  {user.role === 'mentor' && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Active Mentees</span>
                        <span>{(user as Mentor).profile.activeMentees}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Sessions</span>
                        <span>{(user as Mentor).profile.totalSessions}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Rating</span>
                        <div className="flex items-center">
                          <Star className="w-3 h-3 text-yellow-500 fill-current mr-1" />
                          <span>{(user as Mentor).profile.rating}</span>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {user.role === 'venture' && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Funding Stage</span>
                        <span>{(user as Venture).profile.fundingNeeds}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Target Amount</span>
                        <span>{(user as Venture).profile.fundingAmount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Founded</span>
                        <span>{(user as Venture).profile.foundedYear}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </aside>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}