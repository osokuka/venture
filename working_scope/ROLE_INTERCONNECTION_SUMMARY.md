# User Role Interconnection Summary

## Documentation Standards

**IMPORTANT RULE**: Minimize the creation of new markdown (MD) documentation files unless explicitly requested. All project documentation, instructions, and updates should be consolidated into existing documentation files rather than creating new ones. This rule applies to all development work and documentation practices across the entire application.

---

## Quick Reference

### Role Mapping

| Backend (Django) | Frontend (React) | Database | API Response |
|------------------|------------------|----------|--------------|
| `'VENTURE'`      | `'venture'`      | `'VENTURE'` | `'VENTURE'` |
| `'INVESTOR'`     | `'investor'`     | `'INVESTOR'` | `'INVESTOR'` |
| `'MENTOR'`       | `'mentor'`       | `'MENTOR'` | `'MENTOR'` |
| `'ADMIN'`        | `'admin'`        | `'ADMIN'` | `'ADMIN'` |

### Conversion Logic

**Backend → Frontend:**
```typescript
const backendRole = userData.role.toUpperCase();
if (backendRole === 'VENTURE') frontendRole = 'venture';
else if (backendRole === 'INVESTOR') frontendRole = 'investor';
else if (backendRole === 'MENTOR') frontendRole = 'mentor';
else if (backendRole === 'ADMIN') frontendRole = 'admin';
```

**Frontend → Backend:**
```typescript
const backendRole = registrationRole?.toUpperCase() as 'VENTURE' | 'INVESTOR' | 'MENTOR';
```

---

## Demo Accounts

### All Demo Accounts Use Password: `demo123`

#### Ventures (4 accounts)
1. `sarah@techflow.ai` - TechFlow AI
2. `marcus@greenspace.co` - GreenSpace
3. `lisa@healthbridge.com` - HealthBridge
4. `david@fintech-solutions.io` - FinTech Solutions

#### Investors (3 accounts)
1. `sarah.chen@techventures.com` - TechVentures Capital
2. `marcus@greentech-ventures.com` - GreenTech Ventures
3. `lisa@innovation-angels.com` - Innovation Angels

#### Mentors (2 accounts)
1. `james@stripe.com` - James Wilson
2. `sarah@startupmentor.io` - Sarah Johnson

**Total: 9 demo accounts**

**Note:** Demo accounts are automatically created on first Docker startup via `seed_demo_data` management command.

---

## Superuser/Admin Account

**Credentials:**
- Email: `admin@venturelink.com`
- Password: `admin123`
- Role: `ADMIN` (backend) / `admin` (frontend)

**Access:**
- Full platform access
- Django Admin Panel: http://localhost:8001/admin
- Admin Dashboard in frontend
- Bypasses all approval checks

**Creation:**
- Automatically created on first Docker startup
- Configured via environment variables in `docker-compose.yml`

---

## Admin Dashboard

**Component:** `frontend/src/components/AdminDashboard.tsx`

**Features:**
- ✅ Overview tab with platform statistics
- ✅ User management tab (placeholder)
- ✅ Approval management tab (placeholder)
- ✅ Analytics tab (placeholder)
- ✅ Quick action buttons
- ✅ Link to Django Admin Panel
- ✅ Modern, responsive UI

**Access:** Automatically shown when user role is `'admin'`

---

## Role-Based Permissions

### Backend (`backend/shared/permissions.py`)

1. **`IsApprovedUser`**: 
   - Admin users always pass
   - Checks profile approval status for other roles

2. **`IsAdminOrReviewer`**: 
   - Only ADMIN role allowed

3. **`IsOwnerOrReadOnly`**: 
   - Read: All authenticated users
   - Write: Only object owner

---

## Files Modified/Created

### Backend
- ✅ `backend/apps/accounts/models.py` - Role definitions
- ✅ `backend/apps/accounts/serializers.py` - Role validation
- ✅ `backend/shared/permissions.py` - Permission classes
- ✅ `backend/apps/accounts/management/commands/seed_demo_data.py` - Comprehensive demo data seeding (users, products, profiles, conversations, messages)
- ✅ `backend/entrypoint.sh` - Auto-creates superuser and demo accounts

### Frontend
- ✅ `frontend/src/components/AuthContext.tsx` - Role mapping logic
- ✅ `frontend/src/components/AdminDashboard.tsx` - Admin dashboard component
- ✅ `frontend/src/App.tsx` - Admin dashboard routing
- ✅ `frontend/src/services/api.ts` - API types with ADMIN role

### Documentation
- ✅ `ROLE_ANALYSIS.md` - Detailed role interconnection analysis
- ✅ `DEMO_ACCOUNTS.md` - Demo accounts reference
- ✅ `ROLE_INTERCONNECTION_SUMMARY.md` - This file

---

## Testing

### Test Admin Login
1. Start Docker: `docker-compose up -d`
2. Wait for services to be ready
3. Navigate to: http://localhost:3000
4. Click "Sign In"
5. Login with:
   - Email: `admin@venturelink.com`
   - Password: `admin123`
6. Should see Admin Dashboard

### Test Demo Accounts
1. Demo accounts are created automatically
2. Use any demo account email with password `demo123`
3. See `DEMO_ACCOUNTS.md` for full list

---

## Next Steps

1. ✅ Admin dashboard created
2. ✅ Demo accounts auto-creation implemented
3. ⏳ Connect admin dashboard to real API endpoints
4. ⏳ Implement user management UI
5. ⏳ Implement approval workflow UI
6. ⏳ Add role-based permission checks to all endpoints
