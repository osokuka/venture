Below is a working, buildable scope for a Django backend (API-first) that matches your React/Figma frontend, including approval flows, visibility rules, matching, and in-platform messaging, plus a Dockerized setup for dev and production.

## Documentation Standards

**IMPORTANT RULE**: Minimize the creation of new markdown (MD) documentation files unless explicitly requested. All project documentation, instructions, and updates should be consolidated into existing documentation files rather than creating new ones. This rule applies to all development work and documentation practices across the entire application.

---

## 1. Goal and constraints

### Goal

Build a Django backend that powers:

* Public marketing pages (Home, Ventures, Investors, Mentors, Resources, FAQ, Contacts)
* Registration flows for 3 user types (Venture, Investor, Mentor/Consultant)
* Admin review and approval within 24–72 hours
* Role-based access with visibility controls:

  * Investors and mentors can browse ventures after approval
  * Ventures cannot browse investors/mentors unless investor/mentor sets “visible to ventures”
* Matching engine between ventures, investors, mentors
* Secure in-platform messaging between approved users

### Key constraints (implied by your spec)

* Website + LinkedIn are mandatory for ventures
* Pitch deck upload (PDF, max 10MB)
* Verification required (email confirmation)
* “Browse” access only after approval

---

## 2. Architecture decisions

### Backend style

* Django + Django REST Framework (DRF) as JSON API for React.
* Token auth: JWT (recommended) or session auth if same domain. Scope assumes JWT.

### Core apps (Django “apps”)

1. `accounts` (users, roles, auth, email verify)
2. `ventures` (venture profiles, founder/team, metrics, needs, documents)
3. `investors` (investor profiles, preferences, visibility)
4. `mentors` (mentor profiles, expertise, availability, visibility, pricing)
5. `approvals` (review workflow, statuses, audit trail)
6. `matching` (precomputed matches + filters)
7. `messaging` (threads, messages, attachments optional)
8. `content` (FAQ, success stories, resources/insights, contacts)
9. `adminpanel` (custom admin actions or extend Django admin)

### Services (Docker)

* `web` (Django + Gunicorn in prod)
* `db` (PostgreSQL)
* `redis` (optional but recommended for async tasks)
* `celery` + `celery-beat` (email, approvals notifications, matching refresh)
* `nginx` (prod reverse proxy + static/media)

---

## 3. Roles, permissions, and approval workflow

### Roles

* `VENTURE`
* `INVESTOR`
* `MENTOR`
* `ADMIN` / `REVIEWER` (platform team)

### Statuses (for Venture/Investor/Mentor profiles)

* `DRAFT` (optional: if you support saving partial registration)
* `SUBMITTED`
* `APPROVED`
* `REJECTED`
* `SUSPENDED` (admin action)

### Access rules (must enforce server-side)

* Public: content pages only
* Logged in but not approved:

  * Can view/edit their own profile submission
  * Cannot browse others
  * Cannot message others
* Approved investor:

  * Can browse ventures (approved ventures only)
  * Ventures cannot see investor unless `visible_to_ventures = true`
* Approved mentor:

  * Can browse ventures (approved ventures only)
  * Ventures cannot see mentor unless `visible_to_ventures = true`
* Approved venture:

  * Can browse only:

    * Investors where `visible_to_ventures = true` and investor is approved
    * Mentors where `visible_to_ventures = true` and mentor is approved
* Messaging:

  * Only between approved users
  * Only if the recipient is visible to the sender where relevant (venture-to-investor/mentor)

---

## 4. Data model scope (high-level)

### Accounts

**User**

* email (unique), password, name
* role (enum)
* is_email_verified (bool)
* date_joined, last_login

**EmailVerificationToken**

* user, token, expires_at, used_at

### Venture

**VentureProfile** (now VentureProduct)

* user (FK - users can have multiple products)
* name
* industry_sector (FK or enum)
* website (required)
* linkedin_url (required)
* address, year_founded, employees_count
* short_description (text)
# Note: Business information fields (problem, solution, target market, traction, 
# funding) are now associated with each pitch deck document, not the profile
* status, submitted_at, approved_at
* is_active (boolean) - user can toggle

**Founder**

* venture (FK)
* full_name
* linkedin_url
* email, phone

**TeamMember**

* venture (FK)
* name, role_title, description, linkedin_url (optional)

**VentureNeed**

* venture (FK)
* type (FINANCE/MARKET_ACCESS/EXPERT/OTHER)
* finance_size_range, finance_objectives (nullable)
* target_markets (nullable)
* expertise_field, duration (nullable)
* other_notes

**VentureDocument**

* product (FK to VentureProduct)
* type (PITCH_DECK, OTHER)
* file (stored in media)
* size, uploaded_at
* validate PDF + <= 10MB
# Pitch deck metadata (only for PITCH_DECK type):
* problem_statement (text, optional)
* solution_description (text, optional)
* target_market (text, optional)
* traction_metrics (json, optional)
* funding_amount (char, optional)
* funding_stage (enum: PRE_SEED, SEED, SERIES_A, etc., optional)
* use_of_funds (text, optional)

### Investor

**InvestorProfile**

* user (1–1)
* full_name
* organization_name
* linkedin_or_website
* email, phone
* investment_experience_years
* deals_count (optional)
* stage_preferences (multi-select)
* industry_preferences (multi-select)
* average_ticket_size (enum ranges)
* visible_to_ventures (bool)
* status, submitted_at, approved_at

### Mentor/Consultant

**MentorProfile**

* user (1–1)
* full_name
* job_title, company
* linkedin_or_website
* contact_email, phone
* expertise_fields (multi-select)
* experience_overview
* industries_of_interest (multi-select)
* engagement_type (PAID / PRO_BONO / BOTH)
* paid_rate_type (hourly/daily/monthly) + amount (nullable)
* availability (one-time, ongoing, board/advisory) multi-select
* preferred_engagement (virtual/in-person/both)
* visible_to_ventures (bool)
* status, submitted_at, approved_at

### Approvals

**ReviewRequest**

* content_type + object_id (generic relation to Venture/Investor/Mentor)
* submitted_by
* status (SUBMITTED/APPROVED/REJECTED)
* reviewer, reviewed_at
* notes (internal)

### Matching

**Match**

* venture (FK)
* target_type (INVESTOR/MENTOR)
* target_object_id
* score (0–100)
* reasons (json list)
* created_at, refreshed_at

Matching inputs:

* Venture: sector, needs, stage (if you add), target markets
* Investor: stages, industries, ticket size
* Mentor: expertise, industries, engagement style

### Messaging

**Conversation**

* participants (M2M to User) (2 participants initially; allow group later if you want)
* created_at, last_message_at

**Message**

* conversation (FK)
* sender (FK User)
* body (text)
* created_at
* read_at (nullable)

Optional later:

* message attachments, reporting/blocking, moderation

### Content

**FAQItem**

* question, answer, order, published

**SuccessStory**

* title, summary, venture (optional FK), logo/image, published

**Resource**

* category (MARKET_REPORTS, LEGAL, TEMPLATES)
* title, description, file or url, published

**ContactInfo**

* email, phone, address, social links

---

## 5. API scope (DRF endpoints)

### Implementation Status

**✅ Implemented Features (2025-01-14)**:

1. **Pitch Deck Document Management**:
   - Full CRUD operations for pitch deck documents per product
   - File validation: PDF only, maximum 10MB
   - Documents stored in `VentureDocument` model with metadata (file_size, mime_type)
   - Endpoints: upload, list, delete with proper permission checks

2. **Messaging System**:
   - Complete conversation and message management
   - Automatic conversation creation or retrieval if exists
   - Read/unread tracking with unread count endpoint
   - Permission checks ensure only approved users can message
   - Visibility rules enforced (ventures can only message visible investors/mentors)

3. **User Profile & Account Management**:
   - User profile update (full_name field)
   - Password change with validation (current password verification, Django password validators)
   - Session maintained after password change (no forced logout)

4. **Frontend Integration**:
   - `messagingService.ts`: Complete messaging API client
   - `userService.ts`: User profile and password management
   - `productService.ts`: Enhanced with pitch deck CRUD methods
   - Components updated: Settings (password change), EditProfile (profile update), VentureDashboard (messaging)

5. **Backend Security Audit (2025-01-14)**:
   - Comprehensive security review of all API routes
   - Fixed path traversal vulnerabilities in file deletion
   - Fixed query parameter injection risks (UUID validation, whitelisting)
   - Fixed missing visibility checks in messaging system
   - Fixed information disclosure in login endpoint
   - Fixed privilege escalation risks in profile updates
   - Added input length validation and password strength checks
   - Documentation: `backend/SECURITY_AUDIT.md`

6. **Frontend Security Hardening (2025-01-14)**:
   - Created comprehensive security utilities (`utils/security.ts`)
   - Implemented XSS protection with `SafeText` component
   - Added input sanitization across all forms and inputs
   - Implemented URL validation and sanitization
   - Added file upload validation utilities
   - Applied security fixes to all major components (ProductManagement, MessagingSystem, Settings, EditProfile, LoginForm, etc.)
   - Verified NOT vulnerable to React CVE-2025-55182 (React Server Components RCE)
   - Documentation: `frontend/SECURITY_AUDIT.md`, `frontend/SECURITY_REACT_CVE.md`

### Auth

* `POST /api/auth/register` (role + email/password, optionally social later)
* `POST /api/auth/login` (JWT)
* `POST /api/auth/verify-email` (token)
* `POST /api/auth/resend-verification`
* `POST /api/auth/password-reset-request`
* `POST /api/auth/password-reset-confirm`
* `GET /api/auth/me` - Get current user
* `PATCH /api/auth/me` - Update user profile (full_name)
* `POST /api/auth/change-password` - Change user password

### Registration flows (by role)

Ventures (Products)

* `GET /api/ventures/products` - List user's products
* `POST /api/ventures/products` - Create new product (max 3)
* `GET /api/ventures/products/{id}` - Get product details
* `PATCH /api/ventures/products/{id}` - Update product (only if DRAFT/REJECTED)
* `PATCH /api/ventures/products/{id}/activate` - Activate/deactivate product
* `POST /api/ventures/products/{id}/submit` - Submit product for approval
* `POST /api/ventures/products/{id}/documents/pitch-deck` - Upload pitch deck (PDF, max 10MB)
* `GET /api/ventures/products/{id}/documents` - List all documents for a product
* `DELETE /api/ventures/products/{id}/documents/{doc_id}` - Delete document
* `GET /api/ventures/public` - List approved and active products
* `GET /api/ventures/{id}` - Get product detail (public view)

Investors

* `POST /api/investors/profile`
* `POST /api/investors/profile/submit`
* `GET /api/investors/profile/me`
* `PATCH /api/investors/profile/me` (toggle visible_to_ventures)
* `GET /api/investors/public` (only visible investors for approved ventures/admin)

Mentors

* `POST /api/mentors/profile`
* `POST /api/mentors/profile/submit`
* `GET /api/mentors/profile/me`
* `PATCH /api/mentors/profile/me` (toggle visible_to_ventures)
* `GET /api/mentors/public` (only visible mentors for approved ventures/admin)

### Approvals (admin/reviewer only)

* `GET /api/reviews/pending?type=venture|investor|mentor`
* `POST /api/reviews/{id}/approve`
* `POST /api/reviews/{id}/reject`
* `GET /api/reviews/{id}`

### Matching

* `GET /api/matches/me` (venture sees matched visible investors/mentors; investor/mentor sees matched ventures if you want)
* `POST /api/matches/refresh` (admin or scheduled task)

### Messaging

* `GET /api/messages/conversations` - List user's conversations
* `POST /api/messages/conversations` - Create conversation with user_id (participant_id in body, with server-side permission checks)
* `GET /api/messages/conversations/{id}` - Get conversation with messages
* `POST /api/messages/conversations/{id}/messages` - Send message (body in request)
* `POST /api/messages/conversations/{id}/read` - Mark conversation as read
* `GET /api/messages/conversations/unread-count` - Get unread message count

### Content

* `GET /api/content/faq`
* `GET /api/content/success-stories`
* `GET /api/content/resources?category=...`
* `GET /api/content/contacts`

---

## 6. Non-functional requirements

### Security

* Enforce permissions at API layer (DRF permission classes)
* Rate limit auth endpoints
* Validate file uploads: MIME, extension, size, scan hook optional
* Prevent IDOR: never expose profiles that requester can’t see

### Observability

* Structured logging
* Admin audit trail for approvals and visibility changes

### Performance

* Pagination on lists
* DB indexes on status, visibility, sector, stage preferences
* Matching computed async (Celery) and cached in `Match` table

---

## 7. Dockerization scope

### Development: Docker Compose

Services:

* `db` Postgres
* `web` Django dev server
* `redis` (optional but recommended now)
* `celery` worker
* `celery-beat` scheduler

Also:

* Volume for Postgres data
* Volume for Django media uploads

### Production: Docker Compose (or Kubernetes later)

Services:

* `db` Postgres (or managed externally)
* `web` Gunicorn
* `redis`
* `celery`, `celery-beat`
* `nginx` for TLS termination, static, media
* Use environment variables for secrets

### Files you will deliver in repo

* `Dockerfile` (multi-stage recommended)
* `docker-compose.yml` (dev)
* `docker-compose.prod.yml` (prod)
* `.env.example`
* `entrypoint.sh` (migrate + collectstatic in prod)
* `requirements.txt` or `pyproject.toml`
* `Makefile` (optional) for common commands

### Environment variables (minimum)

* `DJANGO_SECRET_KEY`
* `DJANGO_DEBUG`
* `DJANGO_ALLOWED_HOSTS`
* `DATABASE_URL` (or separate host/user/pass)
* `REDIS_URL`
* `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL`
* `MEDIA_ROOT`, `STATIC_ROOT`
* `JWT_SIGNING_KEY` (or reuse secret)
* `CSRF_TRUSTED_ORIGINS` (if needed)

---

## 8. Delivery milestones (practical sprint plan)

### Milestone 1: Project foundation

* Django project scaffold + apps
* Postgres integration
* DRF + JWT auth
* Email verification flow
* Docker dev environment boots fully
  Deliverable: can register/login/verify email in Docker

### Milestone 2: Profiles + submissions

* Venture/Investor/Mentor profile CRUD
* Validation rules (mandatory links, fields)
* Submit action changes status to SUBMITTED
* Admin can view submissions
  Deliverable: full registration flows working end-to-end

### Milestone 3: Document upload + approval workflow

* Pitch deck upload with size/type validation
* ReviewRequest creation on submit
* Approve/reject endpoints + notifications
  Deliverable: “approval gate” working, profiles locked/unlocked correctly

### Milestone 4: Browsing + visibility rules

* Ventures list browsing for investors/mentors (approved only)
* Investors/mentors visibility toggles
* Ventures can view only visible approved investors/mentors
  Deliverable: browsing respects all constraints server-side

### Milestone 5: Messaging

* Conversations + messages
* Permission checks consistent with visibility + approval
  Deliverable: secure messaging between approved parties

### Milestone 6: Matching engine (MVP)

* Matching rules v1 (score based on sector/industry overlap, stage, needs vs preferences)
* Nightly refresh via Celery beat
* Matches API
  Deliverable: matches appear for users, with score and reasons

### Milestone 7: Content module

* FAQ, success stories, resources, contacts
* Admin manage content
  Deliverable: frontend can render all public content from API

### Milestone 8: Production hardening

* Gunicorn + Nginx + collectstatic
* Separate prod compose
* Security headers, logging, basic rate limiting
  Deliverable: production-compose deployable

---

## 9. Acceptance criteria checklist

* A user can register as Venture/Investor/Mentor, verify email, fill profile, submit
* Admin can approve/reject and user is notified
* Investors and mentors can browse ventures only after approval
* Ventures cannot see investors/mentors unless those users set visible_to_ventures = true
* Messaging only works between approved users and respects visibility rules
* Pitch deck upload enforces PDF and 10MB limit
* Docker dev: one command brings everything up, migrations run, API reachable
* Docker prod: Nginx serves static/media, Django behind Gunicorn

---

## 10. Suggested repo structure

* `backend/`

  * `config/` (settings, urls, wsgi/asgi)
  * `apps/accounts/`
  * `apps/ventures/`
  * `apps/investors/`
  * `apps/mentors/`
  * `apps/approvals/`
  * `apps/matching/`
  * `apps/messaging/`
  * `apps/content/`
* `docker/` (nginx conf, entrypoint scripts)
* `docker-compose.yml`
* `docker-compose.prod.yml`
* `Dockerfile`
* `.env.example`

