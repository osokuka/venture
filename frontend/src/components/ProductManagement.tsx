/**
 * Product Management Component
 * Handles CRUD operations for venture products (max 3 per user)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
// NO MODALS - All forms displayed inline per NO_MODALS_RULE.md
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Building,
  PlusCircle,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Power,
  PowerOff,
  Send,
  Settings,
  FileText,
  Upload,
  X,
  Users,
  UserPlus,
  Download,
} from 'lucide-react';
import { 
  productService, 
  type VentureProduct, 
  type ProductCreatePayload,
} from '../services/productService';
import { Alert, AlertDescription } from './ui/alert';
import { Label } from './ui/label';
import { 
  sanitizeInput, 
  validateAndSanitizeUrl, 
  validateFileType, 
  validateFileSize,
  sanitizeFormData,
  validateUuid,
  sanitizeForDisplay
} from '../utils/security';
import { validatePitchDeckFile } from '../utils/fileValidation';
import { toast } from 'sonner';
import { PitchDeckCRUD } from './PitchDeckCRUD';

interface ProductManagementProps {
  user: any;
  defaultTab?: 'company' | 'documents';
  autoOpenProductId?: string; // If provided, auto-open manage dialog for this product
}

export function ProductManagement({ user, defaultTab = 'company', autoOpenProductId }: ProductManagementProps) {
  const navigate = useNavigate(); // Initialize navigate hook
  const [products, setProducts] = useState<VentureProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Inline display state (no modals per NO_MODALS_RULE.md)
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<VentureProduct | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [activeTab, setActiveTab] = useState<'company' | 'documents'>(defaultTab);
  
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  // Pitch deck analytics, access, sharing state
  const [pitchDeckAnalytics, setPitchDeckAnalytics] = useState<any>(null);
  const [pitchDeckAccess, setPitchDeckAccess] = useState<any[]>([]);
  const [pitchDeckShares, setPitchDeckShares] = useState<any[]>([]);
  const [pitchDeckRequests, setPitchDeckRequests] = useState<any[]>([]);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [showShareForm, setShowShareForm] = useState(false);
  const [shareInvestorId, setShareInvestorId] = useState('');
  const [shareMessage, setShareMessage] = useState('');

  // Form state for create/edit
  // Note: problem_statement, solution_description, target_market, traction_metrics,
  // funding_amount, funding_stage, and use_of_funds are now associated with
  // each pitch deck document, not the product itself
  const [formData, setFormData] = useState<any>({
    name: '',
    industry_sector: '',
    website: '',
    linkedin_url: '',
    address: '',
    year_founded: undefined,
    employees_count: undefined,
    short_description: '',
    problem_statement: '',
    solution_description: '',
    target_market: '',
    traction_metrics: '',
    funding_amount: '',
    funding_stage: '',
    use_of_funds: '',
  });
  
  // State for traction metrics as array of key-value pairs
  const [tractionMetricsFields, setTractionMetricsFields] = useState<Array<{key: string, value: string}>>([]);

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, []);

  // Auto-open manage dialog for specified product when products are loaded
  useEffect(() => {
    if (autoOpenProductId && products.length > 0 && !isLoading) {
      // Auto-open removed - simplified UI
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenProductId, products, isLoading]);

  // Load pitch deck data when document is selected for analytics
  useEffect(() => {
    if (selectedDocumentId && selectedProduct && !showShareForm) {
      loadPitchDeckData(selectedProduct.id, selectedDocumentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDocumentId, selectedProduct, showShareForm]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await productService.getMyProducts();
      setProducts(data);
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      setError('Failed to load products. Please try again.');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // handleCreate removed - now using dedicated CreatePitchDeck page at /dashboard/venture/pitch-decks/create

  const handleUpdate = async () => {
    if (!selectedProduct) return;

    // Security: Validate UUID
    if (!validateUuid(selectedProduct.id)) {
      toast.error('Invalid product ID');
      return;
    }

    try {
      setIsMutating(true);

      // Step 1: Update PRODUCT fields only (not pitch deck fields)
      const productData: any = {
        name: sanitizeInput(formData.name, 255),
        industry_sector: formData.industry_sector,
        website: formData.website,
        linkedin_url: formData.linkedin_url,
        short_description: sanitizeInput(formData.short_description, 1000),
      };

      // Optional fields
      if (formData.address) productData.address = sanitizeInput(formData.address, 500);
      if (formData.year_founded) productData.year_founded = formData.year_founded;
      if (formData.employees_count) productData.employees_count = formData.employees_count;

      // Security: Validate URLs
      const validatedWebsite = validateAndSanitizeUrl(productData.website);
      const validatedLinkedIn = validateAndSanitizeUrl(productData.linkedin_url);

      if (!validatedWebsite || !validatedLinkedIn) {
        toast.error('Invalid URL format. Please provide valid URLs.');
        setIsMutating(false);
        return;
      }

      productData.website = validatedWebsite;
      productData.linkedin_url = validatedLinkedIn;

      // Update product
      await productService.updateProduct(selectedProduct.id, productData);

      // Step 2: ALWAYS Update PITCH DECK fields if pitch deck exists
      try {
        const documents = await productService.getProductDocuments(selectedProduct.id);
        const pitchDeck = documents.find((doc: any) => doc.document_type === 'PITCH_DECK');
        
        if (pitchDeck) {
          const pitchDeckData: any = {};
          
          // Always send all fields (backend will handle which to update)
          if (formData.problem_statement !== undefined && formData.problem_statement !== null) {
            pitchDeckData.problem_statement = sanitizeInput(formData.problem_statement, 5000);
          }
          if (formData.solution_description !== undefined && formData.solution_description !== null) {
            pitchDeckData.solution_description = sanitizeInput(formData.solution_description, 5000);
          }
          if (formData.target_market !== undefined && formData.target_market !== null) {
            pitchDeckData.target_market = sanitizeInput(formData.target_market, 2000);
          }
          // Build traction_metrics object from fields (sanitize on save)
          if (tractionMetricsFields.length > 0) {
            const metricsObj: any = {};
            tractionMetricsFields.forEach(field => {
              if (field.key.trim() && field.value.trim()) {
                // Sanitize traction metric key and value when saving
                metricsObj[sanitizeInput(field.key.trim(), 100)] = sanitizeInput(field.value.trim(), 200);
              }
            });
            if (Object.keys(metricsObj).length > 0) {
              pitchDeckData.traction_metrics = metricsObj;
            }
          }
          if (formData.funding_amount !== undefined && formData.funding_amount !== null) {
            pitchDeckData.funding_amount = sanitizeInput(formData.funding_amount, 50);
          }
          if (formData.funding_stage !== undefined && formData.funding_stage !== null) {
            pitchDeckData.funding_stage = formData.funding_stage;
          }
          if (formData.use_of_funds !== undefined && formData.use_of_funds !== null) {
            pitchDeckData.use_of_funds = sanitizeInput(formData.use_of_funds, 2000);
          }
          
          // Only send if we have data to update
          if (Object.keys(pitchDeckData).length > 0) {
            await productService.updatePitchDeckMetadata(selectedProduct.id, pitchDeck.id, pitchDeckData);
          }
        }
      } catch (docErr) {
        console.error('Note: Pitch deck data not updated (may not exist yet):', docErr);
        // Don't fail the entire update if pitch deck update fails
      }

      await fetchProducts();
      setEditingProductId(null);
      setSelectedProduct(null);
      resetForm();
      toast.success('Pitch updated successfully!');
    } catch (err: any) {
      console.error('Failed to update product:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to update pitch.';
      toast.error(errorMsg);
    } finally {
      setIsMutating(false);
    }
  };

  const handleToggleActive = async (product: VentureProduct) => {
    if (!confirm(`Are you sure you want to ${product.is_active ? 'deactivate' : 'activate'} ${product.name}?`)) {
      return;
    }

    try {
      setIsMutating(true);
      await productService.activateProduct(product.id, !product.is_active);
      await fetchProducts();
      toast.success(`Product ${!product.is_active ? 'activated' : 'deactivated'} successfully!`);
    } catch (err: any) {
      console.error('Failed to toggle product:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to update product status.';
      toast.error(errorMsg);
    } finally {
      setIsMutating(false);
    }
  };

  const handleSubmit = async (product: VentureProduct) => {
    // Check if product has a pitch deck
    const hasPitchDeck = product.documents?.some((doc: any) => doc.document_type === 'PITCH_DECK');
    
    if (!hasPitchDeck) {
      toast.error('Please upload a pitch deck before submitting for approval.');
      return;
    }

    if (!confirm(`Submit complete package (product + pitch deck) for admin approval?\n\nThis will be reviewed as one complete submission.`)) {
      return;
    }

    try {
      // Security: Validate UUID
      if (!validateUuid(product.id)) {
        toast.error('Invalid product ID');
        return;
      }

      setIsMutating(true);
      await productService.submitProduct(product.id);
      await fetchProducts();
      toast.success('Complete package submitted for approval!');
    } catch (err: any) {
      console.error('Failed to submit product:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to submit product.';
      toast.error(errorMsg);
    } finally {
      setIsMutating(false);
    }
  };

  const handleDelete = async (product: VentureProduct) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?\n\nThis action cannot be undone. All associated data (pitch deck, team members, founders) will be permanently deleted.`)) {
      return;
    }

    try {
      // Security: Validate UUID
      if (!validateUuid(product.id)) {
        toast.error('Invalid product ID');
        return;
      }

      setIsMutating(true);
      await productService.deleteProduct(product.id);
      await fetchProducts();
      toast.success(`Product "${product.name}" deleted successfully!`);
    } catch (err: any) {
      console.error('Failed to delete product:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to delete product.';
      toast.error(errorMsg);
    } finally {
      setIsMutating(false);
    }
  };

  const handleRequestDeletion = async (product: VentureProduct) => {
    const reason = prompt(`Request deletion of "${product.name}"\n\nPlease provide a reason for this deletion request (optional):`);
    
    // User cancelled the prompt
    if (reason === null) {
      return;
    }

    try {
      // Security: Validate UUID
      if (!validateUuid(product.id)) {
        toast.error('Invalid product ID');
        return;
      }

      setIsMutating(true);
      const response = await productService.requestProductDeletion(product.id, reason);
      await fetchProducts();
      toast.success(`Deletion request submitted! Admin will review your request.`);
    } catch (err: any) {
      console.error('Failed to request deletion:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to request deletion.';
      toast.error(errorMsg);
    } finally {
      setIsMutating(false);
    }
  };

  // Reopen an APPROVED or SUBMITTED product for editing
  const handleReopen = async (product: VentureProduct) => {
    if (!confirm(`Reopen "${product.name}" for editing?\n\nStatus will change from ${product.status} to DRAFT. You can make changes and resubmit for approval.`)) {
      return;
    }
    
    try {
      // Security: Validate UUID
      if (!validateUuid(product.id)) {
        toast.error('Invalid product ID');
        return;
      }

      setIsMutating(true);
      const response = await productService.reopenProduct(product.id);
      await fetchProducts();
      toast.success(response.detail);
      
    } catch (err: any) {
      console.error('Failed to reopen product:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to reopen product';
      toast.error(errorMsg);
    } finally {
      setIsMutating(false);
    }
  };

  const openEditDialog = async (product: VentureProduct) => {
    setSelectedProduct(product);
    setEditingProductId(product.id);
    
    // Pre-fill all fields including pitch deck data
    setFormData({
      name: product.name,
      industry_sector: product.industry_sector,
      website: product.website,
      linkedin_url: product.linkedin_url,
      address: product.address || '',
      year_founded: product.year_founded || undefined,
      employees_count: product.employees_count || undefined,
      short_description: product.short_description,
      problem_statement: '',
      solution_description: '',
      target_market: '',
      traction_metrics: '',
      funding_amount: '',
      funding_stage: '',
      use_of_funds: '',
    });
    
    // Load pitch deck data if exists
    try {
      const documents = await productService.getProductDocuments(product.id);
      const pitchDeck = documents.find((doc: any) => doc.document_type === 'PITCH_DECK');
      if (pitchDeck) {
        // Parse traction_metrics into key-value pairs for editing
        let metricsFields: Array<{key: string, value: string}> = [];
        if (pitchDeck.traction_metrics) {
          if (typeof pitchDeck.traction_metrics === 'object') {
            metricsFields = Object.entries(pitchDeck.traction_metrics).map(([key, value]) => ({
              key,
              value: String(value)
            }));
          } else if (typeof pitchDeck.traction_metrics === 'string') {
            try {
              const parsed = JSON.parse(pitchDeck.traction_metrics);
              metricsFields = Object.entries(parsed).map(([key, value]) => ({
                key,
                value: String(value)
              }));
            } catch {
              // Invalid JSON, ignore
            }
          }
        }
        
        setTractionMetricsFields(metricsFields.length > 0 ? metricsFields : []);
        
        setFormData((prev: any) => ({
          ...prev,
          problem_statement: pitchDeck.problem_statement || '',
          solution_description: pitchDeck.solution_description || '',
          target_market: pitchDeck.target_market || '',
          funding_amount: pitchDeck.funding_amount || '',
          funding_stage: pitchDeck.funding_stage || '',
          use_of_funds: pitchDeck.use_of_funds || '',
        }));
      }
    } catch (err) {
      console.error('Failed to load pitch deck data:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      industry_sector: '',
      website: '',
      linkedin_url: '',
      address: '',
      year_founded: undefined,
      employees_count: undefined,
      short_description: '',
      problem_statement: '',
      solution_description: '',
      target_market: '',
      traction_metrics: '',
      funding_amount: '',
      funding_stage: '',
      use_of_funds: '',
    });
    setTractionMetricsFields([]);
  };
  
  // Helper functions for traction metrics
  const addTractionMetric = () => {
    setTractionMetricsFields([...tractionMetricsFields, { key: '', value: '' }]);
  };
  
  const removeTractionMetric = (index: number) => {
    setTractionMetricsFields(tractionMetricsFields.filter((_, i) => i !== index));
  };
  
  const updateTractionMetric = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...tractionMetricsFields];
    updated[index][field] = value;
    setTractionMetricsFields(updated);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'SUBMITTED':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>;
      case 'DRAFT':
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canEdit = (product: VentureProduct) => {
    return product.status === 'DRAFT' || product.status === 'REJECTED';
  };


  const loadProductDetails = async (productId: string) => {
    setIsLoadingDetails(true);
    try {
      const documentsData = await productService.getProductDocuments(productId);
      setDocuments(documentsData);
    } catch (err: any) {
      console.error('Failed to load product details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Load pitch deck analytics, access, shares, and requests
  const loadPitchDeckData = async (productId: string, docId: string) => {
    // Security: Validate UUIDs
    if (!validateUuid(productId) || !validateUuid(docId)) {
      toast.error('Invalid product or document ID');
      return;
    }

    setIsLoadingAnalytics(true);
    try {
      // Load all pitch deck data in parallel
      const [analytics, access, shares, requests] = await Promise.all([
        productService.getPitchDeckAnalytics(productId, docId),
        productService.listPitchDeckAccess(productId, docId),
        productService.listPitchDeckShares(productId, docId),
        productService.listPitchDeckRequests(productId, docId),
      ]);

      setPitchDeckAnalytics(analytics);
      setPitchDeckAccess(access);
      setPitchDeckShares(shares);
      setPitchDeckRequests(requests);
    } catch (err: any) {
      console.error('Failed to load pitch deck data:', err);
      toast.error(err.message || 'Failed to load pitch deck data');
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  // Pitch deck sharing handler
  const handleSharePitchDeck = async () => {
    if (!selectedProduct || !selectedDocumentId) {
      toast.error('No product or pitch deck selected');
      return;
    }

    // Security: Validate UUIDs
    if (!validateUuid(selectedProduct.id) || !validateUuid(selectedDocumentId) || !validateUuid(shareInvestorId)) {
      toast.error('Invalid product, document, or investor ID');
      return;
    }

    try {
      setIsMutating(true);
      await productService.sharePitchDeck(
        selectedProduct.id,
        selectedDocumentId,
        shareInvestorId,
        shareMessage.trim() || undefined
      );
      toast.success('Pitch deck shared successfully!');
      setShowShareForm(false);
      setShareInvestorId('');
      setShareMessage('');
      // Reload pitch deck data to show updated shares
      await loadPitchDeckData(selectedProduct.id, selectedDocumentId);
    } catch (err: any) {
      console.error('Failed to share pitch deck:', err);
      toast.error(err.response?.data?.detail || err.message || 'Failed to share pitch deck');
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Pitch Decks</CardTitle>
              <CardDescription>
                Manage your pitch decks (up to 3). Complete package (product + pitch deck) is reviewed together in ONE submission.
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                navigate('/dashboard/venture/pitch-decks/create');
              }}
              disabled={products.length >= 3 || isLoading || isMutating}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Pitch Deck {products.length >= 3 && '(Max 3)'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No pitch decks yet</p>
              <p className="text-sm mt-2">Create your first pitch deck to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => {
                // Get pitch deck document for this product
                const pitchDeck = product.documents?.find((doc: any) => doc.document_type === 'PITCH_DECK');
                
                return (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      {/* Left side - Company Info */}
                      <div className="md:w-1/3 p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-r border-blue-200">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{product.industry_sector}</p>
                          </div>
                          {getStatusBadge(product.status)}
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <span className="text-xs font-semibold text-gray-700">Status</span>
                            <p className="text-sm font-medium text-gray-900">{product.status}</p>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-gray-700">Active</span>
                            <Badge variant={product.is_active ? 'default' : 'outline'} className="mt-1">
                              {product.is_active ? 'Yes' : 'No'}
                            </Badge>
                          </div>
                          {pitchDeck && pitchDeck.funding_amount && (
                            <div>
                              <span className="text-xs font-semibold text-gray-700">Investment Size</span>
                              <p className="text-lg font-bold text-blue-700 mt-1">{pitchDeck.funding_amount}</p>
                            </div>
                          )}
                          {pitchDeck && pitchDeck.funding_stage && (
                            <div>
                              <span className="text-xs font-semibold text-gray-700">Funding Stage</span>
                              <p className="text-sm font-medium text-gray-900 mt-1">{pitchDeck.funding_stage.replace('_', ' ')}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right side - Pitch Deck Info & Actions */}
                      <div className="flex-1 p-6">
                        {pitchDeck && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-lg font-semibold text-gray-900">Pitch Deck</h4>
                              <Button
                                size="sm"
                                onClick={() => {
                                  // Open full pitch deck details in new tab (NO_MODALS_RULE)
                                  window.open(
                                    `/dashboard/venture/pitch-deck/${product.id}/${pitchDeck.id}`,
                                    '_blank',
                                    'noopener,noreferrer'
                                  );
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                View Full Details
                              </Button>
                            </div>
                            
                            {/* Preview - Show limited info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {pitchDeck.problem_statement && (
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                  <Label className="text-xs font-semibold text-gray-700">Problem</Label>
                                  <p className="text-sm text-gray-900 mt-1 line-clamp-2">{pitchDeck.problem_statement}</p>
                                </div>
                              )}
                              {pitchDeck.solution_description && (
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                  <Label className="text-xs font-semibold text-gray-700">Solution</Label>
                                  <p className="text-sm text-gray-900 mt-1 line-clamp-2">{pitchDeck.solution_description}</p>
                                </div>
                              )}
                              {pitchDeck.target_market && (
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                  <Label className="text-xs font-semibold text-gray-700">Target Market</Label>
                                  <p className="text-sm text-gray-900 mt-1 line-clamp-2">{pitchDeck.target_market}</p>
                                </div>
                              )}
                              {pitchDeck.use_of_funds && (
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                  <Label className="text-xs font-semibold text-gray-700">Use of Funds</Label>
                                  <p className="text-sm text-gray-900 mt-1 line-clamp-2">{pitchDeck.use_of_funds}</p>
                                </div>
                              )}
                            </div>

                            {/* Download PDF Button */}
                            {pitchDeck.file_url && (
                              <div className="pt-4 border-t">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(pitchDeck.file_url, '_blank')}
                                  className="w-full"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Download Pitch Deck (PDF/PPT)
                                </Button>
                              </div>
                            )}
                          </div>
                        )}

                        {!pitchDeck && (
                          <Alert className="bg-amber-50 border-amber-200">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <AlertDescription className="text-sm text-amber-800">
                              <strong>No Pitch Deck:</strong> Upload a pitch deck to submit for approval.
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Action Buttons */}
                        <div className="pt-4 border-t space-y-2">
                          {canEdit(product) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => openEditDialog(product)}
                              disabled={isMutating}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Pitch
                            </Button>
                          )}
                          {product.status === 'APPROVED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => handleToggleActive(product)}
                              disabled={isMutating}
                            >
                              {product.is_active ? (
                                <>
                                  <PowerOff className="w-4 h-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Power className="w-4 h-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </Button>
                          )}
                          {(product.status === 'APPROVED' || product.status === 'SUBMITTED') && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                              onClick={() => handleReopen(product)}
                              disabled={isMutating}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Reopen for Editing
                            </Button>
                          )}
                          {(product.status === 'DRAFT' || product.status === 'REJECTED') && pitchDeck && (
                            <Button
                              variant="default"
                              size="sm"
                              className="w-full"
                              onClick={() => handleSubmit(product)}
                              disabled={isMutating}
                              style={{ backgroundColor: isMutating ? '#1e40af' : '#2563EB' }}
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Submit Complete Package
                            </Button>
                          )}
                          
                          {/* Delete/Request Deletion Buttons */}
                          {(product.status === 'DRAFT' || product.status === 'REJECTED') && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            onClick={() => handleDelete(product)}
                            disabled={isMutating}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        )}
                        {(product.status === 'SUBMITTED' || product.status === 'APPROVED') && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                            onClick={() => handleRequestDeletion(product)}
                            disabled={isMutating}
                          >
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Request Deletion
                          </Button>
                          )}
                        </div>
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

      {/* Create Pitch Deck - Now handled by dedicated page /dashboard/venture/pitch-decks/create */}

      {/* Edit Product Form - Inline (No Modal) */}
      {editingProductId && selectedProduct && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Edit Pitch Deck</CardTitle>
                <CardDescription>
                  Update your pitch deck details. Only DRAFT or REJECTED pitches can be edited.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingProductId(null);
                  setSelectedProduct(null);
                  resetForm();
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Company Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your company name"
                />
              </div>
              <div>
                <Label>Industry Sector *</Label>
                <Select
                  value={formData.industry_sector}
                  onValueChange={(value) => setFormData({ ...formData, industry_sector: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fintech">FinTech</SelectItem>
                    <SelectItem value="healthtech">HealthTech</SelectItem>
                    <SelectItem value="edtech">EdTech</SelectItem>
                    <SelectItem value="cleantech">CleanTech</SelectItem>
                    <SelectItem value="ai">AI/ML</SelectItem>
                    <SelectItem value="saas">SaaS</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Website *</Label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://yourcompany.com"
                />
              </div>
              <div>
                <Label>LinkedIn URL *</Label>
                <Input
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/company/yourcompany"
                />
              </div>
            </div>

            <div>
              <Label>Short Description *</Label>
              <Textarea
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                rows={2}
                placeholder="Brief description of your company"
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-semibold mb-3">Pitch Deck Details</h3>
            </div>

            <div>
              <Label>Problem Statement *</Label>
              <Textarea
                value={formData.problem_statement || ''}
                onChange={(e) => setFormData({ ...formData, problem_statement: e.target.value })}
                rows={3}
                placeholder="What problem are you solving?"
              />
            </div>

            <div>
              <Label>Solution Description *</Label>
              <Textarea
                value={formData.solution_description || ''}
                onChange={(e) => setFormData({ ...formData, solution_description: e.target.value })}
                rows={3}
                placeholder="How does your solution work?"
              />
            </div>

            <div>
              <Label>Target Market *</Label>
              <Textarea
                value={formData.target_market || ''}
                onChange={(e) => setFormData({ ...formData, target_market: e.target.value })}
                rows={2}
                placeholder="Who are your target customers?"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Traction & Metrics</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addTractionMetric}
                  disabled={isMutating}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Metric
                </Button>
              </div>
              
              {tractionMetricsFields.length === 0 && (
                <div className="text-sm text-gray-500 italic p-4 border border-dashed rounded-md">
                  No traction metrics added yet. Click "Add Metric" to add key metrics like users, revenue, growth rate, etc.
                </div>
              )}
              
              <div className="space-y-3">
                {tractionMetricsFields.map((field, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <Input
                        placeholder="Metric name (e.g., users, revenue)"
                        value={field.key}
                        onChange={(e) => updateTractionMetric(index, 'key', e.target.value)}
                        disabled={isMutating}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        placeholder="Value (e.g., 500, $2M monthly)"
                        value={field.value}
                        onChange={(e) => updateTractionMetric(index, 'value', e.target.value)}
                        disabled={isMutating}
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeTractionMetric(index)}
                      disabled={isMutating}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              {tractionMetricsFields.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Example: users = "500", revenue = "$2M monthly", growth = "20% MoM"
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Funding Stage</Label>
                <Select
                  value={formData.funding_stage || ''}
                  onValueChange={(value) => setFormData({ ...formData, funding_stage: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRE_SEED">Pre-Seed</SelectItem>
                    <SelectItem value="SEED">Seed</SelectItem>
                    <SelectItem value="SERIES_A">Series A</SelectItem>
                    <SelectItem value="SERIES_B">Series B</SelectItem>
                    <SelectItem value="SERIES_C">Series C</SelectItem>
                    <SelectItem value="GROWTH">Growth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Funding Amount Sought</Label>
                <Input
                  value={formData.funding_amount || ''}
                  onChange={(e) => setFormData({ ...formData, funding_amount: e.target.value })}
                  placeholder="e.g., $500K, $2M"
                />
              </div>
            </div>

            <div>
              <Label>Use of Funds</Label>
              <Textarea
                value={formData.use_of_funds || ''}
                onChange={(e) => setFormData({ ...formData, use_of_funds: e.target.value })}
                rows={2}
                placeholder="How will you use the funding?"
              />
            </div>
          </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => {
                setEditingProductId(null);
                setSelectedProduct(null);
                resetForm();
              }} disabled={isMutating}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={isMutating} style={{ backgroundColor: '#2563eb' }} className="text-white">
                <CheckCircle className="w-4 h-4 mr-2" />
                {isMutating ? 'Saving...' : 'Save Pitch'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Pitch Deck Analytics View - Inline (No Modal) */}
      {selectedDocumentId && selectedProduct && !showShareForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pitch Deck Analytics</CardTitle>
                <CardDescription>
                  View analytics, access control, shares, and requests for this pitch deck
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedDocumentId(null);
                  setPitchDeckAnalytics(null);
                  setPitchDeckAccess([]);
                  setPitchDeckShares([]);
                  setPitchDeckRequests([]);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            
            {isLoadingAnalytics ? (
              <div className="text-center py-8">Loading analytics...</div>
            ) : pitchDeckAnalytics ? (
              <div className="space-y-6">
                {/* Analytics Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-2xl font-bold">{pitchDeckAnalytics.total_views || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Views</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-2xl font-bold">{pitchDeckAnalytics.total_downloads || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Downloads</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-2xl font-bold">{pitchDeckAnalytics.unique_viewers || 0}</p>
                    <p className="text-sm text-muted-foreground">Unique Viewers</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-2xl font-bold">{pitchDeckAnalytics.total_access_granted || 0}</p>
                    <p className="text-sm text-muted-foreground">Access Granted</p>
                  </div>
                </div>

                {/* Recent Events */}
                {pitchDeckAnalytics.recent_events && pitchDeckAnalytics.recent_events.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Recent Access Events</h3>
                    <div className="space-y-2">
                      {pitchDeckAnalytics.recent_events.map((event: any) => (
                        <div key={event.id} className="p-3 bg-muted/30 rounded-lg flex justify-between items-center">
                          <div>
                            <p className="font-medium">{sanitizeForDisplay(event.user_name)} ({sanitizeForDisplay(event.user_email)})</p>
                            <p className="text-sm text-muted-foreground">
                              {event.event_type} • {new Date(event.accessed_at).toLocaleString()}
                            </p>
                          </div>
                          <Badge>{event.event_type}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Access Control */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Access Permissions</h3>
                  {pitchDeckAccess.length > 0 ? (
                    <div className="space-y-2">
                      {pitchDeckAccess.map((access: any) => (
                        <div key={access.id} className="p-3 bg-muted/30 rounded-lg flex justify-between items-center">
                          <div>
                            <p className="font-medium">{sanitizeForDisplay(access.investor_name)}</p>
                            <p className="text-sm text-muted-foreground">{sanitizeForDisplay(access.investor_email)}</p>
                            <p className="text-xs text-muted-foreground">
                              Granted {new Date(access.granted_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              if (!selectedProduct || !selectedDocumentId || !confirm('Revoke access?')) return;
                              // Security: Validate UUIDs
                              if (!validateUuid(selectedProduct.id) || !validateUuid(selectedDocumentId) || !validateUuid(access.investor)) {
                                toast.error('Invalid IDs');
                                return;
                              }
                              try {
                                await productService.revokePitchDeckAccess(selectedProduct.id, selectedDocumentId, access.investor);
                                toast.success('Access revoked');
                                await loadPitchDeckData(selectedProduct.id, selectedDocumentId);
                              } catch (err: any) {
                                toast.error(err.message || 'Failed to revoke access');
                              }
                            }}
                          >
                            Revoke
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No specific access permissions set</p>
                  )}
                </div>

                {/* Shares */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Shares</h3>
                  {pitchDeckShares.length > 0 ? (
                    <div className="space-y-2">
                      {pitchDeckShares.map((share: any) => (
                        <div key={share.id} className="p-3 bg-muted/30 rounded-lg">
                          <p className="font-medium">{sanitizeForDisplay(share.investor_name)}</p>
                          <p className="text-sm text-muted-foreground">{sanitizeForDisplay(share.investor_email)}</p>
                          {share.message && <p className="text-sm mt-1">{sanitizeForDisplay(share.message)}</p>}
                          <p className="text-xs text-muted-foreground mt-1">
                            Shared {new Date(share.shared_at).toLocaleDateString()}
                            {share.viewed_at && ` • Viewed ${new Date(share.viewed_at).toLocaleDateString()}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No shares yet</p>
                  )}
                </div>

                {/* Requests */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Requests</h3>
                  {pitchDeckRequests.length > 0 ? (
                    <div className="space-y-2">
                      {pitchDeckRequests.map((request: any) => (
                        <div key={request.id} className="p-3 bg-muted/30 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">{sanitizeForDisplay(request.investor_name)}</p>
                              <p className="text-sm text-muted-foreground">{sanitizeForDisplay(request.investor_email)}</p>
                              {request.message && <p className="text-sm mt-1">{sanitizeForDisplay(request.message)}</p>}
                              <p className="text-xs text-muted-foreground mt-1">
                                Requested {new Date(request.requested_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant={request.status === 'APPROVED' ? 'default' : request.status === 'DENIED' ? 'destructive' : 'secondary'}>
                              {request.status}
                            </Badge>
                          </div>
                          {request.status === 'PENDING' && (
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                onClick={async () => {
                                  if (!selectedProduct || !selectedDocumentId) return;
                                  // Security: Validate UUIDs
                                  if (!validateUuid(selectedProduct.id) || !validateUuid(selectedDocumentId) || !validateUuid(request.id)) {
                                    toast.error('Invalid IDs');
                                    return;
                                  }
                                  try {
                                    await productService.respondToPitchDeckRequest(selectedProduct.id, selectedDocumentId, request.id, 'APPROVED');
                                    toast.success('Request approved');
                                    await loadPitchDeckData(selectedProduct.id, selectedDocumentId);
                                  } catch (err: any) {
                                    toast.error(err.message || 'Failed to approve request');
                                  }
                                }}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  if (!selectedProduct || !selectedDocumentId) return;
                                  // Security: Validate UUIDs
                                  if (!validateUuid(selectedProduct.id) || !validateUuid(selectedDocumentId) || !validateUuid(request.id)) {
                                    toast.error('Invalid IDs');
                                    return;
                                  }
                                  try {
                                    await productService.respondToPitchDeckRequest(selectedProduct.id, selectedDocumentId, request.id, 'DENIED');
                                    toast.success('Request denied');
                                    await loadPitchDeckData(selectedProduct.id, selectedDocumentId);
                                  } catch (err: any) {
                                    toast.error(err.message || 'Failed to deny request');
                                  }
                                }}
                              >
                                Deny
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No requests yet</p>
                  )}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Share Pitch Deck Form - Inline (No Modal) */}
      {showShareForm && selectedProduct && selectedDocumentId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Share Pitch Deck</CardTitle>
                <CardDescription>
                  Share this pitch deck with an investor
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowShareForm(false);
                  setShareInvestorId('');
                  setShareMessage('');
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="investor-id">Investor ID</Label>
              <Input
                id="investor-id"
                value={shareInvestorId}
                onChange={(e) => {
                  const value = sanitizeInput(e.target.value, 36);
                  if (validateUuid(value) || value === '') {
                    setShareInvestorId(value);
                  }
                }}
                placeholder="Enter investor UUID"
              />
            </div>
            <div>
              <Label htmlFor="share-message">Message (Optional)</Label>
              <Textarea
                id="share-message"
                value={shareMessage}
                onChange={(e) => {
                  const value = sanitizeInput(e.target.value, 2000);
                  setShareMessage(value);
                }}
                placeholder="Optional message to investor"
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {shareMessage.length}/2000 characters
              </p>
            </div>
          </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => {
                setShowShareForm(false);
                setShareInvestorId('');
                setShareMessage('');
              }}>
                Cancel
              </Button>
              <Button onClick={handleSharePitchDeck} disabled={!shareInvestorId || !validateUuid(shareInvestorId) || isMutating}>
                Share
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
