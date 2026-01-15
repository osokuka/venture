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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
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
import { SchedulingModal } from './SchedulingModal';
import { MessagingSystem } from './MessagingSystem';

interface InvestorDashboardProps {
  user: User;
  activeView?: string;
  onViewChange?: (view: string) => void;
  onProfileUpdate?: (updatedUser: User) => void;
  onRefreshUnreadCount?: () => void; // Callback to refresh global unread count
}

interface CompanyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: any;
}

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: any;
}

interface ExitPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: any;
}

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: any;
}

// Company Details Modal
function CompanyDetailsModal({ isOpen, onClose, company }: CompanyDetailsModalProps) {
  if (!company) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={company.logo} />
              <AvatarFallback>{company.company[0]}</AvatarFallback>
            </Avatar>
            <span>{company.company} - Company Details</span>
          </DialogTitle>
          <DialogDescription>
            Comprehensive overview of your portfolio investment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Investment Value</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{company.currentValue}</p>
                <p className={`text-sm ${company.return.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {company.return} return
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Revenue (ARR)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{company.metrics.revenue}</p>
                <p className="text-sm text-muted-foreground">{company.metrics.growth}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge 
                  variant={company.status === 'Thriving' ? 'default' : 
                          company.status === 'Growing' ? 'secondary' : 'outline'}
                  className="text-sm"
                >
                  {company.status}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">Last update: {company.lastUpdate}</p>
              </CardContent>
            </Card>
          </div>

          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Sector</h4>
                  <p>{company.sector}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Stage</h4>
                  <p>{company.stage}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Initial Investment</h4>
                  <p>{company.invested}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Current Valuation</h4>
                  <p>{company.currentValue}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Founder Information */}
          <Card>
            <CardHeader>
              <CardTitle>Leadership Team</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={company.founderAvatar} />
                  <AvatarFallback>{company.founderName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{company.founderName}</h3>
                  <p className="text-muted-foreground">Founder & CEO</p>
                  <p className="text-sm text-muted-foreground">{company.expertise}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-muted/20 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm">Q4 financial report submitted</p>
                    <p className="text-xs text-muted-foreground">2 days ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-muted/20 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm">New product feature launched</p>
                    <p className="text-xs text-muted-foreground">1 week ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-muted/20 rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div>
                    <p className="text-sm">Board meeting scheduled</p>
                    <p className="text-xs text-muted-foreground">2 weeks ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Reports Modal
function ReportsModal({ isOpen, onClose, company }: ReportsModalProps) {
  if (!company) return null;

  const reports = [
    {
      name: 'Q4 2024 Financial Report',
      type: 'Financial',
      date: '2024-12-31',
      status: 'Available',
      size: '2.3 MB'
    },
    {
      name: 'Monthly Metrics Dashboard',
      type: 'Performance',
      date: '2024-12-01',
      status: 'Available',
      size: '1.8 MB'
    },
    {
      name: 'Market Analysis Report',
      type: 'Strategic',
      date: '2024-11-15',
      status: 'Available',
      size: '3.1 MB'
    },
    {
      name: 'Product Roadmap 2025',
      type: 'Product',
      date: '2024-11-01',
      status: 'Available',
      size: '1.5 MB'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <FileBarChart className="w-5 h-5" />
            <span>{company.company} - Reports & Documents</span>
          </DialogTitle>
          <DialogDescription>
            Access financial reports, performance metrics, and strategic documents
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Reports</p>
                    <p className="font-semibold">{reports.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-semibold">Dec 31, 2024</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Performance</p>
                    <p className="font-semibold">{company.return}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reports List */}
          <Card>
            <CardHeader>
              <CardTitle>Available Reports</CardTitle>
              <CardDescription>Download and view company reports and documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reports.map((report, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{report.name}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{report.type}</span>
                          <span>•</span>
                          <span>{report.date}</span>
                          <span>•</span>
                          <span>{report.size}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        {report.status}
                      </Badge>
                      <button 
                        className="btn-chrome-secondary text-xs py-1 px-3"
                        onClick={() => toast.success(`Downloading ${report.name}...`)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Request Custom Report */}
          <Card>
            <CardHeader>
              <CardTitle>Request Custom Report</CardTitle>
              <CardDescription>Need specific data or analysis? Request a custom report from the company</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea 
                  placeholder="Describe the type of report or specific data you need..."
                  rows={3}
                />
                <button 
                  className="btn-chrome-primary"
                  onClick={() => toast.success('Custom report request sent to company!')}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Request Report
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Exit Plan Modal
function ExitPlanModal({ isOpen, onClose, company }: ExitPlanModalProps) {
  if (!company) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <LogOut className="w-5 h-5" />
            <span>{company.company} - Exit Strategy Planning</span>
          </DialogTitle>
          <DialogDescription>
            Plan and manage your exit strategy for this investment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Investment Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Investment Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Initial Investment</p>
                  <p className="font-semibold text-lg">{company.invested}</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Current Value</p>
                  <p className="font-semibold text-lg">{company.currentValue}</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Return</p>
                  <p className={`font-semibold text-lg ${company.return.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {company.return}
                  </p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Hold Period</p>
                  <p className="font-semibold text-lg">2.3 years</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exit Options */}
          <Card>
            <CardHeader>
              <CardTitle>Exit Strategy Options</CardTitle>
              <CardDescription>Evaluate different exit strategies for your investment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Strategic Acquisition</h4>
                    <Badge variant="secondary">High Potential</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Sell to a strategic buyer in the same industry. Potential for premium valuation due to synergies.
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Estimated Timeline: 12-18 months</span>
                    <span className="font-medium">Potential Multiple: 3-5x</span>
                  </div>
                </div>

                <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">IPO (Public Offering)</h4>
                    <Badge variant="outline">Medium Potential</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Take the company public through an initial public offering. Requires strong financials and growth.
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Estimated Timeline: 18-24 months</span>
                    <span className="font-medium">Potential Multiple: 4-8x</span>
                  </div>
                </div>

                <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Secondary Sale</h4>
                    <Badge variant="outline">Available Now</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Sell shares to another investor or fund. Quick exit but potentially lower valuation.
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Estimated Timeline: 3-6 months</span>
                    <span className="font-medium">Potential Multiple: 1.5-2.5x</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended Action Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-primary/5 rounded-lg">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">1</div>
                  <div>
                    <p className="font-medium">Monitor Performance</p>
                    <p className="text-sm text-muted-foreground">Continue tracking key metrics and company milestones</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-6 h-6 bg-muted-foreground text-background rounded-full flex items-center justify-center text-xs font-semibold">2</div>
                  <div>
                    <p className="font-medium">Market Analysis</p>
                    <p className="text-sm text-muted-foreground">Analyze market conditions and potential buyer interest</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-6 h-6 bg-muted-foreground text-background rounded-full flex items-center justify-center text-xs font-semibold">3</div>
                  <div>
                    <p className="font-medium">Strategic Planning</p>
                    <p className="text-sm text-muted-foreground">Work with management team on exit preparation</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex space-x-3">
            <button 
              className="btn-chrome-primary flex-1"
              onClick={() => toast.success('Exit strategy consultation scheduled!')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Consultation
            </button>
            <button 
              className="btn-chrome-secondary flex-1"
              onClick={() => toast.success('Exit planning documents will be sent to your email.')}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Exit Plan
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Message Modal
function MessageModal({ isOpen, onClose, company }: MessageModalProps) {
  const [message, setMessage] = useState('');

  if (!company) return null;

  const handleSendMessage = () => {
    if (message.trim()) {
      toast.success(`Message sent to ${company.founderName} at ${company.company}!`);
      setMessage('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <MessageCircle className="w-5 h-5" />
            <span>Message {company.founderName}</span>
          </DialogTitle>
          <DialogDescription>
            Send a direct message to the founder of {company.company}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recipient Info */}
          <div className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg">
            <Avatar className="w-12 h-12">
              <AvatarImage src={company.founderAvatar} />
              <AvatarFallback>{company.founderName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{company.founderName}</p>
              <p className="text-sm text-muted-foreground">Founder & CEO at {company.company}</p>
            </div>
          </div>

          {/* Message Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2">
                <button 
                  className="p-3 text-left border rounded-lg hover:bg-muted/50 transition-colors text-sm"
                  onClick={() => setMessage("Hi! I'd like to schedule a quarterly review meeting to discuss the company's progress and upcoming milestones.")}
                >
                  📅 Schedule quarterly review meeting
                </button>
                <button 
                  className="p-3 text-left border rounded-lg hover:bg-muted/50 transition-colors text-sm"
                  onClick={() => setMessage("Could you please provide an update on the latest financial metrics and key performance indicators?")}
                >
                  📊 Request financial update
                </button>
                <button 
                  className="p-3 text-left border rounded-lg hover:bg-muted/50 transition-colors text-sm"
                  onClick={() => setMessage("I'd like to discuss potential strategic opportunities and partnerships that could benefit the company.")}
                >
                  🤝 Discuss strategic opportunities
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Message Compose */}
          <div className="space-y-4">
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-2">Your Message</label>
              <Textarea 
                id="message"
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {message.length}/1000 characters
              </p>
              <div className="flex space-x-3">
                <button 
                  className="btn-chrome-secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button 
                  className="btn-chrome-primary"
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function InvestorDashboard({ user, activeView = 'overview', onViewChange, onProfileUpdate }: InvestorDashboardProps) {
  const [ventures, setVentures] = useState<VentureProduct[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingVentures, setIsLoadingVentures] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [filterFunding, setFilterFunding] = useState('all');

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
  
  // Scheduling Modal State
  const [isSchedulingModalOpen, setIsSchedulingModalOpen] = useState(false);
  const [selectedMentee, setSelectedMentee] = useState<{
    id: string;
    name: string;
    company: string;
    avatar: string;
    expertise?: string;
  } | null>(null);

  // New Modal States
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isExitPlanModalOpen, setIsExitPlanModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

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

  // TODO: VL-811 - Replace hardcoded investmentOpportunities with API call to GET /api/investors/opportunities
  const investmentOpportunities = [
    {
      id: 'o1',
      company: 'AI Analytics',
      sector: 'AI/ML',
      stage: 'Series B',
      asking: '$10M',
      valuation: '$40M',
      traction: '1M+ users, $2M ARR',
      matched: 95,
      logo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=60&h=60&fit=crop&crop=center',
      description: 'Advanced AI analytics platform for enterprise data insights',
      teamSize: '25-50',
      location: 'San Francisco, CA'
    },
    {
      id: 'o2',
      company: 'EcoEnergy',
      sector: 'CleanTech',
      stage: 'Series A',
      asking: '$5M',
      valuation: '$20M',
      traction: '50+ enterprise clients, $1M ARR',
      matched: 87,
      logo: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=60&h=60&fit=crop&crop=center',
      description: 'Renewable energy management for commercial buildings',
      teamSize: '11-25',
      location: 'Austin, TX'
    },
    {
      id: 'o3',
      company: 'MedTech Pro',
      sector: 'HealthTech',
      stage: 'Seed',
      asking: '$3M',
      valuation: '$12M',
      traction: '5 hospital partnerships, clinical trials started',
      matched: 78,
      logo: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=60&h=60&fit=crop&crop=center',
      description: 'AI-powered medical diagnostics platform',
      teamSize: '6-10',
      location: 'Boston, MA'
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

  const handleRequestPitch = (startupId: string) => {
    toast.success("Pitch deck request sent!");
  };

  const handleScheduleMeeting = (startupId: string) => {
    toast.success("Meeting request sent!");
  };

  const handleScheduleWithFounder = (company: any) => {
    setSelectedMentee({
      id: company.id,
      name: company.founderName,
      company: company.company,
      avatar: company.founderAvatar,
      expertise: company.expertise
    });
    setIsSchedulingModalOpen(true);
  };

  // New action handlers
  const handleShowDetails = (company: any) => {
    setSelectedCompany(company);
    setIsDetailsModalOpen(true);
  };

  const handleShowReports = (company: any) => {
    setSelectedCompany(company);
    setIsReportsModalOpen(true);
  };

  const handleShowExitPlan = (company: any) => {
    setSelectedCompany(company);
    setIsExitPlanModalOpen(true);
  };

  const handleSendMessage = (company: any) => {
    setSelectedCompany(company);
    setIsMessageModalOpen(true);
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
    // Use real API data
    const filteredStartups = ventures.filter(venture => {
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

        {/* Featured Opportunities */}
        <Card>
          <CardHeader>
            <CardTitle>Featured Opportunities</CardTitle>
            <CardDescription>Handpicked startups matching your investment thesis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {investmentOpportunities.map((opportunity) => (
                <div key={opportunity.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start space-x-3 mb-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={opportunity.logo} />
                      <AvatarFallback>{opportunity.company[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{opportunity.company}</h4>
                      <p className="text-xs text-muted-foreground">{opportunity.sector} • {opportunity.stage}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      {opportunity.matched}% Match
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{opportunity.description}</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Seeking:</span>
                      <span className="font-medium">{opportunity.asking}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valuation:</span>
                      <span className="font-medium">{opportunity.valuation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Traction:</span>
                      <span className="font-medium text-xs">{opportunity.traction}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <button 
                      className="btn-chrome-secondary flex-1 text-xs py-1"
                      onClick={() => handleRequestPitch(opportunity.id)}
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      Request Pitch
                    </button>
                    <button 
                      className="btn-chrome-primary flex-1 text-xs py-1"
                      onClick={() => handleContactStartup(opportunity.id)}
                    >
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Contact
                    </button>
                  </div>
                </div>
              ))}
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
                          {venture.employees_count && (
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>{venture.employees_count}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {venture.status}
                      </Badge>
                  </div>

                  {/* Funding Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Seeking</p>
                      <p className="font-semibold">{venture.profile.fundingAmount}</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Stage</p>
                      <p className="font-semibold">{venture.profile.fundingNeeds}</p>
                    </div>
                  </div>

                  {/* Traction */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Traction</h4>
                    <p className="text-sm">{venture.profile.traction}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button 
                      className="btn-chrome-secondary flex-1"
                      onClick={() => handleRequestPitch(venture.id)}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Pitch
                    </button>
                    <button 
                      className="btn-chrome-primary flex-1"
                      onClick={() => handleContactStartup(venture.id)}
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
    return <MessagingSystem currentUser={frontendUser} onRefreshUnreadCount={onRefreshUnreadCount} />;
  };

  // Main render logic
  switch (activeView) {
    case 'overview':
      return (
        <div>
          {renderOverview()}
          {/* All Modals */}
          <SchedulingModal
            isOpen={isSchedulingModalOpen}
            onClose={() => {
              setIsSchedulingModalOpen(false);
              setSelectedMentee(null);
            }}
            mentee={selectedMentee}
            mentor={{
              name: user.full_name,
              avatar: undefined
            }}
          />
        </div>
      );
    case 'discover':
      return renderDiscover();
    case 'portfolio':
      return (
        <div>
          {renderPortfolio()}
          {/* All Modals */}
          <SchedulingModal
            isOpen={isSchedulingModalOpen}
            onClose={() => {
              setIsSchedulingModalOpen(false);
              setSelectedMentee(null);
            }}
            mentee={selectedMentee}
            mentor={{
              name: user.full_name,
              avatar: undefined
            }}
          />
          <CompanyDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={() => {
              setIsDetailsModalOpen(false);
              setSelectedCompany(null);
            }}
            company={selectedCompany}
          />
          <ReportsModal
            isOpen={isReportsModalOpen}
            onClose={() => {
              setIsReportsModalOpen(false);
              setSelectedCompany(null);
            }}
            company={selectedCompany}
          />
          <ExitPlanModal
            isOpen={isExitPlanModalOpen}
            onClose={() => {
              setIsExitPlanModalOpen(false);
              setSelectedCompany(null);
            }}
            company={selectedCompany}
          />
          <MessageModal
            isOpen={isMessageModalOpen}
            onClose={() => {
              setIsMessageModalOpen(false);
              setSelectedCompany(null);
            }}
            company={selectedCompany}
          />
        </div>
      );
    case 'messages':
      return renderMessages();
    default:
      return renderOverview();
  }
}