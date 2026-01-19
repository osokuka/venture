import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { ArrowLeft, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { authService } from '../services/authService';

export function PasswordResetConfirm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset.');
    }
  }, [token]);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPasswordErrors([]);
    
    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }

    // Validate passwords match
    if (newPassword !== newPasswordConfirm) {
      setError('Passwords do not match.');
      return;
    }

    // Validate password strength
    const validationErrors = validatePassword(newPassword);
    if (validationErrors.length > 0) {
      setPasswordErrors(validationErrors);
      return;
    }
    
    setIsLoading(true);

    try {
      await authService.confirmPasswordReset(token, newPassword, newPasswordConfirm);
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      // Extract detailed error message from API response
      let errorMessage = 'Failed to reset password. The token may be invalid or expired. Please request a new password reset.';
      
      if (err.response?.data) {
        const data = err.response.data;
        if (data.detail) {
          errorMessage = data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.errors) {
          // Handle field-specific errors
          const errorMessages = Object.entries(data.errors).map(([field, messages]: [string, any]) => {
            const msg = Array.isArray(messages) ? messages.join(', ') : messages;
            return `${field}: ${msg}`;
          });
          errorMessage = errorMessages.join('; ');
        } else if (typeof data === 'string') {
          errorMessage = data;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error('Password reset error:', err.response?.data || err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-white py-12 px-6">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-destructive" />
                Invalid Reset Link
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertDescription>
                  This password reset link is invalid or has expired. Please request a new password reset.
                </AlertDescription>
              </Alert>
              <Button 
                variant="outline" 
                onClick={handleBackToLogin}
                className="w-full mt-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 px-6">
      <div className="max-w-md mx-auto">
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={handleBackToLogin}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="w-5 h-5 mr-2" />
              Set New Password
            </CardTitle>
            <p className="text-muted-foreground">
              Enter your new password below. Make sure it's strong and secure.
            </p>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Password reset successful!</strong> Your password has been changed. 
                    You will be redirected to the login page in a few seconds.
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={handleBackToLogin}
                  className="w-full"
                >
                  Go to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      const value = e.target.value.length > 128 ? e.target.value.substring(0, 128) : e.target.value;
                      setNewPassword(value);
                      if (value.length > 0) {
                        setPasswordErrors(validatePassword(value));
                      } else {
                        setPasswordErrors([]);
                      }
                    }}
                    placeholder="Enter your new password"
                    required
                    autoFocus
                  />
                  {passwordErrors.length > 0 && (
                    <div className="mt-2 text-sm text-destructive space-y-1">
                      {passwordErrors.map((err, idx) => (
                        <div key={idx}>• {err}</div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="newPasswordConfirm">Confirm New Password</Label>
                  <Input
                    id="newPasswordConfirm"
                    type="password"
                    value={newPasswordConfirm}
                    onChange={(e) => {
                      const value = e.target.value.length > 128 ? e.target.value.substring(0, 128) : e.target.value;
                      setNewPasswordConfirm(value);
                    }}
                    placeholder="Confirm your new password"
                    required
                  />
                  {newPasswordConfirm && newPassword !== newPasswordConfirm && (
                    <p className="mt-2 text-sm text-destructive">Passwords do not match</p>
                  )}
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="bg-muted p-3 rounded-md text-sm space-y-1">
                  <p className="font-medium">Password Requirements:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>At least 8 characters long</li>
                    <li>Contains uppercase and lowercase letters</li>
                    <li>Contains at least one number</li>
                  </ul>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || passwordErrors.length > 0 || newPassword !== newPasswordConfirm}
                >
                  {isLoading ? 'Resetting Password...' : 'Reset Password'}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  <Button 
                    variant="link" 
                    onClick={handleBackToLogin}
                    className="p-0 h-auto"
                  >
                    Back to Login
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
