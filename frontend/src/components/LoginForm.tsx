import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { useAuth } from "./AuthContext";
import { ArrowLeft, LogIn, Users, DollarSign, MessageSquare } from "lucide-react";
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
        // Navigate to dashboard using React Router
        navigate('/dashboard');
      } else {
        setError('Invalid email or password. Please check your credentials and try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };


  return (
    <div className="min-h-screen bg-background py-12 px-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  <p>Don't have an account?</p>
                  <Button 
                    variant="link" 
                    onClick={handleBackToHome}
                    className="p-0 h-auto"
                  >
                    Register here
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Information Card */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Get Started</CardTitle>
                <p className="text-muted-foreground">
                  New to VentureUP Link? Create your account to get started.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full justify-start"
                    onClick={() => navigate('/register/venture')}
                  >
                    <Users className="w-4 h-4 text-blue-600 mr-2" />
                    <div className="text-left">
                      <div className="text-sm font-medium">Register as Venture</div>
                      <div className="text-xs text-muted-foreground">For startups seeking funding</div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full justify-start"
                    onClick={() => navigate('/register/investor')}
                  >
                    <DollarSign className="w-4 h-4 text-green-600 mr-2" />
                    <div className="text-left">
                      <div className="text-sm font-medium">Register as Investor</div>
                      <div className="text-xs text-muted-foreground">For investors seeking opportunities</div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full justify-start"
                    onClick={() => navigate('/register/mentor')}
                  >
                    <MessageSquare className="w-4 h-4 text-purple-600 mr-2" />
                    <div className="text-left">
                      <div className="text-sm font-medium">Register as Mentor</div>
                      <div className="text-xs text-muted-foreground">For mentors offering guidance</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <h4 className="text-sm mb-2 font-medium">Platform Features</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Browse all ventures, public investors & mentors</li>
                  <li>• View detailed profiles and pitch documents</li>
                  <li>• Send and receive messages</li>
                  <li>• Manage your portfolio and connections</li>
                  <li>• Role-specific dashboard functionality</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}