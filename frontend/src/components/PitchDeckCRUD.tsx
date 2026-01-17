/**
 * Pitch Deck CRUD Component
 * Comprehensive Create, Read, Update, Delete interface for pitch decks
 * NO MODALS - All forms displayed directly on the page
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  FileText,
  Upload,
  Edit,
  Trash2,
  Eye,
  Download,
  PlusCircle,
  X,
  Loader2,
  Save,
  BarChart3,
  Users,
  TrendingUp,
} from 'lucide-react';
import { productService, type VentureProduct } from '../services/productService';
import { 
  validatePitchDeckFile
} from '../utils/fileValidation';
import { 
  sanitizeInput, 
  validateUuid,
} from '../utils/security';
import { toast } from 'sonner';

interface PitchDeckDocument {
  id: string;
  document_type: 'PITCH_DECK' | 'OTHER';
  file: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  updated_at: string;
  problem_statement?: string;
  solution_description?: string;
  target_market?: string;
  traction_metrics?: any;
  funding_amount?: string;
  funding_stage?: 'PRE_SEED' | 'SEED' | 'SERIES_A' | 'SERIES_B' | 'SERIES_C' | 'GROWTH';
  use_of_funds?: string;
}

interface PitchDeckCRUDProps {
  productId: string;
  productStatus: string;
  onUpdate?: () => void;
}

export function PitchDeckCRUD({ productId, productStatus, onUpdate }: PitchDeckCRUDProps) {
  const [documents, setDocuments] = useState<PitchDeckDocument[]>([]);
  const [product, setProduct] = useState<VentureProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<Record<string, any>>({});
  const [loadingAnalytics, setLoadingAnalytics] = useState<Record<string, boolean>>({});
  
  // Form state for upload/edit
  const [formData, setFormData] = useState({
    file: null as File | null,
    problem_statement: '',
    solution_description: '',
    target_market: '',
    traction_metrics: '',
    funding_amount: '',
    funding_stage: '' as '' | 'PRE_SEED' | 'SEED' | 'SERIES_A' | 'SERIES_B' | 'SERIES_C' | 'GROWTH',
    use_of_funds: '',
  });

  // Check if product can be edited
  const canEdit = productStatus === 'DRAFT' || productStatus === 'REJECTED';

  useEffect(() => {
    fetchProduct();
    fetchDocuments();
  }, [productId]);

  // Fetch analytics for all documents when documents change
  useEffect(() => {
    if (documents.length > 0) {
      documents.forEach((doc) => {
        fetchAnalytics(doc.id);
      });
    }
  }, [documents]);

  const fetchProduct = async () => {
    if (!validateUuid(productId)) {
      toast.error('Invalid product ID');
      return;
    }

    try {
      const data = await productService.getProduct(productId);
      setProduct(data);
    } catch (error: any) {
      console.error('Failed to fetch product:', error);
      toast.error(error.message || 'Failed to load product');
    }
  };

  const fetchDocuments = async () => {
    if (!validateUuid(productId)) {
      toast.error('Invalid product ID');
      return;
    }

    try {
      setIsLoading(true);
      const data = await productService.getProductDocuments(productId);
      // Filter to only pitch decks
      const pitchDecks = data.filter((doc: any) => doc.document_type === 'PITCH_DECK');
      setDocuments(pitchDecks);
    } catch (error: any) {
      console.error('Failed to fetch documents:', error);
      toast.error(error.message || 'Failed to load pitch decks');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async (docId: string) => {
    if (!validateUuid(productId) || !validateUuid(docId)) {
      return;
    }

    try {
      setLoadingAnalytics((prev) => ({ ...prev, [docId]: true }));
      const data = await productService.getPitchDeckAnalytics(productId, docId);
      setAnalytics((prev) => ({ ...prev, [docId]: data }));
    } catch (error: any) {
      console.error('Failed to fetch analytics:', error);
      // Don't show error toast for analytics - it's not critical
    } finally {
      setLoadingAnalytics((prev) => ({ ...prev, [docId]: false }));
    }
  };

  const resetForm = () => {
    setFormData({
      file: null,
      problem_statement: '',
      solution_description: '',
      target_market: '',
      traction_metrics: '',
      funding_amount: '',
      funding_stage: '',
      use_of_funds: '',
    });
  };

  const handleUpload = async () => {
    if (!formData.file) {
      toast.error('Please select a file to upload');
      return;
    }

    // Security: Validate UUID
    if (!validateUuid(productId)) {
      toast.error('Invalid product ID');
      return;
    }

    // Security: Validate file
    const validation = validatePitchDeckFile(formData.file);
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid file');
      return;
    }

    try {
      setIsMutating(true);
      
      // Prepare metadata object
      const metadata: any = {};
      if (formData.problem_statement.trim()) {
        metadata.problem_statement = sanitizeInput(formData.problem_statement, 10000);
      }
      if (formData.solution_description.trim()) {
        metadata.solution_description = sanitizeInput(formData.solution_description, 10000);
      }
      if (formData.target_market.trim()) {
        metadata.target_market = sanitizeInput(formData.target_market, 10000);
      }
      if (formData.funding_amount.trim()) {
        metadata.funding_amount = sanitizeInput(formData.funding_amount, 50);
      }
      if (formData.funding_stage) {
        metadata.funding_stage = formData.funding_stage;
      }
      if (formData.use_of_funds.trim()) {
        metadata.use_of_funds = sanitizeInput(formData.use_of_funds, 10000);
      }
      if (formData.traction_metrics.trim()) {
        try {
          metadata.traction_metrics = JSON.parse(formData.traction_metrics);
        } catch (err) {
          toast.error('Invalid JSON format for traction metrics');
          return;
        }
      }

      await productService.uploadPitchDeck(
        productId, 
        formData.file, 
        Object.keys(metadata).length > 0 ? metadata : undefined
      );
      toast.success('Pitch deck uploaded successfully!');
      setShowUploadForm(false);
      resetForm();
      await fetchDocuments();
      onUpdate?.();
    } catch (error: any) {
      console.error('Failed to upload pitch deck:', error);
      toast.error(error.response?.data?.detail || error.message || 'Failed to upload pitch deck');
    } finally {
      setIsMutating(false);
    }
  };

  const handleUpdateMetadata = async (docId: string) => {
    // Security: Validate UUIDs
    if (!validateUuid(productId) || !validateUuid(docId)) {
      toast.error('Invalid product or document ID');
      return;
    }

    try {
      setIsMutating(true);
      
      // Prepare metadata object
      const metadata: any = {};
      
      if (formData.problem_statement.trim()) {
        metadata.problem_statement = sanitizeInput(formData.problem_statement, 10000);
      } else {
        metadata.problem_statement = null;
      }
      
      if (formData.solution_description.trim()) {
        metadata.solution_description = sanitizeInput(formData.solution_description, 10000);
      } else {
        metadata.solution_description = null;
      }
      
      if (formData.target_market.trim()) {
        metadata.target_market = sanitizeInput(formData.target_market, 10000);
      } else {
        metadata.target_market = null;
      }
      
      if (formData.funding_amount.trim()) {
        metadata.funding_amount = sanitizeInput(formData.funding_amount, 50);
      } else {
        metadata.funding_amount = null;
      }
      
      if (formData.funding_stage) {
        metadata.funding_stage = formData.funding_stage;
      } else {
        metadata.funding_stage = null;
      }
      
      if (formData.use_of_funds.trim()) {
        metadata.use_of_funds = sanitizeInput(formData.use_of_funds, 10000);
      } else {
        metadata.use_of_funds = null;
      }
      
      if (formData.traction_metrics.trim()) {
        try {
          const parsed = JSON.parse(formData.traction_metrics);
          metadata.traction_metrics = parsed;
        } catch (err) {
          toast.error('Invalid JSON format for traction metrics');
          return;
        }
      } else {
        metadata.traction_metrics = null;
      }

      await productService.updatePitchDeckMetadata(productId, docId, metadata);
      toast.success('Pitch deck metadata updated successfully!');
      setEditingDocumentId(null);
      resetForm();
      await fetchDocuments();
      onUpdate?.();
    } catch (error: any) {
      console.error('Failed to update pitch deck metadata:', error);
      toast.error(error.response?.data?.detail || error.message || 'Failed to update metadata');
    } finally {
      setIsMutating(false);
    }
  };

  const handleDelete = async (docId: string) => {
    // Security: Validate UUIDs
    if (!validateUuid(productId) || !validateUuid(docId)) {
      toast.error('Invalid product or document ID');
      return;
    }

    if (!confirm('Are you sure you want to delete this pitch deck? This action cannot be undone.')) {
      return;
    }

    try {
      setIsMutating(true);
      await productService.deleteProductDocument(productId, docId);
      toast.success('Pitch deck deleted successfully!');
      setDeletingDocumentId(null);
      await fetchDocuments();
      onUpdate?.();
    } catch (error: any) {
      console.error('Failed to delete pitch deck:', error);
      toast.error(error.response?.data?.detail || error.message || 'Failed to delete pitch deck');
    } finally {
      setIsMutating(false);
    }
  };

  const startEdit = (doc: PitchDeckDocument) => {
    setEditingDocumentId(doc.id);
    setFormData({
      file: null,
      problem_statement: doc.problem_statement || '',
      solution_description: doc.solution_description || '',
      target_market: doc.target_market || '',
      traction_metrics: doc.traction_metrics ? JSON.stringify(doc.traction_metrics, null, 2) : '',
      funding_amount: doc.funding_amount || '',
      funding_stage: doc.funding_stage || '',
      use_of_funds: doc.use_of_funds || '',
    });
  };

  const cancelEdit = () => {
    setEditingDocumentId(null);
    resetForm();
  };

  const handleView = async (doc: PitchDeckDocument) => {
    // Security: Validate UUIDs
    if (!validateUuid(productId) || !validateUuid(doc.id)) {
      toast.error('Invalid product or document ID');
      return;
    }

    try {
      const blobUrl = await productService.viewPitchDeck(productId, doc.id);
      window.open(blobUrl, '_blank');
      // Clean up blob URL after a delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to view pitch deck');
    }
  };

  const handleDownload = async (doc: PitchDeckDocument) => {
    // Security: Validate UUIDs
    if (!validateUuid(productId) || !validateUuid(doc.id)) {
      toast.error('Invalid product or document ID');
      return;
    }

    try {
      const blob = await productService.downloadPitchDeck(productId, doc.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file?.split('/').pop() || 'pitch-deck.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Pitch deck downloaded');
    } catch (error: any) {
      toast.error(error.message || 'Failed to download pitch deck');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pitch Decks</h2>
          <p className="text-gray-600">
            Manage your pitch deck documents and metadata
          </p>
        </div>
        {canEdit && !showUploadForm && (
          <Button
            onClick={() => {
              resetForm();
              setShowUploadForm(true);
            }}
            disabled={isMutating}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Upload Pitch Deck
          </Button>
        )}
      </div>

      {/* Upload Form - Displayed directly on page */}
      {showUploadForm && canEdit && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upload New Pitch Deck</CardTitle>
                <CardDescription>
                  Upload a new pitch deck PDF and add metadata
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowUploadForm(false);
                  resetForm();
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file">Pitch Deck PDF *</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFormData({ ...formData, file });
                  }
                }}
                disabled={isMutating}
              />
              <p className="text-xs text-gray-600 mt-1">
                PDF files only, max 10MB
              </p>
            </div>

            {/* Name - from product */}
            {product && (
              <div>
                <Label>Name</Label>
                <Input
                  value={product.name}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Product/Company name
                </p>
              </div>
            )}

            {/* Description - Problem Statement */}
            <div>
              <Label htmlFor="problem_statement">Problem Statement</Label>
              <Textarea
                id="problem_statement"
                value={formData.problem_statement}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    problem_statement: sanitizeInput(e.target.value, 10000),
                  })
                }
                placeholder="What problem does your product solve?"
                rows={3}
                disabled={isMutating}
              />
            </div>

            {/* Solution Description */}
            <div>
              <Label htmlFor="solution_description">Solution Description</Label>
              <Textarea
                id="solution_description"
                value={formData.solution_description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    solution_description: sanitizeInput(e.target.value, 10000),
                  })
                }
                placeholder="How does your product solve this problem?"
                rows={3}
                disabled={isMutating}
              />
            </div>

            {/* Market Size - Target Market */}
            <div>
              <Label htmlFor="target_market">Market Size / Target Market</Label>
              <Textarea
                id="target_market"
                value={formData.target_market}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    target_market: sanitizeInput(e.target.value, 10000),
                  })
                }
                placeholder="Describe your target market and market size"
                rows={3}
                disabled={isMutating}
              />
            </div>

            {/* Investment Size */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="funding_amount">Investment Size</Label>
                <Input
                  id="funding_amount"
                  value={formData.funding_amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      funding_amount: sanitizeInput(e.target.value, 50),
                    })
                  }
                  placeholder="e.g., $2M"
                  disabled={isMutating}
                />
              </div>
              <div>
                <Label htmlFor="funding_stage">Funding Stage</Label>
                <Select
                  value={formData.funding_stage}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, funding_stage: value })
                  }
                  disabled={isMutating}
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
            </div>

            {/* Use of Funds */}
            <div>
              <Label htmlFor="use_of_funds">Use of Funds</Label>
              <Textarea
                id="use_of_funds"
                value={formData.use_of_funds}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    use_of_funds: sanitizeInput(e.target.value, 10000),
                  })
                }
                placeholder="How will the funds be used?"
                rows={3}
                disabled={isMutating}
              />
            </div>

            {/* Traction Metrics */}
            <div>
              <Label htmlFor="traction_metrics">Traction Metrics (JSON)</Label>
              <Textarea
                id="traction_metrics"
                value={formData.traction_metrics}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    traction_metrics: e.target.value,
                  })
                }
                placeholder='{"users": 10000, "revenue": "$50K/month", "growth": "20% MoM"}'
                rows={4}
                disabled={isMutating}
              />
              <p className="text-xs text-gray-600 mt-1">
                Optional: JSON format for metrics and achievements
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadForm(false);
                  resetForm();
                }}
                disabled={isMutating}
              >
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={isMutating || !formData.file}>
                {isMutating ? 'Uploading...' : 'Upload Pitch Deck'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
          <span className="ml-2 text-gray-600">Loading pitch decks...</span>
        </div>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2 text-gray-900">No Pitch Decks</h3>
            <p className="text-gray-600 mb-4">
              Upload your first pitch deck to get started.
            </p>
            {canEdit && (
              <Button onClick={() => setShowUploadForm(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Pitch Deck
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {product?.name || 'Pitch Deck'}
                    </CardTitle>
                    <CardDescription>
                      {formatFileSize(doc.file_size)} • {formatDate(doc.uploaded_at)}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">PDF</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {editingDocumentId === doc.id ? (
                  // Edit Form - Inline
                  <div className="space-y-4">
                    <div>
                      <Label>Current File</Label>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-900">
                          {doc.file?.split('/').pop() || 'pitch-deck.pdf'}
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatFileSize(doc.file_size)}
                        </p>
                      </div>
                    </div>

                    {/* Name - from product */}
                    {product && (
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={product.name}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                    )}

                    {/* Description */}
                    <div>
                      <Label htmlFor="edit_problem_statement">Problem Statement</Label>
                      <Textarea
                        id="edit_problem_statement"
                        value={formData.problem_statement}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            problem_statement: sanitizeInput(e.target.value, 10000),
                          })
                        }
                        placeholder="What problem does your product solve?"
                        rows={3}
                        disabled={isMutating}
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit_solution_description">Solution Description</Label>
                      <Textarea
                        id="edit_solution_description"
                        value={formData.solution_description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            solution_description: sanitizeInput(e.target.value, 10000),
                          })
                        }
                        placeholder="How does your product solve this problem?"
                        rows={3}
                        disabled={isMutating}
                      />
                    </div>

                    {/* Market Size */}
                    <div>
                      <Label htmlFor="edit_target_market">Market Size / Target Market</Label>
                      <Textarea
                        id="edit_target_market"
                        value={formData.target_market}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            target_market: sanitizeInput(e.target.value, 10000),
                          })
                        }
                        placeholder="Describe your target market and market size"
                        rows={3}
                        disabled={isMutating}
                      />
                    </div>

                    {/* Investment Size */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit_funding_amount">Investment Size</Label>
                        <Input
                          id="edit_funding_amount"
                          value={formData.funding_amount}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              funding_amount: sanitizeInput(e.target.value, 50),
                            })
                          }
                          placeholder="e.g., $2M"
                          disabled={isMutating}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit_funding_stage">Funding Stage</Label>
                        <Select
                          value={formData.funding_stage}
                          onValueChange={(value: any) =>
                            setFormData({ ...formData, funding_stage: value })
                          }
                          disabled={isMutating}
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
                    </div>

                    {/* Use of Funds */}
                    <div>
                      <Label htmlFor="edit_use_of_funds">Use of Funds</Label>
                      <Textarea
                        id="edit_use_of_funds"
                        value={formData.use_of_funds}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            use_of_funds: sanitizeInput(e.target.value, 10000),
                          })
                        }
                        placeholder="How will the funds be used?"
                        rows={3}
                        disabled={isMutating}
                      />
                    </div>

                    {/* Traction Metrics */}
                    <div>
                      <Label htmlFor="edit_traction_metrics">Traction Metrics (JSON)</Label>
                      <Textarea
                        id="edit_traction_metrics"
                        value={formData.traction_metrics}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            traction_metrics: e.target.value,
                          })
                        }
                        placeholder='{"users": 10000, "revenue": "$50K/month"}'
                        rows={4}
                        disabled={isMutating}
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        Optional: JSON format for metrics and achievements
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={cancelEdit}
                        disabled={isMutating}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleUpdateMetadata(doc.id)}
                        disabled={isMutating}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isMutating ? 'Updating...' : 'Update Metadata'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display View - Show all data
                  <div className="space-y-4">
                    {/* Analytics Metrics */}
                    {analytics[doc.id] && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-3">
                          <BarChart3 className="w-5 h-5 text-blue-600" />
                          <Label className="text-sm font-semibold text-blue-900">Analytics</Label>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <Eye className="w-4 h-4 text-gray-500" />
                              <p className="text-xs text-gray-600">Total Views</p>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">
                              {analytics[doc.id].total_views || 0}
                            </p>
                          </div>
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <Download className="w-4 h-4 text-gray-500" />
                              <p className="text-xs text-gray-600">Downloads</p>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">
                              {analytics[doc.id].total_downloads || 0}
                            </p>
                          </div>
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <Users className="w-4 h-4 text-gray-500" />
                              <p className="text-xs text-gray-600">Unique Viewers</p>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">
                              {analytics[doc.id].unique_viewers || 0}
                            </p>
                          </div>
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingUp className="w-4 h-4 text-gray-500" />
                              <p className="text-xs text-gray-600">Access Granted</p>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">
                              {analytics[doc.id].total_access_granted || 0}
                            </p>
                          </div>
                        </div>
                        {analytics[doc.id].recent_events && analytics[doc.id].recent_events.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <p className="text-xs text-blue-700 font-medium mb-2">Recent Activity</p>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {analytics[doc.id].recent_events.slice(0, 5).map((event: any, idx: number) => (
                                <div key={idx} className="text-xs text-blue-600 flex items-center gap-2">
                                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                  <span>
                                    {event.event_type === 'VIEW' ? 'Viewed' : 'Downloaded'} by{' '}
                                    {event.user_email || 'Unknown'} • {new Date(event.accessed_at).toLocaleDateString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {loadingAnalytics[doc.id] && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading analytics...</span>
                      </div>
                    )}

                    {/* Name */}
                    {product && (
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Name</Label>
                        <p className="text-gray-900">{product.name}</p>
                      </div>
                    )}

                    {/* Description */}
                    {(doc.problem_statement || doc.solution_description) && (
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Description</Label>
                        {doc.problem_statement && (
                          <div className="mb-2">
                            <p className="text-xs text-gray-600 mb-1">Problem Statement:</p>
                            <p className="text-gray-900 whitespace-pre-wrap">{doc.problem_statement}</p>
                          </div>
                        )}
                        {doc.solution_description && (
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Solution:</p>
                            <p className="text-gray-900 whitespace-pre-wrap">{doc.solution_description}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Market Size */}
                    {doc.target_market && (
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Market Size / Target Market</Label>
                        <p className="text-gray-900 whitespace-pre-wrap">{doc.target_market}</p>
                      </div>
                    )}

                    {/* Investment Size */}
                    {(doc.funding_amount || doc.funding_stage) && (
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Investment Size</Label>
                        <div className="flex items-center gap-2">
                          {doc.funding_amount && (
                            <p className="text-gray-900 font-medium">{doc.funding_amount}</p>
                          )}
                          {doc.funding_stage && (
                            <Badge variant="outline">
                              {doc.funding_stage.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Traction Metrics */}
                    {doc.traction_metrics && (
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Traction Metrics</Label>
                        <pre className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg overflow-x-auto">
                          {JSON.stringify(doc.traction_metrics, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Use of Funds */}
                    {doc.use_of_funds && (
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Use of Funds</Label>
                        <p className="text-gray-900 whitespace-pre-wrap">{doc.use_of_funds}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(doc)}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc)}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      {canEdit && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(doc)}
                            className="flex-1"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(doc.id)}
                            className="flex-1 text-destructive"
                            disabled={isMutating && deletingDocumentId === doc.id}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
