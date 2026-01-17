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
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Power,
  PowerOff,
  Send,
  Users,
  UserPlus,
  Settings,
  FileText,
} from 'lucide-react';
import { 
  productService, 
  type VentureProduct, 
  type ProductCreatePayload,
  type TeamMember,
  type TeamMemberCreatePayload,
  type Founder,
  type FounderCreatePayload
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
import { Download, Share2, BarChart3, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import { PitchDeckCRUD } from './PitchDeckCRUD';

interface ProductManagementProps {
  user: any;
  defaultTab?: 'company' | 'team' | 'founders' | 'documents';
  autoOpenProductId?: string; // If provided, auto-open manage dialog for this product
}

export function ProductManagement({ user, defaultTab = 'company', autoOpenProductId }: ProductManagementProps) {
  const navigate = useNavigate(); // Initialize navigate hook
  const [products, setProducts] = useState<VentureProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Inline display state (no modals per NO_MODALS_RULE.md)
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [managingProductId, setManagingProductId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<VentureProduct | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [activeTab, setActiveTab] = useState<'company' | 'team' | 'founders' | 'documents'>(defaultTab);
  
  // Team member and founder state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [founders, setFounders] = useState<Founder[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  // Form states for team members and founders
  const [teamMemberForm, setTeamMemberForm] = useState<TeamMemberCreatePayload>({
    name: '',
    role_title: '',
    description: '',
    linkedin_url: '',
  });
  const [founderForm, setFounderForm] = useState<FounderCreatePayload>({
    full_name: '',
    linkedin_url: '',
    email: '',
    phone: '',
    role_title: '',
  });
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);
  const [editingFounder, setEditingFounder] = useState<Founder | null>(null);
  
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
  const [formData, setFormData] = useState<ProductCreatePayload>({
    name: '',
    industry_sector: '',
    website: '',
    linkedin_url: '',
    address: '',
    year_founded: undefined,
    employees_count: undefined,
    short_description: '',
  });

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, []);

  // Auto-open manage dialog for specified product when products are loaded
  useEffect(() => {
    if (autoOpenProductId && products.length > 0 && !isLoading) {
      const product = products.find(p => p.id === autoOpenProductId);
      if (product) {
        // Open with the default tab (documents for pitch deck creation)
        openManageDialog(product, defaultTab);
      }
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

    // Security: Sanitize form data before submission
    const sanitizedData = sanitizeFormData(formData, {
      name: 255,
      industry_sector: 100,
      website: 2048,
      linkedin_url: 2048,
      address: 500,
      short_description: 1000,
    });

    // Validate URLs
    const websiteUrl = validateAndSanitizeUrl(sanitizedData.website);
    const linkedinUrl = validateAndSanitizeUrl(sanitizedData.linkedin_url);
    
    if (!websiteUrl || !linkedinUrl) {
      alert('Please provide valid URLs for website and LinkedIn.');
      return;
    }

    sanitizedData.website = websiteUrl;
    sanitizedData.linkedin_url = linkedinUrl;

    try {
      setIsMutating(true);
      await productService.updateProduct(selectedProduct.id, sanitizedData);
      setEditingProductId(null);
      setSelectedProduct(null);
      resetForm();
      await fetchProducts();
      alert('Product updated successfully!');
    } catch (err: any) {
      console.error('Failed to update product:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to update product.';
      alert(errorMsg);
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
    if (!confirm(`Submit ${product.name} for admin approval?`)) {
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
      toast.success('Product submitted for approval!');
    } catch (err: any) {
      console.error('Failed to submit product:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to submit product.';
      toast.error(errorMsg);
    } finally {
      setIsMutating(false);
    }
  };

  const openEditDialog = (product: VentureProduct) => {
    setSelectedProduct(product);
    setEditingProductId(product.id);
    setFormData({
      name: product.name,
      industry_sector: product.industry_sector,
      website: product.website,
      linkedin_url: product.linkedin_url,
      address: product.address || '',
      year_founded: product.year_founded || undefined,
      employees_count: product.employees_count || undefined,
      short_description: product.short_description,
      // Note: Business information fields are now associated with pitch deck documents
    });
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
    });
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

  // Open manage view inline and load product details
  const openManageDialog = async (product: VentureProduct, tab: 'company' | 'team' | 'founders' | 'documents' = 'company') => {
    setSelectedProduct(product);
    setManagingProductId(product.id);
    setActiveTab(tab);
    await loadProductDetails(product.id);
  };

  const loadProductDetails = async (productId: string) => {
    setIsLoadingDetails(true);
    try {
      const [teamMembersData, foundersData, documentsData] = await Promise.all([
        productService.getTeamMembers(productId),
        productService.getFounders(productId),
        productService.getProductDocuments(productId),
      ]);
      setTeamMembers(teamMembersData);
      setFounders(foundersData);
      setDocuments(documentsData);
    } catch (err: any) {
      console.error('Failed to load product details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Team Member handlers
  const handleCreateTeamMember = async () => {
    if (!selectedProduct) return;
    
    // Security: Validate UUID
    if (!validateUuid(selectedProduct.id)) {
      toast.error('Invalid product ID');
      return;
    }

    // Security: Sanitize form data
    const sanitizedForm = sanitizeFormData(teamMemberForm, {
      name: 255,
      role_title: 100,
      description: 5000,
      linkedin_url: 2048,
    });

    // Security: Validate LinkedIn URL if provided
    if (sanitizedForm.linkedin_url) {
      const validatedUrl = validateAndSanitizeUrl(sanitizedForm.linkedin_url);
      if (!validatedUrl) {
        toast.error('Invalid LinkedIn URL');
        return;
      }
      sanitizedForm.linkedin_url = validatedUrl;
    }
    
    try {
      setIsMutating(true);
      await productService.createTeamMember(selectedProduct.id, sanitizedForm);
      setTeamMemberForm({ name: '', role_title: '', description: '', linkedin_url: '' });
      await loadProductDetails(selectedProduct.id);
      toast.success('Team member created successfully!');
    } catch (err: any) {
      console.error('Failed to create team member:', err);
      toast.error(err.response?.data?.detail || err.message || 'Failed to create team member.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleUpdateTeamMember = async () => {
    if (!selectedProduct || !editingTeamMember) return;
    
    try {
      setIsMutating(true);
      await productService.updateTeamMember(selectedProduct.id, editingTeamMember.id, teamMemberForm);
      setEditingTeamMember(null);
      setTeamMemberForm({ name: '', role_title: '', description: '', linkedin_url: '' });
      await loadProductDetails(selectedProduct.id);
    } catch (err: any) {
      console.error('Failed to update team member:', err);
      alert(err.response?.data?.detail || err.message || 'Failed to update team member.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleDeleteTeamMember = async (memberId: string) => {
    if (!selectedProduct || !confirm('Delete this team member?')) return;
    
    // Security: Validate UUIDs
    if (!validateUuid(selectedProduct.id) || !validateUuid(memberId)) {
      toast.error('Invalid product or team member ID');
      return;
    }
    
    try {
      setIsMutating(true);
      await productService.deleteTeamMember(selectedProduct.id, memberId);
      await loadProductDetails(selectedProduct.id);
      toast.success('Team member deleted successfully!');
    } catch (err: any) {
      console.error('Failed to delete team member:', err);
      toast.error(err.response?.data?.detail || err.message || 'Failed to delete team member.');
    } finally {
      setIsMutating(false);
    }
  };

  const startEditTeamMember = (member: TeamMember) => {
    setEditingTeamMember(member);
    setTeamMemberForm({
      name: member.name,
      role_title: member.role_title,
      description: member.description || '',
      linkedin_url: member.linkedin_url || '',
    });
  };

  // Founder handlers
  const handleCreateFounder = async () => {
    if (!selectedProduct) return;
    
    // Security: Validate UUID
    if (!validateUuid(selectedProduct.id)) {
      toast.error('Invalid product ID');
      return;
    }

    // Security: Sanitize and validate form data
    const sanitizedForm = sanitizeFormData(founderForm, {
      full_name: 255,
      linkedin_url: 2048,
      email: 254,
      phone: 20,
      role_title: 100,
    });

    // Security: Validate URLs and email
    const validatedLinkedInUrl = validateAndSanitizeUrl(sanitizedForm.linkedin_url);
    if (!validatedLinkedInUrl) {
      toast.error('Invalid LinkedIn URL');
      return;
    }
    sanitizedForm.linkedin_url = validatedLinkedInUrl;

    // Security: Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedForm.email)) {
      toast.error('Invalid email format');
      return;
    }
    
    try {
      setIsMutating(true);
      await productService.createFounder(selectedProduct.id, sanitizedForm);
      setFounderForm({ full_name: '', linkedin_url: '', email: '', phone: '', role_title: '' });
      await loadProductDetails(selectedProduct.id);
      toast.success('Founder created successfully!');
    } catch (err: any) {
      console.error('Failed to create founder:', err);
      toast.error(err.response?.data?.detail || err.message || 'Failed to create founder.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleUpdateFounder = async () => {
    if (!selectedProduct || !editingFounder) return;
    
    // Security: Validate UUIDs
    if (!validateUuid(selectedProduct.id) || !validateUuid(editingFounder.id)) {
      toast.error('Invalid product or founder ID');
      return;
    }

    // Security: Sanitize and validate form data
    const sanitizedForm = sanitizeFormData(founderForm, {
      full_name: 255,
      linkedin_url: 2048,
      email: 254,
      phone: 20,
      role_title: 100,
    });

    // Security: Validate URLs and email
    const validatedLinkedInUrl = validateAndSanitizeUrl(sanitizedForm.linkedin_url);
    if (!validatedLinkedInUrl) {
      toast.error('Invalid LinkedIn URL');
      return;
    }
    sanitizedForm.linkedin_url = validatedLinkedInUrl;

    // Security: Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedForm.email)) {
      toast.error('Invalid email format');
      return;
    }
    
    try {
      setIsMutating(true);
      await productService.updateFounder(selectedProduct.id, editingFounder.id, sanitizedForm);
      setEditingFounder(null);
      setFounderForm({ full_name: '', linkedin_url: '', email: '', phone: '', role_title: '' });
      await loadProductDetails(selectedProduct.id);
      toast.success('Founder updated successfully!');
    } catch (err: any) {
      console.error('Failed to update founder:', err);
      toast.error(err.response?.data?.detail || err.message || 'Failed to update founder.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleDeleteFounder = async (founderId: string) => {
    if (!selectedProduct || !confirm('Delete this founder?')) return;
    
    try {
      setIsMutating(true);
      await productService.deleteFounder(selectedProduct.id, founderId);
      await loadProductDetails(selectedProduct.id);
    } catch (err: any) {
      console.error('Failed to delete founder:', err);
      alert(err.response?.data?.detail || err.message || 'Failed to delete founder.');
    } finally {
      setIsMutating(false);
    }
  };

  const startEditFounder = (founder: Founder) => {
    setEditingFounder(founder);
    setFounderForm({
      full_name: founder.full_name,
      linkedin_url: founder.linkedin_url,
      email: founder.email,
      phone: founder.phone || '',
      role_title: founder.role_title || '',
    });
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
                Manage your pitch decks (up to 3). Create, activate, and submit for approval.
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                // Get pitch deck document for this product
                const pitchDeck = product.documents?.find((doc: any) => doc.document_type === 'PITCH_DECK');
                
                return (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <CardDescription className="mt-1">{product.industry_sector}</CardDescription>
                      </div>
                      {getStatusBadge(product.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Basic Info */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Status:</span>
                          <span className="font-medium">{product.status}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Active:</span>
                          <Badge variant={product.is_active ? 'default' : 'outline'}>
                            {product.is_active ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                      </div>

                      {/* Pitch Deck Information */}
                      {pitchDeck && (
                        <div className="pt-3 border-t space-y-3">
                          <h4 className="text-sm font-semibold text-gray-900">Pitch Deck Information</h4>
                          
                          {/* Problem Statement */}
                          {pitchDeck.problem_statement && (
                            <div>
                              <Label className="text-xs font-semibold text-gray-700">Problem Statement</Label>
                              <p className="text-sm text-gray-900 mt-1 line-clamp-2">{pitchDeck.problem_statement}</p>
                            </div>
                          )}

                          {/* Solution Description */}
                          {pitchDeck.solution_description && (
                            <div>
                              <Label className="text-xs font-semibold text-gray-700">Solution</Label>
                              <p className="text-sm text-gray-900 mt-1 line-clamp-2">{pitchDeck.solution_description}</p>
                            </div>
                          )}

                          {/* Target Market */}
                          {pitchDeck.target_market && (
                            <div>
                              <Label className="text-xs font-semibold text-gray-700">Target Market</Label>
                              <p className="text-sm text-gray-900 mt-1 line-clamp-2">{pitchDeck.target_market}</p>
                            </div>
                          )}

                          {/* Funding Information */}
                          {(pitchDeck.funding_amount || pitchDeck.funding_stage) && (
                            <div className="grid grid-cols-2 gap-2">
                              {pitchDeck.funding_amount && (
                                <div>
                                  <Label className="text-xs font-semibold text-gray-700">Investment Size</Label>
                                  <p className="text-sm text-gray-900 mt-1">{pitchDeck.funding_amount}</p>
                                </div>
                              )}
                              {pitchDeck.funding_stage && (
                                <div>
                                  <Label className="text-xs font-semibold text-gray-700">Funding Stage</Label>
                                  <p className="text-sm text-gray-900 mt-1">{pitchDeck.funding_stage.replace('_', ' ')}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Traction Metrics */}
                          {pitchDeck.traction_metrics && (
                            <div>
                              <Label className="text-xs font-semibold text-gray-700">Traction Metrics</Label>
                              <div className="text-sm text-gray-900 mt-1">
                                {typeof pitchDeck.traction_metrics === 'object' ? (
                                  <div className="space-y-1">
                                    {Object.entries(pitchDeck.traction_metrics).slice(0, 3).map(([key, value]) => (
                                      <div key={key} className="flex justify-between">
                                        <span className="text-gray-600">{key}:</span>
                                        <span className="font-medium">{String(value)}</span>
                                      </div>
                                    ))}
                                    {Object.keys(pitchDeck.traction_metrics).length > 3 && (
                                      <p className="text-xs text-gray-500">
                                        +{Object.keys(pitchDeck.traction_metrics).length - 3} more metrics
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <p>{String(pitchDeck.traction_metrics)}</p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Use of Funds */}
                          {pitchDeck.use_of_funds && (
                            <div>
                              <Label className="text-xs font-semibold text-gray-700">Use of Funds</Label>
                              <p className="text-sm text-gray-900 mt-1 line-clamp-2">{pitchDeck.use_of_funds}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {!pitchDeck && (
                        <div className="pt-3 border-t">
                          <p className="text-xs text-gray-500 text-center">No pitch deck uploaded yet</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="pt-3 border-t space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => openManageDialog(product, 'company')}
                          disabled={isMutating}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Manage
                        </Button>
                        {canEdit(product) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => openEditDialog(product)}
                            disabled={isMutating}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Company Data
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
                        {(product.status === 'DRAFT' || product.status === 'REJECTED') && (
                          <Button
                            variant="default"
                            size="sm"
                            className="w-full"
                            onClick={() => handleSubmit(product)}
                            disabled={isMutating}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Submit for Approval
                          </Button>
                        )}
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
                <CardTitle>Edit Product</CardTitle>
                <CardDescription>
                  Update product details. Only DRAFT or REJECTED products can be edited.
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Product Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: sanitizeInput(e.target.value, 255) })}
                />
              </div>
              <div>
                <Label>Industry Sector *</Label>
                <Select
                  value={formData.industry_sector}
                  onValueChange={(value) => setFormData({ ...formData, industry_sector: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Website *</Label>
                <Input
                  value={formData.website}
                  onChange={(e) => {
                    const sanitized = sanitizeInput(e.target.value, 2048);
                    setFormData({ ...formData, website: sanitized });
                  }}
                />
              </div>
              <div>
                <Label>LinkedIn URL *</Label>
                <Input
                  value={formData.linkedin_url}
                  onChange={(e) => {
                    const sanitized = sanitizeInput(e.target.value, 2048);
                    setFormData({ ...formData, linkedin_url: sanitized });
                  }}
                />
              </div>
            </div>

            <div>
              <Label>Short Description *</Label>
              <Textarea
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: sanitizeInput(e.target.value, 1000) })}
                rows={2}
              />
            </div>

            <div>
              <Label>Problem Statement *</Label>
              <Textarea
                value={formData.problem_statement}
                onChange={(e) => setFormData({ ...formData, problem_statement: sanitizeInput(e.target.value, 5000) })}
                rows={3}
              />
            </div>

            <div>
              <Label>Solution Description *</Label>
              <Textarea
                value={formData.solution_description}
                onChange={(e) => setFormData({ ...formData, solution_description: sanitizeInput(e.target.value, 5000) })}
                rows={3}
              />
            </div>

            <div>
              <Label>Target Market *</Label>
              <Textarea
                value={formData.target_market}
                onChange={(e) => setFormData({ ...formData, target_market: sanitizeInput(e.target.value, 2000) })}
                rows={2}
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
              <Button onClick={handleUpdate} disabled={isMutating}>
                {isMutating ? 'Updating...' : 'Update Product'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manage Product View - Inline (No Modal) */}
      {managingProductId && selectedProduct && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Manage Product: {selectedProduct.name}</CardTitle>
                <CardDescription>
                  Manage company data, team members, founders, and pitch decks for this product.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setManagingProductId(null);
                  setSelectedProduct(null);
                  setActiveTab('company');
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>

          {/* Tabs */}
          <div className="flex border-b mb-4">
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'company' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('company')}
            >
              Company Data
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'team' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('team')}
            >
              Team Members
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'founders' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('founders')}
            >
              Founders
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'documents' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('documents')}
            >
              Pitch Decks
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {/* Company Data Tab */}
            {activeTab === 'company' && selectedProduct && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Product Name</Label>
                    <Input value={selectedProduct.name} disabled />
                  </div>
                  <div>
                    <Label>Industry Sector</Label>
                    <Input value={selectedProduct.industry_sector} disabled />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Website</Label>
                    <Input value={selectedProduct.website} disabled />
                  </div>
                  <div>
                    <Label>LinkedIn URL</Label>
                    <Input value={selectedProduct.linkedin_url} disabled />
                  </div>
                </div>
                <div>
                  <Label>Address</Label>
                  <Textarea value={selectedProduct.address || ''} disabled rows={2} />
                </div>
                <div>
                  <Label>Short Description</Label>
                  <Textarea value={selectedProduct.short_description} disabled rows={3} />
                </div>
                <p className="text-sm text-gray-500">
                  Use the "Edit Company Data" button to modify company information.
                </p>
              </div>
            )}

            {/* Team Members Tab */}
            {activeTab === 'team' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Team Members</h3>
                  {selectedProduct && canEdit(selectedProduct) && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingTeamMember(null);
                        setTeamMemberForm({ name: '', role_title: '', description: '', linkedin_url: '' });
                      }}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Team Member
                    </Button>
                  )}
                </div>

                {/* Add/Edit Team Member Form */}
                {selectedProduct && canEdit(selectedProduct) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        {editingTeamMember ? 'Edit Team Member' : 'Add Team Member'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Name *</Label>
                          <Input
                            value={teamMemberForm.name}
                            onChange={(e) => setTeamMemberForm({ ...teamMemberForm, name: sanitizeInput(e.target.value, 255) })}
                            placeholder="Full name"
                          />
                        </div>
                        <div>
                          <Label>Role Title *</Label>
                          <Input
                            value={teamMemberForm.role_title}
                            onChange={(e) => setTeamMemberForm({ ...teamMemberForm, role_title: sanitizeInput(e.target.value, 100) })}
                            placeholder="e.g., CTO, Head of Marketing"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={teamMemberForm.description}
                          onChange={(e) => setTeamMemberForm({ ...teamMemberForm, description: sanitizeInput(e.target.value, 1000) })}
                          placeholder="Brief description of role and responsibilities"
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label>LinkedIn URL</Label>
                        <Input
                          value={teamMemberForm.linkedin_url}
                          onChange={(e) => {
                            const sanitized = sanitizeInput(e.target.value, 2048);
                            setTeamMemberForm({ ...teamMemberForm, linkedin_url: sanitized });
                          }}
                          placeholder="https://linkedin.com/in/username"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={editingTeamMember ? handleUpdateTeamMember : handleCreateTeamMember}
                          disabled={isMutating || !teamMemberForm.name || !teamMemberForm.role_title}
                        >
                          {editingTeamMember ? 'Update' : 'Add'} Team Member
                        </Button>
                        {editingTeamMember && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingTeamMember(null);
                              setTeamMemberForm({ name: '', role_title: '', description: '', linkedin_url: '' });
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Team Members List */}
                {isLoadingDetails ? (
                  <div className="text-center py-8">Loading...</div>
                ) : teamMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No team members added yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {teamMembers.map((member) => (
                      <Card key={member.id}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold">{member.name}</h4>
                              <p className="text-sm text-gray-600">{member.role_title}</p>
                              {member.description && (
                                <p className="text-sm text-gray-500 mt-1">{member.description}</p>
                              )}
                              {member.linkedin_url && (
                                <a
                                  href={member.linkedin_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline"
                                >
                                  LinkedIn Profile
                                </a>
                              )}
                            </div>
                            {selectedProduct && canEdit(selectedProduct) && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEditTeamMember(member)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteTeamMember(member.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Founders Tab */}
            {activeTab === 'founders' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Founders</h3>
                  {selectedProduct && canEdit(selectedProduct) && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingFounder(null);
                        setFounderForm({ full_name: '', linkedin_url: '', email: '', phone: '', role_title: '' });
                      }}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Founder
                    </Button>
                  )}
                </div>

                {/* Add/Edit Founder Form */}
                {selectedProduct && canEdit(selectedProduct) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        {editingFounder ? 'Edit Founder' : 'Add Founder'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Full Name *</Label>
                          <Input
                            value={founderForm.full_name}
                            onChange={(e) => setFounderForm({ ...founderForm, full_name: sanitizeInput(e.target.value, 255) })}
                            placeholder="Full name"
                          />
                        </div>
                        <div>
                          <Label>Email *</Label>
                          <Input
                            type="email"
                            value={founderForm.email}
                            onChange={(e) => setFounderForm({ ...founderForm, email: sanitizeInput(e.target.value, 255) })}
                            placeholder="email@example.com"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>LinkedIn URL *</Label>
                          <Input
                            value={founderForm.linkedin_url}
                            onChange={(e) => {
                              const sanitized = sanitizeInput(e.target.value, 2048);
                              setFounderForm({ ...founderForm, linkedin_url: sanitized });
                            }}
                            placeholder="https://linkedin.com/in/username"
                          />
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <Input
                            value={founderForm.phone}
                            onChange={(e) => setFounderForm({ ...founderForm, phone: sanitizeInput(e.target.value, 20) })}
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Role Title</Label>
                        <Input
                          value={founderForm.role_title}
                          onChange={(e) => setFounderForm({ ...founderForm, role_title: sanitizeInput(e.target.value, 100) })}
                          placeholder="e.g., CEO, Co-Founder"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={editingFounder ? handleUpdateFounder : handleCreateFounder}
                          disabled={isMutating || !founderForm.full_name || !founderForm.linkedin_url || !founderForm.email}
                        >
                          {editingFounder ? 'Update' : 'Add'} Founder
                        </Button>
                        {editingFounder && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingFounder(null);
                              setFounderForm({ full_name: '', linkedin_url: '', email: '', phone: '', role_title: '' });
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Founders List */}
                {isLoadingDetails ? (
                  <div className="text-center py-8">Loading...</div>
                ) : founders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No founders added yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {founders.map((founder) => (
                      <Card key={founder.id}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold">{founder.full_name}</h4>
                              {founder.role_title && (
                                <p className="text-sm text-gray-600">{founder.role_title}</p>
                              )}
                              <p className="text-sm text-gray-500 mt-1">{founder.email}</p>
                              {founder.phone && (
                                <p className="text-sm text-gray-500">{founder.phone}</p>
                              )}
                              {founder.linkedin_url && (
                                <a
                                  href={founder.linkedin_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline"
                                >
                                  LinkedIn Profile
                                </a>
                              )}
                            </div>
                            {selectedProduct && canEdit(selectedProduct) && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEditFounder(founder)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteFounder(founder.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Pitch Decks Tab */}
            {activeTab === 'documents' && selectedProduct && (
              <PitchDeckCRUD
                productId={selectedProduct.id}
                productStatus={selectedProduct.status}
                onUpdate={() => {
                  loadProductDetails(selectedProduct.id);
                }}
              />
            )}
          </div>

            <div className="mt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setManagingProductId(null);
                  setSelectedProduct(null);
                  setActiveTab('company'); // Reset tab when closing
                }}
              >
                Close
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
