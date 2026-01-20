import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Switch } from "./ui/switch";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { useAuth } from "./AuthContext";
import { ArrowLeft, ArrowRight, CheckCircle, Clock, Eye, EyeOff, Mail, AlertCircle } from "lucide-react";
import { validateEmail, validatePassword } from '../utils/security';

interface InvestorFormData {
  // Step 1: Account Creation
  email: string;
  password: string;
  confirmPassword: string;
  
  // Step 2: Personal/Organization Info
  investorType: 'individual' | 'firm' | 'corporate' | 'family-office';
  name: string;
  organizationName?: string;
  website?: string;
  linkedinUrl?: string;
  phone?: string;
  address?: string;
  
  // Step 3: Investment Preferences
  investmentStages: string[];
  industries: string[];
  geographicFocus: string[];
  minInvestment: string;
  maxInvestment: string;
  ticketSize: string;
  
  // Step 4: Profile & Visibility
  bio: string;
  investmentPhilosophy: string;
  notableInvestments?: string;
  isVisible: boolean;
  allowDirectContact: boolean;
}

interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
  organizationName?: string;
  linkedinUrl?: string;
  investmentStages?: string;
  industries?: string;
  bio?: string;
  investmentPhilosophy?: string;
}

export function InvestorRegistration() {
  const navigate = useNavigate();
  const { completeRegistration, startRegistration } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [formData, setFormData] = useState<InvestorFormData>({
    email: '', password: '', confirmPassword: '',
    investorType: 'individual', name: '', organizationName: '', website: '', linkedinUrl: '', phone: '', address: '',
    investmentStages: [], industries: [], geographicFocus: [], minInvestment: '', maxInvestment: '', ticketSize: '',
    bio: '', investmentPhilosophy: '', notableInvestments: '',
    isVisible: true, allowDirectContact: true
  });

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  // Ensure role is set even on direct navigation to /register/investor
  useEffect(() => {
    startRegistration('investor');
  }, [startRegistration]);

  // Keep form updates typed to reduce registration tech debt.
  // No inline validation - validation only on button press
  const updateFormData = <K extends keyof InvestorFormData>(field: K, value: InvestorFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: 'investmentStages' | 'industries' | 'geographicFocus', item: string) => {
    const current = formData[field] as string[];
    const updated = current.includes(item) 
      ? current.filter(i => i !== item)
      : [...current, item];
    updateFormData(field, updated as InvestorFormData[typeof field]);
  };

  // Validate current step - only called on button press
  const validateCurrentStep = (): boolean => {
    const errors: ValidationErrors = {};

    if (currentStep === 1) {
      // Step 1: Account Creation
      if (!formData.email.trim()) {
        errors.email = 'Email address is required';
      } else if (!validateEmail(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }

      if (!formData.password) {
        errors.password = 'Password is required';
      } else {
        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.isValid) {
          errors.password = passwordValidation.errors.join('. ') || 'Password does not meet requirements';
        }
      }

      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    } else if (currentStep === 2) {
      // Step 2: Personal/Organization Info
      if (!formData.name.trim()) {
        errors.name = 'Name is required';
      }

      if (formData.investorType !== 'individual' && !formData.organizationName?.trim()) {
        errors.organizationName = 'Organization name is required';
      }

      if (!formData.linkedinUrl?.trim()) {
        errors.linkedinUrl = 'LinkedIn profile URL is required';
      }
    } else if (currentStep === 3) {
      // Step 3: Investment Preferences
      if (formData.investmentStages.length === 0) {
        errors.investmentStages = 'Please select at least one investment stage';
      }

      if (formData.industries.length === 0) {
        errors.industries = 'Please select at least one industry';
      }
    } else if (currentStep === 4) {
      // Step 4: Profile & Visibility
      if (!formData.bio.trim()) {
        errors.bio = 'Professional bio is required';
      }

      if (!formData.investmentPhilosophy.trim()) {
        errors.investmentPhilosophy = 'Investment philosophy is required';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    // Validate before moving to next step
    if (!validateCurrentStep()) {
      return;
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
      // Clear validation errors when moving to next step
      setValidationErrors({});
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      // Clear validation errors when going back
      setValidationErrors({});
    }
  };

  const handleSubmit = async () => {
    // Validate step 4 before submission
    if (!validateCurrentStep()) {
      return;
    }

    setIsSubmitting(true);
    setCurrentStep(5);
    
    try {
      // Complete registration (this will register user and create profile)
      // Skip navigation so user can see email verification instructions
      await completeRegistration(
        {
          ...formData,
          // Backend requires organization_name; for individual investors, default to a sensible value.
          organizationName:
            formData.organizationName?.trim() ||
            (formData.investorType === 'individual' ? `${formData.name || 'Individual'} (Individual)` : ''),
        },
        { skipNavigation: true }
      );
      
      // After registration completes, show success message with email verification instructions
      setIsSubmitting(false);
    } catch (error: any) {
      console.error('Registration error:', error);
      setIsSubmitting(false);
      alert(error.message || 'Registration failed. Please try again.');
      // Go back to step 4 on error
      setCurrentStep(4);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                placeholder="Enter your email"
                className={validationErrors.email ? 'border-red-500' : ''}
              />
              {validationErrors.email && (
                <div className="flex items-center space-x-2 text-sm text-red-600 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{validationErrors.email}</span>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => updateFormData('password', e.target.value)}
                placeholder="Create a strong password"
                className={validationErrors.password ? 'border-red-500' : ''}
              />
              {validationErrors.password && (
                <div className="flex items-center space-x-2 text-sm text-red-600 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{validationErrors.password}</span>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                placeholder="Confirm your password"
                className={validationErrors.confirmPassword ? 'border-red-500' : ''}
              />
              {validationErrors.confirmPassword && (
                <div className="flex items-center space-x-2 text-sm text-red-600 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{validationErrors.confirmPassword}</span>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="investorType">Investor Type *</Label>
              <Select onValueChange={(value: any) => updateFormData('investorType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select investor type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual Angel Investor</SelectItem>
                  <SelectItem value="firm">Venture Capital Firm</SelectItem>
                  <SelectItem value="corporate">Corporate Venture Capital</SelectItem>
                  <SelectItem value="family-office">Family Office</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="name">Your Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="Full name"
                required
              />
            </div>
            {formData.investorType !== 'individual' && (
              <div>
                <Label htmlFor="organizationName">Organization Name *</Label>
                <Input
                  id="organizationName"
                  value={formData.organizationName || ''}
                  onChange={(e) => updateFormData('organizationName', e.target.value)}
                  placeholder="Your firm/organization name"
                  className={validationErrors.organizationName ? 'border-red-500' : ''}
                />
                {validationErrors.organizationName && (
                  <div className="flex items-center space-x-2 text-sm text-red-600 mt-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{validationErrors.organizationName}</span>
                  </div>
                )}
              </div>
            )}
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website || ''}
                onChange={(e) => updateFormData('website', e.target.value)}
                placeholder="https://yourwebsite.com"
              />
            </div>
            <div>
              <Label htmlFor="linkedinUrl">LinkedIn Profile *</Label>
              <Input
                id="linkedinUrl"
                value={formData.linkedinUrl || ''}
                onChange={(e) => updateFormData('linkedinUrl', e.target.value)}
                placeholder="https://linkedin.com/in/yourname"
                className={validationErrors.linkedinUrl ? 'border-red-500' : ''}
              />
              {validationErrors.linkedinUrl && (
                <div className="flex items-center space-x-2 text-sm text-red-600 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{validationErrors.linkedinUrl}</span>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => updateFormData('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="address">Location</Label>
              <Textarea
                id="address"
                value={formData.address || ''}
                onChange={(e) => updateFormData('address', e.target.value)}
                placeholder="City, State, Country"
                rows={2}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label className="mb-3 block">Investment Stages *</Label>
              <div className="grid grid-cols-2 gap-3">
                {['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+'].map(stage => (
                  <div key={stage} className="flex items-center space-x-2">
                    <Checkbox
                      id={stage}
                      checked={formData.investmentStages.includes(stage)}
                      onCheckedChange={() => toggleArrayItem('investmentStages', stage)}
                    />
                    <Label htmlFor={stage}>{stage}</Label>
                  </div>
                ))}
              </div>
              {validationErrors.investmentStages && (
                <div className="flex items-center space-x-2 text-sm text-red-600 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{validationErrors.investmentStages}</span>
                </div>
              )}
            </div>

            <div>
              <Label className="mb-3 block">Industries of Interest *</Label>
              <div className="grid grid-cols-2 gap-3">
                {['FinTech', 'HealthTech', 'EdTech', 'CleanTech', 'AI/ML', 'SaaS', 'E-commerce', 'Consumer', 'B2B', 'Enterprise'].map(industry => (
                  <div key={industry} className="flex items-center space-x-2">
                    <Checkbox
                      id={industry}
                      checked={formData.industries.includes(industry)}
                      onCheckedChange={() => toggleArrayItem('industries', industry)}
                    />
                    <Label htmlFor={industry}>{industry}</Label>
                  </div>
                ))}
              </div>
              {validationErrors.industries && (
                <div className="flex items-center space-x-2 text-sm text-red-600 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{validationErrors.industries}</span>
                </div>
              )}
            </div>

            <div>
              <Label className="mb-3 block">Geographic Focus</Label>
              <div className="grid grid-cols-2 gap-3">
                {['North America', 'Europe', 'Asia-Pacific', 'Latin America', 'Middle East', 'Africa', 'Global'].map(region => (
                  <div key={region} className="flex items-center space-x-2">
                    <Checkbox
                      id={region}
                      checked={formData.geographicFocus.includes(region)}
                      onCheckedChange={() => toggleArrayItem('geographicFocus', region)}
                    />
                    <Label htmlFor={region}>{region}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minInvestment">Minimum Investment</Label>
                <Select onValueChange={(value) => updateFormData('minInvestment', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Min amount" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5k">$5,000</SelectItem>
                    <SelectItem value="10k">$10,000</SelectItem>
                    <SelectItem value="25k">$25,000</SelectItem>
                    <SelectItem value="50k">$50,000</SelectItem>
                    <SelectItem value="100k">$100,000</SelectItem>
                    <SelectItem value="250k">$250,000</SelectItem>
                    <SelectItem value="500k">$500,000</SelectItem>
                    <SelectItem value="1m">$1,000,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="maxInvestment">Maximum Investment</Label>
                <Select onValueChange={(value) => updateFormData('maxInvestment', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Max amount" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100k">$100,000</SelectItem>
                    <SelectItem value="250k">$250,000</SelectItem>
                    <SelectItem value="500k">$500,000</SelectItem>
                    <SelectItem value="1m">$1,000,000</SelectItem>
                    <SelectItem value="5m">$5,000,000</SelectItem>
                    <SelectItem value="10m">$10,000,000</SelectItem>
                    <SelectItem value="25m">$25,000,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="ticketSize">Typical Check Size</Label>
              <Input
                id="ticketSize"
                value={formData.ticketSize}
                onChange={(e) => updateFormData('ticketSize', e.target.value)}
                placeholder="e.g., $50K - $500K"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="bio">Professional Bio *</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => updateFormData('bio', e.target.value)}
                placeholder="Tell startups about your background, experience, and what makes you a valuable investor..."
                rows={4}
                className={validationErrors.bio ? 'border-red-500' : ''}
              />
              {validationErrors.bio && (
                <div className="flex items-center space-x-2 text-sm text-red-600 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{validationErrors.bio}</span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="investmentPhilosophy">Investment Philosophy *</Label>
              <Textarea
                id="investmentPhilosophy"
                value={formData.investmentPhilosophy}
                onChange={(e) => updateFormData('investmentPhilosophy', e.target.value)}
                placeholder="What drives your investment decisions? What do you look for in startups?"
                rows={4}
                className={validationErrors.investmentPhilosophy ? 'border-red-500' : ''}
              />
              {validationErrors.investmentPhilosophy && (
                <div className="flex items-center space-x-2 text-sm text-red-600 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{validationErrors.investmentPhilosophy}</span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="notableInvestments">Notable Investments (Optional)</Label>
              <Textarea
                id="notableInvestments"
                value={formData.notableInvestments || ''}
                onChange={(e) => updateFormData('notableInvestments', e.target.value)}
                placeholder="List some of your successful investments or portfolio companies (if comfortable sharing)"
                rows={3}
              />
            </div>

            <div className="space-y-4 bg-muted/50 p-4 rounded-lg">
              <h4>Privacy & Visibility Settings</h4>
              
              <div className="flex items-center justify-between">
                <div className="flex-1 mr-4">
                  <Label className="flex items-center">
                    {formData.isVisible ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                    Profile Visibility
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.isVisible 
                      ? "Your profile will be visible to approved startups" 
                      : "Your profile will be hidden; you can browse privately"
                    }
                  </p>
                </div>
                <Switch
                  checked={formData.isVisible}
                  onCheckedChange={(checked) => updateFormData('isVisible', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1 mr-4">
                  <Label>Direct Contact</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow startups to contact you directly through the platform
                  </p>
                </div>
                <Switch
                  checked={formData.allowDirectContact}
                  onCheckedChange={(checked) => updateFormData('allowDirectContact', checked)}
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              {isSubmitting ? (
                <Clock className="w-10 h-10 text-green-600 animate-pulse" />
              ) : (
                <CheckCircle className="w-10 h-10 text-green-600" />
              )}
            </div>
            
            {isSubmitting ? (
              <div>
                <h3 className="text-xl mb-2">Processing Your Registration...</h3>
                <p className="text-muted-foreground">
                  Setting up your investor profile and preferences...
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Account Created Successfully!</h3>
                <p className="text-gray-600 mb-6">
                  We've sent a verification email to <strong className="text-gray-900">{formData.email}</strong>
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4 mb-6">
                  <div className="flex items-start">
                    <Mail className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-blue-900 mb-2">Important: Verify Your Email</p>
                      <p className="text-sm text-blue-800 mb-3">
                        To complete your registration and access your dashboard, you must verify your email address.
                      </p>
                      <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                        <li>Check your email inbox (and spam folder) for a message from VentureUP Link</li>
                        <li>Click the <strong>"Verify Email Address"</strong> button in the email</li>
                        <li>You'll be redirected to complete verification</li>
                        <li>After verification, you can log in and access your dashboard</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 text-sm mb-6">
                  <p className="font-medium text-gray-900">After Verification:</p>
                  <div className="space-y-1">
                    <div className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-gray-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Browse pre-vetted startups</span>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-gray-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Set up investment alerts</span>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-gray-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Connect with promising ventures</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  Didn't receive the email? Check your spam folder or{' '}
                  <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium underline">
                    log in to resend verification email
                  </a>
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <Card className="border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-gray-900">Investor Registration</CardTitle>
              <div className="flex items-center gap-3">
                {/* Always show a sign-in option in case the user already has an account */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 hidden sm:inline">
                    Already have an account?
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/login')}
                    className="border-gray-300 text-gray-800"
                  >
                    Sign in
                  </Button>
                </div>
                <Badge variant="outline" className="border-gray-300 text-gray-700">
                  Step {currentStep} of {totalSteps}
                </Badge>
              </div>
            </div>
            <Progress value={progress} className="w-full" />
            
            {currentStep <= 4 && (
              <div className="text-sm text-gray-600 mt-2">
                {currentStep === 1 && "Create your account"}
                {currentStep === 2 && "Profile and contact information"}
                {currentStep === 3 && "Investment preferences and criteria"}
                {currentStep === 4 && "Bio and visibility settings"}
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            {renderStep()}
            
            {currentStep === 5 && !isSubmitting && (
              <div className="flex justify-center mt-8 pt-6 border-t border-gray-100">
                <Button
                  type="button"
                  // Use SPA navigation for smoother transitions (no full reload).
                  onClick={() => navigate('/login')}
                  className="px-8 h-10 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Go to Login
                </Button>
              </div>
            )}
            
            {currentStep <= 4 && (
              <div className="flex justify-between mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                
                {currentStep === 4 ? (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Complete Registration'}
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="button" onClick={nextStep} disabled={isSubmitting}>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}