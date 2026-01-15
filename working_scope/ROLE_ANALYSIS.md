# User Role Interconnection Analysis

## Documentation Standards

**IMPORTANT RULE**: Minimize the creation of new markdown (MD) documentation files unless explicitly requested. All project documentation, instructions, and updates should be consolidated into existing documentation files rather than creating new ones. This rule applies to all development work and documentation practices across the entire application.

---

## Overview
This document analyzes how user roles are interconnected between the frontend (React) and backend (Django) of the VentureUP Link platform.

---

## Backend Role Definitions

### Django User Model (`backend/apps/accounts/models.py`)

**Role Choices:**
```python
ROLE_CHOICES = [
    ('VENTURE', 'Venture'),
    ('INVESTOR', 'Investor'),
    ('MENTOR', 'Mentor'),
    ('ADMIN', 'Admin'),
]
```

**Key Points:**
- Roles are stored as uppercase strings in the database
- `ADMIN` role is automatically assigned to superusers
- Roles are validated in serializers (cannot register as ADMIN)
- All roles are stored in the `users` table with a `role` field

### Backend Role Usage

1. **Registration** (`UserRegistrationSerializer`):
   - Validates that users cannot register as `ADMIN`
   - Only allows: `VENTURE`, `INVESTOR`, `MENTOR`

2. **Superuser Creation** (`UserManager.create_superuser`):
   - Automatically sets `role='ADMIN'`
   - Sets `is_staff=True`, `is_superuser=True`
   - Sets `is_email_verified=True`

3. **API Responses**:
   - `/api/auth/me` returns user with role in uppercase: `'VENTURE' | 'INVESTOR' | 'MENTOR' | 'ADMIN'`
   - `/api/auth/register` accepts role in uppercase
   - `/api/auth/login` returns JWT tokens (role not in token, fetched from `/api/auth/me`)

---

## Frontend Role Definitions

### TypeScript Types (`frontend/src/components/AuthContext.tsx`)

**UserRole Type:**
```typescript
export type UserRole = 'venture' | 'investor' | 'mentor' | 'admin';
```

**Key Points:**
- Roles are stored as lowercase strings in frontend
- Frontend uses camelCase: `'venture'`, `'investor'`, `'mentor'`, `'admin'`
- Backend uses UPPERCASE: `'VENTURE'`, `'INVESTOR'`, `'MENTOR'`, `'ADMIN'`

### Frontend Role Mapping

**Mapping Logic** (in `AuthContext.tsx`):
```typescript
// Backend → Frontend
const backendRole = userData.role.toUpperCase();
let frontendRole: UserRole;

if (backendRole === 'VENTURE') {
  frontendRole = 'venture';
} else if (backendRole === 'INVESTOR') {
  frontendRole = 'investor';
} else if (backendRole === 'MENTOR') {
  frontendRole = 'mentor';
} else if (backendRole === 'ADMIN') {
  frontendRole = 'admin';
} else {
  frontendRole = 'venture'; // Fallback
}
```

**Registration Mapping** (Frontend → Backend):
```typescript
// Frontend → Backend
const backendRole = registrationRole?.toUpperCase() as 'VENTURE' | 'INVESTOR' | 'MENTOR';
```

---

## Role Interconnection Flow

### 1. Registration Flow

```
Frontend (lowercase) → Backend (UPPERCASE) → Database (UPPERCASE)
'venture'           → 'VENTURE'            → 'VENTURE'
'investor'          → 'INVESTOR'            → 'INVESTOR'
'mentor'            → 'MENTOR'              → 'MENTOR'
```

### 2. Login Flow

```
Database (UPPERCASE) → API Response (UPPERCASE) → Frontend (lowercase)
'VENTURE'            → 'VENTURE'                → 'venture'
'INVESTOR'           → 'INVESTOR'                → 'investor'
'MENTOR'             → 'MENTOR'                  → 'mentor'
'ADMIN'              → 'ADMIN'                    → 'admin'
```

### 3. Dashboard Routing

```
Frontend Role → Component
'venture'    → VentureDashboard
'investor'   → InvestorDashboard
'mentor'     → MentorDashboard
'admin'      → AdminDashboard
```

---

## Demo Accounts Setup

### Mock Data (`frontend/src/components/MockData.ts`)

**Demo Ventures:**
1. **TechFlow AI**
   - Email: `sarah@techflow.ai`
   - Password: `demo123` (hardcoded in LoginForm)
   - Status: Approved

2. **GreenSpace**
   - Email: `marcus@greenspace.co`
   - Password: `demo123`
   - Status: Approved

3. **HealthBridge**
   - Email: `lisa@healthbridge.com`
   - Password: `demo123`
   - Status: Approved

4. **FinTech Solutions**
   - Email: `david@fintech-solutions.io`
   - Password: `demo123`
   - Status: Approved

**Demo Investors:**
1. **Alex Thompson** - `alex@venturecapital.com`
2. **Maria Garcia** - `maria@angelinvestors.net`

**Demo Mentors:**
1. **Dr. James Wilson** - `james@mentorship.com`
2. **Sarah Johnson** - `sarah@startupmentor.io`

**Note:** These are **frontend mock accounts only**. They do not exist in the backend database. The `handleDemoLogin` function in `LoginForm.tsx` attempts to log in with password `demo123`, but these accounts need to be created in the backend first.

---

## Superuser/Admin Setup

### Current Superuser

**Credentials:**
- Email: `admin@venturelink.com`
- Password: `admin123`
- Role: `ADMIN`
- Created: Automatically on first Docker container startup

**Creation Process:**
1. Defined in `backend/entrypoint.sh`
2. Uses environment variables:
   - `DJANGO_SUPERUSER_EMAIL` (default: `admin@venturelink.com`)
   - `DJANGO_SUPERUSER_PASSWORD` (default: `admin123`)
3. Created via Django shell script in entrypoint

### Admin Dashboard

**Location:** `frontend/src/components/AdminDashboard.tsx`

**Features:**
- Overview tab with platform statistics
- User management tab
- Approval management tab
- Analytics tab
- Quick actions for common tasks
- Link to Django Admin Panel

**Access:**
- Available when user role is `'admin'` (mapped from backend `'ADMIN'`)
- Rendered in `App.tsx` via `DashboardContent` switch statement

---

## Role-Based Access Control (RBAC)

### Backend Permissions

**Location:** `backend/shared/permissions.py`

**Permission Classes:**

1. **`IsApprovedUser`**:
   - Checks if user's profile is approved
   - **Admin users always have permission** (`if request.user.role == 'ADMIN': return True`)
   - Role-specific profile checks for VENTURE, INVESTOR, MENTOR

2. **`IsAdminOrReviewer`**:
   - Only allows ADMIN role users
   - Used for admin-only endpoints

3. **`IsOwnerOrReadOnly`**:
   - Object-level permission
   - Allows read for all, write only for owner

**Current Implementation:**
- All API endpoints require authentication (`IsAuthenticated`)
- Permission classes exist but may not be used in all views yet
- Admin role validation in registration serializer (prevents ADMIN registration)
- Admin users bypass approval checks in `IsApprovedUser`

**Future Implementation Needed:**
- Apply permission classes to all relevant endpoints
- Admin-only endpoints for user management
- Role-specific profile access enforcement

### Frontend Permissions

**Current Implementation:**
- Role-based dashboard routing
- Role-based registration forms
- No permission checks for API calls (all authenticated users can access)

**Future Implementation Needed:**
- Role-based UI element visibility
- Permission checks before API calls
- Admin-only features

---

## Issues and Recommendations

### Current Issues

1. **Demo Accounts Not in Backend:**
   - Mock accounts exist only in frontend
   - Need to create actual demo accounts in backend database

2. **Role Mapping Inconsistency:**
   - Multiple places where role mapping occurs
   - Should be centralized in a utility function

3. **No Role-Based Permissions:**
   - Backend doesn't enforce role-based access
   - Frontend doesn't check permissions before API calls

### Recommendations

1. **Create Demo Accounts Script:**
   - Add a management command to create demo accounts
   - Include in entrypoint.sh for first-time setup

2. **Centralize Role Mapping:**
   - Create `utils/roleMapper.ts` in frontend
   - Create `shared/role_utils.py` in backend

3. **Implement RBAC:**
   - Add permission classes in Django
   - Add permission checks in frontend API service

4. **Admin Dashboard Enhancement:**
   - Connect to real API endpoints
   - Add user management features
   - Add approval workflow UI

---

## Summary

| Aspect | Backend | Frontend | Mapping |
|--------|---------|----------|---------|
| **Storage** | UPPERCASE | lowercase | Case conversion |
| **Values** | `'VENTURE'`, `'INVESTOR'`, `'MENTOR'`, `'ADMIN'` | `'venture'`, `'investor'`, `'mentor'`, `'admin'` | `.toUpperCase()` / `.toLowerCase()` |
| **Registration** | Uppercase required | Lowercase input | Converted on submit |
| **API Response** | Uppercase | Converted to lowercase | In `AuthContext` |
| **Dashboard** | N/A | Role-based routing | Switch statement |

**Superuser:**
- Backend: `role='ADMIN'`, `is_staff=True`, `is_superuser=True`
- Frontend: `role='admin'` → `AdminDashboard` component
- Access: Full platform access + Django Admin Panel

---

## Demo Accounts Setup

### Automatic Creation

Demo accounts are automatically created when Docker containers start for the first time via:
- Management command: `seed_demo_data`
- Called in `backend/entrypoint.sh` after superuser creation

### Demo Account List

See `DEMO_ACCOUNTS.md` for complete list of demo accounts.

**All demo accounts use password: `demo123`**

### Manual Creation

To manually create demo accounts:
```bash
docker-compose exec web python manage.py seed_demo_data
```

---

## Admin Dashboard Features

### Current Implementation

**Component:** `frontend/src/components/AdminDashboard.tsx`

**Tabs:**
1. **Overview** - Platform statistics and quick actions
2. **Users** - User management (placeholder, links to Django Admin)
3. **Approvals** - Approval workflow management (placeholder)
4. **Analytics** - Platform metrics and insights (placeholder)

**Features:**
- Platform statistics (total users, pending approvals, etc.)
- Role distribution (Ventures, Investors, Mentors)
- Quick action buttons
- Link to Django Admin Panel
- Responsive design with modern UI

### Future Enhancements Needed

1. Connect to real API endpoints
2. Implement user management UI
3. Implement approval workflow UI
4. Add real-time analytics charts
5. Add user search and filtering
6. Add bulk operations
