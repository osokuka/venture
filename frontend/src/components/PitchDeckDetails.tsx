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
      // Fetch product details using the public venture endpoint
      // This endpoint returns the product with all documents included
      const foundProduct = await ventureService.getVentureById(productId);
      
      if (!foundProduct) {
        toast.error('Product not found');
        if (productIdOverride) {
          navigate('/dashboard/investor/portfolio');
        } else {
          navigate('/dashboard/investor/discover');
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
        navigate('/dashboard/investor/discover');
        return;
      }

      setPitchDeck(selectedPitchDeck);
    } catch (error: any) {
      console.error('Failed to fetch pitch deck details:', error);
      toast.error(error.message || 'Failed to load pitch deck details');
      if (productIdOverride) {
        navigate('/dashboard/investor/portfolio');
      } else {
        navigate('/dashboard/investor/discover');
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
                navigate('/dashboard/investor/discover');
              }
            }} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {productIdOverride ? 'Back to Portfolio' : 'Back to Discover'}
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
          <Button variant="ghost" onClick={() => navigate('/dashboard/investor/discover')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Discover
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
            <p className="text-sm whitespace-pre-wrap">{safeDisplayText(pitchDeck.problem_statement)}</p>
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
            <p className="text-sm whitespace-pre-wrap">{safeDisplayText(pitchDeck.solution_description)}</p>
          </CardContent>
        </Card>
      )}

      {/* Target Market */}
      {pitchDeck.target_market && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Target Market</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{safeDisplayText(pitchDeck.target_market)}</p>
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Funding Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pitchDeck.funding_amount && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Funding Amount</p>
                <p className="text-lg font-semibold">{safeDisplayText(pitchDeck.funding_amount)}</p>
              </div>
            )}
            {pitchDeck.funding_stage && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Funding Stage</p>
                <Badge variant="secondary">{safeDisplayText(pitchDeck.funding_stage.replace('_', ' '))}</Badge>
              </div>
            )}
            {pitchDeck.use_of_funds && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Use of Funds</p>
                <p className="text-sm whitespace-pre-wrap">{safeDisplayText(pitchDeck.use_of_funds)}</p>
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
                      onClick={() => navigate(`/dashboard/investor/pitch-deck/${productId}/${doc.id}`)}
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
