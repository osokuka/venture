import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { 
  Target, 
  Users, 
  TrendingUp, 
  Shield, 
  Zap, 
  Brain,
  MessageSquare,
  FileText,
  BarChart3,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Matching",
      description: "Our advanced algorithm analyzes compatibility across industry, stage, investment size, and growth potential.",
      highlights: ["95% accuracy rate", "Real-time updates", "Smart recommendations"],
      bgColor: "bg-gray-600",
      lightBg: "bg-gray-50",
      textColor: "text-gray-600",
      darkText: "text-gray-900"
    },
    {
      icon: Shield,
      title: "Verified Network",
      description: "All members undergo rigorous verification. Connect with confidence knowing everyone is genuine.",
      highlights: ["KYC verified", "Background checks", "Reference validation"],
      bgColor: "bg-gray-700",
      lightBg: "bg-gray-50",
      textColor: "text-gray-600",
      darkText: "text-gray-900"
    },
    {
      icon: FileText,
      title: "ISO & GDPR Compliant",
      description: "Enterprise-grade security and compliance standards ensure your data is protected according to international regulations.",
      highlights: ["ISO 27001 compliant", "GDPR compliant", "Data protection"],
      bgColor: "bg-gray-800",
      lightBg: "bg-gray-50",
      textColor: "text-gray-600",
      darkText: "text-gray-900"
    },
    {
      icon: BarChart3,
      title: "Portfolio Analytics",
      description: "Track performance, analyze trends, and make data-driven decisions with comprehensive insights.",
      highlights: ["Real-time metrics", "Custom reports", "Benchmark analysis"],
      bgColor: "bg-slate-600",
      lightBg: "bg-slate-50",
      textColor: "text-slate-600",
      darkText: "text-slate-900"
    },
    {
      icon: Zap,
      title: "Fast Deal Flow",
      description: "Streamlined processes from introduction to closing. Average time to first meeting: 3 days.",
      highlights: ["Quick onboarding", "Automated workflows", "Digital signatures"],
      bgColor: "bg-slate-700",
      lightBg: "bg-slate-50",
      textColor: "text-slate-600",
      darkText: "text-slate-900"
    },
    {
      icon: Users,
      title: "Expert Mentorship",
      description: "Access industry veterans who've been where you're going. Get guidance that matters.",
      highlights: ["Seasoned advisors", "Industry specialists", "Success track record"],
      bgColor: "bg-slate-800",
      lightBg: "bg-slate-50",
      textColor: "text-slate-600",
      darkText: "text-slate-900"
    }
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-20">
          <Badge className="bg-gray-100 text-gray-700 border-gray-200 mb-6 px-4 py-2">
            Platform Features
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Everything you need to
            <span className="text-gray-700"> succeed</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            From discovery to deal closing, our comprehensive platform provides all the tools 
            and resources you need to build successful partnerships.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:-translate-y-2 overflow-hidden">
              <CardContent className="p-0">
                {/* Colored Header */}
                <div className={`${feature.lightBg} p-6 border-b`}>
                  <div className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className={`text-xl font-bold ${feature.darkText} group-hover:scale-105 transition-transform`}>
                    {feature.title}
                  </h3>
                </div>

                {/* Content */}
                <div className="p-6 bg-white">
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  <div className="space-y-3">
                    {feature.highlights.map((highlight, idx) => (
                      <div key={idx} className="flex items-center space-x-3">
                        <CheckCircle2 className={`w-4 h-4 ${feature.textColor}`} />
                        <span className="text-sm text-gray-600">{highlight}</span>
                      </div>
                    ))}
                  </div>

                  {/* Hover Button */}
                  <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button className="btn-chrome w-full text-sm">
                      Learn More
                      <ArrowRight className="w-4 h-4 ml-2 inline" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}