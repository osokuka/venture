import { useState } from 'react';
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
import { ArrowLeft, ArrowRight, CheckCircle, Clock, Eye, EyeOff } from "lucide-react";

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

export function InvestorRegistration() {
  const { completeRegistration } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<InvestorFormData>({
    email: '', password: '', confirmPassword: '',
    investorType: 'individual', name: '', organizationName: '', website: '', linkedinUrl: '', phone: '', address: '',
    investmentStages: [], industries: [], geographicFocus: [], minInvestment: '', maxInvestment: '', ticketSize: '',
    bio: '', investmentPhilosophy: '', notableInvestments: '',
    isVisible: true, allowDirectContact: true
  });

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (array: string[], item: string) => {
    const current = formData[array as keyof InvestorFormData] as string[];
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
    
    setTimeout(() => {
      completeRegistration(formData);
    }, 2000);
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
                  required
                />
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
                required
              />
            </div>

            <div>
              <Label htmlFor="investmentPhilosophy">Investment Philosophy *</Label>
              <Textarea
                id="investmentPhilosophy"
                value={formData.investmentPhilosophy}
                onChange={(e) => updateFormData('investmentPhilosophy', e.target.value)}
                placeholder="What drives your investment decisions? What do you look for in startups?"
                rows={4}
                required
              />
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
                <h3 className="text-xl mb-2">Welcome to VentureUP Link!</h3>
                <p className="text-muted-foreground mb-4">
                  Your investor profile has been created successfully.
                </p>
                <Badge className="mb-4">
                  Status: Active
                </Badge>
                <div className="text-sm space-y-2">
                  <p>✓ Browse pre-vetted startups</p>
                  <p>✓ Set up investment alerts</p>
                  <p>✓ Connect with promising ventures</p>
                </div>
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
              <Badge variant="outline" className="border-gray-300 text-gray-700">
                Step {currentStep} of {totalSteps}
              </Badge>
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
                  >
                    Complete Registration
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="button" onClick={nextStep}>
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