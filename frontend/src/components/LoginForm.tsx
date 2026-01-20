import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { useAuth } from "./AuthContext";
import { ArrowLeft, LogIn, AlertCircle, Clock } from "lucide-react";
import { sanitizeInput, validateEmail } from '../utils/security';

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Security: Sanitize and validate inputs
    const sanitizedEmail = sanitizeInput(email, 254);
    if (!validateEmail(sanitizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    
    // Password length check (don't sanitize password, but limit length)
    if (password.length > 128) {
      setError('Password is too long.');
      return;
    }
    
    setIsLoading(true);

    try {
      const success = await login(sanitizedEmail, password);
      if (success) {
        // Small delay to ensure user state is set and cookies are available
        await new Promise(resolve => setTimeout(resolve, 150));
        // Navigate to dashboard using React Router
        navigate('/dashboard');
      }
    } catch (err: any) {
      // Handle rate limiting (429) with user-friendly message
      if (err.response?.status === 429) {
        setError('Too many login attempts. Please wait a few minutes before trying again. This helps protect your account from unauthorized access.');
      } else if (err.response?.status === 401) {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };


  return (
    <div className="min-h-screen bg-white py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={handleBackToHome}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        <div className="max-w-md mx-auto">
          {/* Login Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LogIn className="w-5 h-5 mr-2" />
                Sign In to VentureUP Link
              </CardTitle>
              <p className="text-muted-foreground">
                Access your dashboard and connect with the startup ecosystem
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(sanitizeInput(e.target.value, 254))}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      // Don't sanitize password, but limit length
                      const value = e.target.value.length > 128 ? e.target.value.substring(0, 128) : e.target.value;
                      setPassword(value);
                    }}
                    placeholder="Enter your password"
                    required
                  />
                </div>

                {error && (
                  <Alert variant={error.includes('Too many') ? "default" : "destructive"} className={error.includes('Too many') ? "bg-amber-50 border-amber-200" : ""}>
                    <AlertDescription className="flex items-start">
                      {error.includes('Too many') ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-amber-600" />
                          <div>
                            <p className="font-medium text-amber-900 mb-1">Rate Limit Exceeded</p>
                            <p className="text-sm text-amber-800">{error}</p>
                            <p className="text-xs text-amber-700 mt-2">
                              You can try again in a few minutes, or use the "Forgot Password" link if you need to reset your password.
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                          <span>{error}</span>
                        </>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>

                <div className="text-center">
                  <Button 
                    variant="link" 
                    onClick={() => navigate('/forgot-password')}
                    className="p-0 h-auto text-sm text-muted-foreground hover:text-foreground"
                  >
                    Forgot your password?
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}