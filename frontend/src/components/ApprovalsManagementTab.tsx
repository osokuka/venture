/**
 * Approvals Management Tab Component
 * Handles approval workflow for venture, investor, and mentor profiles
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  CheckCircle,
  XCircle,
  Clock,
  Building,
  TrendingUp,
  UserCheck,
  Search,
  Filter,
  AlertCircle,
} from 'lucide-react';
import { adminService, type ApprovalItem, type AdminStats } from '../services/adminService';
import { Alert, AlertDescription } from './ui/alert';

interface ApprovalsManagementTabProps {
  stats: AdminStats;
}

export function ApprovalsManagementTab({ stats }: ApprovalsManagementTabProps) {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'ALL' | 'VENTURE' | 'INVESTOR' | 'MENTOR'>('ALL');
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch pending approvals
  useEffect(() => {
    const fetchApprovals = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await adminService.getPendingApprovals();
        setApprovals(data);
      } catch (err) {
        console.error('Failed to fetch approvals:', err);
        setError('Failed to load pending approvals. Please try again.');
        setApprovals([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApprovals();
  }, []);

  // Filter approvals based on search and role filter
  const filteredApprovals = approvals.filter((approval) => {
    const matchesSearch =
      approval.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      approval.user_email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'ALL' || approval.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Handle approval
  const handleApprove = async (approvalId: string) => {
    if (!confirm('Are you sure you want to approve this profile?')) {
      return;
    }

    try {
      setIsProcessing(true);
      await adminService.approveProfile(approvalId);
      
      // Remove from list
      setApprovals(approvals.filter((a) => a.id !== approvalId));
      
      // Update stats
      stats.pendingApprovals = Math.max(0, stats.pendingApprovals - 1);
      stats.approvedProfiles += 1;
      
      alert('Profile approved successfully!');
    } catch (err) {
      console.error('Failed to approve profile:', err);
      alert('Failed to approve profile. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle rejection
  const handleReject = async () => {
    if (!selectedApproval) return;
    
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }

    try {
      setIsProcessing(true);
      await adminService.rejectProfile(selectedApproval.id, rejectionReason);
      
      // Remove from list
      setApprovals(approvals.filter((a) => a.id !== selectedApproval.id));
      
      // Update stats
      stats.pendingApprovals = Math.max(0, stats.pendingApprovals - 1);
      stats.rejectedProfiles += 1;
      
      // Reset dialog
      setRejectDialogOpen(false);
      setSelectedApproval(null);
      setRejectionReason('');
      
      alert('Profile rejected successfully!');
    } catch (err) {
      console.error('Failed to reject profile:', err);
      alert('Failed to reject profile. Please try again.');
    } finally {
      setIsProcessing(false);
    }
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
      default:
        return UserCheck;
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
          <CardDescription>
            Review and approve or reject profile submissions ({filteredApprovals.length} pending)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {(['ALL', 'VENTURE', 'INVESTOR', 'MENTOR'] as const).map((role) => (
                <Button
                  key={role}
                  variant={filterRole === role ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterRole(role)}
                >
                  {role === 'ALL' ? 'All' : role.charAt(0) + role.slice(1).toLowerCase()}
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
          ) : filteredApprovals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No pending approvals</p>
              <p className="text-sm mt-2">
                {searchQuery || filterRole !== 'ALL'
                  ? 'Try adjusting your search or filters'
                  : 'All profiles have been reviewed'}
              </p>
            </div>
          ) : (
            /* Approvals List */
            <div className="space-y-4">
              {filteredApprovals.map((approval) => {
                const RoleIcon = getRoleIcon(approval.role);
                return (
                  <Card key={approval.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-lg ${getRoleBadgeColor(approval.role)}`}>
                              <RoleIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{approval.user_name}</h3>
                              <p className="text-sm text-gray-600">{approval.user_email}</p>
                            </div>
                            <Badge className={getRoleBadgeColor(approval.role)}>
                              {approval.role}
                            </Badge>
                          </div>
                          <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>Submitted: {formatDate(approval.submitted_at)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(approval.id)}
                            disabled={isProcessing}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedApproval(approval);
                              setRejectDialogOpen(true);
                            }}
                            disabled={isProcessing}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Profile</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {selectedApproval?.user_name}'s profile.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Rejection Reason *
              </label>
              <Textarea
                placeholder="Enter the reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason('');
                setSelectedApproval(null);
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={isProcessing || !rejectionReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? 'Rejecting...' : 'Reject Profile'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
