import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Users, 
  Building, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  FileText,
  Settings as SettingsIcon,
  Shield,
  BarChart3,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  Activity
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { adminService, type AdminStats, type UserListItem, type ApprovalItem } from '../services/adminService';
import { ApprovalsManagementTab } from './ApprovalsManagementTab';
import { UsersManagementTab } from './UsersManagementTab';
import { AdminProductsTab } from './AdminProductsTab';
import { UserProfile } from './UserProfile';
import { EditProfile } from './EditProfile';
import { Settings } from './Settings';

interface AdminDashboardProps {
  user: any;
  activeView?: string;
  onViewChange?: (view: string) => void;
  onProfileUpdate?: (updates: any) => void;
}

export function AdminDashboard({ user, activeView = 'overview', onViewChange, onProfileUpdate }: AdminDashboardProps) {
  const { logout } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalVentures: 0,
    totalInvestors: 0,
    totalMentors: 0,
    pendingApprovals: 0,
    approvedProfiles: 0,
    rejectedProfiles: 0,
    totalMessages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'products' | 'approvals' | 'analytics'>('overview');

  // Helper function to get Django admin URL from API base URL
  // Extracts the base URL (protocol + host + port) and appends /admin
  const getAdminUrl = (): string => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api';
    try {
      // Parse the API URL and extract base URL (remove /api if present)
      const url = new URL(apiBaseUrl);
      // Remove /api from pathname if it exists
      let pathname = url.pathname.replace(/\/api\/?$/, '');
      // Construct admin URL
      return `${url.protocol}//${url.host}${pathname}/admin`;
    } catch (error) {
      // Fallback: if URL parsing fails, try simple string replacement
      const baseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
      return `${baseUrl}/admin`;
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const data = await adminService.getStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
        // Fallback to mock data on error
        setStats({
          totalUsers: 0,
          totalVentures: 0,
          totalInvestors: 0,
          totalMentors: 0,
          pendingApprovals: 0,
          approvedProfiles: 0,
          rejectedProfiles: 0,
          totalMessages: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  // TODO: VL-811 - Replace hardcoded percentage changes with API call to historical stats
  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12%', // TODO: VL-811 - Fetch from historical stats API
      changeType: 'positive' as const,
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      change: '+3', // TODO: VL-811 - Fetch from historical stats API
      changeType: 'neutral' as const,
    },
    {
      title: 'Approved Profiles',
      value: stats.approvedProfiles.toLocaleString(),
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+8%', // TODO: VL-811 - Fetch from historical stats API
      changeType: 'positive' as const,
    },
    {
      title: 'Total Messages',
      value: stats.totalMessages.toLocaleString(),
      icon: MessageSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+15%', // TODO: VL-811 - Fetch from historical stats API
      changeType: 'positive' as const,
    },
  ];

  const roleStats = [
    {
      role: 'Ventures',
      count: stats.totalVentures,
      icon: Building,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      role: 'Investors',
      count: stats.totalInvestors,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      role: 'Mentors',
      count: stats.totalMentors,
      icon: UserCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  // Handle profile views (view and edit)
  if (activeView === 'profile') {
    return <UserProfile user={user} onEdit={() => onViewChange?.('edit-profile')} isOwnProfile={true} />;
  }

  if (activeView === 'edit-profile') {
    return <EditProfile user={user} onProfileUpdate={onProfileUpdate} />;
  }

  if (activeView === 'settings') {
    return <Settings user={user} />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Portal</h1>
          <p className="text-gray-600 mt-1">Manage users, approvals, and platform settings</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Shield className="w-4 h-4 mr-1" />
            Administrator
          </Badge>
          <a
            href={getAdminUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-chrome-primary text-sm px-4 py-2"
          >
            Django Admin
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'products', label: 'Products', icon: Building },
            { id: 'approvals', label: 'Approvals', icon: CheckCircle },
            { id: 'analytics', label: 'Analytics', icon: Activity },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                      <div className="flex items-center mt-2">
                        <span className={`text-sm ${
                          stat.changeType === 'positive' ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {stat.change}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">vs last month</span>
                      </div>
                    </div>
                    <div className={`${stat.bgColor} p-3 rounded-lg`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Role Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roleStats.map((role, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{role.role}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">{role.count}</p>
                    </div>
                    <div className={`${role.bgColor} p-3 rounded-lg`}>
                      <role.icon className={`w-6 h-6 ${role.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto flex-col items-start p-4 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                  onClick={() => setActiveTab('approvals')}
                >
                  <UserCheck className="w-5 h-5 mb-2 text-blue-600" />
                  <span className="font-medium">Review Approvals</span>
                  <span className="text-xs text-gray-500 mt-1">{stats.pendingApprovals} pending</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto flex-col items-start p-4 hover:bg-green-50 hover:border-green-200 transition-colors"
                  onClick={() => setActiveTab('users')}
                >
                  <Users className="w-5 h-5 mb-2 text-green-600" />
                  <span className="font-medium">Manage Users</span>
                  <span className="text-xs text-gray-500 mt-1">View all users</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto flex-col items-start p-4 hover:bg-purple-50 hover:border-purple-200 transition-colors"
                  onClick={() => setActiveTab('analytics')}
                >
                  <BarChart3 className="w-5 h-5 mb-2 text-purple-600" />
                  <span className="font-medium">View Analytics</span>
                  <span className="text-xs text-gray-500 mt-1">Platform metrics</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto flex-col items-start p-4 hover:bg-gray-50 hover:border-gray-200 transition-colors"
                  onClick={() => window.open(getAdminUrl(), '_blank')}
                >
                  <FileText className="w-5 h-5 mb-2 text-gray-600" />
                  <span className="font-medium">Django Admin</span>
                  <span className="text-xs text-gray-500 mt-1">Advanced settings</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <UsersManagementTab stats={stats} />
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <AdminProductsTab stats={stats} />
      )}

      {/* Approvals Tab */}
      {activeTab === 'approvals' && (
        <ApprovalsManagementTab stats={stats} />
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Analytics</CardTitle>
              <CardDescription>View platform metrics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Users</p>
                          <p className="text-2xl font-bold mt-1">{stats.totalUsers}</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Active Profiles</p>
                          <p className="text-2xl font-bold mt-1">{stats.approvedProfiles}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Pending Reviews</p>
                          <p className="text-2xl font-bold mt-1">{stats.pendingApprovals}</p>
                        </div>
                        <Clock className="w-8 h-8 text-yellow-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Messages</p>
                          <p className="text-2xl font-bold mt-1">{stats.totalMessages}</p>
                        </div>
                        <MessageSquare className="w-8 h-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Role Distribution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Role Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Ventures</span>
                            <span className="text-sm font-semibold">{stats.totalVentures}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${stats.totalUsers > 0 ? (stats.totalVentures / stats.totalUsers) * 100 : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Investors</span>
                            <span className="text-sm font-semibold">{stats.totalInvestors}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{
                                width: `${stats.totalUsers > 0 ? (stats.totalInvestors / stats.totalUsers) * 100 : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Mentors</span>
                            <span className="text-sm font-semibold">{stats.totalMentors}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full"
                              style={{
                                width: `${stats.totalUsers > 0 ? (stats.totalMentors / stats.totalUsers) * 100 : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Activity Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <MessageSquare className="w-5 h-5 text-purple-600" />
                            <span className="text-sm text-gray-700">Messages Sent</span>
                          </div>
                          <span className="font-semibold">{stats.totalMessages}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-blue-600" />
                            <span className="text-sm text-gray-700">Active Users</span>
                          </div>
                          {/* TODO: VL-811 - Replace hardcoded calculation with API call to GET /api/admin/stats/active-users */}
                          <span className="font-semibold">
                            {Math.floor(stats.totalUsers * 0.65)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-sm text-gray-700">Approved Profiles</span>
                          </div>
                          <span className="font-semibold">{stats.approvedProfiles}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <XCircle className="w-5 h-5 text-red-600" />
                            <span className="text-sm text-gray-700">Rejected Profiles</span>
                          </div>
                          <span className="font-semibold">{stats.rejectedProfiles}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Approval Status Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Approval Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* TODO: VL-811 - Replace placeholder with real charts using charting library (e.g., Recharts) and data from GET /api/admin/analytics */}
                    <div className="h-48 flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">Detailed charts coming soon</p>
                        <p className="text-xs mt-1 text-gray-500">
                          Integration with charting library pending
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
