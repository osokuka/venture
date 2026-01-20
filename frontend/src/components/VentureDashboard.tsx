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
import { productService, type ProductCommitment } from '../services/productService';
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
  
  // State to track if we should auto-open pitch deck creation
  const [autoOpenPitchDeck, setAutoOpenPitchDeck] = useState<string | null>(null);
  
  // Get interested investors from pitch deck shares (if available)
  // IMPORTANT: All hooks must be declared before any early returns
  const [interestedInvestors, setInterestedInvestors] = useState<any[]>([]);
  const [isLoadingInterestedInvestors, setIsLoadingInterestedInvestors] = useState(false);
  
  // State for pitch deck analytics - MUST BE DECLARED BEFORE EARLY RETURNS
  const [pitchDeckAnalytics, setPitchDeckAnalytics] = useState<any>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  
  // State to track pitch deck shares (for showing breadcrumbs)
  // Map of investor user ID to share info { shared: boolean, viewed: boolean, sharedAt: date }
  const [pitchDeckShareStatus, setPitchDeckShareStatus] = useState<Record<string, { shared: boolean; viewed: boolean; sharedAt?: string }>>({});
  
  // State for recent activity feed
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  
  // State for investment commitments
  const [productCommitments, setProductCommitments] = useState<Record<string, any[]>>({});
  const [isLoadingCommitments, setIsLoadingCommitments] = useState<Record<string, boolean>>({});
  
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
      // Also fetch pitch deck share status
      fetchPitchDeckShareStatus();
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

  // Fetch commitments for approved products
  const fetchProductCommitments = async (productId: string) => {
    if (!validateUuid(productId)) {
      return;
    }
    setIsLoadingCommitments(prev => ({ ...prev, [productId]: true }));
    try {
      const data = await productService.getProductCommitments(productId);
      setProductCommitments(prev => ({
        ...prev,
        [productId]: data.results || []
      }));
    } catch (error: any) {
      console.error('Failed to fetch commitments:', error);
      setProductCommitments(prev => ({
        ...prev,
        [productId]: []
      }));
    } finally {
      setIsLoadingCommitments(prev => ({ ...prev, [productId]: false }));
    }
  };

  // Fetch commitments when products change
  useEffect(() => {
    if (activeView === 'overview' || activeView === 'products') {
      const approvedProducts = products.filter((p: any) => p.status === 'APPROVED' && p.is_active);
      approvedProducts.forEach((product: any) => {
        if (product.id && !productCommitments[product.id]) {
          fetchProductCommitments(product.id);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, products]);

  // Handler to accept commitment
  const handleAcceptCommitment = async (productId: string, commitmentId: string) => {
    if (!validateUuid(productId) || !validateUuid(commitmentId)) {
      toast.error("Invalid product or commitment ID");
      return;
    }

    try {
      await productService.acceptCommitment(productId, commitmentId);
      toast.success("Commitment accepted! Deal created successfully.");
      // Refresh commitments
      await fetchProductCommitments(productId);
    } catch (error: any) {
      console.error('Error accepting commitment:', error);
      toast.error(error.message || "Failed to accept commitment");
    }
  };

  // Handler to request renegotiation
  const handleRenegotiateCommitment = async (productId: string, commitmentId: string) => {
    if (!validateUuid(productId) || !validateUuid(commitmentId)) {
      toast.error("Invalid product or commitment ID");
      return;
    }

    const message = window.prompt("Please provide a message explaining the renegotiation terms:");
    if (!message || !message.trim()) {
      return; // User cancelled or didn't provide message
    }

    try {
      await productService.renegotiateCommitment(productId, commitmentId, message.trim());
      toast.success("Renegotiation request sent to investor.");
      // Refresh commitments
      await fetchProductCommitments(productId);
    } catch (error: any) {
      console.error('Error requesting renegotiation:', error);
      toast.error(error.message || "Failed to request renegotiation");
    }
  };

  // Fetch unread message count with rate limit handling
  useEffect(() => {
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

  // Fetch interested investors from pitch deck shares
  // IMPORTANT: This useEffect must be declared before early returns
  useEffect(() => {
    const fetchInterestedInvestors = async () => {
      // Only fetch if we're on overview view
      if (activeView !== 'overview') {
        setInterestedInvestors([]); // Clear when not on overview
        return;
      }

      // Calculate pitch deck metrics inside useEffect to avoid dependency issues
      const approvedProducts = products.filter((p: any) => p.status === 'APPROVED' && p.is_active);
      if (approvedProducts.length === 0) {
        setInterestedInvestors([]); // No products = no interested investors
        return;
      }
      
      const latestProduct = approvedProducts[0];
      const pitchDeck = latestProduct?.documents?.find((doc: any) => doc.document_type === 'PITCH_DECK');
      
      if (!pitchDeck || !latestProduct) {
        setInterestedInvestors([]); // No pitch deck = no interested investors
        return;
      }

      setIsLoadingInterestedInvestors(true);
      try {
        const shares = await productService.listPitchDeckShares(latestProduct.id, pitchDeck.id);
        // Map shares to investor info
        const investorList = await Promise.all(
          shares.map(async (share: any) => {
            try {
              // Get investor profile details
              const investor = investors.find((inv: any) => inv.user === share.investor_id || inv.id === share.investor_id);
              if (investor) {
                return {
                  id: investor.user || investor.id,
                  name: investor.full_name || investor.user_name,
                  firm: investor.organization_name,
                  checkSize: investor.average_ticket_size,
                  status: share.status || 'interested',
                  lastContact: share.shared_at ? new Date(share.shared_at).toLocaleDateString() : 'Recently',
                  pitchViewed: share.viewed_at ? true : false,
                };
              }
              return null;
            } catch (err) {
              console.error('Failed to get investor details:', err);
              return null;
            }
          })
        );
        setInterestedInvestors(investorList.filter((inv: any) => inv !== null));
      } catch (error) {
        console.error('Failed to fetch pitch deck shares:', error);
        setInterestedInvestors([]); // Set empty array on error
      } finally {
        setIsLoadingInterestedInvestors(false);
      }
    };

    fetchInterestedInvestors();
  }, [activeView, products, investors]);

  // Fetch analytics when products change - MUST BE BEFORE EARLY RETURNS
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (activeView !== 'overview') {
        return; // Only fetch analytics on overview
      }

      const approvedProducts = products.filter((p: any) => p.status === 'APPROVED' && p.is_active);
      if (approvedProducts.length === 0) {
        setPitchDeckAnalytics(null);
        return;
      }
      
      const latestProduct = approvedProducts[0];
      const pitchDeck = latestProduct?.documents?.find((doc: any) => doc.document_type === 'PITCH_DECK');
      
      if (!pitchDeck || !latestProduct) {
        setPitchDeckAnalytics(null);
        return;
      }

      setIsLoadingAnalytics(true);
      try {
        const analytics = await productService.getPitchDeckAnalytics(latestProduct.id, pitchDeck.id);
        setPitchDeckAnalytics(analytics);
      } catch (error) {
        console.error('Failed to fetch pitch deck analytics:', error);
        setPitchDeckAnalytics(null);
      } finally {
        setIsLoadingAnalytics(false);
      }
    };

    fetchAnalytics();
  }, [activeView, products]);

  // Fetch recent activity for overview - MUST BE BEFORE EARLY RETURNS
  useEffect(() => {
    const fetchRecentActivity = async () => {
      if (activeView !== 'overview') {
        setRecentActivity([]);
        return;
      }

      try {
        const activities: any[] = [];
        
        // Get approved products to check for approval events
        const approvedProducts = products.filter((p: any) => p.status === 'APPROVED' && p.is_active);
        
        // Add product approval activities
        approvedProducts.forEach((product: any) => {
          if (product.approved_at) {
            const approvedDate = new Date(product.approved_at);
            activities.push({
              id: `approval-${product.id}`,
              type: 'approval',
              title: 'Pitch Deck Approved',
              description: `Your pitch deck "${product.name || product.company_name}" was approved by admin`,
              time: getTimeAgo(approvedDate),
              timestamp: approvedDate,
              icon: CheckCircle,
              color: 'text-green-600',
              bgColor: 'bg-green-100',
            });
          }
        });
        
        // Get pitch deck shares and edits
        if (approvedProducts.length > 0) {
          const latestProduct = approvedProducts[0];
          const pitchDeck = latestProduct?.documents?.find((doc: any) => doc.document_type === 'PITCH_DECK' && doc.is_active !== false);
          
          if (pitchDeck) {
            // Add pitch deck edit activity if edited recently
            if (pitchDeck.updated_at) {
              const updatedDate = new Date(pitchDeck.updated_at);
              const uploadedDate = pitchDeck.uploaded_at ? new Date(pitchDeck.uploaded_at) : null;
              
              // Only show edit activity if updated_at is different from uploaded_at (means it was edited)
              if (!uploadedDate || updatedDate.getTime() !== uploadedDate.getTime()) {
                activities.push({
                  id: `edit-${pitchDeck.id}`,
                  type: 'edit',
                  title: 'Pitch Deck Updated',
                  description: `You updated your pitch deck metadata`,
                  time: getTimeAgo(updatedDate),
                  timestamp: updatedDate,
                  icon: FileText,
                  color: 'text-purple-600',
                  bgColor: 'bg-purple-100',
                });
              }
            }
            
            // Get share activities
            try {
              const shares = await productService.listPitchDeckShares(latestProduct.id, pitchDeck.id);
              
              // Add share activities
              shares.forEach((share: any) => {
                const sharedDate = new Date(share.shared_at);
                
                activities.push({
                  id: `share-${share.id}`,
                  type: 'share',
                  title: 'Pitch Deck Shared',
                  description: `Shared with ${share.investor_name || share.investor_email || 'investor'}`,
                  time: getTimeAgo(sharedDate),
                  timestamp: sharedDate,
                  icon: Send,
                  color: 'text-blue-600',
                  bgColor: 'bg-blue-100',
                  viewed: !!share.viewed_at,
                  viewedAt: share.viewed_at,
                });
                
                // Add view activity if viewed
                if (share.viewed_at) {
                  const viewedDate = new Date(share.viewed_at);
                  activities.push({
                    id: `view-${share.id}`,
                    type: 'view',
                    title: 'Pitch Deck Viewed',
                    description: `${share.investor_name || share.investor_email || 'Investor'} viewed your pitch deck`,
                    time: getTimeAgo(viewedDate),
                    timestamp: viewedDate,
                    icon: Eye,
                    color: 'text-green-600',
                    bgColor: 'bg-green-100',
                  });
                }
              });
            } catch (err) {
              console.error('Failed to fetch shares for activity:', err);
            }
          }
        }
        
        // Sort activities by timestamp (most recent first)
        activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        // Limit to 3 most recent activities
        setRecentActivity(activities.slice(0, 3));
      } catch (error) {
        console.error('Failed to fetch recent activity:', error);
        setRecentActivity([]);
      }
    };

    fetchRecentActivity();
  }, [activeView, products]);

  // Helper function to calculate time ago
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    }
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  };

  const fetchInvestors = async () => {
    setIsLoadingInvestors(true);
    try {
      const data = await investorService.getPublicInvestors({
        search: searchTerm || undefined,
        stage: filterStage !== 'all' ? filterStage : undefined,
      });
      // Handle both array and paginated response
      const investorsList = Array.isArray(data) ? data : ((data as any)?.results || (data as any)?.data || []);
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
      // Ensure data is always an array
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      // Ensure products is always an array even on error
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Fetch pitch deck share status for all investors
  const fetchPitchDeckShareStatus = async () => {
    try {
      // Get the active pitch deck (constraint: only one active pitch deck)
      const productsList = Array.isArray(products) && products.length > 0 ? products : await productService.getMyProducts();
      const productsArray = Array.isArray(productsList) ? productsList : [];
      
      const approvedProduct = productsArray.find((p: any) => 
        p.status === 'APPROVED' && 
        p.is_active && 
        p.documents && 
        Array.isArray(p.documents) && 
        p.documents.length > 0
      );
      
      if (!approvedProduct) {
        setPitchDeckShareStatus({});
        return;
      }
      
      // Find the active pitch deck
      const pitchDeck = approvedProduct.documents.find((doc: any) => 
        doc.document_type === 'PITCH_DECK' && doc.is_active !== false
      );
      
      if (!pitchDeck) {
        setPitchDeckShareStatus({});
        return;
      }
      
      // Fetch shares for this pitch deck
      const shares = await productService.listPitchDeckShares(approvedProduct.id, pitchDeck.id);
      
      // Build a map of investor user ID to share status
      const statusMap: Record<string, { shared: boolean; viewed: boolean; sharedAt?: string }> = {};
      shares.forEach((share: any) => {
        const investorUserId = share.investor || share.investor_id;
        if (investorUserId) {
          statusMap[investorUserId] = {
            shared: true,
            viewed: !!share.viewed_at,
            sharedAt: share.shared_at,
          };
        }
      });
      
      setPitchDeckShareStatus(statusMap);
    } catch (error) {
      console.error('Failed to fetch pitch deck share status:', error);
      setPitchDeckShareStatus({});
    }
  };

  // Calculate funding info from pitch deck documents
  const getFundingFromProducts = () => {
    const approvedProducts = products.filter((p: any) => p.status === 'APPROVED' && p.is_active);
    if (approvedProducts.length === 0) {
      return { fundingGoal: '$0', fundingRaised: '$0', fundingProgress: 0, valuation: '$0' };
    }
    
    const latestProduct = approvedProducts[0];
    const pitchDeck = latestProduct?.documents?.find((doc: any) => doc.document_type === 'PITCH_DECK');
    
    if (!pitchDeck) {
      return { fundingGoal: '$0', fundingRaised: '$0', fundingProgress: 0, valuation: '$0' };
    }
    
    const fundingAmount = pitchDeck.funding_amount || '$0';
    return {
      fundingGoal: fundingAmount,
      fundingRaised: '$0',
      fundingProgress: 0,
      valuation: '$0',
    };
  };

  // Calculate pitch deck metrics from products
  const getPitchDeckMetrics = () => {
    const approvedProducts = products.filter((p: any) => p.status === 'APPROVED' && p.is_active);
    if (approvedProducts.length === 0) {
      return {
        views: 0,
        downloads: 0,
        uniqueViewers: 0,
        averageViewTime: '0m',
        lastUpdated: 'Never',
        version: '1.0',
        hasPitchDeck: false,
      };
    }
    
    const latestProduct = approvedProducts[0];
    const pitchDeck = latestProduct?.documents?.find((doc: any) => doc.document_type === 'PITCH_DECK');
    
    if (!pitchDeck) {
      return {
        views: 0,
        downloads: 0,
        uniqueViewers: 0,
        averageViewTime: '0m',
        lastUpdated: 'Never',
        version: '1.0',
        hasPitchDeck: false,
      };
    }
    
    // Format last updated date
    let lastUpdated = 'Never';
    if (pitchDeck.updated_at) {
      const date = new Date(pitchDeck.updated_at);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        lastUpdated = 'Today';
      } else if (diffDays === 1) {
        lastUpdated = 'Yesterday';
      } else if (diffDays < 7) {
        lastUpdated = `${diffDays} days ago`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        lastUpdated = `${weeks} week${weeks > 1 ? 's' : ''} ago`;
      } else {
        const months = Math.floor(diffDays / 30);
        lastUpdated = `${months} month${months > 1 ? 's' : ''} ago`;
      }
    }
    
    return {
      views: pitchDeckAnalytics?.total_views || 0,
      downloads: pitchDeckAnalytics?.total_downloads || 0,
      uniqueViewers: pitchDeckAnalytics?.unique_viewers || 0,
      averageViewTime: '0m',
      lastUpdated,
      version: '1.0',
      hasPitchDeck: true,
      productId: latestProduct.id,
      docId: pitchDeck.id,
    };
  };

  // Handle profile and settings views
  if (activeView === 'edit-profile') {
    return <EditProfile user={user} onProfileUpdate={onProfileUpdate} onCancel={() => onViewChange?.('profile')} />;
  }

  if (activeView === 'settings') {
    return <Settings user={user} />;
  }

  if (activeView === 'profile') {
    // Handler to navigate to pitch deck creation
    const handleNavigateToPitchDecks = async () => {
      // Fetch products to find the first one (or create if none exist)
      try {
        const productsData = await productService.getMyProducts();
        const productsArray = Array.isArray(productsData) ? productsData : [];
        
        if (productsArray.length > 0) {
          // Use the first product (prefer approved/active, but use any if available)
          const firstProduct = productsArray.find((p: any) => p.status === 'APPROVED' && p.is_active) || productsArray[0];
          // Navigate to products view and auto-open manage dialog with documents tab
          setAutoOpenPitchDeck(firstProduct.id);
          onViewChange?.('products');
        } else {
          // No products exist - navigate to products view to create one first
          onViewChange?.('products');
          toast.info('Please create a product first, then you can add pitch decks.');
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
        // Still navigate to products view
        onViewChange?.('products');
      }
    };
    
    return (
      <UserProfile 
        user={user} 
        onEdit={() => onViewChange?.('edit-profile')} 
        onNavigateToPitchDecks={handleNavigateToPitchDecks}
        isOwnProfile={true} 
      />
    );
  }

  // Use the helper functions defined above
  const fundingData = getFundingFromProducts();
  const pitchDeckMetrics = getPitchDeckMetrics();

  // Calculate stats from real data - only show interested investors if there are products with pitch decks that have been shared
  const stats = {
    fundingGoal: fundingData.fundingGoal,
    fundingRaised: fundingData.fundingRaised,
    fundingProgress: fundingData.fundingProgress,
    investors: interestedInvestors.length, // Use actual interested investors count (will be 0 if no products/pitch decks)
    mentors: mentors.length,
    pitchViews: pitchDeckMetrics.views,
    totalMessages: unreadCount,
    valuation: fundingData.valuation,
    products: products.length,
  };

  // Current mentors - would need mentoring relationships API (not implemented yet)
  const currentMentors: any[] = [];
  
  // Fundraising metrics - would need metrics API (not implemented yet)
  const fundraisingMetrics: any[] = [];
  
  // Upcoming meetings - would need calendar/meetings API (not implemented yet)
  const upcomingMeetings: any[] = [];

  // Helper function to check if venture can contact investors
  const canContactInvestors = (): { canContact: boolean; reason?: string } => {
    // Check if user has at least one approved and active product (required for IsApprovedUser permission)
    const approvedProducts = products.filter((p: any) => p.status === 'APPROVED' && p.is_active);
    if (approvedProducts.length === 0) {
      return {
        canContact: false,
        reason: 'You need at least one approved product to contact investors. Please submit and get your product approved first.'
      };
    }
    return { canContact: true };
  };

  // Helper function to check if a specific investor can be contacted
  // Accepts both InvestorProfile and interestedInvestors structure
  const canContactInvestor = (investor: InvestorProfile | any): { canContact: boolean; reason?: string } => {
    // First check if venture can contact any investors
    const ventureCheck = canContactInvestors();
    if (!ventureCheck.canContact) {
      return ventureCheck;
    }

    // Check if investor is approved (for InvestorProfile objects from API)
    // interestedInvestors might not have status field, so we check if it exists
    if (investor.status && investor.status !== 'APPROVED') {
      return {
        canContact: false,
        reason: 'This investor profile is not yet approved and cannot be contacted.'
      };
    }

    // Note: Visibility check (visible_to_ventures) is handled server-side
    // If investor is not visible, the API will return 403, but we can't check this client-side
    // without making an API call. The server will handle this.

    return { canContact: true };
  };

  const handleContactInvestor = async (investorId: string, investorName?: string) => {
    // Security: Validate UUID format
    if (!validateUuid(investorId)) {
      toast.error("Invalid investor ID");
      return;
    }

    // Check if venture can contact investors
    const ventureCheck = canContactInvestors();
    if (!ventureCheck.canContact) {
      toast.error(ventureCheck.reason || 'You cannot contact investors at this time.');
      return;
    }

    // Find the investor to check their status
    const investor = investors.find((inv: InvestorProfile) => (inv.user || inv.id) === investorId);
    if (investor) {
      const investorCheck = canContactInvestor(investor);
      if (!investorCheck.canContact) {
        toast.error(investorCheck.reason || 'This investor cannot be contacted.');
        return;
      }
    }
    
    // Set the selected user ID and navigate to messages view
    // Conversation will be created lazily when first message is sent
    setSelectedMessagingUserId(investorId);
    setSelectedMessagingUserName(investorName);
    setSelectedMessagingUserRole('investor');
    onViewChange?.('messages');
  };

  const handleSharePitch = async (investorId: string, productId?: string, docId?: string) => {
    // Security: Validate UUID
    if (!validateUuid(investorId)) {
      toast.error("Invalid investor ID");
      return;
    }

    // Check if venture can contact investors (same constraints as messaging)
    const ventureCheck = canContactInvestors();
    if (!ventureCheck.canContact) {
      toast.error(ventureCheck.reason || 'You cannot share pitch decks at this time.');
      return;
    }

    // Find the investor to check their status and get their name
    const investor = investors.find((inv: InvestorProfile) => (inv.user || inv.id) === investorId);
    const investorName = investor ? (investor.full_name || investor.user_name || 'investor') : 'investor';
    
    if (investor) {
      const investorCheck = canContactInvestor(investor);
      if (!investorCheck.canContact) {
        toast.error(investorCheck.reason || 'This investor cannot receive pitch decks.');
        return;
      }
    }

    // If productId and docId not provided, try to get from products
    let targetProductId = productId;
    let targetDocId = docId;
    let productName = '';

    if (!targetProductId || !targetDocId) {
      // Ensure products is an array and fetch if needed
      let productsList = Array.isArray(products) ? products : [];
      
      // If products not loaded, fetch them
      if (productsList.length === 0) {
        try {
          const fetchedProducts = await productService.getMyProducts();
          productsList = Array.isArray(fetchedProducts) ? fetchedProducts : [];
          setProducts(productsList);
        } catch (err: any) {
          console.error('Failed to fetch products:', err);
          toast.error('Failed to load products');
          return;
        }
      }
      
      // CONSTRAINT: Only find ACTIVE pitch decks from approved products
      // A venture can only share their ONE active pitch deck
      const approvedProduct = productsList.find((p: any) => 
        p.status === 'APPROVED' && 
        p.is_active && 
        p.documents && 
        Array.isArray(p.documents) && 
        p.documents.length > 0
      );
      
      if (approvedProduct) {
        targetProductId = approvedProduct.id;
        productName = approvedProduct.company_name || approvedProduct.product_name || 'your product';
        
        // Only find ACTIVE pitch decks (not inactive ones)
        const pitchDeck = approvedProduct.documents.find((doc: any) => 
          doc.document_type === 'PITCH_DECK' && doc.is_active !== false
        );
        
        if (pitchDeck) {
          targetDocId = pitchDeck.id;
        }
      }
    }

    if (!targetProductId || !targetDocId) {
      toast.error("No active pitch deck available to share. Please ensure your product is approved and has an active pitch deck.");
      return;
    }

    // Security: Validate UUIDs
    if (!validateUuid(targetProductId) || !validateUuid(targetDocId)) {
      toast.error("Invalid product or document ID");
      return;
    }

    try {
      // Show loading toast
      const loadingToast = toast.loading(`Sharing pitch deck with ${investorName}...`);
      
      await productService.sharePitchDeck(targetProductId, targetDocId, investorId);
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success(`✓ Pitch deck successfully shared with ${investorName}!`, {
        description: productName ? `They now have access to "${productName}"` : 'They can now view and download your pitch deck',
        duration: 5000,
      });
      
      // Refresh products and investors to update share status indicators
      fetchProducts();
      fetchInvestors();
      fetchPitchDeckShareStatus(); // Refresh share status breadcrumbs
    } catch (err: any) {
      console.error('Failed to share pitch deck:', err);
      toast.error(err.message || 'Failed to share pitch deck');
    }
  };

  const handleScheduleMeeting = (investorId: string) => {
    toast.success("Meeting invitation sent!");
  };

  const handleConnectMentor = async (mentorUserId: string, mentorName?: string) => {
    // Security: Validate UUID format
    if (!validateUuid(mentorUserId)) {
      toast.error("Invalid mentor ID");
      return;
    }
    
    // Set the selected user ID and navigate to messages view
    // Conversation will be created lazily when first message is sent
    setSelectedMessagingUserId(mentorUserId);
    setSelectedMessagingUserName(mentorName);
    setSelectedMessagingUserRole('mentor');
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
                <p className="text-sm font-medium text-gray-600">Funding Progress</p>
                <p className="text-2xl font-bold text-gray-900">{stats.fundingRaised}</p>
                <p className="text-xs text-gray-600">of {stats.fundingGoal}</p>
              </div>
            </div>
            <div className="mt-4">
              <Progress value={stats.fundingProgress} className="h-2" />
              <p className="text-xs text-gray-600 mt-1">{stats.fundingProgress}% complete</p>
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
                <p className="text-sm font-medium text-gray-600">Interested Investors</p>
                <p className="text-2xl font-bold text-gray-900">{stats.investors}</p>
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
                <p className="text-sm font-medium text-gray-600">Mentors</p>
                <p className="text-2xl font-bold text-gray-900">{stats.mentors}</p>
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
                <p className="text-sm font-medium text-gray-600">Pitch Views</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pitchViews}</p>
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
                      <span className="text-gray-600">{metric.value}/{metric.target}</span>
                    </div>
                    <Progress 
                      value={(metric.value / metric.target) * 100} 
                      className="h-2"
                    />
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-600 text-sm">
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
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-600 mt-1">{activity.time}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ArrowUpRight className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-600">
                  <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
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
                        <p className="text-sm text-gray-600">{investor.firm}</p>
                        <p className="text-xs text-gray-600">{investor.checkSize}</p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={investor.status === 'interested' ? 'default' : 
                                  investor.status === 'meeting_scheduled' ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {investor.status.replace('_', ' ')}
                        </Badge>
                        <p className="text-xs text-gray-600 mt-1">{investor.lastContact}</p>
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
                <div className="text-center py-8 text-gray-600">
                  <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
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

      {/* Investment Commitments */}
      {(() => {
        const approvedProducts = products.filter((p: any) => p.status === 'APPROVED' && p.is_active);
        const allCommitments: ProductCommitment[] = [];
        approvedProducts.forEach((product: any) => {
          const commitments = productCommitments[product.id] || [];
          allCommitments.push(...commitments);
        });
        const pendingCommitments = allCommitments.filter(c => c.venture_response === 'PENDING');
        const acceptedDeals = allCommitments.filter(c => c.is_deal);
        
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5" />
                <span>Investment Commitments</span>
                {pendingCommitments.length > 0 && (
                  <Badge variant="default" className="bg-amber-600 ml-2">
                    {pendingCommitments.length} Pending
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Review and manage investor commitments. Accept to create deals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {approvedProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-sm">No approved products yet</p>
                  <p className="text-xs mt-1">Approved products will show investment commitments here</p>
                </div>
              ) : allCommitments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-sm">No investment commitments yet</p>
                  <p className="text-xs mt-1">When investors commit to invest, they will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Pending Commitments */}
                  {pendingCommitments.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-amber-600">Pending Response ({pendingCommitments.length})</h4>
                      {pendingCommitments.map((commitment) => (
                        <div key={commitment.commitment_id} className="p-4 border border-amber-200 bg-amber-50/50 rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h5 className="font-semibold">{commitment.investor_name}</h5>
                                {commitment.investor_organization && (
                                  <span className="text-sm text-muted-foreground">• {commitment.investor_organization}</span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{commitment.investor_email}</p>
                              {commitment.amount && (
                                <p className="text-lg font-bold text-green-600">
                                  ${parseFloat(commitment.amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </p>
                              )}
                              {commitment.message && (
                                <div className="mt-2 p-2 bg-white rounded border">
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Investor Message:</p>
                                  <p className="text-sm">{commitment.message}</p>
                                </div>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                Committed {commitment.committed_at ? new Date(commitment.committed_at).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleAcceptCommitment(
                                approvedProducts.find((p: any) => productCommitments[p.id]?.some((c: ProductCommitment) => c.commitment_id === commitment.commitment_id))?.id || '',
                                commitment.commitment_id
                              )}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Accept (Create Deal)
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRenegotiateCommitment(
                                approvedProducts.find((p: any) => productCommitments[p.id]?.some((c: ProductCommitment) => c.commitment_id === commitment.commitment_id))?.id || '',
                                commitment.commitment_id
                              )}
                            >
                              <AlertCircle className="w-4 h-4 mr-2" />
                              Request Renegotiation
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Accepted Deals */}
                  {acceptedDeals.length > 0 && (
                    <div className="space-y-3 mt-6">
                      <h4 className="text-sm font-semibold text-green-600">Accepted Deals ({acceptedDeals.length})</h4>
                      {acceptedDeals.map((commitment) => (
                        <div key={commitment.commitment_id} className="p-4 border border-green-200 bg-green-50/50 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h5 className="font-semibold">{commitment.investor_name}</h5>
                                <Badge variant="default" className="bg-green-600">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Deal Accepted
                                </Badge>
                              </div>
                              {commitment.amount && (
                                <p className="text-lg font-bold text-green-600">
                                  ${parseFloat(commitment.amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </p>
                              )}
                              {commitment.venture_response_message && (
                                <p className="text-sm text-muted-foreground mt-2 italic">"{commitment.venture_response_message}"</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                Accepted {commitment.venture_response_at ? new Date(commitment.venture_response_at).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Renegotiation Requests */}
                  {allCommitments.filter(c => c.venture_response === 'RENEGOTIATE').length > 0 && (
                    <div className="space-y-3 mt-6">
                      <h4 className="text-sm font-semibold text-orange-600">Renegotiation Requests</h4>
                      {allCommitments.filter(c => c.venture_response === 'RENEGOTIATE').map((commitment) => (
                        <div key={commitment.commitment_id} className="p-4 border border-orange-200 bg-orange-50/50 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h5 className="font-semibold">{commitment.investor_name}</h5>
                                <Badge variant="outline" className="border-orange-500 text-orange-600">
                                  Renegotiation Requested
                                </Badge>
                              </div>
                              {commitment.venture_response_message && (
                                <p className="text-sm text-muted-foreground mt-2">"{commitment.venture_response_message}"</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                Requested {commitment.venture_response_at ? new Date(commitment.venture_response_at).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

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
              {currentMentors.length > 0 ? (
                <>
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
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-sm">No active mentoring relationships yet</p>
                  <p className="text-xs mt-1">Connect with mentors below to start building relationships.</p>
                </div>
              )}
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
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {investor.stage_preferences?.[0] || 'Various'}
                        </Badge>
                        {investor.status === 'SUBMITTED' && (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300">
                            Pending Approval
                          </Badge>
                        )}
                        {investor.status === 'APPROVED' && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                            Approved
                          </Badge>
                        )}
                      </div>
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

                    {/* Share Status Breadcrumb */}
                    {(() => {
                      const investorUserId = investor.user || investor.id;
                      const shareStatus = pitchDeckShareStatus[investorUserId];
                      
                      if (shareStatus?.shared) {
                        return (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-blue-600" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-blue-900">Pitch Deck Shared</p>
                                <div className="flex items-center space-x-3 mt-1">
                                  <p className="text-xs text-blue-700">
                                    {shareStatus.sharedAt 
                                      ? new Date(shareStatus.sharedAt).toLocaleDateString()
                                      : 'Recently'}
                                  </p>
                                  {shareStatus.viewed && (
                                    <div className="flex items-center space-x-1">
                                      <Eye className="w-3 h-3 text-green-600" />
                                      <span className="text-xs font-medium text-green-700">Viewed</span>
                                    </div>
                                  )}
                                  {!shareStatus.viewed && (
                                    <div className="flex items-center space-x-1">
                                      <Clock className="w-3 h-3 text-amber-600" />
                                      <span className="text-xs text-amber-700">Not viewed yet</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Actions */}
                    <div className="flex flex-col space-y-2">
                      {/* Breadcrumb message if contact is disabled */}
                      {(() => {
                        const contactCheck = canContactInvestor(investor);
                        if (!contactCheck.canContact) {
                          return (
                            <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2 flex items-start space-x-2">
                              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <span>{contactCheck.reason}</span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      <div className="flex space-x-2">
                        {(() => {
                          const contactCheck = canContactInvestor(investor);
                          const isDisabled = !contactCheck.canContact || (!investor.user && !investor.id);
                          return (
                            <button 
                              className={`btn-chrome-secondary flex-1 text-sm py-2 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                              onClick={() => {
                                const userId = investor.user || investor.id;
                                if (userId) {
                                  handleContactInvestor(userId, investor.name || investor.full_name);
                                } else {
                                  toast.error('Invalid investor user ID');
                                }
                              }}
                              disabled={isDisabled}
                              title={!contactCheck.canContact ? contactCheck.reason : undefined}
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Contact
                            </button>
                          );
                        })()}
                        {(() => {
                          const contactCheck = canContactInvestor(investor);
                          const isDisabled = !contactCheck.canContact || (!investor.user && !investor.id);
                          return (
                            <button 
                              className={`btn-chrome-primary flex-1 text-sm py-2 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                              onClick={() => {
                                const userId = investor.user || investor.id;
                                if (userId) {
                                  // Security: Validate UUID
                                  if (validateUuid(userId)) {
                                    handleSharePitch(userId);
                                  } else {
                                    toast.error("Invalid investor ID");
                                  }
                                } else {
                                  toast.error('Invalid investor user ID');
                                }
                              }}
                              disabled={isDisabled}
                              title={!contactCheck.canContact ? contactCheck.reason : undefined}
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Share Pitch
                            </button>
                          );
                        })()}
                      </div>
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

  const renderPitch = () => {
    // Show all pitch decks using ProductManagement component
    // This allows users to view, manage, and track ALL their pitch decks in one place
    return (
      <ProductManagement 
        user={user} 
        defaultTab='documents'
      />
    );
  };

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
                <div className="flex flex-col space-y-2">
                  {/* Breadcrumb message if contact is disabled */}
                  {(() => {
                    const contactCheck = canContactInvestor(investor);
                    if (!contactCheck.canContact) {
                      return (
                        <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2 flex items-start space-x-2">
                          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{contactCheck.reason}</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  <div className="flex space-x-2">
                    {(() => {
                      const contactCheck = canContactInvestor(investor);
                      const isDisabled = !contactCheck.canContact;
                      return (
                        <button 
                          className={`btn-chrome-secondary text-sm px-3 py-1 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => handleContactInvestor(investor.id, investor.name || investor.full_name)}
                          disabled={isDisabled}
                          title={!contactCheck.canContact ? contactCheck.reason : undefined}
                        >
                          Contact
                        </button>
                      );
                    })()}
                    <button 
                      className="btn-chrome-primary text-sm px-3 py-1"
                      onClick={() => handleScheduleMeeting(investor.id)}
                    >
                      Schedule
                    </button>
                  </div>
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
          {(() => {
            // Get funding info from pitch deck
            const approvedProducts = products.filter((p: any) => p.status === 'APPROVED' && p.is_active);
            const latestProduct = approvedProducts.length > 0 ? approvedProducts[0] : null;
            const pitchDeck = latestProduct?.documents?.find((doc: any) => doc.document_type === 'PITCH_DECK');
            
            if (!pitchDeck || !pitchDeck.funding_amount) {
              return (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-sm">No fundraising information available</p>
                  <p className="text-xs mt-1">Add funding details to your pitch deck to see timeline</p>
                </div>
              );
            }

            // Calculate dates from product submission/approval
            const submittedDate = latestProduct?.submitted_at ? new Date(latestProduct.submitted_at) : null;
            const approvedDate = latestProduct?.approved_at ? new Date(latestProduct.approved_at) : null;
            const now = new Date();
            
            return (
              <div className="space-y-4">
                {approvedDate && (
                  <div className="flex items-start space-x-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <h4 className="font-medium text-green-900">Product Approved</h4>
                      <p className="text-sm text-green-700">Your product was approved and is now visible to investors</p>
                      <p className="text-xs text-green-600">
                        {(() => {
                          const diffDays = Math.floor((now.getTime() - approvedDate.getTime()) / (1000 * 60 * 60 * 24));
                          if (diffDays === 0) return 'Today';
                          if (diffDays === 1) return 'Yesterday';
                          return `${diffDays} days ago`;
                        })()}
                      </p>
                    </div>
                  </div>
                )}
                
                {submittedDate && !approvedDate && (
                  <div className="flex items-start space-x-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <h4 className="font-medium text-yellow-900">Awaiting Approval</h4>
                      <p className="text-sm text-yellow-700">Your product is pending admin approval</p>
                      <p className="text-xs text-yellow-600">
                        {(() => {
                          const diffDays = Math.floor((now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24));
                          if (diffDays === 0) return 'Submitted today';
                          return `Submitted ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
                        })()}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start space-x-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900">Fundraising Goal</h4>
                    <p className="text-sm text-blue-700">Seeking {pitchDeck.funding_amount}</p>
                    <p className="text-xs text-blue-600">{pitchDeck.funding_stage || 'Funding stage not specified'}</p>
                  </div>
                </div>
                
                {pitchDeck.use_of_funds && (
                  <div className="flex items-start space-x-4 p-3 border rounded-lg">
                    <div className="w-3 h-3 bg-gray-300 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <h4 className="font-medium text-muted-foreground">Use of Funds</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">{pitchDeck.use_of_funds}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
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
        // Reset autoOpenPitchDeck after using it to prevent re-opening on re-renders
        const productIdToOpen = autoOpenPitchDeck;
        if (autoOpenPitchDeck) {
          // Clear the flag after a short delay to allow the component to mount
          setTimeout(() => setAutoOpenPitchDeck(null), 100);
        }
        return (
          <ProductManagement 
            user={user} 
            defaultTab={productIdToOpen ? 'documents' : 'company'}
            autoOpenProductId={productIdToOpen || undefined}
          />
        );
        
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