import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { 
  FileText, 
  Download, 
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ArrowLeft,
  ArrowRight
} from "lucide-react";

interface DocumentViewerProps {
  documentUrl: string;
  documentTitle: string;
  companyName: string;
  onClose: () => void;
}

export function DocumentViewer({ 
  documentUrl, 
  documentTitle, 
  companyName, 
  onClose 
}: DocumentViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  // Mock data for demonstration - in a real app, this would come from the document
  const totalPages = 12;
  const mockPageContent = [
    "Cover Slide - Company Overview",
    "Problem Statement & Market Opportunity",
    "Solution & Product Demo",
    "Business Model & Revenue Streams",
    "Market Analysis & Competition",
    "Traction & Key Metrics",
    "Team & Advisory Board",
    "Financial Projections",
    "Funding Requirements & Use of Funds",
    "Go-to-Market Strategy",
    "Technology & IP",
    "Contact Information & Next Steps"
  ];

  const handleDownload = () => {
    // In a real app, this would trigger document download
    console.log(`Downloading ${documentTitle}`);
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const zoomIn = () => {
    if (zoom < 200) {
      setZoom(prev => Math.min(prev + 25, 200));
    }
  };

  const zoomOut = () => {
    if (zoom > 50) {
      setZoom(prev => Math.max(prev - 25, 50));
    }
  };

  const rotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-lg">{documentTitle}</h2>
              <p className="text-sm text-muted-foreground">{companyName}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{currentPage} of {totalPages}</Badge>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/20">
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={prevPage}
              disabled={currentPage === 1}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            
            <span className="text-sm px-3">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={nextPage}
              disabled={currentPage === totalPages}
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={zoomOut} disabled={zoom <= 50}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            
            <span className="text-sm px-3">{zoom}%</span>
            
            <Button variant="outline" size="sm" onClick={zoomIn} disabled={zoom >= 200}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            
            <Button variant="outline" size="sm" onClick={rotate}>
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Document Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex items-center justify-center bg-muted/10">
            <Card 
              className="w-[600px] h-[800px] bg-white shadow-lg"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center',
                transition: 'transform 0.2s ease'
              }}
            >
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <CardTitle className="text-center">
                  {companyName}
                </CardTitle>
                <p className="text-center text-white/80">
                  {documentTitle}
                </p>
              </CardHeader>
              <CardContent className="p-8 h-full flex flex-col justify-center">
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-blue-600 rounded-lg mx-auto flex items-center justify-center text-white text-2xl">
                    {currentPage}
                  </div>
                  
                  <h3 className="text-xl">
                    {mockPageContent[currentPage - 1]}
                  </h3>
                  
                  <div className="space-y-4 text-sm text-muted-foreground">
                    {currentPage === 1 && (
                      <div className="space-y-2">
                        <p>Welcome to our pitch presentation</p>
                        <p>Transforming industries through innovation</p>
                        <p>Series A Funding Round</p>
                      </div>
                    )}
                    
                    {currentPage === 2 && (
                      <div className="space-y-2">
                        <p>• Market size: $50B+ addressable market</p>
                        <p>• Current inefficiencies cost businesses $2T annually</p>
                        <p>• 78% of enterprises struggle with this problem</p>
                      </div>
                    )}
                    
                    {currentPage === 3 && (
                      <div className="space-y-2">
                        <p>• AI-powered automation platform</p>
                        <p>• 90% reduction in manual processes</p>
                        <p>• Seamless integration with existing systems</p>
                      </div>
                    )}
                    
                    {currentPage === 4 && (
                      <div className="space-y-2">
                        <p>• SaaS subscription model</p>
                        <p>• Enterprise licenses: $50K-$500K annually</p>
                        <p>• Professional services: 15-20% of license revenue</p>
                      </div>
                    )}
                    
                    {currentPage === 6 && (
                      <div className="space-y-2">
                        <p>• $200K ARR with 45% month-over-month growth</p>
                        <p>• 15 enterprise customers</p>
                        <p>• 92% customer satisfaction score</p>
                      </div>
                    )}
                    
                    {currentPage === 8 && (
                      <div className="space-y-2">
                        <p>• Year 1: $500K projected revenue</p>
                        <p>• Year 2: $2.5M projected revenue</p>
                        <p>• Year 3: $8M projected revenue</p>
                      </div>
                    )}
                    
                    {currentPage === 9 && (
                      <div className="space-y-2">
                        <p>• Seeking $5M Series A funding</p>
                        <p>• 60% product development</p>
                        <p>• 25% sales & marketing</p>
                        <p>• 15% team expansion</p>
                      </div>
                    )}
                    
                    {currentPage > 6 && currentPage !== 8 && currentPage !== 9 && (
                      <p>This slide contains detailed information about {mockPageContent[currentPage - 1].toLowerCase()}</p>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Confidential & Proprietary - {companyName}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Page Navigation */}
        <div className="p-4 border-t bg-muted/20">
          <div className="flex items-center justify-center space-x-2">
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            {totalPages > 10 && (
              <>
                <span className="text-muted-foreground">...</span>
                <Button
                  variant={currentPage === totalPages ? "default" : "outline"}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => setCurrentPage(totalPages)}
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}