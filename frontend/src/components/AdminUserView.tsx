import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { adminService, type UserListItem } from '../services/adminService';
import { Mail, Shield, CheckCircle, XCircle, Calendar, User, Eye } from 'lucide-react';

/**
 * AdminUserView
 * Lightweight user detail page for admin to inspect accounts.
 * Opens in a new tab via /dashboard/admin/user-view?userId=...
 */
export function AdminUserView() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const [user, setUser] = useState<UserListItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) {
        setIsLoading(false);
        setError('Missing userId');
        return;
      }
      try {
        setIsLoading(true);
        const data = await adminService.getUserDetail(userId);
        setUser(data);
        setError(null);
      } catch (e: any) {
        console.error('Failed to load user detail', e);
        setError(e?.message || 'Failed to load user detail');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>User not found</CardTitle>
            <CardDescription>{error || 'Unable to load user data.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => window.close()}>
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="w-6 h-6 text-gray-800" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Detail</h1>
              <p className="text-sm text-gray-600">{user.id}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => window.close()}>
            Close
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-700" />
              {user.full_name || user.email}
            </CardTitle>
            <CardDescription>Account overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3 text-sm text-gray-700">
              <Badge className="bg-gray-100 text-gray-800">Role: {user.role}</Badge>
              <Badge className={user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {user.is_active ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                {user.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <Badge className={user.is_email_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                {user.is_email_verified ? <CheckCircle className="w-3 h-3 mr-1" /> : <Shield className="w-3 h-3 mr-1" />}
                {user.is_email_verified ? 'Email Verified' : 'Email Pending'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Email</div>
                <div className="font-medium text-gray-900 inline-flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {user.email}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Joined</div>
                <div className="font-medium text-gray-900 inline-flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {new Date(user.date_joined).toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

