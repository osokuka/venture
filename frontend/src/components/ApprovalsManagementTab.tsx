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
  FileText,
  ExternalLink,
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
        // Fetch server-filtered approvals when a role filter is selected
        const typeParam =
          filterRole === 'ALL' ? undefined : (filterRole as 'VENTURE' | 'INVESTOR' | 'MENTOR');
        const data = await adminService.getPendingApprovals(typeParam ? { type: typeParam } : undefined);
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
  }, [filterRole]);

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
                const isPitchDeck = approval.product_id && approval.product_name;
                
                // Handle pitch deck approval - prominent display per user request
                if (isPitchDeck) {
                  const openPitchDeckDetails = () => {
                    const params = new URLSearchParams({
                      reviewId: approval.id,
                      productId: approval.product_id!,
                      productName: approval.product_name!,
                      userName: approval.user_name,
                      userEmail: approval.user_email,
                    });
                    // Open in new tab per NO_MODALS_RULE.md
                    window.open(`/dashboard/admin/pitch-deck-review?${params.toString()}`, '_blank', 'noopener,noreferrer');
                  };

                  return (
                    <Card key={approval.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                      <CardContent className="p-6">
                        {/* PITCH DECK NAME - PROMINENT */}
                        <div className="flex items-center gap-3 mb-3">
                          <FileText className="w-6 h-6 text-blue-600" />
                          <h2 className="text-2xl font-bold text-gray-900">{approval.product_name}</h2>
                          <Badge className="bg-blue-100 text-blue-800">
                            {approval.product_industry}
                          </Badge>
                        </div>
                        
                        {/* FUNDING INFO */}
                        {(approval.pitch_deck_funding_amount || approval.pitch_deck_funding_stage) && (
                          <div className="flex gap-4 text-sm text-gray-600 mb-3">
                            {approval.pitch_deck_funding_amount && (
                              <span className="font-medium">💰 {approval.pitch_deck_funding_amount}</span>
                            )}
                            {approval.pitch_deck_funding_stage && (
                              <span className="font-medium">📈 {approval.pitch_deck_funding_stage.replace('_', ' ')}</span>
                            )}
                          </div>
                        )}
                        
                        {/* BRIEF PROBLEM STATEMENT */}
                        {approval.pitch_deck_problem_statement && (
                          <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                            <span className="font-medium text-gray-900">Problem:</span> {approval.pitch_deck_problem_statement}
                          </p>
                        )}
                        
                        {/* USER INFO - UNDERNEATH */}
                        <div className="border-t pt-3 mb-4">
                          <p className="text-xs text-gray-500 mb-2">Submitted by:</p>
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-sm">{approval.user_name}</span>
                            <span className="text-sm text-gray-500">({approval.user_email})</span>
                          </div>
                        </div>
                        
                        {/* DATES */}
                        <div className="flex gap-4 text-xs text-gray-500 mb-4">
                          {approval.product_created_at && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Created: {formatDate(approval.product_created_at)}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Submitted: {formatDate(approval.submitted_at)}</span>
                          </div>
                        </div>
                        
                        {/* ACTIONS */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={openPitchDeckDetails}
                            disabled={isProcessing}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Details in New Tab
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(approval.id)}
                            disabled={isProcessing}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
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
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
                
                // Fallback for profile approvals
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
                            onClick={() => {
                              const params = new URLSearchParams({ reviewId: approval.id });
                              window.open(`/dashboard/admin/profile-review?${params.toString()}`, '_blank', 'noopener,noreferrer');
                            }}
                            disabled={isProcessing}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Details in New Tab
                          </Button>
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
            <DialogTitle>
              Reject {selectedApproval?.product_name ? `Pitch Deck: ${selectedApproval.product_name}` : `Profile: ${selectedApproval?.user_name}`}
            </DialogTitle>
            <DialogDescription>
              Please provide a detailed reason for rejection. {selectedApproval?.product_name ? 'The venture' : selectedApproval?.user_name} will receive this feedback.
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
