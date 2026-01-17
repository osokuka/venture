import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Progress } from "./ui/progress";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import { toast } from 'sonner';
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Target, 
  DollarSign, 
  Building, 
  Eye,
  Calendar,
  Star,
  ArrowUpRight,
  PlusCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Bell,
  Search,
  Video,
  Phone,
  Mail,
  Filter,
  Send,
  Calendar as CalendarIcon,
  MapPin,
  ExternalLink,
  Check,
  X
} from "lucide-react";
import { type FrontendUser } from '../types';
import { ventureService } from '../services/ventureService';
import { messagingService } from '../services/messagingService';
import { type VentureProduct } from '../types';
import { EditProfile } from './EditProfile';
import { Settings } from './Settings';
import { UserProfile } from './UserProfile';
import { SchedulingModal } from './SchedulingModal';

interface MentorDashboardProps {
  user: FrontendUser;
  activeView?: string;
  onViewChange?: (view: string) => void;
  onProfileUpdate?: (updatedUser: FrontendUser) => void;
  onRefreshUnreadCount?: () => void; // Callback to refresh global unread count
}

export function MentorDashboard({ user, activeView = 'overview', onViewChange, onProfileUpdate, onRefreshUnreadCount }: MentorDashboardProps) {
  const [ventures, setVentures] = useState<VentureProduct[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingVentures, setIsLoadingVentures] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('all');

  // Fetch unread message count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const count = await messagingService.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch ventures when discover view is active
  useEffect(() => {
    if (activeView === 'discover') {
      fetchVentures();
    }
  }, [activeView]);

  const fetchVentures = async () => {
    setIsLoadingVentures(true);
    try {
      const data = await ventureService.getPublicVentures({
        search: searchTerm || undefined,
        sector: filterSector !== 'all' ? filterSector : undefined,
      });
      setVentures(data);
    } catch (error) {
      console.error('Failed to fetch ventures:', error);
    } finally {
      setIsLoadingVentures(false);
    }
  };
  const [filterStage, setFilterStage] = useState('all');
  const [schedulingModal, setSchedulingModal] = useState<{
    isOpen: boolean;
    mentee: any;
  }>({
    isOpen: false,
    mentee: null
  });

  // Handle profile and settings views
  if (activeView === 'edit-profile') {
    return <EditProfile user={user} onProfileUpdate={onProfileUpdate} />;
  }

  if (activeView === 'settings') {
    return <Settings user={user} />;
  }

  if (activeView === 'profile') {
    return <UserProfile user={user} onEdit={() => onViewChange?.('edit-profile')} isOwnProfile={true} />;
  }

  // TODO: VL-811 - Replace hardcoded stats with API calls
  const stats = {
    activeMentees: 0, // TODO: VL-811 - Get from GET /api/mentors/mentees
    totalSessions: 0, // TODO: VL-811 - Get from GET /api/mentors/sessions
    rating: 0, // TODO: VL-811 - Get from mentor profile API
    totalMessages: unreadCount,
    monthlyHours: 12, // TODO: VL-811 - Get from GET /api/mentors/sessions (monthly hours)
  };

  // TODO: VL-811 - Replace hardcoded recentActivity with API call to GET /api/activity/feed
  const recentActivity = [
    {
      id: 1,
      type: 'session',
      title: 'Session completed with TechFlow AI',
      description: 'Discussed go-to-market strategy and sales processes',
      time: '2 hours ago',
      icon: Video,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      id: 2,
      type: 'request',
      title: 'New mentoring request from GreenSpace',
      description: 'Seeking guidance on scaling operations',
      time: '4 hours ago',
      icon: Bell,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      id: 3,
      type: 'message',
      title: 'Message from Sarah Chen',
      description: 'Follow-up questions about fundraising strategy',
      time: '1 day ago',
      icon: MessageSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      id: 4,
      type: 'review',
      title: 'New 5-star review from HealthBridge',
      description: '"Exceptional guidance on product development"',
      time: '2 days ago',
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    }
  ];

  // TODO: VL-811 - Replace empty array with API call to GET /api/mentors/mentees
  const activeMentees: any[] = [];
  
  // TODO: VL-811 - Remove mockActiveMentees when API is implemented
  const mockActiveMentees = [
    {
      id: 'v1',
      name: 'Sarah Chen',
      company: 'TechFlow AI',
      sector: 'AI/ML',
      stage: 'Series A',
      nextSession: 'Thursday, 2:00 PM',
      progress: 75,
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b60f163b?w=60&h=60&fit=crop&crop=face',
      startDate: '2024-10-15',
      totalSessions: 12,
      expertise: 'Product Development',
      goals: ['Go-to-market strategy', 'Sales team building', 'Product positioning']
    },
    {
      id: 'v2',
      name: 'Marcus Rodriguez',
      company: 'GreenSpace',
      sector: 'CleanTech',
      stage: 'Seed',
      nextSession: 'Friday, 10:00 AM',
      progress: 60,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face',
      startDate: '2024-11-01',
      totalSessions: 8,
      expertise: 'Operations',
      goals: ['Scaling operations', 'Fundraising strategy', 'Team expansion']
    },
    {
      id: 'v3',
      name: 'Dr. Lisa Park',
      company: 'HealthBridge',
      sector: 'HealthTech',
      stage: 'Series A',
      nextSession: 'Next Tuesday, 3:00 PM',
      progress: 85,
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=60&h=60&fit=crop&crop=face',
      startDate: '2024-09-20',
      totalSessions: 18,
      expertise: 'Regulatory & Compliance',
      goals: ['Regulatory compliance', 'Clinical trials', 'International expansion']
    }
  ];

  const upcomingSessions = [
    {
      id: 1,
      mentee: 'Sarah Chen',
      company: 'TechFlow AI',
      time: 'Today, 2:00 PM',
      duration: '60 min',
      type: 'video',
      topic: 'Go-to-Market Strategy',
      status: 'confirmed'
    },
    {
      id: 2,
      mentee: 'Marcus Rodriguez',
      company: 'GreenSpace',
      time: 'Tomorrow, 10:00 AM',
      duration: '45 min',
      type: 'phone',
      topic: 'Scaling Operations',
      status: 'pending'
    },
    {
      id: 3,
      mentee: 'Dr. Lisa Park',
      company: 'HealthBridge',
      time: 'Friday, 3:00 PM',
      duration: '60 min',
      type: 'video',
      topic: 'Fundraising Strategy',
      status: 'confirmed'
    }
  ];

  const pendingRequests = [
    {
      id: 1,
      founder: 'David Chen',
      company: 'FinTech Solutions',
      sector: 'FinTech',
      stage: 'Seed',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face',
      requestedTopic: 'Sales Strategy & Business Development',
      message: 'Looking for guidance on building our sales team and go-to-market strategy for SMB customers. We have solid product-market fit but need help scaling our sales processes.',
      submittedAt: '2 hours ago',
      fundingAmount: '$3M',
      teamSize: '6-10',
      location: 'New York, NY'
    },
    {
      id: 2,
      founder: 'Emma Wilson',
      company: 'EduTech Innovations',
      sector: 'EdTech',
      stage: 'Pre-Seed',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face',
      requestedTopic: 'Product Development & User Research',
      message: 'Need help validating our product-market fit and improving our user research processes. We have initial traction but want to ensure we\'re building the right features.',
      submittedAt: '1 day ago',
      fundingAmount: '$500K',
      teamSize: '2-5',
      location: 'Austin, TX'
    },
    {
      id: 3,
      founder: 'Michael Torres',
      company: 'LogisticsPro',
      sector: 'Enterprise',
      stage: 'Seed',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face',
      requestedTopic: 'Operations & Financial Planning',
      message: 'Seeking mentorship on operational efficiency and financial planning as we scale our logistics platform. Need guidance on unit economics and pricing strategy.',
      submittedAt: '3 days ago',
      fundingAmount: '$2M',
      teamSize: '11-25',
      location: 'Chicago, IL'
    }
  ];

  const handleAcceptRequest = (requestId: number) => {
    toast.success("Mentoring request accepted! You can now schedule your first session.");
  };

  const handleDeclineRequest = (requestId: number) => {
    toast.success("Request declined politely with feedback sent to the founder.");
  };

  const handleScheduleSession = (menteeId: string) => {
    const mentee = activeMentees.find(m => m.id === menteeId);
    if (mentee) {
      setSchedulingModal({
        isOpen: true,
        mentee: mentee
      });
    }
  };

  const handleSendMessage = (menteeId: string) => {
    toast.success("Message sent successfully.");
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="hover:shadow-medium transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active Mentees</p>
                <p className="text-2xl font-bold">{stats.activeMentees}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-medium transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Video className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">{stats.totalSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-medium transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Rating</p>
                <p className="text-2xl font-bold">{stats.rating}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-medium transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Messages</p>
                <p className="text-2xl font-bold">{stats.totalMessages}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-medium transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Monthly Hours</p>
                <p className="text-2xl font-bold">{stats.monthlyHours}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Upcoming Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest mentoring sessions and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`p-2 rounded-lg ${activity.bgColor}`}>
                    <activity.icon className={`w-4 h-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Upcoming Sessions</span>
            </CardTitle>
            <CardDescription>
              Scheduled mentoring sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                      {session.type === 'video' ? (
                        <Video className="w-5 h-5 text-white" />
                      ) : (
                        <Phone className="w-5 h-5 text-white" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{session.mentee}</p>
                    <p className="text-sm text-muted-foreground">{session.company}</p>
                    <p className="text-xs text-muted-foreground">{session.topic} • {session.duration}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{session.time}</p>
                    <Badge 
                      variant={session.status === 'confirmed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {session.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Mentees and Pending Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Active Mentees</span>
            </CardTitle>
            <CardDescription>
              Your current mentoring relationships
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeMentees.map((mentee) => (
                <div key={mentee.id} className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={mentee.avatar} />
                    <AvatarFallback>{mentee.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{mentee.name}</p>
                    <p className="text-sm text-muted-foreground">{mentee.company} • {mentee.sector}</p>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span>{mentee.progress}%</span>
                      </div>
                      <Progress value={mentee.progress} className="h-1.5" />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{mentee.nextSession}</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {mentee.stage}
                    </Badge>
                  </div>
                </div>
              ))}
              <button 
                className="btn-chrome-secondary w-full mt-4"
                onClick={() => onViewChange?.('mentees')}
              >
                View All Mentees
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Recent Requests</span>
            </CardTitle>
            <CardDescription>
              Latest mentoring requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRequests.slice(0, 2).map((request) => (
                <div key={request.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={request.avatar} />
                        <AvatarFallback>{request.founder[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{request.founder}</p>
                        <p className="text-sm text-muted-foreground">{request.company}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {request.stage}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">{request.requestedTopic}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{request.submittedAt}</p>
                    <div className="flex space-x-2">
                      <button className="btn-chrome-secondary text-xs px-3 py-1">
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button 
                className="btn-chrome-secondary w-full mt-4"
                onClick={() => onViewChange?.('requests')}
              >
                View All Requests
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduling Modal */}
      <SchedulingModal
        isOpen={schedulingModal.isOpen}
        onClose={() => setSchedulingModal({ isOpen: false, mentee: null })}
        mentee={schedulingModal.mentee}
        mentor={{
          name: user.full_name,
          avatar: undefined
        }}
      />
    </div>
  );

  const renderRequests = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mentoring Requests</h2>
          <p className="text-muted-foreground">Review and respond to mentoring requests from startups</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          {pendingRequests.length} Pending
        </Badge>
      </div>

      <div className="space-y-6">
        {pendingRequests.map((request) => (
          <Card key={request.id} className="hover:shadow-medium transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={request.avatar} />
                      <AvatarFallback>{request.founder[0]}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">{request.founder}</h3>
                      <p className="text-muted-foreground">{request.company}</p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Building className="w-4 h-4" />
                          <span>{request.sector}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Target className="w-4 h-4" />
                          <span>{request.stage}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{request.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{request.submittedAt}</p>
                    <Badge variant="outline" className="mt-2">
                      {request.requestedTopic}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Company Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Funding Goal</p>
                    <p className="font-semibold">{request.fundingAmount}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Team Size</p>
                    <p className="font-semibold">{request.teamSize}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Stage</p>
                    <p className="font-semibold">{request.stage}</p>
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <h4 className="font-medium">Message from {request.founder}:</h4>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm leading-relaxed">"{request.message}"</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex space-x-3">
                    <button className="btn-chrome-secondary text-sm px-4 py-2">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Send Message
                    </button>
                    <button className="btn-chrome-secondary text-sm px-4 py-2">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Profile
                    </button>
                  </div>
                  <div className="flex space-x-3">
                    <button 
                      className="btn-chrome text-sm px-4 py-2 text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => handleDeclineRequest(request.id)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Decline
                    </button>
                    <button 
                      className="btn-chrome-primary text-sm px-4 py-2"
                      onClick={() => handleAcceptRequest(request.id)}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Accept Request
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderMentees = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Mentees</h2>
          <p className="text-muted-foreground">Manage your active mentoring relationships</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          {activeMentees.length} Active
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeMentees.map((mentee) => (
          <Card key={mentee.id} className="hover:shadow-medium transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start space-x-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={mentee.avatar} />
                    <AvatarFallback>{mentee.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <h3 className="font-semibold text-lg">{mentee.name}</h3>
                    <p className="text-muted-foreground">{mentee.company}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Building className="w-4 h-4" />
                        <span>{mentee.sector}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Target className="w-4 h-4" />
                        <span>{mentee.stage}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {mentee.stage}
                  </Badge>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Sessions</p>
                    <p className="font-semibold">{mentee.totalSessions}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Since</p>
                    <p className="font-semibold">{new Date(mentee.startDate).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Mentoring Progress</span>
                    <span className="font-medium">{mentee.progress}%</span>
                  </div>
                  <Progress value={mentee.progress} className="h-2" />
                </div>

                {/* Goals */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Current Goals</h4>
                  <div className="flex flex-wrap gap-2">
                    {mentee.goals.map((goal, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Next Session */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Next Session</p>
                      <p className="text-sm text-blue-700">{mentee.nextSession}</p>
                    </div>
                    <CalendarIcon className="w-5 h-5 text-blue-600" />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button 
                    className="btn-chrome-secondary flex-1 text-sm py-2"
                    onClick={() => handleSendMessage(mentee.id)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
                  </button>
                  <button 
                    className="btn-chrome-primary flex-1 text-sm py-2"
                    onClick={() => handleScheduleSession(mentee.id)}
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Schedule
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Scheduling Modal */}
      <SchedulingModal
        isOpen={schedulingModal.isOpen}
        onClose={() => setSchedulingModal({ isOpen: false, mentee: null })}
        mentee={schedulingModal.mentee}
        mentor={{
          name: user.full_name,
          avatar: undefined
        }}
      />
    </div>
  );

  const renderDiscover = () => {
    const filteredVentures = ventures.filter(venture => {
      const matchesSearch = searchTerm === '' || 
        venture.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venture.short_description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSector = filterSector === 'all' || venture.industry_sector === filterSector;
      // Note: stage filtering would need to be implemented based on actual data structure
      const matchesStage = filterStage === 'all' || true; // TODO: Implement stage filtering
      
      return matchesSearch && matchesSector && matchesStage;
    });

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Discover Startups</h2>
          <p className="text-muted-foreground">Find startups that could benefit from your expertise</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search startups..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={filterSector} onValueChange={setFilterSector}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Sectors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sectors</SelectItem>
                  <SelectItem value="AI/ML">AI/ML</SelectItem>
                  <SelectItem value="FinTech">FinTech</SelectItem>
                  <SelectItem value="HealthTech">HealthTech</SelectItem>
                  <SelectItem value="CleanTech">CleanTech</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStage} onValueChange={setFilterStage}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Stages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="Pre-Seed">Pre-Seed</SelectItem>
                  <SelectItem value="Seed">Seed</SelectItem>
                  <SelectItem value="Series A">Series A</SelectItem>
                  <SelectItem value="Series B">Series B</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredVentures.map((venture) => (
            <Card key={venture.id} className="hover:shadow-medium transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start space-x-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback>{venture.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold text-lg">{venture.name}</h3>
                      <p className="text-muted-foreground">{venture.short_description}</p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Building className="w-4 h-4" />
                          <span>{venture.industry_sector}</span>
                        </div>
                        {venture.address && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{venture.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline">
                      {venture.status}
                    </Badge>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4">
                    {venture.year_founded && (
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Founded</p>
                        <p className="font-semibold">{venture.year_founded}</p>
                      </div>
                    )}
                    {venture.employees_count && (
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Team Size</p>
                        <p className="font-semibold">{venture.employees_count}</p>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                    <p className="text-sm">{venture.short_description}</p>
                  </div>

                  {/* Match Score */}
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-900">Expertise Match</p>
                        <p className="text-sm text-green-700">Strong match for your skills</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        92% Match
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button className="btn-chrome-secondary flex-1 text-sm py-2">
                      <Eye className="w-4 h-4 mr-2" />
                      View Profile
                    </button>
                    <button className="btn-chrome-primary flex-1 text-sm py-2">
                      <Send className="w-4 h-4 mr-2" />
                      Offer Mentoring
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredVentures.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No startups found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria or filters.</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderMessages = () => {
    // TODO: Fetch conversations from messagingService when available
    const conversations: any[] = [];
    
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Messages</h2>
          <p className="text-muted-foreground">Your conversations with mentees and other users</p>
        </div>

        {conversations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
              <p className="text-muted-foreground mb-4">Start a conversation with a venture to begin mentoring.</p>
              <Button onClick={() => onViewChange?.('discover')}>
                Discover Startups
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversation List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Conversations</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-0">
                  {conversations.map((conversation) => (
                    <div key={conversation.id} className="flex items-center space-x-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer border-b last:border-b-0">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>{(conversation.name && conversation.name[0]) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{conversation.name || 'User'}</p>
                        <p className="text-sm text-muted-foreground truncate">{conversation.company || ''}</p>
                        <p className="text-xs text-muted-foreground">Last message {conversation.lastMessageTime || 'recently'}</p>
                      </div>
                      {conversation.unread && (
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Message View */}
            <Card className="lg:col-span-2">
              <CardContent className="p-12 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">Choose a conversation from the list to view messages.</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  };

  // Render different views based on activeView
  switch (activeView) {
    case 'requests':
      return renderRequests();
      
    case 'mentees':
      return renderMentees();
      
    case 'discover':
      return renderDiscover();
      
    case 'messages':
      return renderMessages();
      
    default:
      return renderOverview();
  }
}