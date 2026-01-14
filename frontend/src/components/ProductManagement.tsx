/**
 * Product Management Component
 * Handles CRUD operations for venture products (max 3 per user)
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
  sanitizeFormData 
} from '../utils/security';

interface ProductManagementProps {
  user: any;
}

export function ProductManagement({ user }: ProductManagementProps) {
  const [products, setProducts] = useState<VentureProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<VentureProduct | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [activeTab, setActiveTab] = useState<'company' | 'team' | 'founders' | 'documents'>('company');
  
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

  const handleCreate = async () => {
    if (!formData.name || !formData.industry_sector || !formData.website || !formData.linkedin_url) {
      alert('Please fill in all required fields (name, industry, website, LinkedIn).');
      return;
    }

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
      await productService.createProduct(sanitizedData);
      setCreateDialogOpen(false);
      resetForm();
      await fetchProducts();
      alert('Product created successfully! You can now submit it for approval.');
    } catch (err: any) {
      console.error('Failed to create product:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to create product.';
      if (errorMsg.includes('maximum limit')) {
        alert('You have reached the maximum limit of 3 products.');
      } else {
        alert(errorMsg);
      }
    } finally {
      setIsMutating(false);
    }
  };

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
      setEditDialogOpen(false);
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
    } catch (err: any) {
      console.error('Failed to toggle product:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to update product status.';
      alert(errorMsg);
    } finally {
      setIsMutating(false);
    }
  };

  const handleSubmit = async (product: VentureProduct) => {
    if (!confirm(`Submit ${product.name} for admin approval?`)) {
      return;
    }

    try {
      setIsMutating(true);
      await productService.submitProduct(product.id);
      await fetchProducts();
      alert('Product submitted for approval!');
    } catch (err: any) {
      console.error('Failed to submit product:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to submit product.';
      alert(errorMsg);
    } finally {
      setIsMutating(false);
    }
  };

  const openEditDialog = (product: VentureProduct) => {
    setSelectedProduct(product);
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
    setEditDialogOpen(true);
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

  // Open manage dialog and load product details
  const openManageDialog = async (product: VentureProduct) => {
    setSelectedProduct(product);
    setManageDialogOpen(true);
    setActiveTab('company');
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
    
    try {
      setIsMutating(true);
      await productService.createTeamMember(selectedProduct.id, teamMemberForm);
      setTeamMemberForm({ name: '', role_title: '', description: '', linkedin_url: '' });
      await loadProductDetails(selectedProduct.id);
    } catch (err: any) {
      console.error('Failed to create team member:', err);
      alert(err.response?.data?.detail || err.message || 'Failed to create team member.');
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
    
    try {
      setIsMutating(true);
      await productService.deleteTeamMember(selectedProduct.id, memberId);
      await loadProductDetails(selectedProduct.id);
    } catch (err: any) {
      console.error('Failed to delete team member:', err);
      alert(err.response?.data?.detail || err.message || 'Failed to delete team member.');
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
    
    try {
      setIsMutating(true);
      await productService.createFounder(selectedProduct.id, founderForm);
      setFounderForm({ full_name: '', linkedin_url: '', email: '', phone: '', role_title: '' });
      await loadProductDetails(selectedProduct.id);
    } catch (err: any) {
      console.error('Failed to create founder:', err);
      alert(err.response?.data?.detail || err.message || 'Failed to create founder.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleUpdateFounder = async () => {
    if (!selectedProduct || !editingFounder) return;
    
    try {
      setIsMutating(true);
      await productService.updateFounder(selectedProduct.id, editingFounder.id, founderForm);
      setEditingFounder(null);
      setFounderForm({ full_name: '', linkedin_url: '', email: '', phone: '', role_title: '' });
      await loadProductDetails(selectedProduct.id);
    } catch (err: any) {
      console.error('Failed to update founder:', err);
      alert(err.response?.data?.detail || err.message || 'Failed to update founder.');
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Products</CardTitle>
              <CardDescription>
                Manage your venture products (up to 3). Create, activate, and submit for approval.
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setCreateDialogOpen(true);
              }}
              disabled={products.length >= 3 || isLoading || isMutating}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Product {products.length >= 3 && '(Max 3)'}
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
              <p className="text-lg font-medium">No products yet</p>
              <p className="text-sm mt-2">Create your first venture product to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
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
                    <div className="space-y-3">
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
                      <div className="pt-3 border-t space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => openManageDialog(product)}
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Product Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Product</DialogTitle>
            <DialogDescription>
              Create a new venture product. You can have up to 3 products.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Product Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: sanitizeInput(e.target.value, 255) })}
                  placeholder="Company/Product name"
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Website *</Label>
                <Input
                  value={formData.website}
                  onChange={(e) => {
                    const sanitized = sanitizeInput(e.target.value, 2048);
                    setFormData({ ...formData, website: sanitized });
                  }}
                  placeholder="https://yourcompany.com"
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
                  placeholder="https://linkedin.com/company/yourcompany"
                />
              </div>
            </div>

            <div>
              <Label>Short Description *</Label>
              <Textarea
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: sanitizeInput(e.target.value, 1000) })}
                placeholder="Brief description of your product"
                rows={2}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Business information fields (target market, problem statement, 
                solution, traction, funding, and use of funds) are now associated with each pitch deck 
                document. You can add these details when uploading pitch decks.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={isMutating}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isMutating}>
              {isMutating ? 'Creating...' : 'Create Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product details. Only DRAFT or REJECTED products can be edited.
            </DialogDescription>
          </DialogHeader>

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

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isMutating}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isMutating}>
              {isMutating ? 'Updating...' : 'Update Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Product Dialog - Comprehensive management with tabs */}
      <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Product: {selectedProduct?.name}</DialogTitle>
            <DialogDescription>
              Manage company data, team members, founders, and pitch decks for this product.
            </DialogDescription>
          </DialogHeader>

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
            {activeTab === 'documents' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Pitch Decks</h3>
                  {selectedProduct && canEdit(selectedProduct) && (
                    <div>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !selectedProduct) return;
                          
                          try {
                            setIsMutating(true);
                            await productService.uploadPitchDeck(selectedProduct.id, file);
                            await loadProductDetails(selectedProduct.id);
                            alert('Pitch deck uploaded successfully!');
                          } catch (err: any) {
                            console.error('Failed to upload pitch deck:', err);
                            alert(err.response?.data?.detail || err.message || 'Failed to upload pitch deck.');
                          } finally {
                            setIsMutating(false);
                            e.target.value = ''; // Reset input
                          }
                        }}
                        className="hidden"
                        id="pitch-deck-upload"
                        disabled={isMutating}
                      />
                      <Button
                        size="sm"
                        onClick={() => document.getElementById('pitch-deck-upload')?.click()}
                        disabled={isMutating}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Upload Pitch Deck
                      </Button>
                    </div>
                  )}
                </div>

                {isLoadingDetails ? (
                  <div className="text-center py-8">Loading...</div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No pitch decks uploaded yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <Card key={doc.id}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-semibold">{doc.document_type === 'PITCH_DECK' ? 'Pitch Deck' : doc.document_type}</h4>
                              <p className="text-sm text-gray-500">
                                {(doc.file_size / 1024 / 1024).toFixed(2)} MB • Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                              </p>
                            </div>
                            {selectedProduct && canEdit(selectedProduct) && (
                              <div className="flex gap-2">
                                {doc.file && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(doc.file, '_blank')}
                                  >
                                    View
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    if (!selectedProduct || !confirm('Delete this pitch deck?')) return;
                                    try {
                                      setIsMutating(true);
                                      await productService.deleteProductDocument(selectedProduct.id, doc.id);
                                      await loadProductDetails(selectedProduct.id);
                                    } catch (err: any) {
                                      console.error('Failed to delete document:', err);
                                      alert(err.response?.data?.detail || err.message || 'Failed to delete document.');
                                    } finally {
                                      setIsMutating(false);
                                    }
                                  }}
                                  disabled={isMutating}
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setManageDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
