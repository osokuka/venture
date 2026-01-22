import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { 
  Rocket, 
  DollarSign, 
  MessageSquare, 
  ArrowRight,
  CheckCircle,
  Clock,
  Users
} from "lucide-react";

interface RegisterSectionProps {
  onRegister: (role: 'venture' | 'investor' | 'mentor') => void;
}

export function RegisterSection({ onRegister }: RegisterSectionProps) {
  return (
    <div className="py-20 px-6 bg-secondary/10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl mb-6">
            Ready to Transform Your Journey?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose your role and join the VentureLink ecosystem today. Each path is designed 
            to maximize your success and create meaningful connections.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Venture Registration */}
          <Card className="relative group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-200">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Rocket className="w-10 h-10 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">I'm a Venture</CardTitle>
              <p className="text-muted-foreground">
                Ready to raise funding and accelerate growth
              </p>
            </CardHeader>
            <CardContent className="px-6 pb-8">
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                  Connect with targeted investors
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                  Access expert mentors & advisors
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                  Showcase your pitch & traction
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                  Track investor engagement
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-2">
                  <Clock className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-sm">Application Process</span>
                </div>
                <div className="text-xs text-blue-800 space-y-1">
                  <div>• 5-minute signup & company profile</div>
                  <div>• Upload pitch deck & financials</div>
                  <div>• Profile review (24-48 hours)</div>
                  <div>• Start connecting with investors</div>
                </div>
              </div>

              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 group"
                onClick={() => onRegister('venture')}
                style={{ backgroundColor: '#2563EB' }} // Force blue background - fixes transparent bg issue
              >
                Start Your Journey
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <div className="text-center mt-3">
                <Badge variant="outline" className="text-xs">
                  Free to start • No upfront fees
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Investor Registration */}
          <Card className="relative group hover:shadow-xl transition-all duration-300 border-2 hover:border-green-200">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <DollarSign className="w-10 h-10 text-green-600" />
              </div>
              <CardTitle className="text-2xl">I'm an Investor</CardTitle>
              <p className="text-muted-foreground">
                Looking for high-quality investment opportunities
              </p>
            </CardHeader>
            <CardContent className="px-6 pb-8">
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                  Browse pre-vetted startups
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                  Advanced filtering & matching
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                  Direct founder communication
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                  Deal flow management tools
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-2">
                  <Users className="w-4 h-4 text-green-600 mr-2" />
                  <span className="text-sm">Investment Focus</span>
                </div>
                <div className="text-xs text-green-800 space-y-1">
                  <div>• Set investment criteria & stage</div>
                  <div>• Define industry preferences</div>
                  <div>• Configure deal size range</div>
                  <div>• Manage visibility settings</div>
                </div>
              </div>

              <Button 
                className="w-full bg-green-600 hover:bg-green-700 group"
                onClick={() => onRegister('investor')}
              >
                Join as Investor
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <div className="text-center mt-3">
                <Badge variant="outline" className="text-xs">
                  Exclusive access • Quality dealflow
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Mentor Registration */}
          <Card className="relative group hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-200">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-10 h-10 text-purple-600" />
              </div>
              <CardTitle className="text-2xl">I'm a Mentor</CardTitle>
              <p className="text-muted-foreground">
                Ready to guide and advise promising startups
              </p>
            </CardHeader>
            <CardContent className="px-6 pb-8">
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                  Share expertise with startups
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                  Flexible engagement options
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                  Build your advisory portfolio
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                  Network with other experts
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-2">
                  <MessageSquare className="w-4 h-4 text-purple-600 mr-2" />
                  <span className="text-sm">Mentoring Options</span>
                </div>
                <div className="text-xs text-purple-800 space-y-1">
                  <div>• Pro-bono or paid consulting</div>
                  <div>• Virtual or in-person sessions</div>
                  <div>• One-time or ongoing support</div>
                  <div>• Set your availability & rates</div>
                </div>
              </div>

              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700 group"
                onClick={() => onRegister('mentor')}
              >
                Become a Mentor
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <div className="text-center mt-3">
                <Badge variant="outline" className="text-xs">
                  Make an impact • Flexible terms
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            All registrations are reviewed within 24-48 hours to ensure quality matches
          </p>
          <div className="flex justify-center space-x-8 text-sm">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              Free to join
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              Verified profiles
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              Secure platform
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}