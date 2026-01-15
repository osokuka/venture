# Investor CRUD Implementation Status

## Documentation Standards

**IMPORTANT RULE**: Minimize the creation of new markdown (MD) documentation files unless explicitly requested. All project documentation, instructions, and updates should be consolidated into existing documentation files rather than creating new ones. This rule applies to all development work and documentation practices across the entire application.

---

## Executive Summary

This document provides a comprehensive status of the Investor CRUD implementation, including the **incognito/visibility feature** that allows investors to remain hidden from public view unless they initiate a conversation with a venture.

**Status**: ✅ **COMPLETE** - All Investor CRUD functionality is implemented with incognito mode support.

---

## 1. Investor Profile CRUD ✅

### Backend Implementation

**Endpoints Implemented**:
- ✅ `POST /api/investors/profile` - Create investor profile (draft)
- ✅ `GET /api/investors/profile/me` - Get own investor profile
- ✅ `PATCH /api/investors/profile/me` - Update own profile (only if DRAFT/REJECTED)
- ✅ `POST /api/investors/profile/submit` - Submit profile for approval
- ✅ `GET /api/investors/public` - List visible investors (for approved ventures/admin)
- ✅ `GET /api/investors/{id}` - Get investor detail (only if visible to current user)

**Location**: `backend/apps/investors/views.py`, `backend/apps/investors/urls.py`

**Features**:
- Full CRUD operations for investor profiles
- Status workflow (DRAFT → SUBMITTED → APPROVED/REJECTED)
- Permission checks (users can only modify their own profiles)
- Status-based update restrictions (only DRAFT/REJECTED can be updated)
- Visibility toggle (`visible_to_ventures` field)

---

## 2. Incognito/Visibility Feature ✅

### Concept

Investors can choose to remain **incognito** (hidden from public view) by setting `visible_to_ventures=False`. However, when an investor **initiates a conversation** with a venture, their profile automatically becomes visible to that specific venture.

### Backend Implementation

**Model**: `InvestorVisibleToVenture`
- Tracks which ventures can see an investor's profile
- Created automatically when investor initiates conversation with a venture
- Unique constraint prevents duplicates

**Location**: `backend/apps/investors/models.py`

**Visibility Logic**:
1. **Public Visibility**: Investors with `visible_to_ventures=True` are visible to all approved ventures
2. **Incognito Visibility**: Investors with `visible_to_ventures=False` are hidden from public view
3. **Granted Visibility**: When an investor initiates a conversation, their profile becomes visible to that specific venture via `InvestorVisibleToVenture` record

**Messaging Integration**:
- When an investor creates a conversation with a venture, the system automatically grants visibility
- Location: `backend/apps/messaging/views.py` (lines 157-168)
- Uses `get_or_create()` to prevent duplicate grants

**Public List Endpoint Logic**:
```python
# Returns investors visible to the current user:
# 1. Investors with visible_to_ventures=True (publicly visible)
# 2. Investors who have granted visibility to this venture (via InvestorVisibleToVenture)
queryset = InvestorProfile.objects.filter(
    Q(visible_to_ventures=True) | Q(id__in=visible_investor_ids)
)
```

---

## 3. Investor Profile Model ✅

**Fields**:
- `id` (UUID, primary key)
- `user` (OneToOne to User)
- `full_name` (CharField, max 255)
- `organization_name` (CharField, max 255)
- `linkedin_or_website` (URLField)
- `email` (EmailField)
- `phone` (CharField, optional)
- `investment_experience_years` (IntegerField, min 0)
- `deals_count` (IntegerField, optional, min 0)
- `stage_preferences` (JSONField, list)
- `industry_preferences` (JSONField, list)
- `average_ticket_size` (CharField, max 50)
- `visible_to_ventures` (BooleanField, default=False) - **Incognito toggle**
- `status` (CharField, choices: DRAFT, SUBMITTED, APPROVED, REJECTED, SUSPENDED)
- `submitted_at` (DateTimeField, nullable)
- `approved_at` (DateTimeField, nullable)
- `created_at`, `updated_at` (DateTimeField)

**Location**: `backend/apps/investors/models.py`

---

## 4. InvestorVisibleToVenture Model ✅

**Purpose**: Track which ventures can see an investor's profile (for incognito mode)

**Fields**:
- `id` (UUID, primary key)
- `investor` (ForeignKey to InvestorProfile)
- `venture_user` (ForeignKey to User)
- `granted_at` (DateTimeField, auto_now_add)

**Unique Constraint**: `['investor', 'venture_user']` - prevents duplicate grants

**Location**: `backend/apps/investors/models.py`

---

## 5. Serializers ✅

**InvestorProfileSerializer** (Read):
- Full profile data including user information
- Used for listing and detail views

**InvestorProfileCreateSerializer** (Create):
- Validates required fields
- Sets default status to DRAFT
- Associates profile with current user

**InvestorProfileUpdateSerializer** (Update):
- Only allows updates if status is DRAFT or REJECTED
- Validates JSON fields (stage_preferences, industry_preferences)

**Location**: `backend/apps/investors/serializers.py`

---

## 6. Frontend Integration ✅

### Investor Service

**File**: `frontend/src/services/investorService.ts`

**Methods**:
- ✅ `getMyProfile()` - Get current user's investor profile
- ✅ `createProfile(data)` - Create investor profile (draft)
- ✅ `updateProfile(data)` - Update investor profile
- ✅ `submitProfile()` - Submit profile for approval
- ✅ `getPublicInvestors(params)` - List visible investors
- ✅ `getInvestorById(id)` - Get investor detail

**TypeScript Interfaces**:
- `InvestorProfile` - Full profile type
- `InvestorProfileCreatePayload` - Create payload type
- `InvestorProfileUpdatePayload` - Update payload type

---

## 7. Visibility Rules Summary

### For Ventures (Approved)

**Can See**:
- ✅ Investors with `visible_to_ventures=True` (publicly visible)
- ✅ Investors who have initiated conversations with them (via `InvestorVisibleToVenture`)

**Cannot See**:
- ❌ Investors with `visible_to_ventures=False` who haven't contacted them
- ❌ Investors with status != APPROVED

### For Investors

**Visibility Control**:
- ✅ Can toggle `visible_to_ventures` to control public visibility
- ✅ When they initiate conversation, profile becomes visible to that venture automatically
- ✅ Can remain incognito until they choose to contact ventures

### For Admins

**Can See**:
- ✅ All approved investors (regardless of visibility settings)

---

## 8. API Endpoints Summary

### User Endpoints (Authenticated INVESTOR users)
```
POST   /api/investors/profile              # Create profile (draft)
GET    /api/investors/profile/me          # Get own profile
PATCH  /api/investors/profile/me          # Update profile (DRAFT/REJECTED only)
POST   /api/investors/profile/submit      # Submit for approval
```

### Public Endpoints (Approved users)
```
GET    /api/investors/public              # List visible investors
GET    /api/investors/{id}                # Get investor detail (if visible)
```

---

## 9. Security Features

All endpoints include:
- ✅ Authentication checks (IsAuthenticated)
- ✅ Permission checks (users can only modify their own profiles)
- ✅ Status-based restrictions (only DRAFT/REJECTED can be updated)
- ✅ Input validation (JSON fields, numeric fields)
- ✅ Visibility enforcement (ventures can only see visible investors)
- ✅ SQL injection prevention (Django ORM)
- ✅ XSS prevention (DRF JSON responses)

---

## 10. Database Migrations

**Required Migration**: 
- Create `InvestorVisibleToVenture` model
- Add indexes for performance

**To Run**:
```bash
python manage.py makemigrations investors
python manage.py migrate
```

---

## 11. Testing Checklist

### Investor Profile CRUD
- [x] Investor can create profile (draft)
- [x] Investor can view own profile
- [x] Investor can update profile (DRAFT/REJECTED only)
- [x] Investor cannot update SUBMITTED/APPROVED profile
- [x] Investor can submit profile for approval
- [x] Status workflow works correctly

### Incognito Feature
- [x] Investor with `visible_to_ventures=False` is hidden from public list
- [x] Investor with `visible_to_ventures=True` is visible to all ventures
- [x] When investor initiates conversation, profile becomes visible to that venture
- [x] Visibility grant is idempotent (no duplicates)
- [x] Venture can see investor after investor contacts them
- [x] Venture cannot see incognito investors who haven't contacted them

### Visibility Rules
- [x] Approved ventures can see publicly visible investors
- [x] Approved ventures can see investors who contacted them
- [x] Approved ventures cannot see incognito investors who haven't contacted them
- [x] Admin can see all approved investors

---

## 12. Files Created/Modified

### Backend
- ✅ `apps/investors/models.py` - Added `InvestorVisibleToVenture` model
- ✅ `apps/investors/serializers.py` - Created investor serializers
- ✅ `apps/investors/views.py` - Created investor CRUD views
- ✅ `apps/investors/urls.py` - Added investor endpoints
- ✅ `apps/investors/admin.py` - Updated admin interface
- ✅ `apps/messaging/views.py` - Added incognito visibility grant logic

### Frontend
- ✅ `services/investorService.ts` - Created investor API service

---

## 13. Next Steps (Optional Enhancements)

1. **Team Members for Investors**: Add team member management (similar to ventures)
2. **Investor Documents**: Add document upload capability
3. **Investor Preferences**: Enhanced filtering and search
4. **Visibility Analytics**: Track which ventures investors have contacted
5. **Bulk Visibility Management**: Allow investors to manage visibility grants

---

## 14. Conclusion

**All Investor CRUD functionality is complete**, including:
- ✅ Full profile CRUD operations
- ✅ Approval workflow integration
- ✅ **Incognito/visibility feature** - investors can remain hidden until they initiate contact
- ✅ Automatic visibility grant when investor contacts venture
- ✅ Frontend service integration

The implementation follows security best practices, includes proper validation, and provides a complete user experience for managing investor profiles with privacy controls.

---

**Last Updated**: 2025-01-14
**Status**: ✅ Complete
