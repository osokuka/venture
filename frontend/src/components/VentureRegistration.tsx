import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { useAuth } from "./AuthContext";
// NOTE: Keep icon imports explicit to avoid runtime crashes on missing symbols.
import { CheckCircle, AlertCircle, Mail } from "lucide-react";
import { sanitizeInput, validateEmail, validatePassword } from '../utils/security';

interface VentureFormData {
  // User Account Creation Only
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
}

interface ValidationErrors {
  full_name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function VentureRegistration() {
  const { completeRegistration, startRegistration } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [formData, setFormData] = useState<VentureFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: ''
  });

  // Set registration role when component mounts
  useEffect(() => {
    startRegistration('venture');
  }, [startRegistration]);

  const totalSteps = 2; // Account creation + email verification message
  const progress = (currentStep / totalSteps) * 100;

  const updateFormData = (field: string, value: any) => {
    // Security: Sanitize inputs based on field type (no validation on change)
    // Validation only happens on button press, not inline
    let sanitizedValue = value;
    
    if (field === 'email') {
      sanitizedValue = sanitizeInput(value, 254);
    } else if (field === 'full_name') {
      sanitizedValue = sanitizeInput(value, 255);
    } else if (field === 'password' || field === 'confirmPassword') {
      // Don't sanitize passwords (they may contain special chars), but limit length
      sanitizedValue = value.length > 128 ? value.substring(0, 128) : value;
    } else {
      sanitizedValue = sanitizeInput(value, 10000);
    }
    
    // Do NOT clear validation errors on change - validation only on button press
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

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Validate full name
    if (!formData.full_name.trim()) {
      errors.full_name = 'Full name is required';
    } else if (formData.full_name.trim().length < 2) {
      errors.full_name = 'Full name must be at least 2 characters';
    }

    // Validate email
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address (e.g., name@example.com)';
    }

    // Validate password
    if (!formData.password) {
      errors.password = 'Password is required';
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        errors.password = passwordValidation.errors.join('. ') || 'Password does not meet requirements';
      }
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Ensure registration role is set
      startRegistration('venture');
      
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
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Create your account and verify your email to continue. Once verified,
                you’ll be able to post your pitch deck from your dashboard.
              </p>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-sm font-semibold text-gray-900">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-gray-500">
                Enter your first and last name as it should appear on your profile
              </p>
              <Input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => updateFormData('full_name', e.target.value)}
                placeholder="e.g., John Smith"
                className={`h-10 ${validationErrors.full_name ? 'border-red-500' : 'border-gray-300'}`}
              />
              {validationErrors.full_name && (
                <div className="flex items-center space-x-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>{validationErrors.full_name}</span>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-900">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-gray-500">
                We'll use this email to verify your account and send important updates
              </p>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                placeholder="e.g., john.smith@company.com"
                className={`h-10 ${validationErrors.email ? 'border-red-500' : 'border-gray-300'}`}
              />
              {validationErrors.email && (
                <div className="flex items-center space-x-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>{validationErrors.email}</span>
                </div>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-900">
                Password <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-gray-500">
                Must be at least 8 characters with uppercase, lowercase, number, and special character
              </p>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => updateFormData('password', e.target.value)}
                placeholder="Create a strong password"
                className={`h-10 ${validationErrors.password ? 'border-red-500' : 'border-gray-300'}`}
              />
              {validationErrors.password && (
                <div className="flex items-center space-x-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>{validationErrors.password}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-900">
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-gray-500">
                Re-enter your password to confirm it matches
              </p>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                placeholder="Re-enter your password"
                className={`h-10 ${validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
              />
              {validationErrors.confirmPassword && (
                <div className="flex items-center space-x-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>{validationErrors.confirmPassword}</span>
                </div>
              )}
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

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 text-sm">
                <p className="font-medium text-gray-900">After Verification:</p>
                <div className="space-y-1">
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-gray-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Access your dashboard and complete your profile</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-gray-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Upload your pitch deck</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-gray-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Start connecting with investors and mentors</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mt-6">
                Didn't receive the email? Check your spam folder or{' '}
                <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium underline">
                  log in to resend verification email
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
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4 gap-4">
              <CardTitle className="text-xl font-semibold text-gray-900">Create Your Account</CardTitle>
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
            <Progress value={progress} className="w-full h-2" />
            
            {currentStep === 1 && (
              <div className="text-sm text-gray-600 mt-3">
                Create your account - you’ll upload your pitch deck after email verification
              </div>
            )}
          </CardHeader>
          
          <CardContent className="pt-6">
            {renderStep()}
            
            {currentStep === 1 && (
              <div className="flex justify-end mt-8 pt-6 border-t border-gray-100">
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-8 h-10 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                  {!isSubmitting && <CheckCircle className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            )}
            
            {currentStep === 2 && (
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}