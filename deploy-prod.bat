@echo off
REM Production Deployment Script for VentureLink Platform (Windows)

echo 🚀 Starting Production Deployment...

REM Check if .env file exists
if not exist "backend\.env" (
    echo ❌ Error: backend\.env file not found!
    echo Please create backend\.env with required environment variables.
    echo See PRODUCTION_DEPLOYMENT.md for details.
    exit /b 1
)

REM Stop any existing containers
echo 📦 Stopping existing containers...
docker-compose -f docker-compose.prod.yml down

REM Build images
echo 🔨 Building Docker images...
docker-compose -f docker-compose.prod.yml build --no-cache

REM Start services
echo ▶️  Starting services...
docker-compose -f docker-compose.prod.yml up -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check service status
echo 📊 Service Status:
docker-compose -f docker-compose.prod.yml ps

REM Run migrations (entrypoint.sh handles this, but verify)
echo 🔄 Verifying migrations...
docker-compose -f docker-compose.prod.yml exec -T web python manage.py migrate --noinput

REM Collect static files (entrypoint.sh handles this, but verify)
echo 📁 Verifying static files...
docker-compose -f docker-compose.prod.yml exec -T web python manage.py collectstatic --noinput

echo.
echo ✅ Deployment complete!
echo.
echo 📋 Next steps:
echo 1. Configure your external nginx to proxy:
echo    - Frontend: http://localhost:3000 → https://ventureuplink.com
echo    - Backend:  http://localhost:8001 → https://backend.ventureuplink.com
echo.
echo 2. Check logs:
echo    make prod-logs
echo    OR
echo    docker-compose -f docker-compose.prod.yml logs -f
echo.
echo 3. Verify services:
echo    curl http://localhost:3000
echo    curl http://localhost:8001/api/health/
echo.
echo 📖 See PRODUCTION_DEPLOYMENT.md for detailed instructions.

pause
