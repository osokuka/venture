import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { useAuth } from "./AuthContext";
import { ArrowLeft, ArrowRight, Upload, CheckCircle, Clock } from "lucide-react";

interface VentureFormData {
  // User Account Creation Only
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
}

export function VentureRegistration() {
  const { completeRegistration } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<VentureFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: ''
  });

  const totalSteps = 2; // Account creation + email verification message
  const progress = (currentStep / totalSteps) * 100;

  const updateFormData = (field: string, value: any) => {
    // Security: Sanitize inputs based on field type
    let sanitizedValue = value;
    
    if (field === 'email') {
      sanitizedValue = sanitizeInput(value, 254);
      // Email validation happens on submit
    } else if (field === 'full_name') {
      sanitizedValue = sanitizeInput(value, 255);
    } else if (field === 'password' || field === 'confirmPassword') {
      // Don't sanitize passwords (they may contain special chars), but limit length
      sanitizedValue = value.length > 128 ? value.substring(0, 128) : value;
    } else {
      sanitizedValue = sanitizeInput(value, 10000);
    }
    
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
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
    // Security: Final validation and sanitization before submission
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.full_name) {
      alert('Please fill in all required fields.');
      return;
    }

    // Security: Validate email format
    if (!validateEmail(formData.email)) {
      alert('Please enter a valid email address.');
      return;
    }

    // Security: Validate password strength
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      alert(passwordValidation.errors[0] || 'Password does not meet requirements');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Security: Sanitize data before sending
      await completeRegistration({
        email: sanitizeInput(formData.email, 254),
        password: formData.password, // Don't sanitize password
        confirmPassword: formData.confirmPassword, // Don't sanitize password
        full_name: sanitizeInput(formData.full_name, 255)
      });
      
      // Move to email verification step
      setCurrentStep(2);
    } catch (error: any) {
      console.error('Registration error:', error);
      alert(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> You'll create your user account first. After email verification, 
                you can create up to 3 venture products from your dashboard.
              </p>
            </div>
            <div>
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => updateFormData('full_name', e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>
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
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-xl mb-2">Account Created Successfully!</h3>
              <p className="text-muted-foreground mb-4">
                We've sent a verification email to <strong>{formData.email}</strong>
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-3 text-sm text-left">
                <p className="font-medium">Next Steps:</p>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Check your email and click the verification link</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>After verification, you can access your dashboard</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Create up to 3 venture products from your dashboard</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Didn't receive the email? Check your spam folder or{' '}
                <a href="/login" className="text-blue-600 hover:underline">
                  try logging in
                </a>
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>Venture Registration</CardTitle>
              <Badge variant="outline">
                Step {currentStep} of {totalSteps}
              </Badge>
            </div>
            <Progress value={progress} className="w-full" />
            
            {currentStep === 1 && (
              <div className="text-sm text-muted-foreground mt-2">
                Create your account - you'll add products after email verification
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            {renderStep()}
            
            {currentStep === 1 && (
              <div className="flex justify-end mt-8">
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.email || !formData.password || !formData.confirmPassword || !formData.full_name}
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                  {!isSubmitting && <CheckCircle className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            )}
            
            {currentStep === 2 && (
              <div className="flex justify-center mt-8">
                <Button
                  type="button"
                  onClick={() => window.location.href = '/login'}
                >
                  Go to Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}