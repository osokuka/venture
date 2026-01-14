# Frontend-Backend API Integration

## Documentation Standards

**IMPORTANT RULE**: Minimize the creation of new markdown (MD) documentation files unless explicitly requested. All project documentation, instructions, and updates should be consolidated into existing documentation files rather than creating new ones. This rule applies to all development work and documentation practices across the entire application.

---

This document describes how the frontend communicates with the Django REST API backend.

## Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

Make sure `axios` is installed (it's been added to `package.json`).

### 2. Configure API Base URL

Create a `.env` file in the `frontend` directory:

```env
VITE_API_BASE_URL=http://localhost:8001/api
```

Or set it in your environment. The default is `http://localhost:8001/api`.

## API Services

### Authentication Service (`src/services/authService.ts`)

Handles all authentication-related API calls:

- `register(data)` - Register new user
- `login(data)` - Login and get JWT tokens
- `logout()` - Clear tokens
- `getCurrentUser()` - Get current authenticated user
- `verifyEmail(data)` - Verify email with token
- `resendVerification()` - Resend verification email

### Venture Service (`src/services/ventureService.ts`)

Handles venture-related API calls:

- `getMyProfile()` - Get current user's venture profile
- `saveProfile(data)` - Create/update venture profile
- `submitProfile()` - Submit profile for approval
- `uploadPitchDeck(file)` - Upload pitch deck document
- `getPublicVentures(params)` - Get list of approved ventures
- `getVentureById(id)` - Get venture detail

### Content Service (`src/services/contentService.ts`)

Handles content-related API calls:

- `getFAQ()` - Get FAQ items
- `getSuccessStories()` - Get success stories
- `getResources(category)` - Get resources
- `getContactInfo()` - Get contact information

## API Client (`src/services/api.ts`)

The API client handles:

- **Base URL Configuration**: Uses `VITE_API_BASE_URL` environment variable
- **JWT Token Management**: Automatically adds `Authorization: Bearer <token>` header
- **Token Refresh**: Automatically refreshes expired tokens
- **Error Handling**: Provides consistent error messages

### Token Storage

Tokens are stored in `localStorage`:
- `access_token` - JWT access token (15 min expiry)
- `refresh_token` - JWT refresh token (7 day expiry)

## Updated Components

### AuthContext (`src/components/AuthContext.tsx`)

- Updated to use `authService` for login/register
- Handles JWT token storage
- Checks authentication on mount
- Shows loading state while checking auth

### LoginForm (`src/components/LoginForm.tsx`)

- Updated to use async `login` function
- Proper error handling from API

### VentureRegistration (`src/components/VentureRegistration.tsx`)

- Updated to use async `completeRegistration`
- Proper error handling

## Next Steps

1. **Update other registration forms** (InvestorRegistration, MentorRegistration) to use API
2. **Update dashboard components** to fetch real data from API
3. **Update messaging system** to use real API endpoints
4. **Add investor and mentor services** similar to ventureService
5. **Update content sections** (FAQ, Success Stories) to use contentService

## Testing

1. Start the backend:
```bash
cd backend
docker-compose up -d
```

2. Start the frontend:
```bash
cd frontend
npm run dev
```

3. Test registration and login flows

## Error Handling

All API calls use the `getErrorMessage` helper to extract user-friendly error messages from API responses. Errors are displayed to users in the UI.

## CORS Configuration

Make sure the backend has CORS configured to allow requests from `http://localhost:3000` (frontend dev server).
