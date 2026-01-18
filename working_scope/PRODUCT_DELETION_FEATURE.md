# Product Deletion Feature

## Feature Overview
Date: 2026-01-18

### User Request
> "there should be an option to delete incomplete pitchdecks. also request deletion of Completed and approved pitchdeck (only admin can delete those)"

### Solution Implemented
Implemented a **two-tier deletion system**:

1. **Direct Deletion** - Users can delete DRAFT/REJECTED products immediately
2. **Request Deletion** - Users can request deletion of SUBMITTED/APPROVED products (requires admin approval)

---

## Implementation Details

### Backend Changes

#### 1. New Endpoint: Delete Product (DRAFT/REJECTED)

**File:** `backend/apps/ventures/views.py`

```python
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_product(request, product_id):
    """
    Delete a product (DRAFT or REJECTED status only).
    
    DELETE /api/ventures/products/{id}/delete
    
    Users can only delete products in DRAFT or REJECTED status.
    For SUBMITTED or APPROVED products, use request_product_deletion endpoint.
    """
```

**Features:**
- ✅ Security validation: Only owner can delete their own products
- ✅ Status check: Only DRAFT/REJECTED products can be deleted
- ✅ File cleanup: Deletes associated pitch deck files from storage
- ✅ Cascade deletion: Removes all related data (team members, founders, documents)
- ✅ Clear error messages for invalid status attempts

**Response Examples:**

```json
// Success
{
  "detail": "Product \"MyStartup\" deleted successfully."
}

// Error: Wrong status
{
  "detail": "Cannot delete product with status SUBMITTED. Only DRAFT or REJECTED products can be deleted. For SUBMITTED or APPROVED products, please request deletion.",
  "status": "SUBMITTED",
  "action_required": "request_deletion"
}
```

---

#### 2. New Endpoint: Request Product Deletion (SUBMITTED/APPROVED)

**File:** `backend/apps/ventures/views.py`

```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_product_deletion(request, product_id):
    """
    Request deletion of a SUBMITTED or APPROVED product.
    
    POST /api/ventures/products/{id}/request-deletion
    Body: { "reason": "Optional reason for deletion request" }
    
    Creates a deletion request that requires admin approval.
    Only for products in SUBMITTED or APPROVED status.
    """
```

**Features:**
- ✅ Security validation: Only owner can request deletion
- ✅ Status check: Only SUBMITTED/APPROVED products require request
- ✅ Optional reason: User can provide explanation (max 1000 chars)
- ✅ Admin review: Creates ReviewRequest for admin to approve/deny
- ✅ Prevents duplicates: Checks for existing pending deletion requests

**Request Body:**
```json
{
  "reason": "Pivoted to different market, need to resubmit with new strategy"
}
```

**Response Examples:**

```json
// Success
{
  "detail": "Deletion request for \"MyStartup\" submitted successfully. Admin will review your request.",
  "review_id": "uuid-here",
  "reason": "Pivoted to different market..."
}

// Error: Wrong status (should use direct delete)
{
  "detail": "Product with status DRAFT can be deleted directly. Use DELETE /api/ventures/products/{id} instead.",
  "status": "DRAFT",
  "action_required": "direct_delete"
}

// Error: Duplicate request
{
  "detail": "A deletion request for this product is already pending review."
}
```

---

### URL Routes

**File:** `backend/apps/ventures/urls.py`

```python
# Added to product management endpoints
path('products/<uuid:product_id>/delete', delete_product, name='delete_product'),
path('products/<uuid:product_id>/request-deletion', request_product_deletion, name='request_product_deletion'),
```

---

### Frontend Changes

#### 1. Service Methods

**File:** `frontend/src/services/productService.ts`

```typescript
/**
 * Delete a product (DRAFT/REJECTED only)
 */
async deleteProduct(productId: string): Promise<{ detail: string }> {
  const response = await apiClient.delete(`/ventures/products/${productId}/delete`);
  return response.data;
}

/**
 * Request deletion of a SUBMITTED or APPROVED product
 */
async requestProductDeletion(productId: string, reason?: string): Promise<{ detail: string; review_id: string }> {
  const response = await apiClient.post(`/ventures/products/${productId}/request-deletion`, {
    reason: reason || ''
  });
  return response.data;
}
```

---

#### 2. Component Handlers

**File:** `frontend/src/components/ProductManagement.tsx`

**Delete Handler (DRAFT/REJECTED):**
```typescript
const handleDelete = async (product: VentureProduct) => {
  if (!confirm(`Are you sure you want to delete "${product.name}"?\n\nThis action cannot be undone. All associated data (pitch deck, team members, founders) will be permanently deleted.`)) {
    return;
  }

  try {
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
```

**Request Deletion Handler (SUBMITTED/APPROVED):**
```typescript
const handleRequestDeletion = async (product: VentureProduct) => {
  const reason = prompt(`Request deletion of "${product.name}"\n\nPlease provide a reason for this deletion request (optional):`);
  
  // User cancelled the prompt
  if (reason === null) {
    return;
  }

  try {
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
```

---

#### 3. UI Components

**Delete Button (DRAFT/REJECTED products):**
```tsx
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
```

**Request Deletion Button (SUBMITTED/APPROVED products):**
```tsx
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
```

---

## User Experience

### Scenario 1: Delete Incomplete Product (DRAFT)

1. User has a product in DRAFT status (incomplete/not submitted)
2. Clicks **"Delete"** button (red)
3. Confirmation dialog appears:
   > "Are you sure you want to delete \"MyStartup\"?
   > 
   > This action cannot be undone. All associated data (pitch deck, team members, founders) will be permanently deleted."
4. User confirms → Product deleted immediately
5. Success toast: "Product 'MyStartup' deleted successfully!"

---

### Scenario 2: Delete Rejected Product

1. User has a product in REJECTED status (admin rejected submission)
2. User can either:
   - Edit and resubmit
   - **Delete** if no longer needed
3. Same flow as Scenario 1

---

### Scenario 3: Request Deletion of Submitted Product

1. User has a product in SUBMITTED status (pending admin review)
2. Clicks **"Request Deletion"** button (orange)
3. Prompt dialog appears:
   > "Request deletion of \"MyStartup\"
   > 
   > Please provide a reason for this deletion request (optional):"
4. User enters reason: "Pivoted to different market segment"
5. Deletion request created for admin review
6. Success toast: "Deletion request submitted! Admin will review your request."
7. Product remains visible until admin approves deletion

---

### Scenario 4: Request Deletion of Approved Product

1. User has a product in APPROVED status (live on platform)
2. Needs to remove it (e.g., business closed, privacy concerns)
3. Clicks **"Request Deletion"** button (orange)
4. Same flow as Scenario 3
5. Admin reviews request → Can approve or deny
6. If approved → Product deleted
7. If denied → Remains active

---

## Visual Indicators

### Product Card - DRAFT/REJECTED Status

```
┌─────────────────────────────────────┐
│ MyStartup              DRAFT        │
│ fintech                             │
├─────────────────────────────────────┤
│ [Manage]                            │
│ [Edit Company Data]                 │
│ [Upload Pitch Deck]                 │
│ [Delete] 🔴                         │ ← Red delete button
└─────────────────────────────────────┘
```

### Product Card - SUBMITTED/APPROVED Status

```
┌─────────────────────────────────────┐
│ MyStartup         SUBMITTED         │
│ fintech                             │
├─────────────────────────────────────┤
│ [Manage]                            │
│ [Request Deletion] 🟠              │ ← Orange request button
└─────────────────────────────────────┘
```

---

## Security Features

### 1. Authorization
- ✅ Only authenticated users can delete/request deletion
- ✅ Users can only act on their own products
- ✅ UUID validation prevents injection attacks

### 2. Status-Based Access Control
- ✅ DRAFT/REJECTED → Direct deletion allowed
- ✅ SUBMITTED/APPROVED → Only deletion request allowed
- ✅ Clear error messages guide users to correct action

### 3. Data Integrity
- ✅ Cascade deletion removes all related data
- ✅ File cleanup prevents orphaned files in storage
- ✅ Transaction safety (database rollback on errors)

### 4. Input Validation
- ✅ Reason field limited to 1000 characters
- ✅ UUID format validation
- ✅ Prevents duplicate deletion requests

---

## Admin Workflow (To Be Implemented)

### Deletion Request Review

**Admin Dashboard should show:**

1. **Pending Deletion Requests Tab**
   - Product name
   - User email
   - Request date
   - Reason provided
   - Current status (SUBMITTED/APPROVED)

2. **Review Actions**
   - [Approve] → Permanently deletes product
   - [Deny] → Product remains active
   - Add admin notes/response

3. **Notification**
   - Email user when request approved/denied
   - Include admin notes if provided

---

## API Endpoints Summary

### DELETE /api/ventures/products/{id}/delete

**Purpose:** Delete DRAFT/REJECTED products

**Auth:** Required (Owner only)

**Status Codes:**
- `200` - Product deleted successfully
- `400` - Wrong status (must be DRAFT/REJECTED)
- `404` - Product not found
- `401` - Not authenticated

---

### POST /api/ventures/products/{id}/request-deletion

**Purpose:** Request deletion of SUBMITTED/APPROVED products

**Auth:** Required (Owner only)

**Body:**
```json
{
  "reason": "Optional reason (max 1000 chars)"
}
```

**Status Codes:**
- `200` - Deletion request created
- `400` - Wrong status (use direct delete) OR duplicate request
- `404` - Product not found
- `401` - Not authenticated

---

## Testing Checklist

### Test Case 1: Delete DRAFT Product
1. Create product (DRAFT status)
2. Click "Delete" button → ✅ Confirmation appears
3. Confirm deletion → ✅ Product deleted
4. Check database → ✅ Product & related data removed
5. Check storage → ✅ Files deleted

### Test Case 2: Try to Delete SUBMITTED Product
1. Submit product (SUBMITTED status)
2. Try DELETE API call → ❌ 400 error
3. Error message → ✅ Suggests using request deletion

### Test Case 3: Request Deletion of APPROVED Product
1. Have APPROVED product
2. Click "Request Deletion" → ✅ Prompt appears
3. Enter reason → ✅ Request created
4. Check ReviewRequest table → ✅ Record exists with reason

### Test Case 4: Duplicate Deletion Request
1. Request deletion of product
2. Try to request again → ❌ 400 error
3. Error message → ✅ "Already pending review"

### Test Case 5: Security - Delete Other User's Product
1. User A creates product
2. User B tries to delete → ❌ 404 error
3. User B cannot see product → ✅ Authorization works

---

## Future Enhancements

### Admin Dashboard Integration
- [ ] Add "Deletion Requests" tab to admin dashboard
- [ ] Implement approve/deny actions
- [ ] Add email notifications for request status
- [ ] Track deletion history for audit trail

### Soft Delete Option
- [ ] Add "Archive" instead of permanent delete
- [ ] Allow restoration within 30 days
- [ ] Auto-purge after retention period

### Bulk Deletion
- [ ] Allow selecting multiple DRAFT products
- [ ] Batch delete with single confirmation

---

## Impact

### Benefits
✅ **User Control** - Can remove incomplete/unwanted products
✅ **Compliance** - Supports GDPR "right to be forgotten"
✅ **Clean Data** - Prevents accumulation of abandoned drafts
✅ **Safety** - Request workflow protects approved content
✅ **Transparency** - Clear distinction between direct delete vs request

### User Feedback Addressed
> "there should be an option to delete incomplete pitchdecks. also request deletion of Completed and approved pitchdeck (only admin can delete those)"

**Status:** ✅ **IMPLEMENTED**
- Direct deletion for incomplete (DRAFT/REJECTED)
- Request deletion for complete/approved (SUBMITTED/APPROVED)
- Admin approval required for production content

---

## Files Modified

### Backend
1. `backend/apps/ventures/views.py` - Added delete_product() and request_product_deletion()
2. `backend/apps/ventures/urls.py` - Added URL routes

### Frontend
3. `frontend/src/services/productService.ts` - Added deleteProduct() and requestProductDeletion()
4. `frontend/src/components/ProductManagement.tsx` - Added handlers and UI buttons

---

## Deployment

```bash
# Restart backend
docker-compose restart web

# Frontend (Vite) - Auto hot-reloads
# No restart needed
```

---

## Related Tasks

- **Product CRUD**: VL-301 ✅ Done
- **Deletion Feature**: NEW ✅ Done
- **Admin Review Dashboard**: To be implemented
- **Email Notifications**: To be implemented
