import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { 
  ArrowLeft, 
  FileText, 
  ExternalLink, 
  CheckCircle, 
  XCircle,
  Building,
  Clock,
  Download,
  Eye,
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { productService } from '../services/productService';
import type { ApprovalItem } from '../services/adminService';

/**
 * PitchDeckReview Component
 * 
 * Full-page pitch deck review interface for admin users.
 * Opens in new tab per NO_MODALS_RULE.md
 * LinkedIn-style professional design
 * 
 * Query Parameters:
 * - reviewId: ID of the ReviewRequest
 * - productId: ID of the VentureProduct
 * - productName: Name of the product
 * - userName: Name of the submitting user
 * - userEmail: Email of the submitting user
 */
export function PitchDeckReview() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [approval, setApproval] = useState<ApprovalItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const reviewId = searchParams.get('reviewId');
  const productId = searchParams.get('productId');

  // Fetch full approval details
  useEffect(() => {
    const fetchApprovalDetails = async () => {
      if (!reviewId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const approvals = await adminService.getPendingApprovals();
        const foundApproval = approvals.find((a) => a.id === reviewId);
        
        if (foundApproval) {
          setApproval(foundApproval);
        }
      } catch (error) {
        console.error('Failed to fetch approval details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApprovalDetails();
  }, [reviewId]);

  // Handle approval
  const handleApprove = async () => {
    if (!approval) return;

    try {
      setIsProcessing(true);
      await adminService.approveProfile(approval.id);
      
      alert('Pitch deck approved successfully!');
      window.close(); // Close the tab
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('Failed to approve pitch deck. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle rejection
  const handleReject = async () => {
    if (!approval || !rejectionReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }

    try {
      setIsProcessing(true);
      await adminService.rejectProfile(approval.id, rejectionReason);
      
      alert('Pitch deck rejected successfully. The venture has been notified.');
      window.close(); // Close the tab
    } catch (error) {
      console.error('Failed to reject:', error);
      alert('Failed to reject pitch deck. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle deletion
  const handleDelete = async () => {
    if (!productId) {
      alert('Product ID is missing.');
      return;
    }

    try {
      setIsProcessing(true);
      await productService.deleteProduct(productId);
      
      alert('Pitch deck and product deleted successfully!');
      window.close(); // Close the tab
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete pitch deck. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pitch deck details...</p>
        </div>
      </div>
    );
  }

  if (!approval) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pitch Deck Not Found</h2>
          <p className="text-gray-600 mb-6">The requested pitch deck could not be found.</p>
          <Button onClick={() => window.close()} variant="outline">
            Close Window
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - LinkedIn Style */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => window.close()}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Close
              </Button>
              <div className="hidden sm:block h-8 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Pitch Deck Review</h1>
                <p className="text-sm text-gray-600">Admin Dashboard</p>
              </div>
            </div>
            {!showRejectionForm && !showDeleteConfirm && (
              <div className="flex gap-2">
                <Button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  size="sm"
                  className="!bg-green-600 hover:!bg-green-700 !text-white font-semibold shadow-md hover:shadow-lg border-0"
                  style={{ backgroundColor: '#16a34a', color: '#ffffff', borderColor: '#16a34a' }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={() => setShowRejectionForm(true)}
                  disabled={isProcessing}
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isProcessing}
                  size="sm"
                  variant="outline"
                  className="text-gray-700 hover:bg-gray-100"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {showDeleteConfirm && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900">Delete Pitch Deck: {approval.product_name}</CardTitle>
              <CardDescription className="text-red-700">
                ⚠️ This is a permanent action. The pitch deck, product, and all associated data will be permanently deleted.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
                  <p className="text-sm text-red-900 font-semibold mb-2">Warning: This action cannot be undone</p>
                  <ul className="text-sm text-red-800 list-disc list-inside space-y-1">
                    <li>Product data will be permanently deleted</li>
                    <li>Uploaded pitch deck file will be removed</li>
                    <li>Team members and founders data will be deleted</li>
                    <li>The venture will need to re-submit if they want to reapply</li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleDelete}
                    disabled={isProcessing}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isProcessing ? 'Deleting...' : 'Confirm Deletion'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {showRejectionForm && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900">Reject Pitch Deck: {approval.product_name}</CardTitle>
              <CardDescription className="text-red-700">
                Please provide a detailed reason for rejection. The venture will receive this feedback.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-900 mb-2 block">
                    Rejection Reason *
                  </label>
                  <Textarea
                    placeholder="Enter detailed feedback for the venture (e.g., missing financial projections, unclear market analysis, etc.)"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={6}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleReject}
                    disabled={isProcessing || !rejectionReason.trim()}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
                  </Button>
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
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Overview - LinkedIn Style */}
            <Card className="shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-2xl font-bold text-gray-900 break-words">{approval.product_name}</CardTitle>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                        {approval.product_industry}
                      </Badge>
                      {approval.pitch_deck_funding_stage && (
                        <Badge className="bg-green-100 text-green-800 border border-green-200">
                          {approval.pitch_deck_funding_stage.replace('_', ' ')}
                        </Badge>
                      )}
                      {approval.pitch_deck_funding_amount && (
                        <Badge className="bg-purple-100 text-purple-800 border border-purple-200">
                          {approval.pitch_deck_funding_amount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {approval.product_short_description && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">About</h3>
                    <p className="text-gray-700 leading-relaxed break-words whitespace-pre-wrap">{approval.product_short_description}</p>
                  </div>
                )}
                
                <div className="flex flex-col gap-3 pt-2">
                  {approval.product_website && (
                    <a
                      href={approval.product_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 w-full sm:w-auto"
                      style={{ maxWidth: '100%', overflow: 'hidden' }}
                    >
                      <ExternalLink className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate" style={{ maxWidth: '300px' }}>Website</span>
                    </a>
                  )}
                  
                  {approval.product_linkedin_url && (
                    <a
                      href={approval.product_linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 w-full sm:w-auto"
                      style={{ maxWidth: '100%', overflow: 'hidden' }}
                    >
                      <ExternalLink className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">LinkedIn Profile</span>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pitch Deck Document */}
            {approval.pitch_deck_file_url && (
              <Card className="shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-lg">Pitch Deck Document</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 p-5 border-2 border-blue-200 rounded-lg bg-blue-50" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                    <div className="flex items-start gap-4">
                      <FileText className="w-12 h-12 text-blue-600 flex-shrink-0" />
                      <div className="flex-1" style={{ minWidth: 0, overflow: 'hidden' }}>
                        <p className="font-semibold text-gray-900 text-sm" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{approval.pitch_deck_file_name}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-2">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">Uploaded: {formatDate(approval.product_created_at || approval.submitted_at)}</span>
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => window.open(approval.pitch_deck_file_url, '_blank')}
                      className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Document
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Business Model */}
            {(approval.pitch_deck_problem_statement || 
              approval.pitch_deck_solution_description || 
              approval.pitch_deck_target_market) && (
              <Card className="shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-lg">Business Model</CardTitle>
                </CardHeader>
                <CardContent className="pt-6" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                  <div className="space-y-6">
                    {approval.pitch_deck_problem_statement && (
                      <div className="pb-6 border-b border-gray-100 last:border-0 last:pb-0" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                        <p className="text-sm font-semibold text-gray-900 mb-3">Problem Statement</p>
                        <p className="text-gray-700 leading-relaxed text-sm" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{approval.pitch_deck_problem_statement}</p>
                      </div>
                    )}
                    {approval.pitch_deck_solution_description && (
                      <div className="pb-6 border-b border-gray-100 last:border-0 last:pb-0" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                        <p className="text-sm font-semibold text-gray-900 mb-3">Solution</p>
                        <p className="text-gray-700 leading-relaxed text-sm" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{approval.pitch_deck_solution_description}</p>
                      </div>
                    )}
                    {approval.pitch_deck_target_market && (
                      <div className="pb-6 border-b border-gray-100 last:border-0 last:pb-0" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                        <p className="text-sm font-semibold text-gray-900 mb-3">Target Market</p>
                        <p className="text-gray-700 leading-relaxed text-sm" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{approval.pitch_deck_target_market}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Funding Request */}
            {(approval.pitch_deck_funding_amount || approval.pitch_deck_use_of_funds) && (
              <Card className="shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-lg">Funding Request</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                  {approval.pitch_deck_funding_amount && (
                    <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-200" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                      <p className="text-sm font-medium text-green-800 mb-2">Investment Size</p>
                      <p className="text-4xl font-bold text-green-700" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                        {approval.pitch_deck_funding_amount}
                      </p>
                    </div>
                  )}
                  {approval.pitch_deck_use_of_funds && (
                    <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
                      <p className="text-sm font-semibold text-gray-900 mb-3">Use of Funds</p>
                      <p className="text-gray-700 leading-relaxed bg-gray-50 p-5 rounded-lg border border-gray-200 text-sm" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>
                        {approval.pitch_deck_use_of_funds}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Traction Metrics */}
            {approval.pitch_deck_traction_metrics && (
              <Card className="shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-lg">Traction Metrics</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {typeof approval.pitch_deck_traction_metrics === 'object' && 
                      Object.entries(approval.pitch_deck_traction_metrics).map(([key, value]) => (
                        <div key={key} className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border-2 border-purple-200 text-center">
                          <p className="text-xs font-medium text-purple-900 uppercase mb-2 break-words">{key.replace('_', ' ')}</p>
                          <p className="text-2xl font-bold text-purple-700 break-words">{String(value)}</p>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Submitter Info */}
            <Card className="shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg">Submitted By</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <Building className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 break-words">{approval.user_name}</p>
                    <p className="text-sm text-gray-600 break-all">{approval.user_email}</p>
                    <Badge className="mt-3 bg-blue-100 text-blue-800 border border-blue-200">{approval.role}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {approval.product_created_at && (
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Clock className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">Created</p>
                        <p className="text-xs text-gray-600 break-words">{formatDate(approval.product_created_at)}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">Submitted for Review</p>
                      <p className="text-xs text-gray-600 break-words">{formatDate(approval.submitted_at)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            {!showRejectionForm && !showDeleteConfirm && (
              <Card className="shadow-sm border-2 border-green-300 bg-white">
                <CardContent className="p-5">
                  <p className="text-sm text-gray-700 font-medium mb-4">
                    Review all information carefully before making a decision.
                  </p>
                  <div className="space-y-3">
                    <Button
                      onClick={handleApprove}
                      disabled={isProcessing}
                      className="w-full !bg-green-600 hover:!bg-green-700 !text-white font-bold shadow-lg hover:shadow-xl text-base py-6 relative z-10"
                      style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      ✓ Approve Pitch Deck
                    </Button>
                    <Button
                      onClick={() => setShowRejectionForm(true)}
                      disabled={isProcessing}
                      variant="outline"
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject with Feedback
                    </Button>
                    <Button
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isProcessing}
                      variant="outline"
                      className="w-full text-gray-700 hover:text-gray-900 hover:bg-gray-100 border-gray-300"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Delete Pitch Deck
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
