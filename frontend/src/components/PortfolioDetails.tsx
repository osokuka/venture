/**
 * Portfolio Details Component
 * Shows complete pitch deck details for a portfolio company
 * Uses PitchDeckDetails component with portfolio company context
 */

import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PitchDeckDetails } from './PitchDeckDetails';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';

export function PortfolioDetails() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const companyId = searchParams.get('companyId');
  const companyName = searchParams.get('company') || 'Company';

  // If companyId is provided, use it as productId for PitchDeckDetails
  // Otherwise, redirect back to portfolio
  if (!companyId) {
    return (
      <div className="p-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold mb-2">Portfolio Details</h1>
          <p className="text-muted-foreground">Company ID not provided</p>
        </div>
        <Button onClick={() => navigate('/dashboard/investor/portfolio')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Portfolio
        </Button>
      </div>
    );
  }

  // Check if companyId is a valid UUID
  // If not, it might be demo data (e.g., 'p1', 'p2') - show message
  const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId);
  
  if (!isValidUuid) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Button onClick={() => navigate('/dashboard/investor/portfolio')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Portfolio
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>{companyName}</CardTitle>
            <CardDescription>Portfolio Company Details</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              This is demo data. To view full pitch deck details, the portfolio company needs to be linked to an actual product.
            </p>
            <p className="text-sm text-muted-foreground">
              Once the portfolio API is implemented (VL-811), this page will automatically display the complete pitch deck information.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pass companyId as productIdOverride to PitchDeckDetails
  // PitchDeckDetails will handle fetching the product and documents
  return <PitchDeckDetails productIdOverride={companyId} />;
}
