# Production Deployment Guide

## Overview

This guide covers deploying the VentureLink platform to production using Docker Compose.

**Key Points:**
- ✅ Same ports as development (3000, 8001, 5433, 6381)
- ✅ No separate nginx service (using external nginx)
- ✅ Frontend uses nginx internally to serve static files
- ✅ Backend uses Gunicorn with 3 workers
- ✅ Production settings enabled automatically

## Prerequisites

1. Docker and Docker Compose installed
2. External nginx configured (not included in docker-compose)
3. Environment variables configured in `backend/.env`
4. Domain names configured:
   - `ventureuplink.com` (frontend)
   - `backend.ventureuplink.com` (backend API)

## Port Mapping

| Service | Container Port | Host Port | Description |
|---------|---------------|-----------|-------------|
| Frontend | 80 (nginx) | 3000 | React app served by nginx |
| Backend | 8000 (gunicorn) | 8001 | Django REST API |
| PostgreSQL | 5432 | 5433 | Database |
| Redis | 6379 | 6381 | Celery broker |

## Environment Variables

Create `backend/.env` file with the following variables:

```bash
# Database
DB_NAME=venturelink
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_HOST=db
DB_PORT=5432

# Django
DJANGO_SECRET_KEY=your-secret-key-here-change-in-production
DJANGO_ALLOWED_HOSTS=ventureuplink.com,www.ventureuplink.com,backend.ventureuplink.com
DJANGO_SETTINGS_MODULE=config.settings.production

# CORS & CSRF
CORS_ALLOWED_ORIGINS=https://ventureuplink.com,https://www.ventureuplink.com,https://backend.ventureuplink.com
CSRF_TRUSTED_ORIGINS=https://ventureuplink.com,https://www.ventureuplink.com,https://backend.ventureuplink.com

# Frontend URL
FRONTEND_URL=https://ventureuplink.com

# Email Configuration
EMAIL_HOST=mail.prosolutions-ks.com
EMAIL_PORT=465
EMAIL_USE_SSL=True
EMAIL_HOST_USER=ventures@prosolutions-ks.com
EMAIL_HOST_PASSWORD=your_email_password
DEFAULT_FROM_EMAIL=ventures@prosolutions-ks.com

# Redis
REDIS_URL=redis://redis:6379/0
```

## Deployment Steps

### 1. Build and Start Services

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Check service status
docker-compose -f docker-compose.prod.yml ps
```

### 2. Run Database Migrations

Migrations run automatically via `entrypoint.sh`, but you can run manually:

```bash
docker-compose -f docker-compose.prod.yml exec web python manage.py migrate
```

### 3. Create Superuser (if needed)

```bash
docker-compose -f docker-compose.prod.yml exec web python manage.py createsuperuser
```

Or use environment variables (configured in entrypoint.sh):
- `DJANGO_SUPERUSER_EMAIL=admin@ventureuplink.com`
- `DJANGO_SUPERUSER_PASSWORD=your_secure_password`

### 4. Collect Static Files

Static files are collected automatically via `entrypoint.sh`, but you can run manually:

```bash
docker-compose -f docker-compose.prod.yml exec web python manage.py collectstatic --noinput
```

### 5. Configure External Nginx

Since you're using external nginx, configure it to proxy:

**Frontend (ventureuplink.com):**
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name ventureuplink.com www.ventureuplink.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ventureuplink.com www.ventureuplink.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Backend API (backend.ventureuplink.com):**
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name backend.ventureuplink.com;

    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name backend.ventureuplink.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    location / {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeouts for long-running requests
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

## Service Management

### Start Services
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Stop Services
```bash
docker-compose -f docker-compose.prod.yml down
```

### Restart Services
```bash
docker-compose -f docker-compose.prod.yml restart
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f web
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f celery
```

### Update Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Run migrations if needed
docker-compose -f docker-compose.prod.yml exec web python manage.py migrate
```

## Health Checks

### Check Backend API
```bash
curl https://backend.ventureuplink.com/api/health/
```

### Check Frontend
```bash
curl https://ventureuplink.com
```

### Check Database Connection
```bash
docker-compose -f docker-compose.prod.yml exec db pg_isready -U postgres
```

### Check Redis
```bash
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping
```

## Backup & Restore

### Backup Database
```bash
docker-compose -f docker-compose.prod.yml exec db pg_dump -U postgres venturelink > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database
```bash
docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres venturelink < backup_file.sql
```

### Backup Media Files
```bash
docker-compose -f docker-compose.prod.yml exec web tar -czf /tmp/media_backup.tar.gz /app/media
docker cp venturelink_web_prod:/tmp/media_backup.tar.gz ./media_backup.tar.gz
```

## Monitoring

### Check Container Status
```bash
docker-compose -f docker-compose.prod.yml ps
```

### Check Resource Usage
```bash
docker stats
```

### Check Gunicorn Workers
```bash
docker-compose -f docker-compose.prod.yml exec web ps aux | grep gunicorn
```

## Troubleshooting

### Backend Not Starting
1. Check logs: `docker-compose -f docker-compose.prod.yml logs web`
2. Verify database connection: `docker-compose -f docker-compose.prod.yml exec web python manage.py dbshell`
3. Check environment variables: `docker-compose -f docker-compose.prod.yml exec web env | grep DJANGO`

### Frontend Not Loading
1. Check logs: `docker-compose -f docker-compose.prod.yml logs frontend`
2. Verify nginx config: `docker-compose -f docker-compose.prod.yml exec frontend nginx -t`
3. Check external nginx proxy configuration

### Database Connection Issues
1. Verify database is running: `docker-compose -f docker-compose.prod.yml ps db`
2. Check connection string in `.env` file
3. Verify network connectivity: `docker-compose -f docker-compose.prod.yml exec web ping db`

### Celery Not Processing Tasks
1. Check celery logs: `docker-compose -f docker-compose.prod.yml logs celery`
2. Verify Redis connection: `docker-compose -f docker-compose.prod.yml exec celery celery -A config inspect active`
3. Check Redis: `docker-compose -f docker-compose.prod.yml exec redis redis-cli ping`

## Security Checklist

- [ ] Change `DJANGO_SECRET_KEY` in `.env`
- [ ] Use strong database password
- [ ] Configure SSL certificates in external nginx
- [ ] Set `DEBUG=False` (handled by production settings)
- [ ] Review `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`
- [ ] Secure email credentials
- [ ] Enable firewall rules
- [ ] Regular database backups
- [ ] Monitor logs for security issues

## Production Settings

The production configuration (`config.settings.production`) includes:
- ✅ `DEBUG = False`
- ✅ SSL/TLS security headers
- ✅ Secure cookies (httpOnly, Secure, SameSite)
- ✅ CORS restrictions
- ✅ HSTS headers
- ✅ Database connection pooling
- ✅ File logging with rotation

## Support

For issues or questions, check:
1. Application logs: `docker-compose -f docker-compose.prod.yml logs`
2. Django logs: Inside container at `/app/logs/django.log`
3. Nginx logs: `docker-compose -f docker-compose.prod.yml logs frontend`
