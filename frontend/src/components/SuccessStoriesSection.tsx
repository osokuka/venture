import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Star, TrendingUp, Users, DollarSign } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function SuccessStoriesSection() {
  const successStories = [
    {
      id: 1,
      companyName: "TechFlow AI",
      logo: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=120&h=120&fit=crop&crop=center",
      industry: "AI/ML",
      fundingRaised: "$2.5M",
      growth: "300%",
      employees: "15→45",
      testimonial: "VentureUP Link connected us with the perfect investor who understood our vision. The mentorship we received was invaluable for scaling our AI platform.",
      founder: "Sarah Chen, CEO"
    },
    {
      id: 2,
      companyName: "GreenSpace",
      logo: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=120&h=120&fit=crop&crop=center",
      industry: "CleanTech",
      fundingRaised: "$5M",
      growth: "450%",
      employees: "8→32",
      testimonial: "The platform's matching algorithm was spot-on. We found investors who shared our passion for sustainability and mentors who guided our market expansion.",
      founder: "Marcus Rodriguez, Founder"
    },
    {
      id: 3,
      companyName: "HealthBridge",
      logo: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=120&h=120&fit=crop&crop=center",
      industry: "HealthTech",
      fundingRaised: "$3.8M",
      growth: "280%",
      employees: "12→28",
      testimonial: "VentureUP Link's mentors helped us navigate complex healthcare regulations while investors provided strategic guidance beyond just funding.",
      founder: "Dr. Lisa Park, Co-founder"
    },
    {
      id: 4,
      companyName: "EduNext",
      logo: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=120&h=120&fit=crop&crop=center",
      industry: "EdTech",
      fundingRaised: "$1.8M",
      growth: "220%",
      employees: "6→18",
      testimonial: "The direct connection to investors eliminated months of networking. Our mentor's experience in EdTech was crucial for product-market fit.",
      founder: "James Kim, CEO"
    }
  ];

  return (
    <div className="py-20 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl mb-6">
            Success Stories from Our Community
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Real startups, real results. See how VentureLink has helped innovative companies 
            secure funding, find mentors, and accelerate their growth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {successStories.map((story) => (
            <Card key={story.id} className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <ImageWithFallback
                      src={story.logo}
                      alt={`${story.companyName} logo`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl mb-1">{story.companyName}</h4>
                    <Badge variant="outline" className="mb-3">
                      {story.industry}
                    </Badge>
                    <div className="flex items-center space-x-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <DollarSign className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-sm text-green-800">Funding</span>
                    </div>
                    <div className="text-lg text-green-900">{story.fundingRaised}</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <TrendingUp className="w-4 h-4 text-blue-600 mr-1" />
                      <span className="text-sm text-blue-800">Growth</span>
                    </div>
                    <div className="text-lg text-blue-900">{story.growth}</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <Users className="w-4 h-4 text-purple-600 mr-1" />
                      <span className="text-sm text-purple-800">Team</span>
                    </div>
                    <div className="text-lg text-purple-900">{story.employees}</div>
                  </div>
                </div>

                <blockquote className="text-muted-foreground italic mb-4">
                  "{story.testimonial}"
                </blockquote>
                
                <div className="text-sm">
                  <strong>{story.founder}</strong>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Badge variant="outline" className="px-4 py-2">
            Join 500+ successful startups on VentureUP Link
          </Badge>
        </div>
      </div>
    </div>
  );
}