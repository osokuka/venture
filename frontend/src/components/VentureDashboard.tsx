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
  Globe,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { type FrontendUser } from '../types';
import { EditProfile } from './EditProfile';
import { Settings } from './Settings';
import { UserProfile } from './UserProfile';
import { ProductManagement } from './ProductManagement';
import { MessagingSystem } from './MessagingSystem';
import { messagingService } from '../services/messagingService';
import { investorService, type InvestorProfile } from '../services/investorService';
import { mentorService, type MentorProfile } from '../services/mentorService';
import { productService } from '../services/productService';
import { validateUuid, sanitizeInput } from '../utils/security';
import { SafeText } from './SafeText';

interface VentureDashboardProps {
  user: FrontendUser;
  activeView?: string;
  onViewChange?: (view: string) => void;
  onProfileUpdate?: (updatedUser: FrontendUser) => void;
  onRefreshUnreadCount?: () => void; // Callback to refresh global unread count
}

export function VentureDashboard({ user, activeView = 'overview', onViewChange, onProfileUpdate, onRefreshUnreadCount }: VentureDashboardProps) {
  // Track selected user ID and details for messaging (when user clicks Contact but hasn't sent a message yet)
  const [selectedMessagingUserId, setSelectedMessagingUserId] = useState<string | undefined>(undefined);
  const [selectedMessagingUserName, setSelectedMessagingUserName] = useState<string | undefined>(undefined);
  const [selectedMessagingUserRole, setSelectedMessagingUserRole] = useState<string | undefined>(undefined);
  // Remove reference to venture variable - use user directly
  // State for unread messages count
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for real API data
  const [investors, setInvestors] = useState<InvestorProfile[]>([]);
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingInvestors, setIsLoadingInvestors] = useState(false);
  const [isLoadingMentors, setIsLoadingMentors] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<MentorProfile | null>(null);
  const [isLoadingMentorProfile, setIsLoadingMentorProfile] = useState(false);
  
  // Security: Sanitize search term
  const handleSearchChange = (value: string) => {
    const sanitized = sanitizeInput(value, 100);
    setSearchTerm(sanitized);
  };
  const [filterSector, setFilterSector] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [filterCheckSize, setFilterCheckSize] = useState('all');

  // Fetch investors when component mounts or view changes to investors
  useEffect(() => {
    if (activeView === 'investors') {
      fetchInvestors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, searchTerm, filterStage]);

  // Fetch mentors when component mounts or view changes to mentors
  useEffect(() => {
    if (activeView === 'mentors') {
      fetchMentors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, searchTerm]);

  // Fetch products for stats
  useEffect(() => {
    if (activeView === 'overview') {
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);

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
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchInvestors = async () => {
    setIsLoadingInvestors(true);
    try {
      const data = await investorService.getPublicInvestors({
        search: searchTerm || undefined,
        stage: filterStage !== 'all' ? filterStage : undefined,
      });
      // Handle both array and paginated response
      const investorsList = Array.isArray(data) ? data : (data.results || data.data || []);
      setInvestors(investorsList);
    } catch (error: any) {
      console.error('Failed to fetch investors:', error);
      const errorMessage = error?.response?.status === 403 
        ? 'You need to be approved to view investors. Please wait for admin approval.'
        : (error instanceof Error ? error.message : 'Failed to load investors');
      toast.error(errorMessage);
      setInvestors([]); // Set empty array on error
    } finally {
      setIsLoadingInvestors(false);
    }
  };

  const fetchMentors = async () => {
    setIsLoadingMentors(true);
    try {
      const data = await mentorService.getPublicMentors({
        search: searchTerm || undefined,
      });
      setMentors(data);
    } catch (error) {
      console.error('Failed to fetch mentors:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load mentors');
    } finally {
      setIsLoadingMentors(false);
    }
  };

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const data = await productService.getMyProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

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
    fundingGoal: '$0', // TODO: VL-811 - Get from GET /api/ventures/funding
    fundingRaised: '$0', // TODO: VL-811 - Get from GET /api/ventures/funding
    fundingProgress: 0, // TODO: VL-811 - Calculate from GET /api/ventures/funding
    investors: investors.length,
    mentors: mentors.length,
    pitchViews: 0, // TODO: VL-811 - Get from GET /api/ventures/products/{id}/analytics
    totalMessages: unreadCount,
    valuation: '$0', // TODO: VL-811 - Get from GET /api/ventures/funding
    products: products.length,
  };

  // TODO: VL-811 - Replace empty arrays with API calls
  const recentActivity: any[] = []; // TODO: VL-811 - Get from GET /api/activity/feed
  const interestedInvestors: any[] = []; // TODO: VL-811 - Implement interested investors tracking API
  const currentMentors: any[] = []; // TODO: VL-811 - Get from GET /api/mentors/mentees (for ventures)
  const fundraisingMetrics: any[] = []; // TODO: VL-811 - Get from GET /api/ventures/funding/metrics
  const pitchDeckMetrics = {
    views: 0, // TODO: VL-811 - Get from GET /api/ventures/products/{id}/analytics
    downloads: 0, // TODO: VL-811 - Get from GET /api/ventures/products/{id}/analytics
    averageViewTime: '0m', // TODO: VL-811 - Get from GET /api/ventures/products/{id}/analytics
    lastUpdated: 'Never', // TODO: VL-811 - Get from product document updated_at
    version: '1.0' // TODO: VL-811 - Get from product document version
  };
  const upcomingMeetings: any[] = []; // TODO: VL-811 - Get from meetings/calendar API

  const handleContactInvestor = async (investorId: string) => {
    // Security: Validate UUID format
    if (!validateUuid(investorId)) {
      toast.error("Invalid investor ID");
      return;
    }
    
    // Navigate to messages view with selectedUserId
    // Conversation will be created lazily when first message is sent
    onViewChange?.('messages');
    // Store the selectedUserId in a way that MessagingSystem can access it
    // We'll pass it as a prop or use URL params
    // For now, navigate to messages - the MessagingSystem will handle it via selectedUserId prop
  };

  const handleSharePitch = (investorId: string) => {
    toast.success("Pitch deck shared with investor!");
  };

  const handleScheduleMeeting = (investorId: string) => {
    toast.success("Meeting invitation sent!");
  };

  const handleConnectMentor = async (mentorUserId: string) => {
    // Security: Validate UUID format
    if (!validateUuid(mentorUserId)) {
      toast.error("Invalid mentor ID");
      return;
    }
    
    // Set the selected user ID and navigate to messages view
    // Conversation will be created lazily when first message is sent
    setSelectedMessagingUserId(mentorUserId);
    onViewChange?.('messages');
  };

  const handleViewMentorProfile = async (mentor: MentorProfile) => {
    setIsLoadingMentorProfile(true);
    try {
      // Fetch full mentor details
      const mentorDetails = await mentorService.getMentorById(mentor.id);
      setSelectedMentor(mentorDetails);
      // Navigate to mentor profile view
      onViewChange?.('mentor-profile');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load mentor profile");
    } finally {
      setIsLoadingMentorProfile(false);
    }
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
              {fundraisingMetrics.length > 0 ? (
                fundraisingMetrics.map((metric, index) => (
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
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  <p>Fundraising metrics will appear here once available.</p>
                </div>
              )}
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
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
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
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-sm">No recent activity</p>
                  <p className="text-xs mt-1">Activity will appear here as you engage with investors and mentors.</p>
                </div>
              )}
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
              {interestedInvestors.length > 0 ? (
                <>
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
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-sm">No interested investors yet</p>
                  <p className="text-xs mt-1">Investors showing interest will appear here.</p>
                </div>
              )}
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
              {upcomingMeetings.length > 0 ? (
                upcomingMeetings.map((meeting) => (
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
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-sm">No upcoming meetings</p>
                  <p className="text-xs mt-1">Scheduled meetings will appear here.</p>
                </div>
              )}
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
    // Use real API data with null safety
    const filteredInvestors = investors.filter(investor => {
      if (!investor) return false;
      
      const searchLower = searchTerm.toLowerCase();
      const investorName = (investor.full_name || investor.user_name || '').toLowerCase();
      const orgName = (investor.organization_name || '').toLowerCase();
      
      const matchesSearch = searchTerm === '' || 
        investorName.includes(searchLower) ||
        orgName.includes(searchLower);
      
      const matchesSector = filterSector === 'all' || 
        (Array.isArray(investor.industry_preferences) && investor.industry_preferences.includes(filterSector));
      
      const matchesStage = filterStage === 'all' || 
        (Array.isArray(investor.stage_preferences) && investor.stage_preferences.includes(filterStage));
      
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
        {isLoadingInvestors ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading investors...</span>
          </div>
        ) : investors.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium mb-2">No investors available</p>
            <p className="text-sm">
              {searchTerm || filterSector !== 'all' || filterStage !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'There are no approved investors visible to you at this time.'}
            </p>
          </div>
        ) : filteredInvestors.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium mb-2">No investors match your filters</p>
            <p className="text-sm">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredInvestors.map((investor) => (
              <Card key={investor.id} className="hover:shadow-medium transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback>{(investor.full_name || investor.user_name || 'I')[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <h3 className="font-semibold text-lg">{investor.full_name || investor.user_name || 'Investor'}</h3>
                        <p className="text-muted-foreground">{investor.organization_name || 'Independent Investor'}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Briefcase className="w-4 h-4" />
                            <span>{investor.deals_count || 0} deals</span>
                          </div>
                          {investor.investment_experience_years != null && (
                            <div className="flex items-center space-x-1">
                              <Award className="w-4 h-4" />
                              <span>{investor.investment_experience_years} years experience</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {investor.stage_preferences?.[0] || 'Various'}
                      </Badge>
                    </div>

                    {/* Investment Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Ticket Size</p>
                        <p className="font-semibold">{investor.average_ticket_size || 'Not specified'}</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Deals</p>
                        <p className="font-semibold">{investor.deals_count || 0}</p>
                      </div>
                    </div>

                    {/* Sectors */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Investment Focus</h4>
                      <div className="flex flex-wrap gap-2">
                        {(investor.industry_preferences || []).slice(0, 5).map((sector, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {sector}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button 
                        className="btn-chrome-secondary flex-1 text-sm py-2"
                        onClick={() => {
                          const userId = investor.user || investor.id;
                          if (userId) {
                            handleContactInvestor(userId, investor.name || investor.full_name);
                          } else {
                            toast.error('Invalid investor user ID');
                          }
                        }}
                        disabled={!investor.user && !investor.id}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Contact
                      </button>
                      <button 
                        className="btn-chrome-primary flex-1 text-sm py-2"
                        onClick={() => {
                          const userId = investor.user || investor.id;
                          if (userId) {
                            handleSharePitch(userId);
                          } else {
                            toast.error('Invalid investor user ID');
                          }
                        }}
                        disabled={!investor.user && !investor.id}
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
          <CardDescription>Last updated {pitchDeckMetrics.lastUpdated}</CardDescription>
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
            <h3 className="text-lg font-medium mb-2">Pitch Deck v{pitchDeckMetrics.version}</h3>
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
            {fundraisingMetrics.length > 0 ? (
              fundraisingMetrics.map((metric, index) => (
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
              ))
            ) : (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-sm">Fundraising metrics will appear here once available.</p>
              </div>
            )}
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
                    onClick={() => handleContactInvestor(investor.id, investor.name || investor.full_name)}
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
    // Use real API data
    const filteredMentors = mentors.filter(mentor => {
      const matchesSearch = searchTerm === '' || 
        mentor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mentor.expertise_fields && mentor.expertise_fields.some(exp => exp.toLowerCase().includes(searchTerm.toLowerCase())));
      
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
            {currentMentors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-sm">No active mentoring relationships yet.</p>
                <p className="text-xs mt-1">Connect with mentors below to start building relationships.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {currentMentors.map((mentor) => (
                  <div key={mentor.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback>{mentor.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <h4 className="font-medium">{mentor.name}</h4>
                      <p className="text-sm text-muted-foreground">{mentor.expertise}</p>
                      <p className="text-sm text-muted-foreground">{mentor.company}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Mentors */}
        <Card>
          <CardHeader>
            <CardTitle>Available Mentors</CardTitle>
            <CardDescription>Discover mentors that match your needs</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingMentors ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading mentors...</span>
              </div>
            ) : filteredMentors.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No mentors found. Try adjusting your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredMentors.map((mentor) => (
                  <Card key={mentor.id} className="hover:shadow-medium transition-shadow">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start space-x-4">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback>{mentor.full_name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <h3 className="font-semibold text-lg">{mentor.full_name}</h3>
                            <p className="text-muted-foreground">{mentor.job_title}</p>
                            <p className="text-sm text-muted-foreground">{mentor.company}</p>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
                            <div className="flex items-center space-x-1">
                              <Globe className="w-4 h-4" />
                              <span>{mentor.preferred_engagement}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Briefcase className="w-4 h-4" />
                              <span>{mentor.engagement_type}</span>
                            </div>
                          </div>
                        </div>

                        {/* Expertise */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground">Expertise</h4>
                          <div className="flex flex-wrap gap-2">
                            {(mentor.expertise_fields || []).slice(0, 5).map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Bio */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground">About</h4>
                          <p className="text-sm leading-relaxed line-clamp-3">{mentor.experience_overview}</p>
                        </div>

                        {/* Availability */}
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-green-900">Available for Mentoring</p>
                              <p className="text-sm text-green-700">
                                {(() => {
                                  if (mentor.engagement_type === 'PRO_BONO') {
                                    return 'Pro Bono';
                                  }
                                  if (mentor.paid_rate_amount) {
                                    const rate = `$${mentor.paid_rate_amount}`;
                                    const period = mentor.paid_rate_type ? `/${mentor.paid_rate_type.toLowerCase()}` : '';
                                    return `${rate}${period}`;
                                  }
                                  return 'Rate available';
                                })()}
                              </p>
                            </div>
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-2">
                          <button 
                            className="btn-chrome-secondary flex-1 text-sm py-2 flex items-center justify-center"
                            onClick={() => handleViewMentorProfile(mentor)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Profile
                          </button>
                          <button 
                            className="btn-chrome-primary flex-1 text-sm py-2 flex items-center justify-center"
                            onClick={() => {
                              if (mentor.user) {
                                handleConnectMentor(mentor.user, mentor.full_name);
                              } else {
                                toast.error('Invalid mentor user ID');
                              }
                            }}
                            disabled={!mentor.user}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Contact
                          </button>
                        </div>
                      </div>
                  </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    );
  };

  const renderMessages = () => {
    // Safety check: ensure user has required properties
    if (!user || !user.id) {
      return (
        <div className="flex items-center justify-center h-[600px] text-muted-foreground">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4" />
            <p>Unable to load messaging system. User information is missing.</p>
          </div>
        </div>
      );
    }
    return <MessagingSystem
      currentUser={user}
      selectedUserId={selectedMessagingUserId}
      selectedUserName={selectedMessagingUserName}
      selectedUserRole={selectedMessagingUserRole}
      onRefreshUnreadCount={onRefreshUnreadCount}
    />;
  };

  // Render different views based on activeView
  const renderCurrentView = () => {
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
        
      case 'mentor-profile':
        return renderMentorProfile();
        
      case 'messages':
        return renderMessages();
        
      default:
        return renderOverview();
    }
  };

  const renderMentorProfile = () => {
    if (isLoadingMentorProfile) {
      return (
        <div className="flex items-center justify-center h-[600px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Loading mentor profile...</p>
          </div>
        </div>
      );
    }

    if (!selectedMentor) {
      return (
        <div className="flex items-center justify-center h-[600px]">
          <div className="text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No mentor selected</p>
            <Button 
              onClick={() => onViewChange?.('mentors')}
              className="mt-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Mentors
            </Button>
          </div>
        </div>
      );
    }

    // Convert MentorProfile to FrontendUser format for UserProfile component
    const mentorUser: FrontendUser = {
      id: selectedMentor.user,
      email: selectedMentor.user_email,
      full_name: selectedMentor.full_name,
      role: 'mentor',
      profile: {
        name: selectedMentor.full_name,
        jobTitle: selectedMentor.job_title,
        company: selectedMentor.company,
        email: selectedMentor.contact_email,
        phone: selectedMentor.phone,
        linkedin: selectedMentor.linkedin_or_website,
        linkedin_or_website: selectedMentor.linkedin_or_website, // UserProfile component checks for this field
        linkedinUrl: selectedMentor.linkedin_or_website, // Alternative field name
        expertise: selectedMentor.expertise_fields,
        expertise_fields: selectedMentor.expertise_fields, // UserProfile component checks for this field
        experience: selectedMentor.experience_overview,
        experience_overview: selectedMentor.experience_overview, // UserProfile component checks for this field
        industries: selectedMentor.industries_of_interest,
        industries_of_interest: selectedMentor.industries_of_interest,
        engagementType: selectedMentor.engagement_type,
        rateType: selectedMentor.paid_rate_type,
        rateAmount: selectedMentor.paid_rate_amount,
        availability: selectedMentor.availability_types,
        preferredEngagement: selectedMentor.preferred_engagement,
        approvalStatus: selectedMentor.status.toLowerCase() as 'pending' | 'approved' | 'rejected',
      }
    };

    return (
      <div className="space-y-6">
        {/* Back Button */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost"
            onClick={() => {
              setSelectedMentor(null);
              onViewChange?.('mentors');
            }}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Mentors
          </Button>
        </div>

        {/* Mentor Profile */}
        <UserProfile
          user={mentorUser}
          currentUser={user}
          onMessage={(userId) => {
            // Use selectedMentor's name if available
            handleConnectMentor(userId, selectedMentor?.full_name);
          }}
        />
      </div>
    );
  };

  return renderCurrentView();
}