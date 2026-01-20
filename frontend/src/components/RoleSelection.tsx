/**
 * Role Selection Page
 * LinkedIn-style page where users can choose to register as Venture, Investor, or Mentor
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Building2, TrendingUp, Users, ArrowRight, Check } from 'lucide-react';

export function RoleSelection() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'venture' | 'investor' | 'mentor' | null>(null);

  const roles = [
    {
      id: 'venture' as const,
      title: 'Venture',
      icon: Building2,
      description: 'Startups and companies seeking investment and mentorship',
      features: [
        'Create up to 3 pitch decks',
        'Share with investors',
        'Track engagement',
        'Get matched with mentors'
      ],
      color: 'blue'
    },
    {
      id: 'investor' as const,
      title: 'Investor',
      icon: TrendingUp,
      description: 'Individual investors, firms, and organizations looking to invest',
      features: [
        'Discover startups',
        'Review pitch decks',
        'Commit to investments',
        'Manage portfolio'
      ],
      color: 'green'
    },
    {
      id: 'mentor' as const,
      title: 'Mentor',
      icon: Users,
      description: 'Experienced professionals offering guidance and expertise',
      features: [
        'Connect with startups',
        'Share expertise',
        'Schedule meetings',
        'Build your network'
      ],
      color: 'purple'
    }
  ];

  const handleContinue = () => {
    if (selectedRole) {
      navigate(`/register/${selectedRole}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold text-gray-900 mb-3">
            Choose Your Path
          </h1>
          <p className="text-lg text-gray-600">
            Select how you'd like to join VentureUPLink
          </p>
        </div>

        {/* Role Cards - LinkedIn Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;

            // Tailwind note: avoid dynamic class strings like `border-${color}-600` because
            // they can be removed by Tailwind's class scanner in production builds.
            const selectedBorderClass =
              role.color === 'blue'
                ? 'border-blue-600'
                : role.color === 'green'
                  ? 'border-green-600'
                  : 'border-purple-600';
            
            return (
              <Card
                key={role.id}
                className={`cursor-pointer transition-all duration-200 border-2 ${
                  isSelected
                    ? `${selectedBorderClass} shadow-lg`
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
                onClick={() => setSelectedRole(role.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      role.color === 'blue' ? 'bg-blue-100' : 
                      role.color === 'green' ? 'bg-green-100' : 
                      'bg-purple-100'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        role.color === 'blue' ? 'text-blue-600' : 
                        role.color === 'green' ? 'text-green-600' : 
                        'text-purple-600'
                      }`} />
                    </div>
                    {isSelected && (
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        role.color === 'blue' ? 'bg-blue-600' : 
                        role.color === 'green' ? 'bg-green-600' : 
                        'bg-purple-600'
                      }`}>
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {role.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    {role.description}
                  </p>
                  
                  <ul className="space-y-2">
                    {role.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-sm text-gray-700">
                        <Check className={`w-4 h-4 mr-2 mt-0.5 flex-shrink-0 ${
                          role.color === 'blue' ? 'text-blue-600' : 
                          role.color === 'green' ? 'text-green-600' : 
                          'text-purple-600'
                        }`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Continue Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleContinue}
            disabled={!selectedRole}
            size="lg"
            className="px-8 py-6 text-lg"
          >
            Continue as {selectedRole ? roles.find(r => r.id === selectedRole)?.title : '...'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Already have an account */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
