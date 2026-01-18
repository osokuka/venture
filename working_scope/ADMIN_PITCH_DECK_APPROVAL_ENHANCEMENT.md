# Admin Pitch Deck Approval Enhancement

## User Request
Date: 2026-01-18

> "at the admin approval show the name of pitchdeck and then underneath show the user 
> also make it possible to open the pitchdeck and view its details with log of is creation date 
> make it possible dfor admin to see the uploaded document also 
> and also if admin rejects it, have a comentary section explaining why its rejected"

## Current State

**Problem:** Admin approval interface shows user profiles (Avni Ademi - VENTURE) but NOT the pitch deck information prominently.

**What shows now:**
```
Avni Ademi
avni.ademi@gmail.com
VENTURE
Submitted: Jan 18, 2026, 09:27 PM
[Approve] [Reject]
```

## Desired State

**Solution:** Show pitch deck name prominently with user underneath, plus detailed view capability.

**What should show:**
```
Vezhguesi (Pitch Deck) 🔵
AI/ML • $500K PRE SEED

Submitted by: Avni Ademi (avni.ademi@gmail.com)
Created: Jan 18, 2026, 09:27 PM

[View Details] [Approve] [Reject]
```

---

## Implementation Plan

### 1. Backend Changes

#### A. Enhanced Serializer (`backend/apps/approvals/serializers.py`)

**Add fields to `ApprovalItemSerializer`:**
```python
# NEW pitch deck fields
product_id = serializers.SerializerMethodField()
product_name = serializers.SerializerMethodField()
product_industry = serializers.SerializerMethodField()
product_website = serializers.SerializerMethodField()
product_created_at = serializers.SerializerMethodField()

# Pitch deck document info
pitch_deck_file_url = serializers.SerializerMethodField()
pitch_deck_file_name = serializers.SerializerMethodField()
pitch_deck_problem_statement = serializers.SerializerMethodField()
pitch_deck_solution_description = serializers.SerializerMethodField()
pitch_deck_target_market = serializers.SerializerMethodField()
pitch_deck_funding_amount = serializers.SerializerMethodField()
pitch_deck_funding_stage = serializers.SerializerMethodField()
pitch_deck_traction_metrics = serializers.SerializerMethodField()
pitch_deck_use_of_funds = serializers.SerializerMethodField()
```

**Helper methods:**
```python
def _get_product(self, obj: ReviewRequest):
    """Get VentureProduct if this is a product review."""
    from apps.ventures.models import VentureProduct
    from django.contrib.contenttypes.models import ContentType
    
    product_ct = ContentType.objects.get_for_model(VentureProduct)
    if obj.content_type == product_ct:
        return VentureProduct.objects.get(id=obj.object_id)
    return None

def _get_pitch_deck(self, product):
    """Get pitch deck document from product."""
    if not product:
        return None
    return product.documents.filter(document_type='PITCH_DECK').first()
```

---

### 2. Frontend Changes

#### A. Update TypeScript Interface (`frontend/src/services/adminService.ts`)

```typescript
export interface ApprovalItem {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  role: 'VENTURE' | 'INVESTOR' | 'MENTOR';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submitted_at: string;
  reviewed_at?: string;
  rejection_reason?: string;
  
  // NEW: Product/pitch deck fields
  product_id?: string;
  product_name?: string;
  product_industry?: string;
  product_website?: string;
  product_created_at?: string;
  
  // Pitch deck document
  pitch_deck_file_url?: string;
  pitch_deck_file_name?: string;
  pitch_deck_problem_statement?: string;
  pitch_deck_solution_description?: string;
  pitch_deck_target_market?: string;
  pitch_deck_funding_amount?: string;
  pitch_deck_funding_stage?: string;
  pitch_deck_traction_metrics?: any;
  pitch_deck_use_of_funds?: string;
}
```

#### B. Enhanced Approval Card UI (`frontend/src/components/ApprovalsManagementTab.tsx`)

**New Layout:**
```tsx
<Card>
  <CardContent>
    {/* PITCH DECK NAME - PROMINENT */}
    <div className="flex items-center gap-2 mb-2">
      <FileText className="w-6 h-6 text-blue-600" />
      <h2 className="text-2xl font-bold">{approval.product_name}</h2>
      <Badge>{approval.product_industry}</Badge>
    </div>
    
    {/* FUNDING INFO */}
    <div className="flex gap-4 text-sm text-gray-600 mb-4">
      <span>💰 {approval.pitch_deck_funding_amount}</span>
      <span>📈 {approval.pitch_deck_funding_stage}</span>
    </div>
    
    {/* USER INFO - UNDERNEATH */}
    <div className="border-t pt-3">
      <p className="text-sm text-gray-600">Submitted by:</p>
      <div className="flex items-center gap-2">
        <UserIcon />
        <span className="font-medium">{approval.user_name}</span>
        <span className="text-gray-500">({approval.user_email})</span>
      </div>
    </div>
    
    {/* DATES */}
    <div className="flex gap-4 text-xs text-gray-500 mt-2">
      <span>Created: {formatDate(approval.product_created_at)}</span>
      <span>Submitted: {formatDate(approval.submitted_at)}</span>
    </div>
    
    {/* ACTIONS */}
    <div className="flex gap-2 mt-4">
      <Button onClick={() => openDetailsModal(approval)}>
        <Eye className="w-4 h-4 mr-2" />
        View Details
      </Button>
      <Button variant="success" onClick={() => handleApprove(approval.id)}>
        <CheckCircle className="w-4 h-4 mr-2" />
        Approve
      </Button>
      <Button variant="destructive" onClick={() => openRejectDialog(approval)}>
        <XCircle className="w-4 h-4 mr-2" />
        Reject
      </Button>
    </div>
  </CardContent>
</Card>
```

---

### 3. Details Modal

**New Component:** `PitchDeckDetailsModal`

**Features:**
- Full pitch deck information
- Link to view/download document
- Timeline of events (created, submitted)
- Problem statement, solution, target market
- Traction metrics (if available)
- Funding details
- Use of funds

**UI Structure:**
```tsx
<Dialog>
  <DialogHeader>
    <DialogTitle>{product_name} - Pitch Deck Details</DialogTitle>
  </DialogHeader>
  
  <DialogContent>
    {/* Company Info */}
    <Section title="Company Information">
      <InfoItem label="Name" value={product_name} />
      <InfoItem label="Industry" value={product_industry} />
      <InfoItem label="Website" value={product_website} link />
    </Section>
    
    {/* Pitch Deck Document */}
    <Section title="Pitch Deck Document">
      <div className="flex items-center gap-2 p-4 border rounded">
        <FileText className="w-8 h-8" />
        <div className="flex-1">
          <p className="font-medium">{pitch_deck_file_name}</p>
          <p className="text-sm text-gray-500">
            Uploaded: {formatDate(product_created_at)}
          </p>
        </div>
        <Button onClick={() => viewDocument(pitch_deck_file_url)}>
          <Eye className="w-4 h-4 mr-2" />
          View
        </Button>
        <Button onClick={() => downloadDocument(pitch_deck_file_url)}>
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </div>
    </Section>
    
    {/* Business Information */}
    <Section title="Business Model">
      <InfoItem label="Problem Statement" value={pitch_deck_problem_statement} />
      <InfoItem label="Solution" value={pitch_deck_solution_description} />
      <InfoItem label="Target Market" value={pitch_deck_target_market} />
    </Section>
    
    {/* Funding */}
    <Section title="Funding Request">
      <InfoItem label="Amount" value={pitch_deck_funding_amount} />
      <InfoItem label="Stage" value={pitch_deck_funding_stage} />
      <InfoItem label="Use of Funds" value={pitch_deck_use_of_funds} />
    </Section>
    
    {/* Traction */}
    {pitch_deck_traction_metrics && (
      <Section title="Traction Metrics">
        {Object.entries(pitch_deck_traction_metrics).map(([key, value]) => (
          <InfoItem key={key} label={key} value={value} />
        ))}
      </Section>
    )}
    
    {/* Timeline */}
    <Section title="Timeline">
      <Timeline>
        <TimelineItem 
          date={product_created_at} 
          label="Product Created" 
        />
        <TimelineItem 
          date={submitted_at} 
          label="Submitted for Review" 
          current 
        />
      </Timeline>
    </Section>
    
    {/* Submitter */}
    <Section title="Submitted By">
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
        <Avatar />
        <div>
          <p className="font-medium">{user_name}</p>
          <p className="text-sm text-gray-600">{user_email}</p>
        </div>
      </div>
    </Section>
  </DialogContent>
  
  <DialogFooter>
    <Button variant="outline" onClick={closeModal}>Close</Button>
    <Button variant="success" onClick={() => handleApprove(approval.id)}>
      Approve
    </Button>
    <Button variant="destructive" onClick={() => openRejectDialog(approval)}>
      Reject
    </Button>
  </DialogFooter>
</Dialog>
```

---

### 4. Rejection with Commentary

**Already exists** but needs to be tied to the detailed view:

```tsx
<Dialog open={rejectDialogOpen}>
  <DialogHeader>
    <DialogTitle>Reject Pitch Deck: {selectedApproval?.product_name}</DialogTitle>
    <DialogDescription>
      Provide a detailed reason for rejection. The venture will receive this feedback.
    </DialogDescription>
  </DialogHeader>
  
  <DialogContent>
    <Label>Rejection Reason *</Label>
    <Textarea
      value={rejectionReason}
      onChange={(e) => setRejectionReason(e.target.value)}
      placeholder="e.g., Missing financial projections, unclear target market, incomplete team information..."
      rows={6}
    />
    <p className="text-xs text-gray-500 mt-2">
      Be specific to help the venture improve their submission.
    </p>
  </DialogContent>
  
  <DialogFooter>
    <Button variant="outline" onClick={cancelReject}>Cancel</Button>
    <Button 
      variant="destructive" 
      onClick={handleReject}
      disabled={!rejectionReason.trim()}
    >
      Reject Pitch Deck
    </Button>
  </DialogFooter>
</Dialog>
```

---

## Visual Example

### Before (Current):
```
┌──────────────────────────────────┐
│ Avni Ademi                       │
│ avni.ademi@gmail.com            │
│                                  │
│ [VENTURE]                        │
│ Submitted: Jan 18, 2026, 09:27 PM│
│                                  │
│ [Approve] [Reject]              │
└──────────────────────────────────┘
```

### After (Enhanced):
```
┌──────────────────────────────────────┐
│ 📄 Vezhguesi                    [AI] │
│ AI/ML Platform • $500K PRE SEED      │
│                                      │
│ Problem: Identifying fake news       │
│ Solution: Multi-source analysis      │
│                                      │
│ ───────────────────────────────────  │
│ Submitted by:                        │
│ 👤 Avni Ademi (avni.ademi@gmail.com)│
│                                      │
│ Created: Jan 18, 2026, 09:00 PM     │
│ Submitted: Jan 18, 2026, 09:27 PM   │
│                                      │
│ [View Details] [Approve] [Reject]   │
└──────────────────────────────────────┘
```

### Details Modal:
```
┌─────────────────────────────────────────┐
│ Vezhguesi - Pitch Deck Details    [X]  │
├─────────────────────────────────────────┤
│                                          │
│ COMPANY INFORMATION                      │
│ Name: Vezhguesi                         │
│ Industry: AI/ML                         │
│ Website: https://vezhguesi.com          │
│                                          │
│ PITCH DECK DOCUMENT                      │
│ ┌────────────────────────────────┐     │
│ │ 📄 pitch_deck.pdf              │     │
│ │ Uploaded: Jan 18, 2026, 09:00 PM│     │
│ │                                 │     │
│ │ [View] [Download]              │     │
│ └────────────────────────────────┘     │
│                                          │
│ BUSINESS MODEL                           │
│ Problem: Identifying fake news...       │
│ Solution: Analyzing from 2-3 sources... │
│ Target Market: ORG, GOV, NGOS           │
│                                          │
│ FUNDING REQUEST                          │
│ Amount: $500K                           │
│ Stage: PRE SEED                         │
│ Use: 40% dev, 30% ops, 30% upgrade     │
│                                          │
│ TRACTION METRICS                         │
│ Users: 500                              │
│ Enterprise Clients: 15                  │
│ Growth: 15% MoM                         │
│                                          │
│ TIMELINE                                 │
│ ● Product Created - Jan 18, 09:00 PM   │
│ ● Submitted for Review - Jan 18, 09:27 PM│
│                                          │
│ SUBMITTED BY                             │
│ ┌────────────────────────────────┐     │
│ │ 👤 Avni Ademi                  │     │
│ │    avni.ademi@gmail.com        │     │
│ └────────────────────────────────┘     │
│                                          │
├─────────────────────────────────────────┤
│ [Close] [Approve] [Reject]             │
└─────────────────────────────────────────┘
```

---

## Implementation Steps

1. ✅ **Backend Serializer** - Add product/pitch deck fields
2. ✅ **Frontend Service** - Update TypeScript interfaces
3. ✅ **Approval Card** - Redesign to show pitch deck prominently
4. ✅ **Details Modal** - Create comprehensive view component
5. ✅ **Document Viewing** - Add view/download functionality
6. ✅ **Rejection Dialog** - Enhance with better UX (already exists)
7. ✅ **Timeline Component** - Show creation/submission dates
8. ✅ **Testing** - Verify all data displays correctly

---

## Files to Modify

### Backend:
1. `backend/apps/approvals/serializers.py` - Add product/pitch deck fields
2. No URL changes needed (existing endpoints work)

### Frontend:
3. `frontend/src/services/adminService.ts` - Update ApprovalItem interface
4. `frontend/src/components/ApprovalsManagementTab.tsx` - Redesign UI
5. `frontend/src/components/PitchDeckDetailsModal.tsx` - NEW component

---

## Benefits

✅ **Clear Context** - Admin sees what they're approving (pitch deck, not just user)
✅ **Complete Information** - All pitch deck details available before decision
✅ **Document Access** - Can view/download PDF/PPT directly
✅ **Better Feedback** - Rejection reasons help ventures improve
✅ **Audit Trail** - Timeline shows creation and submission dates
✅ **Efficient Review** - All info in one place, no navigation needed

---

## Status

🟡 **IN PROGRESS** - Implementing enhanced approval interface

**Next:** Modify serializer, then update frontend components

---

## Related Documentation

- `SINGLE_SUBMISSION_WORKFLOW.md` - Context on submission process
- `PRODUCT_DELETION_FEATURE.md` - Related admin actions
