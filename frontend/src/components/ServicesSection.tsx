import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { 
  Rocket, 
  DollarSign, 
  GraduationCap,
  ArrowRight,
  Target,
  TrendingUp,
  Users,
  Brain,
  Shield,
  Zap,
  CheckCircle2,
  Star,
  Crown
} from "lucide-react";

interface ServicesSectionProps {
  onRegister: (role?: 'venture' | 'investor' | 'mentor') => void;
}

export function ServicesSection({ onRegister }: ServicesSectionProps) {
  const services = [
    {
      role: 'venture' as const,
      icon: Rocket,
      title: "For Startups",
      subtitle: "Scale your venture with the right connections",
      description: "Connect with investors who understand your vision and mentors who've walked your path.",
      features: [
        "Access to 2,000+ verified investors",
        "AI-powered investor matching",
        "Pitch deck optimization tools",
        "Expert mentor network",
        "Due diligence support",
        "Growth strategy guidance"
      ],
      stats: [
        { label: "Average funding raised", value: "$2.4M" },
        { label: "Success rate", value: "78%" },
        { label: "Time to first meeting", value: "3 days" }
      ],
      primaryColor: "bg-gray-700",
      lightColor: "bg-gray-50",
      textColor: "text-gray-600",
      darkText: "text-gray-900",
      borderColor: "border-gray-200",
      popular: true
    },
    {
      role: 'investor' as const,
      icon: DollarSign,
      title: "For Investors",
      subtitle: "Discover high-potential investment opportunities",
      description: "Find vetted startups that match your investment thesis and portfolio strategy.",
      features: [
        "Curated deal flow",
        "Advanced filtering & search",
        "Comprehensive startup analytics",
        "Portfolio management tools",
        "Co-investment opportunities",
        "Market intelligence reports"
      ],
      stats: [
        { label: "Startups in network", value: "5,000+" },
        { label: "Average ROI", value: "4.2x" },
        { label: "Deal completion rate", value: "65%" }
      ],
      primaryColor: "bg-slate-700",
      lightColor: "bg-slate-50",
      textColor: "text-slate-600",
      darkText: "text-slate-900",
      borderColor: "border-slate-200",
      popular: false
    },
    {
      role: 'mentor' as const,
      icon: GraduationCap,
      title: "For Mentors",
      subtitle: "Share your expertise and build legacy",
      description: "Guide the next generation of entrepreneurs while expanding your professional network.",
      features: [
        "Flexible mentoring options",
        "Reputation & rating system",
        "Compensation opportunities",
        "Network expansion",
        "Industry recognition",
        "Knowledge sharing platform"
      ],
      stats: [
        { label: "Mentorship requests", value: "500+/month" },
        { label: "Average mentor rating", value: "4.8/5" },
        { label: "Success stories", value: "1,200+" }
      ],
      primaryColor: "bg-stone-700",
      lightColor: "bg-stone-50",
      textColor: "text-stone-600",
      darkText: "text-stone-900",
      borderColor: "border-stone-200",
      popular: false
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-20">
          <Badge className="bg-gray-100 text-gray-700 border-gray-200 mb-6 px-4 py-2">
            Our Services
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Tailored solutions for
            <span className="text-gray-700"> every stakeholder</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Whether you're raising capital, deploying investments, or sharing expertise, 
            we have the perfect solution for your needs.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {services.map((service, index) => (
            <Card 
              key={index} 
              className={`relative overflow-hidden group hover:shadow-2xl transition-all duration-500 border-2 ${service.borderColor} shadow-lg hover:-translate-y-4 bg-white`}
            >
              {service.popular && (
                <div className="absolute top-0 right-0 z-10">
                  <div className="bg-yellow-400 text-yellow-900 px-4 py-2 text-sm font-bold flex items-center space-x-1 transform rotate-12 translate-x-4 -translate-y-2 shadow-lg rounded-full">
                    <Crown className="w-4 h-4" />
                    <span>Most Popular</span>
                  </div>
                </div>
              )}
              
              {/* Colored Header */}
              <div className={`${service.lightColor} p-8 border-b-2 ${service.borderColor}`}>
                <div className={`w-16 h-16 ${service.primaryColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-lg`}>
                  <service.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className={`text-2xl font-bold ${service.darkText} mb-2`}>
                  {service.title}
                </h3>
                <p className={`text-lg ${service.textColor} mb-4`}>
                  {service.subtitle}
                </p>
                <p className="text-gray-600 leading-relaxed">
                  {service.description}
                </p>
              </div>

              <CardContent className="p-8 bg-white">
                {/* Features */}
                <div className="mb-8">
                  <h4 className="font-semibold text-gray-900 mb-4">What's included:</h4>
                  <div className="space-y-3">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start space-x-3">
                        <CheckCircle2 className={`w-5 h-5 ${service.textColor} mt-0.5 flex-shrink-0`} />
                        <span className="text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className={`mb-8 p-6 ${service.lightColor} rounded-xl border ${service.borderColor}`}>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Star className={`w-4 h-4 ${service.textColor} mr-2`} />
                    Key Metrics
                  </h4>
                  <div className="space-y-3">
                    {service.stats.map((stat, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">{stat.label}</span>
                        <span className={`font-bold ${service.darkText}`}>{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <button 
                  className="btn-chrome-primary w-full py-3"
                  onClick={() => onRegister(service.role)}
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2 inline" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="bg-gray-50 rounded-2xl p-12 border border-gray-200 shadow-lg">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Not sure which plan is right for you?
            </h3>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Our team is here to help you choose the perfect solution for your specific needs. 
              Schedule a consultation with our experts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-chrome-primary px-8 py-3">
                Schedule Consultation
              </button>
              <button className="btn-chrome-secondary px-8 py-3">
                Compare Plans
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}