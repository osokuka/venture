# No Modals Rule

## Platform Rule: No Modals - Use New Tabs Instead

**Effective Date:** 2025-01-15  
**Status:** ✅ Active

### Rule Statement

**All modals are prohibited throughout the application.** Instead, detailed views, forms, and additional information should be opened in new browser tabs.

### Rationale

1. **Better User Experience**: New tabs allow users to:
   - Keep their place in the main dashboard
   - Compare multiple items side-by-side
   - Bookmark specific views
   - Use browser back/forward navigation
   - Share direct links to specific views

2. **Improved Accessibility**: 
   - Better screen reader support
   - Easier keyboard navigation
   - No focus trapping issues
   - Better mobile experience

3. **Simplified State Management**:
   - No modal state to manage
   - No overlay/z-index conflicts
   - Cleaner component structure

### Implementation Guidelines

#### ✅ DO:
- Open detailed views in new tabs using `window.open(url, '_blank', 'noopener,noreferrer')`
- Use query parameters to pass data: `/dashboard/role/view?param1=value1&param2=value2`
- Create dedicated routes for all detailed views
- Use proper URL structure for bookmarking and sharing

#### ❌ DON'T:
- Use `<Dialog>`, `<Modal>`, or any modal components
- Use `setIsOpen` state for modals
- Create overlay components that block the main view
- Use popup windows (use tabs instead)

### Examples

#### Portfolio Actions (Investor Dashboard)
- **Company Details**: Navigates to `/dashboard/investor/portfolio/details?companyId=...` on same page
- **Reports**: Navigates to `/dashboard/investor/portfolio/reports?companyId=...` on same page
- **Exit Plan**: Navigates to `/dashboard/investor/portfolio/exit-plan?companyId=...` on same page
- **Messages**: Navigates to `/dashboard/investor/messages?userId=...` on same page
- **Schedule Meeting**: Opens `/dashboard/investor/schedule?userId=...` in new tab (unchanged)

#### Product Management (Venture Dashboard)
- **Product Details**: Opens `/dashboard/venture/products/details?productId=...` in new tab
- **Analytics**: Opens `/dashboard/venture/products/analytics?productId=...` in new tab
- **Edit Product**: Opens `/dashboard/venture/products/edit?productId=...` in new tab

### Migration Status

#### ✅ Completed
- **Investor Dashboard Portfolio view** - All modals removed (2025-01-15)
  - ✅ CompanyDetailsModal → Opens `/dashboard/investor/portfolio/details?companyId=...` in new tab
  - ✅ ReportsModal → Opens `/dashboard/investor/portfolio/reports?companyId=...` in new tab
  - ✅ ExitPlanModal → Opens `/dashboard/investor/portfolio/exit-plan?companyId=...` in new tab
  - ✅ MessageModal → Opens `/dashboard/investor/messages?userId=...` in new tab
  - ✅ SchedulingModal → Opens `/dashboard/investor/schedule?userId=...` in new tab
  - ✅ All modal state variables removed
  - ✅ All modal handlers updated to use `window.open()` with query parameters
  - ✅ Modal component definitions commented out (can be removed in future cleanup)

#### 🔄 Pending
- Venture Dashboard - Review and migrate any remaining modals
- Mentor Dashboard - Review and migrate any remaining modals
- Admin Dashboard - Review and migrate any remaining modals
- Product Management - Review and migrate any remaining modals
- Other components - Audit and migrate all modals

### Code Pattern

```typescript
// ❌ OLD WAY (Modal)
const handleShowDetails = (item: any) => {
  setSelectedItem(item);
  setIsModalOpen(true);
};

// ✅ NEW WAY (Same Page Navigation - Portfolio Actions)
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

const handleShowDetails = (item: any) => {
  const params = new URLSearchParams({
    id: item.id,
    name: item.name,
  });
  navigate(`/dashboard/role/view?${params.toString()}`);
};

// ✅ ALTERNATIVE (New Tab - for other actions)
const handleShowDetails = (item: any) => {
  const params = new URLSearchParams({
    id: item.id,
    name: item.name,
  });
  window.open(`/dashboard/role/view?${params.toString()}`, '_blank', 'noopener,noreferrer');
};
```

### Security Considerations

- Always use `noopener,noreferrer` flags when opening new tabs
- Validate and sanitize all query parameters
- Use proper routing with authentication checks
- Never pass sensitive data in URLs (use tokens or session data)

### Session Inheritance

**New tabs automatically inherit the session from the parent tab** because:
- Authentication tokens are stored in `localStorage` (`access_token`, `refresh_token`)
- The API client (`api.ts`) reads tokens from `localStorage` on every request
- `localStorage` is shared across all tabs/windows from the same origin
- No additional configuration needed - browsers handle this automatically

**Implementation:**
- Tokens are stored in `localStorage` after login
- API client interceptor automatically adds `Authorization: Bearer <token>` header
- New tabs read from the same `localStorage`, so they're automatically authenticated
- Token refresh works across all tabs (when one tab refreshes, all tabs benefit)

### Related Documentation

- See `PLATFORM_STATUS.md` for overall platform status
- See component-specific documentation for detailed view implementations
