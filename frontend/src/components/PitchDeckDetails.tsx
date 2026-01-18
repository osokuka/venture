/**
 * Pitch Deck Details Component
 * Displays comprehensive pitch deck information for investors
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Eye, 
  Building, 
  Globe, 
  MapPin, 
  Users, 
  Calendar,
  DollarSign,
  TrendingUp,
  Target,
  Lightbulb,
  BarChart3,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { productService } from '../services/productService';
import { ventureService } from '../services/ventureService';
import { safeDisplayText, validateUuid } from '../utils/security';
import { type VentureProduct } from '../types';

interface PitchDeckDocument {
  id: string;
  document_type: string;
  file: string;
  file_size: number;
  mime_type: string;
  problem_statement?: string;
  solution_description?: string;
  target_market?: string;
  traction_metrics?: any;
  funding_amount?: string;
  funding_stage?: string;
  use_of_funds?: string;
  uploaded_at: string;
}

interface PitchDeckDetailsProps {
  productIdOverride?: string;
}

export function PitchDeckDetails({ productIdOverride }: PitchDeckDetailsProps = {}) {
  const { productId: productIdParam, docId } = useParams<{ productId: string; docId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Use override if provided (for portfolio details), otherwise use URL param
  const productId = productIdOverride || productIdParam;
  
  // Detect user type from URL path
  const isVentureView = window.location.pathname.includes('/dashboard/venture/');
  
  const [product, setProduct] = useState<VentureProduct | null>(null);
  const [pitchDeck, setPitchDeck] = useState<PitchDeckDocument | null>(null);
  const [allDocuments, setAllDocuments] = useState<PitchDeckDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isViewing, setIsViewing] = useState(false);

  useEffect(() => {
    if (productId && validateUuid(productId)) {
      fetchPitchDeckDetails();
    } else if (!productId) {
      toast.error('Invalid product ID');
      if (productIdOverride) {
        navigate('/dashboard/investor/portfolio');
      } else {
        navigate('/dashboard/investor/discover');
      }
    }
  }, [productId, docId, productIdOverride]);

  const fetchPitchDeckDetails = async () => {
    if (!productId || !validateUuid(productId)) return;
    
    setIsLoading(true);
    try {
      // Fetch product details
      // For venture view, use their own products; for investor view, use public endpoint
      let foundProduct;
      if (isVentureView) {
        foundProduct = await productService.getProduct(productId);
      } else {
        foundProduct = await ventureService.getVentureById(productId);
      }
      
      if (!foundProduct) {
        toast.error('Product not found');
        const backPath = isVentureView ? '/dashboard/venture/pitch' : '/dashboard/investor/discover';
        if (productIdOverride) {
          navigate('/dashboard/investor/portfolio');
        } else {
          navigate(backPath);
        }
        return;
      }

      setProduct(foundProduct);

      // Find pitch deck document
      const documents = foundProduct.documents || [];
      setAllDocuments(documents);
      
      let selectedPitchDeck: PitchDeckDocument | null = null;
      
      if (docId && validateUuid(docId)) {
        // Use specified document ID
        selectedPitchDeck = documents.find((doc: any) => doc.id === docId && doc.document_type === 'PITCH_DECK') || null;
      } else {
        // Use first pitch deck if no docId specified
        selectedPitchDeck = documents.find((doc: any) => doc.document_type === 'PITCH_DECK') || null;
      }

      if (!selectedPitchDeck) {
        toast.error('Pitch deck not found');
        const backPath = isVentureView ? '/dashboard/venture/pitch' : '/dashboard/investor/discover';
        navigate(backPath);
        return;
      }

      setPitchDeck(selectedPitchDeck);
    } catch (error: any) {
      console.error('Failed to fetch pitch deck details:', error);
      toast.error(error.message || 'Failed to load pitch deck details');
      const backPath = isVentureView ? '/dashboard/venture/pitch' : '/dashboard/investor/discover';
      if (productIdOverride) {
        navigate('/dashboard/investor/portfolio');
      } else {
        navigate(backPath);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!productId || !pitchDeck || !validateUuid(productId) || !validateUuid(pitchDeck.id)) {
      toast.error('Invalid product or document ID');
      return;
    }

    setIsDownloading(true);
    try {
      const blob = await productService.downloadPitchDeck(productId, pitchDeck.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${product?.name || 'pitch-deck'}-${pitchDeck.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Pitch deck downloaded successfully');
    } catch (error: any) {
      console.error('Failed to download pitch deck:', error);
      if (error.response?.status === 403) {
        toast.error('You do not have permission to download this pitch deck');
      } else {
        toast.error(error.message || 'Failed to download pitch deck');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleView = async () => {
    if (!productId || !pitchDeck || !validateUuid(productId) || !validateUuid(pitchDeck.id)) {
      toast.error('Invalid product or document ID');
      return;
    }

    setIsViewing(true);
    try {
      const blobUrl = await productService.viewPitchDeck(productId, pitchDeck.id);
      const newWindow = window.open(blobUrl, '_blank', 'noopener,noreferrer');
      
      if (newWindow) {
        const cleanup = () => URL.revokeObjectURL(blobUrl);
        const checkClosed = setInterval(() => {
          if (newWindow.closed) {
            cleanup();
            clearInterval(checkClosed);
          }
        }, 1000);
        setTimeout(() => {
          cleanup();
          clearInterval(checkClosed);
        }, 3600000);
      } else {
        URL.revokeObjectURL(blobUrl);
      }
    } catch (error: any) {
      console.error('Failed to view pitch deck:', error);
      if (error.response?.status === 403) {
        toast.error('You do not have permission to view this pitch deck');
      } else {
        toast.error(error.message || 'Failed to view pitch deck');
      }
    } finally {
      setIsViewing(false);
    }
  };

  const formatTractionMetrics = (metrics: any): JSX.Element[] => {
    if (!metrics) return [];
    
    let parsedMetrics = metrics;
    if (typeof metrics === 'string') {
      try {
        parsedMetrics = JSON.parse(metrics);
      } catch {
        return [<p key="error" className="text-sm text-muted-foreground">{safeDisplayText(metrics)}</p>];
      }
    }
    
    if (typeof parsedMetrics === 'object' && parsedMetrics !== null) {
      return Object.entries(parsedMetrics).map(([key, value], index) => {
        const formattedKey = key
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        return (
          <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
            <span className="text-sm font-medium text-muted-foreground">{formattedKey}:</span>
            <span className="text-sm font-semibold">{safeDisplayText(String(value))}</span>
          </div>
        );
      });
    }
    
    return [<p key="single" className="text-sm text-muted-foreground">{safeDisplayText(String(metrics))}</p>];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product || !pitchDeck) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Pitch deck not found</p>
            <Button onClick={() => {
              if (productIdOverride) {
                navigate('/dashboard/investor/portfolio');
              } else {
                const backPath = isVentureView ? '/dashboard/venture/pitch' : '/dashboard/investor/discover';
                navigate(backPath);
              }
            }} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {productIdOverride ? 'Back to Portfolio' : isVentureView ? 'Back to My Pitch Decks' : 'Back to Discover'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => {
            const backPath = isVentureView ? '/dashboard/venture/pitch' : '/dashboard/investor/discover';
            navigate(backPath);
          }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {isVentureView ? 'Back to My Pitch Decks' : 'Back to Discover'}
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{safeDisplayText(product.name)}</h1>
            <p className="text-muted-foreground">{safeDisplayText(product.industry_sector)}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleView} disabled={isViewing}>
            {isViewing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Eye className="w-4 h-4 mr-2" />
            )}
            View PDF
          </Button>
          <Button onClick={handleDownload} disabled={isDownloading} variant="outline">
            {isDownloading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Download
          </Button>
        </div>
      </div>

      {/* Creator & Status Information */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-700" />
            <span>Submission Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Creator Info */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-xs font-semibold text-gray-600 mb-2">Created By</p>
              <p className="text-sm font-semibold text-gray-900">{safeDisplayText((product as any).user_name || 'N/A')}</p>
              <p className="text-xs text-gray-600 mt-1">{safeDisplayText((product as any).user_email || 'N/A')}</p>
            </div>

            {/* Status */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-xs font-semibold text-gray-600 mb-2">Status</p>
              <Badge 
                variant={
                  product.status === 'APPROVED' ? 'default' : 
                  product.status === 'SUBMITTED' ? 'secondary' : 
                  product.status === 'REJECTED' ? 'destructive' : 
                  'outline'
                }
                className="text-sm"
              >
                {product.status}
              </Badge>
              <p className="text-xs text-gray-600 mt-2">
                Active: {product.is_active ? 'Yes' : 'No'}
              </p>
            </div>

            {/* Timeline */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-xs font-semibold text-gray-600 mb-2">Timeline</p>
              <div className="space-y-1">
                <div className="flex items-center text-xs text-gray-600">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span>Created: {new Date(product.created_at).toLocaleDateString()}</span>
                </div>
                {(product as any).submitted_at && (
                  <div className="flex items-center text-xs text-gray-600">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>Submitted: {new Date((product as any).submitted_at).toLocaleDateString()}</span>
                  </div>
                )}
                {(product as any).approved_at && (
                  <div className="flex items-center text-xs text-green-700 font-semibold">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>Approved: {new Date((product as any).approved_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5" />
            <span>Company Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Description</p>
              <p className="text-sm">{safeDisplayText(product.short_description)}</p>
            </div>
            {product.website && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Website</p>
                <a 
                  href={product.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center space-x-1"
                >
                  <span>{safeDisplayText(product.website)}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
            {(product as any).linkedin_url && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">LinkedIn</p>
                <a 
                  href={(product as any).linkedin_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center space-x-1"
                >
                  <span>{safeDisplayText((product as any).linkedin_url)}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
            {product.address && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Location</p>
                <p className="text-sm flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>{safeDisplayText(product.address)}</span>
                </p>
              </div>
            )}
            {product.employees_count && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Team Size</p>
                <p className="text-sm flex items-center space-x-1">
                  <Users className="w-3 h-3" />
                  <span>{product.employees_count} employees</span>
                </p>
              </div>
            )}
            {product.year_founded && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Founded</p>
                <p className="text-sm flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{product.year_founded}</span>
                </p>
              </div>
            )}
            {(product as any).industry_sector && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Industry</p>
                <Badge variant="secondary">{safeDisplayText((product as any).industry_sector)}</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pitch Deck Document Info */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-700" />
            <span>Pitch Deck Document</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">Document Type</p>
              <p className="text-sm font-medium">{pitchDeck.document_type}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">File Size</p>
              <p className="text-sm font-medium">{(pitchDeck.file_size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">Uploaded</p>
              <p className="text-sm font-medium">{new Date(pitchDeck.uploaded_at).toLocaleString()}</p>
            </div>
            {(pitchDeck as any).updated_at && (
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">Last Updated</p>
                <p className="text-sm font-medium">{new Date((pitchDeck as any).updated_at).toLocaleString()}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Problem Statement */}
      {pitchDeck.problem_statement && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Problem Statement</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{safeDisplayText(pitchDeck.problem_statement)}</p>
          </CardContent>
        </Card>
      )}

      {/* Solution */}
      {pitchDeck.solution_description && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="w-5 h-5" />
              <span>Solution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{safeDisplayText(pitchDeck.solution_description)}</p>
          </CardContent>
        </Card>
      )}

      {/* Target Market */}
      {pitchDeck.target_market && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Target Market</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{safeDisplayText(pitchDeck.target_market)}</p>
          </CardContent>
        </Card>
      )}

      {/* Traction Metrics */}
      {pitchDeck.traction_metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Traction & Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {formatTractionMetrics(pitchDeck.traction_metrics)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Funding Details */}
      {(pitchDeck.funding_amount || pitchDeck.funding_stage || pitchDeck.use_of_funds) && (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-700" />
              <span>Funding Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pitchDeck.funding_amount && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Funding Amount Sought</p>
                  <p className="text-2xl font-bold text-green-700">{safeDisplayText(pitchDeck.funding_amount)}</p>
                </div>
              )}
              {pitchDeck.funding_stage && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Funding Stage</p>
                  <Badge variant="secondary" className="text-sm font-semibold">
                    {safeDisplayText(pitchDeck.funding_stage.replace(/_/g, ' '))}
                  </Badge>
                </div>
              )}
            </div>
            {pitchDeck.use_of_funds && (
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-xs font-semibold text-gray-600 mb-2">Use of Funds</p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{safeDisplayText(pitchDeck.use_of_funds)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Other Documents */}
      {allDocuments.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Other Documents</span>
            </CardTitle>
            <CardDescription>Additional documents available for this venture</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allDocuments
                .filter((doc: any) => doc.id !== pitchDeck.id)
                .map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {doc.document_type === 'PITCH_DECK' ? 'Pitch Deck' : 'Document'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(doc.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const basePath = isVentureView ? '/dashboard/venture' : '/dashboard/investor';
                        navigate(`${basePath}/pitch-deck/${productId}/${doc.id}`);
                      }}
                    >
                      View
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
