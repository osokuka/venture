import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Progress } from "./ui/progress";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { toast } from "sonner@2.0.3";
import { productService } from '../services/productService';
import { validateUuid, sanitizeInput, safeDisplayText } from '../utils/security';
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
  BarChart3,
  PieChart,
  LineChart,
  ChevronRight,
  Folder,
  CreditCard,
  Calculator,
  Settings as SettingsIcon,
  MessageCircle,
  FileBarChart,
  Info,
  LogOut,
  Loader2
} from "lucide-react";
import { type FrontendUser, type User } from '../types';
import { ventureService } from '../services/ventureService';
import { messagingService } from '../services/messagingService';
import { type VentureProduct } from '../types';
import { EditProfile } from './EditProfile';
import { Settings } from './Settings';
import { UserProfile } from './UserProfile';
// Note: SchedulingModal import removed - using new tabs instead per NO_MODALS_RULE.md
import { MessagingSystem } from './MessagingSystem';

interface InvestorDashboardProps {
  user: User;
  activeView?: string;
  onViewChange?: (view: string) => void;
  onProfileUpdate?: (updatedUser: User) => void;
  onRefreshUnreadCount?: () => void; // Callback to refresh global unread count
}

// Note: All modal components have been removed per NO_MODALS_RULE.md
// Portfolio actions navigate on the same page (per user request)

export function InvestorDashboard({ user, activeView = 'overview', onViewChange, onProfileUpdate, onRefreshUnreadCount }: InvestorDashboardProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [ventures, setVentures] = useState<VentureProduct[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingVentures, setIsLoadingVentures] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [filterFunding, setFilterFunding] = useState('all');
  
  // Get selected user info from URL params (for messaging)
  const selectedUserId = searchParams.get('userId');
  const selectedUserName = searchParams.get('userName');
  const selectedUserRole = searchParams.get('userRole');

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
  }, [activeView, searchTerm, filterSector, filterStage]);

  const fetchVentures = async () => {
    setIsLoadingVentures(true);
    try {
      // Security: Sanitize search term
      const sanitizedSearch = searchTerm ? sanitizeInput(searchTerm, 100) : undefined;
      const sanitizedSector = filterSector !== 'all' ? sanitizeInput(filterSector, 100) : undefined;
      
      const data = await ventureService.getPublicVentures({
        search: sanitizedSearch,
        sector: sanitizedSector,
      });
      // Ensure data is always an array (handle paginated responses or errors)
      const venturesArray = Array.isArray(data) ? data : (data?.results || data?.data || []);
      setVentures(venturesArray);
    } catch (error) {
      console.error('Failed to fetch ventures:', error);
      toast.error('Failed to load ventures');
      // Ensure ventures is always an array even on error
      setVentures([]);
    } finally {
      setIsLoadingVentures(false);
    }
  };
  
  // Note: All modals have been removed. Actions now open new tabs instead.
  // This follows the platform rule: "No modals - use new tabs for detailed views"

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
    totalInvestments: 0, // TODO: VL-811 - Get from investor profile API
    totalInvested: '$0', // TODO: VL-811 - Get from investor profile API
    activeDeals: 8, // TODO: VL-811 - Get from GET /api/investors/portfolio (count active investments)
    avgReturn: '24%', // TODO: VL-811 - Calculate from portfolio API data
    portfolioValue: '$3.2M', // TODO: VL-811 - Calculate from portfolio API data
    pipeline: 23, // TODO: VL-811 - Get from GET /api/investors/opportunities (count)
    totalMessages: unreadCount
  };

  // TODO: VL-811 - Replace hardcoded recentActivity with API call to GET /api/activity/feed
  const recentActivity = [
    {
      id: 1,
      type: 'investment',
      title: 'Investment completed in TechFlow AI',
      description: '$500K Series A investment successfully closed',
      time: '2 hours ago',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      id: 2,
      type: 'startup',
      title: 'New startup application from HealthBridge',
      description: 'Series A startup seeking $8M in funding',
      time: '4 hours ago',
      icon: Building,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      id: 3,
      type: 'meeting',
      title: 'Due diligence call scheduled',
      description: 'Financial review meeting with GreenSpace tomorrow',
      time: '1 day ago',
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      id: 4,
      type: 'exit',
      title: 'Portfolio company exit',
      description: 'DataCorp acquired by Microsoft - 3.2x return',
      time: '2 days ago',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  // TODO: VL-811 - Replace hardcoded portfolioCompanies with API call to GET /api/investors/portfolio
  const portfolioCompanies = [
    {
      id: 'p1',
      company: 'TechFlow AI',
      sector: 'AI/ML',
      stage: 'Series A',
      invested: '$500K',
      currentValue: '$750K',
      return: '+50%',
      status: 'Growing',
      logo: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=60&h=60&fit=crop&crop=center',
      lastUpdate: '2 days ago',
      metrics: { revenue: '$200K ARR', growth: '+45% MoM' },
      founderName: 'Sarah Chen',
      founderAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&h=60&fit=crop&crop=center',
      expertise: 'AI & Machine Learning'
    },
    {
      id: 'p2',
      company: 'HealthBridge',
      sector: 'HealthTech',
      stage: 'Series A',
      invested: '$300K',
      currentValue: '$420K',
      return: '+40%',
      status: 'Stable',
      logo: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=60&h=60&fit=crop&crop=center',
      lastUpdate: '1 week ago',
      metrics: { revenue: '10K users', growth: '+25% MAU' },
      founderName: 'Michael Rodriguez',
      founderAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=center',
      expertise: 'Healthcare Technology'
    },
    {
      id: 'p3',
      company: 'GreenSpace',
      sector: 'CleanTech',
      stage: 'Seed',
      invested: '$250K',
      currentValue: '$200K',
      return: '-20%',
      status: 'Watch',
      logo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=60&h=60&fit=crop&crop=center',
      lastUpdate: '3 days ago',
      metrics: { revenue: '$50K MRR', growth: '+15% MoM' },
      founderName: 'Emma Watson',
      founderAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=center',
      expertise: 'Clean Technology'
    },
    {
      id: 'p4',
      company: 'FinTech Solutions',
      sector: 'FinTech',
      stage: 'Seed',
      invested: '$200K',
      currentValue: '$380K',
      return: '+90%',
      status: 'Thriving',
      logo: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=60&h=60&fit=crop&crop=center',
      lastUpdate: '5 days ago',
      metrics: { revenue: '$100K ARR', growth: '+30% MoM' },
      founderName: 'David Kim',
      founderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=center',
      expertise: 'Financial Technology'
    }
  ];

  const pipelineDeals = [
    {
      id: 1,
      company: 'TechFlow AI',
      stage: 'Due Diligence',
      amount: '$500K',
      progress: 75,
      nextStep: 'Financial review call',
      dueDate: 'Tomorrow'
    },
    {
      id: 2,
      company: 'AI Analytics',
      stage: 'Term Sheet',
      amount: '$1M',
      progress: 60,
      nextStep: 'Legal documentation',
      dueDate: 'Next week'
    },
    {
      id: 3,
      company: 'EcoEnergy',
      stage: 'Initial Review',
      amount: '$300K',
      progress: 25,
      nextStep: 'Management presentation',
      dueDate: 'Friday'
    }
  ];

  const performanceMetrics = [
    { label: 'Total Portfolio Value', value: '$3.2M', change: '+15%', trend: 'up' },
    { label: 'IRR', value: '28%', change: '+3%', trend: 'up' },
    { label: 'Active Investments', value: '15', change: '+2', trend: 'up' },
    { label: 'Avg. Hold Period', value: '2.3 years', change: '+0.2', trend: 'neutral' }
  ];

  const handleContactStartup = (startupId: string) => {
    toast.success("Message sent to startup successfully!");
  };

  const handleRequestPitch = async (productId: string) => {
    // Security: Validate UUID
    if (!validateUuid(productId)) {
      toast.error("Invalid product ID");
      return;
    }

    try {
      // Ensure ventures is an array before using find
      const venturesArray = Array.isArray(ventures) ? ventures : [];
      
      // Find the product and its first pitch deck
      const product = venturesArray.find(v => v.id === productId);
      if (!product || !product.documents || product.documents.length === 0) {
        toast.error("No pitch deck available for this product");
        return;
      }

      const pitchDeck = product.documents.find((doc: any) => doc.document_type === 'PITCH_DECK');
      if (!pitchDeck) {
        toast.error("No pitch deck found");
        return;
      }

      // Security: Validate document ID
      if (!validateUuid(pitchDeck.id)) {
        toast.error("Invalid document ID");
        return;
      }

      // Request pitch deck access
      await productService.requestPitchDeck(productId, pitchDeck.id);
      toast.success("Pitch deck request sent!");
    } catch (err: any) {
      console.error('Failed to request pitch deck:', err);
      toast.error(err.message || 'Failed to request pitch deck');
    }
  };

  const handleScheduleMeeting = (startupId: string) => {
    toast.success("Meeting request sent!");
  };

  const handleScheduleWithFounder = async (company: any) => {
    // For portfolio companies, we need to get the actual user ID from the product
    // Check if company.id is a valid UUID (product ID)
    const isValidUuid = company.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(company.id);
    
    let userId = company.founderId || company.userId;
    let userName = company.founderName || company.company;
    
    // If company.id is a valid UUID, fetch the product to get the user ID
    if (isValidUuid && !userId) {
      try {
        const product = await ventureService.getVentureById(company.id);
        if (product && product.user) {
          userId = product.user;
          userName = product.user_name || product.name || company.company;
        }
      } catch (error) {
        console.error('Failed to fetch product user ID:', error);
        // Fallback to using company.id if it's a UUID
        if (isValidUuid) {
          userId = company.id;
        }
      }
    } else if (!isValidUuid) {
      // Demo data - try to find matching product by company name
      try {
        const publicVentures = await ventureService.getPublicVentures({});
        const venturesArray = Array.isArray(publicVentures) 
          ? publicVentures 
          : (publicVentures?.results || publicVentures?.data || []);
        
        // Try to find a matching product by name
        const matchingProduct = venturesArray.find((v: VentureProduct) => 
          v.name.toLowerCase().includes(company.company.toLowerCase()) ||
          company.company.toLowerCase().includes(v.name.toLowerCase())
        );
        
        if (matchingProduct && matchingProduct.user) {
          userId = matchingProduct.user;
          userName = matchingProduct.user_name || matchingProduct.name;
        } else {
          // No matching product found - show helpful message
          toast.info('This portfolio company is using demo data. To schedule meetings, please link it to an actual product or use a company from the Discover page.');
          return;
        }
      } catch (error) {
        console.error('Failed to search for matching product:', error);
        toast.info('This portfolio company is using demo data. To schedule meetings, please link it to an actual product.');
        return;
      }
    }
    
    if (!userId) {
      toast.error('Unable to determine user ID for scheduling');
      return;
    }
    
    // Navigate to meeting scheduler on same page
    const params = new URLSearchParams({
      userId: userId,
      userName: userName,
      company: company.company,
      userRole: 'venture',
    });
    navigate(`/dashboard/investor/schedule?${params.toString()}`);
  };

  // Action handlers - Navigate on same page (per user request)
  // Portfolio actions navigate to dedicated routes on the same page
  const handleShowDetails = (company: any) => {
    // Navigate to company details page on same page
    // Details page will show the complete PitchDeckDetails component
    const params = new URLSearchParams({
      companyId: company.id,
      company: company.company,
    });
    navigate(`/dashboard/investor/portfolio/details?${params.toString()}`);
  };

  const handleShowReports = (company: any) => {
    // Navigate to reports page on same page
    const params = new URLSearchParams({
      companyId: company.id,
      company: company.company,
    });
    navigate(`/dashboard/investor/portfolio/reports?${params.toString()}`);
  };

  const handleShowExitPlan = (company: any) => {
    // Navigate to exit plan page on same page
    const params = new URLSearchParams({
      companyId: company.id,
      company: company.company,
      invested: company.invested,
      currentValue: company.currentValue,
      return: company.return,
    });
    navigate(`/dashboard/investor/portfolio/exit-plan?${params.toString()}`);
  };

  const handleSendMessage = async (company: any) => {
    // For portfolio companies, we need to get the actual user ID from the product
    // Check if company.id is a valid UUID (product ID)
    const isValidUuid = company.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(company.id);
    
    let userId = company.founderId || company.userId;
    let userName = company.founderName || company.company;
    
    // If company.id is a valid UUID, fetch the product to get the user ID
    if (isValidUuid && !userId) {
      try {
        const product = await ventureService.getVentureById(company.id);
        if (product && product.user) {
          userId = product.user;
          userName = product.user_name || product.name || company.company;
        }
      } catch (error) {
        console.error('Failed to fetch product user ID:', error);
        // Fallback to using company.id if it's a UUID
        if (isValidUuid) {
          userId = company.id;
        }
      }
    } else if (!isValidUuid) {
      // Demo data - try to find matching product by company name
      try {
        const publicVentures = await ventureService.getPublicVentures({});
        const venturesArray = Array.isArray(publicVentures) 
          ? publicVentures 
          : (publicVentures?.results || publicVentures?.data || []);
        
        // Try to find a matching product by name
        const matchingProduct = venturesArray.find((v: VentureProduct) => 
          v.name.toLowerCase().includes(company.company.toLowerCase()) ||
          company.company.toLowerCase().includes(v.name.toLowerCase())
        );
        
        if (matchingProduct && matchingProduct.user) {
          userId = matchingProduct.user;
          userName = matchingProduct.user_name || matchingProduct.name;
        } else {
          // No matching product found - show helpful message
          toast.info('This portfolio company is using demo data. To send messages, please link it to an actual product or use a company from the Discover page.');
          return;
        }
      } catch (error) {
        console.error('Failed to search for matching product:', error);
        toast.info('This portfolio company is using demo data. To send messages, please link it to an actual product.');
        return;
      }
    }
    
    if (!userId) {
      toast.error('Unable to determine user ID for messaging');
      return;
    }
    
    // Navigate to messaging system on same page with company founder
    const params = new URLSearchParams({
      userId: userId,
      userName: userName,
      userRole: 'venture',
    });
    // Navigate to messages view and pass params
    // Use navigate with replace: false to preserve history
    navigate(`/dashboard/investor/messages?${params.toString()}`, { replace: false });
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
                <p className="text-sm font-medium text-muted-foreground">Portfolio Value</p>
                <p className="text-2xl font-bold">{stats.portfolioValue}</p>
                <p className="text-xs text-green-600">+15% this quarter</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-medium transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Investments</p>
                <p className="text-2xl font-bold">{stats.totalInvestments}</p>
                <p className="text-xs text-muted-foreground">Active portfolio</p>
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
                <p className="text-sm font-medium text-muted-foreground">Avg. Return</p>
                <p className="text-2xl font-bold">{stats.avgReturn}</p>
                <p className="text-xs text-purple-600">Above benchmark</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-medium transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Target className="w-5 h-5 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pipeline</p>
                <p className="text-2xl font-bold">{stats.pipeline}</p>
                <p className="text-xs text-muted-foreground">Active deals</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Performance and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Performance</CardTitle>
            <CardDescription>
              Key performance metrics across your investments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceMetrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{metric.label}</p>
                    <p className="text-2xl font-bold">{metric.value}</p>
                  </div>
                  <div className="text-right">
                    <div className={`flex items-center space-x-1 ${
                      metric.trend === 'up' ? 'text-green-600' : 
                      metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {metric.trend === 'up' && <TrendingUp className="w-4 h-4" />}
                      {metric.trend === 'down' && <TrendingDown className="w-4 h-4" />}
                      <span className="text-sm font-medium">{metric.change}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest investment updates and opportunities
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

      {/* Top Portfolio Companies and Deal Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Top Portfolio Companies</span>
            </CardTitle>
            <CardDescription>
              Best performing investments in your portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {portfolioCompanies.slice(0, 4).map((company) => (
                <div key={company.id} className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={company.logo} />
                    <AvatarFallback>{company.company[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{company.company}</p>
                    <p className="text-sm text-muted-foreground">{company.sector} • {company.stage}</p>
                    <p className="text-xs text-muted-foreground">{company.metrics.revenue}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{company.currentValue}</p>
                    <p className={`text-xs ${
                      company.return.startsWith('+') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {company.return}
                    </p>
                    <Badge 
                      variant={company.status === 'Thriving' ? 'default' : 
                              company.status === 'Growing' ? 'secondary' : 'outline'}
                      className="text-xs mt-1"
                    >
                      {company.status}
                    </Badge>
                  </div>
                </div>
              ))}
              <button 
                className="btn-chrome-secondary w-full mt-4"
                onClick={() => onViewChange?.('portfolio')}
              >
                View Full Portfolio
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Deal Pipeline</span>
            </CardTitle>
            <CardDescription>
              Current investment opportunities in progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pipelineDeals.map((deal) => (
                <div key={deal.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{deal.company}</p>
                      <p className="text-sm text-muted-foreground">{deal.stage}</p>
                    </div>
                    <p className="font-semibold">{deal.amount}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{deal.progress}%</span>
                    </div>
                    <Progress value={deal.progress} className="h-2" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{deal.nextStep}</span>
                    <span className="font-medium">{deal.dueDate}</span>
                  </div>
                </div>
              ))}
              <button 
                className="btn-chrome-secondary w-full mt-4"
                onClick={() => onViewChange?.('discover')}
              >
                Explore More Opportunities
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderPortfolio = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Portfolio Management</h2>
        <p className="text-muted-foreground">Manage and track your portfolio company investments</p>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{portfolioCompanies.length}</p>
              <p className="text-sm text-muted-foreground">Portfolio Companies</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">$3.2M</p>
              <p className="text-sm text-muted-foreground">Total Value</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">+28%</p>
              <p className="text-sm text-muted-foreground">Avg Return</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">12</p>
              <p className="text-sm text-muted-foreground">Active Deals</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Companies */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Companies</CardTitle>
          <CardDescription>Your current investments and their performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {portfolioCompanies.map((company) => (
              <div key={company.id} className="p-6 border rounded-lg hover:bg-muted/50 transition-colors">
                {/* Company Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={company.logo} />
                      <AvatarFallback>{company.company[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold">{company.company}</h3>
                      <p className="text-muted-foreground">{company.sector} • {company.stage}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge 
                          variant={company.status === 'Thriving' ? 'default' : 
                                  company.status === 'Growing' ? 'secondary' : 'outline'}
                        >
                          {company.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">Updated {company.lastUpdate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{company.currentValue}</p>
                    <p className={`text-sm font-medium ${
                      company.return.startsWith('+') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {company.return} return
                    </p>
                  </div>
                </div>

                {/* Investment Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Initial Investment</p>
                    <p className="font-semibold">{company.invested}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Current Valuation</p>
                    <p className="font-semibold">{company.currentValue}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Performance</p>
                    <p className="font-semibold">{company.metrics.revenue}</p>
                    <p className="text-xs text-muted-foreground">{company.metrics.growth}</p>
                  </div>
                </div>

                {/* Founder Info */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/20 to-muted/10 rounded-lg mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={company.founderAvatar} />
                      <AvatarFallback>{company.founderName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{company.founderName}</p>
                      <p className="text-sm text-muted-foreground">Founder & CEO</p>
                      <p className="text-xs text-muted-foreground">{company.expertise}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleScheduleWithFounder(company)}
                    className="btn-chrome-primary"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Meeting
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button 
                    className="btn-chrome-secondary flex-1 min-w-32"
                    onClick={() => handleSendMessage(company)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
                  </button>
                  <button 
                    className="btn-chrome-secondary flex-1 min-w-32"
                    onClick={() => handleShowReports(company)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Reports
                  </button>
                  <button 
                    className="btn-chrome-secondary flex-1 min-w-32"
                    onClick={() => handleShowDetails(company)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Details
                  </button>
                  <button 
                    className="btn-chrome-secondary flex-1 min-w-32"
                    onClick={() => handleShowExitPlan(company)}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Exit Plan
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDiscover = () => {
    // Ensure ventures is an array before filtering
    const venturesArray = Array.isArray(ventures) ? ventures : [];
    
    // Use real API data
    const filteredStartups = venturesArray.filter(venture => {
      const matchesSearch = searchTerm === '' || 
        venture.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venture.short_description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSector = filterSector === 'all' || venture.industry_sector === filterSector;
      const matchesStage = filterStage === 'all'; // TODO: Add stage filtering when available in API
      
      return matchesSearch && matchesSector && matchesStage;
    });

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Discover Startups</h2>
          <p className="text-muted-foreground">Find investment opportunities that match your criteria</p>
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
                  <SelectItem value="SaaS">SaaS</SelectItem>
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
              <Select value={filterFunding} onValueChange={setFilterFunding}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Funding Amount" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Amounts</SelectItem>
                  <SelectItem value="<1M">&lt; $1M</SelectItem>
                  <SelectItem value="1M-5M">$1M - $5M</SelectItem>
                  <SelectItem value="5M-10M">$5M - $10M</SelectItem>
                  <SelectItem value=">10M">&gt; $10M</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* All Startups */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredStartups.map((venture) => (
            <Card key={venture.id} className="hover:shadow-medium transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback>{safeDisplayText(venture.name)?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <h3 className="font-semibold text-lg">{safeDisplayText(venture.name)}</h3>
                        <p className="text-muted-foreground">{safeDisplayText(venture.short_description)}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Building className="w-4 h-4" />
                            <span>{safeDisplayText(venture.industry_sector)}</span>
                          </div>
                          {venture.address && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{safeDisplayText(venture.address)}</span>
                            </div>
                          )}
                          {venture.employees_count && (
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>{safeDisplayText(String(venture.employees_count))}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {safeDisplayText(venture.status)}
                      </Badge>
                  </div>

                  {/* Funding Details - Get from pitch deck metadata if available */}
                  {venture.documents && venture.documents.length > 0 && (
                    <>
                      {venture.documents.find((doc: any) => doc.document_type === 'PITCH_DECK' && doc.funding_amount) && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Seeking</p>
                            <p className="font-semibold">
                              {safeDisplayText(venture.documents.find((doc: any) => doc.document_type === 'PITCH_DECK')?.funding_amount || 'N/A')}
                            </p>
                          </div>
                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Stage</p>
                            <p className="font-semibold">
                              {safeDisplayText(venture.documents.find((doc: any) => doc.document_type === 'PITCH_DECK')?.funding_stage || 'N/A')}
                            </p>
                          </div>
                        </div>
                      )}
                      {venture.documents.find((doc: any) => doc.document_type === 'PITCH_DECK' && doc.traction_metrics) && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground">Traction</h4>
                          <div className="text-sm space-y-1.5">
                            {(() => {
                              const pitchDeck = venture.documents.find((doc: any) => doc.document_type === 'PITCH_DECK');
                              const metrics = pitchDeck?.traction_metrics;
                              if (!metrics) return null;
                              
                              // Handle string metrics (if it's already a string)
                              let parsedMetrics = metrics;
                              if (typeof metrics === 'string') {
                                try {
                                  parsedMetrics = JSON.parse(metrics);
                                } catch {
                                  // If not valid JSON, display as-is (decode HTML entities)
                                  return <p className="text-xs text-muted-foreground">{safeDisplayText(metrics)}</p>;
                                }
                              }
                              
                              // Format as key-value pairs
                              if (typeof parsedMetrics === 'object' && parsedMetrics !== null) {
                                return Object.entries(parsedMetrics).map(([key, value], index) => {
                                  // Format key: convert snake_case to Title Case
                                  const formattedKey = key
                                    .split('_')
                                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                    .join(' ');
                                  
                                  // Safely display the value (decode HTML entities, sanitize)
                                  const displayValue = safeDisplayText(String(value));
                                  
                                  return (
                                    <div key={index} className="flex justify-between items-center text-xs py-0.5">
                                      <span className="text-muted-foreground font-medium">{formattedKey}:</span>
                                      <span className="font-semibold text-foreground ml-2 text-right">{displayValue}</span>
                                    </div>
                                  );
                                });
                              }
                              
                              return <p className="text-xs text-muted-foreground">{safeDisplayText(String(metrics))}</p>;
                            })()}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button 
                      className="btn-chrome-secondary flex-1"
                      onClick={async () => {
                        // Security: Validate UUID
                        if (!validateUuid(venture.id)) {
                          toast.error("Invalid venture ID");
                          return;
                        }

                        try {
                          // Find pitch deck document
                          const pitchDeck = venture.documents?.find((doc: any) => doc.document_type === 'PITCH_DECK');
                          if (!pitchDeck) {
                            // If no pitch deck in the venture data, try to request access anyway
                            // The backend will handle the case where no pitch deck exists
                            await productService.requestPitchDeck(venture.id, '00000000-0000-0000-0000-000000000000');
                            toast.success("Pitch deck access requested. The venture will be notified.");
                            return;
                          }

                          // Security: Validate document ID
                          if (!validateUuid(pitchDeck.id)) {
                            toast.error("Invalid document ID");
                            return;
                          }

                          // Navigate to pitch deck details page on same page
                          // This shows all pitch deck information and document links
                          navigate(`/dashboard/investor/pitch-deck/${venture.id}/${pitchDeck.id}`);
                        } catch (err: any) {
                          console.error('Failed to access pitch deck:', err);
                          toast.error(err.message || 'Failed to access pitch deck');
                        }
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Pitch
                    </button>
                    <button 
                      className="btn-chrome-primary flex-1"
                      onClick={() => {
                        // Security: Validate UUID
                        if (!validateUuid(venture.id)) {
                          toast.error("Invalid venture ID");
                          return;
                        }
                        handleContactStartup(venture.id);
                      }}
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
    // Convert User type to FrontendUser format (role needs to be lowercase)
    const frontendUser: FrontendUser = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role.toLowerCase() as 'venture' | 'investor' | 'mentor' | 'admin',
    };
    // Pass selected user info from URL params to initiate conversation
    // Use key prop to force re-render when selectedUserId changes
    return (
      <MessagingSystem
        key={`messages-${selectedUserId || 'none'}`}
        currentUser={frontendUser}
        selectedUserId={selectedUserId || undefined}
        selectedUserName={selectedUserName || undefined}
        selectedUserRole={selectedUserRole || undefined}
        onRefreshUnreadCount={onRefreshUnreadCount}
      />
    );
  };

  // Main render logic
  switch (activeView) {
    case 'overview':
      return renderOverview();
    case 'discover':
      return renderDiscover();
    case 'portfolio':
      return renderPortfolio();
    case 'messages':
      return renderMessages();
    default:
      return renderOverview();
  }
}