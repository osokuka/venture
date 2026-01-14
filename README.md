# VentureUP Link Platform

## Documentation Standards

**IMPORTANT RULE**: Minimize the creation of new markdown (MD) documentation files unless explicitly requested. All project documentation, instructions, and updates should be consolidated into existing documentation files rather than creating new ones. This rule applies to all development work and documentation practices across the entire application.

---

A full-stack platform connecting startups with investors and mentors.

## Architecture

- **Frontend**: React + Vite + TypeScript
- **Backend**: Django REST Framework + PostgreSQL
- **Task Queue**: Celery + Redis
- **Deployment**: Docker Compose

## Quick Start

### Prerequisites

- Docker Desktop installed and running
- Docker Compose v2.0+

### Development Setup

1. **Clone the repository** (if not already done)

2. **Create environment file for backend**:
```bash
cd backend
cp .env.example .env
# Edit .env with your settings
```

3. **Start all services**:
```bash
# From project root
docker-compose up -d
```

4. **Run migrations**:
```bash
docker-compose exec web python manage.py migrate
```

5. **Create superuser**:
```bash
docker-compose exec web python manage.py createsuperuser
```

6. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8001/api
   - Admin Panel: http://localhost:8001/admin

### Services

- **frontend** - React development server (port 3000)
- **web** - Django REST API (port 8001)
- **db** - PostgreSQL database (port 5433)
- **redis** - Redis server (port 6381)
- **celery** - Celery worker
- **celery-beat** - Celery scheduler

## Development Commands

### View logs
```bash
docker-compose logs -f [service_name]
```

### Execute commands in containers
```bash
# Django shell
docker-compose exec web python manage.py shell

# Create migrations
docker-compose exec web python manage.py makemigrations

# Run migrations
docker-compose exec web python manage.py migrate

# Install frontend dependencies
docker-compose exec frontend npm install
```

### Restart services
```bash
docker-compose restart [service_name]
```

### Stop all services
```bash
docker-compose down
```

### Stop and remove volumes (⚠️ deletes database)
```bash
docker-compose down -v
```

## Production Deployment

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Project Structure

```
.
├── frontend/          # React frontend application
│   ├── src/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── package.json
├── backend/           # Django backend API
│   ├── apps/
│   ├── config/
│   ├── Dockerfile
│   └── requirements.txt
├── docker-compose.yml          # Development setup
├── docker-compose.prod.yml     # Production setup
└── README.md
```

## Port Mappings

- **Frontend**: 3000 (dev) / 80 (prod)
- **Backend API**: 8001
- **PostgreSQL**: 5433
- **Redis**: 6381

See `backend/PORT_MAPPING.md` for details on port conflicts.

## Environment Variables

### Backend (.env file in backend/)
- `DJANGO_SECRET_KEY` - Django secret key
- `DJANGO_DEBUG` - Debug mode (True/False)
- `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Database credentials
- `REDIS_URL` - Redis connection URL
- `CORS_ALLOWED_ORIGINS` - Allowed CORS origins

### Frontend
- `VITE_API_BASE_URL` - Backend API URL (default: http://localhost:8001/api)

## Troubleshooting

### Port conflicts
Check `backend/PORT_MAPPING.md` for port usage and conflicts.

### Database connection errors
- Ensure database service is healthy: `docker-compose ps`
- Check database logs: `docker-compose logs db`

### Frontend not connecting to backend
- Verify `VITE_API_BASE_URL` in frontend environment
- Check CORS settings in backend
- Ensure both services are running: `docker-compose ps`

## Documentation

### Project Documentation
All project documentation is located in the `working_scope/` directory:

- **[Documentation Index](working_scope/DOCUMENTATION_INDEX.md)** - Complete documentation index
- **[Project Scope](working_scope/refined_project_scope.md)** - Complete project scope and requirements
- **[Task Tracking](working_scope/jira_tasks.json)** - JIRA tasks and progress
- **[Role Analysis](working_scope/ROLE_ANALYSIS.md)** - Role interconnection system
- **[Demo Accounts](working_scope/DEMO_ACCOUNTS.md)** - Demo account credentials
- **[Role Summary](working_scope/ROLE_INTERCONNECTION_SUMMARY.md)** - Quick role reference

### Technical Documentation
- [Backend Setup](backend/README.md) - Backend development guide
- [Backend Docker Setup](backend/README_DOCKER.md) - Docker configuration
- [Frontend API Integration](frontend/README_API.md) - API integration guide
- [Email Setup](backend/EMAIL_SETUP.md) - SMTP configuration
- [Port Mapping](backend/PORT_MAPPING.md) - Port configuration

## License

Proprietary - All rights reserved
