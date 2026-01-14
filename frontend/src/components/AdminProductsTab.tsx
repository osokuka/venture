/**
 * Admin Products Management Tab Component
 * Handles product listing, filtering, and admin actions (delete)
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Building,
  Search,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Power,
  PowerOff,
} from 'lucide-react';
import apiClient from '../services/api';
import { Alert, AlertDescription } from './ui/alert';

interface ProductListItem {
  id: string;
  name: string;
  user_email: string;
  user_name: string;
  industry_sector: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  is_active: boolean;
  created_at: string;
}

interface AdminProductsTabProps {
  stats: {
    totalVentures: number;
  };
}

export function AdminProductsTab({ stats }: AdminProductsTabProps) {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'>('ALL');
  const [filterActive, setFilterActive] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isMutating, setIsMutating] = useState(false);

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, [currentPage, filterStatus, filterActive, searchQuery]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params: any = { page: currentPage };
      
      if (filterStatus !== 'ALL') {
        params.status = filterStatus;
      }
      
      if (filterActive !== 'ALL') {
        params.is_active = filterActive === 'ACTIVE';
      }
      
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await apiClient.get('/admin/products', { params });
      setProducts(response.data.results || response.data);
      setTotalCount(response.data.count || response.data.length);
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      setError('Failed to load products. Please try again.');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (product: ProductListItem) => {
    if (!confirm(`Delete product "${product.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsMutating(true);
      await apiClient.delete(`/admin/products/${product.id}`);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setTotalCount((c) => Math.max(0, c - 1));
      alert('Product deleted successfully.');
    } catch (err: any) {
      console.error('Failed to delete product:', err);
      alert('Failed to delete product. Please try again.');
    } finally {
      setIsMutating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'SUBMITTED':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'DRAFT':
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Product Management</CardTitle>
          <CardDescription>
            Manage all venture products. Admin can delete products.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by product name or user email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['ALL', 'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'] as const).map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setFilterStatus(status);
                    setCurrentPage(1);
                  }}
                >
                  {status === 'ALL' ? 'All Status' : status}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((active) => (
                <Button
                  key={active}
                  variant={filterActive === active ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setFilterActive(active);
                    setCurrentPage(1);
                  }}
                >
                  {active === 'ALL' ? 'All' : active}
                </Button>
              ))}
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm mt-2">
                {searchQuery || filterStatus !== 'ALL' || filterActive !== 'ALL'
                  ? 'Try adjusting your search or filters'
                  : 'No products created yet'}
              </p>
            </div>
          ) : (
            <>
              {/* Products Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.industry_sector}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.user_name}</div>
                            <div className="text-sm text-gray-500">{product.user_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(product.status)}</TableCell>
                        <TableCell>
                          {product.is_active ? (
                            <Badge className="bg-green-100 text-green-800">
                              <Power className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-800">
                              <PowerOff className="w-3 h-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {formatDate(product.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isMutating}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(product)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
