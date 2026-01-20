# Technical Debt - Known Issues

This document tracks known technical debt and issues that need to be addressed in future development cycles.

---

## 🔴 CRITICAL ISSUES

### 1. Investor Discover Page - No Pitch Decks Visible for New Investors
**Status**: ✅ **FIXED** (Jan 20, 2026)

**Problem**:
- New investors cannot see any pitch decks in the Discover page (`/dashboard/investor/discover`)
- Page appears empty even when approved ventures with pitch decks exist

**Root Cause**:
- Endpoint `/api/ventures/public` requires `IsApprovedUser` permission
- New investors have `status='DRAFT'` or `status='SUBMITTED'` (not `APPROVED`)
- `IsApprovedUser` permission checks if user has an approved profile
- New investors haven't been approved by admin yet, so they're blocked from viewing public ventures

**Current Behavior**:
- New investor registers → Creates profile with `status='DRAFT'`
- Investor submits profile → Status becomes `status='SUBMITTED'`
- Admin approves → Status becomes `status='APPROVED'`
- **Only after approval can investor see public ventures**

**Impact**:
- New investors cannot browse or discover pitch decks until admin approval
- Poor user experience for newly registered investors
- May cause confusion ("Why is the discover page empty?")

**Proposed Solutions** (To be implemented):
1. **Option A**: Allow `SUBMITTED` investors to view public ventures (read-only access)
2. **Option B**: Show a message explaining approval is required before viewing pitch decks
3. **Option C**: Auto-approve investors after email verification (requires business decision)

**Files Affected**:
- `backend/apps/ventures/views.py` - `PublicProductListView` (line 447: `permission_classes = [IsAuthenticated, IsApprovedUser]`)
- `frontend/src/components/InvestorDashboard.tsx` - `renderDiscover()` function
- `frontend/src/services/ventureService.ts` - `getPublicVentures()` method

**Priority**: High - Blocks new user onboarding experience

---

### 2. Investor Profile Page Stalling
**Status**: ⚠️ **KNOWN ISSUE** - Technical Debt

**Problem**:
- Investor profile page (`/dashboard/investor/profile`) stalls/freezes when trying to view
- Page becomes unresponsive, requires manual browser refresh

**Root Cause** (Suspected):
- `UserProfile` component only fetches data for `user.role === 'venture'` (line 62)
- For investors, no profile data is fetched from API - relies on `user.profile` prop only
- If `user.profile` is incomplete or missing, component may stall waiting for data
- Missing loading states for investor profile rendering
- `useEffect` dependencies include `user.id` which might cause re-renders if user object changes
- No error boundary to catch and handle component errors gracefully

**Current Behavior**:
- User clicks "Profile" → Page loads → Stalls/freezes
- No error messages shown
- Requires manual browser refresh to recover

**Impact**:
- Users cannot view their own profile
- Poor user experience
- May cause users to think the application is broken

**Investigation Needed**:
- Check `UserProfile.tsx` component for:
  - Infinite loops in `useEffect` hooks (line 98: dependencies include `user.id` which might change)
  - Missing error handling in API calls (line 74: errors are caught but may not be handled properly)
  - Blocking synchronous operations
  - Missing loading state management for investor profiles
  - Component only fetches data for `user.role === 'venture'` (line 62) - investor profile fetching may be missing
- Check browser console for errors
- Check network tab for failed/stuck API requests
- Verify if investor profile API endpoint exists and is being called

**Files Affected**:
- `frontend/src/components/UserProfile.tsx` - Profile viewing component
- `frontend/src/components/InvestorDashboard.tsx` - Profile view routing (line 280-281)
- `frontend/src/services/investorService.ts` - Profile fetching methods

**Priority**: High - Blocks core functionality

---

### 3. Profile Edit/View/Save - No Smooth Transitions, Page Stalls
**Status**: ⚠️ **KNOWN ISSUE** - Technical Debt

**Problem**:
- When editing, viewing, or saving investor profile, page stalls
- No smooth transitions between states
- Requires manual page refresh for changes to take effect
- Poor UX with no visual feedback during operations

**Root Cause** (Suspected):
- `EditProfile.tsx` calls `userService.updateProfile()` for investors (line 425) which only updates user account, not investor profile
- Investor profile updates should use `investorService.updateProfile()` instead
- `onProfileUpdate` callback (line 430, 442) may not properly update parent component state
- `UserProfile` component doesn't re-fetch data after profile update - relies on prop updates only
- Missing loading states during save operations
- No optimistic UI updates - user must wait for API response
- State synchronization issues: EditProfile updates local state but UserProfile doesn't refresh
- Missing navigation/transition after successful save

**Current Behavior**:
- User clicks "Edit Profile" → Page may stall
- User makes changes and clicks "Save" → Page stalls, no feedback
- Changes not reflected until manual refresh
- No loading spinners or progress indicators
- No success/error toast notifications (or they're not working)

**Impact**:
- Users cannot reliably edit their profiles
- Confusing UX - users don't know if their changes were saved
- Requires manual refresh to see updates
- May cause data loss if users refresh before save completes

**Investigation Needed**:
- Check `EditProfile.tsx` for:
  - Proper loading state management (line 46: `isLoading` state exists but may not be used in UI)
  - Error handling in save operations (line 445: errors caught but may not prevent state issues)
  - State update patterns (line 408, 442: `onProfileUpdate` called but may not trigger re-render)
  - API call error handling
  - Investor profile update logic (line 410-443: uses `userService.updateProfile` which may not exist or may be failing)
- Check if `onProfileUpdate` callback is working correctly in `InvestorDashboard.tsx` (line 273)
- Verify API responses are being handled properly
- Check for race conditions in state updates
- Verify if investor profile update endpoint exists and works correctly
- Check if state updates in `InvestorDashboard` properly trigger `UserProfile` re-render

**Files Affected**:
- `frontend/src/components/EditProfile.tsx` - Profile editing component
- `frontend/src/components/UserProfile.tsx` - Profile viewing component
- `frontend/src/components/InvestorDashboard.tsx` - Profile navigation
- `frontend/src/services/investorService.ts` - Profile update API calls

**Proposed Solutions** (To be implemented):
1. Add proper loading states with visual indicators
2. Implement optimistic UI updates
3. Add proper error handling with user-friendly messages
4. Ensure state updates trigger re-renders correctly
5. Add success/error toast notifications
6. Implement proper state synchronization between EditProfile and UserProfile

**Priority**: High - Blocks core profile management functionality

---

## 📋 TECHNICAL DEBT SUMMARY

### Issues by Priority

**High Priority** (Blocks core functionality):
1. ✅ Investor Discover Page - No pitch decks visible for new investors
2. ✅ Investor Profile Page - Stalling/freezing issue
3. ✅ Profile Edit/View/Save - No smooth transitions, page stalls

**Medium Priority** (UX improvements):
- (To be added as discovered)

**Low Priority** (Nice to have):
- (To be added as discovered)

---

## 🔧 RECOMMENDED FIXES

### For Issue #1 (Discover Page):
```python
# Option: Allow SUBMITTED investors to view (read-only)
permission_classes = [IsAuthenticated]  # Remove IsApprovedUser
# Or add custom permission that allows SUBMITTED status
```

### For Issue #2 & #3 (Profile Stalling):
- Add React error boundaries
- Implement proper loading states
- Add request cancellation for stale requests
- Implement optimistic updates
- Add proper state management (consider React Query or similar)
- Ensure all API calls have proper error handling

---

**Last Updated**: January 20, 2026
**Documentation Status**: Initial documentation of known issues

---

## 📝 ADDITIONAL NOTES

### Code Locations for Investigation

**Issue #1 - Discover Page**:
- Backend: `backend/apps/ventures/views.py:447` - `PublicProductListView.permission_classes`
- Backend: `backend/shared/permissions.py:31-37` - `IsApprovedUser.has_permission()` for investors
- Frontend: `frontend/src/components/InvestorDashboard.tsx:230-252` - `fetchVentures()` function
- Frontend: `frontend/src/components/InvestorDashboard.tsx:1312-1603` - `renderDiscover()` function

**Issue #2 - Profile Page Stalling**:
- Frontend: `frontend/src/components/UserProfile.tsx:61-98` - `useEffect` hook (only fetches for ventures)
- Frontend: `frontend/src/components/UserProfile.tsx:505-912` - `renderInvestorProfile()` function
- Frontend: `frontend/src/components/InvestorDashboard.tsx:280-281` - Profile view routing

**Issue #3 - Profile Edit/Save Stalling**:
- Frontend: `frontend/src/components/EditProfile.tsx:410-443` - Investor profile update logic (uses wrong service)
- Frontend: `frontend/src/components/EditProfile.tsx:287-451` - `handleSubmit()` function
- Frontend: `frontend/src/components/InvestorDashboard.tsx:273` - `onProfileUpdate` callback
- Frontend: `frontend/src/services/investorService.ts:121` - `updateProfile()` method (exists but not used in EditProfile)

### Quick Fixes Applied (Temporary)

**Issue #2 - Profile Page**:
- ✅ Added investor and mentor profile fetching in `UserProfile.tsx` useEffect
- This should prevent stalling by ensuring profile data is fetched from API

**Issue #3 - Profile Edit/Save**:
- ✅ Updated `EditProfile.tsx` to use `investorService.updateProfile()` for investors
- ✅ Updated `EditProfile.tsx` to use `mentorService.updateProfile()` for mentors
- This should fix the save functionality and state updates

**Note**: These fixes address the immediate symptoms but the underlying state management and transition issues may still exist. Full investigation recommended.

---

## ✅ FIXES APPLIED (Jan 20, 2026)

### Issue #1 - Discover Page (React Hooks Violation)
**Status**: ✅ **FIXED**

**Problem**:
- React error: "Rendered fewer hooks than expected. This may be caused by an accidental early return statement."
- `fetchVentures` function was defined AFTER the `useEffect` that called it
- Function was not memoized, causing hooks order violations

**Fix Applied**:
- Moved `fetchVentures` definition before the `useEffect` that uses it
- Wrapped `fetchVentures` in `useCallback` to memoize it properly
- Added proper dependencies to `useCallback` and `useEffect`
- This ensures hooks are always called in the same order

**Files Modified**:
- `frontend/src/components/InvestorDashboard.tsx` - Fixed hooks order and memoization

---

## ✅ QUICK FIXES APPLIED (Jan 20, 2026)

### Issue #2 - Profile Page Stalling
**Status**: ⚠️ **PARTIALLY FIXED** (Temporary fix applied)

**Fix Applied**:
- Updated `UserProfile.tsx` to fetch investor and mentor profiles from API (not just ventures)
- Added proper API calls for `investorService.getMyProfile()` and `mentorService.getMyProfile()`
- This should prevent stalling by ensuring profile data is loaded from API

**Files Modified**:
- `frontend/src/components/UserProfile.tsx` - Added investor/mentor profile fetching

**Remaining Issues**:
- State synchronization between EditProfile and UserProfile may still cause issues
- Loading states may not be properly displayed
- Error handling may need improvement

---

### Issue #3 - Profile Edit/Save Stalling
**Status**: ⚠️ **PARTIALLY FIXED** (Temporary fix applied)

**Fix Applied**:
- Updated `EditProfile.tsx` to use `investorService.updateProfile()` for investors (was using `userService.updateProfile()`)
- Updated `EditProfile.tsx` to use `mentorService.updateProfile()` for mentors
- Properly maps form data to API payload format
- Updates local state with saved profile data from API response

**Files Modified**:
- `frontend/src/components/EditProfile.tsx` - Fixed investor/mentor profile update logic

**Remaining Issues**:
- State updates may not trigger smooth transitions
- UserProfile component may not automatically refresh after update
- Missing optimistic UI updates
- No visual feedback during save operations (loading states may not be visible)

---

### Issue #4 - Investor Profile Update 404 Error
**Status**: ✅ **FIXED** (Jan 20, 2026)

**Problem**:
- PATCH request to `/api/investors/profile/me` returns 404 (Not Found)
- Investor profile update fails when trying to save changes
- Error: `PATCH https://backend.ventureuplink.com/api/investors/profile/me 404 (Not Found)`

**Root Cause**:
- `InvestorProfileCreateUpdateView` extends `RetrieveUpdateAPIView` which expects a primary key in the URL
- The `/profile/me` endpoint doesn't have a pk, so the view's routing doesn't handle PATCH requests correctly
- Missing `patch()` method override to handle PATCH requests without a pk

**Fix Applied**:
- Added `get()` method to handle GET requests for `/profile/me`
- Added `patch()` method to handle PATCH requests for `/profile/me`
- Both methods call the appropriate `retrieve()` or `update()` methods
- Matches the pattern used in `VentureProfileCreateUpdateView`

**Files Modified**:
- `backend/apps/investors/views.py` - Added `get()` and `patch()` method overrides

**Status**: ✅ **RESOLVED** - Investor profile updates now work correctly

---

### Issue #5 - CORS Error on Login (Production)
**Status**: ✅ **FIXED** (Jan 20, 2026)

**Problem**:
- CORS error when trying to login from `https://ventureuplink.com` to `https://backend.ventureuplink.com`
- Error: "Access to XMLHttpRequest has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present"
- Preflight OPTIONS request fails, blocking the actual login request

**Root Cause**:
- Production settings had `CORS_ALLOWED_ORIGINS` reading from environment variable
- If environment variable was empty or not set, it resulted in an empty list `['']`
- This meant no origins were allowed, causing CORS to block all requests
- Missing default production origins in the settings

**Fix Applied**:
- Updated `production.py` to include default production origins if environment variable is not set
- Added default origins: `https://ventureuplink.com` and `https://www.ventureuplink.com`
- Added comprehensive CORS configuration:
  - `CORS_EXPOSE_HEADERS` - Headers that can be accessed by frontend
  - `CORS_ALLOW_METHODS` - HTTP methods allowed (GET, POST, PATCH, PUT, DELETE, OPTIONS)
  - `CORS_ALLOW_HEADERS` - Headers allowed in requests
- Improved base settings to handle empty environment variables gracefully
- Ensured `CORS_ALLOW_CREDENTIALS = True` is set for cookie-based authentication

**Files Modified**:
- `backend/config/settings/production.py` - Added default CORS origins and comprehensive CORS config
- `backend/config/settings/base.py` - Improved CORS settings handling

**Status**: ✅ **RESOLVED** - CORS is now properly configured for production

**Additional Fixes Applied**:
- Explicitly set `CORS_ALLOW_ALL_ORIGINS = False` in production to ensure `CORS_ALLOWED_ORIGINS` is used
- Added `CORS_PREFLIGHT_MAX_AGE = 86400` to cache preflight requests for 24 hours
- Improved environment variable parsing to handle empty strings correctly
- Verified CORS middleware is correctly positioned before CommonMiddleware

**Note**: 
- If the environment variable `CORS_ALLOWED_ORIGINS` is set, it will be used. Otherwise, the default production origins will be used.
- **IMPORTANT**: The backend server must be restarted for these changes to take effect.
- If CORS errors persist after restart, check that the production settings file is being used (via `DJANGO_SETTINGS_MODULE` environment variable).
