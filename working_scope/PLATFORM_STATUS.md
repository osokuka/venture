# VentureUPLink Platform Status

> **📋 Technical Debt**: Known issues and technical debt are documented in [`TECHNICAL_DEBT.md`](./TECHNICAL_DEBT.md)
> 
> **Current Known Issues**:
> - Investor Discover Page: New investors can't see pitch decks (requires approval)
> - Investor Profile Page: Stalling/freezing when viewing profile
> - Profile Edit/Save: No smooth transitions, page stalls, requires manual refresh

---

## ✅ INVESTOR VISIBILITY FIX (Jan 20, 2026)

### Problem
**Status**: ✅ **RESOLVED**

**Issue**:
- New investor registered but not showing in venture dashboard investors roster
- Venture wants to share pitch deck with newly registered investor
- Investor not visible at `/dashboard/venture/investors`

**Root Cause**:
- `PublicInvestorListView` only returned investors with `status='APPROVED'`
- New investors start with `status='DRAFT'` when profile is created
- After submission, status becomes `status='SUBMITTED'` (pending admin approval)
- Only after admin approval does status become `status='APPROVED'`
- Ventures couldn't see or share pitch decks with investors pending approval

### Solution
**Status**: ✅ **COMPLETE**

**Backend Changes**:
- Updated `PublicInvestorListView.get_queryset()` to include both `APPROVED` and `SUBMITTED` investors
- Updated `PublicInvestorDetailView.get_queryset()` to include both `APPROVED` and `SUBMITTED` investors
- Ventures can now see investors who have submitted their profiles for approval
- Allows ventures to proactively share pitch decks with investors even while they're pending approval

**Frontend Changes**:
- Added status badges in investor cards to show approval status
- "Pending Approval" badge (amber) for `SUBMITTED` investors
- "Approved" badge (green) for `APPROVED` investors
- Visual distinction helps ventures understand investor status

**Files Modified**:
- `backend/apps/investors/views.py` - Updated both `PublicInvestorListView` and `PublicInvestorDetailView`
- `frontend/src/components/VentureDashboard.tsx` - Added status badges

**Benefits**:
- Ventures can now see newly registered investors who have submitted profiles
- Ventures can share pitch decks with investors pending approval
- Clear visual indicators show which investors are approved vs pending
- Maintains security: Only `APPROVED` and `SUBMITTED` investors visible (not `DRAFT`)

**Note**: Investors still need to:
1. Create their investor profile (status: `DRAFT`)
2. Submit profile for approval (status: `SUBMITTED`) - **Now visible to ventures**
3. Get approved by admin (status: `APPROVED`) - **Fully approved**

---

## ✅ LOGIN RATE LIMITING FIX (Jan 20, 2026)

### Problem
**Status**: ✅ **RESOLVED**

**Issue**:
- Users unable to sign in due to 429 (Too Many Requests) errors
- Login endpoint had rate limit of 10 requests/hour for anonymous users
- After failed login attempts, users hit the rate limit and couldn't log in
- Frontend showed generic error messages without explaining the rate limit issue

**Root Cause**:
- `CustomTokenObtainPairView` uses `AnonRateThrottle` with default rate of 10/hour
- Multiple failed login attempts quickly exhausted the limit
- Frontend error handling didn't distinguish between 401 (invalid credentials) and 429 (rate limited)

### Solution
**Status**: ✅ **COMPLETE**

**Backend Changes**:
- Increased anonymous user rate limit from `10/hour` to `20/hour` in `DEFAULT_THROTTLE_RATES`
- Provides more reasonable limit while still preventing brute force attacks

**Frontend Changes**:
- Enhanced error handling in `LoginForm.tsx` to detect 429 status codes
- Added user-friendly rate limit message with visual indicators (Clock icon, amber styling)
- Clear instructions: "Too many login attempts. Please wait a few minutes before trying again."
- Suggests using "Forgot Password" link as alternative
- Updated `AuthContext.tsx` to properly throw errors so LoginForm can handle them
- Updated `authService.ts` to preserve response status in error objects

**Files Modified**:
- `backend/config/settings/base.py` - Increased rate limit
- `frontend/src/components/LoginForm.tsx` - Enhanced error handling
- `frontend/src/components/AuthContext.tsx` - Proper error propagation
- `frontend/src/services/authService.ts` - Preserve response in errors

**User Experience**:
- Users now see clear, actionable messages when rate limited
- Visual distinction between rate limit (amber warning) and invalid credentials (red error)
- Guidance on what to do next (wait or use forgot password)

---

## ✅ EMAIL VERIFICATION ENHANCEMENT (Jan 20, 2026)

### 1. Email Verification Page - IMPLEMENTED
**Status**: ✅ **COMPLETE**

**Features**:
- New `/verify-email` route handles email verification from email links
- Automatically extracts token from URL query parameter (`?token=...`)
- Calls backend API to verify email when page loads
- Shows loading state while verifying
- Success state with clear next steps
- Error state with helpful troubleshooting information
- LinkedIn-style UI matching the rest of the platform

**User Flow**:
1. User registers and receives verification email
2. User clicks "Verify Email Address" button in email
3. Redirected to `/verify-email?token={token}`
4. Frontend automatically calls `/api/auth/verify-email` with token
5. Backend verifies token, marks email as verified, and marks token as used
6. User sees success message and can proceed to login

**Backend Verification**:
- Endpoint: `POST /api/auth/verify-email`
- Validates token exists and is not expired/used
- Sets `user.is_email_verified = True`
- Marks token as used (`used_at = now()`)
- Returns success message

**Files Created**:
- `frontend/src/components/VerifyEmail.tsx`

**Files Modified**:
- `frontend/src/AppWithRouter.tsx` (added route)

---

### 2. Enhanced Registration Success Messages - IMPLEMENTED
**Status**: ✅ **COMPLETE**

**Changes**:
- All registration forms now show clear email verification instructions
- Prominent message advising users to check their email
- Step-by-step instructions on how to verify email
- Visual indicators (Mail icon) for email verification section
- Clear call-to-action to click the verification link
- Helpful troubleshooting (check spam folder, resend link)

**Updated Components**:
- `VentureRegistration.tsx` ✅
- `InvestorRegistration.tsx` ✅ (Fixed: Now properly shows email verification message)
- `MentorRegistration.tsx` ✅ (Fixed: Now properly shows email verification message)

**Key Fix**:
- Updated `completeRegistration` in `AuthContext.tsx` to accept `skipNavigation` option
- InvestorRegistration and MentorRegistration now use `skipNavigation: true` to prevent immediate dashboard navigation
- Users can now see the email verification instructions before being redirected
- Added "Go to Login" button on success step for Investor and Mentor registrations

**Key Features**:
- Email address highlighted in success message
- Numbered list of verification steps
- "After Verification" section showing what users can do next
- Link to login page for resending verification email

---

## ✅ REGISTRATION FLOW ENHANCEMENT (Jan 20, 2026)

### 1. Role Selection Page - IMPLEMENTED
**Status**: ✅ **COMPLETE**

**Features**:
- New `/register` route shows role selection page
- LinkedIn-style cards for Venture, Investor, and Mentor
- Users can visually compare options before selecting
- Clear descriptions and feature lists for each role
- "Continue as [Role]" button appears after selection

**Files Created**:
- `frontend/src/components/RoleSelection.tsx`

---

### 2. Unified Registration with Sidebar - IMPLEMENTED
**Status**: ✅ **COMPLETE**

**Features**:
- LinkedIn-style sidebar navigation for role selection
- Users can switch between roles during registration
- Active role highlighted with color-coded indicators
- Main content area shows selected role's registration form
- Responsive design with sticky sidebar

**Files Created**:
- `frontend/src/components/UnifiedRegistration.tsx`

**Routes**:
- `/register` - Role selection page
- `/register/:role` - Unified registration with sidebar (venture/investor/mentor)

---

### 3. Form Validation Updates - IN PROGRESS
**Status**: ⚠️ **PARTIALLY COMPLETE**

**Venture Registration** ✅:
- Removed inline validation (no validation on onChange)
- Validation only occurs on form submit
- Added helpful descriptive labels for each field
- Added warning messages with AlertCircle icons when criteria not met
- LinkedIn-style form styling with proper spacing

**Investor & Mentor Registration** ⚠️:
- Account creation step (Step 1) needs same updates
- Other steps can be updated incrementally

**Key Changes**:
- Validation errors stored in state, displayed below fields
- Clear error messages with visual indicators
- Helpful labels explaining what goes in each field
- No validation feedback until user clicks submit button

**Files Modified**:
- `frontend/src/components/VentureRegistration.tsx` ✅
- `frontend/src/components/InvestorRegistration.tsx` ⚠️ (Step 1 pending)
- `frontend/src/components/MentorRegistration.tsx` ⚠️ (Step 1 pending)

---

### 4. Navigation Updates - IMPLEMENTED
**Status**: ✅ **COMPLETE**

**Changes**:
- "Get Started" buttons now navigate to `/register` (role selection)
- HeroSection and ServicesSection updated to use new flow
- ServicesSection buttons can still pre-select role via `/register/{role}`
- All registration routes properly configured

**Files Modified**:
- `frontend/src/AppWithRouter.tsx`
- `frontend/src/components/HeroSection.tsx`
- `frontend/src/components/ServicesSection.tsx`

---

## ✅ CRITICAL FIXES - Rate Limiting & UI Errors (Jan 20, 2026)

### 1. Radix UI Select Component Error - FIXED
**Status**: ✅ **RESOLVED**

**Problem**:
- `CreatePitchDeck.tsx` component had a `SelectItem` with `value=""` (empty string)
- Radix UI requires all `SelectItem` values to be non-empty strings
- Error: `"A <Select.Item /> must have a value prop that is not an empty string"`

**Solution**:
- Changed placeholder value from `""` to `"__create_new__"`
- Updated `onValueChange` handler to detect and handle the placeholder value
- When `"__create_new__"` is selected, clears product selection and resets form data
- Component now properly handles "Create New Product" option without violating Radix UI constraints

**Files Modified**:
- `frontend/src/components/CreatePitchDeck.tsx`

---

### 2. Excessive API Calls - Rate Limiting (429 Errors) - FIXED
**Status**: ✅ **RESOLVED**

**Problem**:
- Multiple dashboard components (`ModernDashboardLayout`, `DashboardLayout`, `InvestorDashboard`, `MentorDashboard`, `VentureDashboard`) were all polling `/api/messages/conversations/unread-count` every 30 seconds
- When rate limit (429) errors occurred, intervals continued retrying, causing a flood of requests
- Default throttle rate is `100/hour` per authenticated user
- Multiple components × 30-second intervals = easily exceeding rate limits

**Solution**:
- Added rate limit detection: Check for `error?.response?.status === 429`
- When rate limited, pause polling for 5 minutes
- Reset polling interval after cooldown period
- Continue normal polling (30 seconds) when not rate limited
- Applied fix to all dashboard components that fetch unread count

**Implementation Details**:
```typescript
// Skip if we're currently rate limited
if (isRateLimited) {
  return;
}

// On 429 error, pause polling for 5 minutes
if (error?.response?.status === 429) {
  console.warn('Rate limited on unread count. Pausing polling for 5 minutes.');
  isRateLimited = true;
  setTimeout(() => {
    isRateLimited = false;
    retryDelay = 30000;
  }, 5 * 60 * 1000); // 5 minutes
  return;
}
```

**Files Modified**:
- `frontend/src/components/ModernDashboardLayout.tsx`
- `frontend/src/components/DashboardLayout.tsx`
- `frontend/src/components/InvestorDashboard.tsx`
- `frontend/src/components/MentorDashboard.tsx`
- `frontend/src/components/VentureDashboard.tsx`

**Benefits**:
- Prevents API flooding when rate limited
- Graceful degradation: Stops retrying when rate limited, resumes after cooldown
- Better user experience: No console spam from repeated 429 errors
- Respects backend rate limits while maintaining functionality

---

### 3. WebSocket Connection Issues (Vite HMR)
**Status**: ⚠️ **INFORMATIONAL** (Not Critical)

**Note**: WebSocket connection failures (`wss://ventureuplink.com:3000`) are related to Vite's Hot Module Replacement (HMR) in production. This is expected behavior when:
- Production build doesn't use HMR
- Reverse proxy doesn't forward WebSocket connections for HMR
- These errors don't affect application functionality

**No Action Required**: This is a development-time feature that's not needed in production builds.

---

## ✅ PASSWORD RESET & SECURITY ENHANCEMENTS (Jan 19, 2026)

### Frontend Password Reset UI
**Status**: ✅ **FULLY IMPLEMENTED**

**Pages:**
- ✅ `/forgot-password` - Password reset request form
- ✅ `/reset-password?token=...` - Password reset confirmation form
- ✅ "Forgot your password?" link added to login page

**Components:**
- ✅ `PasswordResetRequest.tsx` - Request form with email validation
- ✅ `PasswordResetConfirm.tsx` - Password reset form with token validation
- ✅ Real-time password strength validation
- ✅ Security: Input sanitization and validation
- ✅ User-friendly error messages and success states

**Integration:**
- ✅ `authService.requestPasswordReset()` - API integration
- ✅ `authService.confirmPasswordReset()` - API integration
- ✅ Routes configured in `AppWithRouter.tsx`
- ✅ Links to production domain (`https://ventureuplink.com`)

**User Flow:**
1. User clicks "Forgot your password?" on login page
2. Enters email on `/forgot-password`
3. Receives email with reset link
4. Clicks link → Opens `/reset-password?token=...`
5. Sets new password with validation
6. Auto-redirects to login page

---

## ✅ PASSWORD RESET & SECURITY ENHANCEMENTS (Jan 19, 2026)

### Password Reset Functionality
**Status**: ✅ **FULLY IMPLEMENTED**

**Endpoints:**
- ✅ `POST /api/auth/password-reset-request` - Request password reset (sends email)
- ✅ `POST /api/auth/password-reset-confirm` - Confirm password reset with token

**Security Features:**
- ✅ **Email Enumeration Prevention**: Always returns success message (doesn't reveal if email exists)
- ✅ **Single-Use Tokens**: Tokens are marked as used after password reset
- ✅ **Short Expiry**: Tokens expire in 1 hour (vs 24 hours for email verification)
- ✅ **IP Address Tracking**: Records IP address of reset request for security audit
- ✅ **Token Invalidation**: Existing unused tokens are invalidated when new one is created
- ✅ **Rate Limited**: 10 requests/hour for anonymous users to prevent abuse

**Email Security:**
- ✅ Professional HTML email template with security notices
- ✅ Clear expiration and single-use warnings
- ✅ Plain text fallback included
- ✅ Uses production domain (`https://ventureuplink.com`)

**Database Model:**
- ✅ `PasswordResetToken` model with indexes for performance
- ✅ Tracks `used_at`, `expires_at`, `ip_address` for security audit
- ✅ Migration created: `0002_passwordresettoken.py`

### Rate Limiting Implementation
**Status**: ✅ **FULLY IMPLEMENTED**

**Configuration:**
- ✅ Django REST Framework throttling enabled globally
- ✅ Anonymous users: **10 requests/hour**
- ✅ Authenticated users: **100 requests/hour**

**Protected Endpoints:**
- ✅ `/api/auth/register` - Prevents spam registrations
- ✅ `/api/auth/login` - Prevents brute force attacks
- ✅ `/api/auth/password-reset-request` - Prevents email spam
- ✅ `/api/auth/password-reset-confirm` - Prevents token brute forcing
- ✅ `/api/auth/resend-verification` - Prevents verification email spam

**Implementation:**
- ✅ Uses DRF's built-in `AnonRateThrottle` and `UserRateThrottle`
- ✅ Configured in `REST_FRAMEWORK` settings
- ✅ Applied via `@throttle_classes` decorator on sensitive endpoints

### Enhanced Email Security Practices
**Status**: ✅ **FULLY IMPLEMENTED**

**Token Security:**
- ✅ **Secure Token Generation**: Uses `secrets.token_urlsafe(32)` (cryptographically secure)
- ✅ **Token Expiration**: All tokens have expiration times
  - Email verification: 24 hours
  - Password reset: 1 hour (more sensitive)
- ✅ **Single-Use Tokens**: Password reset tokens are single-use only
- ✅ **Token Invalidation**: Old unused tokens are invalidated when new ones are created

**Email Delivery Security:**
- ✅ **SMTP with SSL**: All emails sent via secure SMTP (port 465, SSL)
- ✅ **No Localhost Fallbacks**: All email links use production domain
- ✅ **Error Handling**: Email failures don't block critical operations
- ✅ **Async Processing**: All emails sent via Celery (non-blocking)

**Email Content Security:**
- ✅ **No Information Disclosure**: Password reset doesn't reveal if email exists
- ✅ **Clear Security Warnings**: All emails include security notices
- ✅ **HTTPS Links**: All email links use HTTPS
- ✅ **Expiration Notices**: Users informed of token expiration times

### Registration Email Verification
**Status**: ✅ **VERIFIED & WORKING**

**Flow:**
1. User registers → `POST /api/auth/register`
2. Verification token created → `EmailVerificationToken.create_for_user()`
3. Email sent via Celery → `send_verification_email.delay()`
4. User clicks link → `POST /api/auth/verify-email`
5. Email verified → User can access platform

**Security:**
- ✅ Tokens expire in 24 hours
- ✅ Old tokens invalidated when new ones created
- ✅ Rate limited to prevent abuse
- ✅ Email sent asynchronously (non-blocking)

---

# VentureUPLink Platform Status

## ✅ PITCH DECK SHARING WITH INVESTORS (Jan 18, 2026)

### Enhanced Investor Tab - Share Pitch Deck Directly
**Location:** `/dashboard/venture/investors`  
**Implementation:**

**Key Features:**
- ✅ **"Share Pitch" button** on each investor card in the investors tab
- ✅ **CONSTRAINT: Only one active pitch deck** - Ventures can only share their ONE active pitch deck (not inactive ones)
- ✅ **Automatic active pitch deck selection**: Automatically finds the first approved product with an active pitch deck
- ✅ **Permission validation**: Checks if venture has approved products and investor is eligible
- ✅ **Visual breadcrumb indicators**: 
  - **Blue badge** showing "Pitch Deck Shared" with share date
  - **Green "Viewed" indicator** (with eye icon) if investor has viewed the pitch deck
  - **Amber "Not viewed yet" indicator** (with clock icon) if investor hasn't viewed it
- ✅ **Enhanced feedback**: 
  - Loading toast during share operation
  - Success toast with investor name and product name
  - Descriptive error messages if no active pitch deck available
- ✅ **Security**: UUID validation for all IDs, ownership verification, status checks
- ✅ **Backend integration**: Uses `productService.sharePitchDeck()` API endpoint
- ✅ **Post-share refresh**: Automatically refreshes products list and share status to update breadcrumbs

### Recent Activity Feed - Real-time Engagement Tracking
**Location:** `/dashboard/venture/overview` - "Recent Activity" card  
**Implementation:**

**Key Features:**
- ✅ **Real-time activity feed** showing actual account interactions
- ✅ **Limited to 3 most recent activities** for clean, focused display
- ✅ **Activity Types Tracked**:
  1. **Pitch Deck Approval** (Green) - Shows when admin approved your pitch deck
  2. **Pitch Deck Edit** (Purple) - Shows when you updated pitch deck metadata
  3. **Pitch Deck Share** (Blue) - Shows when pitch deck was shared with investor
  4. **Pitch Deck View** (Green) - Shows when investor viewed the pitch deck
- ✅ **Sorted by recency**: Most recent activities appear first
- ✅ **Empty state**: Clear message when no activities exist yet

**Activity Types in Detail:**

1. **Approval Activities** (Green, CheckCircle icon):
   - Title: "Pitch Deck Approved"
   - Description: "Your pitch deck '[Product Name]' was approved by admin"
   - Timestamp: Uses `product.approved_at` from backend
   - Shows when admin approves your product/pitch deck

2. **Edit Activities** (Purple, FileText icon):
   - Title: "Pitch Deck Updated"
   - Description: "You updated your pitch deck metadata"
   - Timestamp: Uses `document.updated_at` from backend
   - Only shows if `updated_at` differs from `uploaded_at` (actual edit, not just upload)

3. **Share Activities** (Blue, Send icon):
   - Title: "Pitch Deck Shared"
   - Description: "Shared with [Investor Name/Email]"
   - Timestamp: Uses `share.shared_at` from backend
   - Shows investor name or email

4. **View Activities** (Green, Eye icon):
   - Title: "Pitch Deck Viewed"
   - Description: "[Investor Name] viewed your pitch deck"
   - Timestamp: Uses `share.viewed_at` from backend
   - Only appears after investor actually views the pitch deck

**User Experience:**
- Venture sees **top 3 most recent activities** on overview dashboard
- Can track pitch deck approval, edits, shares, and investor engagement
- Activities update automatically when viewing overview
- Provides timeline of key interactions and milestones
- Clear visual indicators with color-coded icons for each activity type

**Technical Implementation:**
- New `recentActivity` state to store activity items
- `fetchRecentActivity()` useEffect fetches data when on overview page
- **Approval detection**: Checks `product.approved_at` for all approved products
- **Edit detection**: Compares `document.updated_at` vs `document.uploaded_at`
- **Share/View fetching**: Calls `productService.listPitchDeckShares()`
- Helper function `getTimeAgo()` converts timestamps to readable format
- Activities sorted by timestamp (most recent first)
- **Limited to 3 items** for focused, clean display

**Files Modified:**
- `frontend/src/components/VentureDashboard.tsx`:
  - Added `recentActivity` state
  - Enhanced `fetchRecentActivity()` useEffect with:
    - Approval activity generation from `product.approved_at`
    - Edit activity generation from `document.updated_at`
    - Share activity generation from pitch deck shares API
    - View activity generation from `share.viewed_at`
  - Limited results to 3 most recent activities
  - Added `getTimeAgo()` helper function

**Result:** ✅ Ventures now have a **focused activity feed (3 items)** showing the most important recent interactions: admin approvals, their own edits, shares with investors, and investor engagement (views). The feed provides immediate visibility into pitch deck lifecycle and investor interest.

**User Experience Flow:**
1. Venture navigates to "Investors" tab
2. Browses available investors (filtered by approval status, stage preferences, etc.)
3. **Visual feedback**: If pitch deck already shared, blue breadcrumb shows:
   - "Pitch Deck Shared" with date
   - "Viewed" (green) or "Not viewed yet" (amber) status
4. Clicks "Share Pitch" button on desired investor card
5. System validates:
   - Venture has at least one approved product
   - Product has an ACTIVE pitch deck (constraint enforced)
   - Investor profile is approved
6. Pitch deck is shared with confirmation toast
7. **Breadcrumb appears immediately** showing share status
8. Investor receives access to view/download the pitch deck
9. **When investor views pitch deck**, breadcrumb updates to show "Viewed" status

**Constraints Implemented:**
- ✅ **One Active Pitch Deck Only**: Ventures can only have ONE active pitch deck at a time
- ✅ **Share Active Only**: System only selects and shares ACTIVE pitch decks (ignores inactive ones)
- ✅ **Clear Error Messages**: If no active pitch deck exists, user gets clear guidance to activate one

**Files Modified:**
- `frontend/src/components/VentureDashboard.tsx` - Enhanced with:
  - **State management**: Added `pitchDeckShareStatus` to track share/viewed status per investor
  - **Fetch function**: `fetchPitchDeckShareStatus()` loads share data from backend
  - **Enhanced `handleSharePitch()`**: Only shares active pitch decks with better validation
  - **Visual breadcrumbs**: Blue card with share date, green/amber viewed indicators
  - **Auto-refresh**: Refreshes share status after each share operation

**Backend API Used:**
- `POST /api/ventures/products/{product_id}/documents/{doc_id}/share` - Share pitch deck
- `GET /api/ventures/products/{product_id}/documents/{doc_id}/shares` - Get share status
- Backend tracks `viewed_at` timestamp when investor views pitch deck

**Visual Indicators:**
```typescript
// Blue breadcrumb card when pitch deck is shared
<div className="p-3 bg-blue-50 border border-blue-200">
  <CheckCircle /> "Pitch Deck Shared" + Date
  
  // If viewed:
  <Eye className="text-green-600" /> "Viewed"
  
  // If not viewed:
  <Clock className="text-amber-600" /> "Not viewed yet"
</div>
```

**Result:** ✅ Ventures can now easily share their ONE active pitch deck with investors from the investors browse tab. Clear visual breadcrumbs show share status and viewed status, providing immediate feedback on investor engagement. System enforces constraint that only active pitch decks can be shared, ensuring ventures maintain control over which version investors see.

---

## ✅ HORIZONTAL PITCH DECK CARDS (Jan 18, 2026)

### New Feature - Horizontal Card Layout with View/Download
**Location:** `/dashboard/venture/pitch`  
**Implementation:**
- ✅ Changed from vertical 3-column grid to horizontal stacked cards
- ✅ **Left side:** Company info (1/3 width) - gradient blue background
  - Company name, industry, status badge
  - Status, Active status  
  - Investment size (large display)
  - Funding stage
- ✅ **Right side:** Pitch deck preview & actions (2/3 width)
  - "View Full Details" button (opens full pitch deck view)
  - Grid preview of Problem, Solution, Market, Use of Funds (2x2 grid)
  - "Download Pitch Deck (PDF/PPT)" button
  - All action buttons (Edit, Submit, Activate, Delete, etc.)
- ✅ Fully responsive: stacks vertically on mobile
- ✅ Clean, professional LinkedIn-style design

**Bug Fix:**
- ✅ Fixed 500 error caused by unclosed JSX div tags
- ✅ Fixed syntax error in horizontal layout structure
- ✅ All linter errors resolved (only harmless TS module declarations remain)
- ✅ Fixed "View Full Details" button - now opens comprehensive full-page view

**Full-Page Pitch Deck View:**
- ✅ "View Full Details" button opens pitch deck in NEW TAB (NO_MODALS_RULE compliant)
- ✅ Route: `/dashboard/venture/pitch-deck/{productId}/{docId}`
- ✅ **Complete Metadata Display** (per user request):
  
  **Submission Information Card** (Blue gradient):
  - ✅ Created By: User name and email (venture owner)
  - ✅ Status: Badge showing DRAFT/SUBMITTED/APPROVED/REJECTED + Active status
  - ✅ Timeline: Created date, Submitted date, Approved date (if applicable)
  
  **Pitch Deck Document Info** (Blue border, highlighted):
  - ✅ Document type, file size
  - ✅ Uploaded date and time
  - ✅ Last updated date and time
  
  **Company Overview:**
  - ✅ Description, website, LinkedIn, location, team size, founded year, industry
  
  **Business Information:**
  - ✅ Problem Statement (full text, proper spacing)
  - ✅ Solution Description (full text, proper spacing)
  - ✅ Target Market (full text, proper spacing)
  - ✅ Traction & Metrics (formatted display with JSON parsing)
  
  **Funding Details** (Green gradient card):
  - ✅ Funding amount (large prominent display)
  - ✅ Funding stage (badge)
  - ✅ Use of funds (full text, proper spacing)
  
  **Additional:**
  - ✅ Other Documents (if available)
  - ✅ "View PDF" button to open document in browser
  - ✅ "Download" button to save PDF locally
  - ✅ Back navigation to pitch deck list

- ✅ **Works for ALL user types:**
  - Ventures: Can view their own pitch decks with full metadata
  - Investors: Can view shared/accessible pitch decks
  - Admins: Can view any pitch deck with creator and approval info

**Files Modified:**
- `frontend/src/components/ProductManagement.tsx` - Updated "View Full Details" button to open new tab
- `frontend/src/components/PitchDeckDetails.tsx` - ENHANCED with creator info, approval timeline, document metadata
- `frontend/src/AppWithRouter.tsx` - Added venture pitch deck details route

**Result:** ✅ Complete, professional pitch deck viewing experience with WHO created it, WHEN it was approved, and ALL metadata displayed beautifully per user requirements

**Backend Fix (Jan 18, 2026 - 22:40):**
- ✅ Fixed 500 error - URL pattern mismatch (`product_id` vs `id`)
- ✅ Updated `ProductDetailView` to use correct `lookup_field`
- ✅ Backend restarted and working

---

## ✅ CRITICAL FIXES (Jan 18, 2026)

### 3. Backend URL Mismatch - FIXED 500 Error
**Problem:** `GET /api/ventures/products/{id}` returning 500 error when viewing pitch deck details  
**Root Cause:** URL pattern uses `<uuid:product_id>` but view had `lookup_field = 'id'` causing FieldError  
**Solution:**
- Set `ProductDetailView.lookup_field = 'id'` (model field name)
- Set `lookup_url_kwarg = 'product_id'` (URL parameter name)
- This allows URL to use `product_id` while querying model by `id`
- Restarted Django backend

**Files Modified:**
- `backend/apps/ventures/views.py` - Fixed ProductDetailView lookup configuration

**Result:** ✅ Pitch deck details page now loads correctly for ventures viewing their own pitch decks

### 4. Edit Pitch Form - FIXED Data Display & Validation Issues
**Problem:** 
1. "Invalid funding stage" error when saving edits
2. Traction metrics showing as "[object Object]" in edit form (JSON not displayed properly)

**Root Causes:**
1. Select dropdown values (`pre-seed`, `seed`, `series-a`) didn't match backend validation (`PRE_SEED`, `SEED`, `SERIES_A`)
2. Traction metrics (JSON object) wasn't serialized to string for textarea display
3. When saving, JSON string wasn't parsed back to object

**Solutions:**
1. ✅ **Fixed funding stage values** - Changed select options to uppercase with underscores:
   - `pre-seed` → `PRE_SEED`
   - `seed` → `SEED`
   - `series-a` → `SERIES_A`
   - `series-b` → `SERIES_B`
   - `series-c` → `SERIES_C`
   - Added `GROWTH` option
   
2. ✅ **Fixed traction metrics display** - In `openEditDialog()`:
   - Check if `traction_metrics` is object
   - Serialize to formatted JSON string with `JSON.stringify(obj, null, 2)`
   - Display in textarea as readable JSON
   
3. ✅ **Fixed traction metrics saving** - In `handleUpdate()`:
   - Try to parse string as JSON
   - If valid JSON, send as object
   - If not valid JSON, send as sanitized string

**Files Modified:**
- `frontend/src/components/ProductManagement.tsx` - Fixed funding stage values and traction metrics handling

**Result:** ✅ Users can now edit pitch decks with all data properly displayed and saved without validation errors

### 5. Traction Metrics UX - Dynamic Fields (Jan 18, 2026 - 23:10)
**Problem:** Users don't know how to edit JSON in textarea - showing `{"users": "500", "revenue": "$2M"}` is confusing  
**User Request:** "we need to enumerate through json and create fields properly... users may not know how to edit the values in JSON"

**Solution - User-Friendly Dynamic Form:**
1. ✅ **Parse JSON into individual fields** - Each key-value pair becomes two input fields
2. ✅ **Add/Remove buttons** - Users can add new metrics or remove existing ones
3. ✅ **Visual layout:**
   - Left input: Metric name (e.g., "users", "revenue", "growth")
   - Right input: Value (e.g., "500", "$2M monthly", "20% MoM")
   - X button: Remove this metric
   - "+ Add Metric" button at top
4. ✅ **Example guidance** - Shows examples below the fields
5. ✅ **Empty state** - Friendly message when no metrics added yet
6. ✅ **Auto-save as JSON** - Reconstructs JSON object when saving

**Implementation:**
```tsx
// State for dynamic fields
const [tractionMetricsFields, setTractionMetricsFields] = useState<Array<{key: string, value: string}>>([]);

// On load - parse JSON to fields
if (pitchDeck.traction_metrics && typeof pitchDeck.traction_metrics === 'object') {
  metricsFields = Object.entries(pitchDeck.traction_metrics).map(([key, value]) => ({
    key,
    value: String(value)
  }));
}

// On save - reconstruct JSON
const metricsObj: any = {};
tractionMetricsFields.forEach(field => {
  if (field.key.trim() && field.value.trim()) {
    metricsObj[field.key.trim()] = field.value.trim();
  }
});
pitchDeckData.traction_metrics = metricsObj;
```

**Files Modified:**
- `frontend/src/components/ProductManagement.tsx` - Replaced ALL textareas with dynamic form (edit form at line 984)

**Fix Applied (Jan 18, 2026 - 23:25):**
- ✅ Found remaining textarea in edit form (CSS selector issue user reported)
- ✅ Replaced with dynamic fields interface
- ✅ Now ALL instances use user-friendly form

**Result:** ✅ Non-technical users can easily add/edit traction metrics without touching JSON - no more confusing textareas anywhere!

---

## ✅ CRITICAL FIXES (Jan 18, 2026)

### 1. Admin Review Page - FIXED Overflow + LinkedIn Style
**Problem:** Text still overflowing, unreadable  
**Solution:**
- Applied inline `style={{ maxWidth: '100%', overflow: 'hidden' }}` to ALL containers
- Used `style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}` on ALL text
- Made document section vertical stack (not flex-row)
- Fixed all Business Model, Funding sections with proper overflow handling
- All text now uses inline styles + Tailwind for maximum compatibility

### 2. Venture CRUD Edit Not Saving - FIXED
**Problem:** Edited pitch deck data not submitting, admin seeing wrong/old data  
**Root Cause:** Line 194 condition too restrictive - only updated if `problem_statement || solution_description || target_market` had values  
**Solution:**
- REMOVED restrictive condition
- Now ALWAYS fetches pitch deck and attempts to update ALL fields
- Checks each field with `!== undefined && !== null` before sending
- Sends all available pitch deck data on every edit
- Backend receives correct updated data

**Files Modified:**
- `frontend/src/components/PitchDeckReview.tsx` - Added inline styles for overflow prevention
- `frontend/src/components/ProductManagement.tsx` - Fixed handleUpdate logic to always send pitch deck data

## ✅ UI FIX - LinkedIn-Style Admin Review Page (Jan 18, 2026)

### Problem
**URL:** `/dashboard/admin/pitch-deck-review`  
**Issues:**
- ❌ Text overflowing containers - unreadable
- ❌ Long URLs breaking layout
- ❌ Poor spacing and typography
- ❌ Not professional looking
- ❌ Not responsive on mobile

### Solution - Complete LinkedIn-Style Redesign ✅

**Fixed All Overflow Issues:**
- Applied `break-words`, `whitespace-pre-wrap` to ALL text
- URLs use `break-all max-w-[250px] truncate`
- Containers use `flex-1 min-w-0` for proper flex shrinking

**LinkedIn-Style Professional Design:**
- ✅ Sticky header with subtle shadow
- ✅ Clean card design with `shadow-sm`, `border-b border-gray-100`
- ✅ Professional color palette (blue, green, red, grays)
- ✅ Gradient backgrounds for emphasis
- ✅ Rounded icons in colored containers
- ✅ Consistent spacing (4, 6 unit scale)
- ✅ Professional typography with `leading-relaxed`

**Fully Responsive:**
- ✅ Mobile: Single column, stacked layout
- ✅ Tablet: Two-column grids
- ✅ Desktop: Three-column (2 main + 1 sidebar)
- ✅ Flex layouts with `flex-col sm:flex-row`
- ✅ Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

**Key Improvements:**
- Product overview with large icon, badges
- Document section with gradient, double border
- Business model sections with separators
- Funding request with eye-catching gradient card
- Sidebar with circular avatars, timeline icons
- Action buttons color-coded and prominent

**Files Modified:**
- `frontend/src/components/PitchDeckReview.tsx` - Complete rewrite (564 lines)
- `working_scope/LINKEDIN_STYLE_UI_FIX.md` - Complete documentation

**Result:** ✅ Professional, readable, responsive, LinkedIn-style design

### 6. Admin Approve Button Enhancement (Jan 18, 2026 - 23:30)
**User Request:** "in the admin panel please show approve button with green"

**Already Implemented + Enhanced:**
- ✅ Approve button was already green (`bg-green-600 hover:bg-green-700`)
- ✅ **Added enhancements for better visibility:**
  - Header button: Added `font-semibold shadow-md hover:shadow-lg`
  - Main button: Added `font-bold shadow-lg hover:shadow-xl text-base py-6` (larger, bolder)
  - Added checkmark icon "✓" for visual emphasis
  - Increased icon size to `w-5 h-5`

**Buttons:**
1. **Header (Top Right):** Small green approve button
2. **Action Card (Sidebar):** Large prominent green approve button with checkmark

**Files Modified:**
- `frontend/src/components/PitchDeckReview.tsx` - Enhanced approve button styling

**Result:** ✅ Green approve button is highly visible and prominent in admin review page

**Fix Applied (Jan 18, 2026 - 23:35):**
**Problem:** Button was invisible (user reported via CSS selector)
**Root Cause:** Button was getting hidden or had visibility issues in blue background card
**Solution:**
- Changed action card background from `bg-blue-50` to `bg-white` for better contrast
- Changed border from `border-blue-200` to `border-green-300` for visual emphasis
- Added `!important` flags to override any conflicting styles: `!bg-green-600` `!text-white`
- Added inline style: `style={{ backgroundColor: '#16a34a', color: '#ffffff' }}`
- Added `relative z-10` for proper layering
- Increased spacing: `space-y-3` instead of `space-y-2`

**Result:** ✅ Button now fully visible with strong green color on white background

**Additional Fix (Jan 18, 2026 - 23:40):**
**Problem:** Header approve button also not showing green
**Solution:** Applied same forced styling to header button:
- Added `!important` flags: `!bg-green-600` `hover:!bg-green-700` `!text-white`
- Added inline style: `style={{ backgroundColor: '#16a34a', color: '#ffffff', borderColor: '#16a34a' }}`
- Added `border-0` to remove any conflicting borders

**Result:** ✅ BOTH approve buttons (header + sidebar) now show bright green (#16a34a)

---

## 🚨 CRITICAL FIX - CRUD Simplification (Jan 18, 2026)

### ✅ Backend 500 Error RESOLVED
**Problem:** `GET /api/ventures/products/{id}` returning 500 Internal Server Error  
**Root Cause:** Duplicate `get_queryset()` methods in `ProductDetailView` class (lines 90-99 and 110-119)  
**Solution:** Removed duplicate code, kept single clean implementation  
**File:** `backend/apps/ventures/views.py`  
**Result:** Backend restarted, 500 error ELIMINATED ✅

### ✅ Frontend Duplication ELIMINATED  
**Problem:** Two divs showing same data - very confusing UX  
**Root Cause:**  
- Main card list showing pitch deck data
- "Manage Product" view (lines 1027-1166) showing same data again with tabs
- "View Documents" and "Upload Pitch Deck" buttons opening duplicate view

**Solution - MASSIVE SIMPLIFICATION:**
1. ✅ Removed entire "Manage Product" view section (~150 lines deleted)
2. ✅ Removed "View Documents" button (no longer needed)
3. ✅ Removed "Upload Pitch Deck" button (redundant)
4. ✅ Removed tab switching logic (Company Data, Pitch Decks tabs)
5. ✅ Removed state: `managingProductId`, `activeTab`
6. ✅ Removed functions: `openManageDialog()`, auto-open logic

**New Simplified Structure:**
- ✅ ONE card list view showing ALL pitch deck data inline (no clicking to view)
- ✅ ONE "Edit Pitch" button → unified form (company + pitch deck fields together)
- ✅ Simple clear actions: Submit, Reopen, Activate, Delete
- ✅ No tabs, no separate views, everything in one place

**Files Modified:**
- `backend/apps/ventures/views.py` - Fixed duplicate code
- `frontend/src/components/ProductManagement.tsx` - Removed ~150 lines
- `working_scope/CRUD_SIMPLIFICATION.md` - Complete documentation ✅

**Result:**  
- ✅ Backend: 500 error GONE  
- ✅ Frontend: Duplication GONE  
- ✅ UX: Simpler, faster, clearer  
- ✅ Code: ~150 lines removed

---

## Recent Features & Fixes (2026-01-18)

### ✅ PITCH ROUTE ENHANCEMENT - Show All Pitch Decks

**User Request:** "my pitchdecks should show here as well" (at `/dashboard/venture/pitch`)

**Solution:** Updated `/dashboard/venture/pitch` route to display ProductManagement component showing ALL pitch decks (DRAFT, SUBMITTED, APPROVED, REJECTED) with default tab set to 'documents'.

**Files Changed:**
- `frontend/src/components/VentureDashboard.tsx` - Updated renderPitch() function

---

### ✅ ADMIN PITCH DECK APPROVAL ENHANCEMENT (NO_MODALS_RULE Compliant)

**User Requests:**
1. "show the name of pitchdeck and then underneath show the user"
2. "make it possible to open the pitchdeck and view its details with log of its creation date"
3. "make it possible for admin to see the uploaded document also"
4. "if admin rejects it, have a commentary section explaining why its rejected"

**Solution Implemented (per NO_MODALS_RULE.md):**

✅ **Pitch Deck Prominent Display on Cards:**
- Product/pitch deck name in 2xl bold text with FileText icon
- Industry badge, funding amount & stage shown upfront
- Problem statement preview (line-clamp-2)
- User info underneath in bordered section with "Submitted by:" label
- Creation and submission dates with Clock icons

✅ **Full Details View in New Tab (Not Modal):**
- Created `/dashboard/admin/pitch-deck-review` route
- New `PitchDeckReview.tsx` component for full-page review
- "View Details in New Tab" button uses `window.open()` with noopener/noreferrer
- Comprehensive sections: Company Info, Document, Business Model, Funding, Traction, Timeline
- "View Document" button opens PDF/PPT in separate tab
- Approve/Reject actions available on review page
- Rejection form inline on review page (not in modal)

✅ **Enhanced Rejection Commentary:**
- Dialog title shows pitch deck name: "Reject Pitch Deck: [Name]"
- Description clarifies venture will receive feedback
- Textarea for detailed rejection reason (required)

**Files Changed:**
- `backend/apps/approvals/serializers.py` - Enhanced with pitch deck fields
- `frontend/src/services/adminService.ts` - Updated TypeScript interface
- `frontend/src/components/ApprovalsManagementTab.tsx` - Pitch deck prominent display, new tab navigation
- `frontend/src/components/PitchDeckReview.tsx` - NEW full-page review component
- `frontend/src/AppWithRouter.tsx` - Added `/dashboard/admin/pitch-deck-review` route

**NO_MODALS_RULE Compliance:** ✅ Details open in new tab, not modal. Rejection dialog remains (requires textarea input, acceptable per rule for data entry forms).

**Documentation Compliance:** ✅ Per DOCUMENTATION_INDEX.md, deleted 4 unnecessary MD files (ADMIN_APPROVAL_COMPLETE.md, PITCH_ROUTE_ENHANCEMENT.md, ADMIN_APPROVAL_UI_IMPLEMENTATION.md, APPROVAL_UI_CHANGES_SUMMARY.md - total 38KB) and consolidated all information into this file.

**UI Improvements (2026-01-18):**
- ✅ Fixed "View Document" button overflow - Now responsive (flex-col on mobile, flex-row on desktop)
- ✅ Made Approve button green with inline style (#16a34a) for visibility
- ✅ Added "Delete Pitch Deck" button for admin to permanently remove pitch decks
- ✅ Delete function uses `/api/ventures/products/{id}/delete` endpoint with admin override
- ✅ Confirmation dialog shows warnings about permanent deletion
- ✅ All buttons properly aligned and visible in both header and sidebar

**Admin Delete Feature:**
- Backend updated to allow admins to delete products in ANY status (DRAFT, REJECTED, SUBMITTED, APPROVED)
- Regular users still restricted to DRAFT/REJECTED only
- Admin check: `is_staff` or member of 'Admin'/'Reviewer' groups
- Frontend shows confirmation with detailed warnings
- Cascades deletion to documents, team members, founders, and files
- Uses existing `productService.deleteProduct()` method with proper API configuration

**Bug Fix (404 on delete):**
- Fixed: Frontend was using raw `fetch()` instead of configured API client
- Now uses: `productService.deleteProduct()` which includes proper baseURL and auth headers
- Route: `/api/ventures/products/{id}/delete` correctly mapped to backend

**Files Modified:**
- `frontend/src/components/PitchDeckReview.tsx` - Added delete button, responsive layout, green approve button, fixed API call
- `backend/apps/ventures/views.py` - Updated `delete_product()` to allow admin override

### ✅ PRODUCT MANAGEMENT TABS - UI FIX (2026-01-18)

**User Report:** "tabs below Manage Product do not have save button, also they do not render properly"

**Issues Fixed:**
1. ✅ Save buttons now visible with blue color and CheckCircle icon
2. ✅ Button text changed: "Add Team Member" → "Save Team Member", "Update" → "Save Changes"
3. ✅ Added alert messages explaining when editing is disabled (SUBMITTED/APPROVED status)
4. ✅ Improved grid layout responsiveness (grid-cols-1 md:grid-cols-2)
5. ✅ Added bg-gray-50 to disabled fields for better visual feedback
6. ✅ Added padding (pt-2) to button containers for better spacing
7. ✅ Company Data tab now has "Edit Company Data" button when editable

**Changes:**
- Company Data tab: Added status alert, improved layout, added edit button
- Team Members tab: Added status alert, visible save buttons, better styling
- Founders tab: Added status alert, visible save buttons, better styling
- All save buttons: Blue background (#2563eb), CheckCircle icon, clear labels

**File Modified:**
- `frontend/src/components/ProductManagement.tsx` - Enhanced all manage tabs

### ✅ REOPEN APPROVED/SUBMITTED PRODUCTS FOR EDITING (2026-01-18)

**User Request:** "this pitchdeck should be able to change and submit for approval once changed" (for APPROVED status products)

**Business Requirement:**
Users need ability to update APPROVED or SUBMITTED products and resubmit for approval. This is standard workflow for continuous improvement.

**Implementation:**

**Backend (Django):**
1. ✅ Created `reopen_product()` view in `backend/apps/ventures/views.py`
   - POST `/api/ventures/products/{id}/reopen`
   - Changes status: APPROVED/SUBMITTED → DRAFT
   - Requires authentication, user must be owner
   - Returns previous and new status

2. ✅ Added URL route in `backend/apps/ventures/urls.py`
   - `path('products/<uuid:product_id>/reopen', reopen_product, name='reopen_product')`

**Frontend (React):**
1. ✅ Added `reopenProduct()` method to `frontend/src/services/productService.ts`
   - Returns: `{ detail, previous_status, new_status }`

2. ✅ Enhanced `ProductManagement.tsx`:
   - Added `handleReopen()` function with confirmation dialog
   - Added "Reopen for Editing" button (blue styling) for APPROVED/SUBMITTED products
   - Button appears in product card actions AND manage view header
   - Updated alert messages: "Click 'Reopen for Editing' button to change status to DRAFT and enable editing"
   - After reopening, refreshes product list and reloads details if in manage view

**User Workflow:**
1. User has APPROVED product
2. Clicks "Reopen for Editing" button
3. Confirms: "Reopen 'Product Name' for editing? Status will change from APPROVED to DRAFT..."
4. Product status → DRAFT
5. User can now edit company data, team members, founders, pitch decks
6. User makes changes
7. User clicks "Submit Complete Package" to resubmit for approval
8. Status → SUBMITTED, admin reviews again

**Security:**
- UUID validation on product ID
- User authentication required
- User must be product owner
- Backend validates status (only APPROVED/SUBMITTED can be reopened)

**Files Modified:**
- `backend/apps/ventures/views.py` - Added reopen_product view
- `backend/apps/ventures/urls.py` - Added reopen route and import
- `frontend/src/services/productService.ts` - Added reopenProduct method
- `frontend/src/components/ProductManagement.tsx` - Added reopen functionality and UI

### ⚠️ **PITCH DECK MANAGEMENT SIMPLIFICATION - IN PROGRESS** (2026-01-18)

**User Report:**  
"tabs below are still inaccessible, tab team members is not rendering/breaking the page, same with founders, same with tab pitchdeck. remove any unnecessary tabs not related to pitchdeck and simplify the editing procedure"

**Issues Identified:**
1. ❌ Team Members tab causing page rendering errors
2. ❌ Founders tab causing page rendering errors  
3. ❌ Too many editing steps - complex workflow
4. ❌ Tabs not related to pitch deck management cluttering UI
5. ❌ Forms inaccessible/breaking in certain product statuses
6. ❌ `Upload` icon not imported, causing errors on line 949

**Changes Completed:**
1. ✅ Fixed `Upload` icon import from lucide-react
2. ✅ Removed unused TypeScript interfaces (`TeamMember`, `Founder`, `TeamMemberCreatePayload`, `FounderCreatePayload`)
3. ✅ Simplified `defaultTab` type to only `'company' | 'documents'`
4. ✅ Removed all team member/founder state variables
5. ✅ Removed all team member/founder handler functions
6. ✅ Updated `openManageDialog` signature to accept only `'company' | 'documents'`
7. ✅ Simplified `loadProductDetails` to only fetch documents (no team/founders)
8. ✅ Simplified tab navigation UI - removed Team Members and Founders tab buttons

**Remaining Issues:**
- ⚠️ **CRITICAL:** Large Team Members and Founders tab content sections still exist (~lines 1210-1545)
- ⚠️ These sections reference undefined variables (`teamMembers`, `founders`, `teamMemberForm`, `founderForm`, `editingTeamMember`, `editingFounder`)
- ⚠️ Call undefined handlers (`handleCreateTeamMember`, `handleUpdateTeamMember`, `handleDeleteTeamMember`, `handleCreateFounder`, `handleUpdateFounder`, `handleDeleteFounder`, `startEditTeamMember`, `startEditFounder`)
- ⚠️ Will cause runtime errors if code execution reaches these sections
- ⚠️ Need manual file editing to remove these large sections due to file size/complexity

**Target Simplified Workflow:**
1. Create Product
2. View/Edit Company Data (if DRAFT/REJECTED)  
3. Upload Pitch Deck
4. Submit Complete Package
5. Done!

**Files Modified:**
- `frontend/src/components/ProductManagement.tsx` - Partial simplification (imports, types, state, handlers removed; large UI sections remain and need manual removal)
- `working_scope/PLATFORM_STATUS.md` - Documented changes

**Status:** ⚠️ **PARTIALLY COMPLETE** - Core simplifications done, but large content sections need manual removal to prevent runtime errors

**Bug Fix (2026-01-18):**
- ✅ Added missing `X` icon import from lucide-react (was causing "X is not defined" errors on lines 980 and 1127)
- ✅ Error occurred when clicking "Edit Company Data" or "Manage" buttons
- ✅ Fixed by adding `X` to lucide-react imports

### ✅ **PITCH DECK EDITING WORKFLOW SIMPLIFIED** (2026-01-18)

**User Request:** "change text product to Pitch, show previous data in the pitch in corresponding fields for easier edit, include all pitchdeck fields. explain what is Manage and edit company data. there should be only one for simplifying purpose make it edit pitch"

**Problem Identified:**
- **Confusing UI:** Two buttons doing similar things:
  1. "Manage" → Opens tabs view (Company Data + Pitch Decks)
  2. "Edit Company Data" → Opens edit form with only basic fields
- **Incomplete Edit Form:** Missing pitch deck fields (problem_statement, solution, target market, etc.)
- **No Data Pre-filling:** Pitch deck fields were empty even if data existed
- **Wrong Terminology:** Using "product" instead of "pitch"

**Solution Implemented:**

**1. Simplified Button Structure:**
- ❌ REMOVED: "Manage" button (confusing, redundant)
- ❌ REMOVED: "Edit Company Data" button  
- ✅ NEW: **"Edit Pitch"** button - One clear action
- ✅ NEW: **"View Documents"** button - For viewing uploaded pitch decks

**2. Enhanced Edit Form:**
- ✅ Changed "Edit Product" → "Edit Pitch Deck"
- ✅ Changed "Update product details" → "Update your pitch deck details"
- ✅ Changed "Product Name" → "Company Name"  
- ✅ Changed "Update Product" → "Save Pitch" (with blue button + CheckCircle icon)

**3. Complete Pitch Deck Fields Added:**
- ✅ Problem Statement *
- ✅ Solution Description *
- ✅ Target Market *
- ✅ Traction & Metrics
- ✅ Funding Stage (dropdown)
- ✅ Funding Amount Sought
- ✅ Use of Funds

**4. Data Pre-filling:**
- ✅ `openEditDialog()` now async - fetches existing pitch deck data
- ✅ Pre-fills ALL fields with existing data from both product AND pitch deck
- ✅ Users see their current data when editing
- ✅ Form state includes all pitch deck fields

**5. Visual Improvements:**
- ✅ Added placeholders to all fields
- ✅ Added "Pitch Deck Details" section header
- ✅ Responsive grid layouts (grid-cols-1 md:grid-cols-2)
- ✅ Blue "Save Pitch" button with icon
- ✅ Clear field labels and helpful placeholders

**User Workflow Now:**
1. Click **"Edit Pitch"** → Opens comprehensive edit form
2. All current data pre-filled automatically
3. Edit any fields (company info + pitch deck details)
4. Click **"Save Pitch"** → Updates everything
5. Done! Simple and clear.

**Files Modified:**
- `frontend/src/components/ProductManagement.tsx`:
  - Updated formData state to include all pitch deck fields
  - Made `openEditDialog()` async to load pitch deck data
  - Changed all "product" text to "pitch"
  - Renamed buttons: "Edit Company Data" → "Edit Pitch", "Manage" → "View Documents"
  - Added all pitch deck fields to edit form
  - Enhanced UI with placeholders and better layout
- `working_scope/PLATFORM_STATUS.md` - Documented simplification

**Bug Fix (2026-01-18):**
- ✅ Added missing `Users` and `UserPlus` icons from lucide-react
- ✅ Error: "UserPlus is not defined" at line 1335 when clicking "View Documents"
- ✅ These icons are still used in legacy Team Members/Founders sections that need removal

**Critical Bug Fix (2026-01-18):**
- ✅ Fixed 500 Internal Server Error when saving edited pitch
- ✅ **Root Cause:** Trying to send pitch deck fields (problem_statement, solution_description, etc.) to product update endpoint
- ✅ **Solution:** Split update into two steps:
  1. Update product fields (name, website, description) via product endpoint
  2. Update pitch deck fields (problem, solution, market, funding) via pitch deck metadata endpoint
- ✅ Now `handleUpdate()` correctly separates product data from pitch deck data
- ✅ Pitch deck updates are gracefully handled (won't fail if no pitch deck exists)

**Files Modified:**
- `frontend/src/components/ProductManagement.tsx` - Fixed handleUpdate to update product and pitch deck separately

**Critical Bug Fixes (2026-01-18):**

**1. Removed Legacy Team Members & Founders Code (COMPLETE):**
- ✅ **UI Sections Removed** (~330 lines): Team Members and Founders tab JSX (lines ~1350-1680)
- ✅ **Handler Functions Removed** (~210 lines): All team/founder CRUD functions
  - Deleted: `handleCreateTeamMember`, `handleUpdateTeamMember`, `handleDeleteTeamMember`, `startEditTeamMember`
  - Deleted: `handleCreateFounder`, `handleUpdateFounder`, `handleDeleteFounder`, `startEditFounder`
- ✅ **Fixed Function Definition:** `loadPitchDeckData` now has correct signature
- ✅ Error: "editingTeamMember is not defined" → RESOLVED
- ✅ Error: "UserPlus is not defined" → RESOLVED (added to imports)
- ✅ Component size: ~2010 lines → ~1465 lines (545 lines removed)
- ✅ Only 4 harmless TS module declaration errors remaining (normal)

**2. Linter Status:**
- ✅ All runtime errors resolved
- ✅ Only benign TypeScript module declaration warnings remain
- ✅ No undefined variable errors
- ✅ No undefined function errors

**Files Modified:**
- `frontend/src/components/ProductManagement.tsx` - Removed 545+ lines of legacy code, fixed all runtime errors

---

### ✅ PRODUCT DELETION FEATURE IMPLEMENTED

**User Request:**
> "there should be an option to delete incomplete pitchdecks. also request deletion of Completed and approved pitchdeck (only admin can delete those)"

**Solution:** Implemented two-tier deletion system:

**1. Direct Deletion (DRAFT/REJECTED):**
- Red "Delete" button on incomplete products
- Immediate permanent deletion
- Removes all associated data (pitch deck, team members, founders, files)
- Confirmation dialog with warning

**2. Request Deletion (SUBMITTED/APPROVED):**
- Orange "Request Deletion" button on submitted/approved products
- Creates deletion request for admin review
- Optional reason field (max 1000 chars)
- Product remains until admin approves

**New API Endpoints:**
- `DELETE /api/ventures/products/{id}/delete` - Direct deletion (DRAFT/REJECTED only)
- `POST /api/ventures/products/{id}/request-deletion` - Request deletion (SUBMITTED/APPROVED)

**Security:**
- ✅ Owner-only access
- ✅ Status-based authorization
- ✅ UUID validation
- ✅ File cleanup
- ✅ Cascade deletion

**Status:** ✅ **LIVE** - Backend restarted, feature active

**Documentation:** See `PRODUCT_DELETION_FEATURE.md` for full details

---

### ✅ SINGLE SUBMISSION WORKFLOW IMPLEMENTED

**Issue:** Platform had TWO separate submission flows (submit product, then upload pitch deck separately), creating confusion and incomplete submissions.

**User Feedback:**
> "we need to have only one submit and admin should approve one submit, this is a package that is reviewed in one sitting not two different stages"

**Solution:** Implemented ONE unified submission workflow:
- Product must have pitch deck uploaded BEFORE submission
- ONE "Submit Complete Package" button (only shows when pitch deck exists)
- Admin reviews everything together in one sitting

**Changes:**
1. Backend: Added pitch deck validation to `submit_product` endpoint
2. Frontend: Conditional submit button only shows when pitch deck exists
3. UI: Amber warning alert if pitch deck missing
4. Updated button text: "Submit Complete Package" (clarifies single submission)

**Status:** ✅ **FIXED** - Backend restarted, single submission workflow active

**Documentation:** See `SINGLE_SUBMISSION_WORKFLOW.md` for full details

---

### ✅ PITCH DECK CREATION BUG FIXED

**Issue:** Pitch deck creation form was stalling when clicking "Create Pitch Deck" button after filling out all fields and uploading a file.

**Root Cause:** Backend API `VentureProductCreateSerializer` was not returning the product `id` in the response, causing frontend UUID validation to fail with `undefined`.

**Fix Applied:**
1. Added `'id'` field to `VentureProductCreateSerializer.Meta.fields`
2. Added `create()` method to serializer
3. Added `perform_create()` method to `ProductListCreateView` to properly set user

**Status:** ✅ **FIXED** - Backend restarted, users can now create pitch decks successfully

**Documentation:** See `PITCH_DECK_UPLOAD_FIX.md` for full details

---

## Recent Critical Fixes (2026-01-17)

### ✅ ALL CRITICAL REACT HOOKS ISSUES RESOLVED

All React Hooks violations have been fixed and confirmed working. The application components now load correctly on all views.

### Summary of Console Messages Analysis
The console shows several types of messages:
1. ✅ **FIXED & CONFIRMED**: React Hooks violations in VentureDashboard (Lines 337-338, 443-476)
2. ✅ **FIXED**: Sonner import errors across 12 files (incorrect `sonner@2.0.3` syntax)
3. ⚠️ **IN PROGRESS**: Logo display issue (text placeholder showing but image not loading)
4. ℹ️ **INFORMATIONAL ONLY**: React Router v7 future flag warnings (not errors)
5. ℹ️ **INFORMATIONAL ONLY**: Vite HMR connecting (normal development behavior)
6. ℹ️ **INFORMATIONAL ONLY**: React DevTools suggestion (optional)

**IMPORTANT:** Items 4-6 are NOT errors. They are informational messages that do not cause crashes or prevent functionality.

---

### 1. Logo Display Issue - ROOT CAUSE IDENTIFIED 🎯

**Issue:** Logo not displaying when accessing app via domain `https://ventureuplink.com`

**Root Cause:** Reverse proxy (HAProxy) is not forwarding static asset requests to Vite dev server

#### Diagnosis Results:
✅ Logo file exists: `frontend/public/logos/ventureuplink.png` (2.5MB)
✅ Logo file is in Docker container: `/app/public/logos/ventureuplink.png`
✅ Component is rendering correctly
✅ Image tag is present in DOM with `src="/logos/ventureuplink.png"`
❌ **Browser request fails:** `https://ventureuplink.com/logos/ventureuplink.png` returns error

**Console Output:**
```
❌ Logo failed to load
Attempted URL: https://ventureuplink.com/logos/ventureuplink.png
Full URL: https://ventureuplink.com/logos/ventureuplink.png
```

#### Problem Explanation:

When accessing the app via the domain (https://ventureuplink.com):
1. Browser loads page from reverse proxy
2. Page renders and tries to load: `<img src="/logos/ventureuplink.png">`
3. Browser requests: `https://ventureuplink.com/logos/ventureuplink.png`
4. **Reverse proxy doesn't forward `/logos/*` to Vite** → Returns 404/502
5. Logo fails to load

**The reverse proxy is only forwarding:**
- Backend API requests: `/api/*` → Backend on port 8001
- But NOT forwarding: `/logos/*` → Frontend (Vite) on port 3000

#### Solutions:

**Solution A: For Development - Use Localhost (Quick Fix) ✅**

Access the app directly via Vite dev server:
```
http://localhost:3000
```

This bypasses the reverse proxy entirely and allows Vite to serve all files including logos.

**Pros:** Works immediately, no configuration needed
**Cons:** Must use localhost instead of domain for development

---

**Solution B: Configure Reverse Proxy (Production Fix) 🔧**

Update your HAProxy/reverse proxy configuration to forward ALL frontend requests (not just `/api/*`) to the Vite dev server.

**HAProxy Configuration Example:**
```haproxy
# Frontend requests (including static assets like /logos/)
frontend http-in
    bind *:80
    bind *:443 ssl crt /path/to/cert.pem

    # Backend API
    acl is_api path_beg /api
    use_backend backend_api if is_api

    # Frontend - catch all other requests (including /logos/)
    default_backend frontend_vite

backend frontend_vite
    server vite localhost:3000 check
    # Forward WebSocket upgrade headers for HMR
    http-request set-header X-Forwarded-Proto https if { ssl_fc }
    http-request set-header X-Forwarded-Host %[req.hdr(Host)]

backend backend_api
    server django localhost:8001 check
```

**Key Changes Needed:**
1. Set `default_backend frontend_vite` to forward all non-API requests to Vite
2. This ensures `/logos/*`, `/assets/*`, and all other paths go to Vite
3. Keep `/api/*` going to backend

---

**Solution C: Copy Logo to Backend Static Files (Workaround)**

If you can't modify the reverse proxy:
1. Copy logo to backend's static files directory
2. Update image src to point to backend-served static file

**Not recommended** - mixing frontend assets with backend is not a good practice

---

#### Recommended Action:

**For Immediate Development:**
1. Access app via: `http://localhost:3000`
2. Logo will work correctly

**For Production/Long-term:**
1. Update reverse proxy configuration (Solution B)
2. Test that `/logos/ventureuplink.png` is accessible via domain
3. Logo will work for all users

---

#### Status: RESOLVED (Development Workaround) ✅

**Current Working Solution:** Access via `http://localhost:3000`

**Pending:** Reverse proxy configuration update for production deployment
**Root Cause:** 
- Error handler at `ModernDashboardLayout.tsx:234` was attempting to add a fallback query parameter
- This created an infinite loop as the fallback also failed
- Logo image path `/logos/ventureuplink.png` not being served correctly by reverse proxy

**Solution Implemented:**
- Removed all problematic `onError` handlers from logo components
- Replaced image-based logo with text-based placeholder: "VU" (VentureUP Link initials)
- Applied professional LinkedIn-style design: blue circle background (#3B82F6), white text
- Increased logo size to 64px (w-16 h-16) as requested
- Updated all 3 files: `ModernDashboardLayout.tsx`, `AppWithRouter.tsx`, `App.tsx`

**Result:** Logo now displays cleanly without any console errors

### 2. VentureDashboard React Hooks Violation - RESOLVED ✅
**Issue:** Component crash with error "React has detected a change in the order of Hooks called by VentureDashboard" and "Rendered fewer hooks than expected"
**Root Cause:** 
- **First occurrence**: `useState` hooks for `pitchDeckAnalytics` and `isLoadingAnalytics` were declared at line 337-338
- **Second occurrence**: `useEffect` hook for fetching analytics was at line 443-476
- Both hooks were positioned **AFTER** early return statements (lines 267-345)
- This violates React's "Rules of Hooks" which require all hooks to be at the top level before any conditional returns

**Solution Implemented:**
1. Moved `pitchDeckAnalytics` and `isLoadingAnalytics` state declarations to line 98-99
2. Moved analytics `useEffect` to line 150-181 (before early returns)
3. Moved `getFundingFromProducts()` and `getPitchDeckMetrics()` helper functions to lines 268-365 (before early returns)
4. Removed duplicate `useEffect` that was after early returns
5. Added comments: "MUST BE DECLARED BEFORE EARLY RETURNS"

**Code Fix:**
```typescript
// BEFORE (WRONG - hooks after early returns):
if (activeView === 'profile') {
  return <UserProfile ... />;  // Early return at line 337
}
// Then hooks declared here (line 407) - WRONG!
useEffect(() => { ... }, [products]);

// AFTER (CORRECT - all hooks before early returns):
useEffect(() => {
  const fetchAnalytics = async () => { ... };
  fetchAnalytics();
}, [activeView, products]);  // Line 150-181

// Early returns come AFTER all hooks
if (activeView === 'profile') {
  return <UserProfile ... />;
}
```

**Result:** VentureDashboard component now loads correctly without React Hooks violations on all views including profile view

### 3. Sonner Toast Import Error - RESOLVED ✅
**Issue:** Component crash with error "The above error occurred in the <VentureDashboard> component"
**Root Cause:** Incorrect import statement for `toast` from "sonner@2.0.3" instead of 'sonner'
**Location:** Multiple components across the codebase

**Solution Implemented:**
```typescript
// Before (WRONG):
import { toast } from "sonner@2.0.3";
import { Toaster as Sonner } from "sonner@2.0.3";

// After (CORRECT):
import { toast } from 'sonner';
import { Toaster as Sonner } from 'sonner';
```

**Files Fixed (11 total):**
- ✅ `VentureDashboard.tsx`
- ✅ `MessagingSystem.tsx`
- ✅ `EditProfile.tsx`
- ✅ `InvestorDashboard.tsx`
- ✅ `MeetingScheduler.tsx`
- ✅ `PortfolioExitPlan.tsx`
- ✅ `PortfolioReports.tsx`
- ✅ `PitchDeckDetails.tsx`
- ✅ `MentorDashboard.tsx`
- ✅ `Settings.tsx`
- ✅ `ui/sonner.tsx`
- ✅ `SchedulingModal.tsx`

**Result:** All components now load correctly without crashes. This was a widespread issue affecting multiple dashboard components.

---

### 4. Informational Console Messages (Not Errors)

#### React Router Future Flag Warnings ℹ️
**Status:** Informational only - does NOT break functionality
**Messages:**
- `v7_startTransition` warning
- `v7_relativeSplatPath` warning

**Explanation:** These are deprecation warnings for React Router v7 (future version). The current application uses React Router v6 which works perfectly. These warnings inform developers that when upgrading to v7, they should enable these future flags. They do NOT cause any errors or crashes.

**Action Required:** None for now. When upgrading to React Router v7 in the future, enable these flags in the router configuration.

#### Vite HMR Connecting ℹ️
**Status:** Normal development behavior
**Message:** `[vite] connecting...`

**Explanation:** Vite's Hot Module Replacement (HMR) system connecting to enable live reloading during development. This is expected and indicates the development server is working correctly.

**Action Required:** None. This is normal and desired behavior in development mode.

#### React DevTools Suggestion ℹ️
**Status:** Optional developer tool suggestion
**Message:** "Download the React DevTools for a better development experience"

**Explanation:** React suggests installing the React DevTools browser extension for enhanced debugging. This is purely optional and does not affect functionality.

**Action Required:** Optional - developers can install React DevTools extension if desired.

---

### 5. TypeScript Declaration Warnings ⚠️
**Status:** Build-time warnings, do not affect runtime
**Location:** Various files including `VentureDashboard.tsx`

**Issues:**
- Missing type declarations for external packages (resolved at build time)
- Type assertion issues in data handling

**Solution Implemented:**
- Added type assertions: `(data as any)?.results` to handle flexible API response types
- These warnings don't affect the running application

**Result:** Application runs correctly despite TypeScript warnings

---

# VentureUP Link Platform Status

## Technical Debt & Known Issues (Non-Critical)

### Quick Reference Table

| Issue | Type | Impact | Priority | Affects Production? |
|-------|------|--------|----------|---------------------|
| Logo Not Showing (Domain Access) | Reverse Proxy Config | Logo missing when using domain | Medium | ✅ Yes (cosmetic) |
| WebSocket HMR Connection | Dev Environment | Manual refresh needed | Medium | ❌ No |
| 401 on /auth/me | Normal Behavior | None (expected) | Low | ❌ No |
| React Router v7 Warnings | Deprecation Notice | None | Low | ❌ No |

---

### 1. Logo Display via Domain - Reverse Proxy Issue ⚠️
**Status:** Identified - Reverse proxy configuration needed
**Severity:** Medium (cosmetic issue, doesn't break functionality)
**Error:** Logo fails to load when accessing via `https://ventureuplink.com`

**Root Cause:**
- Reverse proxy (HAProxy) forwards `/api/*` to backend (port 8001)
- But does NOT forward `/logos/*` or other frontend paths to Vite (port 3000)
- When browser requests `https://ventureuplink.com/logos/ventureuplink.png`, reverse proxy returns 404

**Impact:**
- ✅ App works perfectly when accessed via `http://localhost:3000`
- ❌ Logo missing when accessed via domain `https://ventureuplink.com`
- Does NOT affect functionality, only visual/branding

**Workaround (Development):**
Access app directly via Vite dev server:
```bash
http://localhost:3000
```

**Proper Fix Required:**
Update reverse proxy configuration to forward ALL non-API requests to Vite:

```haproxy
# In HAProxy config
frontend http-in
    # Backend API
    acl is_api path_beg /api
    use_backend backend_api if is_api
    
    # Frontend - default for everything else (including /logos/)
    default_backend frontend_vite

backend frontend_vite
    server vite localhost:3000 check
    http-request set-header X-Forwarded-Proto https if { ssl_fc }
    http-request set-header X-Forwarded-Host %[req.hdr(Host)]
```

**Priority:** Medium - Fix before production deployment

---

### 2. WebSocket HMR Connection Failure (Development Only) ⚠️
**Status:** Technical Debt - Does NOT affect production or functionality
**Error Messages:**
```
WebSocket connection to 'wss://ventureuplink.com:3000/?token=DyhS1DJBbEfI' failed: 
[vite] failed to connect to websocket (Error: WebSocket closed without opened.)
Uncaught (in promise) Error: WebSocket closed without opened.
```

**Root Cause:**
- Vite dev server runs on port 3000 but is accessed through reverse proxy on port 443 (HTTPS)
- WebSocket tries to connect to `:3000` but reverse proxy doesn't forward WebSocket connections on that port
- HMR (Hot Module Replacement) WebSocket cannot establish connection

**Impact:**
- ⚠️ **Development Only** - This error only appears in development environment
- Live reload/Hot Module Replacement may not work automatically
- Developers need to manually refresh browser after code changes
- **Does NOT affect production build or user-facing functionality**

**Location:** 
- `vite.config.ts:18` - HMR client configuration
- Client-side WebSocket connection attempt

**Technical Debt Classification:** Medium Priority - Impacts developer experience
**Workaround:** Manual browser refresh works perfectly
**Proper Solution Required:**
1. Configure reverse proxy (HAProxy/Nginx) to forward WebSocket connections:
   ```nginx
   location / {
       proxy_pass http://frontend:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
   }
   ```
2. OR update `vite.config.ts` to disable WebSocket HMR in production-like environments:
   ```typescript
   server: {
     hmr: {
       protocol: 'wss',
       host: 'ventureuplink.com',
       clientPort: 443,
       // Option to disable in production-like environments
     }
   }
   ```

**Recommendation:** Configure reverse proxy to support WebSocket upgrades when development environment is stable.

---

### 2. 401 Unauthorized on /api/auth/me (Expected Behavior) ℹ️
**Status:** Normal Operation - NOT a bug
**Error Message:**
```
GET https://backend.ventureuplink.com/api/auth/me 401 (Unauthorized)
```

**Root Cause:**
- Application checks authentication status on page load
- If user is not logged in or token is expired/invalid, API returns 401
- This is **expected and correct behavior** for authentication flow

**Impact:**
- ✅ None - This is normal authentication check
- Application correctly redirects to login page when 401 received
- No functionality is broken

**Location:**
- `authService.ts:69` - `getCurrentUser()` function
- `AuthContext.tsx:38` - `checkAuth()` function

**Technical Debt Classification:** None - This is correct behavior
**Action Required:** None - Consider suppressing this error in console for better developer experience:

**Optional Enhancement:**
```typescript
// In AuthContext.tsx checkAuth() function:
try {
  const userData = await authService.getCurrentUser();
  setUser(userData);
  setIsAuthenticated(true);
} catch (error: any) {
  // Don't log 401 as error - it's expected when not logged in
  if (error?.response?.status !== 401) {
    console.error('Authentication check failed:', error);
  }
  // 401 is normal - user just needs to login
  setUser(null);
  setIsAuthenticated(false);
}
```

**Current Code Location:** `frontend/src/components/AuthContext.tsx:38`

**Recommendation:** Implement conditional logging to reduce console noise for expected 401 responses. This is purely cosmetic and doesn't affect functionality.

---

### Summary

✅ **All Critical Issues Fixed** - Application is fully functional
⚠️ **2 Technical Debt Items** - Do not affect production or functionality
ℹ️ **Informational Warnings** - React Router v7 deprecation notices (can be ignored)

**Next Steps for Technical Debt:**
1. **High Priority:** None - all critical issues resolved
2. **Medium Priority:** Configure reverse proxy for WebSocket HMR support (improves dev experience)
3. **Low Priority:** Suppress expected 401 errors in console (cosmetic improvement)

---

## Documentation Standards

**IMPORTANT RULE**: Minimize the creation of new markdown (MD) documentation files unless explicitly requested. All project documentation, instructions, and updates should be consolidated into existing documentation files rather than creating new ones. This rule applies to all development work and documentation practices across the entire application.

---

## Platform Name Update ✅
**Status**: Complete
- All user-facing references updated from "VentureLink" to "Venture UP Link"
- Email domains updated to `@ventureuplink.com`
- Backend email templates updated
- Frontend components updated

---

## Celery Tasks Status

### Current Tasks Implementation

#### ✅ **Email Verification Task** (`apps.accounts.tasks.send_verification_email`)
- **Status**: Implemented and functional with HTML templates
- **Purpose**: Sends email verification link when user registers
- **Trigger**: Automatically called during user registration
- **Email Template**: 
  - ✅ HTML-styled email with VentureUP Link branding
  - ✅ Responsive design for mobile and desktop
  - ✅ Professional styling with clear call-to-action button
  - ✅ Plain text fallback included
- **Configuration**: Uses `FRONTEND_URL` from settings for verification link

#### ✅ **Approval Notification Task** (`apps.accounts.tasks.send_approval_notification`)
- **Status**: Implemented and functional with HTML templates
- **Purpose**: Sends email notification when profile is approved/rejected
- **Trigger**: Automatically called when admin approves/rejects a profile via `/api/reviews/<id>/approve` or `/api/reviews/<id>/reject`
- **Email Templates**: 
  - ✅ **Approval**: HTML-styled success email with green checkmark, feature list, and login button
  - ✅ **Rejection**: HTML-styled feedback email with rejection reason highlighted and update profile button
  - ✅ Both templates include responsive design and plain text fallback
- **Configuration**: Uses `FRONTEND_URL` from settings for login links
- **Integration**: ✅ Connected to approval/rejection views in `apps.approvals.views`

#### ✅ **Deletion Notification Task** (`apps.accounts.tasks.send_deletion_notification`)
- **Status**: ✅ **NEW - Implemented (Jan 18, 2026)**
- **Purpose**: Sends email notification when a pitch deck is deleted
- **Trigger**: Automatically called when a product/pitch deck is deleted via `/api/ventures/products/{id}/delete`
- **Email Template**: 
  - ✅ HTML-styled notification email with deletion icon
  - ✅ Shows product name, previous status, and deletion timestamp
  - ✅ Different messaging for user-initiated vs admin-initiated deletions
  - ✅ Includes dashboard link and helpful context
  - ✅ Plain text fallback included
- **Configuration**: Uses `FRONTEND_URL` from settings for dashboard links
- **Integration**: ✅ Connected to `delete_product` view in `apps.ventures.views`
- **Features**:
  - ✅ Detects if deletion was done by admin vs user
  - ✅ Includes product status before deletion
  - ✅ Error handling: Email failures don't block deletion
  - ✅ Async execution via Celery (non-blocking)

#### ✅ **Password Reset Email Task** (`apps.accounts.tasks.send_password_reset_email`)
- **Status**: ✅ **NEW - Implemented (Jan 19, 2026)**
- **Purpose**: Sends password reset link when user requests password reset
- **Trigger**: Automatically called when user requests password reset via `/api/auth/password-reset-request`
- **Email Template**: 
  - ✅ HTML-styled email with security icon
  - ✅ Clear security notices (single-use, 1-hour expiry)
  - ✅ Professional styling with reset button
  - ✅ Plain text fallback included
- **Configuration**: Uses `FRONTEND_URL` from settings for reset link
- **Integration**: ✅ Connected to `password_reset_request` view in `apps.accounts.views`
- **Security Features**:
  - ✅ Token expires in 1 hour (shorter than verification tokens)
  - ✅ Single-use tokens (marked as used after password reset)
  - ✅ IP address tracking for security audit
  - ✅ Email enumeration prevention (always returns success)

### Task Configuration
- **Celery App**: Configured in `backend/config/celery.py`
- **Redis**: Running on port 6381 (dev)
- **Celery Worker**: Running in `venturelink_celery` container
- **Celery Beat**: Running in `venturelink_celery_beat` container (for scheduled tasks)

### Missing Tasks (To Be Implemented)
1. **Match Refresh Task**: Nightly matching algorithm refresh
2. **Notification Task**: General notification sending
3. **Email Digest Task**: Daily/weekly activity summaries (optional)

---

## User Dashboards & Material Posting

### Current Dashboard Implementation

#### ✅ **Venture Dashboard** (`VentureDashboard.tsx`)
- **Status**: UI Complete, Backend Integration Pending
- **Features**:
  - Overview with funding metrics
  - Browse investors/mentors
  - View matches
  - Messaging interface
  - Profile editing UI (`EditProfile` component)
  - Pitch deck metrics display
- **Material Posting Capabilities**:
  - ✅ Profile editing UI exists
  - ✅ Pitch deck upload UI exists (Upload button visible)
  - ❌ Backend endpoints not yet implemented
  - ❌ File upload functionality not connected

#### ✅ **Investor Dashboard** (`InvestorDashboard.tsx`)
- **Status**: UI Complete, Backend Integration Pending
- **Features**:
  - Browse ventures
  - View matches
  - Portfolio tracking
  - Messaging interface
  - Profile editing UI
- **Material Posting Capabilities**:
  - ✅ Profile editing UI exists
  - ❌ Backend endpoints not yet implemented

#### ✅ **Mentor Dashboard** (`MentorDashboard.tsx`)
- **Status**: UI Complete, Backend Integration Pending
- **Features**:
  - Browse ventures
  - View mentees
  - Request management
  - Messaging interface
  - Profile editing UI
- **Material Posting Capabilities**:
  - ✅ Profile editing UI exists
  - ❌ Backend endpoints not yet implemented

#### ✅ **Admin Dashboard** (`AdminDashboard.tsx`)
- **Status**: Fully Functional ✅
- **Features**:
  - User management (CRUD)
  - Approval workflow
  - Platform statistics
  - Analytics

---

## Backend API Endpoints Status

### ✅ Implemented Endpoints

#### Authentication (`/api/auth/`)

**Role System Implementation:**

**Backend Role Definitions:**
- **Django User Model**: Roles stored as uppercase: `'VENTURE'`, `'INVESTOR'`, `'MENTOR'`, `'ADMIN'`
- **Registration**: Only allows `VENTURE`, `INVESTOR`, `MENTOR` (cannot register as `ADMIN`)
- **Superuser**: Automatically assigned `ADMIN` role with `is_staff=True`, `is_superuser=True`
- **API Responses**: `/api/auth/me` returns role in uppercase format

**Frontend Role Definitions:**
- **TypeScript Type**: `UserRole = 'venture' | 'investor' | 'mentor' | 'admin'`
- **Storage**: Roles stored as lowercase in frontend
- **Mapping Logic**: Backend uppercase → Frontend lowercase conversion in `AuthContext.tsx`

**Role Mapping Flow:**
- **Registration**: `'venture'` → `'VENTURE'` → Database `'VENTURE'`
- **Login**: Database `'VENTURE'` → API `'VENTURE'` → Frontend `'venture'`
- **Dashboard Routing**: `'venture'` → `VentureDashboard`, `'investor'` → `InvestorDashboard`, etc.

**Role-Based Access Control (RBAC):**
- **Backend Permissions** (`backend/shared/permissions.py`):
  - ✅ `IsApprovedUser`: Admin users always pass, checks profile approval for other roles
  - ✅ `IsAdminOrReviewer`: Only ADMIN role allowed
  - ✅ `IsOwnerOrReadOnly`: Read for all authenticated users, write only for owner
- **Frontend Permissions**: 
  - ✅ Role-based dashboard routing implemented
  - ✅ Role-based registration forms implemented
  - ⚠️ Permission checks before API calls not fully implemented (tech debt)

**Superuser/Admin Account:**
- **Credentials**: `admin@venturelink.com` / `admin123`
- **Role**: `ADMIN` (backend) / `admin` (frontend)
- **Access**: Full platform access + Django Admin Panel
- **Creation**: Automatically created on first Docker startup

**Demo Accounts:**
- **Password**: All demo accounts use `demo123`
- **Total**: 9 demo accounts (4 Ventures, 3 Investors, 2 Mentors)
- **Creation**: Automatically created via `seed_demo_data` management command
- **See**: `DEMO_ACCOUNTS.md` for complete list

**Admin Dashboard:**
- **Component**: `frontend/src/components/AdminDashboard.tsx`
- **Features**: Overview, User Management, Approval Management, Analytics tabs
- **Status**: ✅ UI implemented, ⚠️ Needs connection to real API endpoints (tech debt)

**Known Issues & Tech Debt:**
- ⚠️ **Role Mapping Inconsistency**: Multiple places where role mapping occurs, should be centralized
- ⚠️ **No Role-Based Permissions**: Backend doesn't fully enforce role-based access on all endpoints
- ⚠️ **Frontend Permission Checks**: Frontend doesn't check permissions before API calls
- ⚠️ **Admin Dashboard**: Needs connection to real API endpoints for user management and approvals
- ✅ POST `/register` - User registration
- ✅ POST `/login` - User login
- ✅ POST `/refresh` - Token refresh
- ✅ POST `/verify-email` - Email verification
- ✅ POST `/resend-verification` - Resend verification
- ✅ GET `/me` - Get current user
- ✅ PATCH `/me` - Update user profile (full_name)
- ✅ POST `/change-password` - Change user password

#### Admin (`/api/admin/`)
- ✅ GET `/stats` - Platform statistics
- ✅ GET `/users` - List users (with pagination, filtering, search)
- ✅ POST `/users` - Create user
- ✅ GET `/users/<id>` - Get user details
- ✅ PATCH `/users/<id>` - Update user
- ✅ DELETE `/users/<id>` - Delete user

#### Approvals (`/api/reviews/`)
- ✅ GET `/pending` - List pending approvals
- ✅ GET `/<id>` - Get review details
- ✅ POST `/<id>/approve` - Approve submission
- ✅ POST `/<id>/reject` - Reject submission

### ❌ Missing Endpoints (Per Project Scope)

#### Ventures (`/api/ventures/`)
- ❌ POST `/profile` - Create/update venture profile
- ❌ GET `/profile/me` - Get own venture profile
- ❌ POST `/profile/submit` - Submit profile for approval
- ✅ POST `/products/{id}/documents/pitch-deck` - Upload pitch deck (per product)
- ✅ GET `/products/{id}/documents` - List documents for a product
- ✅ DELETE `/products/{id}/documents/{doc_id}` - Delete document
- ✅ GET `/public` - List approved ventures (products)
- ✅ GET `/<id>` - Get venture detail (product)

#### Investors (`/api/investors/`)
- ❌ POST `/profile` - Create/update investor profile
- ❌ GET `/profile/me` - Get own investor profile
- ❌ PATCH `/profile/me` - Update own profile
- ❌ POST `/profile/submit` - Submit profile for approval
- ❌ GET `/public` - List visible investors
- ❌ GET `/<id>` - Get investor detail

#### Mentors (`/api/mentors/`)
- ❌ POST `/profile` - Create/update mentor profile
- ❌ GET `/profile/me` - Get own mentor profile
- ❌ PATCH `/profile/me` - Update own profile
- ❌ POST `/profile/submit` - Submit profile for approval
- ❌ GET `/public` - List visible mentors
- ❌ GET `/<id>` - Get mentor detail

#### Matching (`/api/matches/`)
- ❌ GET `/me` - Get matches for current user
- ❌ POST `/refresh` - Trigger match refresh (admin)

#### Messaging (`/api/messages/`)
- ✅ GET `/conversations` - List conversations (with grouping by user to prevent duplicates)
- ✅ POST `/conversations` - Create conversation
- ✅ GET `/conversations/<id>` - Get conversation with messages (chronologically sorted)
- ✅ POST `/conversations/<id>/messages` - Send message (supports lazy conversation creation with `conversation_id='new'`)
- ✅ POST `/conversations/<id>/read` - Mark as read
- ✅ GET `/conversations/unread-count` - Get unread count (for global badge)
- ✅ PATCH `/message/<id>` - Update/edit message (15-minute time limit, sender only)
- ✅ DELETE `/conversations/<id>/delete` - Delete conversation from user's inbox (soft delete)

#### Content (`/api/content/`)
- ❌ GET `/faq` - List FAQ items
- ❌ GET `/success-stories` - List success stories
- ❌ GET `/resources` - List resources
- ❌ GET `/contacts` - Get contact information

### ✅ Frontend/Backend Endpoint Alignment Verification

**Status**: ✅ **ALL ENDPOINTS ALIGNED** - Verified 2025-01-14

All frontend service endpoints match backend URL patterns correctly:

#### Product Service Endpoints (18 endpoints)
- ✅ `GET /ventures/products` → `GET /api/ventures/products`
- ✅ `GET /ventures/products/{id}` → `GET /api/ventures/products/<uuid:product_id>`
- ✅ `POST /ventures/products` → `POST /api/ventures/products`
- ✅ `PATCH /ventures/products/{id}` → `PATCH /api/ventures/products/<uuid:product_id>`
- ✅ `PATCH /ventures/products/{id}/activate` → `PATCH /api/ventures/products/<uuid:product_id>/activate`
- ✅ `POST /ventures/products/{id}/submit` → `POST /api/ventures/products/<uuid:product_id>/submit`
- ✅ `GET /ventures/public` → `GET /api/ventures/public`
- ✅ `POST /ventures/products/{id}/documents/pitch-deck` → `POST /api/ventures/products/<uuid:product_id>/documents/pitch-deck`
- ✅ `GET /ventures/products/{id}/documents` → `GET /api/ventures/products/<uuid:product_id>/documents`
- ✅ `PATCH /ventures/products/{id}/documents/{docId}/metadata` → `PATCH /api/ventures/products/<uuid:product_id>/documents/<uuid:doc_id>/metadata`
- ✅ `DELETE /ventures/products/{id}/documents/{docId}` → `DELETE /api/ventures/products/<uuid:product_id>/documents/<uuid:doc_id>`
- ✅ `GET /ventures/products/{id}/team-members` → `GET /api/ventures/products/<uuid:product_id>/team-members`
- ✅ `POST /ventures/products/{id}/team-members` → `POST /api/ventures/products/<uuid:product_id>/team-members`
- ✅ `PATCH /ventures/products/{id}/team-members/{memberId}` → `PATCH /api/ventures/products/<uuid:product_id>/team-members/<uuid:id>`
- ✅ `DELETE /ventures/products/{id}/team-members/{memberId}` → `DELETE /api/ventures/products/<uuid:product_id>/team-members/<uuid:id>`
- ✅ `GET /ventures/products/{id}/founders` → `GET /api/ventures/products/<uuid:product_id>/founders`
- ✅ `POST /ventures/products/{id}/founders` → `POST /api/ventures/products/<uuid:product_id>/founders`
- ✅ `PATCH /ventures/products/{id}/founders/{founderId}` → `PATCH /api/ventures/products/<uuid:product_id>/founders/<uuid:id>`
- ✅ `DELETE /ventures/products/{id}/founders/{founderId}` → `DELETE /api/ventures/products/<uuid:product_id>/founders/<uuid:id>`

#### Messaging Service Endpoints (8 endpoints)
- ✅ `GET /messages/conversations` → `GET /api/messages/conversations`
- ✅ `POST /messages/conversations` → `POST /api/messages/conversations`
- ✅ `GET /messages/conversations/{id}` → `GET /api/messages/conversations/<uuid:id>`
- ✅ `POST /messages/conversations/{id}/messages` → `POST /api/messages/conversations/<str:conversation_id>/messages`
- ✅ `POST /messages/conversations/{id}/read` → `POST /api/messages/conversations/<uuid:conversation_id>/read`
- ✅ `GET /messages/conversations/unread-count` → `GET /api/messages/conversations/unread-count`
- ✅ `PATCH /messages/message/{messageId}` → `PATCH /api/messages/message/<uuid:message_id>`
- ✅ `DELETE /messages/conversations/{id}/delete` → `DELETE /api/messages/conversations/<uuid:conversation_id>/delete`

**Notes:**
- All endpoints use `/api` prefix (handled by `apiClient` base URL)
- UUID parameters correctly formatted in both frontend and backend
- HTTP methods match (GET, POST, PATCH, DELETE)
- Path patterns align correctly

---

## Dashboard Material Posting - Current State

### What Users Can Currently Do

1. **View Dashboards**: ✅ All role-based dashboards render correctly
2. **Edit Profile UI**: ✅ EditProfile component exists for all roles
3. **Upload UI Elements**: ✅ Upload buttons and file inputs exist in UI

### What's Missing for Full Functionality

1. **Backend Profile Endpoints**: 
   - Need to implement `/api/ventures/profile`, `/api/investors/profile`, `/api/mentors/profile`
   - These should allow users to create/update their profiles

2. **File Upload Endpoints**:
   - ✅ Implemented `/api/ventures/products/{id}/documents/pitch-deck` for pitch deck uploads
   - ✅ File storage configured (local dev, media directory)
   - ✅ File validation (PDF only, max 10MB)

3. **Profile Submission**:
   - Need to implement `/api/ventures/profile/submit` endpoints
   - These should create `ReviewRequest` objects for admin approval

4. **Frontend Integration**:
   - ✅ Connected `EditProfile` component to user profile update API
   - ✅ Connected password change in Settings to API
   - ✅ Connected messaging service for contacting investors
   - ✅ Added pitch deck CRUD methods to productService
   - ⚠️ Need to connect file upload UI to backend upload endpoints in ProductManagement component

---

## Next Steps to Enable Material Posting

### Priority 1: Profile Creation/Update
1. Implement venture profile endpoints (`/api/ventures/profile`)
2. Implement investor profile endpoints (`/api/investors/profile`)
3. Implement mentor profile endpoints (`/api/mentors/profile`)
4. Connect `EditProfile` component to these endpoints

### Priority 2: File Uploads
1. Configure file storage (media files)
2. Implement pitch deck upload endpoint
3. Add file validation (size, type, etc.)
4. Connect upload UI to backend

### Priority 3: Profile Submission
1. Implement submit endpoints that create `ReviewRequest` objects
2. Update approval workflow to handle submissions
3. Add submission status tracking in UI

---

## Security Status

### ✅ Backend Security Audit (2025-01-14)
**Status**: Complete
- **Comprehensive Route Security Review**: All API endpoints audited for injection, escalation, and lateral movement vulnerabilities
- **Fixed Vulnerabilities**:
  - ✅ Path traversal in file deletion (replaced `os.remove` with Django's `file.delete()`)
  - ✅ MIME type validation bypass (added file extension validation)
  - ✅ Query parameter injection (UUID validation, whitelisting, length limits)
  - ✅ Missing visibility checks in messaging (enforced visibility rules)
  - ✅ Missing input length validation (message body limits)
  - ✅ Information disclosure in login (prevented email enumeration)
  - ✅ Privilege escalation prevention (removed sensitive fields from profile updates)
  - ✅ Missing password strength validation (Django password validators)
- **Documentation**: `backend/SECURITY_AUDIT.md` created with detailed findings and fixes
- **Remaining Recommendation**: Rate limiting for sensitive endpoints (to be implemented)

### ✅ Frontend Security Hardening (2025-01-14)
**Status**: Complete
- **Security Utilities Created**:
  - ✅ `utils/security.ts` - Comprehensive security library (HTML escaping, input sanitization, URL validation, etc.)
  - ✅ `components/SafeText.tsx` - Safe text rendering component for XSS protection
  - ✅ `utils/fileValidation.ts` - File upload validation utilities
- **Security Fixes Applied**:
  - ✅ Product Management: All inputs sanitized, URLs validated
  - ✅ Messaging System: Message content sanitized, safe text rendering
  - ✅ User Profile: Email/URL validation, form data sanitization
  - ✅ Settings: Password validation, input sanitization
  - ✅ Login/Registration: Input sanitization and validation
  - ✅ User Profile Display: Safe rendering of all user-generated content
  - ✅ Venture Dashboard: UUID validation, search sanitization
- **Documentation**: `frontend/SECURITY_AUDIT.md` created with detailed findings and fixes
- **React CVE Assessment**: Verified NOT vulnerable to CVE-2025-55182 (React Server Components RCE)
  - Project uses React 18.3.1 (vulnerability affects React 19.x only)
  - No React Server Components in use
  - Documentation: `frontend/SECURITY_REACT_CVE.md` created

### ✅ Registration & Profile Creation Security Hardening (2025-01-15)
**Status**: Complete
- **Backend Security Enhancements**:
  - ✅ **User Registration Serializer**: Email validation, full name sanitization, password length limits, role validation
  - ✅ **Investor Profile Serializer**: URL validation, email validation, phone validation, length limits, list size limits (max 50 items per list)
  - ✅ **Mentor Profile Serializer**: URL validation, email validation, phone validation, rate amount validation, length limits, list size limits (max 50 expertise/industries, max 20 availability types)
  - ✅ **Input Length Limits**: All fields have maximum length validation (emails: 254, names: 255, URLs: 2048, phone: 20, etc.)
  - ✅ **List Size Limits**: Prevent DoS attacks via large arrays (max 50 items for preferences, max 20 for availability)
  - ✅ **Type Validation**: All list fields validated to ensure they contain strings only
  - ✅ **Numeric Validation**: Experience years, deals count, rate amounts validated with min/max bounds
- **Frontend Security**:
  - ✅ **Auto-login Security**: Secure token-based authentication after registration
  - ✅ **Error Handling**: Profile creation failures don't expose sensitive information
  - ✅ **Data Mapping**: Form data sanitized and validated before API calls
- **Permission Checks**: ✅ All profile endpoints require `IsAuthenticated`, ownership verified via queryset filtering

---

## Seed Data Analysis & Compatibility

### Current Seed Data Implementation (`seed_demo_data.py`)

#### ✅ **Compatible Models**:
- **User**: Creates venture, investor, and mentor users with proper roles
- **VentureProduct**: Creates products with all required fields (name, industry_sector, website, linkedin_url, etc.)
- **Founder**: Creates founders for each product
- **TeamMember**: Creates team members for products
- **VentureNeed**: Creates finance and market access needs
- **VentureDocument**: Creates pitch deck documents with all metadata fields:
  - `problem_statement`, `solution_description`, `target_market`
  - `traction_metrics` (JSON field)
  - `funding_amount`, `funding_stage`, `use_of_funds`
- **InvestorProfile**: Creates investor profiles with preferences
- **MentorProfile**: Creates mentor profiles with expertise
- **Conversation & Message**: Creates realistic conversations between users

#### ✅ **New Pitch Deck Models Integration** (2025-01-15):
- **PitchDeckAccess**: Creates access records when sharing or approving requests
- **PitchDeckShare**: Creates share records (ventures sharing with investors)
- **PitchDeckRequest**: Creates request records (investors requesting access, both pending and approved)
- **PitchDeckAccessEvent**: Creates view and download events for analytics

#### **Seed Data Features**:
1. **Pitch Deck Shares**: 
   - TechFlow AI shares pitch deck with first investor (with message)
   - TechFlow AI shares pitch deck with fourth investor (marked as viewed)
2. **Pitch Deck Requests**:
   - Second investor requests GreenSpace pitch deck (approved)
   - Third investor requests HealthBridge pitch deck (pending)
3. **Access Control**:
   - Automatically grants access when sharing
   - Automatically grants access when approving requests
4. **Analytics Events**:
   - Creates 3 view events and 1 download event for TechFlow AI pitch deck
   - Includes IP address and user agent for realistic analytics

#### **Clear Functionality**:
- Updated `--clear` flag to delete all pitch deck related data:
  - PitchDeckAccessEvent
  - PitchDeckRequest
  - PitchDeckShare
  - PitchDeckAccess
- Maintains proper deletion order to avoid foreign key constraints

#### **Testing Scenarios Covered**:
- ✅ Ventures can see pitch deck analytics (views, downloads, unique viewers)
- ✅ Ventures can see who has access to their pitch decks
- ✅ Ventures can see pending requests and approve/deny them
- ✅ Ventures can see shares they've made
- ✅ Investors can request access to pitch decks
- ✅ Investors can view/download pitch decks they have access to
- ✅ System tracks all access events for analytics

---

## Pitch Deck (Product) Workflow Analysis

### Current Product & Pitch Deck System

#### Product Creation Workflow ✅

**Step 1: Product Creation**
- **Endpoint**: `POST /api/ventures/products`
- **Required Fields**: `name`, `industry_sector`, `website`, `linkedin_url`, `short_description`
- **Optional Fields**: `address`, `year_founded`, `employees_count`
- **Process**:
  1. User creates product (max 3 per user, enforced at serializer level)
  2. Product created with status: `DRAFT`
  3. Product is `is_active = True` by default
  4. User can edit product while in DRAFT or REJECTED status
- **Status**: ✅ Fully implemented with security validation
- **Security**: ✅ URL validation, length limits, input sanitization

**Step 2: Product Update**
- **Endpoint**: `PATCH /api/ventures/products/{id}`
- **Restrictions**: Only DRAFT or REJECTED products can be updated
- **Process**: User updates product fields, status remains unchanged
- **Status**: ✅ Fully implemented with security validation

**Step 3: Pitch Deck Upload**
- **Endpoint**: `POST /api/ventures/products/{id}/documents/pitch-deck`
- **Required**: PDF file (multipart/form-data)
- **Optional Metadata**:
  - `problem_statement` (text, max 10,000 chars)
  - `solution_description` (text, max 10,000 chars)
  - `target_market` (text, max 10,000 chars)
  - `traction_metrics` (JSON, max 50 keys, max 100 items if list)
  - `funding_amount` (string, max 50 chars)
  - `funding_stage` (enum: PRE_SEED, SEED, SERIES_A, SERIES_B, SERIES_C, GROWTH)
  - `use_of_funds` (text, max 10,000 chars)
- **File Validation**:
  - ✅ File extension validation (.pdf only)
  - ✅ MIME type validation (application/pdf)
  - ✅ File size limit (10MB max)
  - ✅ Empty file validation
- **Restrictions**: Only DRAFT or REJECTED products can have pitch decks uploaded
- **Status**: ✅ Fully implemented with security validation
- **Security**: ✅ File validation, metadata sanitization, length limits

**Step 4: Product Submission for Approval**
- **Endpoint**: `POST /api/ventures/products/{id}/submit`
- **Process**:
  1. User submits product for approval
  2. `ReviewRequest` created automatically
  3. Product status changes to `SUBMITTED`
  4. Admin can review via `/api/reviews/pending`
- **Restrictions**: Only DRAFT or REJECTED products can be submitted
- **Status**: ✅ Fully implemented

**Step 5: Admin Approval**
- **Endpoints**: `/api/reviews/{id}/approve` or `/reject`
- **Process**:
  1. Admin reviews product (and pitch deck if uploaded)
  2. Admin approves or rejects
  3. Product status updated (`APPROVED` or `REJECTED`)
  4. Email notification sent to user
  5. If approved, product can be activated (`is_active = True`)
- **Status**: ✅ Fully implemented

**Step 6: Product Activation**
- **Endpoint**: `PATCH /api/ventures/products/{id}/activate`
- **Process**: User toggles `is_active` field
- **Restrictions**: Only APPROVED products can be activated
- **Status**: ✅ Fully implemented

#### Investor Browsing Workflow ⚠️

**Step 1: Browse Approved Products**
- **Endpoint**: `GET /api/ventures/public`
- **Returns**: Only products with `status='APPROVED'` and `is_active=True`
- **Permissions**: Requires `IsAuthenticated` and `IsApprovedUser`
- **Status**: ✅ Implemented
- **Frontend**: ✅ InvestorDashboard displays products

**Step 2: View Product Details**
- **Endpoint**: `GET /api/ventures/{id}`
- **Returns**: Full product details including:
  - Product information (name, industry, description, etc.)
  - Founders list
  - Team members list
  - Needs list
  - **Documents list** (including pitch decks with metadata)
- **Permissions**: Requires `IsAuthenticated` and `IsApprovedUser`
- **Status**: ✅ Implemented
- **Frontend**: ⚠️ Product details displayed but pitch deck access not fully implemented

**Step 3: Access Pitch Deck** ✅ **IMPLEMENTED** (See VENTURES_CRUD_STATUS.md)
- **Current State**: 
  - ✅ Endpoint for investors to download/view pitch deck files
  - ✅ Pitch deck access control/permission system
  - ✅ Frontend integrated with backend
- **Status**: ✅ Fully implemented
- **Reference**: See `VENTURES_CRUD_STATUS.md` for complete details

#### Pitch Deck Sharing Workflow (Venture → Investor) ✅ **COMPLETE**

**Venture Side:**
1. **Navigate to Investors Tab** (`/dashboard/venture/investors`)
   - View list of approved investors visible to the venture
   - Filter by stage preferences, industry, search by name/organization

2. **Visual Feedback on Share Status**
   - **Blue breadcrumb card** appears for investors who already have access:
     - "Pitch Deck Shared" with share date
     - **Green "Viewed" indicator** (eye icon) if investor has viewed the pitch deck
     - **Amber "Not viewed yet" indicator** (clock icon) if investor hasn't viewed it
   - Provides immediate visual feedback on engagement status

3. **Select Investor to Share With**
   - Click "Share Pitch" button on investor card
   - System validates:
     - Venture has at least one approved product
     - Selected investor is approved
     - **Active pitch deck exists** (CONSTRAINT: Only active pitch decks can be shared)

4. **Automatic Active Pitch Deck Selection**
   - **CONSTRAINT**: System only finds ACTIVE pitch decks (not inactive ones)
   - Selects first approved product with an active pitch deck
   - If multiple products exist, uses the first approved & active one
   - Validates product ID and document ID

5. **Share Confirmation**
   - Loading toast appears: "Sharing pitch deck with [Investor Name]..."
   - Backend API call: `POST /api/ventures/products/{id}/documents/{doc_id}/share`
   - Success toast: "✓ Pitch deck successfully shared with [Investor Name]! They now have access to '[Product Name]'"
   - **Breadcrumb appears/updates immediately** showing share status
   - Products list and share status refreshed automatically

**Investor Side:**
1. **Receive Access**
   - `PitchDeckShare` record created in backend
   - `PitchDeckAccess` record created automatically
   - Investor can now view/download the pitch deck

2. **View Pitch Deck**
   - Navigate to "Discover" tab in investor dashboard
   - Product appears with "View Pitch Deck" button
   - Click to view full pitch deck details
   - Can download PDF file
   - **Backend tracks `viewed_at` timestamp** when pitch deck is opened

3. **Visual Feedback to Venture**
   - When investor views pitch deck, `viewed_at` timestamp is recorded
   - Venture sees **"Viewed"** status in green on investor card
   - Provides engagement tracking for ventures

**Backend Records Created:**
- `PitchDeckShare`: Tracks the sharing event (who shared, when, message, **viewed_at**)
- `PitchDeckAccess`: Grants permission for investor to view/download
- `PitchDeckAccessEvent`: Logs each view/download for analytics

**Constraints Enforced:**
- ✅ **One Active Pitch Deck**: Ventures can only have ONE active pitch deck at a time
- ✅ **Share Active Only**: System only selects and shares ACTIVE pitch decks (ignores inactive ones)
- ✅ **Clear Feedback**: If no active pitch deck exists, user gets error: "No active pitch deck available to share. Please ensure your product is approved and has an active pitch deck."

**Security & Validation:**
- ✅ UUID validation for all IDs
- ✅ Ownership verification (ventures can only share their own pitch decks)
- ✅ Status checks (only approved products can be shared)
- ✅ Permission checks (only approved investors can receive pitch decks)
- ✅ Access control enforced on view/download endpoints

**Files Involved:**
- `frontend/src/components/VentureDashboard.tsx` - Share logic, visual breadcrumbs, status tracking
- `frontend/src/services/productService.ts` - `sharePitchDeck()`, `listPitchDeckShares()` API clients
- `backend/apps/ventures/views.py` - Share endpoint, viewed_at tracking
- `backend/apps/ventures/models.py` - PitchDeckShare (with viewed_at), PitchDeckAccess models

**Status**: ✅ **FULLY FUNCTIONAL** - Ventures can share their ONE active pitch deck with investors from the investors browse tab. Visual breadcrumbs provide immediate feedback on share status and investor engagement (viewed/not viewed). System enforces constraint that only active pitch decks can be shared, ensuring ventures maintain control.

---

#### Investment Commitment & Deal Workflow (Investor → Venture) ✅ **IMPLEMENTED**

**Complete Workflow:**
1. **Venture shares pitch deck** → Creates `PitchDeckShare` record
2. **Investor views pitch deck** → `viewed_at` timestamp recorded
3. **Investor follows/monitors** → Creates `PitchDeckInterest` record (optional)
4. **Investor commits to invest** → Creates `InvestmentCommitment` with `status='COMMITTED'` and `venture_response='PENDING'`
5. **Venture reviews commitment** → Sees commitment in product commitments list
6. **Venture accepts** → `venture_response='ACCEPTED'` → **Becomes a Deal** (`is_deal=True`)
   OR
   **Venture requests renegotiation** → `venture_response='RENEGOTIATE'` → Investor can update commitment
7. **Deal lifecycle**:
   - `ACCEPTED` → Deal in progress
   - `COMPLETED` → Investment finalized
   - `WITHDRAWN` → Either party withdraws

**Backend Implementation:**

**Model: `InvestmentCommitment`** (Extended)
- Added `venture_response` field: `PENDING`, `ACCEPTED`, `RENEGOTIATE`
- Added `venture_response_at` timestamp
- Added `venture_response_message` (optional message from venture)
- Added `responded_by` FK to User (venture user who responded)
- Added `is_deal` property: Returns `True` if `venture_response == 'ACCEPTED'` and `status == 'COMMITTED'`

**Endpoints:**
- `GET /api/ventures/products/{product_id}/commitments` - List all commitments for a product (venture only)
- `POST /api/ventures/products/{product_id}/commitments/{commitment_id}/accept` - Accept commitment (creates deal)
- `POST /api/ventures/products/{product_id}/commitments/{commitment_id}/renegotiate` - Request renegotiation

**Investor Endpoints:**
- `GET /api/investors/portfolio` - Returns commitments with `venture_response` and `is_deal` status
- `POST /api/investors/products/{product_id}/documents/{doc_id}/commit` - Create/update commitment

**Frontend Implementation:**

**Venture Dashboard:**
- New section: "Investment Commitments" showing pending commitments
- Actions: "Accept" (creates deal) and "Renegotiate" (with message)
- Visual indicators: Pending (amber), Accepted/Deal (green), Renegotiate (orange)

**Investor Dashboard:**
- Portfolio view shows deal status (`is_deal`, `venture_response`)
- Shared pitch decks show commitment status and venture response
- Visual indicators: Pending (amber), Accepted/Deal (green badge), Renegotiate (orange)

**Key Features:**
- ✅ **Soft rejection**: Uses "RENEGOTIATE" instead of "REJECTED" for better relationship management
- ✅ **Single source of truth**: Commitment becomes deal when accepted (no separate Deal model)
- ✅ **Full lifecycle tracking**: From commitment → acceptance → deal → completion
- ✅ **Clear status progression**: `COMMITTED` → `ACCEPTED` → `COMPLETED`
- ✅ **Message support**: Ventures can include messages when accepting/renegotiating

**Status**: ✅ **FULLY FUNCTIONAL** - Complete workflow from investor commitment to venture acceptance/renegotiation. Accepted commitments become deals automatically.

---

#### Pitch Deck Sharing/Request Workflow ✅ **IMPLEMENTED** (See VENTURES_CRUD_STATUS.md)

**Current State**:
- **Venture Side**: 
  - ✅ `handleSharePitch()` in VentureDashboard fully integrated
  - ✅ Backend endpoint to share pitch deck with specific investor
  - ✅ Pitch deck sharing model and tracking
- **Investor Side**:
  - ✅ `handleRequestPitch()` in InvestorDashboard fully integrated
  - ✅ Backend endpoint to request pitch deck from venture
  - ✅ Pitch deck request model and workflow
- **Status**: ✅ Fully implemented
- **Reference**: See `VENTURES_CRUD_STATUS.md` for complete details

### Tech Debt Summary

#### ✅ Completed (Previously Listed as Missing)

1. **VL-823**: Pitch Deck Download/View Endpoints ✅ **IMPLEMENTED**
   - **Status**: ✅ Complete
   - **Endpoints**: 
     - ✅ `GET /api/ventures/products/{id}/documents/{doc_id}/download`
     - ✅ `GET /api/ventures/products/{id}/documents/{doc_id}/view`
   - **Reference**: See `VENTURES_CRUD_STATUS.md`

2. **VL-824**: Pitch Deck Access Control System ✅ **IMPLEMENTED**
   - **Status**: ✅ Complete
   - **Models**: PitchDeckAccess, PitchDeckShare, PitchDeckRequest, PitchDeckAccessEvent
   - **Endpoints**: Grant, revoke, list access
   - **Reference**: See `VENTURES_CRUD_STATUS.md`

3. **VL-825**: Pitch Deck Sharing Workflow ✅ **IMPLEMENTED**
   - **Status**: ✅ Complete
   - **Endpoint**: ✅ `POST /api/ventures/products/{id}/documents/{doc_id}/share`
   - **Reference**: See `VENTURES_CRUD_STATUS.md`

4. **VL-826**: Pitch Deck Request System ✅ **IMPLEMENTED**
   - **Status**: ✅ Complete
   - **Endpoint**: ✅ `POST /api/ventures/products/{id}/documents/{doc_id}/request`
   - **Reference**: See `VENTURES_CRUD_STATUS.md`

5. **VL-828**: Pitch Deck Analytics ✅ **IMPLEMENTED**
   - **Status**: ✅ Complete
   - **Endpoint**: ✅ `GET /api/ventures/products/{id}/documents/{doc_id}/analytics`
   - **Frontend**: ✅ Integrated in VentureDashboard and PitchDeckCRUD
   - **Reference**: See `VENTURES_CRUD_STATUS.md`

#### Medium Priority Tech Debt

6. **VL-829**: Pitch Deck Metadata Validation Enhancement
   - **Issue**: Some metadata fields could have better validation
   - **Status**: ✅ Partially fixed (added validation in this analysis)
   - **Remaining**: 
     - Traction metrics structure validation
     - Funding amount format validation (currency, ranges)
   - **Estimated Effort**: 3 story points

7. **VL-830**: Multiple Pitch Deck Versions Management
   - **Issue**: No versioning system for pitch decks
   - **Impact**: Cannot track pitch deck history or manage multiple versions
   - **Required**: Version tracking model and UI
   - **Estimated Effort**: 8 story points

### Security Status

#### ✅ Implemented Security Measures

1. **File Upload Security**:
   - ✅ File extension validation (.pdf only)
   - ✅ MIME type validation (application/pdf)
   - ✅ File size limit (10MB)
   - ✅ Empty file validation
   - ✅ Filename sanitization (frontend)

2. **Input Validation**:
   - ✅ Product name: max 255 chars, required
   - ✅ Industry sector: max 100 chars, required
   - ✅ URLs (website, linkedin_url): URLValidator, max 2048 chars
   - ✅ Short description: max 10,000 chars, required
   - ✅ Address: max 500 chars, optional
   - ✅ Year founded: 1800-2100 range validation
   - ✅ Employees count: 0-1,000,000 range validation
   - ✅ Pitch deck metadata: All fields have length limits
   - ✅ Traction metrics: JSON validation, size limits (50 keys, 100 items)
   - ✅ Funding stage: Whitelist validation

3. **RBAC (Role-Based Access Control)**:
   - ✅ Product creation: `IsAuthenticated` (VENTURE role)
   - ✅ Product update: `IsAuthenticated` + ownership check
   - ✅ Pitch deck upload: `IsAuthenticated` + ownership check + status check
   - ✅ Product submission: `IsAuthenticated` + ownership check
   - ✅ Public product listing: `IsAuthenticated` + `IsApprovedUser`
   - ✅ Product detail view: `IsAuthenticated` + `IsApprovedUser`
   - ✅ Admin endpoints: `IsAuthenticated` + `IsAdminOrReviewer`

4. **Ownership Verification**:
   - ✅ All product operations verify `product.user == request.user`
   - ✅ Queryset filtering ensures users only see their own products
   - ✅ Document operations verify product ownership

5. **Status-Based Restrictions**:
   - ✅ Product updates only allowed for DRAFT/REJECTED
   - ✅ Pitch deck uploads only allowed for DRAFT/REJECTED products
   - ✅ Product activation only allowed for APPROVED products

#### ❌ Missing Security Measures

1. **Pitch Deck Access Control**: ❌
   - No access control for pitch deck downloads (endpoints don't exist)
   - No tracking of who accessed which pitch deck
   - No permission system for sharing
   - **Tech Debt**: VL-823, VL-824

2. **Rate Limiting**: ❌
   - No rate limiting on file uploads (DoS risk)
   - No rate limiting on product creation (spam risk)
   - **Recommendation**: Implement rate limiting for sensitive endpoints

3. **File Content Validation**: ⚠️
   - Only validates file extension and MIME type
   - Does not validate actual PDF content (could be malicious PDF)
   - **Recommendation**: Add PDF content validation library (e.g., PyPDF2, pdfplumber)

4. **Audit Logging**: ❌
   - No audit logs for pitch deck access (endpoints don't exist)
   - No audit logs for product changes
   - No audit logs for pitch deck sharing
   - **Recommendation**: Add audit logging for all sensitive operations

5. **Pitch Deck Sharing Security**: ❌
   - No sharing system exists (VL-825)
   - No request system exists (VL-826)
   - **Recommendation**: Implement sharing/request system with proper access control

### Current Workflow Diagram

```
Venture Product & Pitch Deck Workflow:
┌─────────────────────────────────────────────────────────────┐
│ 1. Create Product                                           │
│    POST /api/ventures/products                             │
│    - Max 3 products per user                               │
│    - Status: DRAFT                                         │
│    - All fields validated and sanitized                    │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Upload Pitch Deck (Optional)                             │
│    POST /api/ventures/products/{id}/documents/pitch-deck    │
│    - PDF only, max 10MB                                     │
│    - Metadata: problem, solution, market, traction, funding │
│    - Only if product is DRAFT/REJECTED                     │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Submit for Approval                                      │
│    POST /api/ventures/products/{id}/submit                  │
│    - ReviewRequest created                                  │
│    - Status: SUBMITTED                                      │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Admin Review                                             │
│    GET /api/reviews/pending                                 │
│    POST /api/reviews/{id}/approve or /reject                │
│    - Status: APPROVED or REJECTED                           │
│    - Email notification sent                                │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Activate Product (if approved)                           │
│    PATCH /api/ventures/products/{id}/activate               │
│    - is_active = True                                       │
│    - Product appears in public listings                    │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Investor Browsing                                        │
│    GET /api/ventures/public                                 │
│    GET /api/ventures/{id}                                   │
│    - Only APPROVED + is_active products                    │
│    - Returns product details + documents list               │
│    ⚠️ Pitch deck metadata visible, but file access missing │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Pitch Deck Access ❌ MISSING                             │
│    ❌ No download/view endpoint                            │
│    ❌ No sharing system                                     │
│    ❌ No request system                                     │
│    ❌ No access control                                     │
└─────────────────────────────────────────────────────────────┘
```

### Information Stored in Pitch Deck Documents

**Product Level (VentureProduct)**:
- Basic company info: name, industry, website, LinkedIn, address
- Company stats: year founded, employees count
- Short description
- Status and approval tracking

**Pitch Deck Level (VentureDocument with document_type='PITCH_DECK')**:
- **File**: PDF document (max 10MB)
- **Business Information**:
  - `problem_statement`: What problem does the product solve? (text, max 10,000 chars)
  - `solution_description`: How does the product solve this problem? (text, max 10,000 chars)
  - `target_market`: Describe target market (text, max 10,000 chars)
  - `traction_metrics`: Current traction, metrics, achievements (JSON, max 50 keys)
- **Funding Information**:
  - `funding_amount`: Funding amount (e.g., "$2M") (string, max 50 chars)
  - `funding_stage`: PRE_SEED, SEED, SERIES_A, SERIES_B, SERIES_C, GROWTH
  - `use_of_funds`: How will funds be used? (text, max 10,000 chars)
- **File Metadata**:
  - `file_size`: File size in bytes
  - `mime_type`: MIME type (application/pdf)
  - `uploaded_at`: Upload timestamp

**Note**: Each product can have multiple pitch deck documents, each with its own business/funding information. This allows ventures to create different pitch decks for different funding rounds or purposes.

### Frontend Implementation Status

#### ✅ Implemented
- **ProductManagement Component**: Full CRUD for products
- **Pitch Deck Upload UI**: File upload with validation
- **Pitch Deck List Display**: Shows uploaded pitch decks
- **Product List/Detail Views**: Displays product information
- **InvestorDashboard**: Displays products in discover view

#### ⚠️ Partially Implemented
- **Pitch Deck Viewing**: Frontend has "View" button but opens file URL directly (no access control)
- **Pitch Deck Sharing**: `handleSharePitch()` exists but only shows toast (no backend integration)
- **Pitch Deck Request**: `handleRequestPitch()` exists but only shows toast (no backend integration)

#### ❌ Missing
- **Pitch Deck Download Endpoint Integration**: No API call to download pitch deck
- **Pitch Deck Access Control UI**: No UI for managing pitch deck permissions
- **Pitch Deck Sharing UI**: No UI for sharing pitch decks with investors
- **Pitch Deck Request UI**: No UI for investors to request pitch decks
- **Pitch Deck Analytics UI**: No UI for viewing pitch deck metrics (views, downloads)

### Pitch Deck System Summary

**✅ What Works**:
- Product creation, update, and submission workflow
- Pitch deck upload with file validation and metadata
- Product approval workflow
- Investor browsing of approved products
- Security validation on all inputs

**✅ What's Implemented**:
- ✅ Pitch deck download/view endpoints (investors can access PDFs with proper permissions)
- ✅ Pitch deck access control system (full permission management)
- ✅ Pitch deck sharing workflow (ventures can share with specific investors)
- ✅ Pitch deck request system (investors can request access)
- ✅ Pitch deck analytics (full tracking of views/downloads/access)
- **Reference**: See `VENTURES_CRUD_STATUS.md` for complete details

**🔒 Security Status**:
- ✅ File upload security: Extension, MIME type, size validation
- ✅ Input validation: All fields validated with length limits
- ✅ RBAC: Proper permission checks on all endpoints
- ✅ Ownership verification: Users can only modify their own products
- ✅ Status-based restrictions: Updates only allowed for DRAFT/REJECTED
- ⚠️ Missing: Rate limiting on file uploads
- ⚠️ Missing: PDF content validation (only validates extension/MIME type)
- ⚠️ Missing: Audit logging for pitch deck access

---

## Registration, KYC, and Verification Analysis

### Current Registration Flow

#### Step 1: User Account Registration ✅
- **Endpoint**: `POST /api/auth/register`
- **Required Fields**: `email`, `password`, `password_confirm`, `full_name`, `role`
- **Process**:
  1. User provides basic account information
  2. User account created with role (VENTURE, INVESTOR, MENTOR)
  3. Email verification token generated automatically
  4. Verification email sent via Celery task (HTML-styled)
  5. User account status: `is_email_verified = False`
- **Status**: ✅ Fully implemented and functional

#### Step 2: Email Verification ✅
- **Endpoint**: `POST /api/auth/verify-email` (token required)
- **Process**:
  1. User clicks verification link in email
  2. Token validated (24-hour expiration)
  3. `is_email_verified` set to `True`
  4. User can now access dashboard
- **Status**: ✅ Fully implemented and functional
- **Resend**: `POST /api/auth/resend-verification` available

#### Step 3: Profile Creation (Role-Specific)

##### **Ventures** ✅
- **Model**: `VentureProduct` (users can have up to 3 products)
- **Endpoints**:
  - ✅ `POST /api/ventures/products` - Create product (max 3 per user)
  - ✅ `GET /api/ventures/products` - List user's products
  - ✅ `GET /api/ventures/products/{id}` - Get product details
  - ✅ `PATCH /api/ventures/products/{id}` - Update product (only if DRAFT/REJECTED)
  - ✅ `PATCH /api/ventures/products/{id}/activate` - Toggle is_active
  - ✅ `POST /api/ventures/products/{id}/submit` - Submit for approval
- **Status Flow**: `DRAFT` → `SUBMITTED` → `APPROVED`/`REJECTED`
- **Status**: ✅ Fully implemented
- **Tech Debt**: ⚠️ Frontend registration form collects venture data but doesn't create product automatically (TODO in `AuthContext.tsx`)

##### **Investors** ⚠️
- **Model**: `InvestorProfile` (OneToOne with User)
- **Endpoints**:
  - ✅ `POST /api/investors/profile` - Create investor profile (creates as DRAFT)
  - ✅ `GET /api/investors/profile/me` - Get own profile
  - ✅ `PATCH /api/investors/profile/me` - Update own profile
  - ✅ `POST /api/investors/profile/submit` - Submit for approval
  - ✅ `GET /api/investors/public` - List visible investors (for approved ventures)
  - ✅ `GET /api/investors/{id}` - Get investor detail
- **Status Flow**: `DRAFT` → `SUBMITTED` → `APPROVED`/`REJECTED`
- **Status**: ✅ Backend endpoints implemented
- **Tech Debt**: 
  - ⚠️ Frontend registration form collects investor data but doesn't create profile automatically (TODO in `AuthContext.tsx`)
  - ⚠️ Frontend may not be fully connected to profile creation endpoints

##### **Mentors** ❌
- **Model**: `MentorProfile` (OneToOne with User)
- **Endpoints**:
  - ❌ `POST /api/mentors/profile` - Create mentor profile (MISSING)
  - ❌ `GET /api/mentors/profile/me` - Get own profile (MISSING)
  - ❌ `PATCH /api/mentors/profile/me` - Update own profile (MISSING)
  - ❌ `POST /api/mentors/profile/submit` - Submit for approval (MISSING)
  - ✅ `GET /api/mentors/public` - List visible mentors (for approved ventures)
  - ✅ `GET /api/mentors/{id}` - Get mentor detail
- **Status Flow**: `DRAFT` → `SUBMITTED` → `APPROVED`/`REJECTED` (model supports it)
- **Status**: ❌ Backend endpoints NOT implemented
- **Tech Debt**: 
  - ❌ No profile creation endpoints for mentors
  - ⚠️ Frontend registration form collects mentor data but can't create profile

#### Step 4: Profile Submission for Approval ✅
- **Process**:
  1. User creates/updates profile (status: `DRAFT`)
  2. User submits profile via submit endpoint
  3. `ReviewRequest` created automatically
  4. Profile status changes to `SUBMITTED`
  5. Admin can review via `/api/reviews/pending`
- **Status**: ✅ Backend workflow implemented
- **Email Notifications**: ✅ Approval/rejection emails sent automatically

#### Step 5: Admin Approval ✅
- **Endpoints**:
  - ✅ `GET /api/reviews/pending` - List pending reviews
  - ✅ `GET /api/reviews/{id}` - Get review details
  - ✅ `POST /api/reviews/{id}/approve` - Approve profile
  - ✅ `POST /api/reviews/{id}/reject` - Reject profile (with reason)
- **Process**:
  1. Admin reviews submission
  2. Admin approves or rejects
  3. Profile status updated (`APPROVED` or `REJECTED`)
  4. Email notification sent to user (HTML-styled)
  5. If approved, user gains full platform access
- **Status**: ✅ Fully implemented and functional

### KYC (Know Your Customer) & Verification Status

#### ✅ Implemented Verification
1. **Email Verification**: ✅
   - Email address ownership verification
   - Token-based verification (24-hour expiration)
   - HTML-styled verification emails

2. **Profile Approval Workflow**: ✅
   - Manual admin review process
   - Status tracking (DRAFT, SUBMITTED, APPROVED, REJECTED, SUSPENDED)
   - Rejection reason tracking
   - Email notifications

#### ❌ Missing KYC/Verification Features

1. **Identity Verification**: ❌
   - No government ID verification
   - No photo ID upload/verification
   - No identity document validation
   - **Impact**: Cannot verify user's real identity

2. **Business Verification (Ventures)**: ❌
   - No business registration number verification
   - No company incorporation document verification
   - No tax ID verification
   - No business license verification
   - **Impact**: Cannot verify venture is a legitimate business

3. **Accreditation Verification (Investors)**: ❌
   - No accredited investor status verification
   - No investment license verification
   - No regulatory compliance checks
   - No proof of funds verification
   - **Impact**: Cannot verify investor credentials and legitimacy

4. **Background Verification (Mentors)**: ❌
   - No professional background verification
   - No employment history verification
   - No LinkedIn/workplace verification
   - No reference checks
   - **Impact**: Cannot verify mentor qualifications and experience

5. **Document Verification**: ❌
   - No document upload for verification
   - No document validation/scanning
   - No automated document verification
   - **Impact**: Manual verification only, no automated checks

6. **Phone Verification**: ❌
   - No SMS verification
   - No phone number validation
   - **Impact**: Email-only verification, no multi-factor authentication

7. **Address Verification**: ❌
   - No physical address verification
   - No address validation
   - **Impact**: Cannot verify user location

### Tech Debt Summary

#### Low Priority Tech Debt

8. **Role System Improvements**
   - **Issue**: Role mapping inconsistency - multiple places where role mapping occurs
   - **Impact**: Code duplication, potential for bugs
   - **Solution**: Centralize role mapping in utility functions
   - **Required**: 
     - Create `utils/roleMapper.ts` in frontend
     - Create `shared/role_utils.py` in backend
   - **Estimated Effort**: 3 story points

9. **Role-Based Permission Enforcement**
   - **Issue**: Backend doesn't fully enforce role-based access on all endpoints
   - **Impact**: Potential security risk, inconsistent access control
   - **Solution**: Apply permission classes to all relevant endpoints
   - **Required**:
     - Add permission checks to all API endpoints
     - Implement role-specific profile access enforcement
     - Add admin-only endpoints for user management
   - **Estimated Effort**: 5 story points

10. **Frontend Permission Checks**
    - **Issue**: Frontend doesn't check permissions before API calls
    - **Impact**: Unnecessary API calls, poor UX
    - **Solution**: Add permission checks in frontend API service
    - **Required**:
      - Role-based UI element visibility
      - Permission checks before API calls
      - Admin-only features gating
    - **Estimated Effort**: 5 story points

11. **Admin Dashboard API Integration**
    - **Issue**: Admin dashboard UI exists but not connected to real API endpoints
    - **Impact**: Admin features not functional
    - **Solution**: Connect admin dashboard to real API endpoints
    - **Required**:
      - User management API integration
      - Approval workflow UI implementation
      - Real-time analytics charts
      - User search and filtering
    - **Estimated Effort**: 8 story points

12. **WebSocket Connection Errors (Development Only)**
   - **Status**: ⚠️ Known Issue - Non-Critical
   - **Priority**: Low (Development Only)
   - **Component**: Frontend (Vite HMR) + Reverse Proxy Configuration
   - **Issue**: WebSocket connection errors when accessing via domain due to reverse proxy not handling WebSocket upgrades
   - **Impact**: HMR doesn't work via domain, but application functions normally (non-critical)
   - **Solution**: Configure reverse proxy for WebSocket upgrades or accept the error (harmless)
   - **Details**: See complete documentation below

##### WebSocket Connection Errors (Development Only) - Complete Documentation

**Status**: ⚠️ Known Issue - Non-Critical  
**Priority**: Low (Development Only)  
**Component**: Frontend (Vite HMR) + Reverse Proxy Configuration

**Problem Description:**

When accessing the application via the domain `ventureuplink.com`, users see WebSocket connection errors in the browser console. This occurs because Vite's HMR (Hot Module Replacement) WebSocket connection fails when accessed through a reverse proxy that isn't configured to handle WebSocket upgrades.

**Error Message:**
```
WebSocket connection to 'wss://ventureuplink.com:3000/?token=...' failed
[vite] failed to connect to websocket (Error: WebSocket closed without opened.)
```

**Root Cause:**
1. Vite HMR uses WebSocket connections for Hot Module Replacement
2. Reverse proxy (Nginx/HAProxy) is not configured to handle WebSocket upgrades
3. WebSocket tries to connect to port 3000, but when accessed via domain, should use standard ports (80/443)
4. Reverse proxy needs to upgrade HTTP/HTTPS connections to WebSocket (WS/WSS)

**Impact:**
- ✅ **Application works normally** - This is NON-CRITICAL
- ✅ All API calls function correctly
- ✅ User interactions work as expected
- ❌ Hot Module Replacement (HMR) does not work when accessing via domain
- ❌ Browser console shows error messages (cosmetic issue)

**Note**: HMR is primarily a development convenience feature. The application functions perfectly without it. Users just need to manually refresh the page to see code changes. In production, this won't be an issue as production builds don't use HMR.

**Solution Options:**

1. **Configure Reverse Proxy for WebSocket (Recommended for Development)**
   - Configure reverse proxy to handle WebSocket upgrades
   - Forward `Upgrade` and `Connection` headers
   - Set proper X-Forwarded-* headers
   - See configuration examples below

2. **Accept the Error (Recommended for Testing)**
   - Simply ignore the WebSocket errors (they are harmless)
   - No configuration needed
   - Application works perfectly

**Reverse Proxy Configuration:**

**Nginx Example:**
```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    
    # WebSocket upgrade support (CRITICAL for HMR)
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    # Timeouts for WebSocket connections
    proxy_read_timeout 86400;
    proxy_connect_timeout 86400;
    proxy_send_timeout 86400;
}
```

**HAProxy Example:**
```haproxy
backend ventureuplink_backend
    server frontend localhost:3000 check
    http-request set-header X-Forwarded-Proto https if { ssl_fc }
    http-request set-header X-Forwarded-Proto http if !{ ssl_fc }
    http-request set-header X-Forwarded-Host %[req.hdr(Host)]
    http-request set-header X-Forwarded-Port %[dst_port]
```

**Current Vite Configuration:**
The Vite configuration is already set up correctly:
- `hmr.clientPort: undefined` - Auto-detects from request headers
- `hmr.port: 3000` - Internal Docker port
- `hmr.host: undefined` - Auto-detects from X-Forwarded-Host header
- `hmr.protocol: undefined` - Auto-detects from X-Forwarded-Proto header
- `allowedHosts` - Includes all domain variations

**Important: Access URL**
- ✅ Correct: `https://ventureuplink.com` or `http://ventureuplink.com`
- ❌ Wrong: `https://ventureuplink.com:3000` (causes WebSocket errors)

**Testing:**
1. Open browser DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Access the app via domain
4. Check if WebSocket connection shows status 101 (Switching Protocols)

**Related Files:**
- `frontend/vite.config.ts` - Vite configuration
- `docker-compose.yml` - Docker configuration

**Action Required:**
- For development: Configure reverse proxy for WebSocket
- For testing: Accept the error (it's harmless)
- For production: Not applicable (production builds don't use HMR)

**Last Updated**: 2025-01-16

---

13. **Source File 500 Errors (Development Only)**
   - **Status**: ✅ **FIXED** - 2025-01-14
   - **Priority**: Low (Development Only)
   - **Component**: Frontend (Vite Dev Server) + Reverse Proxy
   - **Issue**: Browser/DevTools trying to fetch source files directly (e.g., `/src/components/CreatePitchDeck.tsx`) causing 500 errors
   - **Root Cause**: 
     - Browser DevTools or error stack traces request source files directly via reverse proxy
     - Vite dev server was configured with source maps disabled, preventing proper source file serving
     - Vite needs source maps enabled in dev mode to serve source files when requested
   - **Solution Implemented**:
     - ✅ Enabled source maps in dev mode (`esbuild.sourcemap: true`, `css.devSourcemap: true`)
     - ✅ Removed all custom plugins that were interfering with Vite's natural behavior
     - ✅ Let Vite handle source file requests naturally - it can serve them when source maps are enabled
     - ✅ Source maps still disabled in production builds (only enabled in dev)
   - **How It Works**:
     - With source maps enabled, Vite can serve source files when DevTools/error traces request them
     - Vite transforms modules for actual module requests (with query params)
     - Vite serves source files for direct file requests (without query params) when source maps are enabled
     - No custom plugins needed - Vite handles everything correctly
   - **Impact**: 
     - ✅ No more 500 errors in console
     - ✅ Source files can be accessed by DevTools when needed
     - ✅ All legitimate module requests work correctly
     - ✅ Application functions normally
   - **Related Files**:
     - `frontend/vite.config.ts` - Source maps enabled in dev, disabled in production
     - `frontend/src/main.tsx` - No error suppression (for debugging)
   - **Last Updated**: 2025-01-14

14. **InvestorDashboard Syntax Error - JSX Component Reference**
   - **Status**: ✅ **FIXED** - 2026-01-19
   - **Priority**: High (Blocking Component Load)
   - **Component**: Frontend (`InvestorDashboard.tsx`)
   - **Issue**: `GET https://ventureuplink.com/src/components/InvestorDashboard.tsx` returning 500 Internal Server Error, preventing component from loading
   - **Root Cause**: 
     - Multiple JSX syntax errors in `InvestorDashboard.tsx`:
       1. **Line 719**: Invalid JSX syntax `<activity.icon>` - Cannot use dot notation directly in JSX tags
       2. **Line 735**: Missing closing `)}` for ternary operator in "Recent Activity" section
       3. **Line 840**: Missing conditional wrapper for "Deal Pipeline" section - orphaned `)}` without matching opening ternary
     - Vite's React SWC compiler was throwing "Unterminated regexp literal" errors due to invalid JSX syntax
     - Component failed to compile, causing browser to request raw source file, which also failed
   - **Solution Implemented**:
     - ✅ Fixed dynamic component rendering: Changed `<activity.icon>` to extract component to variable first:
       ```tsx
       const IconComponent = activity.icon;
       return <IconComponent className={...} />
       ```
     - ✅ Fixed ternary operator closure: Added missing `)}` to close ternary in "Recent Activity" section
     - ✅ Fixed Deal Pipeline section: Added proper conditional wrapper `{pipelineDeals.length === 0 ? (...) : (...)}` to match structure of other sections
     - ✅ Added `useCallback` hook for `fetchSharedPitchDecks` to prevent unnecessary re-renders
     - ✅ Moved user validation check AFTER all hooks (React Rules of Hooks compliance)
   - **Files Modified**:
     - `frontend/src/components/InvestorDashboard.tsx` - Fixed JSX syntax errors, added proper conditional wrappers
     - `frontend/src/services/investorService.ts` - Added `getSharedPitchDecks()` method and `SharedPitchDeck` interface
     - `backend/apps/investors/views.py` - Added `list_shared_pitch_decks()` endpoint with error handling
     - `backend/apps/investors/urls.py` - Added route for shared pitch decks endpoint
     - `backend/apps/ventures/serializers.py` - Added `InvestorSharedPitchDeckSerializer` with null-safe methods
   - **Impact**: 
     - ✅ Component now compiles successfully
     - ✅ No more 500 errors when loading InvestorDashboard
     - ✅ Shared pitch decks feature fully functional
     - ✅ Proper error handling prevents crashes
   - **Related Changes**:
     - Implemented investor shared pitch decks feature (backend endpoint + frontend integration)
     - Removed mock data from InvestorDashboard (replaced with real API calls)
     - Added comprehensive error handling and null-safety checks
   - **Last Updated**: 2026-01-19

#### High Priority Tech Debt

1. **VL-814**: Mentor Profile CRUD Endpoints Missing
   - **Issue**: No backend endpoints for mentor profile creation/update
   - **Impact**: Mentors cannot create profiles after registration
   - **Required Endpoints**:
     - `POST /api/mentors/profile` - Create mentor profile
     - `GET /api/mentors/profile/me` - Get own profile
     - `PATCH /api/mentors/profile/me` - Update own profile
     - `POST /api/mentors/profile/submit` - Submit for approval
   - **Estimated Effort**: 8 story points

2. **VL-815**: Frontend Profile Creation Not Connected
   - **Issue**: Registration forms collect profile data but don't create profiles automatically
   - **Location**: `frontend/src/components/AuthContext.tsx` (TODO comments)
   - **Impact**: Users must manually create profiles after registration
   - **Required Changes**:
     - Connect `VentureRegistration` to product creation API
     - Connect `InvestorRegistration` to investor profile creation API
     - Connect `MentorRegistration` to mentor profile creation API (once endpoints exist)
   - **Estimated Effort**: 5 story points

3. **VL-816**: Profile Validation Before Submission
   - **Issue**: No validation to ensure all required fields are filled before submission
   - **Impact**: Users can submit incomplete profiles
   - **Required**: Add validation in submit endpoints
   - **Estimated Effort**: 3 story points

#### Medium Priority Tech Debt

4. **VL-817**: KYC/Identity Verification System
   - **Issue**: No identity verification beyond email
   - **Impact**: Cannot verify user identity, potential fraud risk
   - **Required Features**:
     - Document upload (ID, passport, etc.)
     - Document validation service integration
     - Identity verification workflow
   - **Estimated Effort**: 13 story points

5. **VL-818**: Business Verification for Ventures
   - **Issue**: No business registration verification
   - **Impact**: Cannot verify ventures are legitimate businesses
   - **Required Features**:
     - Business registration number field
     - Business document upload
     - Business verification service integration
   - **Estimated Effort**: 8 story points

6. **VL-819**: Investor Accreditation Verification
   - **Issue**: No investor accreditation verification
   - **Impact**: Cannot verify investor credentials
   - **Required Features**:
     - Accreditation status field
     - Accreditation document upload
     - Regulatory compliance checks
   - **Estimated Effort**: 8 story points

7. **VL-820**: Mentor Background Verification
   - **Issue**: No professional background verification
   - **Impact**: Cannot verify mentor qualifications
   - **Required Features**:
     - Professional verification workflow
     - Reference check system
     - Employment verification
   - **Estimated Effort**: 8 story points

#### Low Priority Tech Debt

8. **VL-821**: Phone Number Verification
   - **Issue**: No SMS/phone verification
   - **Impact**: Email-only verification, no MFA
   - **Estimated Effort**: 5 story points

9. **VL-822**: Address Verification
   - **Issue**: No physical address verification
   - **Impact**: Cannot verify user location
   - **Estimated Effort**: 3 story points

10. **VL-832**: Venture Users Unread Message Badge Issue
    - **Issue**: Venture users still show badge of unread messages when there are no unread messages
    - **Impact**: Confusing UX - users see notification badge but no actual unread messages in inbox
    - **Location**: Frontend badge display logic, possibly backend unread count calculation for venture users
    - **Required**: 
      - Investigate why venture users see incorrect unread count
      - Fix badge display to match actual unread messages
      - Ensure unread count calculation is consistent across all user roles
    - **Estimated Effort**: 3 story points

### Current Registration Flow Diagram

```
User Registration Flow:
┌─────────────────────────────────────────────────────────────┐
│ 1. POST /api/auth/register                                  │
│    - Email, password, full_name, role                        │
│    - User account created                                    │
│    - Email verification token generated                     │
│    - Verification email sent (HTML)                         │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Email Verification                                        │
│    - User clicks link in email                               │
│    - POST /api/auth/verify-email                            │
│    - is_email_verified = True                                │
│    - User can access dashboard                               │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Profile Creation (Role-Specific)                         │
│                                                              │
│ VENTURES:                                                    │
│   ✅ POST /api/ventures/products (up to 3)                  │
│   ✅ Status: DRAFT                                           │
│                                                              │
│ INVESTORS:                                                   │
│   ✅ POST /api/investors/profile                            │
│   ✅ Status: DRAFT                                           │
│                                                              │
│ MENTORS:                                                     │
│   ❌ POST /api/mentors/profile (MISSING)                    │
│   ❌ Status: Cannot create profile                            │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Profile Submission                                        │
│    - POST /api/{role}/profile/submit                         │
│    - ReviewRequest created                                   │
│    - Status: SUBMITTED                                       │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Admin Review                                              │
│    - GET /api/reviews/pending                                │
│    - POST /api/reviews/{id}/approve or /reject               │
│    - Status: APPROVED or REJECTED                            │
│    - Email notification sent (HTML)                          │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Platform Access                                           │
│    - If APPROVED: Full platform access                      │
│    - If REJECTED: Can update and resubmit                   │
└─────────────────────────────────────────────────────────────┘
```

### Verification Requirements by Role

#### Ventures
- ✅ Email verification
- ✅ Profile approval workflow
- ❌ Business registration verification
- ❌ Business license verification
- ❌ Tax ID verification
- ❌ Identity verification (founders)

#### Investors
- ✅ Email verification
- ✅ Profile approval workflow
- ❌ Accredited investor verification
- ❌ Investment license verification
- ❌ Proof of funds verification
- ❌ Identity verification

#### Mentors
- ✅ Email verification
- ❌ Profile creation endpoints (MISSING)
- ❌ Profile approval workflow (blocked by missing endpoints)
- ❌ Professional background verification
- ❌ Employment verification
- ❌ Reference checks
- ❌ Identity verification

---

## Summary

✅ **Completed**:
- Platform name updated to "Venture UP Link"
- Admin dashboard fully functional with CRUD
- Approval workflow backend implemented
- Email tasks implemented and working
- Dashboard UIs exist for all user types
- **Pitch Deck CRUD**: Upload, list, and delete pitch deck documents per product
- **Messaging System**: Full conversation and messaging endpoints for contacting investors/mentors
- **User Profile Management**: Update user profile (full_name) and change password endpoints
- **Frontend Services**: messagingService, userService, and updated productService with pitch deck methods
- **Frontend Integration**: Settings component uses password change API, EditProfile uses profile update API, VentureDashboard uses messaging service
- **Backend Security**: Comprehensive security audit completed, all identified vulnerabilities fixed
- **Frontend Security**: Input sanitization, XSS protection, and validation implemented across all components
- **Security Documentation**: Backend and frontend security audit reports created

❌ **Pending**:
- **Pitch Deck Versioning**: Version management system missing (VL-830)
- **KYC/Verification**: No identity, business, accreditation, or background verification (VL-817, VL-818, VL-819, VL-820)
- **Email Notifications**: Email notifications for pitch deck share/request/approval (TODO comments in code)
- Matching and content endpoints
- Rate limiting for sensitive endpoints (security recommendation)

**Recent Updates (2025-01-14)**:
- Implemented complete pitch deck CRUD operations (upload, list, delete) for products
- Implemented full messaging system for user-to-user communication
- Added user profile update and password change functionality
- Created frontend services for messaging, user management, and enhanced product management
- **Backend Security Audit**: Comprehensive security review and fixes for all API routes
- **Frontend Security Hardening**: Input sanitization, XSS protection, and validation across all components
- **React CVE Assessment**: Verified project is not vulnerable to CVE-2025-55182 (React Server Components RCE)

**Recent Updates (2025-01-15)**:
- **Email System Enhancement**: 
  - ✅ Created professional HTML-styled email templates for all email types
  - ✅ Responsive design with mobile-friendly layouts
  - ✅ Brand-consistent styling matching VentureUP Link design
  - ✅ Clear call-to-action buttons and visual indicators
  - ✅ Plain text fallbacks for email client compatibility
- **Messaging System Improvements**:
  - ✅ Fixed unread message badge refresh issue (immediate update when conversations marked as read)
  - ✅ Added callback mechanism for global unread count refresh
  - ✅ Improved conversation grouping and duplicate handling
  - ✅ Message editing functionality (15-minute time limit)
  - ✅ Conversation deletion from user inbox
  - ✅ Lazy conversation creation (prevents empty conversations)
- **Production Configuration**:
  - ✅ Domain configuration updated for `ventureuplink.com`
  - ✅ Backend API subdomain configured (`backend.ventureuplink.com`, `api.ventureuplink.com`)
  - ✅ Nginx service removed from docker-compose (using external Nginx Proxy Manager)
  - ✅ CORS and ALLOWED_HOSTS updated for production domains
  - ✅ Email integration: Approval/rejection emails now automatically sent via Celery tasks
- **Registration & Profile Creation (2025-01-15)**:
  - ✅ **VL-814**: Mentor Profile CRUD endpoints implemented (POST, GET, PATCH, submit)
  - ✅ **VL-815**: Frontend registration automatically creates profiles for investors and mentors
  - ✅ **Investor Registration**: Profile created automatically with form data mapping
  - ✅ **Mentor Registration**: Profile created automatically with form data mapping
  - ✅ **Venture Registration**: Products created separately from dashboard (by design - supports multiple products)
  - ✅ **Security Hardening**: Enhanced input validation, URL/email validation, length limits, list size limits
  - ✅ **Auto-login**: Users automatically logged in after registration to enable profile creation
- **Pitch Deck System Analysis & Security Hardening (2025-01-15)**:
  - ✅ **Product Creation**: Full CRUD with security validation (URL, length, numeric bounds)
  - ✅ **Pitch Deck Upload**: File validation (extension, MIME type, size), metadata validation
  - ✅ **Security Enhancements**: All serializers enhanced with comprehensive input validation
  - ✅ **RBAC**: Proper permission checks on all endpoints (ownership, status, role-based)
  - ✅ **Traction Metrics Validation**: JSON structure validation, size limits, type checking
  - ✅ **Metadata Sanitization**: All pitch deck metadata fields sanitized and validated
- **Pitch Deck System Implementation (2025-01-15)**:
  - ✅ **VL-823**: Pitch Deck Download/View Endpoints implemented
    - ✅ `GET /api/ventures/products/{id}/documents/{doc_id}/download` - Download pitch deck
    - ✅ `GET /api/ventures/products/{id}/documents/{doc_id}/view` - View pitch deck in browser
    - ✅ Access tracking with PitchDeckAccessEvent model
    - ✅ Security: Only approved users can access, ownership checks
  - ✅ **VL-824**: Pitch Deck Access Control System implemented
    - ✅ `GET /api/ventures/products/{id}/documents/{doc_id}/access` - List access permissions
    - ✅ `POST /api/ventures/products/{id}/documents/{doc_id}/access/grant` - Grant access
    - ✅ `POST /api/ventures/products/{id}/documents/{doc_id}/access/revoke` - Revoke access
    - ✅ PitchDeckAccess model for permission tracking
  - ✅ **VL-825**: Pitch Deck Sharing Workflow implemented
    - ✅ `POST /api/ventures/products/{id}/documents/{doc_id}/share` - Share with investor
    - ✅ `GET /api/ventures/products/{id}/documents/{doc_id}/shares` - List shares
    - ✅ PitchDeckShare model for sharing tracking
    - ✅ Automatic access grant when sharing
  - ✅ **VL-826**: Pitch Deck Request System implemented
    - ✅ `POST /api/ventures/products/{id}/documents/{doc_id}/request` - Request access
    - ✅ `GET /api/ventures/products/{id}/documents/{doc_id}/requests` - List requests
    - ✅ `POST /api/ventures/products/{id}/documents/{doc_id}/requests/{id}/respond` - Approve/deny
    - ✅ PitchDeckRequest model for request tracking
  - ✅ **VL-828**: Pitch Deck Analytics implemented
    - ✅ `GET /api/ventures/products/{id}/documents/{doc_id}/analytics` - Get analytics
    - ✅ Tracks views, downloads, unique viewers/downloaders
    - ✅ Recent access events with user information
  - ✅ **Frontend Integration**: Frontend services and UI components updated to use new endpoints
    - ✅ ProductService: All new pitch deck endpoints added with UUID validation
    - ✅ ProductManagement: Download/view, analytics, sharing, access control UI implemented
    - ✅ InvestorDashboard: Pitch deck request functionality implemented
    - ✅ VentureDashboard: Pitch deck sharing functionality implemented
  - ✅ **Security Hardening**: Comprehensive security measures applied
    - ✅ UUID validation on all API calls
    - ✅ Input sanitization (length limits, XSS prevention)
    - ✅ URL validation (whitelist protocols, prevent javascript: and data: URLs)
    - ✅ Email validation (format checking)
    - ✅ File validation (type, size, extension)
    - ✅ Message sanitization (remove dangerous patterns, script tags, event handlers)
    - ✅ Output sanitization (escape HTML for display)
    - ✅ File upload validation (type, size, extension, filename sanitization)
    - ✅ Form data sanitization (all fields with length limits)
    - ✅ Team member and founder handlers: UUID validation, URL validation, email validation
  - ⚠️ **Email Notifications**: TODO comments for email notifications on share/request/approval (to be implemented in future)
  - ✅ **Migration File**: Created `0005_pitch_deck_access_models.py` for database migration
  - ✅ **Seed Data Compatibility**: Updated `seed_demo_data.py` to create pitch deck interactions
    - ✅ Creates PitchDeckShare records (ventures sharing with investors)
    - ✅ Creates PitchDeckRequest records (investors requesting access, both pending and approved)
    - ✅ Creates PitchDeckAccess records (automatic when sharing or approving requests)
    - ✅ Creates PitchDeckAccessEvent records (views and downloads for analytics)
    - ✅ Clears all pitch deck related data when using `--clear` flag
  - ✅ **Frontend Bug Fixes**:
    - ✅ Fixed duplicate `Users` import in ProductManagement.tsx
    - ✅ Fixed `products.find is not a function` error in VentureDashboard.tsx
    - ✅ Added array validation and auto-fetch for products in `handleSharePitch`
    - ✅ Fixed `ventures.filter is not a function` error in InvestorDashboard.tsx
    - ✅ Added array validation in `fetchVentures` and `renderDiscover` to ensure ventures is always an array
    - ✅ Updated `ventureService.getPublicVentures` to handle both array and paginated responses
    - ✅ Fixed `onRefreshUnreadCount is not defined` error in InvestorDashboard.tsx messages view
    - ✅ Added `onRefreshUnreadCount` prop to `DashboardContent` in AppWithRouter.tsx and passed it to all dashboard components
    - ✅ Removed hardcoded `investmentOpportunities` data from InvestorDashboard discover view
    - ✅ Removed "Featured Opportunities" section that used hardcoded data
    - ✅ Fixed traction metrics display - now formats JSON properly instead of showing raw JSON string
    - ✅ Added helper function to format traction metrics as readable key-value pairs
    - ✅ Fixed HTML entity encoding issue (&#x2F; showing instead of /) in all card text fields
    - ✅ Added `safeDisplayText` function to decode HTML entities while maintaining security
    - ✅ Applied `safeDisplayText` to all text fields in venture cards (name, description, sector, address, status, funding, traction)
    - ✅ Improved traction metrics display formatting with better spacing and alignment
- **No Modals Rule Implementation (2025-01-15)**:
  - ✅ **Platform Rule Established**: No modals allowed - all detailed views open in new tabs
  - ✅ **Documentation**: Created `NO_MODALS_RULE.md` with guidelines and migration status
  - ✅ **Investor Dashboard Portfolio**: Removed all modals (CompanyDetailsModal, ReportsModal, ExitPlanModal, MessageModal, SchedulingModal)
  - ✅ **Portfolio Actions**: All actions navigate on same page (updated 2025-01-15)
    - Company Details → Navigates to `/dashboard/investor/portfolio/details?companyId=...` on same page
    - Reports → Navigates to `/dashboard/investor/portfolio/reports?companyId=...` on same page
    - Exit Plan → Navigates to `/dashboard/investor/portfolio/exit-plan?companyId=...` on same page
    - Messages → Navigates to `/dashboard/investor/messages?userId=...` on same page
    - Schedule Meeting → Opens `/dashboard/investor/schedule?userId=...` in new tab (unchanged)
  - ✅ **Navigation**: Using React Router's `useNavigate()` for same-page navigation
    - Better UX: Users stay in context, can use browser back button
    - No session issues: Same page means same session automatically
  - ✅ **Pitch Deck View Authentication Fix** (2025-01-15):
    - Fixed "View Pitch" button in Discover page to properly authenticate
    - Changed from opening direct API URL to fetching file via authenticated API client
    - Creates blob URL from fetched file, ensuring new tab has proper authentication
    - Blob URLs are properly cleaned up when window closes or after 1 hour
    - Applied to both InvestorDashboard and ProductManagement components
  - ✅ **Pitch Deck Details Page** (2025-01-15):
    - Created comprehensive pitch deck details page (`/dashboard/investor/pitch-deck/:productId/:docId`)
    - "View Pitch" button now navigates to details page on same page (per user request)
    - Displays all pitch deck information: problem statement, solution, target market, traction metrics, funding details
    - Shows company overview with website, location, team size, founded year
    - Provides View PDF and Download buttons with proper authentication
    - Lists all other documents available for the venture
    - Uses `safeDisplayText` for all user-generated content to prevent XSS
  - ✅ **Portfolio Management Routes** (2025-01-15):
    - Created `/dashboard/investor/portfolio/details` route - shows complete PitchDeckDetails component
    - Created `/dashboard/investor/portfolio/reports` route - shows list of all reports and documents
    - Created `/dashboard/investor/portfolio/exit-plan` route - shows exit strategy planning
    - All routes navigate on same page (per user request)
    - Reports page shows all documents with View/Download buttons and links to pitch deck details
    - Exit plan page shows investment overview, exit options, and action plan
    - PortfolioDetails component reuses PitchDeckDetails with productIdOverride prop
  - ✅ **Portfolio Messaging & Scheduling** (2025-01-15):
    - **Messaging**: "Message" button initiates chat with startup founder
      - Fetches product user ID if company.id is a valid UUID
      - Falls back to finding matching product by name for demo data
      - Navigates to messages view with selected user pre-populated
      - MessagingSystem automatically creates/selects conversation with the user
      - **Fixed (2025-01-15)**: Added `useEffect` in MessagingSystem to watch for `selectedUserId` changes
      - **Fixed (2025-01-15)**: Added `key` prop to MessagingSystem to force re-render when selectedUserId changes
      - **Fixed (2025-01-15)**: Removed redundant `onViewChange` call since navigation handles view change
      - **Status**: ✅ Fully functional - clicking "Message" now properly initiates chat with selected user
    - **Meeting Scheduler**: "Schedule Meeting" button opens meeting scheduler
      - Created `/dashboard/investor/schedule` route with MeetingScheduler component
      - Allows selecting multiple tentative dates (up to 5)
      - Includes meeting title and additional notes
      - Sends meeting request as a formatted message via messaging system
      - Validates dates are in the future
      - All routes navigate on same page (per user request)
      - **Status**: ✅ Fully functional - meeting requests are sent as formatted messages
  - 🔄 **Pending**: Audit and migrate remaining modals in other dashboards
  - ✅ **Backend Bug Fixes**:
    - ✅ Fixed admin stats pending approvals count - now only counts ReviewRequests with status='SUBMITTED'
    - ✅ Fixed approval/rejection views to update actual product/profile status (not just ReviewRequest)
    - ✅ `approve_review` now updates product/profile status to 'APPROVED' and sets `approved_at`
    - ✅ `reject_review` now updates product/profile status to 'REJECTED'
  - ✅ Fixed unread messages count discrepancy - now only counts messages from conversations where user is a participant
  - ✅ `get_unread_count` now uses same logic as conversations list to ensure count matches inbox
  - ✅ Fixed messaging initiation - "Message" button now properly initiates chat with selected user
    - Added `useEffect` in MessagingSystem to watch for `selectedUserId` changes
    - Added `key` prop to force re-render when selectedUserId changes
    - Removed redundant `onViewChange` call since navigation handles view change
  - ✅ Fixed meeting scheduler - "Schedule Meeting" button now opens meeting scheduler with proper user ID resolution

### 16. Logo Display Issue (2026-01-17)

**Problem**: Logo not showing in navbar (`ModernDashboardLayout.tsx`, `AppWithRouter.tsx`, `App.tsx`)
- Logo file exists at `frontend/public/logos/ventureuplink.png`
- Browser console showed `naturalWidth: 0`, `naturalHeight: 0` (empty image)
- GET request for `/logos/ventureuplink.png` returned 200 OK but 0x0 pixel image

**Root Cause**: Reverse proxy (Cloudflare + HAProxy) was not forwarding `/logos/*` requests to Vite dev server
- Public folder assets require reverse proxy to forward requests to Vite
- Production HAProxy configuration only forwards specific paths (not `/logos/`)
- Browser received index.html or empty response instead of the PNG file
- Original logo file was also corrupted (user replaced with original 1024x1024px version)

**Solution** (2026-01-17): Move logo to `src/assets/` for Vite bundling
1. ✅ Created `frontend/src/assets/logos/` directory
2. ✅ Copied logo: `frontend/public/logos/ventureuplink.png` → `frontend/src/assets/logos/ventureuplink.png`
3. ✅ Added import to `ModernDashboardLayout.tsx`: `import logoImage from '../assets/logos/ventureuplink.png'`
4. ✅ Added import to `AppWithRouter.tsx`: `import logoImage from './assets/logos/ventureuplink.png'`
5. ✅ Added import to `App.tsx`: `import logoImage from './assets/logos/ventureuplink.png'`
6. ✅ Changed `<img src="/logos/ventureuplink.png" />` to `<img src={logoImage} />`
7. ✅ Added inline styles for precise sizing control: `style={{ maxWidth: '75px', maxHeight: '75px' }}`
8. ✅ Final size: 75px × 75px (from original 64px base)
9. ✅ Restarted frontend container to pick up new asset file

**Why This Works**:
- Vite processes imported images during build
- Outputs them to `/assets/` directory with content hash (e.g., `/assets/ventureuplink-abc123.png`)
- Reverse proxy already serves `/assets/*` correctly (serves bundled JS/CSS from there)
- No dependency on public folder paths that reverse proxy doesn't handle
- Inline styles provide hard limits to prevent high-resolution source image (1024px) from displaying larger than intended

**Status**: ✅ **RESOLVED** - Logo now loads successfully in all navbars
- No more console errors
- Logo displays at 75px × 75px with inline style constraints
- Works in both development and production environments
- User confirmed logo is working and properly sized


