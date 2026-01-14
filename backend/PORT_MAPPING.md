# Port Mapping for VentureUP Link

## Documentation Standards

**IMPORTANT RULE**: Minimize the creation of new markdown (MD) documentation files unless explicitly requested. All project documentation, instructions, and updates should be consolidated into existing documentation files rather than creating new ones. This rule applies to all development work and documentation practices across the entire application.

---

To avoid conflicts with other Docker containers, we're using the following port mappings:

## Development Ports

- **Web (Django)**: `8001` → Container `8000`
  - Access API at: http://localhost:8001
  - Access Admin at: http://localhost:8001/admin

- **PostgreSQL**: `5433` → Container `5432`
  - Connect from host: `localhost:5433`
  - Connect from containers: `db:5432`

- **Redis**: `6381` → Container `6379`
  - Connect from host: `localhost:6381`
  - Connect from containers: `redis:6379`

## Why These Ports?

- Port 8000 is used by: arcom-web-1, dymaw-backend-1, gearapp-web-1
- Port 5432 is used by: arcom-db-1, ck-mts-postgres, dymaw-db-1, gear-db-1, gearapp-db-1
- Port 6379 is used by: gearapp-redis-1

## Updating Frontend Configuration

When connecting from the frontend, update the API base URL to:
```
http://localhost:8001/api
```

## Database Connection (from host)

If you need to connect to the database from outside Docker:
```
Host: localhost
Port: 5433
Database: venturelink
User: postgres
Password: postgres
```

## Redis Connection (from host)

If you need to connect to Redis from outside Docker:
```
Host: localhost
Port: 6381
```
