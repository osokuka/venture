import { Card, CardContent } from "./ui/card";
import { Rocket, DollarSign, MessageSquare, ArrowRight } from "lucide-react";

export function AboutSection() {
  return (
    <div className="py-20 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <h3 className="text-2xl md:text-3xl text-center mb-12">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Ventures */}
            <Card className="relative group hover:shadow-lg transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Rocket className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-xl mb-4">For Ventures</h4>
                <p className="text-muted-foreground mb-6">
                  Submit your startup profile, pitch deck, and funding needs. Get matched with 
                  relevant investors and mentors based on your industry and stage.
                </p>
                <div className="space-y-2 text-sm text-left">
                  <div className="flex items-center">
                    <ArrowRight className="w-4 h-4 mr-2 text-blue-600" />
                    Create detailed company profile
                  </div>
                  <div className="flex items-center">
                    <ArrowRight className="w-4 h-4 mr-2 text-blue-600" />
                    Upload pitch deck & financials
                  </div>
                  <div className="flex items-center">
                    <ArrowRight className="w-4 h-4 mr-2 text-blue-600" />
                    Get matched with investors & mentors
                  </div>
                  <div className="flex items-center">
                    <ArrowRight className="w-4 h-4 mr-2 text-blue-600" />
                    Track engagement & progress
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Investors */}
            <Card className="relative group hover:shadow-lg transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-xl mb-4">For Investors</h4>
                <p className="text-muted-foreground mb-6">
                  Browse pre-vetted startups that match your investment criteria. Access detailed 
                  analytics and connect directly with founding teams.
                </p>
                <div className="space-y-2 text-sm text-left">
                  <div className="flex items-center">
                    <ArrowRight className="w-4 h-4 mr-2 text-green-600" />
                    Set investment preferences & criteria
                  </div>
                  <div className="flex items-center">
                    <ArrowRight className="w-4 h-4 mr-2 text-green-600" />
                    Browse vetted startup pipeline
                  </div>
                  <div className="flex items-center">
                    <ArrowRight className="w-4 h-4 mr-2 text-green-600" />
                    Access detailed due diligence data
                  </div>
                  <div className="flex items-center">
                    <ArrowRight className="w-4 h-4 mr-2 text-green-600" />
                    Direct messaging with founders
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mentors */}
            <Card className="relative group hover:shadow-lg transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="text-xl mb-4">For Mentors</h4>
                <p className="text-muted-foreground mb-6">
                  Share your expertise with promising startups. Set your availability and get 
                  matched with ventures that need your specific skills.
                </p>
                <div className="space-y-2 text-sm text-left">
                  <div className="flex items-center">
                    <ArrowRight className="w-4 h-4 mr-2 text-purple-600" />
                    Define areas of expertise
                  </div>
                  <div className="flex items-center">
                    <ArrowRight className="w-4 h-4 mr-2 text-purple-600" />
                    Set availability & preferences
                  </div>
                  <div className="flex items-center">
                    <ArrowRight className="w-4 h-4 mr-2 text-purple-600" />
                    Get matched with relevant startups
                  </div>
                  <div className="flex items-center">
                    <ArrowRight className="w-4 h-4 mr-2 text-purple-600" />
                    Schedule & track sessions
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}