import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { 
  MessageSquare, 
  Globe, 
  Linkedin, 
  MapPin, 
  Calendar,
  Users,
  DollarSign,
  Star,
  Clock,
  FileText,
  Eye,
  Building,
  Phone,
  Mail,
  Edit,
  CheckCircle,
  AlertCircle,
  User,
  Briefcase
} from "lucide-react";
import { type FrontendUser } from '../types';
import { SafeText } from './SafeText';
import { validateAndSanitizeUrl } from '../utils/security';
import { productService, type VentureProduct } from '../services/productService';
import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface UserProfileProps {
  user: FrontendUser;
  currentUser?: FrontendUser;
  onMessage?: (userId: string) => void;
  onViewDocument?: (url: string) => void;
  onEdit?: () => void;
  onNavigateToPitchDecks?: () => void; // Callback to navigate to pitch deck creation
  isOwnProfile?: boolean;
  refreshTrigger?: number; // Optional trigger to force refresh when changed
}

export function UserProfile({ 
  user, 
  currentUser, 
  onMessage, 
  onViewDocument, 
  onEdit,
  onNavigateToPitchDecks,
  isOwnProfile = false,
  refreshTrigger
}: UserProfileProps) {
  const canMessage = currentUser && user.id !== currentUser.id && onMessage;
  
  // For venture users, fetch their products and profile to display company data
  const [products, setProducts] = useState<VentureProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [ventureProfile, setVentureProfile] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Use ref to track if we're currently fetching to prevent duplicate requests
  const isFetchingRef = useRef(false);
  
  useEffect(() => {
    // Prevent duplicate fetches and infinite loops
    if (!isOwnProfile || isFetchingRef.current) {
      return;
    }
    
    // Abort controller for cleanup
    const abortController = new AbortController();
    
    const fetchData = async () => {
      // Set fetching flag to prevent duplicate requests
      isFetchingRef.current = true;
      
      // Clear any previous load error before retrying.
      setLoadError(null);
      
      if (user.role === 'venture') {
        // Fetch venture profile data
        try {
          setIsLoadingProfile(true);
          const { ventureService } = await import('../services/ventureService');
          const profile = await ventureService.getMyProfile();
          
          // Check if component is still mounted and request wasn't aborted
          if (!abortController.signal.aborted && profile) {
            setVentureProfile(profile);
            console.log('Fetched venture profile:', profile);
          }
        } catch (error) {
          // Don't set error if request was aborted
          if (!abortController.signal.aborted) {
            console.error('Failed to fetch venture profile:', error);
            // Profile might not exist yet, but other failures should surface to the user.
            const message = error instanceof Error ? error.message : 'Failed to load venture profile.';
            setLoadError(message);
          }
        } finally {
          if (!abortController.signal.aborted) {
            setIsLoadingProfile(false);
          }
        }
        
        // Fetch products
        try {
          setIsLoadingProducts(true);
          const data = await productService.getMyProducts();
          
          // Check if component is still mounted and request wasn't aborted
          if (!abortController.signal.aborted) {
            console.log('Fetched products for profile:', data); // Debug log
            // Ensure we always have an array
            const productsArray = Array.isArray(data) ? data : [];
            setProducts(productsArray);
            console.log('Set products array:', productsArray.length, 'products');
          }
        } catch (error) {
          // Don't set error if request was aborted
          if (!abortController.signal.aborted) {
            console.error('Failed to fetch products:', error);
            setProducts([]);
            const message = error instanceof Error ? error.message : 'Failed to load pitch decks.';
            setLoadError((prev) => prev || message);
          }
        } finally {
          if (!abortController.signal.aborted) {
            setIsLoadingProducts(false);
          }
        }
      } else if (user.role === 'investor') {
        // Fetch investor profile data
        try {
          setIsLoadingProfile(true);
          const { investorService } = await import('../services/investorService');
          const profile = await investorService.getMyProfile();
          
          // Check if component is still mounted and request wasn't aborted
          if (!abortController.signal.aborted && profile) {
            setVentureProfile(profile); // Reuse same state variable for consistency
            console.log('Fetched investor profile:', profile);
          }
        } catch (error) {
          // Don't set error if request was aborted
          if (!abortController.signal.aborted) {
            console.error('Failed to fetch investor profile:', error);
            // Profile might not exist yet, that's okay - don't show error for 404
            if (error instanceof Error && !error.message.includes('404')) {
              const message = error.message || 'Failed to load investor profile.';
              setLoadError(message);
            }
          }
        } finally {
          if (!abortController.signal.aborted) {
            setIsLoadingProfile(false);
          }
        }
      } else if (user.role === 'mentor') {
        // Fetch mentor profile data
        try {
          setIsLoadingProfile(true);
          const { mentorService } = await import('../services/mentorService');
          const profile = await mentorService.getMyProfile();
          
          // Check if component is still mounted and request wasn't aborted
          if (!abortController.signal.aborted && profile) {
            setVentureProfile(profile); // Reuse same state variable for consistency
            console.log('Fetched mentor profile:', profile);
          }
        } catch (error) {
          // Don't set error if request was aborted
          if (!abortController.signal.aborted) {
            console.error('Failed to fetch mentor profile:', error);
            // Profile might not exist yet, that's okay - don't show error for 404
            if (error instanceof Error && !error.message.includes('404')) {
              const message = error.message || 'Failed to load mentor profile.';
              setLoadError(message);
            }
          }
        } finally {
          if (!abortController.signal.aborted) {
            setIsLoadingProfile(false);
          }
        }
      }
      
      // Reset fetching flag
      isFetchingRef.current = false;
    };
    
    fetchData();
    
    // Cleanup function to abort requests if component unmounts or dependencies change
    return () => {
      abortController.abort();
      isFetchingRef.current = false;
    };
  }, [user.role, isOwnProfile, user.id, refreshTrigger]); // Add refreshTrigger to dependencies to force refresh when changed
  
  const renderVentureProfile = (venture: FrontendUser) => {
    const profile = venture.profile || {};
    
    // Get data from API profile (for own profile), products, or from profile object (for viewing others)
    // For own profile, prioritize API profile data > user.profile (from EditProfile) > products > fallbacks
    let latestProduct = null;
    if (isOwnProfile && products.length > 0) {
      // Prefer approved and active products, but fall back to any product
      const approvedProducts = products.filter((p: any) => p.status === 'APPROVED' && p.is_active);
      if (approvedProducts.length > 0) {
        latestProduct = approvedProducts[0];
      } else {
        // Show most recent product even if not approved (for own profile)
        latestProduct = products[0];
      }
    }
    
    // Priority for own profile: API profile > user.profile (from EditProfile) > products > fallbacks
    // Priority for viewing others: products > user.profile > fallbacks
    const companyName = isOwnProfile 
      ? (ventureProfile?.company_name || (profile as any)?.companyName || latestProduct?.name || (profile as any)?.name || venture.full_name || venture.email)
      : (latestProduct?.name || (profile as any)?.companyName || (profile as any)?.name || venture.full_name || venture.email);
    
    const shortDescription = isOwnProfile
      ? (ventureProfile?.short_description || (profile as any)?.shortDescription || latestProduct?.short_description || (profile as any)?.short_description || '')
      : (latestProduct?.short_description || (profile as any)?.shortDescription || (profile as any)?.short_description || '');
    
    const location = isOwnProfile
      ? (ventureProfile?.address || (profile as any)?.address || latestProduct?.address || (profile as any)?.location || '')
      : (latestProduct?.address || (profile as any)?.address || (profile as any)?.location || '');
    
    const foundedYear = isOwnProfile
      ? (ventureProfile?.year_founded?.toString() || (profile as any)?.foundedYear?.toString() || latestProduct?.year_founded?.toString() || (profile as any)?.year_founded?.toString() || '')
      : (latestProduct?.year_founded?.toString() || (profile as any)?.foundedYear?.toString() || (profile as any)?.year_founded?.toString() || '');
    
    const teamSize = isOwnProfile
      ? (ventureProfile?.employees_count?.toString() || (profile as any)?.employeeCount?.toString() || latestProduct?.employees_count?.toString() || (profile as any)?.teamSize?.toString() || (profile as any)?.employees_count?.toString() || '')
      : (latestProduct?.employees_count?.toString() || (profile as any)?.employeeCount?.toString() || (profile as any)?.teamSize?.toString() || '');
    
    const website = isOwnProfile
      ? (ventureProfile?.website || (profile as any)?.website || latestProduct?.website || '')
      : (latestProduct?.website || (profile as any)?.website || '');
    
    const linkedinUrl = isOwnProfile
      ? (ventureProfile?.linkedin_url || (profile as any)?.linkedinUrl || latestProduct?.linkedin_url || (profile as any)?.linkedin_url || '')
      : (latestProduct?.linkedin_url || (profile as any)?.linkedinUrl || (profile as any)?.linkedin_url || '');

    // Get founder information (user's personal information)
    const founderLinkedin = isOwnProfile
      ? (ventureProfile?.founder_linkedin || (profile as any)?.founderLinkedin || '')
      : ((profile as any)?.founderLinkedin || '');
    
    const founderName = isOwnProfile
      ? (ventureProfile?.founder_name || (profile as any)?.founderName || venture.full_name || '')
      : ((profile as any)?.founderName || venture.full_name || '');
    
    const founderRole = isOwnProfile
      ? (ventureProfile?.founder_role || (profile as any)?.founderRole || '')
      : ((profile as any)?.founderRole || '');

    const industrySector = isOwnProfile
      ? (ventureProfile?.sector || (profile as any)?.sector || latestProduct?.industry_sector || (profile as any)?.industry_sector || '')
      : (latestProduct?.industry_sector || (profile as any)?.sector || (profile as any)?.industry_sector || '');
    
    const approvalStatus = latestProduct?.status?.toLowerCase() || (profile as any)?.approvalStatus || (profile as any)?.approval_status || 'pending';
    
    // Get logo from API profile or profile object
    const logoUrl = isOwnProfile
      ? (ventureProfile?.logo_url_display || ventureProfile?.logo_url || (profile as any)?.logo || '')
      : ((profile as any)?.logo || '');
    
    // Debug: Log what data we have
    console.log('Profile data:', {
      isOwnProfile,
      hasProducts: products.length > 0,
      hasVentureProfile: !!ventureProfile,
      ventureProfile: ventureProfile ? {
        company_name: ventureProfile.company_name,
        website: ventureProfile.website,
        linkedin_url: ventureProfile.linkedin_url,
        sector: ventureProfile.sector
      } : null,
      profileData: {
        companyName: (profile as any)?.companyName,
        website: (profile as any)?.website,
        linkedinUrl: (profile as any)?.linkedinUrl,
        sector: (profile as any)?.sector
      },
      latestProduct: latestProduct ? {
        name: latestProduct.name,
        website: latestProduct.website,
        linkedin_url: latestProduct.linkedin_url
      } : null,
      finalValues: {
        companyName,
        website,
        linkedinUrl,
        industrySector
      }
    });
    
    return (
      <div className="space-y-6">
        {/* Header - User Information Only (LinkedIn Style) */}
        <div className="flex items-start space-x-4">
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex items-center justify-center border-2 border-gray-200">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={founderName || companyName}
                className="w-full h-full object-cover"
              />
            ) : (
              <Building className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            {/* User Name and Title */}
            <div className="flex items-center space-x-3 mb-2">
              {founderName && (
                <h1 className="text-2xl font-bold">{founderName}</h1>
              )}
              <Badge variant={approvalStatus === 'approved' ? 'default' : 'secondary'}>
                {approvalStatus === 'approved' ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : (
                  <AlertCircle className="w-3 h-3 mr-1" />
                )}
                {approvalStatus.charAt(0).toUpperCase() + approvalStatus.slice(1)}
              </Badge>
            </div>
            {founderRole && (
              <p className="text-muted-foreground mb-3">{founderRole}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {isOwnProfile && onEdit && (
              <button onClick={onEdit} className="btn-chrome-secondary">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
            )}
            {canMessage && (
              <button onClick={() => onMessage?.(user.id)} className="btn-chrome-primary">
                <MessageSquare className="w-4 h-4 mr-2" />
                Message
              </button>
            )}
          </div>
        </div>

        {/* LinkedIn-Style Cards for User Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contact Information Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {founderLinkedin && (() => {
                const safeUrl = validateAndSanitizeUrl(founderLinkedin);
                return safeUrl ? (
                  <div className="flex items-center">
                    <Linkedin className="w-4 h-4 mr-2 text-muted-foreground" />
                    <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline text-blue-600">
                      LinkedIn Profile
                    </a>
                  </div>
                ) : null;
              })()}
              {venture.email && (
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                  <a href={`mailto:${venture.email}`} className="text-sm hover:underline">{venture.email}</a>
                </div>
              )}
              {profile.phone && (
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                  <a href={`tel:${profile.phone}`} className="text-sm hover:underline">{profile.phone}</a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Professional Information Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Professional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {founderRole && (
                <div className="flex items-center">
                  <Briefcase className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{founderRole}</span>
                </div>
              )}
              {companyName && (
                <div className="flex items-center">
                  <Building className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{companyName}</span>
                </div>
              )}
              {location && (
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{location}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Business Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Business Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {shortDescription && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <SafeText text={shortDescription} as="p" className="text-sm text-muted-foreground" />
                </div>
              )}
              {industrySector && (
                <div>
                  <h4 className="font-medium mb-2">Industry</h4>
                  <p className="text-sm text-muted-foreground">{industrySector}</p>
                </div>
              )}
              {linkedinUrl && (() => {
                const safeUrl = validateAndSanitizeUrl(linkedinUrl);
                return safeUrl ? (
                  <div>
                    <h4 className="font-medium mb-2">Business LinkedIn</h4>
                    <Button variant="outline" size="sm" asChild>
                      <a href={safeUrl} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="w-4 h-4 mr-2" />
                        View Company LinkedIn
                      </a>
                    </Button>
                  </div>
                ) : null;
              })()}
              {website && (() => {
                const safeUrl = validateAndSanitizeUrl(website);
                return safeUrl ? (
                  <div>
                    <h4 className="font-medium mb-2">Website</h4>
                    <Button variant="outline" size="sm" asChild>
                      <a href={safeUrl} target="_blank" rel="noopener noreferrer">
                        <Globe className="w-4 h-4 mr-2" />
                        Visit Website
                      </a>
                    </Button>
                  </div>
                ) : null;
              })()}
              {location && (
                <div>
                  <h4 className="font-medium mb-2">Location</h4>
                  <p className="text-sm text-muted-foreground">{location}</p>
                </div>
              )}
              {foundedYear && (
                <div>
                  <h4 className="font-medium mb-2">Founded</h4>
                  <p className="text-sm text-muted-foreground">{foundedYear}</p>
                </div>
              )}
              {teamSize && (
                <div>
                  <h4 className="font-medium mb-2">Team Size</h4>
                  <p className="text-sm text-muted-foreground">{teamSize} employees</p>
                </div>
              )}
              {latestProduct && latestProduct.documents && latestProduct.documents.length > 0 && (() => {
                const pitchDeck = latestProduct.documents.find((doc: any) => doc.document_type === 'PITCH_DECK');
                if (pitchDeck?.funding_stage) {
                  return (
                    <div>
                      <h4 className="font-medium mb-2">Funding Stage</h4>
                      <p className="text-sm text-muted-foreground">{pitchDeck.funding_stage.replace('_', ' ')}</p>
                    </div>
                  );
                }
                return null;
              })()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Funding Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {latestProduct && latestProduct.documents && latestProduct.documents.length > 0 && (() => {
                const pitchDeck = latestProduct.documents.find((doc: any) => doc.document_type === 'PITCH_DECK');
                if (pitchDeck?.funding_amount) {
                  return (
                    <div>
                      <h4 className="font-medium mb-2">Funding Goal</h4>
                      <p className="text-sm text-muted-foreground">{pitchDeck.funding_amount}</p>
                    </div>
                  );
                }
                return (
                  <div>
                    <h4 className="font-medium mb-2">Funding Goal</h4>
                    <p className="text-sm text-muted-foreground">Not specified</p>
                  </div>
                );
              })()}
              {latestProduct && latestProduct.documents && latestProduct.documents.length > 0 && (() => {
                const pitchDeck = latestProduct.documents.find((doc: any) => doc.document_type === 'PITCH_DECK');
                if (pitchDeck?.use_of_funds) {
                  return (
                    <div>
                      <h4 className="font-medium mb-2">Use of Funds</h4>
                      <p className="text-sm text-muted-foreground">{pitchDeck.use_of_funds}</p>
                    </div>
                  );
                }
                return null;
              })()}
              {foundedYear && (
                <div>
                  <h4 className="font-medium mb-2">Founded</h4>
                  <p className="text-sm text-muted-foreground">{foundedYear}</p>
                </div>
              )}
              {teamSize && (
                <div>
                  <h4 className="font-medium mb-2">Team Size</h4>
                  <p className="text-sm text-muted-foreground">{teamSize} employees</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Products Section (for own profile) */}
        {isOwnProfile && products.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">My Pitch Decks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {products.map((product: any) => (
                  <div key={product.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">{product.industry_sector}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant={product.status === 'APPROVED' ? 'default' : 'secondary'}>
                            {product.status}
                          </Badge>
                          {product.is_active && (
                            <Badge variant="outline">Active</Badge>
                          )}
                        </div>
                      </div>
                      {product.website && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={product.website} target="_blank" rel="noopener noreferrer">
                            <Globe className="w-4 h-4 mr-2" />
                            Website
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State for Products */}
        {isOwnProfile && !isLoadingProducts && products.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Building className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">No Pitch Decks Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first pitch deck to display company information on your profile.
              </p>
              {onNavigateToPitchDecks && (
                <Button onClick={onNavigateToPitchDecks} variant="outline">
                  Go to Pitch Decks
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderInvestorProfile = (investor: FrontendUser) => {
    const profile = investor.profile || {};
    
    // For own profile, prioritize API profile data (ventureProfile) > user.profile (from EditProfile) > fallbacks
    // For viewing others, use user.profile only
    const apiProfile = isOwnProfile ? ventureProfile : null;
    
    // Map API response fields to display fields
    const name = isOwnProfile
      ? (apiProfile?.full_name || profile.name || investor.full_name || investor.email)
      : (profile.name || investor.full_name || investor.email);
    
    const approvalStatus = isOwnProfile
      ? (apiProfile?.status?.toLowerCase() || profile.approvalStatus || profile.approval_status || 'pending')
      : (profile.approvalStatus || profile.approval_status || 'pending');
    
    const organizationName = isOwnProfile
      ? (apiProfile?.organization_name || profile.organizationName || profile.organization_name || '')
      : (profile.organizationName || profile.organization_name || '');
    
    // Get bio from API profile (now stored in backend) or fallback to profile
    const bio = isOwnProfile
      ? (apiProfile?.bio || profile.bio || profile.experience_overview || '')
      : (profile.bio || profile.experience_overview || '');
    
    // Get investment experience description from API profile (now stored in backend)
    const investmentExperience = isOwnProfile
      ? (apiProfile?.investment_experience || profile.investmentExperience || '')
      : (profile.investmentExperience || '');
    
    const investmentRange = isOwnProfile
      ? (apiProfile?.average_ticket_size || profile.investmentRange || profile.average_ticket_size || '')
      : (profile.investmentRange || profile.average_ticket_size || '');
    
    // Get address from API profile (now stored in backend) or fallback to location
    const location = isOwnProfile
      ? (apiProfile?.address || profile.address || profile.location || '')
      : (profile.address || profile.location || '');
    
    // Get industry preferences from API or profile
    const industryPreferences = isOwnProfile
      ? (apiProfile?.industry_preferences || profile.industries || profile.industry_preferences || [])
      : (profile.industries || profile.industry_preferences || []);
    
    // Get stage preferences from API or profile
    const stagePreferences = isOwnProfile
      ? (apiProfile?.stage_preferences || profile.investmentStages || profile.stage_preferences || [])
      : (profile.investmentStages || profile.stage_preferences || []);
    
    // Get contact info from API or profile
    const linkedinOrWebsite = isOwnProfile
      ? (apiProfile?.linkedin_url || apiProfile?.linkedin_or_website || profile.linkedinUrl || profile.linkedin_or_website || '')
      : (profile.linkedinUrl || profile.linkedin_or_website || '');

    // Get website separately from API or profile
    const website = isOwnProfile
      ? (apiProfile?.website || profile.website || '')
      : (profile.website || '');

    const phone = isOwnProfile
      ? (apiProfile?.phone || profile.phone || '')
      : (profile.phone || '');

    const email = isOwnProfile
      ? (apiProfile?.email || investor.email || '')
      : (investor.email || '');

    // Get investor type from API or profile
    const investorTypeBackend = isOwnProfile
      ? (apiProfile?.investor_type || '')
      : '';
    const investorTypeMap: Record<string, string> = {
      'INDIVIDUAL': 'Individual',
      'FIRM': 'Firm',
      'CORPORATE': 'Corporate',
      'FAMILY_OFFICE': 'Family Office',
    };
    const investorType = investorTypeBackend 
      ? investorTypeMap[investorTypeBackend] || investorTypeBackend
      : (profile.investorType ? profile.investorType.charAt(0).toUpperCase() + profile.investorType.slice(1).replace('-', ' ') : '');

    // Get min/max investment from API or profile
    const minInvestment = isOwnProfile
      ? (apiProfile?.min_investment || profile.minInvestment || '')
      : (profile.minInvestment || '');
    const maxInvestment = isOwnProfile
      ? (apiProfile?.max_investment || profile.maxInvestment || '')
      : (profile.maxInvestment || '');

    // Get geographic focus from API or profile
    const geographicFocus = isOwnProfile
      ? (apiProfile?.geographic_focus || profile.geographicFocus || [])
      : (profile.geographicFocus || []);

    // Get investment philosophy and notable investments from API or profile
    const investmentPhilosophy = isOwnProfile
      ? (apiProfile?.investment_philosophy || profile.investmentPhilosophy || '')
      : (profile.investmentPhilosophy || '');
    const notableInvestments = isOwnProfile
      ? (apiProfile?.notable_investments || profile.notableInvestments || '')
      : (profile.notableInvestments || '');

    // Get investment experience years
    const investmentExperienceYears = isOwnProfile
      ? (apiProfile?.investment_experience_years || (profile.investmentExperience && typeof profile.investmentExperience === 'number' ? profile.investmentExperience : null))
      : (profile.investmentExperience && typeof profile.investmentExperience === 'number' ? profile.investmentExperience : null);

    // Get deals count
    const dealsCount = isOwnProfile
      ? (apiProfile?.deals_count || profile.dealsCount || null)
      : (profile.dealsCount || null);
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start space-x-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={profile.avatar} />
            <AvatarFallback>{(name && name[0]) || 'I'}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-1">
              <SafeText text={name} as="h1" className="text-2xl font-bold" />
              <Badge variant={approvalStatus === 'approved' ? 'default' : 'secondary'}>
                {approvalStatus === 'approved' ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : (
                  <AlertCircle className="w-3 h-3 mr-1" />
                )}
                {approvalStatus.charAt(0).toUpperCase() + approvalStatus.slice(1)}
              </Badge>
            </div>
            {organizationName && (
              <SafeText text={organizationName} as="p" className="text-lg text-muted-foreground mb-2" />
            )}
            {bio && (
              <SafeText text={bio} as="p" className="text-muted-foreground mb-3" />
            )}
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              {investmentRange && (
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" />
                  <SafeText text={investmentRange} />
                </div>
              )}
              {location && (
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {location}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isOwnProfile && onEdit && (
              <button onClick={onEdit} className="btn-chrome-secondary">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
            )}
            {canMessage && (
              <button onClick={() => onMessage?.(user.id)} className="btn-chrome-primary">
                <MessageSquare className="w-4 h-4 mr-2" />
                Message
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {investmentRange && (
            <Badge variant="outline">{investmentRange}</Badge>
          )}
          {industryPreferences?.map((sector: string) => (
            <Badge key={sector} variant="outline">{sector}</Badge>
          ))}
        </div>

        {/* Contact & Links */}
        <div className="flex items-center space-x-4 flex-wrap">
          {website && (() => {
            const safeUrl = validateAndSanitizeUrl(website);
            return safeUrl ? (
              <Button variant="outline" size="sm" asChild>
                <a href={safeUrl} target="_blank" rel="noopener noreferrer">
                  <Globe className="w-4 h-4 mr-2" />
                  Website
                </a>
              </Button>
            ) : null;
          })()}
          {linkedinOrWebsite && (() => {
            const safeUrl = validateAndSanitizeUrl(linkedinOrWebsite);
            // Only show LinkedIn if it's different from website
            if (website && safeUrl === validateAndSanitizeUrl(website)) {
              return null;
            }
            return safeUrl ? (
              <Button variant="outline" size="sm" asChild>
                <a href={safeUrl} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="w-4 h-4 mr-2" />
                  LinkedIn
                </a>
              </Button>
            ) : null;
          })()}
          {phone && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Phone className="w-4 h-4 mr-1" />
              {phone}
            </div>
          )}
          {email && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Mail className="w-4 h-4 mr-1" />
              {email}
            </div>
          )}
        </div>

        <Separator />

        {/* Investment Focus */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Investment Focus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {investorType && (
                <div>
                  <h4 className="font-medium mb-2">Investor Type</h4>
                  <SafeText text={investorType} as="p" className="text-sm text-muted-foreground" />
                </div>
              )}
              {(minInvestment || maxInvestment) && (
                <div>
                  <h4 className="font-medium mb-2">Investment Range</h4>
                  <p className="text-sm text-muted-foreground">
                    {minInvestment && maxInvestment 
                      ? `${minInvestment} - ${maxInvestment}`
                      : minInvestment 
                        ? `Min: ${minInvestment}`
                        : `Max: ${maxInvestment}`}
                  </p>
                </div>
              )}
              {investmentRange && (
                <div>
                  <h4 className="font-medium mb-2">Typical Ticket Size</h4>
                  <SafeText text={investmentRange} as="p" className="text-sm text-muted-foreground" />
                </div>
              )}
              {industryPreferences && industryPreferences.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Industries</h4>
                  <div className="flex flex-wrap gap-2">
                    {industryPreferences.map((sector: string) => (
                      <Badge key={sector} variant="outline">
                        <SafeText text={sector} />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {stagePreferences && stagePreferences.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Investment Stages</h4>
                  <div className="flex flex-wrap gap-2">
                    {stagePreferences.map((stage: string) => (
                      <Badge key={stage} variant="outline">{stage}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {geographicFocus && geographicFocus.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Geographic Focus</h4>
                  <div className="flex flex-wrap gap-2">
                    {geographicFocus.map((region: string) => (
                      <Badge key={region} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {region}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {investmentExperienceYears !== null && investmentExperienceYears !== undefined && (
                <div>
                  <h4 className="font-medium mb-2">Years of Experience</h4>
                  <p className="text-sm text-muted-foreground">
                    {investmentExperienceYears} {investmentExperienceYears === 1 ? 'year' : 'years'}
                  </p>
                </div>
              )}
              {dealsCount !== null && dealsCount !== undefined && (
                <div>
                  <h4 className="font-medium mb-2">Total Deals</h4>
                  <p className="text-sm text-muted-foreground">{dealsCount} deals</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Background</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Organization</h4>
                <SafeText text={organizationName || 'Independent Investor'} as="p" className="text-sm text-muted-foreground" />
              </div>
              {profile.jobTitle && (
                <div>
                  <h4 className="font-medium mb-2">Job Title</h4>
                  <SafeText text={profile.jobTitle} as="p" className="text-sm text-muted-foreground" />
                </div>
              )}
              {bio && (
                <div>
                  <h4 className="font-medium mb-2">Bio</h4>
                  <SafeText text={bio} as="p" className="text-sm text-muted-foreground whitespace-pre-wrap" />
                </div>
              )}
              {investmentExperience && (
                <div>
                  <h4 className="font-medium mb-2">Investment Experience</h4>
                  <SafeText text={investmentExperience} as="p" className="text-sm text-muted-foreground whitespace-pre-wrap" />
                </div>
              )}
              {investmentPhilosophy && (
                <div>
                  <h4 className="font-medium mb-2">Investment Philosophy</h4>
                  <SafeText text={investmentPhilosophy} as="p" className="text-sm text-muted-foreground whitespace-pre-wrap" />
                </div>
              )}
              {notableInvestments && (
                <div>
                  <h4 className="font-medium mb-2">Notable Investments</h4>
                  <SafeText text={notableInvestments} as="p" className="text-sm text-muted-foreground whitespace-pre-wrap" />
                </div>
              )}
              {location && (
                <div>
                  <h4 className="font-medium mb-2">Location</h4>
                  <SafeText text={location} as="p" className="text-sm text-muted-foreground" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderMentorProfile = (mentor: FrontendUser) => {
    const profile = mentor.profile || {};
    const name = profile.name || mentor.full_name || mentor.email;
    const approvalStatus = profile.approvalStatus || profile.approval_status || 'pending';
    const jobTitle = profile.jobTitle || profile.job_title || '';
    const company = profile.company || '';
    const bio = profile.bio || profile.experience_overview || '';
    const experience = profile.experience || profile.experience_years || '';
    const availableHours = profile.availableHours || profile.availability_hours || '';
    const location = profile.location || '';
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start space-x-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={profile.avatar} />
            <AvatarFallback>{(name && name[0]) || 'M'}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-1">
              <SafeText text={name} as="h1" className="text-2xl font-bold" />
              <Badge variant={approvalStatus === 'approved' ? 'default' : 'secondary'}>
                {approvalStatus === 'approved' ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : (
                  <AlertCircle className="w-3 h-3 mr-1" />
                )}
                {approvalStatus.charAt(0).toUpperCase() + approvalStatus.slice(1)}
              </Badge>
            </div>
            {(jobTitle || company) && (
              <p className="text-lg text-muted-foreground mb-2">
                <SafeText text={jobTitle && company ? `${jobTitle} at ${company}` : (jobTitle || company)} />
              </p>
            )}
            {bio && (
              <SafeText text={bio} as="p" className="text-muted-foreground mb-3" />
            )}
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              {experience && (
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {experience} years experience
                </div>
              )}
              {availableHours && (
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {availableHours}h/month available
                </div>
              )}
              {location && (
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {location}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isOwnProfile && onEdit && (
              <button onClick={onEdit} className="btn-chrome-secondary">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
            )}
            {canMessage && (
              <button onClick={() => onMessage?.(user.id)} className="btn-chrome-primary">
                <MessageSquare className="w-4 h-4 mr-2" />
                Message
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {experience && (
            <Badge variant="outline">{experience} years experience</Badge>
          )}
          {(profile.expertise || profile.expertise_fields)?.map((area: string) => (
            <Badge key={area} variant="outline">{area}</Badge>
          ))}
        </div>

        {/* Contact & Links */}
        <div className="flex items-center space-x-4">
          {profile.website && (() => {
            const safeUrl = validateAndSanitizeUrl(profile.website);
            return safeUrl ? (
              <Button variant="outline" size="sm" asChild>
                <a href={safeUrl} target="_blank" rel="noopener noreferrer">
                  <Globe className="w-4 h-4 mr-2" />
                  Website
                </a>
              </Button>
            ) : null;
          })()}
          {profile.linkedinUrl && (() => {
            const safeUrl = validateAndSanitizeUrl(profile.linkedinUrl);
            return safeUrl ? (
              <Button variant="outline" size="sm" asChild>
                <a href={safeUrl} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="w-4 h-4 mr-2" />
                  LinkedIn
                </a>
              </Button>
            ) : null;
          })()}
          {profile.linkedin_or_website && (() => {
            const safeUrl = validateAndSanitizeUrl(profile.linkedin_or_website);
            return safeUrl ? (
              <Button variant="outline" size="sm" asChild>
                <a href={safeUrl} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="w-4 h-4 mr-2" />
                  LinkedIn
                </a>
              </Button>
            ) : null;
          })()}
          {profile.phone && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Phone className="w-4 h-4 mr-1" />
              {profile.phone}
            </div>
          )}
          {mentor.email && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Mail className="w-4 h-4 mr-1" />
              {mentor.email}
            </div>
          )}
        </div>

        <Separator />

        {/* Expertise & Availability */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Expertise & Experience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(profile.expertise || profile.expertise_fields) && (
                <div>
                  <h4 className="font-medium mb-2">Areas of Expertise</h4>
                  <div className="flex flex-wrap gap-2">
                    {(profile.expertise || profile.expertise_fields || []).map((area: string) => (
                      <Badge key={area} variant="outline">
                        <SafeText text={area} />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {company && (
                <div>
                  <h4 className="font-medium mb-2">Company</h4>
                  <SafeText text={company} as="p" className="text-sm text-muted-foreground" />
                </div>
              )}
              {bio && (
                <div>
                  <h4 className="font-medium mb-2">Bio</h4>
                  <p className="text-sm text-muted-foreground">{bio}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mentoring Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {experience && (
                <div>
                  <h4 className="font-medium mb-2">Experience</h4>
                  <p className="text-sm text-muted-foreground">{experience} years</p>
                </div>
              )}
              {availableHours && (
                <div>
                  <h4 className="font-medium mb-2">Availability</h4>
                  <p className="text-sm text-muted-foreground">{availableHours} hours per month</p>
                </div>
              )}
              {jobTitle && (
                <div>
                  <h4 className="font-medium mb-2">Job Title</h4>
                  <SafeText text={jobTitle} as="p" className="text-sm text-muted-foreground" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // Show loading state when fetching profile data (for all roles)
  if (isOwnProfile && isLoadingProfile) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading profile data...</span>
        </div>
      </div>
    );
  }
  
  // Show loading state for venture profile when fetching products
  if (user.role === 'venture' && isOwnProfile && isLoadingProducts) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading products...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Inline load error (non-blocking) so the user isn't stuck with silent failures */}
      {isOwnProfile && user.role === 'venture' && loadError && (
        <Card className="border border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">We couldn’t load your profile data.</p>
                <p className="text-sm text-red-800">{loadError}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="border-red-300 text-red-900 hover:bg-red-100"
              onClick={() => {
                // Re-run the same effect by forcing a state change via a quick retry path.
                // (We keep it simple: just refresh the page view data by calling the fetcher again.)
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                (async () => {
                  // minimal inline retry without refactor: mimic the effect body by triggering a re-render
                  setLoadError(null);
                  setIsLoadingProfile(true);
                  setIsLoadingProducts(true);
                  try {
                    const { ventureService } = await import('../services/ventureService');
                    const profile = await ventureService.getMyProfile();
                    if (profile) setVentureProfile(profile);
                  } catch (e) {
                    setLoadError(e instanceof Error ? e.message : 'Failed to load venture profile.');
                  } finally {
                    setIsLoadingProfile(false);
                  }
                  try {
                    const data = await productService.getMyProducts();
                    setProducts(Array.isArray(data) ? data : []);
                  } catch (e) {
                    setLoadError((prev) => prev || (e instanceof Error ? e.message : 'Failed to load pitch decks.'));
                    setProducts([]);
                  } finally {
                    setIsLoadingProducts(false);
                  }
                })();
              }}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}
      {user.role === 'venture' && renderVentureProfile(user)}
      {user.role === 'investor' && renderInvestorProfile(user)}
      {user.role === 'mentor' && renderMentorProfile(user)}
    </div>
  );
}