/**
 * Unified Registration Page with Sidebar
 * LinkedIn-style registration page with role selection sidebar
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Building2, TrendingUp, Users, Check } from 'lucide-react';
import { VentureRegistration } from './VentureRegistration';
import { InvestorRegistration } from './InvestorRegistration';
import { MentorRegistration } from './MentorRegistration';
import { useAuth } from './AuthContext';

export function UnifiedRegistration() {
  const navigate = useNavigate();
  const { role } = useParams<{ role: 'venture' | 'investor' | 'mentor' }>();
  const { startRegistration } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'venture' | 'investor' | 'mentor' | null>(
    role || null
  );

  useEffect(() => {
    if (role && ['venture', 'investor', 'mentor'].includes(role)) {
      setSelectedRole(role as 'venture' | 'investor' | 'mentor');
      // Keep AuthContext in sync so registration submits always have a role.
      startRegistration(role as 'venture' | 'investor' | 'mentor');
    }
  }, [role, startRegistration]);

  const roles = [
    {
      id: 'venture' as const,
      title: 'Venture',
      icon: Building2,
      description: 'Startups seeking investment',
      color: 'blue'
    },
    {
      id: 'investor' as const,
      title: 'Investor',
      icon: TrendingUp,
      description: 'Looking to invest',
      color: 'green'
    },
    {
      id: 'mentor' as const,
      title: 'Mentor',
      icon: Users,
      description: 'Share your expertise',
      color: 'purple'
    }
  ];

  const handleRoleChange = (newRole: 'venture' | 'investor' | 'mentor') => {
    setSelectedRole(newRole);
    startRegistration(newRole);
    navigate(`/register/${newRole}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar - LinkedIn Style */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen sticky top-0">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Register as</h2>
            
            <nav className="space-y-2">
              {roles.map((roleOption) => {
                const Icon = roleOption.icon;
                const isActive = selectedRole === roleOption.id;
                
                return (
                  <button
                    key={roleOption.id}
                    onClick={() => handleRoleChange(roleOption.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? roleOption.color === 'blue' ? 'bg-blue-50 border-2 border-blue-600 text-blue-900' :
                          roleOption.color === 'green' ? 'bg-green-50 border-2 border-green-600 text-green-900' :
                          'bg-purple-50 border-2 border-purple-600 text-purple-900'
                        : 'border-2 border-transparent hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${
                      isActive 
                        ? roleOption.color === 'blue' ? 'text-blue-600' :
                          roleOption.color === 'green' ? 'text-green-600' :
                          'text-purple-600'
                        : 'text-gray-500'
                    }`} />
                    <div className="flex-1 text-left">
                      <div className={`font-medium ${
                        isActive 
                          ? roleOption.color === 'blue' ? 'text-blue-900' :
                            roleOption.color === 'green' ? 'text-green-900' :
                            'text-purple-900'
                          : 'text-gray-900'
                      }`}>
                        {roleOption.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {roleOption.description}
                      </div>
                    </div>
                    {isActive && (
                      <Check className={`w-4 h-4 ${
                        roleOption.color === 'blue' ? 'text-blue-600' :
                        roleOption.color === 'green' ? 'text-green-600' :
                        'text-purple-600'
                      }`} />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Back to selection */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <button
                onClick={() => navigate('/register')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Choose different role
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {selectedRole === 'venture' && <VentureRegistration />}
          {selectedRole === 'investor' && <InvestorRegistration />}
          {selectedRole === 'mentor' && <MentorRegistration />}
          {!selectedRole && (
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <p className="text-gray-600 mb-4">Please select a role to continue</p>
                <Button onClick={() => navigate('/register')}>
                  Choose Role
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
