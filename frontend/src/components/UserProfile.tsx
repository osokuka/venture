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
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface UserProfileProps {
  user: FrontendUser;
  currentUser?: FrontendUser;
  onMessage?: (userId: string) => void;
  onViewDocument?: (url: string) => void;
  onEdit?: () => void;
  onNavigateToPitchDecks?: () => void; // Callback to navigate to pitch deck creation
  isOwnProfile?: boolean;
}

export function UserProfile({ 
  user, 
  currentUser, 
  onMessage, 
  onViewDocument, 
  onEdit,
  onNavigateToPitchDecks,
  isOwnProfile = false 
}: UserProfileProps) {
  const canMessage = currentUser && user.id !== currentUser.id && onMessage;
  
  // For venture users, fetch their products and profile to display company data
  const [products, setProducts] = useState<VentureProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [ventureProfile, setVentureProfile] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  
  useEffect(() => {
    if (user.role === 'venture' && isOwnProfile) {
      const fetchData = async () => {
        // Fetch profile data
        try {
          setIsLoadingProfile(true);
          const { ventureService } = await import('../services/ventureService');
          const profile = await ventureService.getMyProfile();
          if (profile) {
            setVentureProfile(profile);
            console.log('Fetched venture profile:', profile);
          }
        } catch (error) {
          console.error('Failed to fetch venture profile:', error);
          // Profile might not exist yet, that's okay
        } finally {
          setIsLoadingProfile(false);
        }
        
        // Fetch products
        try {
          setIsLoadingProducts(true);
          const data = await productService.getMyProducts();
          console.log('Fetched products for profile:', data); // Debug log
          // Ensure we always have an array
          const productsArray = Array.isArray(data) ? data : [];
          setProducts(productsArray);
          console.log('Set products array:', productsArray.length, 'products');
        } catch (error) {
          console.error('Failed to fetch products:', error);
          setProducts([]);
        } finally {
          setIsLoadingProducts(false);
        }
      };
      fetchData();
    }
  }, [user.role, isOwnProfile, user.id]); // Add user.id to dependencies
  
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
    const name = profile.name || investor.full_name || investor.email;
    const approvalStatus = profile.approvalStatus || profile.approval_status || 'pending';
    const organizationName = profile.organizationName || profile.organization_name || '';
    const bio = profile.bio || profile.experience_overview || '';
    const investmentRange = profile.investmentRange || profile.average_ticket_size || '';
    const location = profile.location || '';
    
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
          {(profile.sectors || profile.industry_preferences)?.map((sector: string) => (
            <Badge key={sector} variant="outline">{sector}</Badge>
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
          {investor.email && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Mail className="w-4 h-4 mr-1" />
              {investor.email}
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
              {investmentRange && (
                <div>
                  <h4 className="font-medium mb-2">Investment Range</h4>
                  <SafeText text={investmentRange} as="p" className="text-sm text-muted-foreground" />
                </div>
              )}
              {(profile.sectors || profile.industry_preferences) && (
                <div>
                  <h4 className="font-medium mb-2">Sectors</h4>
                  <div className="flex flex-wrap gap-2">
                    {(profile.sectors || profile.industry_preferences || []).map((sector: string) => (
                      <Badge key={sector} variant="outline">
                        <SafeText text={sector} />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {(profile.stage || profile.stage_preferences) && (
                <div>
                  <h4 className="font-medium mb-2">Stages</h4>
                  <div className="flex flex-wrap gap-2">
                    {(profile.stage || profile.stage_preferences || []).map((stage: string) => (
                      <Badge key={stage} variant="outline">{stage}</Badge>
                    ))}
                  </div>
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
                  <SafeText text={bio} as="p" className="text-sm text-muted-foreground" />
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

  // Show loading state for venture profile when fetching data
  if (user.role === 'venture' && isOwnProfile && (isLoadingProducts || isLoadingProfile)) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading profile data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {user.role === 'venture' && renderVentureProfile(user)}
      {user.role === 'investor' && renderInvestorProfile(user)}
      {user.role === 'mentor' && renderMentorProfile(user)}
    </div>
  );
}