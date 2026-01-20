.PHONY: help build up down restart logs shell migrate makemigrations createsuperuser test clean frontend-install seed-demo prod-build prod-up prod-down prod-restart prod-logs prod-shell prod-migrate

help:
	@echo "Development commands:"
	@echo "  make build          - Build Docker images"
	@echo "  make up             - Start all services"
	@echo "  make down           - Stop all services"
	@echo "  make restart        - Restart all services"
	@echo "  make logs           - Show logs from all services"
	@echo "  make shell          - Open Django shell"
	@echo "  make migrate        - Run database migrations"
	@echo "  make makemigrations - Create new migrations"
	@echo "  make createsuperuser - Create Django superuser"
	@echo "  make test           - Run tests"
	@echo "  make clean          - Remove containers and volumes"
	@echo "  make frontend-install - Install frontend dependencies"
	@echo "  make seed-demo      - Seed database with demo data"
	@echo ""
	@echo "Production commands:"
	@echo "  make prod-build     - Build production Docker images"
	@echo "  make prod-up        - Start production services"
	@echo "  make prod-down      - Stop production services"
	@echo "  make prod-restart   - Restart production services"
	@echo "  make prod-logs      - Show production logs"
	@echo "  make prod-shell     - Open Django shell in production"
	@echo "  make prod-migrate   - Run migrations in production"

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

shell:
	docker-compose exec web python manage.py shell

migrate:
	docker-compose exec web python manage.py migrate

makemigrations:
	docker-compose exec web python manage.py makemigrations

createsuperuser:
	docker-compose exec web python manage.py createsuperuser

test:
	docker-compose exec web pytest

clean:
	docker-compose down -v
	docker system prune -f

frontend-install:
	docker-compose exec frontend npm install

seed-demo:
	docker-compose exec web python manage.py seed_demo_data

# Production commands
prod-build:
	docker-compose -f docker-compose.prod.yml build

prod-up:
	docker-compose -f docker-compose.prod.yml up -d

prod-down:
	docker-compose -f docker-compose.prod.yml down

prod-restart:
	docker-compose -f docker-compose.prod.yml restart

prod-logs:
	docker-compose -f docker-compose.prod.yml logs -f

prod-shell:
	docker-compose -f docker-compose.prod.yml exec web python manage.py shell

prod-migrate:
	docker-compose -f docker-compose.prod.yml exec web python manage.py migrate
