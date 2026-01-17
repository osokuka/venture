# VentureUP Link Platform Documentation Index

## Documentation Standards

**IMPORTANT RULE**: Minimize the creation of new markdown (MD) documentation files unless explicitly requested. All project documentation, instructions, and updates should be consolidated into existing documentation files rather than creating new ones. This rule applies to all development work and documentation practices across the entire application.

---

This directory contains all project documentation, scope definitions, and task tracking.

## Project Documentation

### Core Project Documents

1. **[refined_project_scope.md](./refined_project_scope.md)**
   - Complete project scope and requirements
   - Architecture decisions
   - API specifications
   - Data models
   - Frontend integration requirements

2. **[project_details.md](./project_details.md)**
   - Initial project requirements
   - Original scope definition
   - Feature specifications

3. **[jira_tasks.json](./jira_tasks.json)**
   - Complete task breakdown
   - Epics, stories, and tasks
   - Time estimates and story points
   - Acceptance criteria

4. **[MULTI_PRODUCT_IMPLEMENTATION.md](./MULTI_PRODUCT_IMPLEMENTATION.md)**
   - Multi-product architecture implementation details
   - API endpoints summary
   - Frontend changes
   - Business information separation (venture profile vs pitch deck metadata)


6. **[PLATFORM_STATUS.md](./PLATFORM_STATUS.md)**
   - Current platform status
   - Celery tasks implementation
   - Feature completion status

## Technical Documentation

### Tech Debt & Issues

1. **VENTURES_CRUD_STATUS.md** (Section 11)
   - All core features complete
   - Minor improvements needed (LinkedIn URL display)

2. **PLATFORM_STATUS.md** (Tech Debt Summary Section)
   - WebSocket connection errors (non-critical, development only)
   - Reverse proxy configuration for Vite HMR
   - Logo display fixes (2026-01-17)
   - React Hooks violations fixes (2026-01-17)


### Role Management & Authentication

1. **refined_project_scope.md** (Section 8)
   - Complete role system architecture
   - Backend and frontend role definitions
   - Role mapping flow and conversion logic
   - Role-based access control (RBAC)
   - Superuser/Admin account details
   - Demo accounts information

2. **PLATFORM_STATUS.md** (Authentication Section)
   - Role system implementation details
   - Role mapping flow
   - RBAC implementation status
   - Known issues and tech debt

3. **[DEMO_ACCOUNTS.md](./DEMO_ACCOUNTS.md)**
   - Complete list of demo accounts
   - Credentials and access information
   - Account creation process
   - Testing notes

## Backend Documentation

Located in `backend/` directory:

- **[README.md](../backend/README.md)** - Backend setup and development guide
- **[README_DOCKER.md](../backend/README_DOCKER.md)** - Docker setup and configuration
- **[EMAIL_SETUP.md](../backend/EMAIL_SETUP.md)** - Email/SMTP configuration
- **[PORT_MAPPING.md](../backend/PORT_MAPPING.md)** - Port configuration and conflicts

## Frontend Documentation

Located in `frontend/` directory:

- **[README.md](../frontend/README.md)** - Frontend setup guide
- **[README_API.md](../frontend/README_API.md)** - Frontend-Backend API integration

## Root Documentation

- **[README.md](../README.md)** - Project overview and quick start guide

## Documentation Structure

```
working_scope/
├── DOCUMENTATION_INDEX.md                    # This file
├── refined_project_scope.md                  # Complete project scope
├── project_details.md                        # Initial requirements
├── jira_tasks.json                           # Task tracking
├── MULTI_PRODUCT_IMPLEMENTATION.md           # Multi-product architecture details
├── PLATFORM_STATUS.md                        # Platform status and features (includes role system)
├── VENTURES_CRUD_STATUS.md                   # Ventures CRUD status (includes pitch deck architecture)
└── DEMO_ACCOUNTS.md                          # Demo accounts reference

backend/
├── README.md                       # Backend setup
├── README_DOCKER.md                # Docker configuration
├── EMAIL_SETUP.md                  # Email setup
└── PORT_MAPPING.md                 # Port configuration

frontend/
├── README.md                       # Frontend setup
└── README_API.md                   # API integration

README.md                           # Project overview
```

## Quick Links

### Getting Started
- [Project Overview](../README.md)
- [Backend Setup](../backend/README.md)
- [Frontend Setup](../frontend/README.md)

### Development
- [Project Scope](./refined_project_scope.md)
- [Task Tracking](./jira_tasks.json)
- [API Integration](../frontend/README_API.md)
- [Ventures CRUD Status](./VENTURES_CRUD_STATUS.md) (includes pitch deck architecture)

### Configuration
- [Docker Setup](../backend/README_DOCKER.md)
- [Email Configuration](../backend/EMAIL_SETUP.md)
- [Port Mapping](../backend/PORT_MAPPING.md)

### Role & Authentication
- [Project Scope - Role System](./refined_project_scope.md#8-security-requirements) (Section 8)
- [Platform Status - Role Implementation](./PLATFORM_STATUS.md#authentication) (Authentication Section)
- [Demo Accounts](./DEMO_ACCOUNTS.md)

## Document Status

| Document | Status | Last Updated |
|----------|--------|--------------|
| refined_project_scope.md | ✅ Complete | 2025-01-14 |
| project_details.md | ✅ Complete | 2025-01-14 |
| jira_tasks.json | ✅ Active | 2025-01-14 |
| MULTI_PRODUCT_IMPLEMENTATION.md | ✅ Complete | 2025-01-14 |
| PLATFORM_STATUS.md | ✅ Active | 2026-01-17 |
| VENTURES_CRUD_STATUS.md | ✅ Complete | 2025-01-16 |
| DEMO_ACCOUNTS.md | ✅ Complete | 2025-01-14 |

## Contributing

When adding new documentation:
1. Place project-level docs in `working_scope/`
2. Place technical docs in respective `backend/` or `frontend/` directories
3. Update this index
4. Update `jira_tasks.json` if adding new features
