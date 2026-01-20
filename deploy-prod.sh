#!/bin/bash
# Production Deployment Script for VentureLink Platform

set -e

echo "🚀 Starting Production Deployment..."

# Check if .env file exists
if [ ! -f "./backend/.env" ]; then
    echo "❌ Error: backend/.env file not found!"
    echo "Please create backend/.env with required environment variables."
    echo "See PRODUCTION_DEPLOYMENT.md for details."
    exit 1
fi

# Stop any existing containers
echo "📦 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down || true

# Build images
echo "🔨 Building Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Start services
echo "▶️  Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service status
echo "📊 Service Status:"
docker-compose -f docker-compose.prod.yml ps

# Run migrations (entrypoint.sh handles this, but verify)
echo "🔄 Verifying migrations..."
docker-compose -f docker-compose.prod.yml exec -T web python manage.py migrate --noinput || echo "Migrations already applied"

# Collect static files (entrypoint.sh handles this, but verify)
echo "📁 Verifying static files..."
docker-compose -f docker-compose.prod.yml exec -T web python manage.py collectstatic --noinput || echo "Static files already collected"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your external nginx to proxy:"
echo "   - Frontend: http://localhost:3000 → https://ventureuplink.com"
echo "   - Backend:  http://localhost:8001 → https://backend.ventureuplink.com"
echo ""
echo "2. Check logs:"
echo "   make prod-logs"
echo ""
echo "3. Verify services:"
echo "   curl http://localhost:3000"
echo "   curl http://localhost:8001/api/health/"
echo ""
echo "📖 See PRODUCTION_DEPLOYMENT.md for detailed instructions."
