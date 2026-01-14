# Multi-Product Architecture for VentureUP Link

## Documentation Standards

**IMPORTANT RULE**: Minimize the creation of new markdown (MD) documentation files unless explicitly requested. All project documentation, instructions, and updates should be consolidated into existing documentation files rather than creating new ones. This rule applies to all development work and documentation practices across the entire application.

---

## Overview

**Major Change**: Decouple user registration from venture product registration.

### Key Changes
1. **User Registration**: Simple account creation (email, password, role)
2. **Email Verification**: Required before accessing dashboard
3. **Product Creation**: Separate process after email verification
4. **Multiple Products**: Users can create up to 3 venture products
5. **Product Management**: Full CRUD with specific permissions

---

## Architecture Changes

### User Registration Flow (Updated)

**Before:**
```
User Registration → Create User + VentureProfile in one flow
```

**After:**
```
Step 1: User Registration → Create User Account (email, password, role=VENTURE)
Step 2: Email Verification → User confirms email
Step 3: Dashboard Access → User can now create products
Step 4: Product Creation → User creates products (up to 3) via dashboard
```

### Data Model Changes

#### User Model
- **No changes** - User model remains the same
- Role can still be VENTURE, INVESTOR, MENTOR, ADMIN
- Email verification required before product creation

#### VentureProduct Model (Renamed from VentureProfile)
- **Changed**: `user` field from `OneToOneField` to `ForeignKey`
- **Added**: `is_active` field (BooleanField, default=True)
- **Business Rule**: Maximum 3 products per user (enforced at API level)

```python
class VentureProduct(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='products')  # Changed
    name = models.CharField(max_length=255)
    # ... other fields ...
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    is_active = models.BooleanField(default=True)  # New field
    # ... timestamps ...
```

### Related Models
All models that referenced `VentureProfile` now reference `VentureProduct`:
- `Founder.product` (FK to VentureProduct)
- `TeamMember.product` (FK to VentureProduct)
- `VentureNeed.product` (FK to VentureProduct)
- `VentureDocument.product` (FK to VentureProduct)

---

## Business Rules

### Product Limits
- **Maximum 3 products per user** (enforced at API level)
- Validation: Check `user.products.count() < 3` before allowing creation
- Error message: "You have reached the maximum limit of 3 products"

### Product Status Workflow
```
DRAFT → SUBMITTED → APPROVED/REJECTED
         ↑
    User submits
```

### Product Activation
- **User can activate/deactivate** products via `PATCH /api/ventures/products/{id}/activate`
- **is_active** field controls visibility
- Only active + approved products appear in public listings
- User can toggle even if product is APPROVED

### Product Deletion
- **Users CANNOT delete** products
- **Only ADMIN can delete** products
- Deletion is permanent (cascades to related models)
- Admin endpoint: `DELETE /api/admin/products/{id}`

### Product Updates
- **DRAFT products**: User can update all fields
- **SUBMITTED products**: User cannot update (waiting for approval)
- **APPROVED products**: User can update limited fields (admin may need to re-approve)
- **REJECTED products**: User can update and resubmit

---

## API Endpoints

### Product Management (User)

#### Create Product
```
POST /api/ventures/products
Body: { name, industry_sector, website, linkedin_url, ... }
Response: 201 Created or 400 (if limit reached)
```

#### List User's Products
```
GET /api/ventures/products
Response: [{ product1 }, { product2 }, ...]
```

#### Get Product Details
```
GET /api/ventures/products/{id}
Response: Full product details (if owner or approved)
```

#### Update Product
```
PATCH /api/ventures/products/{id}
Body: { name, description, ... }
Response: 200 OK (only if DRAFT status)
```

#### Activate/Deactivate Product
```
PATCH /api/ventures/products/{id}/activate
Body: { is_active: true/false }
Response: 200 OK
```

#### Submit Product for Approval
```
POST /api/ventures/products/{id}/submit
Response: 200 OK (creates ReviewRequest)
```

### Product Management (Admin)

#### Delete Product
```
DELETE /api/admin/products/{id}
Response: 204 No Content
```

#### List All Products (Admin)
```
GET /api/admin/products
Query params: ?user_id=..., ?status=..., ?is_active=...
Response: Paginated list of all products
```

---

## Frontend Changes

### Registration Flow

#### VentureRegistration Component
**Before**: Multi-step form creating user + profile
**After**: 
- Step 1: User account creation (email, password, full_name)
- Step 2: Email verification message
- Step 3: Redirect to dashboard after verification

#### Product Creation (New)
- **Location**: VentureDashboard component
- **UI**: "Create New Product" button (disabled if 3 products exist)
- **Form**: Multi-step product creation form
- **Validation**: Check product count before allowing creation

### Dashboard Changes

#### VentureDashboard Updates
1. **Product List View**: Show all user's products
2. **Product Cards**: Each product shows:
   - Name, status, is_active toggle
   - Actions: Edit, Activate/Deactivate, Submit for Approval
   - Delete button: Hidden (admin only)
3. **Product Creation**: Modal/form for creating new products
4. **Product Selection**: User can switch between products in dashboard

### Admin Dashboard Updates
1. **Product Management Tab**: New tab for managing products
2. **Product List**: Show all products with filters
3. **Product Actions**: Approve, Reject, Delete (admin only)
4. **User-Product Relationship**: Show which user owns which products

---

## Migration Strategy

### Database Migrations
1. **Rename VentureProfile to VentureProduct**
2. **Change OneToOneField to ForeignKey**
3. **Add is_active field**
4. **Update all related model foreign keys**
5. **Data migration**: Convert existing OneToOne to ForeignKey (1:1 mapping)

### Code Migration
1. **Update all model references**
2. **Update serializers**
3. **Update views and URLs**
4. **Update frontend components**
5. **Update admin interface**

---

## Testing Checklist

### User Registration
- [ ] User can register with email/password
- [ ] Email verification required
- [ ] Cannot create products before email verification
- [ ] Can access dashboard after verification

### Product Creation
- [ ] User can create first product
- [ ] User can create second product
- [ ] User can create third product
- [ ] User cannot create fourth product (error message)
- [ ] Product count validation works

### Product Management
- [ ] User can view all their products
- [ ] User can update DRAFT products
- [ ] User cannot update SUBMITTED products
- [ ] User can activate/deactivate products
- [ ] User cannot delete products
- [ ] Admin can delete products

### Approval Workflow
- [ ] User can submit product for approval
- [ ] ReviewRequest created correctly
- [ ] Admin can approve/reject products
- [ ] Product status updates correctly

---

## Implementation Order

1. **Update Data Model** (Backend)
   - Rename VentureProfile → VentureProduct
   - Change OneToOne → ForeignKey
   - Add is_active field
   - Create migration

2. **Update Backend API** (Backend)
   - Create product endpoints
   - Add 3-product limit validation
   - Add activation/deactivation endpoint
   - Update admin endpoints

3. **Update Registration Flow** (Frontend)
   - Simplify VentureRegistration to user-only
   - Add email verification step
   - Redirect to dashboard after verification

4. **Update Dashboard** (Frontend)
   - Add product list view
   - Add product creation form
   - Add activation/deactivation UI
   - Add product switching

5. **Update Admin Dashboard** (Frontend)
   - Add product management tab
   - Add product deletion (admin only)

---

## Notes

- **Backward Compatibility**: Existing users with OneToOne profiles will need data migration
- **Product Limit**: 3 is configurable (can be made a setting)
- **Soft Delete**: Consider soft delete for products (is_deleted flag) instead of hard delete
- **Product History**: Consider keeping deleted products for audit trail
