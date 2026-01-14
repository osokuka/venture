import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  Search, 
  BarChart3, 
  Handshake,
  Award,
  Eye,
  Calendar
} from "lucide-react";

export function BenefitsSection() {
  return (
    <div className="py-20 px-6 bg-secondary/10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl mb-6">
            Tailored Benefits for Every Stakeholder
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our platform is designed to deliver maximum value to ventures, investors, and mentors 
            through intelligent matching and comprehensive tools.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* For Ventures */}
          <Card className="relative">
            <CardHeader>
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  For Ventures
                </Badge>
              </div>
              <CardTitle>Accelerate Your Growth</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">Smart Funding Matches</div>
                  <div className="text-sm text-muted-foreground">
                    Connect with investors who specialize in your industry and stage
                  </div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">Expert Guidance</div>
                  <div className="text-sm text-muted-foreground">
                    Access seasoned mentors for fundraising, GTM, legal, and more
                  </div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">Increased Visibility</div>
                  <div className="text-sm text-muted-foreground">
                    Showcase your startup to a curated network of investors
                  </div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">Progress Tracking</div>
                  <div className="text-sm text-muted-foreground">
                    Monitor engagement, follow-ups, and funding progress
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* For Investors */}
          <Card className="relative">
            <CardHeader>
              <div className="flex items-center space-x-2 mb-2">
                <Search className="w-6 h-6 text-green-600" />
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  For Investors
                </Badge>
              </div>
              <CardTitle>Discover Quality Deals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">Pre-Vetted Startups</div>
                  <div className="text-sm text-muted-foreground">
                    Access thoroughly screened ventures with verified traction
                  </div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">Intelligent Matching</div>
                  <div className="text-sm text-muted-foreground">
                    Find deals aligned with your investment thesis and criteria
                  </div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">Comprehensive Analytics</div>
                  <div className="text-sm text-muted-foreground">
                    Access detailed market analysis and startup performance data
                  </div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">Direct Access</div>
                  <div className="text-sm text-muted-foreground">
                    Connect directly with founders through secure messaging
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* For Mentors */}
          <Card className="relative">
            <CardHeader>
              <div className="flex items-center space-x-2 mb-2">
                <Award className="w-6 h-6 text-purple-600" />
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  For Mentors
                </Badge>
              </div>
              <CardTitle>Make Meaningful Impact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">Strategic Impact</div>
                  <div className="text-sm text-muted-foreground">
                    Guide promising startups and shape the next generation of leaders
                  </div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">Enhanced Visibility</div>
                  <div className="text-sm text-muted-foreground">
                    Build your reputation as a thought leader in the startup ecosystem
                  </div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">Flexible Opportunities</div>
                  <div className="text-sm text-muted-foreground">
                    Choose between paid consulting and pro-bono mentoring options
                  </div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">Network Growth</div>
                  <div className="text-sm text-muted-foreground">
                    Connect with other experts and expand your professional network
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}