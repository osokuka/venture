/**
 * Create Pitch Deck Page
 * Complete form for creating a new pitch deck with all metadata in one place
 * NO MODALS - This is a dedicated page per user requirements
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
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
import { ArrowLeft, Upload, Loader2 } from 'lucide-react';
import { productService } from '../services/productService';
import { ventureService } from '../services/ventureService';
import { 
  sanitizeInput, 
  validateAndSanitizeUrl,
  validateUuid
} from '../utils/security';
import { validatePitchDeckFile } from '../utils/fileValidation';
import { toast } from 'sonner';

// Helper function to normalize sector value from EditProfile format to CreatePitchDeck format
// EditProfile uses: "FinTech", "HealthTech", "AI/ML", "E-commerce", etc. (capitalized, with slashes/spaces)
// CreatePitchDeck uses: "fintech", "healthtech", "ai", "ecommerce", etc. (lowercase, no spaces)
const normalizeSector = (sector: string | undefined): string => {
  if (!sector) return '';
  
  const sectorLower = sector.toLowerCase().trim();
  
  // Map EditProfile sector values to CreatePitchDeck values
  // Handle common variations and formats
  const sectorMap: Record<string, string> = {
    // Direct matches (already lowercase)
    'fintech': 'fintech',
    'healthtech': 'healthtech',
    'edtech': 'edtech',
    'cleantech': 'cleantech',
    'ai': 'ai',
    'saas': 'saas',
    'ecommerce': 'ecommerce',
    'other': 'other',
    // EditProfile format variations
    'ai/ml': 'ai',
    'ai / ml': 'ai',
    'e-commerce': 'ecommerce',
    'e-commerce': 'ecommerce',
    'fin tech': 'fintech',
    'health tech': 'healthtech',
    'ed tech': 'edtech',
    'clean tech': 'cleantech',
    // EditProfile specific values that don't have direct matches
    'enterprise': 'other',
    'consumer': 'other',
    'biotech': 'other',
    'energy': 'other',
  };
  
  // Try exact match first (handles most cases)
  if (sectorMap[sectorLower]) {
    return sectorMap[sectorLower];
  }
  
  // Try partial/fuzzy matches for edge cases
  if (sectorLower.includes('fintech') || sectorLower.includes('fin tech')) return 'fintech';
  if (sectorLower.includes('healthtech') || sectorLower.includes('health tech')) return 'healthtech';
  if (sectorLower.includes('edtech') || sectorLower.includes('ed tech')) return 'edtech';
  if (sectorLower.includes('cleantech') || sectorLower.includes('clean tech')) return 'cleantech';
  if (sectorLower.includes('ai') || sectorLower.includes('ml') || sectorLower.includes('machine learning')) return 'ai';
  if (sectorLower.includes('saas')) return 'saas';
  if (sectorLower.includes('ecommerce') || sectorLower.includes('e-commerce')) return 'ecommerce';
  
  // Default to empty string if no match found (let user select)
  // This is better than defaulting to 'other' which might be incorrect
  console.warn(`Unknown sector value: "${sector}" - not mapping to CreatePitchDeck format`);
  return '';
};

// Component definition
const CreatePitchDeck: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId'); // Optional: if editing existing product
  
  // Ref for file input to programmatically trigger click
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isMutating, setIsMutating] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>(productId || '');
  const [ventureProfile, setVentureProfile] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  
  // Form state - Product fields
  const [productData, setProductData] = useState({
    name: '',
    industry_sector: '',
    website: '',
    linkedin_url: '',
    address: '',
    year_founded: undefined as number | undefined,
    employees_count: undefined as number | undefined,
    short_description: '',
  });

  // Form state - Pitch Deck fields (all in one form)
  const [pitchDeckData, setPitchDeckData] = useState({
    file: null as File | null,
    problem_statement: '',
    solution_description: '',
    target_market: '',
    // Traction metrics broken down into individual fields (instead of JSON)
    traction_users: '',
    traction_revenue: '',
    traction_growth: '',
    traction_custom: '', // For any additional metrics
    funding_amount: '',
    funding_stage: '' as '' | 'PRE_SEED' | 'SEED' | 'SERIES_A' | 'SERIES_B' | 'SERIES_C' | 'GROWTH',
    use_of_funds: '',
  });

  useEffect(() => {
    // Fetch venture profile and products to inherit company data
    const fetchData = async () => {
      setIsLoadingProfile(true);
      try {
        // Fetch both in parallel
        const [profileResult, productsResult] = await Promise.allSettled([
          ventureService.getMyProfile(),
          productService.getMyProducts()
        ]);

        // Handle venture profile
        if (profileResult.status === 'fulfilled' && profileResult.value) {
          const profile = profileResult.value;
          setVentureProfile(profile);
        }

        // Handle products
        if (productsResult.status === 'fulfilled') {
          const data = productsResult.value;
          setProducts(data);
          
          // If productId provided, pre-select it (this takes precedence over profile data)
          if (productId && validateUuid(productId)) {
            const product = data.find((p: any) => p.id === productId);
            if (product) {
              setSelectedProductId(productId);
              setProductData({
                name: product.name,
                industry_sector: product.industry_sector,
                website: product.website,
                linkedin_url: product.linkedin_url,
                address: product.address || '',
                year_founded: product.year_founded,
                employees_count: product.employees_count,
                short_description: product.short_description,
              });
              setIsLoadingProfile(false);
              return; // Don't pre-fill from profile if product is selected
            }
          }
          
          // If no product selected, pre-fill from venture profile
          if (profileResult.status === 'fulfilled' && profileResult.value && !productId) {
            const profile = profileResult.value;
            setProductData({
              name: profile.company_name || '',
              industry_sector: normalizeSector(profile.sector), // Normalize sector value to match Select options
              website: profile.website || '',
              linkedin_url: profile.linkedin_url || '',
              address: profile.address || '',
              year_founded: profile.year_founded,
              employees_count: profile.employees_count,
              short_description: profile.short_description || '',
            });
          }
        } else {
          console.error('Failed to fetch products:', productsResult.reason);
        }
      } catch (err: any) {
        console.error('Failed to fetch data:', err);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchData();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== Form Submit Started ===');
    console.log('Product Data:', productData);
    console.log('Pitch Deck Data:', { ...pitchDeckData, file: pitchDeckData.file ? `File: ${pitchDeckData.file.name}` : 'No file' });

    // Validate pitch deck fields - Company profile must be complete before pitch deck upload
    if (!productData.name || !productData.industry_sector || !productData.website || !productData.linkedin_url || !productData.short_description) {
      console.log('❌ Validation failed: Missing required product fields');
      console.log('Missing fields:', {
        name: !productData.name,
        industry_sector: !productData.industry_sector,
        website: !productData.website,
        linkedin_url: !productData.linkedin_url,
        short_description: !productData.short_description
      });
      
      const missingFields: string[] = [];
      if (!productData.name) missingFields.push('Company Name');
      if (!productData.industry_sector) missingFields.push('Industry Sector');
      if (!productData.website) missingFields.push('Website');
      if (!productData.linkedin_url) missingFields.push('LinkedIn URL');
      if (!productData.short_description) missingFields.push('Short Description');
      
      toast.error(`Please complete your company profile first. Missing: ${missingFields.join(', ')}`);
      return;
    }

    // Validate pitch deck file
    if (!pitchDeckData.file) {
      console.log('❌ Validation failed: No file selected');
      toast.error('Please select a pitch deck file (PDF or PowerPoint)');
      return;
    }

    // Validate file
    const validation = validatePitchDeckFile(pitchDeckData.file);
    if (!validation.isValid) {
      console.log('❌ File validation failed:', validation.error);
      toast.error(validation.error || 'Invalid file');
      return;
    }

    // Validate URLs
    const websiteUrl = validateAndSanitizeUrl(productData.website);
    const linkedinUrl = validateAndSanitizeUrl(productData.linkedin_url);
    if (!websiteUrl || !linkedinUrl) {
      console.log('❌ URL validation failed');
      console.log('Website URL:', productData.website, '→', websiteUrl);
      console.log('LinkedIn URL:', productData.linkedin_url, '→', linkedinUrl);
      toast.error('Please enter valid URLs for website and LinkedIn');
      return;
    }

    console.log('✅ All validations passed, starting submission...');

    try {
      setIsMutating(true);

      // Step 1: Create or get product
      let targetProductId = selectedProductId;
      
      if (!targetProductId) {
        console.log('📝 Creating new product...');
        // Create new product
        const sanitizedProductData = {
          name: sanitizeInput(productData.name, 255),
          industry_sector: productData.industry_sector,
          website: websiteUrl,
          linkedin_url: linkedinUrl,
          address: sanitizeInput(productData.address || '', 500),
          year_founded: productData.year_founded,
          employees_count: productData.employees_count,
          short_description: sanitizeInput(productData.short_description, 1000),
        };

        const newProduct = await productService.createProduct(sanitizedProductData);
        targetProductId = newProduct.id;
        console.log('✅ Product created:', targetProductId);
      } else {
        console.log('📦 Using existing product:', targetProductId);
      }

      // Security: Validate UUID
      if (!validateUuid(targetProductId)) {
        console.log('❌ Invalid product UUID:', targetProductId);
        toast.error('Invalid product ID');
        return;
      }

      // Step 2: Prepare pitch deck metadata
      console.log('📊 Preparing metadata...');
      const metadata: any = {};
      
      if (pitchDeckData.problem_statement.trim()) {
        metadata.problem_statement = sanitizeInput(pitchDeckData.problem_statement, 10000);
      }
      if (pitchDeckData.solution_description.trim()) {
        metadata.solution_description = sanitizeInput(pitchDeckData.solution_description, 10000);
      }
      if (pitchDeckData.target_market.trim()) {
        metadata.target_market = sanitizeInput(pitchDeckData.target_market, 10000);
      }
      if (pitchDeckData.funding_amount.trim()) {
        metadata.funding_amount = sanitizeInput(pitchDeckData.funding_amount, 50);
      }
      if (pitchDeckData.funding_stage) {
        metadata.funding_stage = pitchDeckData.funding_stage;
      }
      if (pitchDeckData.use_of_funds.trim()) {
        metadata.use_of_funds = sanitizeInput(pitchDeckData.use_of_funds, 10000);
      }
      // Build traction metrics object from individual fields
      const tractionMetrics: any = {};
      if (pitchDeckData.traction_users.trim()) {
        tractionMetrics.users = sanitizeInput(pitchDeckData.traction_users, 100);
      }
      if (pitchDeckData.traction_revenue.trim()) {
        tractionMetrics.revenue = sanitizeInput(pitchDeckData.traction_revenue, 100);
      }
      if (pitchDeckData.traction_growth.trim()) {
        tractionMetrics.growth = sanitizeInput(pitchDeckData.traction_growth, 100);
      }
      if (pitchDeckData.traction_custom.trim()) {
        // Parse custom field as JSON if it looks like JSON, otherwise treat as string
        try {
          const parsed = JSON.parse(pitchDeckData.traction_custom);
          Object.assign(tractionMetrics, parsed);
        } catch {
          // If not valid JSON, add as a custom field
          tractionMetrics.custom = sanitizeInput(pitchDeckData.traction_custom, 500);
        }
      }
      if (Object.keys(tractionMetrics).length > 0) {
        metadata.traction_metrics = tractionMetrics;
      }

      // Step 3: Upload pitch deck with metadata
      console.log('📤 Uploading pitch deck...');
      console.log('Metadata:', metadata);
      console.log('File:', pitchDeckData.file.name, pitchDeckData.file.size, 'bytes');
      
      await productService.uploadPitchDeck(
        targetProductId,
        pitchDeckData.file,
        Object.keys(metadata).length > 0 ? metadata : undefined
      );

      console.log('✅ Pitch deck uploaded successfully!');
      toast.success('Pitch deck created successfully!');
      navigate('/dashboard/venture/products');
    } catch (err: any) {
      console.error('❌ Error during submission:', err);
      console.error('Failed to create pitch deck:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to create pitch deck.';
      if (errorMsg.includes('maximum limit')) {
        toast.error('You have reached the maximum limit of 3 products.');
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header - LinkedIn Style */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard/venture/products')}
          className="mb-6 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Pitch Decks
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Create New Pitch Deck</h1>
        <p className="text-sm text-gray-600">
          Complete all sections below to create your pitch deck. You can have up to 3 pitch decks.
        </p>
      </div>

      {/* Complete Form - LinkedIn Style */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Information Section */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-4 border-b border-gray-100">
            <CardTitle className="text-lg font-semibold text-gray-900">Pitch Deck Information</CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">
              Basic company and pitch deck details
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            {/* Product Selection or Creation - LinkedIn Style */}
            {products.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Select Existing Pitch Deck (Optional)</Label>
                <Select
                  value={selectedProductId || undefined}
                  onValueChange={(value) => {
                    // Handle placeholder value for "Create New Product"
                    if (value === '__create_new__') {
                      setSelectedProductId('');
                      // Restore venture profile data when creating new product
                      if (ventureProfile) {
                        setProductData({
                          name: ventureProfile.company_name || '',
                          industry_sector: normalizeSector(ventureProfile.sector), // Normalize sector value
                          website: ventureProfile.website || '',
                          linkedin_url: ventureProfile.linkedin_url || '',
                          address: ventureProfile.address || '',
                          year_founded: ventureProfile.year_founded,
                          employees_count: ventureProfile.employees_count,
                          short_description: ventureProfile.short_description || '',
                        });
                      } else {
                        // If no profile, clear fields
                        setProductData({
                          name: '',
                          industry_sector: '',
                          website: '',
                          linkedin_url: '',
                          address: '',
                          year_founded: undefined,
                          employees_count: undefined,
                          short_description: '',
                        });
                      }
                      return;
                    }
                    setSelectedProductId(value);
                    const product = products.find((p: any) => p.id === value);
                    if (product) {
                      setProductData({
                        name: product.name,
                        industry_sector: product.industry_sector,
                        website: product.website,
                        linkedin_url: product.linkedin_url,
                        address: product.address || '',
                        year_founded: product.year_founded,
                        employees_count: product.employees_count,
                        short_description: product.short_description,
                      });
                    }
                  }}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select existing pitch deck or create new" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__create_new__">Create New Pitch Deck</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Select an existing pitch deck to add a pitch deck, or create a new one below
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Company Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={productData.name}
                  onChange={(e) => setProductData({ ...productData, name: e.target.value })}
                  placeholder="Enter company name"
                  disabled={!!selectedProductId}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Industry Sector <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={productData.industry_sector}
                  onValueChange={(value) => setProductData({ ...productData, industry_sector: value })}
                  disabled={!!selectedProductId}
                >
                  <SelectTrigger className="h-10">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Website <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={productData.website}
                  onChange={(e) => setProductData({ ...productData, website: e.target.value })}
                  placeholder="https://yourcompany.com"
                  disabled={!!selectedProductId}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  LinkedIn URL <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={productData.linkedin_url}
                  onChange={(e) => setProductData({ ...productData, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/company/yourcompany"
                  disabled={!!selectedProductId}
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Short Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={productData.short_description}
                onChange={(e) => setProductData({ ...productData, short_description: e.target.value })}
                placeholder="Brief description of your pitch deck (2-3 sentences)"
                rows={3}
                disabled={!!selectedProductId}
                className="min-h-[80px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Pitch Deck Information Section - LinkedIn Style */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-4 border-b border-gray-100">
            <CardTitle className="text-lg font-semibold text-gray-900">Pitch Deck Information</CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">
              Upload your pitch deck PDF and provide business details
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            {/* Pitch Deck File - LinkedIn Style with Custom Button */}
            <div className="space-y-2">
              <Label htmlFor="file" className="text-sm font-medium text-gray-700">
                Pitch Deck File <span className="text-red-500">*</span>
              </Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  id="file"
                  type="file"
                  accept=".pdf,.ppt,.pptx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setPitchDeckData({ ...pitchDeckData, file });
                    }
                  }}
                  disabled={isMutating}
                  style={{ display: 'none' }}
                />
                {/* Custom upload button */}
                <div className="flex flex-col items-center justify-center gap-3">
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Trigger the hidden file input using ref
                      fileInputRef.current?.click();
                    }}
                    disabled={isMutating}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    style={{ backgroundColor: isMutating ? '#1e40af' : '#2563EB' }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                  {pitchDeckData.file && (
                    <p className="text-sm text-green-600 text-center">
                      ✓ Selected: {pitchDeckData.file.name} ({(pitchDeckData.file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                  {!pitchDeckData.file && (
                    <p className="text-sm text-gray-500 text-center">
                      No file selected
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500">
                PDF or PowerPoint files (.pdf, .ppt, .pptx), maximum 10MB
              </p>
            </div>

            {/* Problem Statement - LinkedIn Style */}
            <div className="space-y-2">
              <Label htmlFor="problem_statement" className="text-sm font-medium text-gray-700">
                Problem Statement
              </Label>
              <Textarea
                id="problem_statement"
                value={pitchDeckData.problem_statement}
                onChange={(e) =>
                  setPitchDeckData({
                    ...pitchDeckData,
                    problem_statement: e.target.value,
                  })
                }
                placeholder="What problem does your product solve? Describe the pain points your target customers face."
                rows={4}
                disabled={isMutating}
                className="min-h-[100px]"
              />
            </div>

            {/* Solution Description - LinkedIn Style */}
            <div className="space-y-2">
              <Label htmlFor="solution_description" className="text-sm font-medium text-gray-700">
                Solution Description
              </Label>
              <Textarea
                id="solution_description"
                value={pitchDeckData.solution_description}
                onChange={(e) =>
                  setPitchDeckData({
                    ...pitchDeckData,
                    solution_description: e.target.value,
                  })
                }
                placeholder="How does your pitch deck solve this problem? Explain your unique approach and value proposition."
                rows={4}
                disabled={isMutating}
                className="min-h-[100px]"
              />
            </div>

            {/* Target Market / Market Size - LinkedIn Style */}
            <div className="space-y-2">
              <Label htmlFor="target_market" className="text-sm font-medium text-gray-700">
                Target Market / Market Size
              </Label>
              <Textarea
                id="target_market"
                value={pitchDeckData.target_market}
                onChange={(e) =>
                  setPitchDeckData({
                    ...pitchDeckData,
                    target_market: e.target.value,
                  })
                }
                placeholder="Describe your target market, customer segments, and total addressable market size."
                rows={4}
                disabled={isMutating}
                className="min-h-[100px]"
              />
            </div>

            {/* Funding Information - LinkedIn Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="funding_amount" className="text-sm font-medium text-gray-700">
                  Investment Size
                </Label>
                <Input
                  id="funding_amount"
                  value={pitchDeckData.funding_amount}
                  onChange={(e) =>
                    setPitchDeckData({
                      ...pitchDeckData,
                      funding_amount: e.target.value,
                    })
                  }
                  placeholder="e.g., $2M, $500K"
                  disabled={isMutating}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="funding_stage" className="text-sm font-medium text-gray-700">
                  Funding Stage
                </Label>
                <Select
                  value={pitchDeckData.funding_stage}
                  onValueChange={(value: any) =>
                    setPitchDeckData({ ...pitchDeckData, funding_stage: value })
                  }
                  disabled={isMutating}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select funding stage" />
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

            {/* Use of Funds - LinkedIn Style */}
            <div className="space-y-2">
              <Label htmlFor="use_of_funds" className="text-sm font-medium text-gray-700">
                Use of Funds
              </Label>
              <Textarea
                id="use_of_funds"
                value={pitchDeckData.use_of_funds}
                onChange={(e) =>
                  setPitchDeckData({
                    ...pitchDeckData,
                    use_of_funds: e.target.value,
                  })
                }
                placeholder="How will the funds be used? (e.g., 40% product development, 30% marketing, 20% team expansion, 10% operations)"
                rows={4}
                disabled={isMutating}
                className="min-h-[100px]"
              />
            </div>

            {/* Traction Metrics - LinkedIn Style with Individual Fields */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Traction Metrics <span className="text-xs text-gray-500">(Optional)</span>
                </Label>
                <p className="text-xs text-gray-500 mt-1 mb-4">
                  Share your key metrics and achievements
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="traction_users" className="text-sm font-medium text-gray-700">
                    Users / Customers
                  </Label>
                  <Input
                    id="traction_users"
                    value={pitchDeckData.traction_users}
                    onChange={(e) =>
                      setPitchDeckData({
                        ...pitchDeckData,
                        traction_users: e.target.value,
                      })
                    }
                    placeholder="e.g., 10,000 active users"
                    disabled={isMutating}
                    className="h-10"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="traction_revenue" className="text-sm font-medium text-gray-700">
                    Revenue / MRR
                  </Label>
                  <Input
                    id="traction_revenue"
                    value={pitchDeckData.traction_revenue}
                    onChange={(e) =>
                      setPitchDeckData({
                        ...pitchDeckData,
                        traction_revenue: e.target.value,
                      })
                    }
                    placeholder="e.g., $50K/month, $1M ARR"
                    disabled={isMutating}
                    className="h-10"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="traction_growth" className="text-sm font-medium text-gray-700">
                    Growth Rate
                  </Label>
                  <Input
                    id="traction_growth"
                    value={pitchDeckData.traction_growth}
                    onChange={(e) =>
                      setPitchDeckData({
                        ...pitchDeckData,
                        traction_growth: e.target.value,
                      })
                    }
                    placeholder="e.g., 20% MoM, 300% YoY"
                    disabled={isMutating}
                    className="h-10"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="traction_custom" className="text-sm font-medium text-gray-700">
                    Additional Metrics
                  </Label>
                  <Input
                    id="traction_custom"
                    value={pitchDeckData.traction_custom}
                    onChange={(e) =>
                      setPitchDeckData({
                        ...pitchDeckData,
                        traction_custom: e.target.value,
                      })
                    }
                    placeholder="e.g., 50 enterprise clients, 95% retention"
                    disabled={isMutating}
                    className="h-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions - LinkedIn Style */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard/venture/products')}
            disabled={isMutating}
            className="px-6 h-10 font-medium"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isMutating}
            className="px-6 h-10 font-medium bg-blue-600 hover:bg-blue-700 text-white"
            style={{ backgroundColor: isMutating ? '#1e40af' : '#2563EB' }} // Force blue background - fixes transparent bg issue
          >
            {isMutating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Create Pitch Deck
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

// Default export for component
export default CreatePitchDeck;
