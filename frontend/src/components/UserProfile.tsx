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
import { type User, type Venture, type Investor, type Mentor } from './MockData';
import { SafeText } from './SafeText';
import { validateAndSanitizeUrl } from '../utils/security';

interface UserProfileProps {
  user: User;
  currentUser?: User;
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
  
  const renderVentureProfile = (venture: Venture) => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start space-x-4">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
          {venture.profile.logo ? (
            <img 
              src={venture.profile.logo} 
              alt={venture.profile.companyName}
              className="w-full h-full object-cover"
            />
          ) : (
            <Building className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <SafeText text={venture.profile.companyName} as="h1" className="text-2xl font-bold" />
            <Badge variant={venture.profile.approvalStatus === 'approved' ? 'default' : 'secondary'}>
              {venture.profile.approvalStatus === 'approved' ? (
                <CheckCircle className="w-3 h-3 mr-1" />
              ) : (
                <AlertCircle className="w-3 h-3 mr-1" />
              )}
              {venture.profile.approvalStatus.charAt(0).toUpperCase() + venture.profile.approvalStatus.slice(1)}
            </Badge>
          </div>
          <SafeText text={venture.profile.shortDescription} as="p" className="text-muted-foreground mb-3" />
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {venture.profile.location}
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Founded {venture.profile.foundedYear}
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {venture.profile.teamSize} employees
            </div>
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
            <button onClick={() => onMessage(user.id)} className="btn-chrome-primary">
              <MessageSquare className="w-4 h-4 mr-2" />
              Message
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Badge variant="outline">{venture.profile.industry}</Badge>
        <Badge variant="outline">{venture.profile.stage}</Badge>
        {venture.profile.fundingGoal && (
          <Badge className="bg-green-100 text-green-800">
            ${venture.profile.fundingGoal.toLocaleString()} goal
          </Badge>
        )}
      </div>

      {/* Quick Links */}
      <div className="flex items-center space-x-4">
        {venture.profile.website && (() => {
          const safeUrl = validateAndSanitizeUrl(venture.profile.website);
          return safeUrl ? (
            <Button variant="outline" size="sm" asChild>
              <a href={safeUrl} target="_blank" rel="noopener noreferrer">
                <Globe className="w-4 h-4 mr-2" />
                Website
              </a>
            </Button>
          ) : null;
        })()}
        <Button variant="outline" size="sm" asChild>
          <a href="#" target="_blank" rel="noopener noreferrer">
            <Linkedin className="w-4 h-4 mr-2" />
            LinkedIn
          </a>
        </Button>
        {venture.profile.phone && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Phone className="w-4 h-4 mr-1" />
            {venture.profile.phone}
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
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <SafeText text={venture.profile.fullDescription || venture.profile.shortDescription} as="p" className="text-sm text-muted-foreground" />
            </div>
            <div>
              <h4 className="font-medium mb-2">Industry</h4>
              <p className="text-sm text-muted-foreground">{venture.profile.industry}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Stage</h4>
              <p className="text-sm text-muted-foreground">{venture.profile.stage}</p>
            </div>
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
                ${venture.profile.fundingGoal?.toLocaleString() || 'Not specified'}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Current Funding</h4>
              <p className="text-sm text-muted-foreground">
                ${venture.profile.currentFunding?.toLocaleString() || '0'}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Annual Revenue</h4>
              <p className="text-sm text-muted-foreground">
                ${venture.profile.revenue?.toLocaleString() || 'Not disclosed'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderInvestorProfile = (investor: Investor) => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start space-x-4">
        <Avatar className="w-16 h-16">
          <AvatarImage src={investor.profile.avatar} />
          <AvatarFallback>{investor.profile.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-1">
            <SafeText text={investor.profile.name} as="h1" className="text-2xl font-bold" />
            <Badge variant={investor.profile.approvalStatus === 'approved' ? 'default' : 'secondary'}>
              {investor.profile.approvalStatus === 'approved' ? (
                <CheckCircle className="w-3 h-3 mr-1" />
              ) : (
                <AlertCircle className="w-3 h-3 mr-1" />
              )}
              {investor.profile.approvalStatus.charAt(0).toUpperCase() + investor.profile.approvalStatus.slice(1)}
            </Badge>
          </div>
          {investor.profile.organizationName && (
            <SafeText text={investor.profile.organizationName} as="p" className="text-lg text-muted-foreground mb-2" />
          )}
          <SafeText text={investor.profile.bio} as="p" className="text-muted-foreground mb-3" />
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 mr-1" />
              <SafeText text={investor.profile.investmentRange} />
            </div>
            {investor.profile.location && (
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {investor.profile.location}
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
            <button onClick={() => onMessage(user.id)} className="btn-chrome-primary">
              <MessageSquare className="w-4 h-4 mr-2" />
              Message
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Badge variant="outline">{investor.profile.investmentRange}</Badge>
        {investor.profile.sectors?.map((sector) => (
          <Badge key={sector} variant="outline">{sector}</Badge>
        ))}
      </div>

      {/* Contact & Links */}
      <div className="flex items-center space-x-4">
        {investor.profile.website && (() => {
          const safeUrl = validateAndSanitizeUrl(investor.profile.website);
          return safeUrl ? (
            <Button variant="outline" size="sm" asChild>
              <a href={safeUrl} target="_blank" rel="noopener noreferrer">
                <Globe className="w-4 h-4 mr-2" />
                Website
              </a>
            </Button>
          ) : null;
        })()}
        <Button variant="outline" size="sm" asChild>
          <a href="#" target="_blank" rel="noopener noreferrer">
            <Linkedin className="w-4 h-4 mr-2" />
            LinkedIn
          </a>
        </Button>
        {investor.profile.phone && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Phone className="w-4 h-4 mr-1" />
            {investor.profile.phone}
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
            <div>
              <h4 className="font-medium mb-2">Investment Range</h4>
              <SafeText text={investor.profile.investmentRange} as="p" className="text-sm text-muted-foreground" />
            </div>
            <div>
              <h4 className="font-medium mb-2">Sectors</h4>
              <div className="flex flex-wrap gap-2">
                {investor.profile.sectors?.map(sector => (
                  <Badge key={sector} variant="outline">
                    <SafeText text={sector} />
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Stages</h4>
              <div className="flex flex-wrap gap-2">
                {investor.profile.stage?.map(stage => (
                  <Badge key={stage} variant="outline">{stage}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Background</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Organization</h4>
              <SafeText text={investor.profile.organizationName || 'Independent Investor'} as="p" className="text-sm text-muted-foreground" />
            </div>
            <div>
              <h4 className="font-medium mb-2">Job Title</h4>
              <SafeText text={investor.profile.jobTitle || 'Not specified'} as="p" className="text-sm text-muted-foreground" />
            </div>
            <div>
              <h4 className="font-medium mb-2">Bio</h4>
              <SafeText text={investor.profile.bio} as="p" className="text-sm text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderMentorProfile = (mentor: Mentor) => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start space-x-4">
        <Avatar className="w-16 h-16">
          <AvatarImage src={mentor.profile.avatar} />
          <AvatarFallback>{mentor.profile.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-1">
            <SafeText text={mentor.profile.name} as="h1" className="text-2xl font-bold" />
            <Badge variant={mentor.profile.approvalStatus === 'approved' ? 'default' : 'secondary'}>
              {mentor.profile.approvalStatus === 'approved' ? (
                <CheckCircle className="w-3 h-3 mr-1" />
              ) : (
                <AlertCircle className="w-3 h-3 mr-1" />
              )}
              {mentor.profile.approvalStatus.charAt(0).toUpperCase() + mentor.profile.approvalStatus.slice(1)}
            </Badge>
          </div>
          <p className="text-lg text-muted-foreground mb-2">
            <SafeText text={`${mentor.profile.jobTitle} at ${mentor.profile.company}`} />
          </p>
          <SafeText text={mentor.profile.bio} as="p" className="text-muted-foreground mb-3" />
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {mentor.profile.experience} years experience
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {mentor.profile.availableHours}h/month available
            </div>
            {mentor.profile.location && (
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {mentor.profile.location}
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
            <button onClick={() => onMessage(user.id)} className="btn-chrome-primary">
              <MessageSquare className="w-4 h-4 mr-2" />
              Message
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Badge variant="outline">{mentor.profile.experience} years experience</Badge>
        {mentor.profile.expertise?.map((area) => (
          <Badge key={area} variant="outline">{area}</Badge>
        ))}
      </div>

      {/* Contact & Links */}
      <div className="flex items-center space-x-4">
        {mentor.profile.website && (() => {
          const safeUrl = validateAndSanitizeUrl(mentor.profile.website);
          return safeUrl ? (
            <Button variant="outline" size="sm" asChild>
              <a href={safeUrl} target="_blank" rel="noopener noreferrer">
                <Globe className="w-4 h-4 mr-2" />
                Website
              </a>
            </Button>
          ) : null;
        })()}
        <Button variant="outline" size="sm" asChild>
          <a href="#" target="_blank" rel="noopener noreferrer">
            <Linkedin className="w-4 h-4 mr-2" />
            LinkedIn
          </a>
        </Button>
        {mentor.profile.phone && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Phone className="w-4 h-4 mr-1" />
            {mentor.profile.phone}
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
            <div>
              <h4 className="font-medium mb-2">Areas of Expertise</h4>
              <div className="flex flex-wrap gap-2">
                {mentor.profile.expertise?.map(area => (
                  <Badge key={area} variant="outline">
                    <SafeText text={area} />
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Company</h4>
              <SafeText text={mentor.profile.company} as="p" className="text-sm text-muted-foreground" />
            </div>
            <div>
              <h4 className="font-medium mb-2">Bio</h4>
              <p className="text-sm text-muted-foreground">{mentor.profile.bio}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mentoring Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Experience</h4>
              <p className="text-sm text-muted-foreground">{mentor.profile.experience} years</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Availability</h4>
              <p className="text-sm text-muted-foreground">{mentor.profile.availableHours} hours per month</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Job Title</h4>
              <SafeText text={mentor.profile.jobTitle} as="p" className="text-sm text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {user.role === 'venture' && renderVentureProfile(user as Venture)}
      {user.role === 'investor' && renderInvestorProfile(user as Investor)}
      {user.role === 'mentor' && renderMentorProfile(user as Mentor)}
    </div>
  );
}