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
import { ArrowLeft, ArrowRight, CheckCircle, Clock, Eye, EyeOff, Mail } from "lucide-react";

interface MentorFormData {
  // Step 1: Account Creation
  email: string;
  password: string;
  confirmPassword: string;
  
  // Step 2: Profile Information
  name: string;
  jobTitle: string;
  company: string;
  linkedinUrl: string;
  phone?: string;
  location?: string;
  
  // Step 3: Expertise Areas
  expertise: string[];
  industries: string[];
  experienceYears: string;
  bio: string;
  
  // Step 4: Availability & Preferences
  availabilityType: string[];
  sessionFormat: string[];
  frequency: string;
  hourlyRate?: string;
  isProBono: boolean;
  maxMentees: string;
  isVisible: boolean;
}

export function MentorRegistration() {
  const navigate = useNavigate();
  const { completeRegistration, startRegistration } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<MentorFormData>({
    email: '', password: '', confirmPassword: '',
    name: '', jobTitle: '', company: '', linkedinUrl: '', phone: '', location: '',
    expertise: [], industries: [], experienceYears: '', bio: '',
    availabilityType: [], sessionFormat: [], frequency: '', hourlyRate: '', isProBono: false, maxMentees: '',
    isVisible: true
  });

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  // Ensure role is set even on direct navigation to /register/mentor
  useEffect(() => {
    startRegistration('mentor');
  }, [startRegistration]);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (array: string, item: string) => {
    const current = formData[array as keyof MentorFormData] as string[];
    const updated = current.includes(item) 
      ? current.filter(i => i !== item)
      : [...current, item];
    updateFormData(array, updated);
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setCurrentStep(5);
    
    try {
      // Complete registration (this will register user and create profile)
      // Skip navigation so user can see email verification instructions
      await completeRegistration(formData, { skipNavigation: true });
      
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
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => updateFormData('password', e.target.value)}
                placeholder="Create a strong password"
                required
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                placeholder="Confirm your password"
                required
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="jobTitle">Current Job Title *</Label>
              <Input
                id="jobTitle"
                value={formData.jobTitle}
                onChange={(e) => updateFormData('jobTitle', e.target.value)}
                placeholder="e.g., VP of Sales, CTO, Founder, etc."
                required
              />
            </div>
            <div>
              <Label htmlFor="company">Current Company *</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => updateFormData('company', e.target.value)}
                placeholder="Your current or most recent company"
                required
              />
            </div>
            <div>
              <Label htmlFor="linkedinUrl">LinkedIn Profile *</Label>
              <Input
                id="linkedinUrl"
                value={formData.linkedinUrl}
                onChange={(e) => updateFormData('linkedinUrl', e.target.value)}
                placeholder="https://linkedin.com/in/yourname"
                required
              />
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
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={(e) => updateFormData('location', e.target.value)}
                placeholder="City, State, Country"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label className="mb-3 block">Areas of Expertise *</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Fundraising', 'Go-to-Market', 'Product Development', 'Legal & Compliance',
                  'Sales & Marketing', 'Operations', 'HR & Talent', 'Strategy',
                  'Financial Planning', 'Technology', 'Business Development', 'International Expansion'
                ].map(area => (
                  <div key={area} className="flex items-center space-x-2">
                    <Checkbox
                      id={area}
                      checked={formData.expertise.includes(area)}
                      onCheckedChange={() => toggleArrayItem('expertise', area)}
                    />
                    <Label htmlFor={area} className="text-sm">{area}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-3 block">Industry Experience</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'FinTech', 'HealthTech', 'EdTech', 'CleanTech', 'AI/ML', 'SaaS',
                  'E-commerce', 'Consumer', 'B2B', 'Enterprise', 'Mobile', 'Hardware'
                ].map(industry => (
                  <div key={industry} className="flex items-center space-x-2">
                    <Checkbox
                      id={industry}
                      checked={formData.industries.includes(industry)}
                      onCheckedChange={() => toggleArrayItem('industries', industry)}
                    />
                    <Label htmlFor={industry} className="text-sm">{industry}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="experienceYears">Years of Relevant Experience *</Label>
              <Select onValueChange={(value) => updateFormData('experienceYears', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select experience range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3-5">3-5 years</SelectItem>
                  <SelectItem value="5-10">5-10 years</SelectItem>
                  <SelectItem value="10-15">10-15 years</SelectItem>
                  <SelectItem value="15-20">15-20 years</SelectItem>
                  <SelectItem value="20+">20+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bio">Professional Bio *</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => updateFormData('bio', e.target.value)}
                placeholder="Tell startups about your background, achievements, and what unique value you can provide as a mentor..."
                rows={4}
                required
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label className="mb-3 block">Mentoring Type *</Label>
              <div className="space-y-3">
                {[
                  { value: 'paid', label: 'Paid Consulting', desc: 'Charge for your time and expertise' },
                  { value: 'pro-bono', label: 'Pro-Bono Mentoring', desc: 'Volunteer your time to help startups' },
                  { value: 'both', label: 'Both', desc: 'Offer both paid and free options' }
                ].map(type => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={type.value}
                      checked={formData.availabilityType.includes(type.value)}
                      onCheckedChange={() => toggleArrayItem('availabilityType', type.value)}
                    />
                    <div>
                      <Label htmlFor={type.value}>{type.label}</Label>
                      <p className="text-xs text-muted-foreground">{type.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {formData.availabilityType.includes('paid') && (
              <div>
                <Label htmlFor="hourlyRate">Hourly Rate (USD)</Label>
                <Input
                  id="hourlyRate"
                  value={formData.hourlyRate || ''}
                  onChange={(e) => updateFormData('hourlyRate', e.target.value)}
                  placeholder="e.g., $150, $250, $500"
                />
              </div>
            )}

            <div>
              <Label className="mb-3 block">Session Format *</Label>
              <div className="grid grid-cols-2 gap-3">
                {['Virtual/Video Call', 'In-Person', 'Phone Call', 'Email/Async'].map(format => (
                  <div key={format} className="flex items-center space-x-2">
                    <Checkbox
                      id={format}
                      checked={formData.sessionFormat.includes(format)}
                      onCheckedChange={() => toggleArrayItem('sessionFormat', format)}
                    />
                    <Label htmlFor={format} className="text-sm">{format}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="frequency">Availability Frequency *</Label>
              <Select onValueChange={(value) => updateFormData('frequency', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="How often can you mentor?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly sessions</SelectItem>
                  <SelectItem value="bi-weekly">Bi-weekly sessions</SelectItem>
                  <SelectItem value="monthly">Monthly sessions</SelectItem>
                  <SelectItem value="quarterly">Quarterly check-ins</SelectItem>
                  <SelectItem value="ad-hoc">As needed/Ad-hoc</SelectItem>
                  <SelectItem value="one-time">One-time consultations only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="maxMentees">Maximum Active Mentees</Label>
              <Select onValueChange={(value) => updateFormData('maxMentees', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="How many startups can you actively mentor?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-2">1-2 startups</SelectItem>
                  <SelectItem value="3-5">3-5 startups</SelectItem>
                  <SelectItem value="6-10">6-10 startups</SelectItem>
                  <SelectItem value="10+">10+ startups</SelectItem>
                  <SelectItem value="unlimited">No limit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1 mr-4">
                  <Label className="flex items-center">
                    {formData.isVisible ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                    Profile Visibility
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.isVisible 
                      ? "Your profile will be visible to startups seeking mentors" 
                      : "Your profile will be hidden; you can browse and apply privately"
                    }
                  </p>
                </div>
                <Switch
                  checked={formData.isVisible}
                  onCheckedChange={(checked) => updateFormData('isVisible', checked)}
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
              {isSubmitting ? (
                <Clock className="w-10 h-10 text-purple-600 animate-pulse" />
              ) : (
                <CheckCircle className="w-10 h-10 text-purple-600" />
              )}
            </div>
            
            {isSubmitting ? (
              <div>
                <h3 className="text-xl mb-2">Creating Your Mentor Profile...</h3>
                <p className="text-muted-foreground">
                  Setting up your expertise areas and availability...
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Account Created Successfully!</h3>
                <p className="text-gray-600 mb-6">
                  We've sent a verification email to <strong className="text-gray-900">{formData.email || 'your email'}</strong>
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
                      <span className="text-gray-700">Browse startups seeking mentorship</span>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-gray-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Receive mentoring requests</span>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-gray-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Set your schedule and availability</span>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-gray-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Connect with like-minded experts</span>
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
              <CardTitle className="text-gray-900">Mentor Registration</CardTitle>
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
                {currentStep === 3 && "Expertise and industry experience"}
                {currentStep === 4 && "Availability and mentoring preferences"}
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