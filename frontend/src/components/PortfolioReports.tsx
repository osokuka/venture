/**
 * Portfolio Reports Component
 * Shows list of reports and documents for a portfolio company
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Eye, 
  Calendar,
  Loader2,
  FileBarChart
} from 'lucide-react';
import { productService } from '../services/productService';
import { ventureService } from '../services/ventureService';
import { validateUuid, safeDisplayText } from '../utils/security';
import { type VentureProduct } from '../types';

export function PortfolioReports() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const companyId = searchParams.get('companyId');
  const companyName = searchParams.get('company') || 'Company';

  const [product, setProduct] = useState<VentureProduct | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [isViewing, setIsViewing] = useState<string | null>(null);

  useEffect(() => {
    if (companyId) {
      // Check if it's a valid UUID
      const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId);
      if (isValidUuid) {
        fetchReports();
      } else {
        // Demo data - show message
        setIsLoading(false);
      }
    } else {
      toast.error('Company ID not provided');
      navigate('/dashboard/investor/portfolio');
    }
  }, [companyId]);

  const fetchReports = async () => {
    if (!companyId || !validateUuid(companyId)) return;
    
    setIsLoading(true);
    try {
      // Fetch product details
      const productData = await ventureService.getVentureById(companyId);
      
      if (!productData) {
        toast.error('Company not found');
        navigate('/dashboard/investor/portfolio');
        return;
      }

      setProduct(productData);
      setDocuments(productData.documents || []);
    } catch (error: any) {
      console.error('Failed to fetch reports:', error);
      toast.error(error.message || 'Failed to load reports');
      navigate('/dashboard/investor/portfolio');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (docId: string, docName: string) => {
    if (!companyId || !docId) {
      toast.error('Invalid document ID');
      return;
    }
    // Validate UUIDs
    const isValidCompanyUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId);
    const isValidDocUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(docId);
    if (!isValidCompanyUuid || !isValidDocUuid) {
      toast.error('Invalid company or document ID');
      return;
    }

    setIsDownloading(docId);
    try {
      const blob = await productService.downloadPitchDeck(companyId, docId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${docName || 'document'}-${docId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Document downloaded successfully');
    } catch (error: any) {
      console.error('Failed to download document:', error);
      if (error.response?.status === 403) {
        toast.error('You do not have permission to download this document');
      } else {
        toast.error(error.message || 'Failed to download document');
      }
    } finally {
      setIsDownloading(null);
    }
  };

  const handleView = async (docId: string) => {
    if (!companyId || !docId) {
      toast.error('Invalid document ID');
      return;
    }
    // Validate UUIDs
    const isValidCompanyUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId);
    const isValidDocUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(docId);
    if (!isValidCompanyUuid || !isValidDocUuid) {
      toast.error('Invalid company or document ID');
      return;
    }

    setIsViewing(docId);
    try {
      const blobUrl = await productService.viewPitchDeck(companyId, docId);
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
      console.error('Failed to view document:', error);
      if (error.response?.status === 403) {
        toast.error('You do not have permission to view this document');
      } else {
        toast.error(error.message || 'Failed to view document');
      }
    } finally {
      setIsViewing(null);
    }
  };

  // Check if companyId is a valid UUID
  const isValidUuid = companyId ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId) : false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show demo data message if not a valid UUID
  if (!isValidUuid && companyId) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard/investor/portfolio')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Portfolio
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{safeDisplayText(companyName)}</h1>
              <p className="text-muted-foreground">Reports & Documents</p>
            </div>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Reports & Documents</CardTitle>
            <CardDescription>This is demo data</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              This portfolio company is using demo data. To view actual reports and documents, the portfolio company needs to be linked to an actual product.
            </p>
            <p className="text-sm text-muted-foreground">
              Once the portfolio API is implemented (VL-811), this page will automatically display all available reports and documents.
            </p>
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
          <Button variant="ghost" onClick={() => navigate('/dashboard/investor/portfolio')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Portfolio
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{safeDisplayText(companyName)}</h1>
            <p className="text-muted-foreground">Reports & Documents</p>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileBarChart className="w-5 h-5" />
            <span>Available Reports</span>
          </CardTitle>
          <CardDescription>
            Financial reports, performance metrics, and strategic documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No documents available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc: any) => (
                <div 
                  key={doc.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {doc.document_type === 'PITCH_DECK' ? 'Pitch Deck' : 'Document'}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{(doc.file_size / 1024 / 1024).toFixed(2)} MB</span>
                        {doc.funding_stage && (
                          <>
                            <span>•</span>
                            <Badge variant="secondary">{doc.funding_stage.replace('_', ' ')}</Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleView(doc.id)}
                      disabled={isViewing === doc.id}
                    >
                      {isViewing === doc.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4 mr-2" />
                      )}
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(doc.id, doc.document_type === 'PITCH_DECK' ? 'pitch-deck' : 'document')}
                      disabled={isDownloading === doc.id}
                    >
                      {isDownloading === doc.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Download
                    </Button>
                    {doc.document_type === 'PITCH_DECK' && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => navigate(`/dashboard/investor/pitch-deck/${companyId}/${doc.id}`)}
                      >
                        View Details
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Custom Report */}
      <Card>
        <CardHeader>
          <CardTitle>Request Custom Report</CardTitle>
          <CardDescription>
            Need specific data or analysis? Request a custom report from the company
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline"
            onClick={() => navigate(`/dashboard/investor/messages?userId=${product?.user}&userRole=venture`)}
          >
            Contact Company
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
