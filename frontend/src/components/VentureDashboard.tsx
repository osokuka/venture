import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Progress } from "./ui/progress";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import { toast } from "sonner@2.0.3";
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
  Upload,
  Download,
  FileText,
  ExternalLink,
  Check,
  X,
  MapPin,
  Briefcase,
  Award,
  TrendingDown,
  Globe
} from "lucide-react";
import { type User, type Venture, type Investor, type Mentor, mockVentures, mockInvestors, mockMentors, getUnreadMessagesForUser } from './MockData';
import { EditProfile } from './EditProfile';
import { Settings } from './Settings';
import { UserProfile } from './UserProfile';
import { ProductManagement } from './ProductManagement';
import { messagingService } from '../services/messagingService';
import { validateUuid, sanitizeInput } from '../utils/security';
import { SafeText } from './SafeText';

interface VentureDashboardProps {
  user: User;
  activeView?: string;
  onViewChange?: (view: string) => void;
  onProfileUpdate?: (updatedUser: User) => void;
}

export function VentureDashboard({ user, activeView = 'overview', onViewChange, onProfileUpdate }: VentureDashboardProps) {
  const venture = user as Venture;
  const unreadMessages = getUnreadMessagesForUser(user.id);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Security: Sanitize search term
  const handleSearchChange = (value: string) => {
    const sanitized = sanitizeInput(value, 100);
    setSearchTerm(sanitized);
  };
  const [filterSector, setFilterSector] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [filterCheckSize, setFilterCheckSize] = useState('all');

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

  // Mock data for the dashboard
  const stats = {
    fundingGoal: venture.profile.fundingAmount || '$2M',
    fundingRaised: '$450K',
    fundingProgress: 23,
    investors: 8,
    mentors: 3,
    pitchViews: 127,
    totalMessages: unreadMessages.length + 15,
    valuation: '$8M',
  };

  const recentActivity = [
    {
      id: 1,
      type: 'investor',
      title: 'New investor interest from TechVentures',
      description: 'John Smith viewed your pitch deck and expressed interest',
      time: '2 hours ago',
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      id: 2,
      type: 'meeting',
      title: 'Meeting scheduled with Sarah Johnson',
      description: 'Initial investment discussion at 3:00 PM tomorrow',
      time: '4 hours ago',
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      id: 3,
      type: 'mentor',
      title: 'New mentoring session with Emily Carter',
      description: 'Product development strategy discussion completed',
      time: '1 day ago',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      id: 4,
      type: 'pitch',
      title: 'Pitch deck updated',
      description: 'Financial projections section updated with Q4 data',
      time: '2 days ago',
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  const interestedInvestors = [
    {
      id: 'inv1',
      name: 'John Smith',
      firm: 'TechVentures Capital',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face',
      checkSize: '$250K - $1M',
      sectors: ['AI/ML', 'SaaS'],
      stage: 'Series A',
      status: 'interested',
      lastContact: '2 hours ago',
      pitchViewed: true,
      location: 'San Francisco, CA'
    },
    {
      id: 'inv2',
      name: 'Sarah Johnson',
      firm: 'Innovation Partners',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b60f163b?w=60&h=60&fit=crop&crop=face',
      checkSize: '$500K - $2M',
      sectors: ['FinTech', 'AI/ML'],
      stage: 'Seed',
      status: 'meeting_scheduled',
      lastContact: '1 day ago',
      pitchViewed: true,
      location: 'New York, NY'
    },
    {
      id: 'inv3',
      name: 'Michael Chen',
      firm: 'Future Fund',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face',
      checkSize: '$100K - $500K',
      sectors: ['AI/ML', 'Enterprise'],
      stage: 'Seed',
      status: 'pitch_requested',
      lastContact: '3 days ago',
      pitchViewed: false,
      location: 'Austin, TX'
    }
  ];

  const currentMentors = [
    {
      id: 'm1',
      name: 'Emily Carter',
      expertise: 'Product Development',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face',
      company: 'Former VP at TechCorp',
      rating: 4.9,
      sessions: 8,
      nextSession: 'Tomorrow, 2:00 PM',
      progress: 75
    },
    {
      id: 'm2',
      name: 'David Rodriguez',
      expertise: 'Sales & Marketing',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face',
      company: 'Former CMO at SaaS Inc',
      rating: 4.8,
      sessions: 12,
      nextSession: 'Friday, 10:00 AM',
      progress: 60
    }
  ];

  const fundraisingMetrics = [
    { label: 'Investors Contacted', value: 45, target: 100, color: 'blue' },
    { label: 'Pitch Decks Sent', value: 28, target: 50, color: 'green' },
    { label: 'Meetings Scheduled', value: 12, target: 20, color: 'orange' },
    { label: 'Term Sheets', value: 2, target: 5, color: 'purple' }
  ];

  const pitchDeckMetrics = {
    views: 127,
    downloads: 23,
    averageViewTime: '4m 32s',
    lastUpdated: '2 days ago',
    version: '3.2'
  };

  const upcomingMeetings = [
    {
      id: 1,
      investor: 'Sarah Johnson',
      firm: 'Innovation Partners',
      time: 'Tomorrow, 3:00 PM',
      duration: '45 min',
      type: 'video',
      topic: 'Initial Investment Discussion',
      status: 'confirmed'
    },
    {
      id: 2,
      mentor: 'Emily Carter',
      time: 'Friday, 2:00 PM',
      duration: '60 min',
      type: 'video',
      topic: 'Product Strategy Session',
      status: 'confirmed'
    },
    {
      id: 3,
      investor: 'Michael Chen',
      firm: 'Future Fund',
      time: 'Next Monday, 11:00 AM',
      duration: '30 min',
      type: 'phone',
      topic: 'Pitch Presentation',
      status: 'pending'
    }
  ];

  const handleContactInvestor = async (investorId: string) => {
    // Security: Validate UUID format
    if (!validateUuid(investorId)) {
      toast.error("Invalid investor ID");
      return;
    }
    
    try {
      // Create or get existing conversation with investor
      const conversation = await messagingService.createConversation(investorId);
      
      // For now, just show success - in a full implementation, 
      // we might open a messaging modal or navigate to the conversation
      toast.success("Conversation started with investor!");
      
      // Optionally, you could open a messaging interface here
      // onViewChange?.('messages');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to contact investor");
    }
  };

  const handleSharePitch = (investorId: string) => {
    toast.success("Pitch deck shared with investor!");
  };

  const handleScheduleMeeting = (investorId: string) => {
    toast.success("Meeting invitation sent!");
  };

  const handleConnectMentor = (mentorId: string) => {
    toast.success("Mentoring request sent successfully!");
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-medium transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Funding Progress</p>
                <p className="text-2xl font-bold">{stats.fundingRaised}</p>
                <p className="text-xs text-muted-foreground">of {stats.fundingGoal}</p>
              </div>
            </div>
            <div className="mt-4">
              <Progress value={stats.fundingProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{stats.fundingProgress}% complete</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-medium transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Interested Investors</p>
                <p className="text-2xl font-bold">{stats.investors}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-medium transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Mentors</p>
                <p className="text-2xl font-bold">{stats.mentors}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-medium transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Eye className="w-5 h-5 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pitch Views</p>
                <p className="text-2xl font-bold">{stats.pitchViews}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fundraising Progress and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fundraising Progress</CardTitle>
            <CardDescription>
              Track your funding milestones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fundraisingMetrics.map((metric, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{metric.label}</span>
                    <span className="text-muted-foreground">{metric.value}/{metric.target}</span>
                  </div>
                  <Progress 
                    value={(metric.value / metric.target) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates and interactions
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
      </div>

      {/* Interested Investors and Upcoming Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Interested Investors</span>
            </CardTitle>
            <CardDescription>
              Investors showing interest in your startup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {interestedInvestors.slice(0, 3).map((investor) => (
                <div key={investor.id} className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={investor.avatar} />
                    <AvatarFallback>{investor.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{investor.name}</p>
                    <p className="text-sm text-muted-foreground">{investor.firm}</p>
                    <p className="text-xs text-muted-foreground">{investor.checkSize}</p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={investor.status === 'interested' ? 'default' : 
                              investor.status === 'meeting_scheduled' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {investor.status.replace('_', ' ')}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{investor.lastContact}</p>
                  </div>
                </div>
              ))}
              <button 
                className="btn-chrome-secondary w-full mt-4"
                onClick={() => onViewChange?.('investors')}
              >
                View All Investors
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Upcoming Meetings</span>
            </CardTitle>
            <CardDescription>
              Scheduled investor and mentor meetings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingMeetings.map((meeting) => (
                <div key={meeting.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      {meeting.type === 'video' ? (
                        <Video className="w-5 h-5 text-white" />
                      ) : (
                        <Phone className="w-5 h-5 text-white" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {meeting.investor || meeting.mentor}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {meeting.firm || meeting.topic}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {meeting.topic} • {meeting.duration}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{meeting.time}</p>
                    <Badge 
                      variant={meeting.status === 'confirmed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {meeting.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pitch Deck Performance and Current Mentors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Pitch Deck Performance</span>
            </CardTitle>
            <CardDescription>
              Track how your pitch deck is performing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{pitchDeckMetrics.views}</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Downloads</p>
                <p className="text-2xl font-bold">{pitchDeckMetrics.downloads}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg. View Time</span>
                <span className="font-medium">{pitchDeckMetrics.averageViewTime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Version</span>
                <span className="font-medium">v{pitchDeckMetrics.version}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="font-medium">{pitchDeckMetrics.lastUpdated}</span>
              </div>
            </div>
            <button 
              className="btn-chrome-primary w-full mt-4"
              onClick={() => onViewChange?.('pitch')}
            >
              Manage Pitch Deck
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Current Mentors</span>
            </CardTitle>
            <CardDescription>
              Your active mentoring relationships
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentMentors.map((mentor) => (
                <div key={mentor.id} className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={mentor.avatar} />
                    <AvatarFallback>{mentor.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{mentor.name}</p>
                    <p className="text-sm text-muted-foreground">{mentor.expertise}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span className="text-xs text-muted-foreground">{mentor.rating}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{mentor.sessions} sessions</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{mentor.nextSession}</p>
                    <Progress value={mentor.progress} className="h-1.5 w-16 mt-1" />
                  </div>
                </div>
              ))}
              <button 
                className="btn-chrome-secondary w-full mt-4"
                onClick={() => onViewChange?.('mentors')}
              >
                Find More Mentors
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderInvestors = () => {
    // Ensure mockInvestors is available and handle the mapping safely
    const availableInvestors = mockInvestors || [];
    
    const filteredInvestors = availableInvestors.filter(investor => {
      const matchesSearch = searchTerm === '' || 
        investor.profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (investor.profile.organizationName && investor.profile.organizationName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesSector = filterSector === 'all' || 
        (investor.profile.industries && investor.profile.industries.includes(filterSector));
      
      const matchesStage = filterStage === 'all' || 
        (investor.profile.investmentStages && investor.profile.investmentStages.includes(filterStage));
      
      return matchesSearch && matchesSector && matchesStage;
    });

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Find Investors</h2>
          <p className="text-muted-foreground">Discover investors that match your startup profile</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search investors or firms..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  maxLength={100}
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
                  <SelectItem value="SaaS">SaaS</SelectItem>
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
          {filteredInvestors.map((investor) => (
            <Card key={investor.id} className="hover:shadow-medium transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start space-x-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={investor.profile.avatar} />
                      <AvatarFallback>{investor.profile.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold text-lg">{investor.profile.name}</h3>
                      <p className="text-muted-foreground">{investor.profile.organizationName || 'Independent Investor'}</p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{investor.profile.address || 'Location not specified'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Briefcase className="w-4 h-4" />
                          <span>{investor.profile.portfolioCount || 0} investments</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {investor.profile.investmentStages?.[0] || 'Various'}
                    </Badge>
                  </div>

                  {/* Investment Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Check Size</p>
                      <p className="font-semibold">{investor.profile.ticketSize || 'Not specified'}</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Portfolio</p>
                      <p className="font-semibold">{investor.profile.portfolioCount || 0}</p>
                    </div>
                  </div>

                  {/* Sectors */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Investment Focus</h4>
                    <div className="flex flex-wrap gap-2">
                      {(investor.profile.industries || []).map((sector, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {sector}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Match Score */}
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-900">Investment Match</p>
                        <p className="text-sm text-green-700">Great fit for your sector and stage</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        87% Match
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button 
                      className="btn-chrome-secondary flex-1 text-sm py-2"
                      onClick={() => handleContactInvestor(investor.id)}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contact
                    </button>
                    <button 
                      className="btn-chrome-primary flex-1 text-sm py-2"
                      onClick={() => handleSharePitch(investor.id)}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Share Pitch
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredInvestors.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No investors found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria or filters.</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderPitch = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pitch Deck</h2>
          <p className="text-muted-foreground">Manage and share your pitch deck with investors</p>
        </div>
        <button className="btn-chrome-primary">
          <Upload className="w-4 h-4 mr-2" />
          Upload New Version
        </button>
      </div>

      {/* Current Pitch Deck */}
      <Card>
        <CardHeader>
          <CardTitle>Current Pitch Deck</CardTitle>
          <CardDescription>Version {pitchDeckMetrics.version} • Last updated {pitchDeckMetrics.lastUpdated}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Eye className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{pitchDeckMetrics.views}</p>
              <p className="text-sm text-muted-foreground">Total Views</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Download className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{pitchDeckMetrics.downloads}</p>
              <p className="text-sm text-muted-foreground">Downloads</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{pitchDeckMetrics.averageViewTime}</p>
              <p className="text-sm text-muted-foreground">Avg. View Time</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Star className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">4.7</p>
              <p className="text-sm text-muted-foreground">Avg. Rating</p>
            </div>
          </div>

          <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">{venture.profile.companyName} - Pitch Deck v{pitchDeckMetrics.version}</h3>
            <p className="text-muted-foreground mb-4">15 slides • 12.3 MB • PDF</p>
            <div className="flex justify-center space-x-3">
              <button className="btn-chrome-secondary">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </button>
              <button className="btn-chrome-secondary">
                <Download className="w-4 h-4 mr-2" />
                Download
              </button>
              <button className="btn-chrome-primary">
                <Send className="w-4 h-4 mr-2" />
                Share with Investor
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pitch Deck Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Views</CardTitle>
            <CardDescription>Who viewed your pitch deck recently</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {interestedInvestors.filter(inv => inv.pitchViewed).map((investor) => (
                <div key={investor.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={investor.avatar} />
                    <AvatarFallback>{investor.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{investor.name}</p>
                    <p className="text-sm text-muted-foreground">{investor.firm}</p>
                    <p className="text-xs text-muted-foreground">Viewed {investor.lastContact}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="text-xs">
                      {investor.status.replace('_', ' ')}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">5m 32s</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Version History</CardTitle>
            <CardDescription>Track changes to your pitch deck</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Version 3.2 (Current)</p>
                  <p className="text-sm text-muted-foreground">Updated financial projections</p>
                  <p className="text-xs text-muted-foreground">2 days ago</p>
                </div>
                <Badge variant="default" className="text-xs">Current</Badge>
              </div>
              <div className="flex items-center space-x-4 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Version 3.1</p>
                  <p className="text-sm text-muted-foreground">Added customer testimonials</p>
                  <p className="text-xs text-muted-foreground">1 week ago</p>
                </div>
                <button className="btn-chrome-secondary text-xs px-3 py-1">
                  Restore
                </button>
              </div>
              <div className="flex items-center space-x-4 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Version 3.0</p>
                  <p className="text-sm text-muted-foreground">Major redesign with new branding</p>
                  <p className="text-xs text-muted-foreground">3 weeks ago</p>
                </div>
                <button className="btn-chrome-secondary text-xs px-3 py-1">
                  Restore
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderFundraising = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Fundraising</h2>
        <p className="text-muted-foreground">Track your fundraising progress and investor interactions</p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:shadow-medium transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Raised</p>
                <p className="text-2xl font-bold">{stats.fundingRaised}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-medium transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Goal</p>
                <p className="text-2xl font-bold">{stats.fundingGoal}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-medium transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Valuation</p>
                <p className="text-2xl font-bold">{stats.valuation}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-medium transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Investors</p>
                <p className="text-2xl font-bold">{stats.investors}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fundraising Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>Fundraising Pipeline</CardTitle>
          <CardDescription>Track your progress with different investors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fundraisingMetrics.map((metric, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{metric.label}</h4>
                  <span className="text-sm text-muted-foreground">
                    {metric.value}/{metric.target}
                  </span>
                </div>
                <Progress 
                  value={(metric.value / metric.target) * 100} 
                  className="h-3"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <span>{Math.round((metric.value / metric.target) * 100)}% Complete</span>
                  <span>{metric.target - metric.value} remaining</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Investor Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>Investor Pipeline</CardTitle>
          <CardDescription>Current status with interested investors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {interestedInvestors.map((investor) => (
              <div key={investor.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={investor.avatar} />
                  <AvatarFallback>{investor.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <h4 className="font-medium">{investor.name}</h4>
                  <p className="text-sm text-muted-foreground">{investor.firm}</p>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>{investor.checkSize}</span>
                    <span>•</span>
                    <span>{investor.location}</span>
                  </div>
                </div>
                <div className="text-center">
                  <Badge 
                    variant={investor.status === 'interested' ? 'default' : 
                            investor.status === 'meeting_scheduled' ? 'secondary' : 'outline'}
                    className="mb-2"
                  >
                    {investor.status.replace('_', ' ')}
                  </Badge>
                  <p className="text-xs text-muted-foreground">{investor.lastContact}</p>
                </div>
                <div className="flex space-x-2">
                  <button 
                    className="btn-chrome-secondary text-sm px-3 py-1"
                    onClick={() => handleContactInvestor(investor.id)}
                  >
                    Contact
                  </button>
                  <button 
                    className="btn-chrome-primary text-sm px-3 py-1"
                    onClick={() => handleScheduleMeeting(investor.id)}
                  >
                    Schedule
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fundraising Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Fundraising Timeline</CardTitle>
          <CardDescription>Key milestones and upcoming deadlines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <h4 className="font-medium text-green-900">Round Opened</h4>
                <p className="text-sm text-green-700">Started accepting investments</p>
                <p className="text-xs text-green-600">30 days ago</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <h4 className="font-medium text-blue-900">First Close Target</h4>
                <p className="text-sm text-blue-700">Aiming for $500K first close</p>
                <p className="text-xs text-blue-600">In 15 days</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-3 border rounded-lg">
              <div className="w-3 h-3 bg-gray-300 rounded-full mt-2"></div>
              <div className="flex-1">
                <h4 className="font-medium text-muted-foreground">Round Close</h4>
                <p className="text-sm text-muted-foreground">Target to close full round</p>
                <p className="text-xs text-muted-foreground">In 90 days</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMentors = () => {
    // Ensure mockMentors is available and handle the mapping safely
    const availableMentors = mockMentors || [];
    
    const filteredMentors = availableMentors.filter(mentor => {
      const matchesSearch = searchTerm === '' || 
        mentor.profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mentor.profile.expertise && mentor.profile.expertise.some(exp => exp.toLowerCase().includes(searchTerm.toLowerCase())));
      
      return matchesSearch;
    });

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Find Mentors</h2>
          <p className="text-muted-foreground">Connect with experienced mentors to guide your startup journey</p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search mentors by name or expertise..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Mentors */}
        <Card>
          <CardHeader>
            <CardTitle>Your Current Mentors</CardTitle>
            <CardDescription>Active mentoring relationships</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {currentMentors.map((mentor) => (
                <div key={mentor.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={mentor.avatar} />
                    <AvatarFallback>{mentor.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-medium">{mentor.name}</h4>
                    <p className="text-sm text-muted-foreground">{mentor.expertise}</p>
                    <p className="text-sm text-muted-foreground">{mentor.company}</p>
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm">{mentor.rating}</span>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">{mentor.sessions} sessions</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{mentor.nextSession}</p>
                    <div className="mt-2">
                      <Progress value={mentor.progress} className="h-1.5 w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Available Mentors */}
        <Card>
          <CardHeader>
            <CardTitle>Available Mentors</CardTitle>
            <CardDescription>Discover mentors that match your needs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredMentors.map((mentor) => (
                <Card key={mentor.id} className="hover:shadow-medium transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={mentor.profile.avatar} />
                          <AvatarFallback>{mentor.profile.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <h3 className="font-semibold text-lg">{mentor.profile.name}</h3>
                          <p className="text-muted-foreground">{mentor.profile.jobTitle}</p>
                          <p className="text-sm text-muted-foreground">{mentor.profile.company}</p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{mentor.profile.location || 'Remote'}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>{mentor.profile.activeMentees || 0} mentees</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="font-medium">{mentor.profile.rating}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{mentor.profile.totalSessions} sessions</p>
                        </div>
                      </div>

                      {/* Expertise */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Expertise</h4>
                        <div className="flex flex-wrap gap-2">
                          {(mentor.profile.expertise || []).map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Bio */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">About</h4>
                        <p className="text-sm leading-relaxed">{mentor.profile.bio}</p>
                      </div>

                      {/* Availability */}
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-900">Available for Mentoring</p>
                            <p className="text-sm text-green-700">
                              {mentor.profile.isProBono ? 'Pro Bono' : `${mentor.profile.hourlyRate || 'Rate available'}`}
                            </p>
                          </div>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <button className="btn-chrome-secondary flex-1 text-sm py-2">
                          <Eye className="w-4 h-4 mr-2" />
                          View Profile
                        </button>
                        <button 
                          className="btn-chrome-primary flex-1 text-sm py-2"
                          onClick={() => handleConnectMentor(mentor.id)}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Request Mentoring
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {filteredMentors.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No mentors found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderMessages = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Messages</h2>
        <p className="text-muted-foreground">Your conversations with investors and mentors</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Conversations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-0">
              {[...interestedInvestors.slice(0, 2), ...currentMentors].map((contact, index) => (
                <div key={index} className="flex items-center space-x-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer border-b last:border-b-0">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={contact.avatar} />
                    <AvatarFallback>{contact.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{contact.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {contact.firm || contact.company || contact.expertise}
                    </p>
                    <p className="text-xs text-muted-foreground">Last message 1h ago</p>
                  </div>
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Message View */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={interestedInvestors[0]?.avatar} />
                <AvatarFallback>{interestedInvestors[0]?.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{interestedInvestors[0]?.name}</CardTitle>
                <CardDescription>{interestedInvestors[0]?.firm}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {/* Sample messages */}
              <div className="flex items-start space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={interestedInvestors[0]?.avatar} />
                  <AvatarFallback>{interestedInvestors[0]?.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm">Hi! I reviewed your pitch deck and I'm quite impressed with your AI technology and market traction. I'd like to schedule a call to discuss potential investment opportunities.</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 justify-end">
                <div className="flex-1 flex justify-end">
                  <div className="bg-blue-500 text-white p-3 rounded-lg max-w-xs">
                    <SafeText text="Thank you for your interest! I'd be happy to discuss our investment opportunity. Are you available for a call this week?" as="p" className="text-sm" />
                  </div>
                </div>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={venture.profile.logo} />
                  <AvatarFallback>{venture.profile.companyName[0]}</AvatarFallback>
                </Avatar>
              </div>

              <div className="flex items-start space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={interestedInvestors[0]?.avatar} />
                  <AvatarFallback>{interestedInvestors[0]?.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-muted p-3 rounded-lg">
                    <SafeText text="Absolutely! I'm free Thursday at 3 PM or Friday at 10 AM. I'd particularly like to discuss your go-to-market strategy and financial projections." as="p" className="text-sm" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">1 hour ago</p>
                </div>
              </div>
            </div>
            
            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex space-x-3">
                <Input 
                  placeholder="Type your message..."
                  maxLength={10000} 
                  className="flex-1"
                />
                <button className="btn-chrome-primary px-4 py-2">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Render different views based on activeView
  switch (activeView) {
    case 'products':
      return <ProductManagement user={user} />;
      
    case 'investors':
      return renderInvestors();
      
    case 'pitch':
      return renderPitch();
      
    case 'fundraising':
      return renderFundraising();
      
    case 'mentors':
      return renderMentors();
      
    case 'messages':
      return renderMessages();
      
    default:
      return renderOverview();
  }
}