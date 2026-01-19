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

          {/* Get Started Section - LinkedIn Style */}
          <div className="space-y-6">
            <Card className="border-2 border-gray-200 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-semibold text-gray-900 mb-2">
                  Get Started
                </CardTitle>
                <p className="text-base text-gray-600 leading-relaxed">
                  New to VentureUP Link? Create your account to get started.
                </p>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full justify-start h-auto py-4 px-4 border-2 hover:border-blue-500 hover:bg-blue-50 transition-all"
                    onClick={() => navigate('/register/venture')}
                  >
                    <div className="flex items-center w-full">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4 flex-shrink-0">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="text-base font-semibold text-gray-900 mb-1">Register as Venture</div>
                        <div className="text-sm text-gray-600">For startups seeking funding</div>
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full justify-start h-auto py-4 px-4 border-2 hover:border-green-500 hover:bg-green-50 transition-all"
                    onClick={() => navigate('/register/investor')}
                  >
                    <div className="flex items-center w-full">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4 flex-shrink-0">
                        <DollarSign className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="text-base font-semibold text-gray-900 mb-1">Register as Investor</div>
                        <div className="text-sm text-gray-600">For investors seeking opportunities</div>
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full justify-start h-auto py-4 px-4 border-2 hover:border-purple-500 hover:bg-purple-50 transition-all"
                    onClick={() => navigate('/register/mentor')}
                  >
                    <div className="flex items-center w-full">
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mr-4 flex-shrink-0">
                        <MessageSquare className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="text-base font-semibold text-gray-900 mb-1">Register as Mentor</div>
                        <div className="text-sm text-gray-600">For mentors offering guidance</div>
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Platform Features</h4>
                <ul className="text-base text-gray-700 space-y-2.5 leading-relaxed">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2 font-bold">•</span>
                    <span>Browse all ventures, public investors & mentors</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2 font-bold">•</span>
                    <span>View detailed profiles and pitch documents</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2 font-bold">•</span>
                    <span>Send and receive messages</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2 font-bold">•</span>
                    <span>Manage your portfolio and connections</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2 font-bold">•</span>
                    <span>Role-specific dashboard functionality</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}