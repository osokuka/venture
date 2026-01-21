import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
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
import { toast } from 'sonner';
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
import { investorService, type SharedPitchDeck, type PortfolioInvestment } from '../services/investorService';
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
  // IMPORTANT: All hooks must be called unconditionally before any early returns
  // This follows React's Rules of Hooks
  const navigate = useNavigate();
  const location = useLocation(); // Track route changes to force data refetch
  const [searchParams] = useSearchParams();
  const [ventures, setVentures] = useState<VentureProduct[]>([]);
  const [sharedPitchDecks, setSharedPitchDecks] = useState<SharedPitchDeck[]>([]);
  const [isLoadingSharedPitchDecks, setIsLoadingSharedPitchDecks] = useState(false);
  const [portfolioInvestments, setPortfolioInvestments] = useState<PortfolioInvestment[]>([]);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingVentures, setIsLoadingVentures] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [filterFunding, setFilterFunding] = useState('all');
  const [profileRefreshTrigger, setProfileRefreshTrigger] = useState(0);
  
  // Refs to track last fetch time and prevent duplicate/rapid API calls
  // This prevents rate limiting issues when navigating between routes
  const lastFetchRef = useRef<{ [key: string]: number }>({});
  const isFetchingRef = useRef<{ [key: string]: boolean }>({});
  const lastPathnameRef = useRef<{ [key: string]: string }>({}); // Track last pathname per fetch key to detect route changes
  const lastActiveViewRef = useRef<string>(''); // Track last activeView to detect tab switches
  const completionInfoRef = useRef<HTMLDivElement | null>(null); // Anchor for deal completion info
  const [showCompletionInfo, setShowCompletionInfo] = useState(false); // Toggle completion info visibility
  
  // Get selected user info from URL params (for messaging)
  const selectedUserId = searchParams.get('userId');
  const selectedUserName = searchParams.get('userName');
  const selectedUserRole = searchParams.get('userRole');

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

  // Memoize fetchSharedPitchDecks to prevent unnecessary re-renders
  const fetchSharedPitchDecks = useCallback(async () => {
    const fetchKey = 'sharedPitchDecks';
    const now = Date.now();
    const lastFetch = lastFetchRef.current[fetchKey] || 0;
    const minInterval = 2000; // Minimum 2 seconds between fetches to prevent rate limiting
    
    // Skip if already fetching or if called too recently
    if (isFetchingRef.current[fetchKey] || (now - lastFetch < minInterval)) {
      return;
    }
    
    isFetchingRef.current[fetchKey] = true;
    lastFetchRef.current[fetchKey] = now;
    setIsLoadingSharedPitchDecks(true);
    
    try {
      const data = await investorService.getSharedPitchDecks();
      // Ensure data is always an array - handle all possible response formats
      let sharesArray: SharedPitchDeck[] = [];
      if (Array.isArray(data)) {
        sharesArray = data;
      } else if (data && typeof data === 'object') {
        sharesArray = Array.isArray(data.results) ? data.results : 
                     Array.isArray(data.data) ? data.data : 
                     Array.isArray(data.items) ? data.items : [];
      }
      // Validate that all items are valid SharedPitchDeck objects
      const validShares = sharesArray.filter((share: any) => 
        share && 
        typeof share === 'object' && 
        share.share_id && 
        share.product_id && 
        share.document_id
      );
      setSharedPitchDecks(validShares);
    } catch (error: any) {
      console.error('Failed to fetch shared pitch decks:', error);
      // Handle rate limiting gracefully - don't spam errors
      if (error?.response?.status === 429) {
        console.warn('Rate limited on shared pitch decks. Will retry when view changes.');
        // Reset last fetch time so it can retry after a delay
        lastFetchRef.current[fetchKey] = now - minInterval + 5000; // Allow retry after 5 seconds
      }
      // Don't show error toast - just set empty array to prevent component crash
      setSharedPitchDecks([]);
      // Only log error details in development
      if (import.meta.env.DEV) {
        console.error('Error details:', {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status
        });
      }
    } finally {
      setIsLoadingSharedPitchDecks(false);
      isFetchingRef.current[fetchKey] = false;
    }
  }, []); // Empty deps - function doesn't depend on any props/state

  // Fetch shared pitch decks on component mount and when overview is active
  // Track pathname changes to ensure data is fetched on navigation, but throttle to prevent rate limiting
  useEffect(() => {
    const fetchKey = 'sharedPitchDecks';
    const currentPathname = location.pathname;
    const lastPathname = lastPathnameRef.current[fetchKey] || '';
    const pathnameChanged = lastPathname !== currentPathname;
    
    if (activeView === 'overview' || activeView === 'discover') {
      if (pathnameChanged || !lastFetchRef.current[fetchKey]) {
        // Fetch if pathname changed (user navigated) or on initial mount
        lastPathnameRef.current[fetchKey] = currentPathname;
        fetchSharedPitchDecks();
      }
    }
  }, [activeView, fetchSharedPitchDecks, location.pathname]);

  // Fetch portfolio investments
  const fetchPortfolio = useCallback(async () => {
    const fetchKey = 'portfolio';
    const now = Date.now();
    const lastFetch = lastFetchRef.current[fetchKey] || 0;
    const minInterval = 2000; // Minimum 2 seconds between fetches to prevent rate limiting
    
    // Skip if already fetching or if called too recently
    if (isFetchingRef.current[fetchKey] || (now - lastFetch < minInterval)) {
      return;
    }
    
    isFetchingRef.current[fetchKey] = true;
    lastFetchRef.current[fetchKey] = now;
    setIsLoadingPortfolio(true);
    
    try {
      const data = await investorService.getPortfolio();
      setPortfolioInvestments(data.results || []);
    } catch (error: any) {
      console.error('Failed to fetch portfolio:', error);
      // Handle rate limiting gracefully - don't spam errors
      if (error?.response?.status === 429) {
        console.warn('Rate limited on portfolio. Will retry when view changes.');
        // Reset last fetch time so it can retry after a delay
        lastFetchRef.current[fetchKey] = now - minInterval + 5000; // Allow retry after 5 seconds
      }
      setPortfolioInvestments([]);
      if (import.meta.env.DEV) {
        console.error('Portfolio error details:', {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status
        });
      }
    } finally {
      setIsLoadingPortfolio(false);
      isFetchingRef.current[fetchKey] = false;
    }
  }, []);

  // Fetch portfolio when portfolio view is active, overview, or discover (for badges)
  // Track pathname changes to ensure data is fetched on navigation, but throttle to prevent rate limiting
  useEffect(() => {
    const fetchKey = 'portfolio';
    const currentPathname = location.pathname;
    const lastPathname = lastPathnameRef.current[fetchKey] || '';
    const pathnameChanged = lastPathname !== currentPathname;
    const viewChanged = lastActiveViewRef.current !== activeView;
    
    // Fetch portfolio for overview, portfolio, and discover tabs (discover needs it for badges)
    if (activeView === 'portfolio' || activeView === 'overview' || activeView === 'discover') {
      // Fetch if switching to these tabs or pathname changed
      if (viewChanged || pathnameChanged || !lastFetchRef.current[fetchKey]) {
        lastPathnameRef.current[fetchKey] = currentPathname;
        lastActiveViewRef.current = activeView;
        fetchPortfolio();
      }
    } else {
      // Update lastActiveView even when not on these tabs
      lastActiveViewRef.current = activeView;
    }
  }, [activeView, fetchPortfolio, location.pathname]);

  // Memoize fetchVentures to prevent unnecessary re-renders and fix hooks violation
  const fetchVentures = useCallback(async () => {
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
    } catch (error: any) {
      console.error('Failed to fetch ventures:', error);
      // Check if it's a permission error (403) - user profile not approved/submitted
      if (error?.response?.status === 403) {
        toast.error('Your profile must be submitted or approved to view startups. Please complete your profile and wait for approval.');
      } else {
        toast.error('Failed to load ventures. Please try again later.');
      }
      // Ensure ventures is always an array even on error
      setVentures([]);
    } finally {
      setIsLoadingVentures(false);
    }
  }, [searchTerm, filterSector]); // Include dependencies

  // Fetch ventures when discover view is active
  // Track activeView changes to ensure data is fetched when switching to discover tab
  useEffect(() => {
    const fetchKey = 'ventures';
    const now = Date.now();
    const lastFetch = lastFetchRef.current[fetchKey] || 0;
    const minInterval = 1000; // Minimum 1 second between fetches to prevent rate limiting
    const viewChanged = lastActiveViewRef.current !== activeView;
    
    if (activeView === 'discover') {
      // Always fetch when switching to discover tab (view changed to 'discover')
      // Or if enough time has passed since last fetch (to handle filter changes)
      if (viewChanged || (now - lastFetch > minInterval)) {
        lastFetchRef.current[fetchKey] = now;
        lastActiveViewRef.current = activeView;
        fetchVentures();
      }
    } else {
      // Update lastActiveView even when not on discover tab
      lastActiveViewRef.current = activeView;
    }
  }, [activeView, fetchVentures, filterStage]); // Include filterStage to refetch when filter changes
  
  // Note: All modals have been removed. Actions now open new tabs instead.
  // This follows the platform rule: "No modals - use new tabs for detailed views"

  // Safety check: Ensure user object is valid (AFTER all hooks are called)
  if (!user || !user.id) {
    console.error('InvestorDashboard: Invalid user object', user);
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-lg font-semibold">Error loading dashboard</p>
          <p className="text-muted-foreground">User information is missing or invalid.</p>
        </div>
      </div>
    );
  }

  // Wrapper for onProfileUpdate that also triggers profile refresh
  const handleProfileUpdate = useCallback((updatedUser: User) => {
    // Call the original callback if provided
    if (onProfileUpdate) {
      onProfileUpdate(updatedUser);
    }
    // Increment refresh trigger to force UserProfile to re-fetch data
    setProfileRefreshTrigger(prev => prev + 1);
  }, [onProfileUpdate]);

  // Calculate total committed amount from portfolio investments only
  // Note: We use portfolioInvestments as the single source of truth to avoid double-counting
  // (sharedPitchDecks also shows commitment_status, but that's just for display)
  // IMPORTANT: All hooks (including useMemo) must be called BEFORE any conditional returns
  const totalCommittedAmount = React.useMemo(() => {
    let total = 0;
    // Sum from portfolio investments only (single source of truth)
    if (Array.isArray(portfolioInvestments)) {
      portfolioInvestments.forEach(inv => {
        if (inv.status === 'COMMITTED' && inv.amount) {
          const amount = parseFloat(inv.amount);
          if (!isNaN(amount)) {
            total += amount;
          }
        }
      });
    }
    return total;
  }, [portfolioInvestments]);

  // Portfolio companies from committed investments (including withdrawn for display)
  const portfolioCompanies: any[] = React.useMemo(() => {
    if (!Array.isArray(portfolioInvestments)) return [];
    return portfolioInvestments
      .filter(inv => inv.status === 'COMMITTED' || inv.status === 'WITHDRAWN' || inv.status === 'EXPRESSED')
      .map(inv => ({
        id: inv.product_id || inv.commitment_id,
        commitment_id: inv.commitment_id,
        company: inv.product_name || 'Unknown',
        sector: inv.product_industry || 'N/A',
        stage: inv.funding_stage || 'N/A',
        status: inv.status || 'COMMITTED', // Include actual status (COMMITTED, WITHDRAWN, etc.)
        invested: inv.amount ? `$${parseFloat(inv.amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : 'N/A',
        currentValue: inv.amount ? `$${parseFloat(inv.amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : 'N/A',
        return: '0%',
        lastUpdate: inv.updated_at ? new Date(inv.updated_at).toLocaleDateString() : 'N/A',
        committed_at: inv.committed_at,
        venture_response: inv.venture_response || 'PENDING',
        venture_response_at: inv.venture_response_at,
        venture_response_message: inv.venture_response_message,
        is_deal: inv.is_deal || false,
        product_id: inv.product_id,
        document_id: inv.document_id,
        product_user_id: inv.product_user_id,
        product_description: inv.product_description,
        funding_stage: inv.funding_stage,
        funding_amount: inv.funding_amount,
        message: inv.message
      }));
  }, [portfolioInvestments]);

  // Real stats - using actual data or showing empty states
  // IMPORTANT: Calculate stats AFTER all hooks are called but BEFORE conditional returns
  const stats = {
    totalInvestments: Array.isArray(portfolioInvestments) ? portfolioInvestments.filter(inv => inv.status === 'COMMITTED').length : 0,
    totalInvested: totalCommittedAmount > 0 ? `$${totalCommittedAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '$0',
    totalCommitted: totalCommittedAmount > 0 ? `$${totalCommittedAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '$0',
    activeDeals: Array.isArray(portfolioInvestments) ? portfolioInvestments.filter(inv => inv.status === 'COMMITTED').length : 0,
    avgReturn: '0%', // TODO: Calculate from portfolio API data when available
    portfolioValue: totalCommittedAmount > 0 ? `$${totalCommittedAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '$0',
    pipeline: Array.isArray(sharedPitchDecks) ? sharedPitchDecks.filter((pd: any) => pd.is_new && !pd.is_deal).length : 0, // New shared pitch decks count (excluding deals)
    totalMessages: unreadCount
  };

  // Empty arrays for now - will be populated when APIs are available
  const recentActivity: any[] = [];
  const performanceMetrics: any[] = [];
  
  // Deal Pipeline: Show deals that are committed/negotiating but not yet closed
  const pipelineDeals = React.useMemo(() => {
    if (!Array.isArray(portfolioInvestments)) return [];
    
    return portfolioInvestments
      .filter((inv: any) => {
        // Include if:
        // 1. Status is COMMITTED or EXPRESSED (committed to invest)
        // 2. Venture response is PENDING or RENEGOTIATE (negotiating)
        // 3. Not closed (status !== 'COMPLETED' and status !== 'WITHDRAWN')
        const isCommitted = inv.status === 'COMMITTED' || inv.status === 'EXPRESSED';
        const isNegotiating = inv.venture_response === 'PENDING' || inv.venture_response === 'RENEGOTIATE';
        const isNotClosed = inv.status !== 'COMPLETED' && inv.status !== 'WITHDRAWN';
        
        return (isCommitted || isNegotiating) && isNotClosed;
      })
      .map((inv: any) => ({
        id: inv.commitment_id || inv.product_id,
        company: inv.product_name || 'Unknown',
        stage: inv.funding_stage || 'N/A',
        amount: inv.amount ? `$${parseFloat(inv.amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : 'N/A',
        status: inv.status,
        venture_response: inv.venture_response || 'PENDING',
        is_deal: inv.is_deal || false,
        committed_at: inv.committed_at,
        product_id: inv.product_id,
        document_id: inv.document_id,
        product_user_id: inv.product_user_id,
        commitment_id: inv.commitment_id,
        investor_completed_at: inv.investor_completed_at,
        venture_completed_at: inv.venture_completed_at,
        completed_at: inv.completed_at,
        // Calculate progress based on status
        progress: inv.completed_at ? 100 : inv.is_deal ? 75 : inv.venture_response === 'RENEGOTIATE' ? 50 : inv.venture_response === 'PENDING' ? 25 : 10,
        nextStep: inv.completed_at ? 'Deal completed' :
                  inv.investor_completed_at && !inv.venture_completed_at ? 'Waiting for venture to complete' :
                  inv.venture_completed_at && !inv.investor_completed_at ? 'Waiting for investor to complete' :
                  inv.is_deal 
          ? 'Deal accepted - awaiting completion'
          : inv.venture_response === 'RENEGOTIATE'
          ? 'Renegotiation in progress'
          : inv.venture_response === 'PENDING'
          ? 'Awaiting venture response'
          : 'Commitment submitted',
        dueDate: inv.venture_response_at 
          ? new Date(inv.venture_response_at).toLocaleDateString()
          : inv.committed_at
          ? new Date(inv.committed_at).toLocaleDateString()
          : 'N/A'
      }));
  }, [portfolioInvestments]);

  // IMPORTANT: All hooks (useCallback, useMemo, etc.) must be called BEFORE any conditional returns
  // Handler for withdrawing commitment
  const handleWithdrawCommitment = useCallback(async (productId: string, commitmentId: string, productName: string) => {
    if (!validateUuid(productId) || !validateUuid(commitmentId)) {
      toast.error("Invalid pitch deck or commitment ID");
      return;
    }

    // Confirm withdrawal
    const confirmed = window.confirm(
      `Are you sure you want to retract your investment commitment for ${productName}?\n\n` +
      `This action cannot be undone. The venture will be notified of your withdrawal.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsLoadingPortfolio(true);
      setIsLoadingSharedPitchDecks(true);
      
      // Optional: Get withdrawal reason from user
      const reason = window.prompt(
        "Please provide a reason for withdrawing your commitment (optional):"
      );
      
      await investorService.withdrawCommitment(
        productId,
        commitmentId,
        reason ? sanitizeInput(reason, 2000) : undefined
      );

      toast.success("Investment commitment withdrawn successfully");
      
      // Refresh portfolio to show updated status
      await fetchPortfolio();
      
      // Refresh shared pitch decks to update commitment status (important for overview page)
      await fetchSharedPitchDecks();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.message || "Failed to withdraw commitment";
      toast.error(errorMessage);
    } finally {
      setIsLoadingPortfolio(false);
      setIsLoadingSharedPitchDecks(false);
    }
  }, [fetchPortfolio, fetchSharedPitchDecks]);

  const handleContactStartup = (ventureUserId: string, ventureName?: string) => {
    // Navigate straight to messaging with the venture preselected
    if (!validateUuid(ventureUserId)) {
      toast.error("Unable to start chat: invalid venture id");
      return;
    }
    const params = new URLSearchParams({
      userId: ventureUserId,
      userName: ventureName || 'Venture',
      userRole: 'venture',
    });
    navigate(`/dashboard/investor/messages?${params.toString()}`);
  };

  // Handler for following/unfollowing a pitch deck
  const handleFollowPitchDeck = useCallback(async (productId: string, docId: string, isCurrentlyFollowing: boolean) => {
    if (!validateUuid(productId) || !validateUuid(docId)) {
      toast.error("Invalid pitch deck or document ID");
      return;
    }

    try {
      if (isCurrentlyFollowing) {
        await investorService.unfollowPitchDeck(productId, docId);
        toast.success("Pitch deck unfollowed");
      } else {
        await investorService.followPitchDeck(productId, docId);
        toast.success("Pitch deck followed");
      }
      // Refresh shared pitch decks to update status
      await fetchSharedPitchDecks();
    } catch (error: any) {
      console.error('Error following/unfollowing pitch deck:', error);
      toast.error(error.message || "Failed to update follow status");
    }
  }, [fetchSharedPitchDecks]);

  // Handler for updating commitment after renegotiation
  const handleUpdateCommitment = useCallback(async (productId: string, commitmentId: string, productName: string, currentAmount?: string) => {
    if (!validateUuid(productId) || !validateUuid(commitmentId)) {
      toast.error("Invalid pitch deck or commitment ID");
      return;
    }

    // Show prompt for new investment amount
    const newAmount = window.prompt(
      `Update investment commitment for ${productName}:\n\n` +
      `Current amount: ${currentAmount || 'Not specified'}\n\n` +
      `Enter new investment amount (optional, press Cancel to keep current):`
    );
    
    if (newAmount === null) {
      // User cancelled
      return;
    }

    // Optional message
    const message = window.prompt(
      "Add a message explaining the updated commitment (optional):"
    );

    try {
      setIsLoadingPortfolio(true);
      setIsLoadingSharedPitchDecks(true);
      
      const updateData: { amount?: string; message?: string } = {};
      
      if (newAmount && newAmount.trim()) {
        // Validate amount is a positive number
        const numAmount = parseFloat(newAmount.trim());
        if (isNaN(numAmount) || numAmount <= 0) {
          toast.error("Please enter a valid positive number for investment amount");
          return;
        }
        updateData.amount = numAmount.toString();
      }
      
      if (message && message.trim()) {
        updateData.message = sanitizeInput(message.trim(), 2000);
      }
      
      await investorService.updateCommitment(productId, commitmentId, updateData);
      toast.success("Investment commitment updated successfully!");
      
      // Refresh portfolio and shared pitch decks to update status
      await fetchPortfolio();
      await fetchSharedPitchDecks();
    } catch (error: any) {
      console.error('Error updating commitment:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || "Failed to update investment commitment";
      toast.error(errorMessage);
    } finally {
      setIsLoadingPortfolio(false);
      setIsLoadingSharedPitchDecks(false);
    }
  }, [fetchPortfolio, fetchSharedPitchDecks]);

  // Handler for committing to invest
  const handleCommitToInvest = useCallback(async (productId: string, docId: string, productName: string) => {
    if (!validateUuid(productId) || !validateUuid(docId)) {
      toast.error("Invalid pitch deck or document ID");
      return;
    }

    // Show a simple prompt for investment amount (optional)
    const amount = window.prompt(`Enter investment amount (optional) for ${productName}:`);
    if (amount === null) {
      // User cancelled
      return;
    }

    try {
      const data: { amount?: string; message?: string } = {};
      if (amount && amount.trim()) {
        // Validate amount is a positive number
        const numAmount = parseFloat(amount.trim());
        if (isNaN(numAmount) || numAmount <= 0) {
          toast.error("Please enter a valid positive number for investment amount");
          return;
        }
        data.amount = numAmount.toString();
      }

      await investorService.commitToInvest(productId, docId, data);
      toast.success("Investment commitment recorded successfully!");
      // Refresh shared pitch decks and portfolio to update status
      await fetchSharedPitchDecks();
      await fetchPortfolio();
    } catch (error: any) {
      console.error('Error committing to invest:', error);
      toast.error(error.message || "Failed to record investment commitment");
    }
  }, [fetchSharedPitchDecks, fetchPortfolio]);

  // Toggle completion info visibility
  const toggleCompletionInfo = useCallback(() => {
    setShowCompletionInfo(prev => !prev);
  }, []);

  // Handler for completing a deal
  const handleCompleteDeal = useCallback(async (productId: string, commitmentId: string, productName: string) => {
    if (!validateUuid(productId) || !validateUuid(commitmentId)) {
      toast.error("Invalid product or commitment ID");
      return;
    }

    // Confirm completion
    const confirmed = window.confirm(
      `Mark this deal as completed for ${productName}?\n\n` +
      `This indicates that contracts have been signed and funds have been transferred. ` +
      `The deal will only be fully completed when both you and the venture mark it as completed.`
    );
    
    if (!confirmed) {
      return;
    }

    try {
      setIsLoadingPortfolio(true);
      setIsLoadingSharedPitchDecks(true);
      
      const result = await investorService.completeDeal(productId, commitmentId);
      
      if (result.fully_completed) {
        toast.success("Deal completed! Both parties have confirmed completion.");
      } else {
        toast.success("Deal marked as completed. Waiting for venture to confirm.");
      }
      
      // Refresh portfolio and shared pitch decks to update status
      await fetchPortfolio();
      await fetchSharedPitchDecks();
    } catch (error: any) {
      console.error('Error completing deal:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || "Failed to complete deal";
      toast.error(errorMessage);
    } finally {
      setIsLoadingPortfolio(false);
      setIsLoadingSharedPitchDecks(false);
    }
  }, [fetchPortfolio, fetchSharedPitchDecks]);

  const handleRequestPitch = async (productId: string) => {
    // Security: Validate UUID
    if (!validateUuid(productId)) {
      toast.error("Invalid pitch deck ID");
      return;
    }

    try {
      // Ensure ventures is an array before using find
      const venturesArray = Array.isArray(ventures) ? ventures : [];
      
      // Find the product and its first pitch deck
      const product = venturesArray.find(v => v.id === productId);
      if (!product || !product.documents || product.documents.length === 0) {
        toast.error("No pitch deck available");
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
                <CheckCircle className="w-5 h-5 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Committed</p>
                <p className="text-2xl font-bold">{stats.totalCommitted}</p>
                <p className="text-xs text-orange-600">Investment commitments</p>
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

      {/* Shared Pitch Decks Section */}
      {/* Filter out deals - they should only appear in Portfolio */}
      {(() => {
        // Filter out deals (is_deal = true) from shared pitch decks
        const activeSharedPitchDecks = Array.isArray(sharedPitchDecks) 
          ? sharedPitchDecks.filter((pd: any) => !pd.is_deal)
          : [];
        
        return activeSharedPitchDecks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Shared Pitch Decks</span>
                  {activeSharedPitchDecks.filter((pd: any) => pd.is_new).length > 0 && (
                    <Badge variant="default" className="ml-2">
                      {activeSharedPitchDecks.filter((pd: any) => pd.is_new).length} New
                    </Badge>
                  )}
                </div>
              </CardTitle>
              <CardDescription>
                Pitch decks that have been shared with you by ventures (deals are shown in Portfolio)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSharedPitchDecks ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {activeSharedPitchDecks.slice(0, 5).map((share) => (
                  <div
                    key={share.share_id}
                    className={`p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                      share.is_new ? 'border-blue-300 bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-lg">{safeDisplayText(share.product_name || 'Unknown Pitch Deck')}</h3>
                          {share.is_new && (
                            <Badge variant="default" className="bg-blue-600">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {safeDisplayText(share.product_description || 'No description available')}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{safeDisplayText(share.product_industry || 'N/A')}</span>
                          {share.funding_amount && (
                            <span>• Seeking {safeDisplayText(share.funding_amount)}</span>
                          )}
                          {share.funding_stage && (
                            <span>• {safeDisplayText(share.funding_stage)}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span>Shared by {safeDisplayText(share.shared_by_name || 'Unknown')}</span>
                          <span>•</span>
                          <span>
                            {share.shared_at ? new Date(share.shared_at).toLocaleDateString() : 'Unknown date'}
                          </span>
                          {share.message && (
                            <>
                              <span>•</span>
                              <span className="italic">"{safeDisplayText(share.message)}"</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* All Operational Buttons - Grouped for clarity */}
                    <div className="mt-4 space-y-3">
                      {/* All Action Buttons - Single Horizontal Row */}
                      <div className="flex flex-wrap gap-2 items-center">
                        {/* Primary Actions */}
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            if (!validateUuid(share.product_id) || !validateUuid(share.document_id)) {
                              toast.error("Invalid pitch deck or document ID");
                              return;
                            }
                            navigate(`/dashboard/investor/pitch-deck/${share.product_id}/${share.document_id}`);
                          }}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          View Pitch Deck
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Use product_user_id if available, otherwise fetch it
                            if (share.product_user_id && validateUuid(share.product_user_id)) {
                              const params = new URLSearchParams({
                                userId: share.product_user_id,
                                userName: share.product_name || 'Venture',
                                userRole: 'venture',
                              });
                              navigate(`/dashboard/investor/messages?${params.toString()}`);
                            } else if (validateUuid(share.product_id)) {
                              // Fallback: fetch product to get user ID
                              ventureService.getVentureById(share.product_id)
                                .then((product) => {
                                  if (product && product.user) {
                                    const params = new URLSearchParams({
                                      userId: product.user,
                                      userName: product.user_name || share.product_name || 'Venture',
                                      userRole: 'venture',
                                    });
                                    navigate(`/dashboard/investor/messages?${params.toString()}`);
                                  } else {
                                    toast.error("Unable to find venture user");
                                  }
                                })
                                .catch((error) => {
                                  console.error('Failed to fetch product user ID:', error);
                                  toast.error("Unable to contact venture");
                                });
                            } else {
                              toast.error("Invalid pitch deck ID");
                            }
                          }}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Contact Venture
                        </Button>
                        <Button
                          variant={share.is_following ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => {
                            if (!validateUuid(share.product_id) || !validateUuid(share.document_id)) {
                              toast.error("Invalid pitch deck or document ID");
                              return;
                            }
                            handleFollowPitchDeck(share.product_id, share.document_id, share.is_following || false);
                          }}
                        >
                          <Star className={`w-4 h-4 mr-2 ${share.is_following ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                          {share.is_following ? 'Following' : 'Follow'}
                        </Button>
                        
                        {/* Commitment Actions - Inline with Primary Actions */}
                        {/* Commit to Invest - Show if not committed, withdrawn, or completed */}
                        {/* Default behavior: Show button unless explicitly committed/withdrawn/completed */}
                        {share.product_id && share.document_id && 
                         share.commitment_status !== 'COMMITTED' && 
                         share.commitment_status !== 'WITHDRAWN' && 
                         share.commitment_status !== 'COMPLETED' && (
                          <Button
                            variant="default"
                            size="sm"
                            className="text-white font-medium"
                            style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#15803d'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#16a34a'; }}
                            onClick={() => {
                              // Debug logging
                              if (import.meta.env.DEV) {
                                console.log('Commit button clicked:', {
                                  product_id: share.product_id,
                                  document_id: share.document_id,
                                  product_name: share.product_name,
                                  commitment_status: share.commitment_status
                                });
                              }
                              
                              if (!validateUuid(share.product_id) || !validateUuid(share.document_id)) {
                                toast.error("Invalid pitch deck or document ID");
                                return;
                              }
                              handleCommitToInvest(share.product_id, share.document_id, share.product_name || 'Venture');
                            }}
                            disabled={isLoadingPortfolio || isLoadingSharedPitchDecks}
                          >
                            <DollarSign className="w-4 h-4 mr-2" />
                            Commit to Invest
                          </Button>
                        )}
                        
                        {/* Update Commitment - Show if renegotiation requested */}
                        {share.commitment_status === 'COMMITTED' && 
                         share.commitment_id && 
                         share.product_id && 
                         share.venture_response === 'RENEGOTIATE' && (
                          <Button
                            variant="default"
                            size="sm"
                            className="text-white font-medium"
                            style={{ backgroundColor: '#ea580c', borderColor: '#ea580c' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#c2410c'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ea580c'; }}
                            onClick={() => {
                              if (!validateUuid(share.product_id) || !validateUuid(share.commitment_id)) {
                                toast.error("Invalid pitch deck or commitment ID");
                                return;
                              }
                              handleUpdateCommitment(
                                share.product_id,
                                share.commitment_id,
                                share.product_name || 'Venture',
                                share.commitment_amount || undefined
                              );
                            }}
                            disabled={isLoadingPortfolio || isLoadingSharedPitchDecks}
                          >
                            <DollarSign className="w-4 h-4 mr-2" />
                            Update Commitment
                          </Button>
                        )}
                        
                        {/* Retract Commitment - Show if committed and not accepted deal */}
                        {share.commitment_status === 'COMMITTED' && 
                         share.commitment_id && 
                         share.product_id && 
                         share.venture_response !== 'ACCEPTED' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="text-white font-medium"
                            style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#b91c1c'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#dc2626'; }}
                            onClick={() => {
                              if (!validateUuid(share.product_id) || !validateUuid(share.commitment_id)) {
                                toast.error("Invalid pitch deck or commitment ID");
                                return;
                              }
                              handleWithdrawCommitment(
                                share.product_id,
                                share.commitment_id,
                                share.product_name || 'Venture'
                              );
                            }}
                            disabled={isLoadingPortfolio || isLoadingSharedPitchDecks}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Retract Commitment
                          </Button>
                        )}
                      </div>
                    </div>
                    {/* Show commitment status badge */}
                    {(share.commitment_status === 'COMMITTED' || share.commitment_status === 'WITHDRAWN') && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {share.commitment_status === 'WITHDRAWN' ? (
                          <Badge variant="outline" className="border-red-500 text-red-600">
                            <X className="w-3 h-3 mr-1" />
                            Withdrawn
                          </Badge>
                        ) : share.is_deal ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Deal Accepted
                            {share.commitment_amount && ` - $${parseFloat(share.commitment_amount).toLocaleString()}`}
                          </Badge>
                        ) : share.venture_response === 'RENEGOTIATE' ? (
                          <Badge variant="outline" className="border-orange-500 text-orange-600">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Renegotiation Requested
                          </Badge>
                        ) : share.venture_response === 'PENDING' ? (
                          <Badge variant="outline" className="border-amber-500 text-amber-600">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending Venture Response
                            {share.commitment_amount && ` - $${parseFloat(share.commitment_amount).toLocaleString()}`}
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Investment Committed
                            {share.commitment_amount && ` - $${parseFloat(share.commitment_amount).toLocaleString()}`}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  ))}
                  {activeSharedPitchDecks.length > 5 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => onViewChange?.('discover')}
                    >
                      View All Shared Pitch Decks
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

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
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No recent activity</p>
                <p className="text-sm mt-2">Activity will appear here when available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => {
                  const IconComponent = activity.icon;
                  return (
                    <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={`p-2 rounded-lg ${activity.bgColor}`}>
                        <IconComponent className={`w-4 h-4 ${activity.color}`} />
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
                  );
                })}
              </div>
            )}
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
            {portfolioCompanies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No portfolio companies</p>
                <p className="text-sm mt-2">Portfolio companies will appear here when available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {portfolioCompanies.slice(0, 4).map((company) => (
                <div key={company.id} className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={company.logo} />
                    <AvatarFallback>{(company.company || '?')[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{company.company || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground">{company.sector || 'N/A'} • {company.stage || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">{company.metrics?.revenue || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{company.currentValue || 'N/A'}</p>
                    <p className={`text-xs ${
                      company.return?.startsWith('+') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {company.return || 'N/A'}
                    </p>
                    <Badge 
                      variant={company.status === 'Thriving' ? 'default' : 
                              company.status === 'Growing' ? 'secondary' : 'outline'}
                      className="text-xs mt-1"
                    >
                      {company.status || 'N/A'}
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
            )}
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
            <div className="mb-4 p-3 border border-blue-200 bg-blue-50 rounded-lg space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-sm text-blue-800">
                <Info className="w-4 h-4" />
                <span>For completing this deal see the information here.</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleCompletionInfo}
                  className="border-blue-300 text-blue-800 hover:bg-blue-100"
                >
                  {showCompletionInfo ? 'Hide' : 'View'} completion service
                </Button>
              </div>
              <p className="text-xs text-blue-700">
                We can facilitate contract preparation and signature collection. Both parties may retract before completion; once both mark completed, terms are locked unless both agree to changes.
              </p>
              {showCompletionInfo && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-blue-900 mb-2">When is a deal considered completed?</p>
                      <ul className="text-sm text-blue-900 list-disc list-inside space-y-1">
                        <li>Both parties click <strong>Complete Deal</strong> after contracts and funds are finalized.</li>
                        <li>If our agents are involved and both parties sign and complete their obligations, we will consider the deal as completed and will change the status to completed automatically.</li>
                        <li>Until both confirm, either side can retract their offer.</li>
                        <li>After completion, changes require mutual agreement and will follow the signed contract terms.</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-900 mb-2">Agent-facilitated closing</p>
                      <ul className="text-sm text-emerald-900 list-disc list-inside space-y-1">
                        <li>Our agent prepares the contract and collects signatures.</li>
                        <li>We coordinate signature collection for both parties.</li>
                        <li>Fees: 300 EUR for investments up to $10,000; 2.5% for investments up to $50K; 1% for the portion above $50K.</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 mb-2">Completion steps</p>
                      <ol className="text-sm text-slate-900 list-decimal list-inside space-y-1">
                        <li>Confirm terms and funding amount with the venture.</li>
                        <li>Request agent facilitation; our agent drafts the contract.</li>
                        <li>Both parties review and sign; we collect signatures.</li>
                        <li>Funds transfer and documents filed.</li>
                        <li>If agents are involved: Once both parties sign and complete obligations, the deal status will be automatically changed to completed.</li>
                        <li>If no agents: Both parties click <strong>Complete Deal</strong> to finalize on the platform.</li>
                      </ol>
                      <p className="text-xs text-muted-foreground mt-2">
                        Need help? Message the venture or our support via the messaging tab.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {pipelineDeals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No deals in pipeline</p>
                <p className="text-sm mt-2">Deals will appear here when available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pipelineDeals.map((deal) => (
                  <div key={deal.id} className="p-4 border rounded-lg space-y-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium text-sm">{safeDisplayText(deal.company)}</p>
                          {deal.is_deal && (
                            <Badge variant="default" className="bg-green-600 text-white text-xs">
                              Deal
                            </Badge>
                          )}
                          {deal.venture_response === 'RENEGOTIATE' && (
                            <Badge variant="outline" className="border-orange-500 text-orange-600 text-xs">
                              Negotiating
                            </Badge>
                          )}
                          {deal.venture_response === 'PENDING' && !deal.is_deal && (
                            <Badge variant="outline" className="border-amber-500 text-amber-600 text-xs">
                              Pending
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{safeDisplayText(deal.stage)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{safeDisplayText(deal.amount)}</p>
                        <p className="text-xs text-muted-foreground">Committed</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{deal.progress}%</span>
                      </div>
                      <Progress value={deal.progress} className="h-2" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{safeDisplayText(deal.nextStep)}</span>
                      <span className="font-medium">{safeDisplayText(deal.dueDate)}</span>
                    </div>
                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t">
                      {deal.document_id && deal.product_id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (!validateUuid(deal.product_id) || !validateUuid(deal.document_id)) {
                              toast.error("Invalid pitch deck or document ID");
                              return;
                            }
                            navigate(`/dashboard/investor/pitch-deck/${deal.product_id}/${deal.document_id}`);
                          }}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          View Pitch Deck
                        </Button>
                      )}
                      {deal.product_user_id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (deal.product_user_id && validateUuid(deal.product_user_id)) {
                              const params = new URLSearchParams({
                                userId: deal.product_user_id,
                                userName: deal.company || 'Venture',
                                userRole: 'venture',
                              });
                              navigate(`/dashboard/investor/messages?${params.toString()}`);
                            }
                          }}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Contact Venture
                        </Button>
                      )}
                      {deal.is_deal && deal.commitment_id && deal.product_id && !deal.completed_at && !deal.investor_completed_at && (
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full text-white font-medium"
                          style={{ backgroundColor: '#059669', borderColor: '#059669' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#047857'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#059669'; }}
                          onClick={() => {
                            if (!validateUuid(deal.product_id) || !validateUuid(deal.commitment_id)) {
                              toast.error("Invalid product or commitment ID");
                              return;
                            }
                            handleCompleteDeal(deal.product_id, deal.commitment_id, deal.company || 'Venture');
                          }}
                          disabled={isLoadingPortfolio || isLoadingSharedPitchDecks}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Complete Deal
                        </Button>
                      )}
                      {deal.is_deal && deal.investor_completed_at && !deal.completed_at && (
                        <Badge variant="outline" className="border-green-500 text-green-600 text-xs">
                          You completed - Waiting for venture
                        </Badge>
                      )}
                      {/* Retract Commitment - Show for deals not yet completed */}
                      {deal.is_deal && deal.commitment_id && deal.product_id && !deal.completed_at && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full text-white font-medium"
                          style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#b91c1c'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#dc2626'; }}
                          onClick={() => {
                            if (!validateUuid(deal.product_id) || !validateUuid(deal.commitment_id)) {
                              toast.error("Invalid product or commitment ID");
                              return;
                            }
                            const confirmed = window.confirm(
                              `Retract your investment commitment for ${deal.company}?\n\n` +
                              `This will withdraw your offer. The venture will be notified.`
                            );
                            if (confirmed) {
                              handleWithdrawCommitment(deal.product_id, deal.commitment_id, deal.company || 'Venture');
                            }
                          }}
                          disabled={isLoadingPortfolio || isLoadingSharedPitchDecks}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Retract Offer
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => onViewChange?.('discover')}
                >
                  Explore More Opportunities
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card ref={completionInfoRef} id="deal-completion-info">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            <span>Deal Completion Service (Agent-Facilitated)</span>
          </CardTitle>
          <CardDescription>
            How we finalize deals, fees, and what happens before/after completion.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 space-y-2">
              <p className="text-sm font-semibold text-blue-900">When is a deal considered completed?</p>
              <ul className="text-sm text-blue-900 list-disc list-inside space-y-1">
                <li>Both parties click <strong>Complete Deal</strong> after contracts and funds are finalized.</li>
                <li>If our agents are involved and both parties sign and complete their obligations, we will consider the deal as completed and will change the status to completed automatically.</li>
                <li>Until both confirm, either side can retract their offer.</li>
                <li>After completion, changes require mutual agreement and will follow the signed contract terms.</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 space-y-2">
              <p className="text-sm font-semibold text-emerald-900">Agent-facilitated closing</p>
              <ul className="text-sm text-emerald-900 list-disc list-inside space-y-1">
                <li>Our agent prepares the contract and collects signatures.</li>
                <li>We coordinate signature collection for both parties.</li>
                <li>Fees: 300 EUR for investments up to $10,000; 2.5% for investments up to $50K; 1% for the portion above $50K.</li>
              </ul>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <p className="text-sm font-semibold text-slate-900">Completion steps</p>
            <ol className="text-sm text-slate-900 list-decimal list-inside space-y-1">
              <li>Confirm terms and funding amount with the venture.</li>
              <li>Request agent facilitation; our agent drafts the contract.</li>
              <li>Both parties review and sign; we collect signatures.</li>
              <li>Funds transfer and documents filed.</li>
              <li>If agents are involved: Once both parties sign and complete obligations, the deal status will be automatically changed to completed.</li>
              <li>If no agents: Both parties click <strong>Complete Deal</strong> to finalize on the platform.</li>
            </ol>
            <p className="text-xs text-muted-foreground">
              Need help? Message the venture or our support via the messaging tab.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPortfolio = () => (
    <div className="space-y-6">
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
              <p className="text-2xl font-bold">{stats.portfolioValue}</p>
              <p className="text-sm text-muted-foreground">Total Value</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.avgReturn}</p>
              <p className="text-sm text-muted-foreground">Avg Return</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.activeDeals}</p>
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
          {isLoadingPortfolio ? (
            <div className="text-center py-12 text-muted-foreground">
              <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
              <p className="text-sm">Loading portfolio...</p>
            </div>
          ) : portfolioCompanies.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No portfolio companies yet</p>
              <p className="text-sm mt-2">Commit to investing in a pitch deck to add it to your portfolio</p>
            </div>
          ) : (
            <div className="space-y-6">
              {portfolioCompanies.map((company) => (
              <div key={company.id || company.commitment_id} className="p-6 border rounded-lg hover:bg-muted/50 transition-colors">
                {/* Company Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={undefined} />
                      <AvatarFallback>{(company.company || '?')[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold">{company.company || 'Unknown'}</h3>
                      <p className="text-muted-foreground">{company.sector || 'N/A'} • {company.stage || 'N/A'}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        {company.status === 'WITHDRAWN' ? (
                          <Badge variant="outline" className="border-red-500 text-red-600">
                            <X className="w-3 h-3 mr-1" />
                            Withdrawn
                          </Badge>
                        ) : company.is_deal ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Deal Accepted
                          </Badge>
                        ) : company.venture_response === 'RENEGOTIATE' ? (
                          <Badge variant="outline" className="border-orange-500 text-orange-600">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Renegotiation Requested
                          </Badge>
                        ) : company.venture_response === 'PENDING' ? (
                          <Badge variant="outline" className="border-amber-500 text-amber-600">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending Response
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Committed
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {company.is_deal 
                            ? `Deal accepted ${company.venture_response_at ? new Date(company.venture_response_at).toLocaleDateString() : ''}`
                            : company.venture_response === 'RENEGOTIATE'
                            ? `Renegotiation requested ${company.venture_response_at ? new Date(company.venture_response_at).toLocaleDateString() : ''}`
                            : `Committed ${company.committed_at ? new Date(company.committed_at).toLocaleDateString() : company.lastUpdate || 'N/A'}`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{company.invested || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">Committed Amount</p>
                  </div>
                </div>

                {/* Investment Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Committed Investment</p>
                    <p className="font-semibold">{company.invested || 'N/A'}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Funding Stage</p>
                    <p className="font-semibold">{company.stage || 'N/A'}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Funding Amount</p>
                    <p className="font-semibold">{company.funding_amount ? `$${parseFloat(company.funding_amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : 'N/A'}</p>
                  </div>
                </div>

                {/* Description */}
                {company.product_description && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">{company.product_description}</p>
                  </div>
                )}

                {/* Investor message if available */}
                {company.message && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Your Note:</p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">{company.message}</p>
                  </div>
                )}

                {/* Venture response message if available */}
                {company.venture_response_message && (
                  <div className={`mb-4 p-3 rounded-lg ${
                    company.venture_response === 'ACCEPTED' 
                      ? 'bg-green-50 dark:bg-green-950' 
                      : 'bg-orange-50 dark:bg-orange-950'
                  }`}>
                    <p className={`text-sm font-medium ${
                      company.venture_response === 'ACCEPTED'
                        ? 'text-green-900 dark:text-green-100'
                        : 'text-orange-900 dark:text-orange-100'
                    }`}>
                      {company.venture_response === 'ACCEPTED' ? 'Venture Response (Deal Accepted):' : 'Venture Response (Renegotiation Request):'}
                    </p>
                    <p className={`text-sm ${
                      company.venture_response === 'ACCEPTED'
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-orange-800 dark:text-orange-200'
                    }`}>
                      {company.venture_response_message}
                    </p>
                  </div>
                )}

                {/* All Operational Buttons - Single Horizontal Row */}
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2 items-center">
                    {/* Primary Actions */}
                    {company.document_id && company.product_id && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          if (!validateUuid(company.product_id) || !validateUuid(company.document_id)) {
                            toast.error("Invalid pitch deck or document ID");
                            return;
                          }
                          navigate(`/dashboard/investor/pitch-deck/${company.product_id}/${company.document_id}`);
                        }}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View Pitch Deck
                      </Button>
                    )}
                    {company.product_user_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (company.product_user_id && validateUuid(company.product_user_id)) {
                            const params = new URLSearchParams({
                              userId: company.product_user_id,
                              userName: company.company || 'Venture',
                              userRole: 'venture',
                            });
                            navigate(`/dashboard/investor/messages?${params.toString()}`);
                          } else {
                            toast.error("Unable to contact venture");
                          }
                        }}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Contact Venture
                      </Button>
                    )}
                    
                    {/* Commitment Actions - Inline with Primary Actions */}
                    {/* Update Commitment - Show if renegotiation requested */}
                    {company.commitment_id && 
                     company.product_id && 
                     company.status === 'COMMITTED' &&
                     company.venture_response === 'RENEGOTIATE' && (
                      <Button
                        variant="default"
                        size="sm"
                        className="text-white font-medium"
                        style={{ backgroundColor: '#ea580c', borderColor: '#ea580c' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#c2410c'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ea580c'; }}
                        onClick={() => {
                          if (!validateUuid(company.product_id) || !validateUuid(company.commitment_id)) {
                            toast.error("Invalid pitch deck or commitment ID");
                            return;
                          }
                          handleUpdateCommitment(
                            company.product_id,
                            company.commitment_id,
                            company.company || 'Venture',
                            company.invested ? company.invested.replace(/[^0-9.]/g, '') : undefined
                          );
                        }}
                        disabled={isLoadingPortfolio}
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Update Commitment
                      </Button>
                    )}
                    
                    {/* Retract Commitment Button - Show if not completed and not already withdrawn */}
                    {company.commitment_id && 
                     company.product_id && 
                     company.status !== 'WITHDRAWN' && 
                     company.status !== 'COMPLETED' && 
                     company.status === 'COMMITTED' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="text-white font-medium"
                        style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#b91c1c'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#dc2626'; }}
                        onClick={() => {
                          if (!validateUuid(company.product_id) || !validateUuid(company.commitment_id)) {
                            toast.error("Invalid pitch deck or commitment ID");
                            return;
                          }
                          handleWithdrawCommitment(
                            company.product_id,
                            company.commitment_id,
                            company.company || 'Venture'
                          );
                        }}
                        disabled={isLoadingPortfolio}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Retract Commitment
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              ))}
            </div>
          )}
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

        {/* Loading State */}
        {isLoadingVentures && (
          <Card>
            <CardContent className="p-12 text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Loading startups...</p>
            </CardContent>
          </Card>
        )}

        {/* Empty State - No startups found */}
        {!isLoadingVentures && filteredStartups.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No Startups Found</h3>
              <p className="text-muted-foreground mb-4">
                {venturesArray.length === 0 
                  ? "There are currently no approved startups available. Check back later or try adjusting your filters."
                  : "No startups match your current search criteria. Try adjusting your filters or search terms."}
              </p>
              {(searchTerm || filterSector !== 'all' || filterStage !== 'all' || filterFunding !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterSector('all');
                    setFilterStage('all');
                    setFilterFunding('all');
                  }}
                >
                  Clear All Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* All Startups */}
        {!isLoadingVentures && filteredStartups.length > 0 && (
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
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-lg">{safeDisplayText(venture.name)}</h3>
                          {/* Portfolio/Negotiation Status Badges */}
                          {(() => {
                            // Check if this venture is in portfolio
                            const portfolioItem = portfolioInvestments.find((inv: any) => 
                              String(inv.product_id) === String(venture.id)
                            );
                            
                            // Check if this venture has a shared pitch deck with commitment
                            const sharedDeck = sharedPitchDecks.find((s: any) => 
                              String(s.product_id) === String(venture.id)
                            );
                            
                            // Determine status - check both portfolio and shared pitch decks
                            const isInPortfolio = !!portfolioItem;
                            const isNegotiating = (portfolioItem && (
                              portfolioItem.venture_response === 'PENDING' || 
                              portfolioItem.venture_response === 'RENEGOTIATE'
                            )) || (sharedDeck && (
                              sharedDeck.venture_response === 'PENDING' || 
                              sharedDeck.venture_response === 'RENEGOTIATE'
                            ));
                            const isDeal = portfolioItem?.is_deal || sharedDeck?.is_deal;
                            // Check commitment status from both sources
                            const portfolioCommitted = portfolioItem?.status === 'COMMITTED' || 
                                                      portfolioItem?.status === 'EXPRESSED' ||
                                                      portfolioItem?.status === 'WITHDRAWN';
                            const sharedDeckCommitted = sharedDeck?.commitment_status === 'COMMITTED' ||
                                                         sharedDeck?.commitment_status === 'EXPRESSED';
                            const isCommitted = portfolioCommitted || sharedDeckCommitted;
                            
                            // Debug logging in development
                            if (import.meta.env.DEV) {
                              console.log('Badge check for venture:', {
                                venture_id: venture.id,
                                venture_name: venture.name,
                                has_portfolioItem: !!portfolioItem,
                                has_sharedDeck: !!sharedDeck,
                                portfolio_status: portfolioItem?.status,
                                sharedDeck_commitment_status: sharedDeck?.commitment_status,
                                isDeal,
                                isCommitted,
                                isInPortfolio,
                                isNegotiating
                              });
                            }
                            
                            return (
                              <div className="flex items-center space-x-2">
                                {isDeal && (
                                  <Badge variant="default" className="bg-green-600 text-white">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Deal
                                  </Badge>
                                )}
                                {isNegotiating && !isDeal && (
                                  <Badge variant="outline" className="border-orange-500 text-orange-600">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Negotiating
                                  </Badge>
                                )}
                                {isInPortfolio && !isNegotiating && !isDeal && (
                                  <Badge variant="outline" className="border-blue-500 text-blue-600">
                                    <Briefcase className="w-3 h-3 mr-1" />
                                    In Portfolio
                                  </Badge>
                                )}
                                {/* Show Committed badge if committed but not showing other badges, or if deal is committed */}
                                {isCommitted && !isInPortfolio && !isDeal && (
                                  <Badge variant="outline" className="border-green-500 text-green-600">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Committed
                                  </Badge>
                                )}
                                {/* Also show Committed badge alongside Deal if it's a committed deal */}
                                {isDeal && isCommitted && (
                                  <Badge variant="outline" className="border-green-500 text-green-600">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Committed
                                  </Badge>
                                )}
                              </div>
                            );
                          })()}
                        </div>
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

                  {/* All Operational Buttons - Grouped for clarity */}
                  <div className="space-y-2">
                    {/* Primary Actions Row */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
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
                        View Pitch Deck
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          // Security: Validate UUID
                          if (!validateUuid(venture.id)) {
                            toast.error("Invalid venture ID");
                            return;
                          }
                          handleContactStartup(venture.user, venture.user_name || venture.name);
                        }}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Contact Venture
                      </Button>
                    </div>

                    {/* Commitment Actions Row - Check if this venture has been shared and has commitment */}
                    {(() => {
                      // Check if this venture is in shared pitch decks (has commitment info)
                      // Use string comparison to handle UUID string matching
                      const sharedDeck = Array.isArray(sharedPitchDecks) ? sharedPitchDecks.find(s => 
                        String(s.product_id) === String(venture.id)
                      ) : null;
                      const pitchDeck = venture.documents?.find((doc: any) => doc.document_type === 'PITCH_DECK');
                      
                      // Debug logging in development
                      if (import.meta.env.DEV) {
                        console.log('Commit button check:', {
                          venture_id: venture.id,
                          venture_name: venture.name,
                          has_sharedDeck: !!sharedDeck,
                          has_pitchDeck: !!pitchDeck,
                          sharedPitchDecks_count: Array.isArray(sharedPitchDecks) ? sharedPitchDecks.length : 0,
                          commitment_status: sharedDeck?.commitment_status,
                          isLoading: isLoadingPortfolio || isLoadingSharedPitchDecks
                        });
                      }
                      
                      // Must have a pitch deck to show commit button
                      if (!pitchDeck || !validateUuid(venture.id) || !validateUuid(pitchDeck.id)) {
                        return null;
                      }
                      
                      // If pitch deck is shared, use shared deck info; otherwise use venture's pitch deck
                      if (sharedDeck) {
                        // Has shared pitch deck - show commitment actions based on status
                        const commitmentStatus = sharedDeck.commitment_status;
                        const canCommit = commitmentStatus !== 'COMMITTED' && 
                                         commitmentStatus !== 'WITHDRAWN' &&
                                         commitmentStatus !== 'COMPLETED';
                        
                        return (
                          <div className="flex flex-wrap gap-2">
                            {/* Commit to Invest - Show if not committed or withdrawn */}
                            {canCommit && (
                              <Button
                                variant="default"
                                size="sm"
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium"
                                onClick={() => {
                                  if (!validateUuid(sharedDeck.product_id) || !validateUuid(sharedDeck.document_id)) {
                                    toast.error("Invalid pitch deck or document ID");
                                    return;
                                  }
                                  handleCommitToInvest(sharedDeck.product_id, sharedDeck.document_id, sharedDeck.product_name || 'Venture');
                                }}
                                disabled={isLoadingPortfolio || isLoadingSharedPitchDecks}
                              >
                                <DollarSign className="w-4 h-4 mr-2" />
                                Commit to Invest
                              </Button>
                            )}
                            
                            {/* Update Commitment - Show if renegotiation requested */}
                            {commitmentStatus === 'COMMITTED' && 
                             sharedDeck.commitment_id && 
                             sharedDeck.product_id && 
                             sharedDeck.venture_response === 'RENEGOTIATE' && (
                              <Button
                                variant="default"
                                size="sm"
                                className="flex-1 text-white font-medium"
                                style={{ backgroundColor: '#ea580c', borderColor: '#ea580c' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#c2410c'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ea580c'; }}
                                onClick={() => {
                                  if (!validateUuid(sharedDeck.product_id) || !validateUuid(sharedDeck.commitment_id)) {
                                    toast.error("Invalid pitch deck or commitment ID");
                                    return;
                                  }
                                  handleUpdateCommitment(
                                    sharedDeck.product_id,
                                    sharedDeck.commitment_id,
                                    sharedDeck.product_name || 'Venture',
                                    sharedDeck.commitment_amount || undefined
                                  );
                                }}
                                disabled={isLoadingPortfolio || isLoadingSharedPitchDecks}
                              >
                                <DollarSign className="w-4 h-4 mr-2" />
                                Update Commitment
                              </Button>
                            )}
                            
                            {/* Retract Commitment - Show if committed and not accepted deal */}
                            {commitmentStatus === 'COMMITTED' && 
                             sharedDeck.commitment_id && 
                             sharedDeck.product_id && 
                             sharedDeck.venture_response !== 'ACCEPTED' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                className="flex-1 text-white font-medium"
                                style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#b91c1c'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#dc2626'; }}
                                onClick={() => {
                                  if (!validateUuid(sharedDeck.product_id) || !validateUuid(sharedDeck.commitment_id)) {
                                    toast.error("Invalid pitch deck or commitment ID");
                                    return;
                                  }
                                  handleWithdrawCommitment(
                                    sharedDeck.product_id,
                                    sharedDeck.commitment_id,
                                    sharedDeck.product_name || 'Venture'
                                  );
                                }}
                                disabled={isLoadingPortfolio || isLoadingSharedPitchDecks}
                              >
                                <X className="w-4 h-4 mr-2" />
                                Retract Commitment
                              </Button>
                            )}
                          </div>
                        );
                      }
                      
                      // Not shared yet - show commit button for public ventures
                      return (
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full text-white font-medium"
                          style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#15803d'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#16a34a'; }}
                          onClick={() => {
                            handleCommitToInvest(venture.id, pitchDeck.id, venture.name || 'Venture');
                          }}
                          disabled={isLoadingPortfolio || isLoadingSharedPitchDecks}
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Commit to Invest
                        </Button>
                      );
                    })()}
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

  // Handle profile and settings views - AFTER all hooks are called
  // These conditional returns must come after all hooks (useState, useEffect, useCallback, useMemo)
  if (activeView === 'edit-profile') {
    return <EditProfile user={user} onProfileUpdate={handleProfileUpdate} />;
  }

  if (activeView === 'settings') {
    return <Settings user={user} />;
  }

  if (activeView === 'profile') {
    // Pass refreshTrigger and location.pathname to force UserProfile to re-fetch data on navigation
    // Using location.pathname in the key ensures the component remounts when navigating to profile view
    // This fixes the issue where navigating to /dashboard/investor/profile doesn't show data
    return (
      <UserProfile 
        key={`${user.id}-${profileRefreshTrigger}-${location.pathname}`}
        user={user} 
        onEdit={() => onViewChange?.('edit-profile')} 
        isOwnProfile={true}
        refreshTrigger={profileRefreshTrigger}
      />
    );
  }

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