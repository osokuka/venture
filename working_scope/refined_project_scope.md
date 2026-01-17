# VentureUP Link Platform - Refined Project Scope

## Documentation Standards

**IMPORTANT RULE**: Minimize the creation of new markdown (MD) documentation files unless explicitly requested. All project documentation, instructions, and updates should be consolidated into existing documentation files rather than creating new ones. This rule applies to all development work and documentation practices across the entire application.

---

## Executive Summary

This document refines the working scope for building a Django REST API backend that powers the existing React frontend application. The frontend is already built with React + Vite + Radix UI components and includes UI for registration flows, dashboards, messaging, and content pages. This scope focuses on building the backend API that will replace the current mock data implementation.

---

## 1. Project Overview

### Current State
- **Frontend**: React + Vite application with complete UI components
  - Registration flows for Ventures, Investors, Mentors
  - Role-based dashboards
  - Messaging system UI
  - Public content pages (Hero, Features, Services, About, Success Stories, FAQ, Contact)
  - Mock data currently used for development
- **Backend**: Not yet implemented (needs to be built)

### Target State
- **Backend**: Django REST Framework API with JWT authentication
- **Integration**: Frontend connects to backend APIs, replacing mock data
- **Deployment**: Dockerized development and production environments

---

## 2. Frontend-Backend Integration Points

### API Base Configuration
- **Base URL**: `http://localhost:8000/api` (dev) / `https://api.ventureuplink.com/api` (prod)
- **Authentication**: JWT tokens in `Authorization: Bearer <token>` header
- **Content-Type**: `application/json` for all requests
- **CORS**: Configured to allow frontend origin

### Frontend Components Requiring Backend Integration

1. **AuthContext** (`src/components/AuthContext.tsx`)
   - Register, Login, Logout
   - Token management
   - User state management

2. **Registration Forms**
   - **User Registration**: Simple email/password registration (all roles)
   - **Email Verification**: Required before accessing dashboard
   - **Product Creation** (Ventures only): After email verification, users can create products
   - `VentureRegistration.tsx` - **UPDATED**: Now only creates user account, product creation moved to dashboard
   - `InvestorRegistration.tsx` - Multi-step form (unchanged)
   - `MentorRegistration.tsx` - Multi-step form (unchanged)

3. **Dashboards**
   - `VentureDashboard.tsx` - **UPDATED**: 
     - Product management (create up to 3 products)
     - Product activation/deactivation
     - Browse investors/mentors, view matches, messaging
     - Product-specific views and actions
   - `InvestorDashboard.tsx` - Browse ventures (products), view matches, messaging
   - `MentorDashboard.tsx` - Browse ventures (products), view matches, messaging

4. **Messaging System** (`MessagingSystem.tsx`)
   - Conversation list
   - Message threads
   - Send messages

5. **Content Sections**
   - `FAQSection.tsx` - FAQ items
   - `SuccessStoriesSection.tsx` - Success stories
   - `ContactSection.tsx` - Contact information

---

## 3. Refined Architecture Decisions

### Backend Stack
- **Framework**: Django 5.0+ with Django REST Framework 3.14+
- **Database**: PostgreSQL 15+
- **Authentication**: JWT using `djangorestframework-simplejwt`
- **Task Queue**: Celery 5.3+ with Redis 7+
- **File Storage**: Local filesystem (dev) / S3-compatible storage (prod)
- **API Documentation**: DRF browsable API + OpenAPI/Swagger (optional)

### Core Django Apps Structure
```
backend/
├── config/              # Django project settings
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   └── wsgi.py
├── apps/
│   ├── accounts/        # User management, auth, email verification
│   ├── ventures/        # Venture profiles, founders, teams, documents
│   ├── investors/       # Investor profiles, preferences
│   ├── mentors/         # Mentor profiles, expertise, pricing
│   ├── approvals/       # Review workflow, status management
│   ├── matching/        # Matching algorithm and match storage
│   ├── messaging/       # Conversations and messages
│   └── content/         # FAQ, success stories, resources, contacts
└── shared/              # Shared utilities, permissions, mixins
    ├── permissions.py
    ├── mixins.py
    └── utils.py
```

### Docker Services (Development)
- `db` - PostgreSQL 15
- `web` - Django development server (port 8000)
- `redis` - Redis 7 (for Celery)
- `celery` - Celery worker
- `celery-beat` - Celery scheduler

### Docker Services (Production)
- `db` - PostgreSQL 15 (or managed service)
- `web` - Gunicorn + Django (port 8000)
- `nginx` - Reverse proxy, static/media serving (port 80/443) /only for production, not needed in development
- `redis` - Redis 7
- `celery` - Celery worker
- `celery-beat` - Celery scheduler

---

## 4. Enhanced Data Model (Refined)

### Accounts App

**User Model**
```python
- id (UUID, primary key)
- email (unique, indexed)
- password (hashed)
- full_name
- role (choices: VENTURE, INVESTOR, MENTOR, ADMIN)
- is_email_verified (default: False)
- is_active (default: True)
- date_joined
- last_login
- created_at, updated_at
```

**EmailVerificationToken Model**
```python
- id (UUID)
- user (FK to User)
- token (unique, indexed)
- expires_at
- used_at (nullable)
- created_at
```

### Ventures App

**IMPORTANT: Multi-Product Architecture**
- User registration is **decoupled** from product registration
- Users register once via email confirmation (role: VENTURE)
- After email verification, users can create **up to 3 venture products**
- Each product requires separate admin approval
- Users can **activate/deactivate** their products (but cannot delete)
- Only **admin can delete** products
- Products are independent entities with full CRUD operations

**VentureProduct Model** (renamed from VentureProfile)
```python
- id (UUID)
- user (ForeignKey to User)  # Changed from OneToOne - users can have multiple products
- name (company/product name)
- industry_sector (CharField with choices or FK)
- website (URLField, required)
- linkedin_url (URLField, required)
- address (TextField, optional)
- year_founded (IntegerField, optional)
- employees_count (IntegerField, optional)
- short_description (TextField)
# Note: Business information fields (problem_statement, solution_description, 
# target_market, traction_metrics, funding_amount, funding_stage, use_of_funds) 
# are now associated with each pitch deck document, not the product itself
- status (choices: DRAFT, SUBMITTED, APPROVED, REJECTED, SUSPENDED)
- is_active (BooleanField, default=True)  # User can toggle this
- submitted_at (DateTimeField, nullable)
- approved_at (DateTimeField, nullable)
- created_at, updated_at
```

**Important**: The venture profile now contains only **company information** and **team member information**. All business information (target market, problem statement, solution, traction, funding details) is associated with each pitch deck document separately.

**Business Rules:**
- Maximum 3 products per user (enforced at API level)
- User can only activate/deactivate products (cannot delete)
- Admin can delete products
- Each product requires separate approval workflow
- Products can be in different states (one approved, one draft, etc.)

**Founder Model**
```python
- id (UUID)
- product (FK to VentureProduct)  # Updated reference
- full_name
- linkedin_url (URLField)
- email (EmailField)
- phone (CharField, optional)
- role_title (CharField, optional)
- created_at, updated_at
```

**TeamMember Model**
```python
- id (UUID)
- product (FK to VentureProduct)  # Updated reference
- name
- role_title
- description (TextField, optional)
- linkedin_url (URLField, optional)
- created_at, updated_at
```

**VentureNeed Model**
```python
- id (UUID)
- product (FK to VentureProduct)  # Updated reference
- need_type (choices: FINANCE, MARKET_ACCESS, EXPERT, OTHER)
- finance_size_range (CharField, nullable)
- finance_objectives (TextField, nullable)
- target_markets (ArrayField or JSONField, nullable)
- expertise_field (CharField, nullable)
- duration (CharField, nullable)
- other_notes (TextField, nullable)
- created_at, updated_at
```

**VentureDocument Model**
```python
- id (UUID)
- product (FK to VentureProduct)  # Updated reference
- document_type (choices: PITCH_DECK, OTHER)
- file (FileField)
- file_size (IntegerField)
- mime_type (CharField)
# Pitch deck metadata (only used when document_type = 'PITCH_DECK')
- problem_statement (TextField, optional)  # What problem does your product solve?
- solution_description (TextField, optional)  # How does your product solve this problem?
- target_market (TextField, optional)  # Describe your target market
- traction_metrics (JSONField, optional)  # Current traction, metrics, and achievements
- funding_amount (CharField, optional)  # Funding amount (e.g., $2M)
- funding_stage (CharField with choices, optional)  # PRE_SEED, SEED, SERIES_A, etc.
- use_of_funds (TextField, optional)  # How will the funds be used?
- uploaded_at
- created_at
- updated_at
```

**Important**: Each pitch deck document can have its own business information. This allows ventures to create different pitch decks for different funding rounds or purposes, each with its own problem statement, solution, target market, traction metrics, and funding details.

### Investors App

**InvestorProfile Model**
```python
- id (UUID)
- user (OneToOne to User)
- full_name
- organization_name
- linkedin_or_website (URLField)
- email (EmailField)
- phone (CharField, optional)
- investment_experience_years (IntegerField)
- deals_count (IntegerField, optional)
- stage_preferences (ArrayField or JSONField) # e.g., ["SEED", "SERIES_A"]
- industry_preferences (ArrayField or JSONField)
- average_ticket_size (CharField with choices)
- visible_to_ventures (BooleanField, default: False)
- status (choices: DRAFT, SUBMITTED, APPROVED, REJECTED, SUSPENDED)
- submitted_at (DateTimeField, nullable)
- approved_at (DateTimeField, nullable)
- created_at, updated_at
```

### Mentors App

**MentorProfile Model**
```python
- id (UUID)
- user (OneToOne to User)
- full_name
- job_title
- company
- linkedin_or_website (URLField)
- contact_email (EmailField)
- phone (CharField, optional)
- expertise_fields (ArrayField or JSONField)
- experience_overview (TextField)
- industries_of_interest (ArrayField or JSONField)
- engagement_type (choices: PAID, PRO_BONO, BOTH)
- paid_rate_type (choices: HOURLY, DAILY, MONTHLY, nullable)
- paid_rate_amount (DecimalField, nullable)
- availability_types (ArrayField) # ["ONE_TIME", "ONGOING", "BOARD_ADVISORY"]
- preferred_engagement (choices: VIRTUAL, IN_PERSON, BOTH)
- visible_to_ventures (BooleanField, default: False)
- status (choices: DRAFT, SUBMITTED, APPROVED, REJECTED, SUSPENDED)
- submitted_at (DateTimeField, nullable)
- approved_at (DateTimeField, nullable)
- created_at, updated_at
```

### Approvals App

**ReviewRequest Model**
```python
- id (UUID)
- content_type (ContentType FK)
- object_id (UUID)
- content_object (GenericForeignKey)
- submitted_by (FK to User)
- status (choices: SUBMITTED, APPROVED, REJECTED)
- reviewer (FK to User, nullable)
- reviewed_at (DateTimeField, nullable)
- rejection_reason (TextField, nullable)
- internal_notes (TextField, nullable)
- created_at, updated_at
```

### Matching App

**Match Model**
```python
- id (UUID)
- venture (FK to VentureProfile)
- target_type (choices: INVESTOR, MENTOR)
- target_object_id (UUID)
- score (IntegerField, 0-100)
- reasons (JSONField) # List of match reasons
- created_at
- refreshed_at
```

### Messaging App

**Conversation Model**
```python
- id (UUID)
- participants (ManyToMany to User, limit 2 initially)
- created_at
- last_message_at (DateTimeField, nullable)
```

**Message Model**
```python
- id (UUID)
- conversation (FK to Conversation)
- sender (FK to User)
- body (TextField)
- created_at
- read_at (DateTimeField, nullable)
```

### Content App

**FAQItem Model**
```python
- id (UUID)
- question (CharField)
- answer (TextField)
- order (IntegerField, default: 0)
- published (BooleanField, default: True)
- created_at, updated_at
```

**SuccessStory Model**
```python
- id (UUID)
- title (CharField)
- summary (TextField)
- venture (FK to VentureProfile, nullable)
- logo_image (ImageField, optional)
- published (BooleanField, default: True)
- created_at, updated_at
```

**Resource Model**
```python
- id (UUID)
- category (choices: MARKET_REPORTS, LEGAL, TEMPLATES, OTHER)
- title (CharField)
- description (TextField)
- file (FileField, nullable)
- url (URLField, nullable)
- published (BooleanField, default: True)
- created_at, updated_at
```

**ContactInfo Model**
```python
- id (UUID)
- email (EmailField)
- phone (CharField, optional)
- address (TextField, optional)
- linkedin_url (URLField, optional)
- twitter_url (URLField, optional)
- created_at, updated_at
```

---

## 5. API Endpoints Specification (Refined)

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user (role: venture/investor/mentor) | No |
| POST | `/api/auth/login` | Login and receive JWT tokens | No |
| POST | `/api/auth/refresh` | Refresh access token | No |
| POST | `/api/auth/verify-email` | Verify email with token | No |
| POST | `/api/auth/resend-verification` | Resend verification email | No |
| POST | `/api/auth/password-reset-request` | Request password reset | No |
| POST | `/api/auth/password-reset-confirm` | Confirm password reset | No |
| GET | `/api/auth/me` | Get current user profile | Yes |

### Venture Product Endpoints

**IMPORTANT**: Products are separate from user accounts. Users can have multiple products.

| Method | Endpoint | Description | Auth Required | Business Rules |
|--------|----------|-------------|---------------|----------------|
| POST | `/api/ventures/products` | Create new product (max 3 per user) | Yes (VENTURE, verified) | Enforce 3-product limit |
| GET | `/api/ventures/products` | List user's products | Yes (VENTURE) | Returns all user's products |
| GET | `/api/ventures/products/{id}` | Get product details | Yes (VENTURE owner or APPROVED) | Owner sees all, others see approved only |
| PATCH | `/api/ventures/products/{id}` | Update product (draft only) | Yes (VENTURE owner) | Cannot update if SUBMITTED/APPROVED |
| PATCH | `/api/ventures/products/{id}/activate` | Activate/deactivate product | Yes (VENTURE owner) | User can toggle is_active |
| POST | `/api/ventures/products/{id}/submit` | Submit product for approval | Yes (VENTURE owner) | Creates ReviewRequest |
| DELETE | `/api/ventures/products/{id}` | Delete product | Yes (ADMIN only) | Users cannot delete |
| POST | `/api/ventures/products/{id}/documents/pitch-deck` | Upload pitch deck | Yes (VENTURE owner) | Per product |
| DELETE | `/api/ventures/products/{id}/documents/{doc_id}` | Delete document | Yes (VENTURE owner) | Per product |
| GET | `/api/ventures/public` | List approved active products | Yes (APPROVED) | Only approved + active products |
| GET | `/api/ventures/{id}` | Get product detail (public) | Yes (APPROVED) | Only approved + active products |

### Investor Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/investors/profile` | Create/update investor profile (draft) | Yes (INVESTOR) |
| GET | `/api/investors/profile/me` | Get own investor profile | Yes (INVESTOR) |
| PATCH | `/api/investors/profile/me` | Update own profile (including visibility toggle) | Yes (INVESTOR) |
| POST | `/api/investors/profile/submit` | Submit profile for approval | Yes (INVESTOR) |
| GET | `/api/investors/public` | List visible investors (for approved ventures/admin) | Yes (APPROVED) |
| GET | `/api/investors/{id}` | Get investor detail | Yes (APPROVED) |

### Mentor Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/mentors/profile` | Create/update mentor profile (draft) | Yes (MENTOR) |
| GET | `/api/mentors/profile/me` | Get own mentor profile | Yes (MENTOR) |
| PATCH | `/api/mentors/profile/me` | Update own profile (including visibility toggle) | Yes (MENTOR) |
| POST | `/api/mentors/profile/submit` | Submit profile for approval | Yes (MENTOR) |
| GET | `/api/mentors/public` | List visible mentors (for approved ventures/admin) | Yes (APPROVED) |
| GET | `/api/mentors/{id}` | Get mentor detail | Yes (APPROVED) |

### Approval Endpoints (Admin/Reviewer Only)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/reviews/pending` | List pending reviews (filter: ?type=venture\|investor\|mentor) | Yes (ADMIN/REVIEWER) |
| GET | `/api/reviews/{id}` | Get review details | Yes (ADMIN/REVIEWER) |
| POST | `/api/reviews/{id}/approve` | Approve a submission | Yes (ADMIN/REVIEWER) |
| POST | `/api/reviews/{id}/reject` | Reject a submission | Yes (ADMIN/REVIEWER) |

### Matching Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/matches/me` | Get matches for current user | Yes (APPROVED) |
| GET | `/api/matches/me?type=investor\|mentor` | Get matches filtered by type | Yes (APPROVED) |
| POST | `/api/matches/refresh` | Trigger match refresh (admin only) | Yes (ADMIN) |

### Messaging Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/messages/conversations` | List user's conversations | Yes (APPROVED) |
| POST | `/api/messages/conversations` | Create new conversation | Yes (APPROVED) |
| GET | `/api/messages/conversations/{id}` | Get conversation with messages | Yes (APPROVED) |
| POST | `/api/messages/conversations/{id}/messages` | Send message in conversation | Yes (APPROVED) |
| POST | `/api/messages/conversations/{id}/read` | Mark conversation as read | Yes (APPROVED) |
| GET | `/api/messages/conversations/unread-count` | Get unread message count | Yes (APPROVED) |

### Content Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/content/faq` | List published FAQ items | No |
| GET | `/api/content/success-stories` | List published success stories | No |
| GET | `/api/content/resources` | List published resources (filter: ?category=...) | No |
| GET | `/api/content/contacts` | Get contact information | No |

---

## 6. Permission & Visibility Rules (Enforced Server-Side)

### Public Access
- Content endpoints (FAQ, success stories, resources, contacts)
- Registration and login endpoints

### Unauthenticated Users
- Cannot access any protected endpoints
- Cannot browse profiles
- Cannot send messages

### Authenticated but Not Approved Users
- Can view/edit their own profile (DRAFT or SUBMITTED status)
- Cannot browse other profiles
- Cannot send/receive messages
- Cannot see matches

### Approved Investors
- Can browse approved ventures (all approved ventures)
- Can see matches with ventures
- Can message approved ventures
- Cannot see other investors unless `visible_to_ventures = true` (for admin only)
- Cannot see mentors unless `visible_to_ventures = true` and mentor is approved

### Approved Mentors
- Can browse approved ventures (all approved ventures)
- Can see matches with ventures
- Can message approved ventures
- Cannot see other mentors unless `visible_to_ventures = true` (for admin only)
- Cannot see investors unless `visible_to_ventures = true` and investor is approved

### Approved Ventures
- Can browse investors where `visible_to_ventures = true` and investor is approved
- Can browse mentors where `visible_to_ventures = true` and mentor is approved
- Can see matches with visible investors/mentors
- Can message visible approved investors/mentors
- Cannot see other ventures

### Admin/Reviewer
- Full access to all endpoints
- Can approve/reject submissions
- Can view all profiles regardless of visibility settings
- Can trigger match refresh

---

## 7. Frontend Integration Requirements

### API Client Setup
- Axios or fetch wrapper with interceptors
- Automatic token refresh on 401
- Request/response logging in development
- Error handling and user-friendly error messages

### State Management
- Replace `MockData.ts` with API calls
- Update `AuthContext` to use real authentication
- Implement loading states for all async operations
- Handle offline/error states gracefully

### Form Handling
- Multi-step registration forms should save drafts
- File upload progress indicators for pitch deck
- Validation error display from API responses
- Success/error notifications using existing UI components

### Real-time Features (Future)
- WebSocket support for messaging (optional for MVP)
- Polling fallback for message updates

---

## 8. Security Requirements

### Authentication & Authorization

#### Role System Architecture

**Backend Role Definitions** (Django User Model):
- **Role Choices**: `'VENTURE'`, `'INVESTOR'`, `'MENTOR'`, `'ADMIN'`
- **Storage**: Roles stored as uppercase strings in database
- **Admin Role**: Automatically assigned to superusers (`is_staff=True`, `is_superuser=True`)
- **Registration**: Users cannot register as `ADMIN` (only `VENTURE`, `INVESTOR`, `MENTOR` allowed)
- **API Responses**: `/api/auth/me` returns role in uppercase format

**Frontend Role Definitions** (TypeScript):
- **UserRole Type**: `'venture' | 'investor' | 'mentor' | 'admin'`
- **Storage**: Roles stored as lowercase strings in frontend
- **Mapping**: Backend uppercase → Frontend lowercase conversion in `AuthContext.tsx`

**Role Mapping Flow**:
- **Registration**: Frontend (lowercase) → Backend (UPPERCASE) → Database (UPPERCASE)
- **Login**: Database (UPPERCASE) → API Response (UPPERCASE) → Frontend (lowercase)
- **Dashboard Routing**: Frontend role determines which dashboard component to render

**Role-Based Access Control (RBAC)**:
- **Backend Permissions** (`backend/shared/permissions.py`):
  - `IsApprovedUser`: Checks profile approval status (admin users always pass)
  - `IsAdminOrReviewer`: Only ADMIN role allowed
  - `IsOwnerOrReadOnly`: Read for all authenticated users, write only for owner
- **Frontend Permissions**: Role-based dashboard routing, role-based registration forms

**Superuser/Admin Account**:
- **Credentials**: `admin@venturelink.com` / `admin123`
- **Role**: `ADMIN` (backend) / `admin` (frontend)
- **Access**: Full platform access + Django Admin Panel
- **Creation**: Automatically created on first Docker startup via `entrypoint.sh`

**Demo Accounts**:
- All demo accounts use password: `demo123`
- Automatically created via `seed_demo_data` management command
- See `DEMO_ACCOUNTS.md` for complete list
- **Total**: 9 demo accounts (4 Ventures, 3 Investors, 2 Mentors)

#### Authentication & Authorization Details
- JWT tokens with 15-minute access token, 7-day refresh token
- Password hashing using Django's PBKDF2
- Rate limiting on auth endpoints (5 requests/minute)
- CORS configured for frontend origin only

### Data Protection
- All user data encrypted at rest (database)
- HTTPS only in production
- File upload validation (MIME type, extension, size)
- SQL injection prevention (Django ORM)
- XSS prevention (DRF JSON responses)

### API Security
- Permission classes on all views
- Object-level permissions for profile access
- IDOR prevention (never expose profiles user can't see)
- Input validation and sanitization
- File upload size limits (10MB for pitch decks)

---

## 9. Performance Requirements

### Database
- Indexes on: email, status, visible_to_ventures, role
- Pagination on all list endpoints (default: 20 per page)
- Select_related/prefetch_related for related objects
- Database connection pooling

### Caching
- Redis cache for frequently accessed data
- Match results cached for 24 hours
- Content pages cached for 1 hour

### Async Tasks
- Email sending via Celery
- Match computation via Celery (nightly refresh)
- Notification sending via Celery

---

## 10. Testing Requirements

### Backend Tests
- Unit tests for models, serializers, views
- Integration tests for API endpoints
- Permission tests for visibility rules
- File upload tests

### Test Coverage Target
- Minimum 80% code coverage
- Critical paths: 100% coverage (auth, permissions, matching)

---

## 11. Documentation Requirements

### API Documentation
- DRF browsable API (automatic)
- OpenAPI/Swagger schema (optional but recommended)
- README with setup instructions
- Environment variable documentation

### Code Documentation
- Docstrings for all models, views, serializers
- Inline comments for complex logic
- Architecture decision records (ADRs) for major decisions

---

## 12. Deployment Checklist

### Development Environment
- [ ] Docker Compose file with all services
- [ ] `.env.example` with all required variables
- [ ] Database migrations run automatically
- [ ] Seed data script for development
- [ ] One-command startup (`docker-compose up`)

### Production Environment
- [ ] Production Docker Compose file
- [ ] Nginx configuration
- [ ] Gunicorn configuration
- [ ] Environment variable management
- [ ] Static file collection
- [ ] Database backup strategy
- [ ] Logging configuration
- [ ] Monitoring setup (optional)

---

## 13. Success Metrics

### Functional
- All registration flows complete end-to-end
- Approval workflow processes submissions within 24-72 hours
- Messaging works between approved users
- Matching algorithm produces relevant matches
- All visibility rules enforced correctly

### Technical
- API response time < 200ms (p95)
- 99.9% uptime
- Zero security vulnerabilities
- All tests passing
- Code coverage > 80%

---

## 14. Future Enhancements (Out of Scope for MVP)

- WebSocket real-time messaging
- Advanced matching algorithm with ML
- Email notifications for matches
- Analytics dashboard for admin
- Social login (Google, LinkedIn)
- Mobile app API support
- Advanced search and filtering
- Export functionality (PDF reports)
- Two-factor authentication
- Message attachments
- Video call integration
- Calendar integration for scheduling

---

## 15. Dependencies & Versions

### Backend Dependencies
```
Django==5.0.0
djangorestframework==3.14.0
djangorestframework-simplejwt==5.3.0
psycopg2-binary==2.9.9
celery==5.3.4
redis==5.0.1
Pillow==10.2.0
python-dotenv==1.0.0
django-cors-headers==4.3.1
```

### Development Dependencies
```
pytest==7.4.3
pytest-django==4.7.0
pytest-cov==4.1.0
black==23.12.1
flake8==6.1.0
mypy==1.7.1
```

---

## 16. Project Timeline Estimate

- **Milestone 1**: Project Foundation (Week 1-2)
- **Milestone 2**: Profiles + Submissions (Week 3-4)
- **Milestone 3**: Document Upload + Approval (Week 5)
- **Milestone 4**: Browsing + Visibility (Week 6)
- **Milestone 5**: Messaging (Week 7)
- **Milestone 6**: Matching Engine (Week 8)
- **Milestone 7**: Content Module (Week 9)
- **Milestone 8**: Production Hardening (Week 10)

**Total Estimated Time**: 10 weeks for MVP

---

## 17. Acceptance Criteria

### Must Have (MVP)
- ✅ User registration and email verification
- ✅ Profile creation and submission for all 3 roles
- ✅ Admin approval workflow
- ✅ Visibility-based browsing
- ✅ Secure messaging between approved users
- ✅ Basic matching algorithm
- ✅ Content management (FAQ, success stories, resources)
- ✅ Dockerized development environment
- ✅ Production-ready deployment

### Nice to Have (Post-MVP)
- Advanced matching with ML
- Real-time messaging
- Email notifications
- Analytics dashboard
- Social login

---

This refined scope document serves as the single source of truth for the backend development effort and ensures alignment between frontend expectations and backend implementation.
