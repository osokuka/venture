import React, { useState, useEffect } from 'react';
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
import { toast } from 'sonner';
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
import { type FrontendUser } from '../types';
import { sanitizeInput, validateEmail, validateAndSanitizeUrl, sanitizeFormData } from '../utils/security';
import type { Venture, Investor, Mentor } from './MockData';

interface EditProfileProps {
  user: FrontendUser;
  onProfileUpdate?: (updatedUser: FrontendUser) => void;
  onCancel?: () => void; // Optional callback for cancel action
}

export function EditProfile({ user, onProfileUpdate }: EditProfileProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  
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
          phone: venture.profile?.phone || '',
          
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
        return {
          email: user.email || '',
          phone: '',
        };
    }
  };

  const [formData, setFormData] = useState(initializeFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  
  // Fetch profile data from API on mount for venture/investor users
  useEffect(() => {
    // Only fetch for roles that have backend profiles wired
    if (user.role !== 'venture' && user.role !== 'investor') {
      return;
    }

    const fetchProfile = async () => {
      try {
        setIsLoadingProfile(true);

        if (user.role === 'venture') {
          const { ventureService } = await import('../services/ventureService');
          const profile = await ventureService.getMyProfile();
          
          if (profile) {
            // Update form data with API profile data
            setFormData(prev => ({
              ...prev,
              companyName: profile.company_name || prev.companyName || '',
              sector: profile.sector || prev.sector || '',
              shortDescription: profile.short_description || prev.shortDescription || '',
              website: profile.website || prev.website || '',
              linkedinUrl: profile.linkedin_url || prev.linkedinUrl || '',
              address: profile.address || prev.address || '',
              foundedYear: profile.year_founded?.toString() || prev.foundedYear || '',
              employeeCount: profile.employees_count?.toString() || prev.employeeCount || '',
              founderName: profile.founder_name || prev.founderName || '',
              founderLinkedin: profile.founder_linkedin || prev.founderLinkedin || '',
              founderRole: profile.founder_role || prev.founderRole || '',
              customers: profile.customers || prev.customers || '',
              keyMetrics: profile.key_metrics || prev.keyMetrics || '',
              needs: profile.needs || prev.needs || [],
              phone: profile.phone || prev.phone || '',
              logo: profile.logo_url_display || profile.logo_url || prev.logo || '',
            }));
            
            // Set profile image if logo exists
            if (profile.logo_url_display || profile.logo_url) {
              setProfileImage(profile.logo_url_display || profile.logo_url);
            }
          }
        } else if (user.role === 'investor') {
          const { investorService } = await import('../services/investorService');
          const profile = await investorService.getMyProfile();
          
          if (profile) {
            // Map investor_type from backend (INDIVIDUAL, FIRM, etc.) to frontend (individual, firm, etc.)
            const investorTypeMap: Record<string, string> = {
              'INDIVIDUAL': 'individual',
              'FIRM': 'firm',
              'CORPORATE': 'corporate',
              'FAMILY_OFFICE': 'family-office',
            };
            
            // Update form data with API profile data
            setFormData(prev => ({
              ...prev,
              name: profile.full_name || prev.name || '',
              investorType: profile.investor_type ? investorTypeMap[profile.investor_type] || 'individual' : prev.investorType || 'individual',
              organizationName: profile.organization_name || prev.organizationName || '',
              bio: profile.bio || prev.bio || '',
              investmentExperience: profile.investment_experience || prev.investmentExperience || '',
              investmentPhilosophy: profile.investment_philosophy || prev.investmentPhilosophy || '',
              notableInvestments: profile.notable_investments || prev.notableInvestments || '',
              address: profile.address || prev.address || '',
              email: profile.email || prev.email || user.email || '',
              phone: profile.phone || prev.phone || '',
              linkedinUrl: profile.linkedin_url || profile.linkedin_or_website || prev.linkedinUrl || '',
              website: profile.website || profile.linkedin_or_website || prev.website || '',
              minInvestment: profile.min_investment || prev.minInvestment || '',
              maxInvestment: profile.max_investment || prev.maxInvestment || '',
              investmentStages: profile.stage_preferences || prev.investmentStages || [],
              industries: profile.industry_preferences || prev.industries || [],
              geographicFocus: profile.geographic_focus || prev.geographicFocus || [],
              ticketSize: profile.average_ticket_size || prev.ticketSize || '',
              isVisible: profile.visible_to_ventures !== false,
              allowDirectContact: profile.allow_direct_contact !== false,
            }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        // Profile might not exist yet, that's okay - use default form data
      } finally {
        setIsLoadingProfile(false);
      }
    };
    
    fetchProfile();
  }, [user.role, user.id]);

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
      // Store the File object for upload
      setProfileImage(file as any);
      
      // Also show preview using FileReader
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        // Preview is handled by profileImage state (will be converted to File when needed)
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
    setJustSaved(false);

    try {
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
      
      // Handle venture profile update separately
      if (user.role === 'venture') {
        const { ventureService } = await import('../services/ventureService');
        
        // Map frontend form data to backend API format
        const profileUpdateData: any = {
          company_name: sanitizedFormData.companyName,
          sector: sanitizedFormData.sector,
          short_description: sanitizedFormData.shortDescription,
          website: sanitizedFormData.website,
          linkedin_url: sanitizedFormData.linkedinUrl,
          address: sanitizedFormData.address,
          year_founded: sanitizedFormData.foundedYear ? parseInt(sanitizedFormData.foundedYear) : undefined,
          employees_count: sanitizedFormData.employeeCount ? parseInt(sanitizedFormData.employeeCount) : undefined,
          founder_name: sanitizedFormData.founderName,
          founder_linkedin: sanitizedFormData.founderLinkedin,
          founder_role: sanitizedFormData.founderRole,
          customers: sanitizedFormData.customers,
          key_metrics: sanitizedFormData.keyMetrics,
          needs: sanitizedFormData.needs || [],
          phone: sanitizedFormData.phone,
          logo_url: sanitizedFormData.logo, // If logo is a URL string
        };
        
        // Handle logo file upload if profileImage is set
        // profileImage can be either a File object (for new uploads) or a string URL (for existing/preview)
        if (profileImage) {
          if (profileImage instanceof File) {
            // New file upload - use File object directly
            profileUpdateData.logo = profileImage;
            // Remove logo_url if we're uploading a new file
            if (profileUpdateData.logo_url) {
              delete profileUpdateData.logo_url;
            }
          } else if (typeof profileImage === 'string') {
            // If it's a data URL (from FileReader), try to convert back to File
            if (profileImage.startsWith('data:')) {
              try {
                const response = await fetch(profileImage);
                const blob = await response.blob();
                const file = new File([blob], 'logo.png', { type: blob.type });
                profileUpdateData.logo = file;
                if (profileUpdateData.logo_url) {
                  delete profileUpdateData.logo_url;
                }
              } catch (error) {
                console.warn('Could not convert data URL to File, skipping logo update:', error);
              }
            } else if (profileImage.startsWith('http')) {
              // Existing URL - use logo_url
              profileUpdateData.logo_url = profileImage;
              // Don't include logo field if we're using URL
              if (profileUpdateData.logo) {
                delete profileUpdateData.logo;
              }
            }
          }
        }
        
        // Remove undefined/null values
        Object.keys(profileUpdateData).forEach(key => {
          if (profileUpdateData[key] === undefined || profileUpdateData[key] === null || profileUpdateData[key] === '') {
            delete profileUpdateData[key];
          }
        });
        
        // Call API to save venture profile
        const savedProfile = await ventureService.updateProfile(profileUpdateData);
        
        toast.success("Profile updated successfully!");
        // Extra feedback to reduce "did it save?" uncertainty.
        setJustSaved(true);
        window.setTimeout(() => setJustSaved(false), 2500);
        
        // Update local state with saved profile data
        if (onProfileUpdate) {
          const updatedUser = { ...user };
          // Map backend response to frontend profile format
          updatedUser.profile = {
            ...updatedUser.profile,
            companyName: savedProfile.company_name,
            sector: savedProfile.sector,
            shortDescription: savedProfile.short_description,
            website: savedProfile.website,
            linkedinUrl: savedProfile.linkedin_url,
            address: savedProfile.address,
            foundedYear: savedProfile.year_founded?.toString(),
            employeeCount: savedProfile.employees_count?.toString(),
            founderName: savedProfile.founder_name,
            founderLinkedin: savedProfile.founder_linkedin,
            founderRole: savedProfile.founder_role,
            customers: savedProfile.customers,
            keyMetrics: savedProfile.key_metrics,
            needs: savedProfile.needs || [],
            phone: savedProfile.phone,
            logo: savedProfile.logo_url_display || savedProfile.logo_url || savedProfile.logo,
          };
          onProfileUpdate(updatedUser);
        }
      } else if (user.role === 'investor') {
        // Handle investor profile updates - use investorService, not userService
        const { investorService } = await import('../services/investorService');
        
        // Map form data to investor profile update payload
        // Note: email is required by backend serializer (both create and update)
        // investment_experience_years must be a number (not null) - default to 0 if not provided
        // Note: The form doesn't have a field for investment_experience_years (years as integer),
        // only investmentExperience (textarea for description), so we default to 0
        
        // Map investor_type from frontend (individual, firm, etc.) to backend (INDIVIDUAL, FIRM, etc.)
        const investorTypeMap: Record<string, string> = {
          'individual': 'INDIVIDUAL',
          'firm': 'FIRM',
          'corporate': 'CORPORATE',
          'family-office': 'FAMILY_OFFICE',
        };
        
        const investorUpdateData: any = {
          full_name: formData.name || formData.full_name || user.full_name,
          organization_name: formData.organizationName || '',
          // Use separate website and linkedin_url fields, fallback to linkedin_or_website for backward compatibility
          website: formData.website || undefined,
          linkedin_url: formData.linkedinUrl || undefined,
          linkedin_or_website: (!formData.website && !formData.linkedinUrl) ? (formData.linkedinUrl || formData.website || '') : undefined,
          email: formData.email || user.email, // Required field - use formData.email or fallback to user.email
          phone: formData.phone || undefined,
          investor_type: formData.investorType ? investorTypeMap[formData.investorType] || undefined : undefined,
          bio: formData.bio || undefined, // Professional bio
          investment_experience: formData.investmentExperience || undefined, // Detailed investment experience description
          investment_philosophy: formData.investmentPhilosophy || undefined, // Investment philosophy
          notable_investments: formData.notableInvestments || undefined, // Notable investments
          address: formData.address || undefined, // Location/address
          investment_experience_years: 0, // Default to 0 - form doesn't collect this field (only text description)
          stage_preferences: formData.investmentStages || [],
          industry_preferences: formData.industries || [],
          geographic_focus: formData.geographicFocus || [],
          average_ticket_size: formData.ticketSize || '',
          min_investment: formData.minInvestment || undefined,
          max_investment: formData.maxInvestment || undefined,
          visible_to_ventures: formData.isVisible !== false,
          allow_direct_contact: formData.allowDirectContact !== false,
        };
        
        // Update investor profile via API
        const savedProfile = await investorService.updateProfile(investorUpdateData);
        
        toast.success("Profile updated successfully!");
        
        if (onProfileUpdate) {
          const updatedUser = { ...user };
          updatedUser.profile = {
            ...updatedUser.profile,
            name: savedProfile.full_name,
            organizationName: savedProfile.organization_name,
            linkedinUrl: savedProfile.linkedin_or_website,
            website: savedProfile.linkedin_or_website,
            phone: savedProfile.phone,
            investmentExperience: savedProfile.investment_experience_years?.toString(),
            investmentStages: savedProfile.stage_preferences || [],
            industries: savedProfile.industry_preferences || [],
            ticketSize: savedProfile.average_ticket_size,
            isVisible: savedProfile.visible_to_ventures,
          };
          updatedUser.full_name = savedProfile.full_name;
          onProfileUpdate(updatedUser);
        }
      } else if (user.role === 'mentor') {
        // Handle mentor profile updates - use mentorService
        const { mentorService } = await import('../services/mentorService');
        
        // Map form data to mentor profile update payload
        // Note: contact_email is required by backend serializer (both create and update)
        const mentorUpdateData: any = {
          full_name: formData.name || formData.full_name || user.full_name,
          job_title: formData.jobTitle || '',
          company: formData.company || '',
          linkedin_or_website: formData.linkedinUrl || '',
          contact_email: formData.email || user.email, // Required field - use formData.email or fallback to user.email
          phone: formData.phone || undefined,
          expertise_fields: formData.expertise || [],
          experience_overview: formData.bio || '',
          industries_of_interest: formData.industries || [],
          visible_to_ventures: formData.isVisible !== false,
        };
        
        // Update mentor profile via API
        const savedProfile = await mentorService.updateProfile(mentorUpdateData);
        
        toast.success("Profile updated successfully!");
        
        if (onProfileUpdate) {
          const updatedUser = { ...user };
          updatedUser.profile = {
            ...updatedUser.profile,
            name: savedProfile.full_name,
            jobTitle: savedProfile.job_title,
            company: savedProfile.company,
            linkedinUrl: savedProfile.linkedin_or_website,
            phone: savedProfile.phone,
            expertise: savedProfile.expertise_fields || [],
            bio: savedProfile.experience_overview,
            industries: savedProfile.industries_of_interest || [],
            isVisible: savedProfile.visible_to_ventures,
          };
          updatedUser.full_name = savedProfile.full_name;
          onProfileUpdate(updatedUser);
        }
      } else {
        // Fallback: Update user account only (for other roles or if specific service not available)
        const { userService } = await import('../services/userService');
        
        const updateData: any = {};
        if (formData.full_name || formData.name) {
          updateData.full_name = formData.full_name || formData.name;
        }
        
        if (Object.keys(updateData).length > 0) {
          await userService.updateProfile(updateData);
        }
        
        toast.success("Profile updated successfully!");
        
        if (onProfileUpdate) {
          const updatedUser = { ...user };
          if (updatedUser.profile) {
            Object.assign(updatedUser.profile, sanitizedFormData);
          } else {
            updatedUser.profile = sanitizedFormData;
          }
          if (updateData.full_name) {
            updatedUser.full_name = updateData.full_name;
          }
          onProfileUpdate(updatedUser);
        }
      }
    } catch (error) {
      // Prefer field-level errors when backend returns DRF validation errors (400).
      const anyErr = error as any;
      const responseData = anyErr?.response?.data || anyErr?.data;
      const status = anyErr?.response?.status;

      const backendToFrontendField: Record<string, string> = {
        company_name: 'companyName',
        short_description: 'shortDescription',
        linkedin_url: 'linkedinUrl',
        founder_name: 'founderName',
        founder_linkedin: 'founderLinkedin',
        founder_role: 'founderRole',
        year_founded: 'foundedYear',
        employees_count: 'employeeCount',
        key_metrics: 'keyMetrics',
        logo_url: 'logo',
      };

      // DRF often returns: { field: ["msg1", "msg2"], non_field_errors: [...] }
      if (status === 400 && responseData && typeof responseData === 'object' && !Array.isArray(responseData)) {
        const newErrors: Record<string, string> = {};

        Object.entries(responseData).forEach(([key, value]) => {
          const frontendKey = backendToFrontendField[key] || key;
          const message =
            Array.isArray(value)
              ? value.filter(Boolean).join(' ')
              : typeof value === 'string'
                ? value
                : value && typeof value === 'object'
                  ? JSON.stringify(value)
                  : 'Invalid value';

          if (frontendKey) newErrors[frontendKey] = message;
        });

        if (Object.keys(newErrors).length > 0) {
          setErrors((prev) => ({ ...prev, ...newErrors }));
          toast.error('Please fix the highlighted fields and try again.');
          return;
        }
      }

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
                value={formData.companyName || ''}
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
              <Select onValueChange={(value) => handleInputChange('sector', value)} value={formData.sector || ''}>
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
              value={formData.shortDescription || ''}
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
                value={formData.website || ''}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://your-company.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
              <Input
                id="linkedinUrl"
                type="url"
                value={formData.linkedinUrl || ''}
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
                value={formData.foundedYear || ''}
                onChange={(e) => handleInputChange('foundedYear', e.target.value)}
                placeholder="2024"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employeeCount">Employee Count</Label>
              <Select onValueChange={(value) => handleInputChange('employeeCount', value)} value={formData.employeeCount || ''}>
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
                value={formData.address || ''}
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
                value={formData.founderName || ''}
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
                value={formData.founderRole || ''}
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
              value={formData.founderLinkedin || ''}
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
                value={formData.name || ''}
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
              <Select onValueChange={(value) => handleInputChange('investorType', value)} value={formData.investorType || 'individual'}>
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
                value={formData.organizationName || ''}
                onChange={(e) => handleInputChange('organizationName', e.target.value)}
                placeholder="Investment firm or company"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website || ''}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://your-website.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio *</Label>
            <Textarea
              id="bio"
              value={formData.bio || ''}
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
              value={formData.investmentExperience || ''}
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
                value={formData.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="City, State, Country"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
              <Input
                id="linkedinUrl"
                type="url"
                value={formData.linkedinUrl || ''}
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
                value={formData.minInvestment || ''}
                onChange={(e) => handleInputChange('minInvestment', e.target.value)}
                placeholder="100k"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxInvestment">Maximum Investment</Label>
              <Input
                id="maxInvestment"
                value={formData.maxInvestment || ''}
                onChange={(e) => handleInputChange('maxInvestment', e.target.value)}
                placeholder="5m"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticketSize">Typical Ticket Size</Label>
            <Input
              id="ticketSize"
              value={formData.ticketSize || ''}
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
              value={formData.investmentPhilosophy || ''}
              onChange={(e) => handleInputChange('investmentPhilosophy', e.target.value)}
              placeholder="Describe your investment philosophy and what you look for in startups"
              className="min-h-24"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notableInvestments">Notable Investments</Label>
            <Textarea
              id="notableInvestments"
              value={formData.notableInvestments || ''}
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
                value={formData.name || ''}
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
                value={formData.jobTitle || ''}
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
                value={formData.company || ''}
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
                value={formData.location || ''}
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
              value={formData.linkedinUrl || ''}
              onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
              placeholder="https://linkedin.com/in/your-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio *</Label>
            <Textarea
              id="bio"
              value={formData.bio || ''}
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
              value={formData.workExperience || ''}
              onChange={(e) => handleInputChange('workExperience', e.target.value)}
              placeholder="Describe your professional experience and achievements"
              className="min-h-20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="experienceYears">Years of Experience</Label>
            <Select onValueChange={(value) => handleInputChange('experienceYears', value)} value={formData.experienceYears || ''}>
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
              <Select onValueChange={(value) => handleInputChange('frequency', value)} value={formData.frequency || ''}>
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
              <Select onValueChange={(value) => handleInputChange('maxMentees', value)} value={formData.maxMentees || ''}>
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
                value={formData.hourlyRate || ''}
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

  // Show loading state while fetching profile data
  if (isLoadingProfile) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
          <span className="ml-2 text-muted-foreground">Loading profile data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit Profile</h1>
          <p className="text-muted-foreground">Update your profile information and preferences</p>
        </div>
        <Badge variant={user.profile?.approvalStatus === 'approved' ? 'default' : 'secondary'}>
          {user.profile?.approvalStatus === 'approved' ? (
            <CheckCircle className="w-3 h-3 mr-1" />
          ) : (
            <AlertCircle className="w-3 h-3 mr-1" />
          )}
          {(user.profile?.approvalStatus || 'pending').charAt(0).toUpperCase() + (user.profile?.approvalStatus || 'pending').slice(1)}
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
                <AvatarImage src={
                  profileImage && typeof profileImage === 'string' 
                    ? profileImage 
                    : (user.role === 'venture' 
                        ? ((user as Venture).profile?.logo || '') 
                        : ((user as Investor | Mentor).profile?.avatar || ''))
                } />
                <AvatarFallback className="text-lg">
                  {user.role === 'venture' 
                    ? ((user as Venture).profile?.companyName?.[0] || 'C') 
                    : ((user as Investor | Mentor).profile?.name?.[0] || 'U')
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
                  value={formData.email || ''}
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
                  value={formData.phone || ''}
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
          {/* Inline confirmation (in addition to toast) to reduce uncertainty */}
          {justSaved && (
            <div className="flex items-center text-sm text-green-700 mr-auto">
              <CheckCircle className="w-4 h-4 mr-2" />
              Saved
            </div>
          )}
          <button 
            type="button" 
            className="btn-chrome-secondary"
            onClick={() => {
              if (onCancel) {
                onCancel();
              }
            }}
          >
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