import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  TrendingUp,
  UserCheck,
  Phone,
  Mail,
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { investorService } from '../services/investorService';
import { mentorService } from '../services/mentorService';
import type { ApprovalItem } from '../services/adminService';

/**
 * AdminProfileReview Component
 *
 * Full-page investor/mentor profile review interface for admin users.
 * Opens in new tab per NO_MODALS_RULE.md (launched via window.open).
 *
 * Query Parameters:
 * - reviewId: ID of the ReviewRequest
 */
export function AdminProfileReview() {
  const [searchParams] = useSearchParams();
  const [approval, setApproval] = useState<ApprovalItem | null>(null);
  const [profileDetails, setProfileDetails] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const reviewId = searchParams.get('reviewId');

  const isInvestor = approval?.profile_type === 'INVESTOR' || approval?.role === 'INVESTOR';
  const isMentor = approval?.profile_type === 'MENTOR' || approval?.role === 'MENTOR';

  const headerIcon = useMemo(() => {
    if (isInvestor) return TrendingUp;
    if (isMentor) return UserCheck;
    return UserCheck;
  }, [isInvestor, isMentor]);

  // Fetch review details (single item, not the whole pending list)
  useEffect(() => {
    const fetchReview = async () => {
      if (!reviewId) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const data = await adminService.getReviewDetail(reviewId);
        setApproval(data);
      } catch (error) {
        console.error('Failed to fetch profile review details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReview();
  }, [reviewId]);

  // Fetch full profile details when we know the profile id and type
  useEffect(() => {
    const fetchProfile = async () => {
      if (!approval?.profile_id || !(isInvestor || isMentor)) {
        setProfileDetails(null);
        setProfileError(null);
        return;
      }
      try {
        setProfileError(null);
        if (isInvestor) {
          const data = await investorService.getInvestorById(approval.profile_id);
          setProfileDetails(data);
        } else if (isMentor) {
          const data = await mentorService.getMentorById(approval.profile_id);
          setProfileDetails(data);
        }
      } catch (err: any) {
        console.error('Failed to fetch profile details:', err);
        setProfileError(err?.message || 'Failed to load profile details.');
        setProfileDetails(null);
      }
    };

    fetchProfile();
  }, [approval, isInvestor, isMentor]);

  const handleApprove = async () => {
    if (!approval) return;
    try {
      setIsProcessing(true);
      await adminService.approveProfile(approval.id);
      alert('Profile approved successfully!');
      window.close();
    } catch (error) {
      console.error('Failed to approve profile:', error);
      alert('Failed to approve profile. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!approval) return;
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }
    try {
      setIsProcessing(true);
      await adminService.rejectProfile(approval.id, rejectionReason);
      alert('Profile rejected successfully. The user has been notified.');
      window.close();
    } catch (error) {
      console.error('Failed to reject profile:', error);
      alert('Failed to reject profile. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const renderProfileDetails = () => {
    const detail = profileDetails;
    const fallback = approval;

    if (isInvestor) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Full name</div>
            <div className="font-medium text-gray-900">{detail?.full_name || fallback?.profile_full_name || '—'}</div>
          </div>
          <div>
            <div className="text-gray-500">Organization</div>
            <div className="font-medium text-gray-900">{detail?.organization_name || fallback?.investor_organization_name || '—'}</div>
          </div>
          <div>
            <div className="text-gray-500">LinkedIn / Website</div>
            {detail?.linkedin_or_website || fallback?.profile_linkedin_or_website ? (
              <a
                className="inline-flex items-center gap-2 font-medium text-blue-700 hover:underline"
                href={detail?.linkedin_or_website || fallback?.profile_linkedin_or_website}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4" />
                {detail?.linkedin_or_website || fallback?.profile_linkedin_or_website}
              </a>
            ) : (
              <div className="font-medium text-gray-900">—</div>
            )}
          </div>
          <div>
            <div className="text-gray-500">Email</div>
            <div className="font-medium text-gray-900">{detail?.email || fallback?.investor_email || fallback?.user_email || '—'}</div>
          </div>
          <div>
            <div className="text-gray-500">Phone</div>
            <div className="flex items-center gap-2 font-medium text-gray-900">
              <Phone className="w-4 h-4 text-gray-400" />
              {detail?.phone || fallback?.profile_phone || '—'}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Experience (years)</div>
            <div className="font-medium text-gray-900">
              {detail?.investment_experience_years ?? fallback?.investor_investment_experience_years ?? '—'}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Deals count</div>
            <div className="font-medium text-gray-900">
              {detail?.deals_count ?? fallback?.investor_deals_count ?? '—'}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Average ticket size</div>
            <div className="font-medium text-gray-900">
              {detail?.average_ticket_size || fallback?.investor_average_ticket_size || '—'}
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="text-gray-500">Stage preferences</div>
            <div className="font-medium text-gray-900">
              {(detail?.stage_preferences || fallback?.investor_stage_preferences || []).join(', ') || '—'}
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="text-gray-500">Industry preferences</div>
            <div className="font-medium text-gray-900">
              {(detail?.industry_preferences || fallback?.investor_industry_preferences || []).join(', ') || '—'}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Visible to ventures</div>
            <div className="font-medium text-gray-900">
              {detail?.visible_to_ventures ?? fallback?.profile_visible_to_ventures ?? '—' ? 'Yes' : 'No'}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Profile submitted at</div>
            <div className="font-medium text-gray-900">{formatDate(detail?.submitted_at || fallback?.profile_submitted_at)}</div>
          </div>
          <div>
            <div className="text-gray-500">Profile approved at</div>
            <div className="font-medium text-gray-900">{formatDate(detail?.approved_at || fallback?.profile_approved_at)}</div>
          </div>
        </div>
      );
    }

    if (isMentor) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Full name</div>
            <div className="font-medium text-gray-900">{detail?.full_name || fallback?.profile_full_name || '—'}</div>
          </div>
          <div>
            <div className="text-gray-500">Job title</div>
            <div className="font-medium text-gray-900">{detail?.job_title || fallback?.mentor_job_title || '—'}</div>
          </div>
          <div>
            <div className="text-gray-500">Company</div>
            <div className="font-medium text-gray-900">{detail?.company || fallback?.mentor_company || '—'}</div>
          </div>
          <div>
            <div className="text-gray-500">LinkedIn / Website</div>
            {detail?.linkedin_or_website || fallback?.profile_linkedin_or_website ? (
              <a
                className="inline-flex items-center gap-2 font-medium text-blue-700 hover:underline"
                href={detail?.linkedin_or_website || fallback?.profile_linkedin_or_website}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4" />
                {detail?.linkedin_or_website || fallback?.profile_linkedin_or_website}
              </a>
            ) : (
              <div className="font-medium text-gray-900">—</div>
            )}
          </div>
          <div>
            <div className="text-gray-500">Contact email</div>
            <div className="font-medium text-gray-900">{detail?.contact_email || fallback?.mentor_contact_email || fallback?.user_email || '—'}</div>
          </div>
          <div>
            <div className="text-gray-500">Phone</div>
            <div className="flex items-center gap-2 font-medium text-gray-900">
              <Phone className="w-4 h-4 text-gray-400" />
              {detail?.phone || fallback?.profile_phone || '—'}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Engagement type</div>
            <div className="font-medium text-gray-900">{detail?.engagement_type || fallback?.mentor_engagement_type || '—'}</div>
          </div>
          <div>
            <div className="text-gray-500">Paid rate</div>
            <div className="font-medium text-gray-900">
              {detail?.paid_rate_amount
                ? `${detail.paid_rate_amount} (${detail.paid_rate_type || 'rate'})`
                : fallback?.mentor_paid_rate_amount
                  ? `${fallback.mentor_paid_rate_amount} (${fallback.mentor_paid_rate_type || 'rate'})`
                  : '—'}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Preferred engagement</div>
            <div className="font-medium text-gray-900">{detail?.preferred_engagement || fallback?.mentor_preferred_engagement || '—'}</div>
          </div>
          <div className="md:col-span-2">
            <div className="text-gray-500">Expertise fields</div>
            <div className="font-medium text-gray-900">
              {(detail?.expertise_fields || fallback?.mentor_expertise_fields || []).join(', ') || '—'}
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="text-gray-500">Industries of interest</div>
            <div className="font-medium text-gray-900">
              {(detail?.industries_of_interest || fallback?.mentor_industries_of_interest || []).join(', ') || '—'}
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="text-gray-500">Experience overview</div>
            <div className="font-medium text-gray-900 whitespace-pre-wrap">
              {detail?.experience_overview || fallback?.mentor_experience_overview || '—'}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Visible to ventures</div>
            <div className="font-medium text-gray-900">
              {detail?.visible_to_ventures ?? fallback?.profile_visible_to_ventures ?? '—' ? 'Yes' : 'No'}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Profile submitted at</div>
            <div className="font-medium text-gray-900">{formatDate(detail?.submitted_at || fallback?.profile_submitted_at)}</div>
          </div>
          <div>
            <div className="text-gray-500">Profile approved at</div>
            <div className="font-medium text-gray-900">{formatDate(detail?.approved_at || fallback?.profile_approved_at)}</div>
          </div>
        </div>
      );
    }

    return (
      <div className="text-sm text-gray-700">
        No profile details available for this item.
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!reviewId) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Missing reviewId</CardTitle>
            <CardDescription>This page must be opened with a `reviewId` query parameter.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!approval) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Review not found</CardTitle>
            <CardDescription>Could not load review details. Please refresh or try again.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const Icon = headerIcon;
  const title = isInvestor ? 'Investor Profile Review' : isMentor ? 'Mentor Profile Review' : 'Profile Review';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="w-7 h-7 text-gray-800" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <p className="text-sm text-gray-600">Review ID: {approval.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => window.close()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Close Tab
            </Button>
            <Button
              variant="outline"
              onClick={handleApprove}
              disabled={isProcessing}
              className="text-green-700 hover:bg-green-50 border-green-200"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowRejectionForm((v) => !v)}
              disabled={isProcessing}
              className="text-red-700 hover:bg-red-50 border-red-200"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
          </div>
        </div>

        {/* Submitted by */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Submitted By</span>
              <Badge variant="outline">{approval.role}</Badge>
            </CardTitle>
            <CardDescription>Account info (not pitch deck approvals)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="font-medium">{approval.user_name}</span>
              <span className="text-gray-500">({approval.user_email})</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>Submitted: {formatDate(approval.submitted_at)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Profile details */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>These fields are used for investor/mentor approvals (separate from pitch deck reviews).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profileError && (
              <div className="text-sm text-red-600">{profileError}</div>
            )}
            {renderProfileDetails()}
          </CardContent>
        </Card>

        {/* Rejection form */}
        {showRejectionForm && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-700">Reject Profile</CardTitle>
              <CardDescription>Please provide a clear reason. The user will receive this feedback.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Enter rejection reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={5}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectionForm(false);
                    setRejectionReason('');
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
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

