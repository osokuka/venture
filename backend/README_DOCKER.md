# Docker Setup for VentureUP Link Backend

## Documentation Standards

**IMPORTANT RULE**: Minimize the creation of new markdown (MD) documentation files unless explicitly requested. All project documentation, instructions, and updates should be consolidated into existing documentation files rather than creating new ones. This rule applies to all development work and documentation practices across the entire application.

---

## Prerequisites

- Docker Desktop installed and running
- Docker Compose v2.0+

## Quick Start

### 1. Create Environment File

Create a `.env` file in the `backend` directory:

```bash
# Django Settings
DJANGO_SECRET_KEY=your-secret-key-here-change-in-production
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# Database (will use db service in Docker)
DB_NAME=venturelink
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db
DB_PORT=5432

# Redis (will use redis service in Docker)
REDIS_URL=redis://redis:6379/0

# Email Configuration (optional for development)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=noreply@venturelink.com

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### 2. Build and Start Services

```bash
# Build Docker images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. Run Migrations

```bash
# Create migrations (if needed)
docker-compose exec web python manage.py makemigrations

# Apply migrations
docker-compose exec web python manage.py migrate
```

### 4. Create Superuser

```bash
docker-compose exec web python manage.py createsuperuser
```

### 5. Access the Application

- **API**: http://localhost:8001/api/
- **Admin**: http://localhost:8001/admin/
- **API Docs**: http://localhost:8001/api/ (DRF browsable API)

**Note**: Port 8001 is used to avoid conflicts with other Docker containers. See `PORT_MAPPING.md` for details.

## Using Makefile (Optional)

If you have `make` installed, you can use these commands:

```bash
make build              # Build Docker images
make up                 # Start all services
make down               # Stop all services
make logs               # View logs
make migrate            # Run migrations
make createsuperuser    # Create admin user
make shell              # Open Django shell
```

## Docker Services

The setup includes:

- **web**: Django development server (port 8000)
- **db**: PostgreSQL 15 database (port 5432)
- **redis**: Redis server (port 6379)
- **celery**: Celery worker for async tasks
- **celery-beat**: Celery scheduler for periodic tasks

## Common Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f web
docker-compose logs -f db
```

### Execute Commands in Container
```bash
# Django shell
docker-compose exec web python manage.py shell

# Run tests
docker-compose exec web pytest

# Create migrations
docker-compose exec web python manage.py makemigrations

# Apply migrations
docker-compose exec exec web python manage.py migrate
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart web
```

### Stop and Remove
```bash
# Stop services (keeps volumes)
docker-compose down

# Stop and remove volumes (deletes database)
docker-compose down -v
```

## Development Workflow

1. Make code changes in your local files
2. Changes are automatically reflected (volumes mounted)
3. Restart service if needed: `docker-compose restart web`
4. Run migrations when models change: `docker-compose exec web python manage.py migrate`

## Production Deployment

For production, use the production compose file:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

This includes:
- Gunicorn instead of development server
- Production-optimized settings

**Note**: Nginx is not included in the Docker stack. Configure nginx separately to proxy to the web service on port 8000. See `docker/nginx/` for example configurations.

## Troubleshooting

### Database Connection Error
- Check if database service is running: `docker-compose ps`
- Check database logs: `docker-compose logs db`
- Verify `.env` file has correct DB_HOST=db

### Port Already in Use
- Ports are configured to avoid conflicts: Web (8001), PostgreSQL (5433), Redis (6381)
- If conflicts occur, change ports in `docker-compose.yml`
- See `PORT_MAPPING.md` for current port mappings

### Migrations Not Working
- Make sure database service is healthy: `docker-compose ps`
- Check web service logs: `docker-compose logs web`
- Try recreating containers: `docker-compose up -d --force-recreate`

### Static Files Not Loading
- Run collectstatic: `docker-compose exec web python manage.py collectstatic`
- For production, ensure your external nginx is configured to serve static files from `/app/staticfiles`

## Environment Variables

All environment variables are loaded from `.env` file. Make sure to:
- Never commit `.env` to version control
- Use different `.env` files for different environments
- Keep production secrets secure
