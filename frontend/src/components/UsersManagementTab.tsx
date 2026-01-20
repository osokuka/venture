/**
 * Users Management Tab Component
 * Handles user listing, filtering, and management actions
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Users,
  Building,
  TrendingUp,
  UserCheck,
  Search,
  Mail,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { adminService, type UserListItem, type ApprovalItem } from '../services/adminService';
import { Alert, AlertDescription } from './ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface UsersManagementTabProps {
  stats: {
    totalUsers: number;
    totalVentures: number;
    totalInvestors: number;
    totalMentors: number;
  };
}

export function UsersManagementTab({ stats }: UsersManagementTabProps) {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'ALL' | 'VENTURE' | 'INVESTOR' | 'MENTOR' | 'ADMIN'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const pageSize = 20;
  
  // Map of user_id -> pending profile review (INVESTOR/MENTOR)
  const [pendingProfileReviewByUserId, setPendingProfileReviewByUserId] = useState<Record<string, ApprovalItem>>({});

  // CRUD dialogs/state
  const [createOpen, setCreateOpen] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formRole, setFormRole] = useState<'VENTURE' | 'INVESTOR' | 'MENTOR' | 'ADMIN'>('VENTURE');

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const params: { role?: string; page?: number; search?: string } = {
          page: currentPage,
        };
        
        if (filterRole !== 'ALL') {
          params.role = filterRole;
        }
        
        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }

        const data = await adminService.getUsers(params);
        setUsers(data.results);
        setTotalCount(data.count);
        setHasNext(!!data.next);
        setHasPrevious(!!data.previous);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setError('Failed to load users. Please try again.');
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [currentPage, filterRole, searchQuery]);

  // Fetch pending profile reviews (investor + mentor) to power "Approve/Reject profile" entrypoints in Users table.
  useEffect(() => {
    const fetchPendingProfileReviews = async () => {
      try {
        // Only needed when there are users displayed
        if (!users.length) {
          setPendingProfileReviewByUserId({});
          return;
        }

        // If currently filtered to a single role, only fetch that role to reduce payload.
        const typesToFetch: Array<'INVESTOR' | 'MENTOR'> =
          filterRole === 'INVESTOR' ? ['INVESTOR']
          : filterRole === 'MENTOR' ? ['MENTOR']
          : ['INVESTOR', 'MENTOR'];

        const results = await Promise.all(
          typesToFetch.map((type) => adminService.getPendingApprovals({ type }))
        );
        const approvals = results.flat();

        const map: Record<string, ApprovalItem> = {};
        approvals.forEach((a) => {
          // Only map investor/mentor profile approvals (NOT venture pitch deck/product approvals)
          const isProfileApproval = (a.role === 'INVESTOR' || a.role === 'MENTOR') && !a.product_id;
          if (!isProfileApproval) return;
          if (a.user_id) map[a.user_id] = a;
        });

        setPendingProfileReviewByUserId(map);
      } catch (e) {
        // Non-fatal: users table should still work even if approvals endpoint fails.
        console.error('Failed to fetch pending profile approvals:', e);
        setPendingProfileReviewByUserId({});
      }
    };

    fetchPendingProfileReviews();
  }, [users, filterRole]);

  const refresh = async () => {
    // Minimal refresh helper (re-triggers effect by re-setting current page)
    setCurrentPage((p) => p);
  };

  const handleToggleActive = async (u: UserListItem) => {
    if (!confirm(`Are you sure you want to ${u.is_active ? 'deactivate' : 'activate'} ${u.full_name}?`)) {
      return;
    }
    try {
      setIsMutating(true);
      const updated = await adminService.updateUser(u.id, { is_active: !u.is_active });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
    } catch (e) {
      console.error(e);
      alert('Failed to update user status.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleDelete = async (u: UserListItem) => {
    if (!confirm(`Delete user ${u.email}? This cannot be undone.`)) return;
    try {
      setIsMutating(true);
      await adminService.deleteUser(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      setTotalCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error(e);
      alert('Failed to delete user.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleCreate = async () => {
    if (!formEmail.trim() || !formFullName.trim()) {
      alert('Email and full name are required.');
      return;
    }
    try {
      setIsMutating(true);
      await adminService.createUser({
        email: formEmail.trim(),
        password: formPassword.trim() || undefined,
        full_name: formFullName.trim(),
        role: formRole,
        is_email_verified: true,
        is_active: true,
      });
      setCreateOpen(false);
      setFormEmail('');
      setFormPassword('');
      setFormFullName('');
      setFormRole('VENTURE');
      await refresh();
    } catch (e) {
      console.error(e);
      alert('Failed to create user.');
    } finally {
      setIsMutating(false);
    }
  };

  // Handle search with debounce
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page on search
  };

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'VENTURE':
        return Building;
      case 'INVESTOR':
        return TrendingUp;
      case 'MENTOR':
        return UserCheck;
      case 'ADMIN':
        return Shield;
      default:
        return Users;
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'VENTURE':
        return 'bg-blue-100 text-blue-800';
      case 'INVESTOR':
        return 'bg-green-100 text-green-800';
      case 'MENTOR':
        return 'bg-purple-100 text-purple-800';
      case 'ADMIN':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            View and manage all platform users ({totalCount} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              Admin CRUD: create, activate/deactivate, delete
            </div>
            <Button onClick={() => setCreateOpen(true)} disabled={isLoading || isMutating}>
              + Create User
            </Button>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['ALL', 'VENTURE', 'INVESTOR', 'MENTOR', 'ADMIN'] as const).map((role) => (
                <Button
                  key={role}
                  variant={filterRole === role ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setFilterRole(role);
                    setCurrentPage(1);
                  }}
                >
                  {role === 'ALL' ? 'All' : role.charAt(0) + role.slice(1).toLowerCase()}
                  {role !== 'ALL' && (
                    <span className="ml-2 text-xs opacity-75">
                      ({role === 'VENTURE' ? stats.totalVentures :
                        role === 'INVESTOR' ? stats.totalInvestors :
                        role === 'MENTOR' ? stats.totalMentors : 0})
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No users found</p>
              <p className="text-sm mt-2">
                {searchQuery || filterRole !== 'ALL'
                  ? 'Try adjusting your search or filters'
                  : 'No users registered yet'}
              </p>
            </div>
          ) : (
            <>
              {/* Users Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Email Verified</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const RoleIcon = getRoleIcon(user.role);
                      return (
                        <TableRow key={user.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${getRoleBadgeColor(user.role)}`}>
                                <RoleIcon className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-medium">{user.full_name}</div>
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRoleBadgeColor(user.role)}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.is_active ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
                                <XCircle className="w-3 h-3 mr-1" />
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.is_email_verified ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Calendar className="w-3 h-3" />
                              {formatDate(user.date_joined)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {/* Open user view (all roles) */}
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isMutating}
                                onClick={() => {
                                  const params = new URLSearchParams({ userId: user.id });
                                  window.open(
                                    `/dashboard/admin/user-view?${params.toString()}`,
                                    '_blank',
                                    'noopener,noreferrer'
                                  );
                                }}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                                title="View user details"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isMutating}
                                onClick={() => handleToggleActive(user)}
                              >
                                {user.is_active ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isMutating}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDelete(user)}
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {(hasNext || hasPrevious) && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} users
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={!hasPrevious || isLoading}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => p + 1)}
                      disabled={!hasNext || isLoading}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create user dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>
              Create a new user account (admin-only). Password is optional.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="user@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input value={formFullName} onChange={(e) => setFormFullName(e.target.value)} placeholder="Full Name" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={formRole} onValueChange={(v) => setFormRole(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VENTURE">VENTURE</SelectItem>
                  <SelectItem value="INVESTOR">INVESTOR</SelectItem>
                  <SelectItem value="MENTOR">MENTOR</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Password (optional)</Label>
              <Input
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="Leave blank to set later"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={isMutating}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isMutating}>
              {isMutating ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
