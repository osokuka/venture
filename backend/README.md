# VentureUP Link Backend API

## Documentation Standards

**IMPORTANT RULE**: Minimize the creation of new markdown (MD) documentation files unless explicitly requested. All project documentation, instructions, and updates should be consolidated into existing documentation files rather than creating new ones. This rule applies to all development work and documentation practices across the entire application.

---

Django REST Framework API backend for the VentureUP Link platform.

## Project Structure

```
backend/
├── config/              # Django project settings
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   └── wsgi.py
├── apps/                # Django apps
│   ├── accounts/        # User management, auth, email verification
│   ├── ventures/        # Venture profiles, founders, teams, documents
│   ├── investors/       # Investor profiles, preferences
│   ├── mentors/         # Mentor profiles, expertise, pricing
│   ├── approvals/       # Review workflow, status management
│   ├── matching/        # Matching algorithm and match storage
│   ├── messaging/       # Conversations and messages
│   └── content/         # FAQ, success stories, resources, contacts
├── shared/              # Shared utilities, permissions, mixins
├── manage.py
└── requirements.txt
```

## Setup

### Prerequisites

- Python 3.12+
- PostgreSQL 15+
- Redis (for Celery)

### Installation

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration.

5. Run migrations:
```bash
python manage.py migrate
```

6. Create a superuser:
```bash
python manage.py createsuperuser
```

7. Run the development server:
```bash
python manage.py runserver
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT tokens
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/verify-email` - Verify email with token
- `POST /api/auth/resend-verification` - Resend verification email
- `GET /api/auth/me` - Get current user profile

### Ventures
- `POST /api/ventures/profile` - Create/update venture profile
- `GET /api/ventures/profile/me` - Get own venture profile
- `POST /api/ventures/profile/submit` - Submit profile for approval
- `POST /api/ventures/documents/pitch-deck` - Upload pitch deck
- `GET /api/ventures/public` - List approved ventures

### Investors
- `POST /api/investors/profile` - Create/update investor profile
- `GET /api/investors/profile/me` - Get own investor profile
- `PATCH /api/investors/profile/me` - Update own profile
- `POST /api/investors/profile/submit` - Submit profile for approval
- `GET /api/investors/public` - List visible investors

### Mentors
- `POST /api/mentors/profile` - Create/update mentor profile
- `GET /api/mentors/profile/me` - Get own mentor profile
- `PATCH /api/mentors/profile/me` - Update own profile
- `POST /api/mentors/profile/submit` - Submit profile for approval
- `GET /api/mentors/public` - List visible mentors

### Approvals (Admin Only)
- `GET /api/reviews/pending` - List pending reviews
- `POST /api/reviews/{id}/approve` - Approve a submission
- `POST /api/reviews/{id}/reject` - Reject a submission

### Matching
- `GET /api/matches/me` - Get matches for current user
- `POST /api/matches/refresh` - Trigger match refresh (admin)

### Messaging
- `GET /api/messages/conversations` - List user's conversations
- `POST /api/messages/conversations` - Create new conversation
- `GET /api/messages/conversations/{id}` - Get conversation with messages
- `POST /api/messages/conversations/{id}/messages` - Send message

### Content
- `GET /api/content/faq` - List published FAQ items
- `GET /api/content/success-stories` - List published success stories
- `GET /api/content/resources` - List published resources
- `GET /api/content/contacts` - Get contact information

## Development

### Running Tests
```bash
pytest
```

### Code Formatting
```bash
black .
```

### Linting
```bash
flake8 .
```

## Docker (Coming Soon)

Docker Compose configuration will be added for easy development and production deployment.

## License

Proprietary - All rights reserved
