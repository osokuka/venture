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
  AlertCircle
} from "lucide-react";
import { type FrontendUser } from '../types';
import { SafeText } from './SafeText';
import { validateAndSanitizeUrl } from '../utils/security';

interface UserProfileProps {
  user: FrontendUser;
  currentUser?: FrontendUser;
  onMessage?: (userId: string) => void;
  onViewDocument?: (url: string) => void;
  onEdit?: () => void;
  isOwnProfile?: boolean;
}

export function UserProfile({ 
  user, 
  currentUser, 
  onMessage, 
  onViewDocument, 
  onEdit,
  isOwnProfile = false 
}: UserProfileProps) {
  const canMessage = currentUser && user.id !== currentUser.id && onMessage;
  
  const renderVentureProfile = (venture: FrontendUser) => {
    const profile = venture.profile || {};
    const companyName = profile.companyName || profile.name || venture.full_name || venture.email;
    const shortDescription = profile.shortDescription || profile.short_description || '';
    const location = profile.location || profile.address || '';
    const foundedYear = profile.foundedYear || profile.year_founded || '';
    const teamSize = profile.teamSize || profile.employees_count || profile.team_size || '';
    const approvalStatus = profile.approvalStatus || profile.approval_status || 'pending';
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
            {profile.logo ? (
              <img 
                src={profile.logo} 
                alt={companyName}
                className="w-full h-full object-cover"
              />
            ) : (
              <Building className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <SafeText text={companyName} as="h1" className="text-2xl font-bold" />
              <Badge variant={approvalStatus === 'approved' ? 'default' : 'secondary'}>
                {approvalStatus === 'approved' ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : (
                  <AlertCircle className="w-3 h-3 mr-1" />
                )}
                {approvalStatus.charAt(0).toUpperCase() + approvalStatus.slice(1)}
              </Badge>
            </div>
            {shortDescription && (
              <SafeText text={shortDescription} as="p" className="text-muted-foreground mb-3" />
            )}
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              {location && (
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {location}
                </div>
              )}
              {foundedYear && (
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Founded {foundedYear}
                </div>
              )}
              {teamSize && (
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {teamSize} employees
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

        <div className="flex items-center space-x-4">
          {profile.industry && (
            <Badge variant="outline">{profile.industry}</Badge>
          )}
          {profile.stage && (
            <Badge variant="outline">{profile.stage}</Badge>
          )}
          {profile.fundingGoal && (
            <Badge className="bg-green-100 text-green-800">
              ${typeof profile.fundingGoal === 'number' ? profile.fundingGoal.toLocaleString() : profile.fundingGoal} goal
            </Badge>
          )}
        </div>

        {/* Quick Links */}
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
          {profile.phone && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Phone className="w-4 h-4 mr-1" />
              {profile.phone}
            </div>
          )}
          {venture.email && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Mail className="w-4 h-4 mr-1" />
              {venture.email}
            </div>
          )}
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
                  <SafeText text={profile.fullDescription || shortDescription} as="p" className="text-sm text-muted-foreground" />
                </div>
              )}
              {profile.industry && (
                <div>
                  <h4 className="font-medium mb-2">Industry</h4>
                  <p className="text-sm text-muted-foreground">{profile.industry}</p>
                </div>
              )}
              {profile.stage && (
                <div>
                  <h4 className="font-medium mb-2">Stage</h4>
                  <p className="text-sm text-muted-foreground">{profile.stage}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Funding Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Funding Goal</h4>
                <p className="text-sm text-muted-foreground">
                  {profile.fundingGoal ? `$${typeof profile.fundingGoal === 'number' ? profile.fundingGoal.toLocaleString() : profile.fundingGoal}` : 'Not specified'}
                </p>
              </div>
              {profile.currentFunding && (
                <div>
                  <h4 className="font-medium mb-2">Current Funding</h4>
                  <p className="text-sm text-muted-foreground">
                    ${typeof profile.currentFunding === 'number' ? profile.currentFunding.toLocaleString() : profile.currentFunding}
                  </p>
                </div>
              )}
              {profile.revenue && (
                <div>
                  <h4 className="font-medium mb-2">Annual Revenue</h4>
                  <p className="text-sm text-muted-foreground">
                    ${typeof profile.revenue === 'number' ? profile.revenue.toLocaleString() : profile.revenue}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {user.role === 'venture' && renderVentureProfile(user)}
      {user.role === 'investor' && renderInvestorProfile(user)}
      {user.role === 'mentor' && renderMentorProfile(user)}
    </div>
  );
}