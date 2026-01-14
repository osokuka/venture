import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { useAuth } from "./AuthContext";
import { ArrowLeft, LogIn, Mail, Lock, Users, DollarSign, MessageSquare } from "lucide-react";
import { mockVentures, mockInvestors, mockMentors } from './MockData';
import { sanitizeInput, validateEmail } from '../utils/security';

export function LoginForm() {
  const { login, setView } = useAuth();
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
      if (!success) {
        setError('Invalid email or password. Please check your credentials and try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo123');
    setIsLoading(true);
    try {
      const success = await login(demoEmail, 'demo123');
      if (!success) {
        setError('Demo login failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Demo login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => setView('landing')}
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
                    onClick={() => setView('landing')}
                    className="p-0 h-auto"
                  >
                    Register here
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Demo Accounts */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Demo Accounts</CardTitle>
                <p className="text-muted-foreground">
                  Try the platform with these pre-configured accounts
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Venture Accounts */}
                <div>
                  <div className="flex items-center mb-2">
                    <Users className="w-4 h-4 text-blue-600 mr-2" />
                    <h4 className="text-sm">Venture Accounts</h4>
                  </div>
                  <div className="space-y-2">
                    {mockVentures.slice(0, 2).map(venture => (
                      <Button
                        key={venture.id}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-left"
                        onClick={() => handleDemoLogin(venture.email)}
                      >
                        <div>
                          <div className="text-sm">{venture.profile.companyName}</div>
                          <div className="text-xs text-muted-foreground">{venture.email}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Investor Accounts */}
                <div>
                  <div className="flex items-center mb-2">
                    <DollarSign className="w-4 h-4 text-green-600 mr-2" />
                    <h4 className="text-sm">Investor Accounts</h4>
                  </div>
                  <div className="space-y-2">
                    {mockInvestors.slice(0, 2).map(investor => (
                      <Button
                        key={investor.id}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-left"
                        onClick={() => handleDemoLogin(investor.email)}
                      >
                        <div>
                          <div className="text-sm">
                            {investor.profile.organizationName || investor.profile.name}
                          </div>
                          <div className="text-xs text-muted-foreground">{investor.email}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Mentor Accounts */}
                <div>
                  <div className="flex items-center mb-2">
                    <MessageSquare className="w-4 h-4 text-purple-600 mr-2" />
                    <h4 className="text-sm">Mentor Accounts</h4>
                  </div>
                  <div className="space-y-2">
                    {mockMentors.slice(0, 2).map(mentor => (
                      <Button
                        key={mentor.id}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-left"
                        onClick={() => handleDemoLogin(mentor.email)}
                      >
                        <div>
                          <div className="text-sm">{mentor.profile.name}</div>
                          <div className="text-xs text-muted-foreground">{mentor.email}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <h4 className="text-sm mb-2">Demo Features</h4>
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