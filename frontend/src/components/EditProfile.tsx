import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { toast } from "sonner@2.0.3";
import { 
  User, 
  Camera, 
  Building2, 
  MapPin, 
  Globe, 
  Phone, 
  Mail,
  Save,
  AlertCircle,
  CheckCircle,
  Upload,
  X,
  DollarSign,
  Users,
  Clock,
  Target,
  Briefcase,
  Star
} from "lucide-react";
import { useAuth } from './AuthContext';
import { type User as UserType, type Venture, type Investor, type Mentor } from './MockData';
import { sanitizeInput, validateEmail, validateAndSanitizeUrl, sanitizeFormData } from '../utils/security';

interface EditProfileProps {
  user: UserType;
  onProfileUpdate?: (updatedUser: UserType) => void;
}

export function EditProfile({ user, onProfileUpdate }: EditProfileProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  // Initialize form data based on user type
  const initializeFormData = () => {
    switch (user.role) {
      case 'venture': {
        const venture = user as Venture;
        return {
          // Company Information
          companyName: venture.profile.companyName || '',
          sector: venture.profile.sector || '',
          shortDescription: venture.profile.shortDescription || '',
          website: venture.profile.website || '',
          linkedinUrl: venture.profile.linkedinUrl || '',
          address: venture.profile.address || '',
          foundedYear: venture.profile.foundedYear || '',
          employeeCount: venture.profile.employeeCount || '',
          
          // Founder Information
          founderName: venture.profile.founderName || '',
          founderLinkedin: venture.profile.founderLinkedin || '',
          founderRole: venture.profile.founderRole || '',
          
          // Note: Business information fields (target market, problem statement, solution, 
          // traction, funding, use of funds) are now associated with each pitch deck document,
          // not the venture profile itself
          customers: venture.profile.customers || '',
          keyMetrics: venture.profile.keyMetrics || '',
          needs: venture.profile.needs || [],
          
          // Contact Information
          email: user.email || '',
          
          // Media
          logo: venture.profile.logo || '',
        };
      }
      
      case 'investor': {
        const investor = user as Investor;
        return {
          // Personal Information
          name: investor.profile.name || '',
          investorType: investor.profile.investorType || 'individual',
          organizationName: investor.profile.organizationName || '',
          bio: investor.profile.bio || '',
          investmentExperience: investor.profile.investmentExperience || '',
          
          // Contact Information
          email: user.email || '',
          phone: investor.profile.phone || '',
          address: investor.profile.address || '',
          website: investor.profile.website || '',
          linkedinUrl: investor.profile.linkedinUrl || '',
          
          // Investment Information
          investmentStages: investor.profile.investmentStages || [],
          industries: investor.profile.industries || [],
          geographicFocus: investor.profile.geographicFocus || [],
          minInvestment: investor.profile.minInvestment || '',
          maxInvestment: investor.profile.maxInvestment || '',
          ticketSize: investor.profile.ticketSize || '',
          investmentPhilosophy: investor.profile.investmentPhilosophy || '',
          notableInvestments: investor.profile.notableInvestments || '',
          
          // Visibility Settings
          isVisible: investor.profile.isVisible || true,
          allowDirectContact: investor.profile.allowDirectContact || true,
          
          // Media
          avatar: investor.profile.avatar || '',
        };
      }
      
      case 'mentor': {
        const mentor = user as Mentor;
        return {
          // Personal Information
          name: mentor.profile.name || '',
          jobTitle: mentor.profile.jobTitle || '',
          company: mentor.profile.company || '',
          bio: mentor.profile.bio || '',
          workExperience: mentor.profile.workExperience || '',
          
          // Contact Information
          email: user.email || '',
          phone: mentor.profile.phone || '',
          location: mentor.profile.location || '',
          linkedinUrl: mentor.profile.linkedinUrl || '',
          
          // Expertise Information
          expertise: mentor.profile.expertise || [],
          industries: mentor.profile.industries || [],
          experienceYears: mentor.profile.experienceYears || '',
          
          // Availability Information
          availabilityType: mentor.profile.availabilityType || [],
          sessionFormat: mentor.profile.sessionFormat || [],
          frequency: mentor.profile.frequency || '',
          hourlyRate: mentor.profile.hourlyRate || '',
          isProBono: mentor.profile.isProBono || false,
          maxMentees: mentor.profile.maxMentees || '',
          isVisible: mentor.profile.isVisible || true,
          
          // Media
          avatar: mentor.profile.avatar || '',
        };
      }
      
      default:
        return {};
    }
  };

  const [formData, setFormData] = useState(initializeFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | string[] | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleArrayFieldChange = (field: string, value: string, checked: boolean) => {
    const currentArray = formData[field] as string[] || [];
    if (checked) {
      handleInputChange(field, [...currentArray, value]);
    } else {
      handleInputChange(field, currentArray.filter(item => item !== value));
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setProfileImage(imageUrl);
        const imageField = user.role === 'venture' ? 'logo' : 'avatar';
        handleInputChange(imageField, imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Common validations
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Role-specific validations
    switch (user.role) {
      case 'venture':
        if (!formData.companyName) newErrors.companyName = 'Company name is required';
        if (!formData.shortDescription) newErrors.shortDescription = 'Short description is required';
        if (!formData.sector) newErrors.sector = 'Sector is required';
        if (!formData.founderName) newErrors.founderName = 'Founder name is required';
        break;
        
      case 'investor':
        if (!formData.name) newErrors.name = 'Name is required';
        if (!formData.bio) newErrors.bio = 'Bio is required';
        if (!formData.investmentExperience) newErrors.investmentExperience = 'Investment experience is required';
        break;
        
      case 'mentor':
        if (!formData.name) newErrors.name = 'Name is required';
        if (!formData.bio) newErrors.bio = 'Bio is required';
        if (!formData.jobTitle) newErrors.jobTitle = 'Job title is required';
        if (!formData.company) newErrors.company = 'Company is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsLoading(true);

    try {
      // Update basic user profile (full_name) via API
      const { userService } = await import('../services/userService');
      
      // For now, we'll update the full_name if it's available in formData
      // Note: This component works with complex profile structures, so we're
      // only updating the basic user fields that the API supports
      const updateData: any = {};
      if (formData.full_name || formData.name) {
        updateData.full_name = formData.full_name || formData.name;
      }
      
      // Security: Sanitize all form data before updating
      const sanitizedFormData = sanitizeFormData(formData, {
        email: 254,
        full_name: 255,
        name: 255,
        companyName: 255,
        organizationName: 255,
        website: 2048,
        linkedinUrl: 2048,
        phone: 20,
        address: 500,
        shortDescription: 1000,
        bio: 5000,
        description: 5000,
      });
      
      if (Object.keys(updateData).length > 0) {
        await userService.updateProfile(updateData);
      }
      
      toast.success("Profile updated successfully!");
      
      if (onProfileUpdate) {
        const updatedUser = { ...user };
        Object.assign(updatedUser.profile, sanitizedFormData);
        // Also update the user's full_name if it was changed
        if (updateData.full_name) {
          updatedUser.profile.full_name = updateData.full_name;
        }
        onProfileUpdate(updatedUser);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update profile. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderVentureFields = () => (
    <>
      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="w-5 h-5" />
            <span>Company Information</span>
          </CardTitle>
          <CardDescription>
            Update your company details and description
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                className={errors.companyName ? 'border-red-500' : ''}
              />
              {errors.companyName && (
                <p className="text-sm text-red-500 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.companyName}</span>
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sector">Sector *</Label>
              <Select onValueChange={(value) => handleInputChange('sector', value)} value={formData.sector}>
                <SelectTrigger className={errors.sector ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AI/ML">AI/ML</SelectItem>
                  <SelectItem value="FinTech">FinTech</SelectItem>
                  <SelectItem value="HealthTech">HealthTech</SelectItem>
                  <SelectItem value="CleanTech">CleanTech</SelectItem>
                  <SelectItem value="SaaS">SaaS</SelectItem>
                  <SelectItem value="E-commerce">E-commerce</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                  <SelectItem value="Consumer">Consumer</SelectItem>
                  <SelectItem value="Biotech">Biotech</SelectItem>
                  <SelectItem value="Energy">Energy</SelectItem>
                </SelectContent>
              </Select>
              {errors.sector && (
                <p className="text-sm text-red-500 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.sector}</span>
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDescription">Short Description *</Label>
            <Input
              id="shortDescription"
              value={formData.shortDescription}
              onChange={(e) => handleInputChange('shortDescription', e.target.value)}
              placeholder="Brief description of your company"
              className={errors.shortDescription ? 'border-red-500' : ''}
            />
            {errors.shortDescription && (
              <p className="text-sm text-red-500 flex items-center space-x-1">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.shortDescription}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://your-company.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
              <Input
                id="linkedinUrl"
                type="url"
                value={formData.linkedinUrl}
                onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                placeholder="https://linkedin.com/company/your-company"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="foundedYear">Founded Year</Label>
              <Input
                id="foundedYear"
                value={formData.foundedYear}
                onChange={(e) => handleInputChange('foundedYear', e.target.value)}
                placeholder="2024"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employeeCount">Employee Count</Label>
              <Select onValueChange={(value) => handleInputChange('employeeCount', value)} value={formData.employeeCount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Just me</SelectItem>
                  <SelectItem value="2-5">2-5 employees</SelectItem>
                  <SelectItem value="6-10">6-10 employees</SelectItem>
                  <SelectItem value="11-25">11-25 employees</SelectItem>
                  <SelectItem value="26-50">26-50 employees</SelectItem>
                  <SelectItem value="51-100">51-100 employees</SelectItem>
                  <SelectItem value="100+">100+ employees</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="City, State, Country"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Founder Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Founder Information</span>
          </CardTitle>
          <CardDescription>
            Information about the founder and key team members
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="founderName">Founder Name *</Label>
              <Input
                id="founderName"
                value={formData.founderName}
                onChange={(e) => handleInputChange('founderName', e.target.value)}
                className={errors.founderName ? 'border-red-500' : ''}
              />
              {errors.founderName && (
                <p className="text-sm text-red-500 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.founderName}</span>
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="founderRole">Founder Role</Label>
              <Input
                id="founderRole"
                value={formData.founderRole}
                onChange={(e) => handleInputChange('founderRole', e.target.value)}
                placeholder="CEO & Founder"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="founderLinkedin">Founder LinkedIn</Label>
            <Input
              id="founderLinkedin"
              type="url"
              value={formData.founderLinkedin}
              onChange={(e) => handleInputChange('founderLinkedin', e.target.value)}
              placeholder="https://linkedin.com/in/founder-name"
            />
          </div>
        </CardContent>
      </Card>

    </>
  );

  const renderInvestorFields = () => (
    <>
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Personal Information</span>
          </CardTitle>
          <CardDescription>
            Update your personal details and background
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.name}</span>
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="investorType">Investor Type</Label>
              <Select onValueChange={(value) => handleInputChange('investorType', value)} value={formData.investorType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="firm">Firm</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="family-office">Family Office</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="organizationName">Organization Name</Label>
              <Input
                id="organizationName"
                value={formData.organizationName}
                onChange={(e) => handleInputChange('organizationName', e.target.value)}
                placeholder="Investment firm or company"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://your-website.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio *</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell us about your investment experience and interests"
              className={`min-h-24 ${errors.bio ? 'border-red-500' : ''}`}
            />
            {errors.bio && (
              <p className="text-sm text-red-500 flex items-center space-x-1">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.bio}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="investmentExperience">Investment Experience *</Label>
            <Textarea
              id="investmentExperience"
              value={formData.investmentExperience}
              onChange={(e) => handleInputChange('investmentExperience', e.target.value)}
              placeholder="Describe your investment experience, notable deals, etc."
              className={`min-h-20 ${errors.investmentExperience ? 'border-red-500' : ''}`}
            />
            {errors.investmentExperience && (
              <p className="text-sm text-red-500 flex items-center space-x-1">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.investmentExperience}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="City, State, Country"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
              <Input
                id="linkedinUrl"
                type="url"
                value={formData.linkedinUrl}
                onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                placeholder="https://linkedin.com/in/your-name"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investment Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Investment Preferences</span>
          </CardTitle>
          <CardDescription>
            Update your investment criteria and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minInvestment">Minimum Investment</Label>
              <Input
                id="minInvestment"
                value={formData.minInvestment}
                onChange={(e) => handleInputChange('minInvestment', e.target.value)}
                placeholder="100k"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxInvestment">Maximum Investment</Label>
              <Input
                id="maxInvestment"
                value={formData.maxInvestment}
                onChange={(e) => handleInputChange('maxInvestment', e.target.value)}
                placeholder="5m"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticketSize">Typical Ticket Size</Label>
            <Input
              id="ticketSize"
              value={formData.ticketSize}
              onChange={(e) => handleInputChange('ticketSize', e.target.value)}
              placeholder="$100K - $500K"
            />
          </div>

          <div className="space-y-2">
            <Label>Investment Stages</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Growth'].map((stage) => (
                <div key={stage} className="flex items-center space-x-2">
                  <Checkbox
                    id={`stage-${stage}`}
                    checked={(formData.investmentStages as string[])?.includes(stage)}
                    onCheckedChange={(checked) => handleArrayFieldChange('investmentStages', stage, checked as boolean)}
                  />
                  <Label htmlFor={`stage-${stage}`}>{stage}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Industries</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {['AI/ML', 'FinTech', 'HealthTech', 'CleanTech', 'SaaS', 'E-commerce', 'Enterprise', 'Consumer', 'Biotech', 'Energy'].map((industry) => (
                <div key={industry} className="flex items-center space-x-2">
                  <Checkbox
                    id={`industry-${industry}`}
                    checked={(formData.industries as string[])?.includes(industry)}
                    onCheckedChange={(checked) => handleArrayFieldChange('industries', industry, checked as boolean)}
                  />
                  <Label htmlFor={`industry-${industry}`}>{industry}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Geographic Focus</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {['North America', 'Europe', 'Asia-Pacific', 'Latin America', 'Middle East', 'Africa'].map((region) => (
                <div key={region} className="flex items-center space-x-2">
                  <Checkbox
                    id={`region-${region}`}
                    checked={(formData.geographicFocus as string[])?.includes(region)}
                    onCheckedChange={(checked) => handleArrayFieldChange('geographicFocus', region, checked as boolean)}
                  />
                  <Label htmlFor={`region-${region}`}>{region}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="investmentPhilosophy">Investment Philosophy</Label>
            <Textarea
              id="investmentPhilosophy"
              value={formData.investmentPhilosophy}
              onChange={(e) => handleInputChange('investmentPhilosophy', e.target.value)}
              placeholder="Describe your investment philosophy and what you look for in startups"
              className="min-h-24"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notableInvestments">Notable Investments</Label>
            <Textarea
              id="notableInvestments"
              value={formData.notableInvestments}
              onChange={(e) => handleInputChange('notableInvestments', e.target.value)}
              placeholder="Highlight your notable investments and portfolio companies"
              className="min-h-20"
            />
          </div>
        </CardContent>
      </Card>

      {/* Visibility Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Profile Visibility</span>
          </CardTitle>
          <CardDescription>
            Control who can see your profile and contact you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Profile Visibility</Label>
              <p className="text-sm text-muted-foreground">
                Make your profile visible to startups
              </p>
            </div>
            <Switch
              checked={formData.isVisible}
              onCheckedChange={(checked) => handleInputChange('isVisible', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Direct Contact</Label>
              <p className="text-sm text-muted-foreground">
                Allow startups to contact you directly
              </p>
            </div>
            <Switch
              checked={formData.allowDirectContact}
              onCheckedChange={(checked) => handleInputChange('allowDirectContact', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );

  const renderMentorFields = () => (
    <>
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Personal Information</span>
          </CardTitle>
          <CardDescription>
            Update your personal details and background
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.name}</span>
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title *</Label>
              <Input
                id="jobTitle"
                value={formData.jobTitle}
                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                placeholder="CEO, CTO, Founder, etc."
                className={errors.jobTitle ? 'border-red-500' : ''}
              />
              {errors.jobTitle && (
                <p className="text-sm text-red-500 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.jobTitle}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Current or previous company"
                className={errors.company ? 'border-red-500' : ''}
              />
              {errors.company && (
                <p className="text-sm text-red-500 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.company}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="City, State, Country"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
            <Input
              id="linkedinUrl"
              type="url"
              value={formData.linkedinUrl}
              onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
              placeholder="https://linkedin.com/in/your-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio *</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell us about your background and mentoring experience"
              className={`min-h-24 ${errors.bio ? 'border-red-500' : ''}`}
            />
            {errors.bio && (
              <p className="text-sm text-red-500 flex items-center space-x-1">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.bio}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="workExperience">Work Experience</Label>
            <Textarea
              id="workExperience"
              value={formData.workExperience}
              onChange={(e) => handleInputChange('workExperience', e.target.value)}
              placeholder="Describe your professional experience and achievements"
              className="min-h-20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="experienceYears">Years of Experience</Label>
            <Select onValueChange={(value) => handleInputChange('experienceYears', value)} value={formData.experienceYears}>
              <SelectTrigger>
                <SelectValue placeholder="Select experience range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-5">1-5 years</SelectItem>
                <SelectItem value="5-10">5-10 years</SelectItem>
                <SelectItem value="10-15">10-15 years</SelectItem>
                <SelectItem value="15-20">15-20 years</SelectItem>
                <SelectItem value="20+">20+ years</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Expertise */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="w-5 h-5" />
            <span>Expertise & Industries</span>
          </CardTitle>
          <CardDescription>
            Specify your areas of expertise and industry experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Areas of Expertise</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {['Go-to-Market', 'Sales', 'Business Development', 'Fundraising', 'Strategy', 'Operations', 'Product Development', 'Technology', 'AI/ML', 'Financial Planning', 'Marketing', 'HR/Talent'].map((area) => (
                <div key={area} className="flex items-center space-x-2">
                  <Checkbox
                    id={`expertise-${area}`}
                    checked={(formData.expertise as string[])?.includes(area)}
                    onCheckedChange={(checked) => handleArrayFieldChange('expertise', area, checked as boolean)}
                  />
                  <Label htmlFor={`expertise-${area}`} className="text-sm">{area}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Industries</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {['AI/ML', 'FinTech', 'HealthTech', 'CleanTech', 'SaaS', 'E-commerce', 'Enterprise', 'Consumer', 'Biotech', 'Energy'].map((industry) => (
                <div key={industry} className="flex items-center space-x-2">
                  <Checkbox
                    id={`mentor-industry-${industry}`}
                    checked={(formData.industries as string[])?.includes(industry)}
                    onCheckedChange={(checked) => handleArrayFieldChange('industries', industry, checked as boolean)}
                  />
                  <Label htmlFor={`mentor-industry-${industry}`} className="text-sm">{industry}</Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Availability */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Mentoring Availability</span>
          </CardTitle>
          <CardDescription>
            Configure your mentoring availability and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Availability Type</Label>
            <div className="flex flex-wrap gap-2">
              {['paid', 'pro-bono', 'both'].map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`availability-${type}`}
                    checked={(formData.availabilityType as string[])?.includes(type)}
                    onCheckedChange={(checked) => handleArrayFieldChange('availabilityType', type, checked as boolean)}
                  />
                  <Label htmlFor={`availability-${type}`} className="capitalize">{type === 'pro-bono' ? 'Pro Bono' : type}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Session Format</Label>
            <div className="grid grid-cols-2 gap-2">
              {['Virtual/Video Call', 'Phone Call', 'In-Person', 'Email/Async'].map((format) => (
                <div key={format} className="flex items-center space-x-2">
                  <Checkbox
                    id={`format-${format}`}
                    checked={(formData.sessionFormat as string[])?.includes(format)}
                    onCheckedChange={(checked) => handleArrayFieldChange('sessionFormat', format, checked as boolean)}
                  />
                  <Label htmlFor={`format-${format}`} className="text-sm">{format}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frequency">Session Frequency</Label>
              <Select onValueChange={(value) => handleInputChange('frequency', value)} value={formData.frequency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                  <SelectItem value="As needed">As needed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxMentees">Maximum Mentees</Label>
              <Select onValueChange={(value) => handleInputChange('maxMentees', value)} value={formData.maxMentees}>
                <SelectTrigger>
                  <SelectValue placeholder="Select capacity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-2">1-2</SelectItem>
                  <SelectItem value="3-5">3-5</SelectItem>
                  <SelectItem value="6-10">6-10</SelectItem>
                  <SelectItem value="10+">10+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Pro Bono Mentoring</Label>
              <p className="text-sm text-muted-foreground">
                Offer free mentoring sessions
              </p>
            </div>
            <Switch
              checked={formData.isProBono}
              onCheckedChange={(checked) => handleInputChange('isProBono', checked)}
            />
          </div>

          {!formData.isProBono && (
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
              <Input
                id="hourlyRate"
                value={formData.hourlyRate}
                onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                placeholder="300"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Profile Visibility</Label>
              <p className="text-sm text-muted-foreground">
                Make your profile visible to startups
              </p>
            </div>
            <Switch
              checked={formData.isVisible}
              onCheckedChange={(checked) => handleInputChange('isVisible', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit Profile</h1>
          <p className="text-muted-foreground">Update your profile information and preferences</p>
        </div>
        <Badge variant={user.profile.approvalStatus === 'approved' ? 'default' : 'secondary'}>
          {user.profile.approvalStatus === 'approved' ? (
            <CheckCircle className="w-3 h-3 mr-1" />
          ) : (
            <AlertCircle className="w-3 h-3 mr-1" />
          )}
          {user.profile.approvalStatus.charAt(0).toUpperCase() + user.profile.approvalStatus.slice(1)}
        </Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="w-5 h-5" />
              <span>Profile Picture</span>
            </CardTitle>
            <CardDescription>
              Upload a {user.role === 'venture' ? 'company logo' : 'profile picture'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6">
              <Avatar className="w-20 h-20">
                <AvatarImage src={profileImage || (user.role === 'venture' ? (user as Venture).profile.logo : (user as Investor | Mentor).profile.avatar)} />
                <AvatarFallback className="text-lg">
                  {user.role === 'venture' 
                    ? (user as Venture).profile.companyName?.[0] 
                    : (user as Investor | Mentor).profile.name?.[0]
                  }
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-2">
                <label htmlFor="profile-image" className="btn-chrome-secondary cursor-pointer inline-flex items-center space-x-2">
                  <Upload className="w-4 h-4" />
                  <span>Upload Image</span>
                </label>
                <input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <p className="text-sm text-muted-foreground">
                  JPG, PNG up to 5MB. Recommended: 400x400px
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="w-5 h-5" />
              <span>Contact Information</span>
            </CardTitle>
            <CardDescription>
              Update your contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role-specific fields */}
        {user.role === 'venture' && renderVentureFields()}
        {user.role === 'investor' && renderInvestorFields()}
        {user.role === 'mentor' && renderMentorFields()}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button type="button" className="btn-chrome-secondary">
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn-chrome-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}