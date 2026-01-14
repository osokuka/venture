.PHONY: help build up down restart logs shell migrate makemigrations createsuperuser test clean frontend-install

help:
	@echo "Available commands:"
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
