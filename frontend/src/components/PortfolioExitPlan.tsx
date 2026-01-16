/**
 * Portfolio Exit Plan Component
 * Shows exit strategy planning for a portfolio investment
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { 
  ArrowLeft, 
  TrendingUp,
  DollarSign,
  Calendar,
  Target,
  Loader2,
  LogOut,
  Download
} from 'lucide-react';
import { ventureService } from '../services/ventureService';
import { validateUuid, safeDisplayText } from '../utils/security';
import { type VentureProduct } from '../types';

export function PortfolioExitPlan() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const companyId = searchParams.get('companyId');
  const companyName = searchParams.get('company') || 'Company';
  const invested = searchParams.get('invested') || '$0';
  const currentValue = searchParams.get('currentValue') || '$0';
  const returnValue = searchParams.get('return') || '0%';

  const [product, setProduct] = useState<VentureProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (companyId) {
      // Check if it's a valid UUID
      const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId);
      if (isValidUuid) {
        fetchCompanyDetails();
      } else {
        // Demo data - show message (exit plan works with query params, so no need to fetch)
        setIsLoading(false);
      }
    } else {
      toast.error('Company ID not provided');
      navigate('/dashboard/investor/portfolio');
    }
  }, [companyId]);

  const fetchCompanyDetails = async () => {
    if (!companyId) return;
    // Validate UUID
    const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId);
    if (!isValidUuid) return;
    
    setIsLoading(true);
    try {
      const productData = await ventureService.getVentureById(companyId);
      setProduct(productData);
    } catch (error: any) {
      console.error('Failed to fetch company details:', error);
      // Don't redirect on error, just show the data from query params
    } finally {
      setIsLoading(false);
    }
  };

  const exitOptions = [
    {
      name: 'Strategic Acquisition',
      description: 'Sell to a strategic buyer in the same industry. Potential for premium valuation due to synergies.',
      timeline: '12-18 months',
      multiple: '3-5x',
      potential: 'High',
      badge: 'default'
    },
    {
      name: 'IPO (Public Offering)',
      description: 'Take the company public through an initial public offering. Requires strong financials and growth.',
      timeline: '18-24 months',
      multiple: '4-8x',
      potential: 'Medium',
      badge: 'secondary'
    },
    {
      name: 'Secondary Sale',
      description: 'Sell shares to another investor or fund. Quick exit but potentially lower valuation.',
      timeline: '3-6 months',
      multiple: '1.5-2.5x',
      potential: 'Available Now',
      badge: 'outline'
    }
  ];

  // Check if companyId is a valid UUID
  const isValidUuid = companyId ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId) : false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Exit plan page works with demo data (uses query params), so no need for special handling
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
            <p className="text-muted-foreground">Exit Strategy Planning</p>
          </div>
        </div>
      </div>

      {/* Current Investment Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Initial Investment</p>
              <p className="font-semibold text-lg">{safeDisplayText(invested)}</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Current Value</p>
              <p className="font-semibold text-lg">{safeDisplayText(currentValue)}</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Return</p>
              <p className={`font-semibold text-lg ${returnValue.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {safeDisplayText(returnValue)}
              </p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Hold Period</p>
              <p className="font-semibold text-lg">2.3 years</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exit Options */}
      <Card>
        <CardHeader>
          <CardTitle>Exit Strategy Options</CardTitle>
          <CardDescription>Evaluate different exit strategies for your investment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {exitOptions.map((option, index) => (
              <div key={index} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{option.name}</h4>
                  <Badge variant={option.badge as any}>{option.potential}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{option.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>Estimated Timeline: {option.timeline}</span>
                  </span>
                  <span className="font-medium flex items-center space-x-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>Potential Multiple: {option.multiple}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommended Action Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Action Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-primary/5 rounded-lg">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">1</div>
              <div>
                <p className="font-medium">Monitor Performance</p>
                <p className="text-sm text-muted-foreground">Continue tracking key metrics and company milestones</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
              <div className="w-6 h-6 bg-muted-foreground text-background rounded-full flex items-center justify-center text-xs font-semibold">2</div>
              <div>
                <p className="font-medium">Market Analysis</p>
                <p className="text-sm text-muted-foreground">Analyze market conditions and potential buyer interest</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
              <div className="w-6 h-6 bg-muted-foreground text-background rounded-full flex items-center justify-center text-xs font-semibold">3</div>
              <div>
                <p className="font-medium">Strategic Planning</p>
                <p className="text-sm text-muted-foreground">Work with management team on exit preparation</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex space-x-3">
        <Button 
          className="flex-1"
          onClick={() => navigate(`/dashboard/investor/messages?userId=${product?.user}&userRole=venture`)}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Schedule Consultation
        </Button>
        <Button 
          variant="outline"
          className="flex-1"
          onClick={() => toast.success('Exit planning documents will be sent to your email.')}
        >
          <Download className="w-4 h-4 mr-2" />
          Download Exit Plan
        </Button>
      </div>
    </div>
  );
}
